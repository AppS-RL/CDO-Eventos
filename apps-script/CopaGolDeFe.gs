const COPA_HOJA_EQUIPOS = "Equipos Copa";
const COPA_HOJA_PARTIDOS = "Partidos Copa";
const COPA_EVENTO_ASISTENTES = "SEP26";

const COPA_COLUMNAS_EQUIPOS = [
  "ID_EQUIPO",
  "CATEGORIA",
  "NOMBRE_EQUIPO",
  "JUGADOR_1_ID",
  "JUGADOR_1_NOMBRE",
  "JUGADOR_2_ID",
  "JUGADOR_2_NOMBRE",
  "FECHA_REGISTRO"
];

const COPA_COLUMNAS_PARTIDOS = [
  "ID_PARTIDO",
  "CATEGORIA",
  "RONDA_NUMERO",
  "RONDA_NOMBRE",
  "ORDEN",
  "EQUIPO_1_ID",
  "EQUIPO_1_NOMBRE",
  "EQUIPO_2_ID",
  "EQUIPO_2_NOMBRE",
  "GANADOR_ID",
  "GANADOR_NOMBRE",
  "ESTADO",
  "SIGUIENTE_PARTIDO_ID",
  "POSICION_SIGUIENTE",
  "FECHA_RESULTADO"
];


function prepararHojasCopaGolDeFe() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  const hojaEquipos = obtenerOCrearHojaCopa_(
    libro,
    COPA_HOJA_EQUIPOS,
    COPA_COLUMNAS_EQUIPOS
  );

  const hojaPartidos = obtenerOCrearHojaCopa_(
    libro,
    COPA_HOJA_PARTIDOS,
    COPA_COLUMNAS_PARTIDOS
  );

  return {
    ok: true,
    mensaje: "Las hojas de Copa Gol de Fe están listas."
  };
}


function obtenerCopaGolDeFe(categoria) {
  const categoriaValida = normalizarCategoriaCopa_(categoria);

  if (!categoriaValida) {
    return respuestaErrorCopa_("Categoría no válida.");
  }

  const hojas = obtenerHojasCopa_();
  const equipos = leerEquiposCopa_(
    hojas.equipos,
    categoriaValida
  );

  const partidos = leerPartidosCopa_(
    hojas.partidos,
    categoriaValida
  );

  const final = partidos.find(function(partido) {
    return !partido.siguientePartidoId;
  });

  const campeon = final && final.ganadorId
    ? {
        id: final.ganadorId,
        nombre: final.ganadorNombre
      }
    : null;

  return {
    ok: true,
    categoria: categoriaValida,
    inscripcionesAbiertas: partidos.length === 0,
    torneoGenerado: partidos.length > 0,
    equipos: equipos,
    partidos: partidos,
    campeon: campeon
  };
}


