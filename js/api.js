const API_URL =
    "https://script.google.com/macros/s/AKfycbxmQ0I6-EazBUQtOgxoaxlEl5YjCMDrohjiKjw86LEeXOwRCsBjGDSVH-QoO8YuL7s6/exec";


async function llamarAPI(accion, datos = {}) {
    const respuesta = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            accion: accion,
            ...datos
        })
    });

    if (!respuesta.ok) {
        throw new Error(
            `Error de comunicación: ${respuesta.status}`
        );
    }

    return await respuesta.json();
}


async function listarEventosAPI() {
    return llamarAPI("listarEventos");
}


async function registrarAsistenteAPI(
    datos,
    evento = "NAV26"
) {
    return llamarAPI("registrarAsistente", {
        datos: datos,
        evento: evento
    });
}


async function buscarAsistenteAPI(
    id,
    evento
) {
    return llamarAPI("buscarAsistente", {
        id: id,
        evento: evento
    });
}


async function listarAsistentesAPI(
    evento = "NAV26"
) {
    return llamarAPI("listarAsistentes", {
        evento: evento
    });
}


async function registrarAbonoAPI(
    id,
    monto,
    evento
) {
    return llamarAPI("registrarAbono", {
        id: id,
        monto: monto,
        evento: evento
    });
}


async function obtenerHistorialPagosAPI(
    id,
    evento
) {
    return llamarAPI("obtenerHistorialPagos", {
        id: id,
        evento: evento
    });
}


async function registrarMovimientoServidorAPI(
    id,
    tipo,
    monto,
    concepto
) {
    return llamarAPI("registrarMovimientoServidor", {
        id: id,
        tipo: tipo,
        monto: monto,
        concepto: concepto
    });
}


async function obtenerMovimientosServidorAPI(id) {
    return llamarAPI("obtenerMovimientosServidor", {
        id: id
    });
}


async function obtenerTotalRecibidoHoyAPI(evento) {
    return llamarAPI("obtenerTotalRecibidoHoy", {
        evento: evento
    });
}


async function obtenerCopaGolDeFeAPI(categoria) {
    return llamarAPI("obtenerCopaGolDeFe", {
        categoria: categoria
    });
}


async function registrarEquipoCopaAPI(
    categoria,
    nombre,
    jugadores
) {
    return llamarAPI("registrarEquipoCopa", {
        categoria: categoria,
        nombre: nombre,
        jugadores: jugadores
    });
}


async function eliminarEquipoCopaAPI(
    categoria,
    equipoId
) {
    return llamarAPI("eliminarEquipoCopa", {
        categoria: categoria,
        equipoId: equipoId
    });
}


async function generarTorneoCopaAPI(categoria) {
    return llamarAPI("generarTorneoCopa", {
        categoria: categoria
    });
}


async function registrarGanadorCopaAPI(
    categoria,
    partidoId,
    equipoId
) {
    return llamarAPI("registrarGanadorCopa", {
        categoria: categoria,
        partidoId: partidoId,
        equipoId: equipoId
    });
}


async function registrarServicioAPI(
    tipo,
    id,
    evento
) {
    return llamarAPI("registrarServicio", {
        tipo: tipo,
        id: id,
        evento: evento
    });
}


async function editarAsistenteAPI(
    id,
    datos,
    evento
) {
    return llamarAPI("editarAsistente", {
        id: id,
        datos: datos,
        evento: evento
    });
}


async function eliminarAsistenteAPI(
    id,
    evento
) {
    return llamarAPI("eliminarAsistente", {
        id: id,
        evento: evento
    });
}


async function activarAccesoServidorAPI(
    id,
    ultimosTelefono,
    pin
) {
    return llamarAPI("activarAccesoServidor", {
        id: id,
        ultimosTelefono: ultimosTelefono,
        pin: pin
    });
}


async function iniciarSesionServidorAPI(id, pin) {
    return llamarAPI("iniciarSesionServidor", {
        id: id,
        pin: pin
    });
}


async function validarSesionServidorAPI(token) {
    return llamarAPI("validarSesionServidor", {
        token: token
    });
}


async function cerrarSesionServidorAPI(token) {
    return llamarAPI("cerrarSesionServidor", {
        token: token
    });
}


async function obtenerContenidoServidorAPI(token) {
    return llamarAPI("obtenerContenidoServidor", {
        token: token
    });
}


async function marcarActividadServidorAPI(
    token,
    contenidoId,
    completada
) {
    return llamarAPI("marcarActividadServidor", {
        token: token,
        contenidoId: contenidoId,
        completada: completada
    });
}


async function marcarContenidoVistoServidorAPI(token, contenidoId) {
    return llamarAPI("marcarContenidoVistoServidor", {
        token: token,
        contenidoId: contenidoId
    });
}


async function obtenerGestionServidorAPI(token) {
    return llamarAPI("obtenerGestionServidor", {
        token: token
    });
}


async function solicitarPermisoServidorAPI(token, datos) {
    return llamarAPI("solicitarPermisoServidor", {
        token: token,
        datos: datos
    });
}


async function responderCoberturaServidorAPI(
    token,
    permisoId,
    respuesta
) {
    return llamarAPI("responderCoberturaServidor", {
        token: token,
        permisoId: permisoId,
        respuesta: respuesta
    });
}


async function resolverPermisoServidorAPI(
    token,
    permisoId,
    decision,
    aprobador
) {
    return llamarAPI("resolverPermisoServidor", {
        token: token,
        permisoId: permisoId,
        decision: decision,
        aprobador: aprobador
    });
}


async function cancelarPermisoServidorAPI(token, permisoId) {
    return llamarAPI("cancelarPermisoServidor", {
        token: token,
        permisoId: permisoId
    });
}


async function guardarListaAsistenciaServidorAPI(
    token,
    servicioId,
    registros
) {
    return llamarAPI("guardarListaAsistenciaServidor", {
        token: token,
        servicioId: servicioId,
        registros: registros
    });
}


async function publicarAvisoAreaServidorAPI(token, datos) {
    return llamarAPI("publicarAvisoAreaServidor", {
        token: token,
        datos: datos
    });
}


async function publicarContenidoDirigidoServidorAPI(token, datos) {
    return llamarAPI("publicarContenidoDirigidoServidor", {
        token: token,
        datos: datos
    });
}


async function marcarNotificacionesServidorAPI(token, notificacionIds) {
    return llamarAPI("marcarNotificacionesServidor", {
        token: token,
        notificacionIds: notificacionIds
    });
}


async function registrarPushServidorAPI(token, tokenDispositivo, dispositivo) {
    return llamarAPI("registrarPushServidor", {
        token: token,
        tokenDispositivo: tokenDispositivo,
        dispositivo: dispositivo
    });
}


async function actualizarOrganizacionServidorAPI(token, datos) {
    return llamarAPI("actualizarOrganizacionServidor", {
        token: token,
        datos: datos
    });
}


async function actualizarSaludServidorAPI(token, datos) {
    return llamarAPI("actualizarSaludServidor", {
        token: token,
        datos: datos
    });
}

