const GESTION_HOJA_ORGANIZACION = "OrganizacionServidores";
const GESTION_HOJA_SERVICIOS = "ServiciosServidores";
const GESTION_HOJA_PERMISOS = "PermisosServidores";
const GESTION_HOJA_ASISTENCIA = "AsistenciaServidores";
const GESTION_HOJA_PROGRAMAS = "ProgramasAreaServidores";
const GESTION_HOJA_ACTIVIDADES_AREA = "ActividadesAreaServidores";
const GESTION_HOJA_NOTIFICACIONES_LEIDAS = "NotificacionesLeidasServidores";
const GESTION_LIMITE_PERMISOS = 6;
const GESTION_DIAS_PERMISO = 15;
const GESTION_PASTOR_APROBADOR_ID = "SERVIDOR-1000";
const GESTION_COORDINADORA_ROLES_ID = "SERVIDOR-0029";


function prepararGestionServidores() {
  obtenerHojaOrganizacionServidores_();
  obtenerHojaPermisosServidores_();
  obtenerHojaAsistenciaServidores_();
  obtenerHojaProgramasAreaServidores_();
  obtenerHojaActividadesAreaServidores_();
  obtenerHojaNotificacionesLeidasServidores_();
  obtenerHojaDispositivosPush_();
  obtenerHojaEnviosPush_();
  sincronizarServiciosUniformes_();
  asegurarAdministradorServidor_("SERVIDOR-0001");
  configurarResponsablesMinisterio2026_();
  cargarProgramaAudio2026();

  return {
    ok: true,
    mensaje: "La gestión de servidores está lista."
  };
}


function obtenerGestionServidor(token) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const servidorId = sesion.identidad.id;
  const perfil = obtenerPerfilGestionServidor_(servidorId);
  const personas = listarPersonasGestionServidor_();
  const personasPorId = indexarPersonasGestionServidor_(personas);
  const perfilesPorId = indexarPerfilesGestionServidor_(personas);
  const permisos = listarPermisosServidores_();
  const servicios = listarServiciosServidores_();
  const asistencias = listarAsistenciasServidores_();
  const notificaciones = listarNotificacionesGestionServidor_(
    servidorId,
    perfil,
    permisos,
    personasPorId,
    perfilesPorId
  );
  const programasServicio = listarProgramasAreaServidor_(
    servidorId,
    perfil,
    personasPorId,
    perfilesPorId
  );
  const puedeVerTodo = tieneRolGestionServidor_(perfil, "PASTOR") ||
    tieneRolGestionServidor_(perfil, "ADMINISTRADOR");
  const esCapitan = tieneRolGestionServidor_(perfil, "CAPITAN");
  const equipo = personas.filter(function(persona) {
    if (puedeVerTodo) {
      return true;
    }

    return esCapitan && perteneceAlEquipoGestionServidor_(
      persona.id,
      perfil,
      perfilesPorId[persona.id]
    );
  });
  const permisosPropios = permisos.filter(function(permiso) {
    return permiso.servidorId === servidorId;
  });
  const coberturas = permisos.filter(function(permiso) {
    return permiso.reemplazoId === servidorId &&
      permiso.estado !== "CANCELADO" &&
      permiso.estado !== "RECHAZADO";
  });
  const solicitudesAprobacion = permisos.filter(function(permiso) {
    if (tieneRolGestionServidor_(perfil, "ADMINISTRADOR") ||
        tieneRolGestionServidor_(perfil, "PASTOR")) {
      return permiso.estado !== "CANCELADO";
    }

    if (!esCapitan) {
      return false;
    }

    return perteneceAlEquipoGestionServidor_(
      permiso.servidorId,
      perfil,
      perfilesPorId[permiso.servidorId]
    ) && permiso.estado !== "CANCELADO";
  });

  return {
    ok: true,
    perfil: serializarPerfilGestionServidor_(perfil, asistencias, permisos),
    notificaciones: notificaciones,
    programasServicio: programasServicio,
    servicios: servicios,
    permisos: permisosPropios.map(function(permiso) {
      return enriquecerPermisoGestionServidor_(permiso, personasPorId);
    }),
    coberturas: coberturas.map(function(permiso) {
      return enriquecerPermisoGestionServidor_(permiso, personasPorId);
    }),
    solicitudesAprobacion: solicitudesAprobacion.map(function(permiso) {
      return enriquecerPermisoGestionServidor_(permiso, personasPorId);
    }),
    servidoresDisponibles: personas.map(function(persona) {
      const perfilPersona = perfilesPorId[persona.id];
      return {
        id: persona.id,
        nombre: persona.nombre,
        area: perfilPersona.area,
        activo: perfilPersona.activo
      };
    }).filter(function(persona) {
      return persona.activo && persona.id !== servidorId;
    }),
    equipo: equipo.map(function(persona) {
      const perfilPersona = perfilesPorId[persona.id];
      return {
        id: persona.id,
        nombre: persona.nombre,
        area: perfilPersona.area,
        roles: perfilPersona.roles,
        permisosUsados: contarPermisosUsadosGestionServidor_(persona.id, permisos),
        limitePermisos: GESTION_LIMITE_PERMISOS,
        faltasSinPermiso: contarFaltasSinPermisoGestionServidor_(persona.id, asistencias)
      };
    }),
    asistencias: asistencias.filter(function(asistencia) {
      return puedeVerTodo || equipo.some(function(persona) {
        return persona.id === asistencia.servidorId;
      });
    })
  };
}


function marcarNotificacionesServidor(token, notificacionIds) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const servidorId = sesion.identidad.id;
  const perfil = obtenerPerfilGestionServidor_(servidorId);
  const personas = listarPersonasGestionServidor_();
  const personasPorId = indexarPersonasGestionServidor_(personas);
  const perfilesPorId = indexarPerfilesGestionServidor_(personas);
  const disponibles = listarNotificacionesGestionServidor_(
    servidorId,
    perfil,
    listarPermisosServidores_(),
    personasPorId,
    perfilesPorId
  );
  const permitidas = {};
  disponibles.forEach(function(notificacion) {
    permitidas[notificacion.id] = true;
  });
  listarContenidoServidor_(servidorId)
    .filter(function(contenido) {
      return ["AVISO", "PREDICACION"].indexOf(contenido.tipo) >= 0;
    })
    .forEach(function(contenido) {
      permitidas[contenido.tipo + "_" + contenido.id] = true;
    });

  const ids = (Array.isArray(notificacionIds) ? notificacionIds : [notificacionIds])
    .map(function(id) {
      return String(id || "").trim().toUpperCase();
    })
    .filter(function(id, indice, todos) {
      return Boolean(id && permitidas[id] && todos.indexOf(id) === indice);
    });

  if (!ids.length) {
    return { ok: true, total: 0, mensaje: "No había notificaciones nuevas." };
  }

  const hoja = obtenerHojaNotificacionesLeidasServidores_();
  const filas = {};

  if (hoja.getLastRow() >= 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 2)
      .getDisplayValues()
      .forEach(function(fila, indice) {
        filas[normalizarIdServidor_(fila[0]) + "|" + String(fila[1] || "").trim().toUpperCase()] = indice + 2;
      });
  }

  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);

  try {
    ids.forEach(function(id) {
      const llave = servidorId + "|" + id;
      const valores = [[servidorId, id, new Date()]];

      if (filas[llave]) {
        hoja.getRange(filas[llave], 1, 1, 3).setValues(valores);
      } else {
        hoja.appendRow(valores[0]);
      }
    });
  } finally {
    bloqueo.releaseLock();
  }

  return {
    ok: true,
    total: ids.length,
    mensaje: ids.length === 1
      ? "Notificación marcada como leída."
      : "Notificaciones marcadas como leídas."
  };
}