function registrarEquipoCopa(
  categoria,
  nombre,
  jugadores
) {
  const bloqueo = LockService.getScriptLock();

  if (!bloqueo.tryLock(10000)) {
    return respuestaErrorCopa_(
      "Hay otro registro en proceso. Intenta nuevamente."
    );
  }

  try {
    const categoriaValida = normalizarCategoriaCopa_(categoria);
    const nombreValido = String(nombre || "").trim();
    const ids = Array.isArray(jugadores)
      ? jugadores.map(function(id) {
          return String(id || "").trim().toUpperCase();
        })
      : [];

    if (!categoriaValida) {
      return respuestaErrorCopa_("Categoría no válida.");
    }

    if (!nombreValido) {
      return respuestaErrorCopa_(
        "Escribe el nombre del equipo."
      );
    }

    if (ids.length !== 2 || !ids[0] || !ids[1]) {
      return respuestaErrorCopa_(
        "Cada equipo debe tener exactamente dos jugadores."
      );
    }

    if (ids[0] === ids[1]) {
      return respuestaErrorCopa_(
        "Los dos jugadores deben ser diferentes."
      );
    }

    const hojas = obtenerHojasCopa_();
    const partidos = leerPartidosCopa_(
      hojas.partidos,
      categoriaValida
    );

    if (partidos.length > 0) {
      return respuestaErrorCopa_(
        "Las inscripciones ya están cerradas para esta categoría."
      );
    }

    const equipos = leerEquiposCopa_(
      hojas.equipos,
      categoriaValida
    );

    const nombreRepetido = equipos.some(function(equipo) {
      return normalizarTextoCopa_(equipo.nombre) ===
        normalizarTextoCopa_(nombreValido);
    });

    if (nombreRepetido) {
      return respuestaErrorCopa_(
        "Ya existe un equipo con ese nombre en esta categoría."
      );
    }

    const jugadorRepetido = equipos.find(function(equipo) {
      return equipo.jugadores.some(function(jugador) {
        return ids.indexOf(jugador.id) !== -1;
      });
    });

    if (jugadorRepetido) {
      return respuestaErrorCopa_(
        "Uno de los jugadores ya pertenece al equipo " +
        jugadorRepetido.nombre + "."
      );
    }

    const jugador1 = buscarJugadorCopa_(ids[0]);
    const jugador2 = buscarJugadorCopa_(ids[1]);

    if (!jugador1) {
      return respuestaErrorCopa_(
        "No encontramos al asistente " + ids[0] + "."
      );
    }

    if (!jugador2) {
      return respuestaErrorCopa_(
        "No encontramos al asistente " + ids[1] + "."
      );
    }

    const idEquipo = crearIdEquipoCopa_(
      hojas.equipos,
      categoriaValida
    );

    hojas.equipos.appendRow([
      idEquipo,
      categoriaValida,
      nombreValido,
      jugador1.id,
      jugador1.nombre,
      jugador2.id,
      jugador2.nombre,
      new Date()
    ]);

    hojas.equipos
      .getRange(hojas.equipos.getLastRow(), 8)
      .setNumberFormat("dd/mm/yyyy hh:mm a.m./p.m.");

    SpreadsheetApp.flush();

    return {
      ok: true,
      mensaje: "Equipo registrado correctamente.",
      equipo: {
        id: idEquipo,
        categoria: categoriaValida,
        nombre: nombreValido,
        jugadores: [jugador1, jugador2]
      }
    };

  } catch (error) {
    return respuestaErrorCopa_(
      "No fue posible registrar el equipo.",
      error
    );

  } finally {
    bloqueo.releaseLock();
  }
}


function eliminarEquipoCopa(categoria, equipoId) {
  const bloqueo = LockService.getScriptLock();

  if (!bloqueo.tryLock(10000)) {
    return respuestaErrorCopa_(
      "Hay otra operación en proceso. Intenta nuevamente."
    );
  }

  try {
    const categoriaValida = normalizarCategoriaCopa_(categoria);
    const idValido = String(equipoId || "").trim();

    if (!categoriaValida || !idValido) {
      return respuestaErrorCopa_("Equipo no válido.");
    }

    const hojas = obtenerHojasCopa_();

    if (
      leerPartidosCopa_(hojas.partidos, categoriaValida)
        .length > 0
    ) {
      return respuestaErrorCopa_(
        "No puedes eliminar equipos después de generar el torneo."
      );
    }

    const fila = buscarFilaPorDosValoresCopa_(
      hojas.equipos,
      1,
      idValido,
      2,
      categoriaValida
    );

    if (!fila) {
      return respuestaErrorCopa_("Equipo no encontrado.");
    }

    hojas.equipos.deleteRow(fila);

    return {
      ok: true,
      mensaje: "Equipo eliminado correctamente."
    };

  } catch (error) {
    return respuestaErrorCopa_(
      "No fue posible eliminar el equipo.",
      error
    );

  } finally {
    bloqueo.releaseLock();
  }
}


