let eventosDisponibles = [];

let codigoEventoSeleccionado =
    sessionStorage.getItem("cdoEventoSeleccionado") ||
    "SEP26";


async function cargarEventosDisponibles() {
    const respuesta = await listarEventosAPI();

    if (
        !respuesta ||
        !respuesta.ok ||
        !Array.isArray(respuesta.eventos)
    ) {
        throw new Error(
            "No fue posible cargar los eventos."
        );
    }

    eventosDisponibles = respuesta.eventos;

    const existeEventoSeleccionado =
        eventosDisponibles.some(evento =>
            evento.codigo === codigoEventoSeleccionado
        );

    if (!existeEventoSeleccionado) {
        codigoEventoSeleccionado =
            eventosDisponibles[0]?.codigo || "SEP26";
    }

    return eventosDisponibles;
}


function cambiarEventoSeleccionado(codigo) {
    codigoEventoSeleccionado = String(codigo || "")
        .trim()
        .toUpperCase();

    sessionStorage.setItem(
        "cdoEventoSeleccionado",
        codigoEventoSeleccionado
    );
}


function obtenerEventoSeleccionado() {
    return eventosDisponibles.find(evento =>
        evento.codigo === codigoEventoSeleccionado
    ) || null;
}

async function prepararSelectorEvento(
    idSelector,
    alCambiar
) {
    const selector =
        document.getElementById(idSelector);

    if (!selector) {
        return;
    }

    if (!eventosDisponibles.length) {
        await cargarEventosDisponibles();
    }

    selector.innerHTML = "";

    eventosDisponibles.forEach(evento => {
        const opcion = document.createElement("option");

        opcion.value = evento.codigo;
        opcion.textContent = evento.nombre;

        if (
            evento.codigo ===
            codigoEventoSeleccionado
        ) {
            opcion.selected = true;
        }

        selector.appendChild(opcion);
    });

    selector.disabled = false;

    selector.addEventListener("change", () => {
        cambiarEventoSeleccionado(selector.value);

        if (typeof alCambiar === "function") {
            alCambiar();
        }
    });
}

function obtenerEventoDeRegistro(registro) {
    const codigo = String(
        registro?.evento || ""
    ).toUpperCase();

    const porCodigo = eventosDisponibles.find(
        evento => evento.codigo === codigo
    );

    if (porCodigo) {
        return porCodigo;
    }

    const id = String(registro?.id || "")
        .toUpperCase();

    return eventosDisponibles.find(evento =>
        id.startsWith(evento.codigo + "-") ||
        id.startsWith(evento.prefijo + "-")
    ) || obtenerEventoSeleccionado();
}

