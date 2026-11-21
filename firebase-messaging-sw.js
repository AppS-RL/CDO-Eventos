importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
importScripts("./js/firebase-config.js");

if (self.CDO_FIREBASE_CONFIG && self.CDO_FIREBASE_CONFIG.firebaseConfig) {
    firebase.initializeApp(self.CDO_FIREBASE_CONFIG.firebaseConfig);
    const mensajeria = firebase.messaging();

    mensajeria.onBackgroundMessage(function (mensaje) {
        const datos = mensaje.data || {};
        return self.registration.showNotification(datos.titulo || "CDO Servidores", {
            body: datos.descripcion || "Tienes una nueva notificación.",
            icon: "./assets/icons/jovenes-18-plus-192.png",
            badge: "./assets/icons/jovenes-18-plus-192.png",
            data: { url: datos.url || "./?preview=servidores" }
        });
    });
}

self.addEventListener("notificationclick", function (evento) {
    evento.notification.close();
    const destino = evento.notification?.data?.url || "./?preview=servidores";
    evento.waitUntil(clients.openWindow(destino));
});