function generarTorneoCopa(categoria) {
  const bloqueo = LockService.getScriptLock();

  if (!bloqueo.tryLock(10000)) {
    return respuestaErrorCopa_(
      "Hay otra operación en proceso. Intenta nuevamente."
    );
  }

  try {
    const categoriaValida = normalizarCategoriaCopa_(categoria);

    if (!categoriaValida) {
      return respuestaErrorCopa_("Categoría no válida.");
    }

    const hojas = obtenerHojasCopa_();
    const partidosExistentes = leerPartidosCopa_(
      hojas.partidos,
      categoriaValida
    );

    if (partidosExistentes.length > 0) {
      return respuestaErrorCopa_(
        "El torneo de esta categoría ya fue generado."
      );
    }

    const equipos = barajarEquiposCopa_(
      leerEquiposCopa_(hojas.equipos, categoriaValida)
    );

    if (equipos.length < 2) {
      return respuestaErrorCopa_(
        "Necesitas al menos dos equipos para generar el torneo."
      );
    }

    const tamanoLlave = siguientePotenciaDosCopa_(
      equipos.length
    );

    const totalRondas = Math.log(tamanoLlave) / Math.log(2);
    const cantidadPases = tamanoLlave - equipos.length;
    const prefijo = prefijoCategoriaCopa_(categoriaValida);
    const filas = [];
    const pasesIniciales = [];
    let posicionEquipo = 0;

    for (let ronda = 1; ronda <= totalRondas; ronda++) {
      const cantidadPartidos = tamanoLlave / Math.pow(2, ronda);

      for (let orden = 1; orden <= cantidadPartidos; orden++) {
        const idPartido = crearIdPartidoCopa_(
          prefijo,
          ronda,
          orden
        );

        const siguienteId = ronda < totalRondas
          ? crearIdPartidoCopa_(
              prefijo,
              ronda + 1,
              Math.ceil(orden / 2)
            )
          : "";

        const posicionSiguiente = siguienteId
          ? (orden % 2 === 1 ? 1 : 2)
          : "";

        let equipo1 = null;
        let equipo2 = null;
        let ganador = null;
        let estado = "PENDIENTE";
        let fechaResultado = "";

        if (ronda === 1) {
          equipo1 = equipos[posicionEquipo++] || null;

          if (orden <= cantidadPases) {
            ganador = equipo1;
            estado = "PASE";
            fechaResultado = new Date();

          } else {
            equipo2 = equipos[posicionEquipo++] || null;
          }
        }

        filas.push([
          idPartido,
          categoriaValida,
          ronda,
          nombreRondaCopa_(ronda, totalRondas),
          orden,
          equipo1 ? equipo1.id : "",
          equipo1 ? equipo1.nombre : "",
          equipo2 ? equipo2.id : "",
          equipo2 ? equipo2.nombre : "",
          ganador ? ganador.id : "",
          ganador ? ganador.nombre : "",
          estado,
          siguienteId,
          posicionSiguiente,
          fechaResultado
        ]);

        if (ganador && siguienteId) {
          pasesIniciales.push({
            siguienteId: siguienteId,
            posicion: posicionSiguiente,
            equipo: ganador
          });
        }
      }
    }

    hojas.partidos
      .getRange(
        hojas.partidos.getLastRow() + 1,
        1,
        filas.length,
        COPA_COLUMNAS_PARTIDOS.length
      )
      .setValues(filas);

    hojas.partidos
      .getRange(
        hojas.partidos.getLastRow() - filas.length + 1,
        15,
        filas.length,
        1
      )
      .setNumberFormat("dd/mm/yyyy hh:mm a.m./p.m.");

    pasesIniciales.forEach(function(pase) {
      colocarEquipoEnPartidoCopa_(
        hojas.partidos,
        categoriaValida,
        pase.siguienteId,
        pase.posicion,
        pase.equipo
      );
    });

    SpreadsheetApp.flush();

    return {
      ok: true,
      mensaje: "Torneo generado correctamente.",
      equipos: equipos.length,
      rondas: totalRondas,
      pasesDirectos: cantidadPases
    };

  } catch (error) {
    return respuestaErrorCopa_(
      "No fue posible generar el torneo.",
      error
    );

  } finally {
    bloqueo.releaseLock();
  }
}