function solicitarPermisoServidor(token, datos) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const entrada = datos || {};
  const tipo = normalizarTipoPermisoServidor_(entrada.tipo);
  const servicioId = String(entrada.servicioId || "").trim().toUpperCase();
  const motivo = String(entrada.motivo || "").trim();
  const comentario = String(entrada.comentario || "").trim();
  const reemplazoId = normalizarIdServidor_(entrada.reemplazoId);
  const servicio = listarServiciosServidores_().find(function(item) {
    return item.id === servicioId && item.activo;
  });

  if (!tipo) {
    throw new Error("Selecciona permiso normal o permiso por emergencia.");
  }

  if (!servicio) {
    throw new Error("Selecciona una fecha de servicio válida.");
  }

  if (motivo.length < 5) {
    throw new Error("Explica brevemente el motivo del permiso.");
  }

  if (!reemplazoId || reemplazoId === sesion.identidad.id) {
    throw new Error("Selecciona a otro servidor para cubrir tu área.");
  }

  if (!obtenerIdentidadServidor_(reemplazoId)) {
    throw new Error("El reemplazo seleccionado no existe.");
  }

  const permisos = listarPermisosServidores_();
  const permisosUsados = contarPermisosUsadosGestionServidor_(
    sesion.identidad.id,
    permisos
  );

  if (permisosUsados >= GESTION_LIMITE_PERMISOS) {
    throw new Error("Ya utilizaste los seis permisos disponibles de este año.");
  }
  const duplicado = permisos.some(function(permiso) {
    return permiso.servidorId === sesion.identidad.id &&
      permiso.servicioId === servicioId &&
      ["CANCELADO", "RECHAZADO"].indexOf(permiso.estado) < 0;
  });

  if (duplicado) {
    throw new Error("Ya tienes una solicitud para esa fecha.");
  }

  const choqueReemplazo = permisos.some(function(permiso) {
    return permiso.reemplazoId === reemplazoId &&
      permiso.servicioId === servicioId &&
      permiso.coberturaEstado === "ACEPTADA" &&
      permiso.estado !== "CANCELADO";
  });

  if (choqueReemplazo) {
    throw new Error("Ese servidor ya aceptó otra cobertura para la fecha.");
  }

  const perfil = obtenerPerfilGestionServidor_(sesion.identidad.id);
  const dias = calcularDiasAnticipacionGestionServidor_(servicio.fecha);
  const fueraPlazo = tipo === "NORMAL" && dias < GESTION_DIAS_PERMISO;
  const ahora = new Date();
  const permisoId = "PERM-" + Utilities.getUuid().slice(0, 8).toUpperCase();
  const fila = [
    permisoId,
    sesion.identidad.id,
    tipo,
    servicio.id,
    servicio.fecha,
    motivo,
    comentario,
    reemplazoId,
    dias,
    fueraPlazo ? "SI" : "NO",
    "PENDIENTE",
    perfil.capitanId,
    "PENDIENTE",
    "",
    "PENDIENTE",
    "PENDIENTE",
    ahora,
    ahora
  ];

  obtenerHojaPermisosServidores_().appendRow(fila);

  enviarPushServidoresSeguro_([
    perfil.capitanId,
    GESTION_PASTOR_APROBADOR_ID,
    reemplazoId
  ], {
    id: "PERMISO_" + permisoId,
    titulo: "Nueva solicitud de permiso",
    descripcion: sesion.identidad.nombre + " solicita permiso para el " + servicio.fecha + ".",
    destino: "notificacionesServidor"
  });

  return {
    ok: true,
    permisoId: permisoId,
    fueraPlazo: fueraPlazo,
    mensaje: fueraPlazo
      ? "Solicitud enviada fuera del plazo recomendado de 15 días."
      : "Solicitud enviada al capitán, pastor y reemplazo."
  };
}


function responderCoberturaServidor(token, permisoId, respuesta) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const permiso = buscarPermisoGestionServidor_(permisoId);
  const decision = String(respuesta || "").trim().toUpperCase();

  if (!permiso || permiso.reemplazoId !== sesion.identidad.id) {
    throw new Error("No puedes responder esta cobertura.");
  }

  if (["ACEPTAR", "RECHAZAR"].indexOf(decision) < 0) {
    throw new Error("Respuesta de cobertura no válida.");
  }

  const coberturaEstado = decision === "ACEPTAR" ? "ACEPTADA" : "RECHAZADA";
  actualizarPermisoGestionServidor_(permiso, {
    coberturaEstado: coberturaEstado
  });

  return {
    ok: true,
    coberturaEstado: coberturaEstado,
    mensaje: coberturaEstado === "ACEPTADA"
      ? "Cobertura aceptada. Aparecerá en tu pantalla principal."
      : "Cobertura rechazada. Se notificará al solicitante y al capitán."
  };
}


