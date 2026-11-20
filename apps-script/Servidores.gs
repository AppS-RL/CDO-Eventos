const SERVIDORES_EVENTO = "SERVIDORES";
const SERVIDORES_HOJA_ACCESOS = "AccesosServidores";
const SERVIDORES_HOJA_CONTENIDO = "ContenidoServidores";
const SERVIDORES_HOJA_PROGRESO = "ProgresoServidores";
const SERVIDORES_MAX_INTENTOS = 5;
const SERVIDORES_BLOQUEO_MINUTOS = 15;
const SERVIDORES_SESION_DIAS = 30;


function activarAccesoServidor(id, ultimosTelefono, pin) {
  const identidad = obtenerIdentidadServidor_(id);
  const ultimos = String(ultimosTelefono || "").replace(/\D/g, "");

  validarPinServidor_(pin);

  if (
    !identidad ||
    ultimos.length !== 4 ||
    !identidad.telefono.endsWith(ultimos)
  ) {
    return {
      ok: false,
      mensaje: "No pudimos verificar tus datos. Revisa tu ID y teléfono."
    };
  }

  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);

  try {
    const hoja = obtenerHojaAccesosServidores_();
    const acceso = buscarAccesoServidor_(hoja, identidad.id);

    if (acceso && acceso.hashPin) {
      return {
        ok: false,
        mensaje: "Este ID ya tiene un PIN. Usa la opción Ya tengo PIN."
      };
    }

    const salt = Utilities.getUuid();
    const token = Utilities.getUuid() + Utilities.getUuid();
    const valores = crearValoresAccesoServidor_(
      identidad.id,
      salt,
      hashServidor_(salt + String(pin)),
      token
    );

    if (acceso) {
      hoja.getRange(acceso.fila, 1, 1, valores.length).setValues([valores]);
    } else {
      hoja.appendRow(valores);
    }

    return crearRespuestaSesionServidor_(identidad, token);
  } finally {
    bloqueo.releaseLock();
  }
}


function iniciarSesionServidor(id, pin) {
  validarPinServidor_(pin);

  const identidad = obtenerIdentidadServidor_(id);
  const hoja = obtenerHojaAccesosServidores_();
  const acceso = buscarAccesoServidor_(hoja, normalizarIdServidor_(id));

  if (!identidad || !acceso || !acceso.hashPin) {
    return respuestaCredencialesServidorInvalidas_();
  }

  const ahora = new Date();

  if (
    acceso.bloqueadoHasta &&
    acceso.bloqueadoHasta.getTime() > ahora.getTime()
  ) {
    return {
      ok: false,
      mensaje: "Demasiados intentos. Espera 15 minutos y vuelve a intentar."
    };
  }

  const hashRecibido = hashServidor_(acceso.salt + String(pin));

  if (hashRecibido !== acceso.hashPin) {
    registrarIntentoFallidoServidor_(hoja, acceso);
    return respuestaCredencialesServidorInvalidas_();
  }

  const token = Utilities.getUuid() + Utilities.getUuid();
  const expira = nuevaExpiracionServidor_();

  hoja.getRange(acceso.fila, 4, 1, 5).setValues([[
    0,
    "",
    hashServidor_(token),
    expira,
    ahora
  ]]);

  return crearRespuestaSesionServidor_(identidad, token);
}


function validarSesionServidor(token) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  return {
    ok: true,
    servidor: identidadPublicaServidor_(sesion.identidad)
  };
}


function cerrarSesionServidor(token) {
  const hoja = obtenerHojaAccesosServidores_();
  const acceso = buscarSesionServidor_(
    hoja,
    hashServidor_(String(token || "").trim())
  );

  if (acceso) {
    hoja.getRange(acceso.fila, 6, 1, 2).clearContent();
    hoja.getRange(acceso.fila, 8).setValue(new Date());
  }

  return { ok: true };
}


function prepararModuloContenidoServidores() {
  obtenerHojaContenidoServidores_();
  obtenerHojaProgresoServidores_();

  return {
    ok: true,
    mensaje: "Las hojas de contenido y progreso están listas."
  };
}