function registrarGanadorCopa(
  categoria,
  partidoId,
  equipoId
) {
  const bloqueo = LockService.getScriptLock();

  if (!bloqueo.tryLock(10000)) {
    return respuestaErrorCopa_(
      "Hay otra operación en proceso. Intenta nuevamente."
    );
  }

  try {
    const categoriaValida = normalizarCategoriaCopa_(categoria);
    const partidoValido = String(partidoId || "").trim();
    const equipoValido = String(equipoId || "").trim();

    if (!categoriaValida || !partidoValido || !equipoValido) {
      return respuestaErrorCopa_(
        "Los datos del partido no son válidos."
      );
    }

    const hojas = obtenerHojasCopa_();
    const fila = buscarFilaPorDosValoresCopa_(
      hojas.partidos,
      1,
      partidoValido,
      2,
      categoriaValida
    );

    if (!fila) {
      return respuestaErrorCopa_("Partido no encontrado.");
    }

    const datosPartido = hojas.partidos
      .getRange(fila, 1, 1, COPA_COLUMNAS_PARTIDOS.length)
      .getValues()[0];

    const equipo1 = {
      id: String(datosPartido[5] || ""),
      nombre: String(datosPartido[6] || "")
    };

    const equipo2 = {
      id: String(datosPartido[7] || ""),
      nombre: String(datosPartido[8] || "")
    };

    const ganadorActual = String(datosPartido[9] || "");

    if (ganadorActual) {
      return respuestaErrorCopa_(
        "Este partido ya tiene un ganador registrado."
      );
    }

    if (!equipo1.id || !equipo2.id) {
      return respuestaErrorCopa_(
        "El partido todavía no tiene a sus dos equipos."
      );
    }

    let ganador;

    if (equipoValido === equipo1.id) {
      ganador = equipo1;

    } else if (equipoValido === equipo2.id) {
      ganador = equipo2;

    } else {
      return respuestaErrorCopa_(
        "El equipo elegido no pertenece a este partido."
      );
    }

    hojas.partidos
      .getRange(fila, 10, 1, 3)
      .setValues([[
        ganador.id,
        ganador.nombre,
        "FINALIZADO"
      ]]);

    hojas.partidos
      .getRange(fila, 15)
      .setValue(new Date())
      .setNumberFormat("dd/mm/yyyy hh:mm a.m./p.m.");

    const siguienteId = String(datosPartido[12] || "");
    const posicionSiguiente = Number(datosPartido[13]) || 0;

    if (siguienteId) {
      colocarEquipoEnPartidoCopa_(
        hojas.partidos,
        categoriaValida,
        siguienteId,
        posicionSiguiente,
        ganador
      );
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      mensaje: siguienteId
        ? "Ganador registrado. Avanza a la siguiente ronda."
        : "¡Tenemos campeón de la Copa Gol de Fe!",
      ganador: ganador,
      campeon: !siguienteId
    };

  } catch (error) {
    return respuestaErrorCopa_(
      "No fue posible registrar al ganador.",
      error
    );

  } finally {
    bloqueo.releaseLock();
  }
}


function obtenerHojasCopa_() {
  prepararHojasCopaGolDeFe();

  const libro = SpreadsheetApp.getActiveSpreadsheet();

  return {
    equipos: libro.getSheetByName(COPA_HOJA_EQUIPOS),
    partidos: libro.getSheetByName(COPA_HOJA_PARTIDOS)
  };
}


function obtenerOCrearHojaCopa_(libro, nombre, columnas) {
  let hoja = libro.getSheetByName(nombre);

  if (!hoja) {
    hoja = libro.insertSheet(nombre);
  }

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);

    hoja
      .getRange(1, 1, 1, columnas.length)
      .setFontWeight("bold")
      .setBackground("#2563eb")
      .setFontColor("#ffffff");

    hoja.autoResizeColumns(1, columnas.length);
  }

  return hoja;
}


function leerEquiposCopa_(hoja, categoria) {
  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      COPA_COLUMNAS_EQUIPOS.length
    )
    .getValues()
    .filter(function(fila) {
      return String(fila[1]).toUpperCase() === categoria;
    })
    .map(function(fila) {
      return {
        id: String(fila[0]),
        categoria: String(fila[1]),
        nombre: String(fila[2]),
        jugadores: [
          {
            id: String(fila[3]),
            nombre: String(fila[4])
          },
          {
            id: String(fila[5]),
            nombre: String(fila[6])
          }
        ]
      };
    });
}


function leerPartidosCopa_(hoja, categoria) {
  if (hoja.getLastRow() < 2) {
    return [];
  }

  return hoja
    .getRange(
      2,
      1,
      hoja.getLastRow() - 1,
      COPA_COLUMNAS_PARTIDOS.length
    )
    .getValues()
    .filter(function(fila) {
      return String(fila[1]).toUpperCase() === categoria;
    })
    .map(function(fila) {
      return {
        id: String(fila[0]),
        categoria: String(fila[1]),
        rondaNumero: Number(fila[2]),
        ronda: String(fila[3]),
        numero: Number(fila[4]),
        equipo1: fila[5]
          ? { id: String(fila[5]), nombre: String(fila[6]) }
          : null,
        equipo2: fila[7]
          ? { id: String(fila[7]), nombre: String(fila[8]) }
          : null,
        ganadorId: String(fila[9] || ""),
        ganadorNombre: String(fila[10] || ""),
        estado: String(fila[11] || "PENDIENTE"),
        siguientePartidoId: String(fila[12] || "")
      };
    })
    .sort(function(a, b) {
      return a.rondaNumero - b.rondaNumero ||
        a.numero - b.numero;
    });
}