function resolverPermisoServidor(token, permisoId, decision, aprobador) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const permiso = buscarPermisoGestionServidor_(permisoId);
  const perfilActor = obtenerPerfilGestionServidor_(sesion.identidad.id);
  const accion = String(decision || "").trim().toUpperCase();
  let tipoAprobador = String(aprobador || "").trim().toUpperCase();

  if (!permiso) {
    throw new Error("La solicitud ya no está disponible.");
  }

  if (["APROBAR", "RECHAZAR"].indexOf(accion) < 0) {
    throw new Error("Decisión no válida.");
  }

  if (tieneRolGestionServidor_(perfilActor, "ADMINISTRADOR") &&
      ["CAPITAN", "PASTOR"].indexOf(tipoAprobador) < 0) {
    tipoAprobador = "PASTOR";
  }

  if (tipoAprobador === "CAPITAN") {
    const perfilSolicitante = obtenerPerfilGestionServidor_(permiso.servidorId);
    const autorizado = tieneRolGestionServidor_(perfilActor, "ADMINISTRADOR") ||
      (tieneRolGestionServidor_(perfilActor, "CAPITAN") &&
       perteneceAlEquipoGestionServidor_(
         permiso.servidorId,
         perfilActor,
         perfilSolicitante
       ));

    if (!autorizado) {
      throw new Error("Sólo el capitán del área puede realizar esta aprobación.");
    }

    actualizarPermisoGestionServidor_(permiso, {
      capitanEstado: accion === "APROBAR" ? "APROBADO" : "RECHAZADO",
      capitanId: sesion.identidad.id
    });
  } else if (tipoAprobador === "PASTOR") {
    const puedeActivar = sesion.identidad.id === GESTION_PASTOR_APROBADOR_ID &&
      tieneRolGestionServidor_(perfilActor, "APROBADOR_PERMISOS");

    if (!puedeActivar) {
      throw new Error("Sólo Arsenio Ramirez puede realizar la autorización pastoral.");
    }

    if (accion === "APROBAR" &&
        contarPermisosUsadosGestionServidor_(
          permiso.servidorId,
          listarPermisosServidores_()
        ) >= GESTION_LIMITE_PERMISOS) {
      throw new Error("El servidor ya utilizó sus seis permisos de este año.");
    }

    actualizarPermisoGestionServidor_(permiso, {
      pastorEstado: accion === "APROBAR" ? "APROBADO" : "RECHAZADO",
      pastorId: sesion.identidad.id
    });
  } else {
    throw new Error("Selecciona la aprobación de capitán o pastor.");
  }

  return {
    ok: true,
    mensaje: accion === "APROBAR" ? "Permiso aprobado." : "Permiso rechazado."
  };
}


function cancelarPermisoServidor(token, permisoId) {
  const sesion = resolverSesionServidor_(token);
  const permiso = buscarPermisoGestionServidor_(permisoId);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  if (!permiso || permiso.servidorId !== sesion.identidad.id) {
    throw new Error("No puedes cancelar esta solicitud.");
  }

  actualizarPermisoGestionServidor_(permiso, { estadoForzado: "CANCELADO" });

  return { ok: true, mensaje: "Solicitud cancelada." };
}


function guardarListaAsistenciaServidor(token, servicioId, registros) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const perfilActor = obtenerPerfilGestionServidor_(sesion.identidad.id);
  const puedeRegistrar = tieneRolGestionServidor_(perfilActor, "CAPITAN") ||
    tieneRolGestionServidor_(perfilActor, "ADMINISTRADOR");

  if (!puedeRegistrar) {
    throw new Error("No tienes permiso para pasar lista.");
  }

  const servicio = listarServiciosServidores_().find(function(item) {
    return item.id === String(servicioId || "").trim().toUpperCase();
  });

  if (!servicio) {
    throw new Error("Servicio no válido.");
  }

  const entradas = Array.isArray(registros) ? registros : [];

  if (!entradas.length) {
    throw new Error("Selecciona la asistencia del equipo.");
  }

  const permisos = listarPermisosServidores_();
  const hoja = obtenerHojaAsistenciaServidores_();
  const ahora = new Date();

  entradas.forEach(function(entrada) {
    const servidorId = normalizarIdServidor_(entrada.servidorId);
    const perfilServidor = obtenerPerfilGestionServidor_(servidorId);
    const autorizado = tieneRolGestionServidor_(perfilActor, "ADMINISTRADOR") ||
      perteneceAlEquipoGestionServidor_(servidorId, perfilActor, perfilServidor);

    if (!autorizado || !obtenerIdentidadServidor_(servidorId)) {
      return;
    }

    const asistio = entrada.asistio === true ||
      String(entrada.asistio).toUpperCase() === "SI";
    const permiso = permisos.find(function(item) {
      return item.servidorId === servidorId &&
        item.servicioId === servicio.id &&
        (item.estado === "AUTORIZADO" ||
         item.estado === "EMERGENCIA_AUTORIZADA");
    });
    const estado = asistio
      ? "ASISTIO"
      : permiso
        ? (permiso.tipo === "EMERGENCIA" ? "EMERGENCIA" : "PERMISO")
        : "FALTA_SIN_PERMISO";
    const filaExistente = buscarFilaAsistenciaGestionServidor_(
      hoja,
      servicio.id,
      servidorId
    );
    const valores = [[
      servicio.id,
      servicio.fecha,
      servidorId,
      perfilServidor.area,
      estado,
      sesion.identidad.id,
      ahora
    ]];

    if (filaExistente) {
      hoja.getRange(filaExistente, 1, 1, 7).setValues(valores);
    } else {
      hoja.appendRow(valores[0]);
    }
  });

  return { ok: true, mensaje: "Lista de asistencia guardada." };
}


function publicarAvisoAreaServidor(token, datos) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const perfil = obtenerPerfilGestionServidor_(sesion.identidad.id);
  const autorizado = tieneRolGestionServidor_(perfil, "CAPITAN") ||
    tieneRolGestionServidor_(perfil, "PASTOR") ||
    tieneRolGestionServidor_(perfil, "ADMINISTRADOR");

  if (!autorizado) {
    throw new Error("No tienes permiso para publicar avisos.");
  }

  const entrada = datos || {};
  const titulo = String(entrada.titulo || "").trim();
  const descripcion = String(entrada.descripcion || "").trim();

  if (titulo.length < 3 || descripcion.length < 5) {
    throw new Error("Escribe un título y el contenido del aviso.");
  }

  const personas = listarPersonasGestionServidor_();
  const destinatarios = personas.filter(function(persona) {
    if (tieneRolGestionServidor_(perfil, "PASTOR") ||
        tieneRolGestionServidor_(perfil, "ADMINISTRADOR")) {
      return true;
    }

    return perteneceAlEquipoGestionServidor_(
      persona.id,
      perfil,
      obtenerPerfilGestionServidor_(persona.id)
    );
  }).map(function(persona) {
    return persona.id;
  });

  if (!destinatarios.length) {
    throw new Error("El área todavía no tiene integrantes asignados.");
  }

  const avisoId = "AVISO-" + Utilities.getUuid().slice(0, 8).toUpperCase();
  obtenerHojaContenidoServidores_().appendRow([
    avisoId,
    "AVISO",
    titulo,
    descripcion,
    formatearFechaContenidoServidor_(entrada.fecha),
    "",
    destinatarios.join(","),
    "SI",
    new Date(),
    "",
    ""
  ]);

  enviarPushServidoresSeguro_(destinatarios, {
    id: "AVISO_" + avisoId,
    titulo: "Nuevo aviso",
    descripcion: titulo,
    destino: "avisosServidor"
  });
  marcarPushContenidoEnviado_(avisoId, "AVISO", destinatarios.length);

  return { ok: true, mensaje: "Aviso publicado." };
}