function cargarRolUniformes2026() {
  const hoja = obtenerHojaContenidoServidores_();
  const publicados = new Date();
  const uniformes = [
    ["2026-10-03", "NEGRO", "POLO"],
    ["2026-10-10", "AZUL", "PLAYERA"],
    ["2026-10-17", "NEGRO", "PLAYERA"],
    ["2026-10-24", "VERDE LIMA", "PLAYERA"],
    ["2026-10-31", "GRIS", "PLAYERA"],
    ["2026-11-07", "MORADO", "PLAYERA"],
    ["2026-11-14", "AZUL", "PLAYERA"],
    ["2026-11-21", "NEGRO", "PLAYERA"],
    ["2026-11-28", "VERDE LIMA", "PLAYERA"],
    ["2026-12-05", "GRIS", "PLAYERA"],
    ["2026-12-12", "MORADO", "PLAYERA"],
    ["2026-12-19", "AZUL", "PLAYERA"],
    ["2026-12-26", "GRIS", "PLAYERA"]
  ];
  const filasPorId = {};

  if (hoja.getLastRow() >= 2) {
    hoja
      .getRange(2, 1, hoja.getLastRow() - 1, 1)
      .getValues()
      .forEach(function(fila, indice) {
        const id = String(fila[0] || "").trim().toUpperCase();

        if (id) {
          filasPorId[id] = indice + 2;
        }
      });
  }

  uniformes.forEach(function(item) {
    const fecha = item[0];
    const color = item[1];
    const prenda = item[2];
    const id = "UNIFORME-" + fecha;
    const esPolo = prenda === "POLO";
    const fila = [
      id,
      "UNIFORME",
      (esPolo ? "Camisa tipo polo " : "Playera ") + nombreColorPrendaServidor_(color),
      esPolo
        ? "Camisa tipo polo con el distintivo de Iglesia Juvenil."
        : "Playera con el distintivo de Iglesia Juvenil.",
      fecha,
      "",
      "TODOS",
      "SI",
      publicados,
      color,
      prenda
    ];
    const numeroFila = filasPorId[id] || hoja.getLastRow() + 1;

    hoja.getRange(numeroFila, 1, 1, fila.length).setValues([fila]);
    filasPorId[id] = numeroFila;
  });

  return {
    ok: true,
    total: uniformes.length,
    mensaje: "El rol de uniformes 2026 quedó cargado."
  };
}


function nombreColorPrendaServidor_(color) {
  const nombres = {
    "NEGRO": "negra",
    "AZUL": "azul cielo",
    "VERDE LIMA": "verde lima",
    "GRIS": "gris",
    "MORADO": "morada"
  };

  return nombres[color] || String(color || "").toLowerCase();
}


function obtenerContenidoServidor(token) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const contenidos = listarContenidoServidor_(sesion.identidad.id);
  const progreso = obtenerProgresoServidor_(sesion.identidad.id);

  return {
    ok: true,
    contenidos: contenidos.map(function(contenido) {
      return {
        id: contenido.id,
        tipo: contenido.tipo,
        titulo: contenido.titulo,
        descripcion: contenido.descripcion,
        fecha: contenido.fecha,
        enlace: contenido.enlace,
        color: contenido.color,
        prenda: contenido.prenda,
        completada: Boolean(progreso[contenido.id])
      };
    })
  };
}


function marcarActividadServidor(token, contenidoId, completada) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const idContenido = String(contenidoId || "").trim().toUpperCase();
  const contenido = listarContenidoServidor_(sesion.identidad.id)
    .find(function(item) {
      return item.id === idContenido;
    });

  if (
    !contenido ||
    ["ACTIVIDAD", "PREDICACION"].indexOf(contenido.tipo) === -1
  ) {
    return {
      ok: false,
      mensaje: "La actividad no está disponible."
    };
  }

  const hoja = obtenerHojaProgresoServidores_();
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(10000);

  try {
    const fila = buscarFilaProgresoServidor_(
      hoja,
      sesion.identidad.id,
      idContenido
    );
    const valores = [[
      sesion.identidad.id,
      idContenido,
      Boolean(completada),
      new Date()
    ]];

    if (fila) {
      hoja.getRange(fila, 1, 1, 4).setValues(valores);
    } else {
      hoja.appendRow(valores[0]);
    }
  } finally {
    bloqueo.releaseLock();
  }

  return {
    ok: true,
    contenidoId: idContenido,
    completada: Boolean(completada)
  };
}


function resolverSesionServidor_(token) {
  const tokenLimpio = String(token || "").trim();

  if (!tokenLimpio) {
    return null;
  }

  const hoja = obtenerHojaAccesosServidores_();
  const acceso = buscarSesionServidor_(hoja, hashServidor_(tokenLimpio));

  if (
    !acceso ||
    !acceso.sesionExpira ||
    acceso.sesionExpira.getTime() <= Date.now()
  ) {
    return null;
  }

  const identidad = obtenerIdentidadServidor_(acceso.id);

  return identidad ? { acceso: acceso, identidad: identidad } : null;
}


