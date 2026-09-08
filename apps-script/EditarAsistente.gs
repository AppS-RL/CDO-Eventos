function editarAsistente(id, datos, codigoEvento) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();

  const codigo = obtenerCodigoEdicion_(
    codigoEvento,
    id
  );

  const configuraciones = {
    SEP26: {
      hoja: "Asistentes",
      historial: "Historial Pagos",
      costo: 400,
      tipo: "evento"
    },
    CAMP27: {
      hoja: "Campamento",
      historial: "Historial Campamento",
      costo: 3900,
      tipo: "evento"
    },
    SERVIDORES: {
      hoja: "Servidores",
      historial: "Movimientos Servidores",
      costo: 0,
      tipo: "ahorro"
    }
  };

  const configuracion = configuraciones[codigo];

  if (!configuracion) {
    return {
      ok: false,
      mensaje: "Evento no válido para edición."
    };
  }

  const hoja = libro.getSheetByName(
    configuracion.hoja
  );

  if (!hoja) {
    return {
      ok: false,
      mensaje: "No existe la hoja " + configuracion.hoja + "."
    };
  }

  const nombre = String(datos.nombre || "").trim();
  const telefono = String(datos.telefono || "").trim();
  const edad = String(datos.edad || "").trim();
  const observaciones = String(
    datos.observaciones || ""
  ).trim();

  if (!nombre) {
    return {
      ok: false,
      mensaje: "El nombre es obligatorio."
    };
  }

  let totalPagado = null;

  if (configuracion.tipo !== "ahorro") {
    totalPagado = Number(
      String(datos.totalPagado || "")
        .trim()
        .replace(",", ".")
    );

    if (
      !Number.isFinite(totalPagado) ||
      totalPagado < 0 ||
      totalPagado > configuracion.costo
    ) {
      return {
        ok: false,
        mensaje: "El total pagado debe estar entre $0 y $" +
          configuracion.costo.toLocaleString("es-MX") + "."
      };
    }
  }

  if (hoja.getLastRow() < 2) {
    return {
      ok: false,
      mensaje: "Asistente no encontrado."
    };
  }

  const ids = hoja
    .getRange(2, COL.ID, hoja.getLastRow() - 1, 1)
    .getDisplayValues()
    .flat();

  const indice = ids.findIndex(function(valor) {
    return String(valor).trim().toUpperCase() ===
      String(id).trim().toUpperCase();
  });

  if (indice === -1) {
    return {
      ok: false,
      mensaje: "Asistente no encontrado en " +
        configuracion.hoja + "."
    };
  }

  const fila = indice + 2;

  hoja
    .getRange(fila, COL.NOMBRE, 1, 3)
    .setValues([[nombre, telefono, edad]]);

  hoja
    .getRange(fila, COL.OBSERVACIONES)
    .setValue(observaciones);

  if (configuracion.tipo === "ahorro") {
    const saldoActual = Number(
      hoja.getRange(fila, COL.PAGADO).getValue()
    ) || 0;

    return {
      ok: true,
      mensaje: "Datos del servidor actualizados correctamente.",
      pagado: saldoActual
    };
  }

  const pagadoActual = Number(
    hoja.getRange(fila, COL.PAGADO).getValue()
  ) || 0;

  const ajuste = totalPagado - pagadoActual;

  if (Math.abs(ajuste) >= 0.01) {
    hoja
      .getRange(fila, COL.PAGADO)
      .setValue(totalPagado);

    const historial = libro.getSheetByName(
      configuracion.historial
    );

    if (historial) {
      historial.appendRow([
        new Date(),
        id,
        nombre,
        ajuste,
        totalPagado
      ]);
    }
  }

  return {
    ok: true,
    mensaje: "Datos actualizados correctamente.",
    pagado: totalPagado
  };
}


function obtenerCodigoEdicion_(codigoEvento, id) {
  const codigo = String(codigoEvento || "")
    .trim()
    .toUpperCase();

  if (codigo) {
    return codigo;
  }

  const identificador = String(id || "")
    .trim()
    .toUpperCase();

  if (identificador.indexOf("CAMP27-") === 0) {
    return "CAMP27";
  }

  if (identificador.indexOf("SERVIDOR-") === 0) {
    return "SERVIDORES";
  }

  return "SEP26";
}
