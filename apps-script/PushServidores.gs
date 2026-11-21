const PUSH_HOJA_DISPOSITIVOS = "DispositivosPushServidores";
const PUSH_HOJA_ENVIOS = "EnviosPushServidores";
const PUSH_URL_PORTAL = "https://apps-rl.github.io/CDO-Eventos/?preview=servidores";


function registrarPushServidor(token, tokenDispositivo, dispositivo) {
  const sesion = resolverSesionServidor_(token);

  if (!sesion) {
    return { ok: false, mensaje: "La sesión terminó." };
  }

  const tokenLimpio = String(tokenDispositivo || "").trim();
  const descripcion = String(dispositivo || "").trim().slice(0, 500);

  if (tokenLimpio.length < 40) {
    throw new Error("El identificador del teléfono no es válido.");
  }

  const hoja = obtenerHojaDispositivosPush_();
  const ahora = new Date();
  let fila = 0;

  if (hoja.getLastRow() >= 2) {
    const valores = hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getDisplayValues();
    valores.some(function(item, indice) {
      if (String(item[2] || "").trim() === tokenLimpio) {
        fila = indice + 2;
        return true;
      }
      return false;
    });
  }

  const registro = [[
    "PUSH-" + Utilities.getUuid().slice(0, 8).toUpperCase(),
    sesion.identidad.id,
    tokenLimpio,
    descripcion,
    "SI",
    ahora,
    ahora
  ]];

  if (fila) {
    const creado = hoja.getRange(fila, 6).getValue() || ahora;
    registro[0][0] = hoja.getRange(fila, 1).getDisplayValue() || registro[0][0];
    registro[0][5] = creado;
    hoja.getRange(fila, 1, 1, 7).setValues(registro);
  } else {
    hoja.appendRow(registro[0]);
  }

  return {
    ok: true,
    mensaje: "Notificaciones activadas en este teléfono."
  };
}


function configurarPushServidores() {
  obtenerHojaDispositivosPush_();
  obtenerHojaEnviosPush_();
  marcarContenidoPushExistente_();

  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "sincronizarPushContenidoServidores") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger("sincronizarPushContenidoServidores")
    .timeBased()
    .everyMinutes(5)
    .create();

  return {
    ok: true,
    mensaje: "Las notificaciones push quedaron configuradas."
  };
}


function marcarContenidoPushExistente_() {
  const hoja = obtenerHojaContenidoServidores_();
  if (hoja.getLastRow() < 2) return;
  const enviados = listarEnviosPush_();

  hoja.getRange(2, 1, hoja.getLastRow() - 1, 2).getDisplayValues().forEach(function(fila) {
    const id = String(fila[0] || "").trim().toUpperCase();
    const tipo = String(fila[1] || "").trim().toUpperCase();
    if (id && !enviados[id] && ["AVISO", "PREDICACION"].indexOf(tipo) >= 0) {
      obtenerHojaEnviosPush_().appendRow([id, tipo, 0, new Date()]);
      enviados[id] = true;
    }
  });
}


function sincronizarPushContenidoServidores() {
  const hoja = obtenerHojaContenidoServidores_();
  if (hoja.getLastRow() < 2) return { ok: true, total: 0 };

  const enviados = listarEnviosPush_();
  const personas = listarPersonasGestionServidor_();
  let total = 0;

  hoja.getRange(2, 1, hoja.getLastRow() - 1, 11).getValues().forEach(function(fila) {
    const id = String(fila[0] || "").trim().toUpperCase();
    const tipo = String(fila[1] || "").trim().toUpperCase();
    const activo = String(fila[7] || "SI").trim().toUpperCase();
    const vigente = contenidoVigenteServidor_({
      tipo: tipo,
      fecha: formatearFechaContenidoServidor_(fila[4]),
      publicado: fila[8]
    });

    if (!id || enviados[id] || activo === "NO" || !vigente ||
        ["AVISO", "PREDICACION"].indexOf(tipo) < 0) {
      return;
    }

    const destinatario = String(fila[6] || "TODOS").trim().toUpperCase();
    const ids = destinatario === "TODOS"
      ? personas.map(function(persona) { return persona.id; })
      : destinatario.split(",").map(normalizarIdServidor_).filter(Boolean);
    const titulo = tipo === "PREDICACION" ? "Nueva predicación" : "Nuevo aviso";
    const destino = tipo === "PREDICACION" ? "predicacionesServidor" : "avisosServidor";

    enviarPushServidoresSeguro_(ids, {
      id: tipo + "_" + id,
      titulo: titulo,
      descripcion: String(fila[2] || titulo).trim(),
      destino: destino
    });
    marcarPushContenidoEnviado_(id, tipo, ids.length);
    total += 1;
  });

  return { ok: true, total: total };
}


function enviarPushServidoresSeguro_(servidorIds, datos) {
  try {
    return enviarPushServidores_(servidorIds, datos);
  } catch (error) {
    console.error("No fue posible enviar push: " + error.message);
    return { ok: false, total: 0, mensaje: error.message };
  }
}