function obtenerHojaContenidoServidores_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(SERVIDORES_HOJA_CONTENIDO);
  const encabezados = [
    "ID",
    "TIPO",
    "TITULO",
    "DESCRIPCION",
    "FECHA",
    "ENLACE",
    "DESTINATARIO",
    "ACTIVO",
    "PUBLICADO",
    "COLOR",
    "PRENDA"
  ];

  if (!hoja) {
    hoja = libro.insertSheet(SERVIDORES_HOJA_CONTENIDO);
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
  } else {
    hoja.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  }

  return hoja;
}


function obtenerHojaProgresoServidores_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(SERVIDORES_HOJA_PROGRESO);

  if (!hoja) {
    hoja = libro.insertSheet(SERVIDORES_HOJA_PROGRESO);
    hoja.appendRow([
      "SERVIDOR_ID",
      "CONTENIDO_ID",
      "COMPLETADA",
      "ACTUALIZADO"
    ]);
    hoja.setFrozenRows(1);
  }

  return hoja;
}


function listarContenidoServidor_(servidorId) {
  const hoja = obtenerHojaContenidoServidores_();

  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 11)
    .getValues()
    .map(function(fila) {
      return {
        id: String(fila[0] || "").trim().toUpperCase(),
        tipo: normalizarTipoContenidoServidor_(fila[1]),
        titulo: String(fila[2] || "").trim(),
        descripcion: String(fila[3] || "").trim(),
        fecha: formatearFechaContenidoServidor_(fila[4]),
        enlace: normalizarEnlaceContenidoServidor_(fila[5]),
        destinatario: String(fila[6] || "TODOS").trim().toUpperCase(),
        activo: valorActivoServidor_(fila[7]),
        publicado: fila[8],
        color: String(fila[9] || "").trim().toUpperCase(),
        prenda: String(fila[10] || "").trim().toUpperCase()
      };
    })
    .filter(function(item) {
      return Boolean(
        item.id &&
        item.tipo &&
        item.titulo &&
        item.activo &&
        destinatarioIncluyeServidor_(item.destinatario, servidorId)
      );
    })
    .sort(function(a, b) {
      return String(a.fecha || "9999-12-31")
        .localeCompare(String(b.fecha || "9999-12-31"));
    });
}


function obtenerProgresoServidor_(servidorId) {
  const hoja = obtenerHojaProgresoServidores_();
  const progreso = {};

  if (hoja.getLastRow() < 2) {
    return progreso;
  }

  hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 3)
    .getValues()
    .forEach(function(fila) {
      if (normalizarIdServidor_(fila[0]) === servidorId) {
        progreso[String(fila[1] || "").trim().toUpperCase()] =
          valorActivoServidor_(fila[2]);
      }
    });

  return progreso;
}


function buscarFilaProgresoServidor_(hoja, servidorId, contenidoId) {
  if (hoja.getLastRow() < 2) {
    return 0;
  }

  const filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 2)
    .getDisplayValues();

  for (let indice = 0; indice < filas.length; indice += 1) {
    if (
      normalizarIdServidor_(filas[indice][0]) === servidorId &&
      String(filas[indice][1]).trim().toUpperCase() === contenidoId
    ) {
      return indice + 2;
    }
  }

  return 0;
}