function buscarJugadorCopa_(id) {
  const encontrado = buscarAsistente(
    id,
    COPA_EVENTO_ASISTENTES
  );

  const asistente = encontrado && encontrado.asistente
    ? encontrado.asistente
    : encontrado;

  if (!asistente || !asistente.id) {
    return null;
  }

  return {
    id: String(asistente.id).trim().toUpperCase(),
    nombre: String(asistente.nombre || "").trim()
  };
}


function crearIdEquipoCopa_(hoja, categoria) {
  const prefijo = prefijoCategoriaCopa_(categoria);
  let mayor = 0;

  if (hoja.getLastRow() >= 2) {
    hoja
      .getRange(2, 1, hoja.getLastRow() - 1, 1)
      .getDisplayValues()
      .flat()
      .forEach(function(id) {
        const coincidencia = String(id).match(
          new RegExp("^" + prefijo + "-(\\d+)$")
        );

        if (coincidencia) {
          mayor = Math.max(mayor, Number(coincidencia[1]));
        }
      });
  }

  return prefijo + "-" + String(mayor + 1).padStart(4, "0");
}


function crearIdPartidoCopa_(prefijo, ronda, orden) {
  return prefijo + "-R" + ronda + "-P" + orden;
}


function colocarEquipoEnPartidoCopa_(
  hoja,
  categoria,
  partidoId,
  posicion,
  equipo
) {
  const fila = buscarFilaPorDosValoresCopa_(
    hoja,
    1,
    partidoId,
    2,
    categoria
  );

  if (!fila) {
    throw new Error(
      "No se encontró el siguiente partido " + partidoId + "."
    );
  }

  const columnaInicial = Number(posicion) === 2 ? 8 : 6;

  hoja
    .getRange(fila, columnaInicial, 1, 2)
    .setValues([[
      equipo.id,
      equipo.nombre
    ]]);
}


function buscarFilaPorDosValoresCopa_(
  hoja,
  columna1,
  valor1,
  columna2,
  valor2
) {
  if (hoja.getLastRow() < 2) {
    return 0;
  }

  const cantidad = hoja.getLastRow() - 1;
  const datos = hoja
    .getRange(2, 1, cantidad, hoja.getLastColumn())
    .getDisplayValues();

  for (let indice = 0; indice < datos.length; indice++) {
    const coincide1 = String(datos[indice][columna1 - 1]) ===
      String(valor1);

    const coincide2 = String(datos[indice][columna2 - 1])
      .toUpperCase() === String(valor2).toUpperCase();

    if (coincide1 && coincide2) {
      return indice + 2;
    }
  }

  return 0;
}


function barajarEquiposCopa_(equipos) {
  const copia = equipos.slice();

  for (let indice = copia.length - 1; indice > 0; indice--) {
    const aleatorio = Math.floor(Math.random() * (indice + 1));
    const temporal = copia[indice];

    copia[indice] = copia[aleatorio];
    copia[aleatorio] = temporal;
  }

  return copia;
}


function siguientePotenciaDosCopa_(numero) {
  let potencia = 1;

  while (potencia < numero) {
    potencia *= 2;
  }

  return potencia;
}


function nombreRondaCopa_(ronda, totalRondas) {
  if (ronda === totalRondas) {
    return "Final";
  }

  if (ronda === totalRondas - 1) {
    return "Semifinales";
  }

  if (ronda === totalRondas - 2) {
    return "Cuartos de final";
  }

  return "Ronda " + ronda;
}


function prefijoCategoriaCopa_(categoria) {
  return categoria === "FEMENIL" ? "CGF-F" : "CGF-V";
}


function normalizarCategoriaCopa_(categoria) {
  const valor = String(categoria || "").trim().toUpperCase();

  return valor === "VARONIL" || valor === "FEMENIL"
    ? valor
    : "";
}


function normalizarTextoCopa_(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function respuestaErrorCopa_(mensaje, error) {
  const respuesta = {
    ok: false,
    mensaje: mensaje
  };

  if (error) {
    respuesta.error = String(error);
  }

  return respuesta;
}