function listarNotificacionesGestionServidor_(
  servidorId,
  perfil,
  permisos,
  personasPorId,
  perfilesPorId
) {
  const leidas = listarNotificacionesLeidasServidor_(servidorId);
  const notificaciones = [];
  const esCapitan = tieneRolGestionServidor_(perfil, "CAPITAN");
  const puedeVerSolicitudes = servidorId === GESTION_PASTOR_APROBADOR_ID &&
    tieneRolGestionServidor_(perfil, "APROBADOR_PERMISOS");

  permisos.forEach(function(permiso) {
    const solicitante = personasPorId[permiso.servidorId];
    const perfilSolicitante = perfilesPorId[permiso.servidorId];
    const perteneceAlEquipo = esCapitan && perfilSolicitante &&
      perteneceAlEquipoGestionServidor_(permiso.servidorId, perfil, perfilSolicitante);
    const solicitudActiva = ["CANCELADO", "RECHAZADO"].indexOf(permiso.estado) < 0;
    const debeRevisar = solicitudActiva &&
      (puedeVerSolicitudes || perteneceAlEquipo) &&
      (
        (perteneceAlEquipo && permiso.capitanEstado === "PENDIENTE") ||
        (puedeVerSolicitudes && permiso.pastorEstado === "PENDIENTE")
      );

    if (debeRevisar) {
      agregarNotificacionGestionServidor_(notificaciones, leidas, {
        id: "PERMISO_REVISION_" + permiso.id,
        tipo: "PERMISO",
        titulo: "Nueva solicitud de permiso",
        descripcion: (solicitante ? solicitante.nombre : permiso.servidorId) +
          " solicita permiso para el " + permiso.fechaServicio + ".",
        fecha: permiso.creado,
        destino: "gestionEquipoServidor"
      });
    }

    if (solicitudActiva &&
        permiso.reemplazoId === servidorId &&
        permiso.coberturaEstado === "PENDIENTE") {
      agregarNotificacionGestionServidor_(notificaciones, leidas, {
        id: "COBERTURA_" + permiso.id,
        tipo: "COBERTURA",
        titulo: "Solicitud de cobertura",
        descripcion: (solicitante ? solicitante.nombre : permiso.servidorId) +
          " te propone cubrir su área el " + permiso.fechaServicio + ".",
        fecha: permiso.creado,
        destino: "coberturasServidor"
      });
    }
  });

  listarContenidoServidor_(servidorId)
    .filter(function(contenido) {
      return ["AVISO", "PREDICACION"].indexOf(contenido.tipo) >= 0;
    })
    .forEach(function(contenido) {
      const esPredicacion = contenido.tipo === "PREDICACION";
      agregarNotificacionGestionServidor_(notificaciones, leidas, {
        id: contenido.tipo + "_" + contenido.id,
        tipo: contenido.tipo,
        titulo: esPredicacion ? "Nueva predicación" : "Nuevo aviso",
        descripcion: contenido.titulo,
        fecha: fechaHoraGestionServidor_(contenido.publicado) || contenido.fecha,
        destino: esPredicacion ? "predicacionesServidor" : "avisosServidor"
      });
    });

  return notificaciones.sort(function(a, b) {
    if (a.leida !== b.leida) {
      return a.leida ? 1 : -1;
    }

    return String(b.fecha || "").localeCompare(String(a.fecha || ""));
  });
}


function agregarNotificacionGestionServidor_(lista, leidas, datos) {
  const id = String(datos.id || "").trim().toUpperCase();

  if (!id) {
    return;
  }

  lista.push({
    id: id,
    tipo: datos.tipo,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    fecha: datos.fecha,
    destino: datos.destino,
    leida: Boolean(leidas[id])
  });
}


function listarNotificacionesLeidasServidor_(servidorId) {
  const hoja = obtenerHojaNotificacionesLeidasServidores_();
  const leidas = {};

  if (hoja.getLastRow() < 2) {
    return leidas;
  }

  hoja.getRange(2, 1, hoja.getLastRow() - 1, 3)
    .getValues()
    .forEach(function(fila) {
      if (normalizarIdServidor_(fila[0]) === servidorId) {
        leidas[String(fila[1] || "").trim().toUpperCase()] = true;
      }
    });

  return leidas;
}


function actualizarOrganizacionServidor(token, datos) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const perfilActor = obtenerPerfilGestionServidor_(sesion.identidad.id);

  if (!tieneRolGestionServidor_(perfilActor, "ADMINISTRADOR")) {
    throw new Error("Sólo el administrador puede cambiar roles y áreas.");
  }

  const entrada = datos || {};
  const servidorId = normalizarIdServidor_(entrada.servidorId);
  const roles = normalizarRolesGestionServidor_(entrada.roles);
  const area = String(entrada.area || "").trim();
  const capitanId = normalizarIdServidor_(entrada.capitanId);
  const activo = entrada.activo === false ? "NO" : "SI";

  if (!obtenerIdentidadServidor_(servidorId)) {
    throw new Error("El servidor seleccionado no existe.");
  }

  const hoja = obtenerHojaOrganizacionServidores_();
  const fila = buscarFilaPorIdGestionServidor_(hoja, servidorId);
  const valores = [[
    servidorId,
    roles.join(","),
    area,
    capitanId,
    activo,
    new Date()
  ]];

  if (fila) {
    hoja.getRange(fila, 1, 1, 6).setValues(valores);
  } else {
    hoja.appendRow(valores[0]);
  }

  return { ok: true, mensaje: "Perfil actualizado." };
}


function obtenerHojaOrganizacionServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_ORGANIZACION, [
    "SERVIDOR_ID",
    "ROLES",
    "AREA",
    "CAPITAN_ID",
    "ACTIVO",
    "ACTUALIZADO"
  ]);
}


function obtenerHojaServiciosServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_SERVICIOS, [
    "ID",
    "FECHA",
    "TITULO",
    "HORA",
    "ACTIVO",
    "ACTUALIZADO"
  ]);
}


function obtenerHojaPermisosServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_PERMISOS, [
    "ID",
    "SERVIDOR_ID",
    "TIPO",
    "SERVICIO_ID",
    "FECHA_SERVICIO",
    "MOTIVO",
    "COMENTARIO",
    "REEMPLAZO_ID",
    "DIAS_ANTICIPACION",
    "FUERA_PLAZO",
    "CAPITAN_ESTADO",
    "CAPITAN_ID",
    "PASTOR_ESTADO",
    "PASTOR_ID",
    "COBERTURA_ESTADO",
    "ESTADO",
    "CREADO",
    "ACTUALIZADO"
  ]);
}


function obtenerHojaAsistenciaServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_ASISTENCIA, [
    "SERVICIO_ID",
    "FECHA",
    "SERVIDOR_ID",
    "AREA",
    "ESTADO",
    "REGISTRADO_POR",
    "ACTUALIZADO"
  ]);
}


function obtenerHojaProgramasAreaServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_PROGRAMAS, [
    "ID",
    "AREA",
    "TITULO",
    "PERIODO_INICIO",
    "PERIODO_FIN",
    "ELABORADO_POR",
    "VERSION",
    "ESTADO",
    "DOCUMENTO_REFERENCIA",
    "PUBLICADO"
  ]);
}


function obtenerHojaActividadesAreaServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_ACTIVIDADES_AREA, [
    "ID",
    "PROGRAMA_ID",
    "MES",
    "ORDEN",
    "HORARIO",
    "TITULO",
    "DESCRIPCION",
    "ASIGNADOS",
    "SUPERVISOR_ID",
    "TIPO_ASIGNACION",
    "ACTIVO"
  ]);
}


function obtenerHojaNotificacionesLeidasServidores_() {
  return obtenerHojaGestionServidor_(GESTION_HOJA_NOTIFICACIONES_LEIDAS, [
    "SERVIDOR_ID",
    "NOTIFICACION_ID",
    "FECHA_LECTURA"
  ]);
}


function cargarConfiguracionMinisterio2026() {
  const responsables = configurarResponsablesMinisterio2026_();
  const audio = cargarProgramaAudio2026();

  return {
    ok: true,
    responsables: responsables,
    programa: audio,
    mensaje: "Responsables y programa de Audio configurados."
  };
}


function configurarResponsablesMinisterio2026_() {
  const configuraciones = [
    {
      id: "SERVIDOR-0001",
      roles: ["SERVIDOR", "ADMINISTRADOR"],
      area: "Audio",
      capitanId: "SERVIDOR-0036"
    },
    {
      id: "SERVIDOR-0036",
      roles: ["SERVIDOR", "CAPITAN"],
      area: "Audio",
      capitanId: "SERVIDOR-0036"
    },
    {
      id: GESTION_COORDINADORA_ROLES_ID,
      roles: ["SERVIDOR", "PASTOR", "COORDINADOR_ROLES"]
    },
    {
      id: GESTION_PASTOR_APROBADOR_ID,
      roles: ["SERVIDOR", "PASTOR", "APROBADOR_PERMISOS"]
    }
  ];

  return configuraciones.map(function(configuracion) {
    return asegurarPerfilMinisterioServidor_(configuracion);
  });
}


function asegurarPerfilMinisterioServidor_(configuracion) {
  const id = normalizarIdServidor_(configuracion.id);

  if (!obtenerIdentidadServidor_(id)) {
    return { id: id, configurado: false, motivo: "No existe en Servidores" };
  }

  const hoja = obtenerHojaOrganizacionServidores_();
  const fila = buscarFilaPorIdGestionServidor_(hoja, id);
  const actual = fila
    ? hoja.getRange(fila, 1, 1, 6).getValues()[0]
    : [id, "SERVIDOR", "", "", "SI", new Date()];
  const roles = normalizarRolesGestionServidor_(
    normalizarRolesGestionServidor_(actual[1]).concat(configuracion.roles || [])
  );

  actual[0] = id;
  actual[1] = roles.join(",");
  actual[2] = configuracion.area !== undefined
    ? configuracion.area
    : String(actual[2] || "").trim();
  actual[3] = configuracion.capitanId !== undefined
    ? normalizarIdServidor_(configuracion.capitanId)
    : normalizarIdServidor_(actual[3]);
  actual[4] = "SI";
  actual[5] = new Date();

  if (fila) {
    hoja.getRange(fila, 1, 1, 6).setValues([actual]);
  } else {
    hoja.appendRow(actual);
  }

  return { id: id, configurado: true, roles: roles };
}


function cargarProgramaAudio2026() {
  const programaId = "PROGRAMA-AUDIO-2026-09-12";
  const hojaProgramas = obtenerHojaProgramasAreaServidores_();
  const hojaActividades = obtenerHojaActividadesAreaServidores_();
  const ahora = new Date();
  const programa = [
    programaId,
    "Audio",
    "Programa de servicio de Audio",
    "2026-09-01",
    "2026-12-31",
    GESTION_COORDINADORA_ROLES_ID,
    1,
    "PUBLICADO",
    "Programa de servicio Audio septiembre-diciembre 2026",
    ahora
  ];

  guardarFilaPorIdGestionServidor_(hojaProgramas, programa);

  const rafael = "SERVIDOR-0001";
  const emmanuel = "SERVIDOR-0036";
  const meses = ["2026-09", "2026-10", "2026-11", "2026-12"];
  const alternaRafael = [rafael, emmanuel, rafael, emmanuel];
  const alternaEmmanuel = [emmanuel, rafael, emmanuel, rafael];
  const actividades = [];

  meses.forEach(function(mes, indice) {
    const datos = [
      [1, "2:00 p. m.", "Aseo de cabina", "Limpiar cabina por dentro y por fuera, barrer y trapear el área, y colocar las sillas necesarias.", alternaRafael[indice], "", "RESPONSABLE"],
      [2, "2:00 p. m.", "Bajar equipo de la oficina", "Bajar de la oficina todas las cajas de equipo necesarias para el servicio.", alternaEmmanuel[indice], "", "RESPONSABLE"],
      [3, "2:00 p. m.", "Auditorio menor: instalación y ecualización", "Instalar, ecualizar y probar consolas, cables, instrumentos, micrófonos y monitores. Resguardar el equipo ordenadamente.", rafael, emmanuel, "SUPERVISADO"],
      [4, "3:00 p. m.", "Ministración", "Compartir la palabra y enviar previamente el mensaje al equipo de oración.", alternaEmmanuel[indice], "", "RESPONSABLE"],
      [5, "3:00 p. m.", "Oración", "Orar por las necesidades particulares de los integrantes y por el servicio.", alternaRafael[indice], "", "RESPONSABLE"],
      [6, "4:00 p. m.", "Mezzanine: instalación y ecualización", "Instalar y ecualizar el equipo inmediatamente después de la salida de las panderistas; desmontar y resguardar al finalizar.", rafael, emmanuel, "SUPERVISADO"],
      [7, "4:00 p. m.", "Instalación de mobiliario", "Instalar mesas, sillas y el micrófono del predicador; recoger y ordenar el inmueble al finalizar.", alternaRafael[indice], "", "RESPONSABLE"],
      [8, "4:00–8:00 p. m.", "Audio y video", "Montar y desmontar el audio con el equipo de video, revisar y probar antes de las 5:00 p. m., y monitorear salida y volumen.", rafael, emmanuel, "SUPERVISADO"],
      [9, "Al finalizar", "Orden y aseo de utensilios", "Cada servidor es responsable del orden, limpieza y resguardo de sus utensilios y herramientas.", rafael + "," + emmanuel, "", "EQUIPO"]
    ];

    datos.forEach(function(item) {
      const id = "AUDIO-" + mes + "-" + String(item[0]).padStart(2, "0");
      actividades.push([
        id,
        programaId,
        mes,
        item[0],
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        item[6],
        "SI"
      ]);
    });
  });

  actividades.forEach(function(actividad) {
    guardarFilaPorIdGestionServidor_(hojaActividades, actividad);
  });

  return {
    ok: true,
    programaId: programaId,
    actividades: actividades.length,
    mensaje: "El programa de Audio septiembre-diciembre 2026 quedó publicado."
  };
}