function enviarPushServidores_(servidorIds, datos) {
  const ids = (servidorIds || []).map(normalizarIdServidor_).filter(function(id, indice, todos) {
    return id && todos.indexOf(id) === indice;
  });
  if (!ids.length) return { ok: true, total: 0 };

  const propiedades = PropertiesService.getScriptProperties();
  const projectId = propiedades.getProperty("FCM_PROJECT_ID");
  if (!projectId) throw new Error("Falta configurar FCM_PROJECT_ID.");

  const dispositivos = listarDispositivosPush_().filter(function(item) {
    return ids.indexOf(item.servidorId) >= 0 && item.activo;
  });
  if (!dispositivos.length) return { ok: true, total: 0 };

  const acceso = obtenerTokenAccesoFCM_();
  let enviados = 0;

  dispositivos.forEach(function(dispositivo) {
    const respuesta = UrlFetchApp.fetch(
      "https://fcm.googleapis.com/v1/projects/" + encodeURIComponent(projectId) + "/messages:send",
      {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + acceso },
        muteHttpExceptions: true,
        payload: JSON.stringify({
          message: {
            token: dispositivo.token,
            data: {
              id: String(datos.id || "").slice(0, 200),
              titulo: String(datos.titulo || "CDO Servidores").slice(0, 100),
              descripcion: String(datos.descripcion || "Tienes una nueva notificación.").slice(0, 500),
              url: PUSH_URL_PORTAL + "&abrir=" + encodeURIComponent(datos.destino || "notificacionesServidor")
            },
            webpush: {
              headers: { Urgency: "high" }
            }
          }
        })
      }
    );
    const codigo = respuesta.getResponseCode();

    if (codigo >= 200 && codigo < 300) {
      enviados += 1;
    } else if ([400, 404].indexOf(codigo) >= 0) {
      desactivarDispositivoPush_(dispositivo.fila);
    } else {
      console.error("FCM respondió " + codigo + ": " + respuesta.getContentText().slice(0, 500));
    }
  });

  return { ok: true, total: enviados };
}


function obtenerTokenAccesoFCM_() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get("FCM_ACCESS_TOKEN");
  if (guardado) return guardado;

  const propiedades = PropertiesService.getScriptProperties();
  const correo = propiedades.getProperty("FCM_CLIENT_EMAIL");
  const llave = String(propiedades.getProperty("FCM_PRIVATE_KEY") || "")
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----\s*/, "-----BEGIN PRIVATE KEY-----\n")
    .replace(/\s*-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----")
    .trim();
  if (!correo || !llave) throw new Error("Faltan las credenciales privadas de Firebase.");

  const ahora = Math.floor(Date.now() / 1000);
  const encabezado = codificarBase64WebSafe_(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = codificarBase64WebSafe_(JSON.stringify({
    iss: correo,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: ahora,
    exp: ahora + 3600
  }));
  const sinFirma = encabezado + "." + cuerpo;
  const firma = Utilities.computeRsaSha256Signature(sinFirma, llave);
  const jwt = sinFirma + "." + Utilities.base64EncodeWebSafe(firma).replace(/=+$/, "");
  const respuesta = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    muteHttpExceptions: true,
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    }
  });
  const resultado = JSON.parse(respuesta.getContentText() || "{}");
  if (!resultado.access_token) throw new Error("Firebase no entregó un acceso válido.");

  cache.put("FCM_ACCESS_TOKEN", resultado.access_token, 3300);
  return resultado.access_token;
}


function codificarBase64WebSafe_(texto) {
  return Utilities.base64EncodeWebSafe(Utilities.newBlob(texto).getBytes()).replace(/=+$/, "");
}


function obtenerHojaDispositivosPush_() {
  return obtenerHojaPush_(PUSH_HOJA_DISPOSITIVOS, [
    "ID", "SERVIDOR_ID", "TOKEN", "DISPOSITIVO", "ACTIVO", "CREADO", "ACTUALIZADO"
  ]);
}


function obtenerHojaEnviosPush_() {
  return obtenerHojaPush_(PUSH_HOJA_ENVIOS, [
    "CONTENIDO_ID", "TIPO", "DESTINATARIOS", "ENVIADO"
  ]);
}


function obtenerHojaPush_(nombre, encabezados) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);
  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
  }
  return hoja;
}


function listarDispositivosPush_() {
  const hoja = obtenerHojaDispositivosPush_();
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 7).getDisplayValues().map(function(fila, indice) {
    return {
      fila: indice + 2,
      servidorId: normalizarIdServidor_(fila[1]),
      token: String(fila[2] || "").trim(),
      activo: String(fila[4] || "").trim().toUpperCase() === "SI"
    };
  });
}


function desactivarDispositivoPush_(fila) {
  const hoja = obtenerHojaDispositivosPush_();
  hoja.getRange(fila, 5).setValue("NO");
  hoja.getRange(fila, 7).setValue(new Date());
}


function listarEnviosPush_() {
  const hoja = obtenerHojaEnviosPush_();
  const resultado = {};
  if (hoja.getLastRow() < 2) return resultado;
  hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getDisplayValues().forEach(function(fila) {
    resultado[String(fila[0] || "").trim().toUpperCase()] = true;
  });
  return resultado;
}


function marcarPushContenidoEnviado_(id, tipo, destinatarios) {
  const hoja = obtenerHojaEnviosPush_();
  const existente = listarEnviosPush_();
  if (!existente[String(id || "").trim().toUpperCase()]) {
    hoja.appendRow([id, tipo, destinatarios, new Date()]);
  }
}
