const SERVIDORES_EVENTO = "SERVIDORES";
const SERVIDORES_HOJA_ACCESOS = "AccesosServidores";
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
  const tokenLimpio = String(token || "").trim();

  if (!tokenLimpio) {
    return { ok: false, mensaje: "Sesión no válida." };
  }

  const hoja = obtenerHojaAccesosServidores_();
  const acceso = buscarSesionServidor_(hoja, hashServidor_(tokenLimpio));

  if (
    !acceso ||
    !acceso.sesionExpira ||
    acceso.sesionExpira.getTime() <= Date.now()
  ) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const identidad = obtenerIdentidadServidor_(acceso.id);

  if (!identidad) {
    return { ok: false, mensaje: "La cuenta ya no está disponible." };
  }

  return {
    ok: true,
    servidor: identidadPublicaServidor_(identidad)
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