function guardarFilaPorIdGestionServidor_(hoja, valores) {
  const fila = buscarFilaPorIdGestionServidor_(hoja, valores[0]);

  if (fila) {
    hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
  } else {
    hoja.appendRow(valores);
  }
}


function obtenerHojaGestionServidor_(nombre, encabezados) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);

  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
  }

  return hoja;
}


function sincronizarServiciosUniformes_() {
  const hoja = obtenerHojaServiciosServidores_();
  const existentes = {};

  if (hoja.getLastRow() >= 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 1)
      .getDisplayValues()
      .forEach(function(fila, indice) {
        existentes[String(fila[0]).trim().toUpperCase()] = indice + 2;
      });
  }

  listarContenidoServidor_("*")
    .filter(function(item) {
      return item.tipo === "UNIFORME" && item.fecha;
    })
    .forEach(function(item) {
      const id = "SERVICIO-" + item.fecha;

      if (!existentes[id]) {
        hoja.appendRow([
          id,
          item.fecha,
          "Servicio Iglesia Juvenil",
          "",
          "SI",
          new Date()
        ]);
        existentes[id] = hoja.getLastRow();
      }
    });

  return hoja;
}


function listarServiciosServidores_() {
  const hoja = obtenerHojaServiciosServidores_();

  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 6)
    .getValues()
    .map(function(fila) {
      return {
        id: String(fila[0] || "").trim().toUpperCase(),
        fecha: fechaGestionServidor_(fila[1]),
        titulo: String(fila[2] || "Servicio").trim(),
        hora: String(fila[3] || "").trim(),
        activo: valorActivoServidor_(fila[4])
      };
    })
    .filter(function(item) {
      return item.id && item.fecha;
    })
    .sort(function(a, b) {
      return a.fecha.localeCompare(b.fecha);
    });
}


function listarProgramasAreaServidor_(servidorId, perfil, personasPorId, perfilesPorId) {
  const hojaProgramas = obtenerHojaProgramasAreaServidores_();
  const hojaActividades = obtenerHojaActividadesAreaServidores_();

  if (hojaProgramas.getLastRow() < 2) {
    return [];
  }

  const programas = hojaProgramas
    .getRange(2, 1, hojaProgramas.getLastRow() - 1, 10)
    .getValues()
    .map(function(fila) {
      return {
        id: String(fila[0] || "").trim().toUpperCase(),
        area: String(fila[1] || "").trim(),
        titulo: String(fila[2] || "Programa de servicio").trim(),
        periodoInicio: fechaGestionServidor_(fila[3]),
        periodoFin: fechaGestionServidor_(fila[4]),
        elaboradoPor: normalizarIdServidor_(fila[5]),
        version: Number(fila[6] || 1),
        estado: String(fila[7] || "BORRADOR").trim().toUpperCase(),
        documentoReferencia: String(fila[8] || "").trim(),
        publicado: fechaHoraGestionServidor_(fila[9])
      };
    })
    .filter(function(programa) {
      return programa.id && programa.estado === "PUBLICADO";
    });
  const actividades = hojaActividades.getLastRow() < 2
    ? []
    : hojaActividades
      .getRange(2, 1, hojaActividades.getLastRow() - 1, 11)
      .getValues()
      .map(function(fila) {
        const asignados = String(fila[7] || "")
          .split(",")
          .map(normalizarIdServidor_)
          .filter(Boolean);

        return {
          id: String(fila[0] || "").trim().toUpperCase(),
          programaId: String(fila[1] || "").trim().toUpperCase(),
          mes: mesGestionServidor_(fila[2]),
          orden: Number(fila[3] || 0),
          horario: String(fila[4] || "").trim(),
          titulo: String(fila[5] || "").trim(),
          descripcion: String(fila[6] || "").trim(),
          asignados: asignados,
          supervisorId: normalizarIdServidor_(fila[8]),
          tipoAsignacion: String(fila[9] || "RESPONSABLE").trim().toUpperCase(),
          activo: valorActivoServidor_(fila[10])
        };
      })
      .filter(function(actividad) {
        return actividad.id && actividad.programaId && actividad.activo;
      });
  const accesoGlobal = tieneRolGestionServidor_(perfil, "PASTOR") ||
    tieneRolGestionServidor_(perfil, "ADMINISTRADOR") ||
    tieneRolGestionServidor_(perfil, "COORDINADOR_ROLES");

  return programas.filter(function(programa) {
    const tareasPrograma = actividades.filter(function(actividad) {
      return actividad.programaId === programa.id;
    });
    const perteneceArea = perfil.area && programa.area &&
      perfil.area.toUpperCase() === programa.area.toUpperCase();
    const estaAsignado = tareasPrograma.some(function(actividad) {
      return actividad.asignados.indexOf(servidorId) >= 0 ||
        actividad.supervisorId === servidorId;
    });

    return accesoGlobal || perteneceArea || estaAsignado;
  }).map(function(programa) {
    const tareas = actividades.filter(function(actividad) {
      return actividad.programaId === programa.id;
    }).sort(function(a, b) {
      if (a.mes !== b.mes) return a.mes.localeCompare(b.mes);
      return a.orden - b.orden;
    }).map(function(actividad) {
      return {
        id: actividad.id,
        mes: actividad.mes,
        orden: actividad.orden,
        horario: actividad.horario,
        titulo: actividad.titulo,
        descripcion: actividad.descripcion,
        asignados: actividad.asignados.map(function(id) {
          return {
            id: id,
            nombre: personasPorId[id] ? personasPorId[id].nombre : id
          };
        }),
        supervisor: actividad.supervisorId
          ? {
              id: actividad.supervisorId,
              nombre: personasPorId[actividad.supervisorId]
                ? personasPorId[actividad.supervisorId].nombre
                : actividad.supervisorId
            }
          : null,
        tipoAsignacion: actividad.tipoAsignacion,
        meCorresponde: actividad.asignados.indexOf(servidorId) >= 0,
        superviso: actividad.supervisorId === servidorId
      };
    });
    const equipo = Object.keys(perfilesPorId).filter(function(id) {
      const perfilPersona = perfilesPorId[id];
      return perfilPersona.area && programa.area &&
        perfilPersona.area.toUpperCase() === programa.area.toUpperCase();
    }).map(function(id) {
      return {
        id: id,
        nombre: personasPorId[id] ? personasPorId[id].nombre : id,
        roles: perfilesPorId[id].roles
      };
    });

    return {
      id: programa.id,
      area: programa.area,
      titulo: programa.titulo,
      periodoInicio: programa.periodoInicio,
      periodoFin: programa.periodoFin,
      elaboradoPor: programa.elaboradoPor,
      elaboradoPorNombre: personasPorId[programa.elaboradoPor]
        ? personasPorId[programa.elaboradoPor].nombre
        : programa.elaboradoPor,
      version: programa.version,
      estado: programa.estado,
      documentoReferencia: programa.documentoReferencia,
      publicado: programa.publicado,
      equipo: equipo,
      actividades: tareas
    };
  });
}


