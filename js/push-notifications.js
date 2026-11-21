let mensajeriaPushServidor = null;
let registroPushServidor = null;
let escuchaPushServidorConfigurada = false;


function pushServidorConfigurado() {
    const configuracion = window.CDO_FIREBASE_CONFIG || {};
    return Boolean(
        configuracion.firebaseConfig &&
        configuracion.vapidKey &&
        window.firebase &&
        "serviceWorker" in navigator &&
        "Notification" in window
    );
}


function obtenerEstadoPushServidor() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        return {
            estado: "NO_COMPATIBLE",
            titulo: "Este navegador no admite notificaciones",
            descripcion: "La campana dentro del portal seguirá funcionando."
        };
    }

    if (!pushServidorConfigurado()) {
        return {
            estado: "CONFIGURANDO",
            titulo: "Notificaciones del teléfono",
            descripcion: "La activación estará disponible al terminar la configuración."
        };
    }

    if (Notification.permission === "granted") {
        return {
            estado: "ACTIVAS",
            titulo: "Notificaciones activadas",
            descripcion: "Este teléfono recibirá permisos, coberturas, avisos y predicaciones."
        };
    }

    if (Notification.permission === "denied") {
        return {
            estado: "BLOQUEADAS",
            titulo: "Notificaciones bloqueadas",
            descripcion: "Puedes permitirlas desde la configuración del navegador."
        };
    }

    return {
        estado: "DISPONIBLES",
        titulo: "Recibe avisos en este teléfono",
        descripcion: "Actívalas una sola vez en cada teléfono que utilices."
    };
}


async function prepararMensajeriaPushServidor() {
    if (!pushServidorConfigurado()) {
        throw new Error("Las notificaciones todavía no están configuradas.");
    }

    const configuracion = window.CDO_FIREBASE_CONFIG;

    if (!firebase.apps.length) {
        firebase.initializeApp(configuracion.firebaseConfig);
    }

    registroPushServidor = registroPushServidor ||
        await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    mensajeriaPushServidor = mensajeriaPushServidor || firebase.messaging();

    return { configuracion, registro: registroPushServidor };
}


async function activarPushServidor(tokenSesion) {
    const permiso = await Notification.requestPermission();

    if (permiso !== "granted") {
        throw new Error(
            permiso === "denied"
                ? "Las notificaciones quedaron bloqueadas en este navegador."
                : "No se activaron las notificaciones."
        );
    }

    return sincronizarPushServidor(tokenSesion);
}


async function sincronizarPushServidor(tokenSesion) {
    if (!pushServidorConfigurado() || Notification.permission !== "granted") {
        return null;
    }

    const preparado = await prepararMensajeriaPushServidor();
    const tokenDispositivo = await mensajeriaPushServidor.getToken({
        vapidKey: preparado.configuracion.vapidKey,
        serviceWorkerRegistration: preparado.registro
    });

    if (!tokenDispositivo) {
        throw new Error("No fue posible identificar este teléfono.");
    }

    const respuesta = await registrarPushServidorAPI(
        tokenSesion,
        tokenDispositivo,
        navigator.userAgent
    );

    if (!respuesta?.ok) {
        throw new Error(respuesta?.mensaje || "No fue posible guardar este teléfono.");
    }

    if (!escuchaPushServidorConfigurada) {
        escuchaPushServidorConfigurada = true;
        mensajeriaPushServidor.onMessage(async mensaje => {
            const datos = mensaje?.data || {};
            const registro = await navigator.serviceWorker.ready;
            await registro.showNotification(datos.titulo || "CDO Servidores", {
                body: datos.descripcion || "Tienes una nueva notificación.",
                icon: "./assets/icons/jovenes-18-plus-192.png",
                badge: "./assets/icons/jovenes-18-plus-192.png",
                data: { url: datos.url || "./?preview=servidores" }
            });
        });
    }

    return respuesta;
}
