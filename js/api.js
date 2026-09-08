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
    evento = "SEP26"
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
    evento = "SEP26"
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
    id
) {
    return llamarAPI("registrarServicio", {
        tipo: tipo,
        id: id
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


async function eliminarAsistenteAPI(id) {
    return llamarAPI("eliminarAsistente", {
        id: id
    });
}