function listarPersonasGestionServidor_() {
  const resultado = listarAsistentes(SERVIDORES_EVENTO);
  const lista = resultado && Array.isArray(resultado.asistentes)
    ? resultado.asistentes
    : Array.isArray(resultado)
      ? resultado
      : [];

  return lista.map(function(persona) {
    return {
      id: normalizarIdServidor_(persona.id),
      nombre: String(persona.nombre || "").trim()
    };
  }).filter(function(persona) {
    return persona.id && persona.nombre;
  });
}


function indexarPersonasGestionServidor_(personas) {
  const indice = {};

  personas.forEach(function(persona) {
    indice[persona.id] = persona;
  });

  return indice;
}


function indexarPerfilesGestionServidor_(personas) {
  const perfiles = {};
  const hoja = obtenerHojaOrganizacionServidores_();
  const configurados = {};

  if (hoja.getLastRow() >= 2) {
    hoja.getRange(2, 1, hoja.getLastRow() - 1, 6)
      .getValues()
      .forEach(function(fila) {
        const id = normalizarIdServidor_(fila[0]);

        if (id) {
          configurados[id] = {
            servidorId: id,
            roles: normalizarRolesGestionServidor_(fila[1]),
            area: String(fila[2] || "").trim(),
            capitanId: normalizarIdServidor_(fila[3]),
            activo: valorActivoServidor_(fila[4])
          };
        }
      });
  }

  personas.forEach(function(persona) {
    perfiles[persona.id] = configurados[persona.id] || {
      servidorId: persona.id,
      roles: ["SERVIDOR"],
      area: "",
      capitanId: "",
      activo: true
    };
  });

  return perfiles;
}


function obtenerPerfilGestionServidor_(servidorId) {
  const id = normalizarIdServidor_(servidorId);
  const hoja = obtenerHojaOrganizacionServidores_();
  const fila = buscarFilaPorIdGestionServidor_(hoja, id);

  if (!fila) {
    return {
      servidorId: id,
      roles: ["SERVIDOR"],
      area: "",
      capitanId: "",
      activo: true
    };
  }

  const valores = hoja.getRange(fila, 1, 1, 6).getValues()[0];

  return {
    servidorId: id,
    roles: normalizarRolesGestionServidor_(valores[1]),
    area: String(valores[2] || "").trim(),
    capitanId: normalizarIdServidor_(valores[3]),
    activo: valorActivoServidor_(valores[4])
  };
}


function asegurarAdministradorServidor_(servidorId) {
  const id = normalizarIdServidor_(servidorId);

  if (!obtenerIdentidadServidor_(id)) {
    return;
  }

  const hoja = obtenerHojaOrganizacionServidores_();
  const fila = buscarFilaPorIdGestionServidor_(hoja, id);
  const valores = [[
    id,
    "SERVIDOR,ADMINISTRADOR",
    "",
    "",
    "SI",
    new Date()
  ]];

  if (fila) {
    const actual = hoja.getRange(fila, 1, 1, 6).getValues()[0];
    const roles = normalizarRolesGestionServidor_(actual[1]);

    if (roles.indexOf("ADMINISTRADOR") < 0) {
      roles.push("ADMINISTRADOR");
      actual[1] = roles.join(",");
      actual[5] = new Date();
      hoja.getRange(fila, 1, 1, 6).setValues([actual]);
    }
  } else {
    hoja.appendRow(valores[0]);
  }
}


function normalizarRolesGestionServidor_(roles) {
  const permitidos = [
    "SERVIDOR",
    "CAPITAN",
    "PASTOR",
    "COORDINADOR_ROLES",
    "APROBADOR_PERMISOS",
    "ADMINISTRADOR"
  ];
  const valores = Array.isArray(roles) ? roles : String(roles || "SERVIDOR").split(",");
  const normalizados = valores.map(function(rol) {
    return String(rol || "").trim().toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }).filter(function(rol, indice, lista) {
    return permitidos.indexOf(rol) >= 0 && lista.indexOf(rol) === indice;
  });

  return normalizados.length ? normalizados : ["SERVIDOR"];
}


function tieneRolGestionServidor_(perfil, rol) {
  return perfil.roles.indexOf(rol) >= 0;
}


function perteneceAlEquipoGestionServidor_(servidorId, perfilCapitan, perfilServidor) {
  if (perfilServidor.capitanId === perfilCapitan.servidorId) {
    return true;
  }

  return Boolean(
    perfilCapitan.area &&
    perfilServidor.area &&
    perfilCapitan.area.toUpperCase() === perfilServidor.area.toUpperCase()
  );
}


function serializarPerfilGestionServidor_(perfil, asistencias, permisos) {
  return {
    servidorId: perfil.servidorId,
    roles: perfil.roles,
    area: perfil.area,
    capitanId: perfil.capitanId,
    activo: perfil.activo,
    permisosUsados: contarPermisosUsadosGestionServidor_(perfil.servidorId, permisos),
    limitePermisos: GESTION_LIMITE_PERMISOS,
    faltasSinPermiso: contarFaltasSinPermisoGestionServidor_(perfil.servidorId, asistencias),
    puedeAprobarPermisos: perfil.servidorId === GESTION_PASTOR_APROBADOR_ID &&
      tieneRolGestionServidor_(perfil, "APROBADOR_PERMISOS"),
    puedeGestionarRoles: tieneRolGestionServidor_(perfil, "COORDINADOR_ROLES") ||
      tieneRolGestionServidor_(perfil, "ADMINISTRADOR")
  };
}


function listarPermisosServidores_() {
  const hoja = obtenerHojaPermisosServidores_();

  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 18)
    .getValues()
    .map(function(fila, indice) {
      return mapearPermisoGestionServidor_(fila, indice + 2);
    })
    .filter(function(permiso) {
      return permiso.id && permiso.servidorId;
    });
}


