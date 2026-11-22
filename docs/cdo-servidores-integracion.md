# Integración de CDO Servidores

El repositorio no contiene el archivo central `Code.gs` del despliegue de
Google Apps Script. Para habilitar el acceso personal, copia
`apps-script/Servidores.gs` al proyecto de Apps Script y agrega estas rutas al
distribuidor de acciones existente:

```javascript
case "activarAccesoServidor":
  return activarAccesoServidor(
    datos.id,
    datos.ultimosTelefono,
    datos.pin
  );

case "iniciarSesionServidor":
  return iniciarSesionServidor(datos.id, datos.pin);

case "validarSesionServidor":
  return validarSesionServidor(datos.token);

case "cerrarSesionServidor":
  return cerrarSesionServidor(datos.token);

case "obtenerGestionServidor":
  return obtenerGestionServidor(datos.token);

case "marcarNotificacionesServidor":
  return marcarNotificacionesServidor(
    datos.token,
    datos.notificacionIds
  );

case "marcarContenidoVistoServidor":
  return marcarContenidoVistoServidor(
    datos.token,
    datos.contenidoId
  );

case "publicarContenidoDirigidoServidor":
  return publicarContenidoDirigidoServidor(
    datos.token,
    datos.datos
  );

case "actualizarSaludServidor":
  return actualizarSaludServidor(
    datos.token,
    datos.datos
  );
```

Después se debe crear una nueva versión del despliegue web de Apps Script. La
primera activación válida crea automáticamente la hoja `AccesosServidores`.
Esta hoja guarda hashes del PIN y de la sesión; no guarda el PIN ni el token en
texto legible.
La primera consulta de gestión también crea `NotificacionesLeidasServidores`,
que sólo conserva el usuario, el identificador de la notificación y la fecha de
lectura.

Las predicaciones y actividades dirigidas guardan sus destinatarios en
`ContenidoServidores`. La apertura y el estado de finalización se registran en
`ProgresoServidores`; esto permite mostrar a pastores y administradores las
listas de quienes ya abrieron cada publicación y quienes siguen pendientes.

El pase de lista está autorizado únicamente para pastores, administradores y
`SERVIDOR-0030` (Nadine Odette Luis Barbosa). Los capitanes conservan la
gestión de permisos y avisos de su equipo, pero no registran asistencia ni
acceden al directorio general.

El ahorro propio se obtiene del saldo existente del servidor. La información
médica no se entrega al perfil individual: sólo se incluye en el directorio
general consultado por pastores y administrador. Únicamente el administrador
puede modificar condiciones médicas, alergias y enfermedades.

## Notificaciones push

El cliente registra el token del dispositivo mediante `registrarPushServidor`.
Las credenciales privadas de Firebase nunca se guardan en el repositorio: se
configuran como propiedades privadas del proyecto de Apps Script con las claves
`FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL` y `FCM_PRIVATE_KEY`. El navegador sólo
recibe la configuración pública y la clave VAPID.