function normalizarTipoContenidoServidor_(tipo) {
  const valor = String(tipo || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return ["UNIFORME", "ACTIVIDAD", "PREDICACION", "AVISO"]
    .indexOf(valor) >= 0
    ? valor
    : "";
}


function destinatarioIncluyeServidor_(destinatario, servidorId) {
  const destinos = String(destinatario || "TODOS")
    .split(",")
    .map(function(valor) {
      return valor.trim().toUpperCase();
    });

  return destinos.indexOf("TODOS") >= 0 ||
    destinos.indexOf("*") >= 0 ||
    destinos.indexOf(servidorId) >= 0;
}


function valorActivoServidor_(valor) {
  if (valor === true || valor === 1) {
    return true;
  }

  return ["SI", "SÍ", "TRUE", "1", "ACTIVO", "COMPLETADA"]
    .indexOf(String(valor || "").trim().toUpperCase()) >= 0;
}


function formatearFechaContenidoServidor_(valor) {
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


function normalizarEnlaceContenidoServidor_(valor) {
  const enlace = String(valor || "").trim();
  return /^https:\/\//i.test(enlace) ? enlace : "";
}


function obtenerIdentidadServidor_(id) {
  const idNormalizado = normalizarIdServidor_(id);

  if (!/^SERVIDOR-\d{4,}$/.test(idNormalizado)) {
    return null;
  }

  const resultado = buscarAsistente(
    idNormalizado,
    SERVIDORES_EVENTO
  );
  const servidor = resultado && resultado.asistente
    ? resultado.asistente
    : resultado;

  if (!servidor || !servidor.id) {
    return null;
  }

  return {
    id: normalizarIdServidor_(servidor.id),
    nombre: String(servidor.nombre || "").trim(),
    telefono: String(servidor.telefono || "").replace(/\D/g, "")
  };
}


function obtenerHojaAccesosServidores_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(SERVIDORES_HOJA_ACCESOS);

  if (!hoja) {
    hoja = libro.insertSheet(SERVIDORES_HOJA_ACCESOS);
    hoja.appendRow([
      "ID",
      "SALT",
      "HASH_PIN",
      "INTENTOS",
      "BLOQUEADO_HASTA",
      "HASH_SESION",
      "SESION_EXPIRA",
      "ACTUALIZADO"
    ]);
    hoja.setFrozenRows(1);
  }

  return hoja;
}


function buscarAccesoServidor_(hoja, id) {
  if (hoja.getLastRow() < 2) {
    return null;
  }

  const filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 8)
    .getValues();

  for (let indice = 0; indice < filas.length; indice += 1) {
    if (normalizarIdServidor_(filas[indice][0]) === id) {
      return mapearAccesoServidor_(filas[indice], indice + 2);
    }
  }

  return null;
}


function buscarSesionServidor_(hoja, hashSesion) {
  if (!hashSesion || hoja.getLastRow() < 2) {
    return null;
  }

  const filas = hoja
    .getRange(2, 1, hoja.getLastRow() - 1, 8)
    .getValues();

  for (let indice = 0; indice < filas.length; indice += 1) {
    if (String(filas[indice][5]) === hashSesion) {
      return mapearAccesoServidor_(filas[indice], indice + 2);
    }
  }

  return null;
}


function mapearAccesoServidor_(fila, numeroFila) {
  return {
    fila: numeroFila,
    id: normalizarIdServidor_(fila[0]),
    salt: String(fila[1] || ""),
    hashPin: String(fila[2] || ""),
    intentos: Number(fila[3] || 0),
    bloqueadoHasta: fila[4] instanceof Date ? fila[4] : null,
    hashSesion: String(fila[5] || ""),
    sesionExpira: fila[6] instanceof Date ? fila[6] : null
  };
}


function crearValoresAccesoServidor_(id, salt, hashPin, token) {
  return [
    id,
    salt,
    hashPin,
    0,
    "",
    hashServidor_(token),
    nuevaExpiracionServidor_(),
    new Date()
  ];
}


function registrarIntentoFallidoServidor_(hoja, acceso) {
  const intentos = acceso.intentos + 1;
  let bloqueadoHasta = "";
  let intentosGuardados = intentos;

  if (intentos >= SERVIDORES_MAX_INTENTOS) {
    bloqueadoHasta = new Date(
      Date.now() + SERVIDORES_BLOQUEO_MINUTOS * 60 * 1000
    );
    intentosGuardados = 0;
  }

  hoja.getRange(acceso.fila, 4, 1, 2).setValues([[
    intentosGuardados,
    bloqueadoHasta
  ]]);
  hoja.getRange(acceso.fila, 8).setValue(new Date());
}


function crearRespuestaSesionServidor_(identidad, token) {
  return {
    ok: true,
    token: token,
    servidor: identidadPublicaServidor_(identidad)
  };
}


function identidadPublicaServidor_(identidad) {
  return {
    id: identidad.id,
    nombre: identidad.nombre
  };
}


function validarPinServidor_(pin) {
  if (!/^\d{6}$/.test(String(pin || ""))) {
    throw new Error("El PIN debe tener exactamente 6 números.");
  }
}


function normalizarIdServidor_(id) {
  return String(id || "").trim().toUpperCase();
}


function hashServidor_(valor) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(valor),
    Utilities.Charset.UTF_8
  );

  return bytes
    .map(function(byte) {
      const positivo = byte < 0 ? byte + 256 : byte;
      return ("0" + positivo.toString(16)).slice(-2);
    })
    .join("");
}


function nuevaExpiracionServidor_() {
  return new Date(
    Date.now() + SERVIDORES_SESION_DIAS * 24 * 60 * 60 * 1000
  );
}


function respuestaCredencialesServidorInvalidas_() {
  return {
    ok: false,
    mensaje: "ID o PIN incorrectos."
  };
}