function mapearPermisoGestionServidor_(fila, numeroFila) {
  return {
    fila: numeroFila,
    id: String(fila[0] || "").trim().toUpperCase(),
    servidorId: normalizarIdServidor_(fila[1]),
    tipo: normalizarTipoPermisoServidor_(fila[2]),
    servicioId: String(fila[3] || "").trim().toUpperCase(),
    fechaServicio: fechaGestionServidor_(fila[4]),
    motivo: String(fila[5] || "").trim(),
    comentario: String(fila[6] || "").trim(),
    reemplazoId: normalizarIdServidor_(fila[7]),
    diasAnticipacion: Number(fila[8] || 0),
    fueraPlazo: valorActivoServidor_(fila[9]),
    capitanEstado: String(fila[10] || "PENDIENTE").trim().toUpperCase(),
    capitanId: normalizarIdServidor_(fila[11]),
    pastorEstado: String(fila[12] || "PENDIENTE").trim().toUpperCase(),
    pastorId: normalizarIdServidor_(fila[13]),
    coberturaEstado: String(fila[14] || "PENDIENTE").trim().toUpperCase(),
    estado: String(fila[15] || "PENDIENTE").trim().toUpperCase(),
    creado: fechaHoraGestionServidor_(fila[16]),
    actualizado: fechaHoraGestionServidor_(fila[17])
  };
}


function enriquecerPermisoGestionServidor_(permiso, personasPorId) {
  const solicitante = personasPorId[permiso.servidorId];
  const reemplazo = personasPorId[permiso.reemplazoId];

  return {
    id: permiso.id,
    servidorId: permiso.servidorId,
    servidorNombre: solicitante ? solicitante.nombre : permiso.servidorId,
    tipo: permiso.tipo,
    servicioId: permiso.servicioId,
    fechaServicio: permiso.fechaServicio,
    motivo: permiso.motivo,
    comentario: permiso.comentario,
    reemplazoId: permiso.reemplazoId,
    reemplazoNombre: reemplazo ? reemplazo.nombre : permiso.reemplazoId,
    diasAnticipacion: permiso.diasAnticipacion,
    fueraPlazo: permiso.fueraPlazo,
    capitanEstado: permiso.capitanEstado,
    pastorEstado: permiso.pastorEstado,
    coberturaEstado: permiso.coberturaEstado,
    estado: permiso.estado,
    creado: permiso.creado
  };
}


function buscarPermisoGestionServidor_(permisoId) {
  const id = String(permisoId || "").trim().toUpperCase();
  return listarPermisosServidores_().find(function(permiso) {
    return permiso.id === id;
  }) || null;
}


function actualizarPermisoGestionServidor_(permiso, cambios) {
  const hoja = obtenerHojaPermisosServidores_();
  const valores = hoja.getRange(permiso.fila, 1, 1, 18).getValues()[0];

  if (cambios.capitanEstado) valores[10] = cambios.capitanEstado;
  if (cambios.capitanId !== undefined) valores[11] = cambios.capitanId;
  if (cambios.pastorEstado) valores[12] = cambios.pastorEstado;
  if (cambios.pastorId !== undefined) valores[13] = cambios.pastorId;
  if (cambios.coberturaEstado) valores[14] = cambios.coberturaEstado;

  const actualizado = mapearPermisoGestionServidor_(valores, permiso.fila);
  valores[15] = cambios.estadoForzado || calcularEstadoPermisoGestionServidor_(actualizado);
  valores[17] = new Date();
  hoja.getRange(permiso.fila, 1, 1, 18).setValues([valores]);
}


function calcularEstadoPermisoGestionServidor_(permiso) {
  if (permiso.capitanEstado === "RECHAZADO" ||
      permiso.pastorEstado === "RECHAZADO") {
    return "RECHAZADO";
  }

  if (permiso.coberturaEstado === "RECHAZADA") {
    return "COBERTURA_RECHAZADA";
  }

  if (permiso.capitanEstado === "APROBADO" &&
      permiso.pastorEstado === "APROBADO" &&
      permiso.coberturaEstado === "ACEPTADA") {
    return permiso.tipo === "EMERGENCIA"
      ? "EMERGENCIA_AUTORIZADA"
      : "AUTORIZADO";
  }

  return "PENDIENTE";
}


function normalizarTipoPermisoServidor_(tipo) {
  const valor = String(tipo || "").trim().toUpperCase();
  return ["NORMAL", "EMERGENCIA"].indexOf(valor) >= 0 ? valor : "";
}


function listarAsistenciasServidores_() {
  const hoja = obtenerHojaAsistenciaServidores_();

  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 7)
    .getValues()
    .map(function(fila) {
      return {
        servicioId: String(fila[0] || "").trim().toUpperCase(),
        fecha: fechaGestionServidor_(fila[1]),
        servidorId: normalizarIdServidor_(fila[2]),
        area: String(fila[3] || "").trim(),
        estado: String(fila[4] || "").trim().toUpperCase(),
        registradoPor: normalizarIdServidor_(fila[5]),
        actualizado: fechaHoraGestionServidor_(fila[6])
      };
    });
}


function contarFaltasSinPermisoGestionServidor_(servidorId, asistencias) {
  const anio = String(new Date().getFullYear());
  return asistencias.filter(function(asistencia) {
    return asistencia.servidorId === servidorId &&
      ["FALTA", "FALTA_SIN_PERMISO"].indexOf(asistencia.estado) >= 0 &&
      asistencia.fecha.indexOf(anio + "-") === 0;
  }).length;
}


function contarPermisosUsadosGestionServidor_(servidorId, permisos) {
  const anio = String(new Date().getFullYear());
  return permisos.filter(function(permiso) {
    return permiso.servidorId === servidorId &&
      ["AUTORIZADO", "EMERGENCIA_AUTORIZADA"].indexOf(permiso.estado) >= 0 &&
      permiso.fechaServicio.indexOf(anio + "-") === 0;
  }).length;
}


function buscarFilaAsistenciaGestionServidor_(hoja, servicioId, servidorId) {
  if (hoja.getLastRow() < 2) return 0;

  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getDisplayValues();

  for (let indice = 0; indice < filas.length; indice += 1) {
    if (String(filas[indice][0]).trim().toUpperCase() === servicioId &&
        normalizarIdServidor_(filas[indice][2]) === servidorId) {
      return indice + 2;
    }
  }

  return 0;
}


function buscarFilaPorIdGestionServidor_(hoja, id) {
  if (hoja.getLastRow() < 2) return 0;

  const valores = hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getDisplayValues();

  for (let indice = 0; indice < valores.length; indice += 1) {
    if (normalizarIdServidor_(valores[indice][0]) === id) {
      return indice + 2;
    }
  }

  return 0;
}


function calcularDiasAnticipacionGestionServidor_(fecha) {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const partes = String(fecha).split("-").map(Number);
  const destino = new Date(partes[0], partes[1] - 1, partes[2]);
  return Math.floor((destino.getTime() - inicioHoy.getTime()) / 86400000);
}


function fechaGestionServidor_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const texto = String(valor || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : "";
}


function fechaHoraGestionServidor_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor.toISOString();
  }

  return String(valor || "").trim();
}


function mesGestionServidor_(valor) {
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM"
    );
  }

  const texto = String(valor || "").trim();
  const coincidencia = texto.match(/^(\d{4})-(\d{2})/);
  return coincidencia ? coincidencia[1] + "-" + coincidencia[2] : texto;
}
