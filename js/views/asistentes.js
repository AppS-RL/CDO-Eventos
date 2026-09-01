function mostrarAsistentes() {

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p>Sin Cadenas 2026</p>

            </header>

            <main class="app-content">

                <div class="app-card">

                    <h2>👥 Asistentes</h2>

                    <br>



                    <button
                        id="btnListaAsistentes"
                        class="boton">

                        📋 Lista de asistentes

                    </button>

                    <button
                        id="btnNuevoAsistente"
                        class="boton principal">

                        ➕ Nuevo asistente

                    </button>

                </div>

            </main>

            <nav class="bottom-nav">

<button
    id="navAsistentes"
    class="nav-item nav-activo">
    👥
</button>

<button
    id="navDashboard"
    class="nav-item">
    📊
</button>

<button
    id="navConfiguracion"
    class="nav-item">
    ⚙️
</button>

            </nav>

        </div>

    `;

    document
        .getElementById("btnNuevoAsistente")
        .addEventListener(
            "click",
            () => mostrarFormularioAsistente()
        );



    document
    .getElementById("btnListaAsistentes")
    .addEventListener(
        "click",
        mostrarListaAsistentes
    );

    document
    .getElementById("navDashboard")
    .addEventListener(
        "click",
        mostrarDashboard
    );

    document
    .getElementById("navConfiguracion")
    .addEventListener(
        "click",
        mostrarConfiguracion
    );

}

function mostrarFormularioAsistente(asistente = null) {
    const app = document.getElementById("app");

    const esEdicion = Boolean(asistente);

    const eventoActual =
        eventosDisponibles.find(evento =>
            evento.codigo ===
            (asistente?.evento ||
            codigoEventoSeleccionado)
        ) || {
            codigo: "SEP26",
            nombre: "Sin Cadenas 2026",
            costo: 400,
            tipo: "evento"
        };

    const esAhorro =
        eventoActual.tipo === "ahorro";

    const etiquetaMonto = esAhorro
        ? "Ahorro inicial"
        : "Abono inicial";

    const textoMonto = esAhorro
        ? "Monto opcional para iniciar el ahorro"
        : "Costo $" + Number(
            eventoActual.costo
        ).toLocaleString("es-MX");

    if (
        esEdicion &&
        eventoActual.codigo !== "SEP26"
    ) {
        alert(
            "La edición de este evento se agregará " +
            "en el siguiente paso."
        );

        mostrarListaAsistentes();
        return;
    }

    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p>
                    ${eventoActual.nombre}
                </p>

            </header>

            <main class="app-content">

                <div class="app-card">

                    <div class="form-header">

                        <h2>
                            ${
                                esEdicion
                                    ? "✏️ Editar asistente"
                                    : esAhorro
                                        ? "➕ Nuevo servidor"
                                        : "➕ Nuevo asistente"
                            }
                        </h2>

                        <p>
                            ${
                                esEdicion
                                    ? "Actualiza sus datos y corrige el total pagado si es necesario."
                                    : "Ingresa los datos para generar su registro y código QR."
                            }
                        </p>

                    </div>

                    <form
                        id="formAsistente"
                        class="form-asistente"
                    >

                        <div class="campo">

                            <label for="nombre">
                                Nombre completo *
                            </label>

                            <input
                                id="nombre"
                                type="text"
                                required
                                autocomplete="name"
                                placeholder="Ej. Juan Pérez"
                            >

                        </div>

                        <div class="campo">

                            <label for="telefono">
                                Teléfono
                            </label>

                            <input
                                id="telefono"
                                type="tel"
                                inputmode="tel"
                                autocomplete="tel"
                                placeholder="Ej. 3312345678"
                            >

                        </div>

                        <div class="campo">

                            <label for="edad">
                                Edad
                            </label>

                            <input
                                id="edad"
                                type="number"
                                min="1"
                                max="120"
                                inputmode="numeric"
                                placeholder="Ej. 18"
                            >

                        </div>

                        <div class="campo">

                            <label for="observaciones">
                                Observaciones
                            </label>

                            <textarea
                                id="observaciones"
                                rows="3"
                                placeholder="Opcional"
                            ></textarea>

                        </div>

                        <div class="campo">

                            <label for="abonoInicial">
                                ${etiquetaMonto}
                            </label>

                            <input
                                id="abonoInicial"
                                type="number"
                                min="0"
                                ${
                                    esAhorro
                                        ? ""
                                        : `max="${eventoActual.costo}"`
                                }
                                step="0.01"
                                inputmode="decimal"
                                placeholder="${textoMonto}"
                            >

                        </div>

                        <button
                            id="btnGuardar"
                            type="submit"
                            class="boton principal"
                        >
                            ${
                                esEdicion
                                    ? "Guardar cambios"
                                    : "Guardar y generar QR"
                            }
                        </button>

                        <button
                            id="btnCancelar"
                            type="button"
                            class="boton"
                        >
                            ← Cancelar
                        </button>

                    </form>

                </div>

            </main>

        </div>

    `;

    if (esEdicion) {
        document.getElementById("nombre").value =
            asistente.nombre || "";

        document.getElementById("telefono").value =
            asistente.telefono || "";

        document.getElementById("edad").value =
            asistente.edad || "";

        document.getElementById("observaciones").value =
            asistente.observaciones || "";

        document
            .querySelector('label[for="abonoInicial"]')
            .textContent = "Total pagado";

        document.getElementById("abonoInicial").value =
            Number(asistente.pagado || 0).toFixed(2);
    }

    document
        .getElementById("btnCancelar")
        .addEventListener(
            "click",
            mostrarAsistentes
        );

    document
        .getElementById("formAsistente")
        .addEventListener(
            "submit",
            esEdicion
                ? evento => guardarEdicionAsistente(
                    evento,
                    asistente.id
                )
                : guardarNuevoAsistente
        );
}


async function guardarNuevoAsistente(evento) {

    evento.preventDefault();

    const boton = document.getElementById("btnGuardar");

const datos = {

    nombre:
        document.getElementById("nombre").value.trim(),

    telefono:
        document.getElementById("telefono").value.trim(),

    edad:
        document.getElementById("edad").value.trim(),

    observaciones:
        document.getElementById("observaciones").value.trim(),

    abonoInicial:
        document.getElementById("abonoInicial").value.trim()

};


    if (!datos.nombre) {

        alert("El nombre es obligatorio.");
        return;

    }


    try {

        boton.disabled = true;
        boton.textContent = "Guardando...";

        const resultado =
            await registrarAsistenteAPI(
    datos,
    codigoEventoSeleccionado
);


        if (!resultado.ok) {

            throw new Error(
                resultado.mensaje ||
                "No fue posible registrar al asistente."
            );

        }


        mostrarRegistroExitoso(
            resultado.asistente
        );


    } catch (error) {

        console.error(error);

        alert(
            "No fue posible registrar al asistente.\n\n" +
            error.message
        );

        boton.disabled = false;
        boton.textContent = "Guardar asistente";

    }

}

function mostrarRegistroExitoso(asistente) {

        const evento =
        obtenerEventoDeRegistro(asistente) || {
            nombre: "Sin Cadenas 2026",
            tipo: "evento"
        };

    const esAhorro =
        evento.tipo === "ahorro";

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p>${evento.nombre}</p>

            </header>


            <main class="app-content">

                <div class="app-card registro-exitoso">


                    <div class="icono-exito">
                        ✓
                    </div>


                    <h2>
                        ¡Registro exitoso!
                    </h2>


                    <p>
                        ${escaparHTML(asistente.nombre)}
                    </p>


                    <p class="id-label">
                        ${esAhorro ? "ID DEL SERVIDOR" : "ID DEL ASISTENTE"}
                    </p>


                    <div class="id-asistente">

                        ${escaparHTML(asistente.id)}

                    </div>


                    <div class="qr-container">

                        <img
                            src="${asistente.qr}"
                            alt="Código QR"
                        >

                    </div>


                    <p>
                        Guarda o comparte este código
                        para utilizarlo el día del evento.
                    </p>


                    <div class="acciones-registro">

                        <button
                            id="btnCompartirQR"
                            class="boton principal"
                        >
                            📤 Compartir QR
                        </button>

                        <button
                            id="btnEnviarQR"
                            class="boton"
                        >
                            📲 Enviar QR
                        </button>

                        ${
    esAhorro
        ? ""
        : `
            <button
                id="btnEnviarHistorial"
                class="boton"
            >
                🧾 Enviar historial
            </button>
          `
}

                        <button
                            id="btnRegistrarOtro"
                            class="boton"
                        >
                            ➕ Registrar otro
                        </button>


                        <button
                            id="btnVolverAsistentes"
                            class="boton"
                        >
                            ← Volver a asistentes
                        </button>

                    </div>

                </div>

            </main>

        </div>

    `;


    document
        .getElementById("btnRegistrarOtro")
        .addEventListener(
            "click",
            () => mostrarFormularioAsistente()
        );


    document
        .getElementById("btnVolverAsistentes")
        .addEventListener(
            "click",
            mostrarAsistentes
        );


    document
        .getElementById("btnCompartirQR")
        .addEventListener("click", () => {

            compartirQR(asistente);

        });

    document
    .getElementById("btnEnviarQR")
    .addEventListener("click", () => {

        const telefono =
            String(
                asistente.telefono || ""
            )
            .replace(/\D/g, "");

        if (!telefono) {

            alert(
                "Este asistente no tiene un teléfono registrado."
            );

            return;
        }

        const qr =
            "https://quickchart.io/qr?text=" +
            encodeURIComponent(asistente.id) +
            "&size=500";

        const mensaje =
            "Hola " +
            asistente.nombre +
            " 👋\n\n" +
            "Este es tu registro para " +
            evento.nombre +
            ".\n\n" +
            "🆔 ID: " +
            asistente.id +
            "\n\n" +
            "📲 Tu código QR:\n" +
            qr +
            "\n\n" +
            "💾 Guarda también la imagen de tu QR en tu teléfono para utilizarla el día del evento.";

        const url =
            "https://wa.me/" +
            telefono +
            "?text=" +
            encodeURIComponent(mensaje);

        window.open(
            url,
            "_blank"
        );

    });

    if (!esAhorro) {
    document
        .getElementById("btnEnviarHistorial")
        .addEventListener("click", () => {
            enviarHistorialPorWhatsApp(asistente);
        });
}


}


async function guardarEdicionAsistente(evento, id) {

    evento.preventDefault();

    const boton = document.getElementById("btnGuardar");

    const datos = {
        nombre: document.getElementById("nombre").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        edad: document.getElementById("edad").value.trim(),
        observaciones:
            document.getElementById("observaciones").value.trim(),
        totalPagado:
            document.getElementById("abonoInicial").value.trim()
    };

    if (!datos.nombre) {
        alert("El nombre es obligatorio.");
        return;
    }

    try {

        boton.disabled = true;
        boton.textContent = "Guardando...";

        const resultado = await editarAsistenteAPI(id, datos);

        if (!resultado.ok) {
            throw new Error(
                resultado.mensaje ||
                "No fue posible actualizar al asistente."
            );
        }

        alert("Datos actualizados correctamente.");

        mostrarListaAsistentes();

    } catch (error) {

        console.error(error);

        alert(
            "No fue posible actualizar al asistente.\n\n" +
            error.message
        );

        boton.disabled = false;
        boton.textContent = "Guardar cambios";

    }

}

async function enviarHistorialPorWhatsApp(asistente) {
    const telefono = String(
        asistente.telefono || ""
    ).replace(/\D/g, "");

    if (!telefono) {
        alert(
            "Este asistente no tiene un teléfono registrado."
        );
        return;
    }

    const evento =
        obtenerEventoDeRegistro(asistente) || {
            codigo: "SEP26",
            nombre: "Sin Cadenas 2026",
            costo: 400
        };

    try {
        const resultado =
            await obtenerHistorialPagosAPI(
                asistente.id,
                evento.codigo
            );

        if (!resultado.ok) {
            throw new Error(
                resultado.mensaje ||
                "No fue posible obtener el historial."
            );
        }

        const pagos = resultado.pagos || [];

        const costoEvento =
            Number(asistente.costo || evento.costo || 0);

        const totalPagado =
            Number(asistente.pagado || 0);

        const saldo = Math.max(
            0,
            costoEvento - totalPagado
        );

        let mensaje =
            "Hola " + asistente.nombre + " 👋\n\n" +
            "Este es tu historial de pagos de " +
            evento.nombre + ".\n\n" +
            "🆔 ID: " + asistente.id + "\n\n" +
            "💰 Costo del evento: $" +
            costoEvento.toFixed(2) +
            "\n\n📋 Pagos realizados:\n\n";

        if (pagos.length === 0) {
            mensaje +=
                "📋 No hay abonos registrados actualmente.\n\n";

        } else {
            pagos.forEach(pago => {
                mensaje +=
                    "• " +
                    formatearFechaPago(pago.fecha) +
                    " — Abono: $" +
                    Number(pago.abono || 0)
                        .toFixed(2) +
                    "\n";
            });

            mensaje += "\n";
        }

        mensaje +=
            "✅ Total pagado: $" +
            totalPagado.toFixed(2) +
            "\n" +
            "💳 Saldo pendiente: $" +
            saldo.toFixed(2) +
            "\n\nGracias por tu participación en " +
            evento.nombre + ".";

        window.open(
            "https://wa.me/" +
            telefono +
            "?text=" +
            encodeURIComponent(mensaje),
            "_blank"
        );

    } catch (error) {
        console.error(error);

        alert(
            "No fue posible enviar el historial.\n\n" +
            error.message
        );
    }
}

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

async function compartirQR(asistente) {

        const evento =
        obtenerEventoDeRegistro(asistente) || {
            nombre: "Sin Cadenas 2026"
        };

    const texto =
    `${evento.nombre}\n` +
        `${asistente.nombre}\n` +
        `ID: ${asistente.id}`;

    const qr =
        asistente.qr ||
        "https://quickchart.io/qr?text=" +
        encodeURIComponent(asistente.id) +
        "&size=500";

    try {

        // Descargar temporalmente la imagen del QR
        const respuesta = await fetch(qr);

        if (!respuesta.ok) {
            throw new Error("No fue posible obtener el código QR.");
        }

        const blob = await respuesta.blob();

        // Convertir la imagen en un archivo compartible
        const archivoQR = new File(
            [blob],
            `QR-${asistente.id}.png`,
            {
                type: blob.type || "image/png"
            }
        );

        // Intentar compartir la imagen
        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
                files: [archivoQR]
            })
        ) {

            try {

                await navigator.share({
                    title: evento.nombre,
                    text: texto,
                    files: [archivoQR]
                });

                return;

            } catch (error) {

                if (error.name === "AbortError") {
                    return;
                }

                console.error(
                    "Error al compartir:",
                    error
                );

            }

        }

        // Si el navegador no puede compartir archivos,
        // descargar el QR
        descargarQR(
            blob,
            asistente.id
        );

    } catch (error) {

        console.error(
            "Error preparando el QR:",
            error
        );

        // Último respaldo:
        // abrir el QR directamente
        window.open(
            qr,
            "_blank"
        );

    }

}

function descargarQR(blob, id) {

    const urlTemporal =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = urlTemporal;

    enlace.download =
        `QR-${id}.png`;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(
        urlTemporal
    );

}

function mostrarBuscarAsistente() {

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p>Sin Cadenas 2026</p>

            </header>


            <main class="app-content">

                <div class="app-card">

                    <div class="form-header">

                        <h2>🔍 Buscar asistente</h2>

                        <p>
                            Ingresa el ID asignado al asistente.
                        </p>

                    </div>


                    <form
                        id="formBuscarAsistente"
                        class="form-asistente"
                    >

                        <div class="campo">

                            <label for="buscarID">
                                ID del asistente
                            </label>

                            <input
                                id="buscarID"
                                type="text"
                                placeholder="Ej. SEP26-0018"
                                autocomplete="off"
                                required
                            >

                        </div>


                        <button
                            id="btnBuscar"
                            type="submit"
                            class="boton principal"
                        >
                            🔍 Buscar
                        </button>


                        <button
                            id="btnCancelarBusqueda"
                            type="button"
                            class="boton"
                        >
                            ← Volver
                        </button>

                    </form>


                    <div id="resultadoBusqueda"></div>

                </div>

            </main>

        </div>

    `;


    document
        .getElementById("btnCancelarBusqueda")
        .addEventListener(
            "click",
            mostrarAsistentes
        );


    document
        .getElementById("formBuscarAsistente")
        .addEventListener(
            "submit",
            ejecutarBusquedaAsistente
        );


    document
        .getElementById("buscarID")
        .focus();

}

async function ejecutarBusquedaAsistente(evento) {

    evento.preventDefault();

    const input =
        document.getElementById("buscarID");

    const boton =
        document.getElementById("btnBuscar");

    const resultado =
        document.getElementById("resultadoBusqueda");


    const id =
        input.value
            .trim()
            .toUpperCase();


    if (!id) {
        return;
    }


    try {

        boton.disabled = true;
        boton.textContent = "Buscando...";

        resultado.innerHTML = "";


        const respuesta =
            await buscarAsistenteAPI(id);


        if (!respuesta.ok) {

            resultado.innerHTML = `

                <div class="mensaje-busqueda error-busqueda">

                    <strong>
                        Asistente no encontrado
                    </strong>

                    <p>
                        Revisa el ID e intenta nuevamente.
                    </p>

                </div>

            `;

            return;

        }


        mostrarResultadoAsistente(
            respuesta.asistente
        );


    } catch (error) {

        console.error(error);

        resultado.innerHTML = `

            <div class="mensaje-busqueda error-busqueda">

                <strong>
                    Error de conexión
                </strong>

                <p>
                    No fue posible consultar al asistente.
                </p>

            </div>

        `;


    } finally {

        boton.disabled = false;
        boton.textContent = "🔍 Buscar";

    }

}

function mostrarResultadoAsistente(asistente) {

        const resultado =
        document.getElementById(
            "resultadoBusqueda"
        );
        
        const evento =
        obtenerEventoDeRegistro(asistente) || {
            codigo: "SEP26",
            nombre: "Sin Cadenas 2026",
            costo: 400,
            tipo: "evento"
        };

    const costoEvento =
        Number(asistente.costo || evento.costo || 0);


    resultado.innerHTML = `

        <div class="resultado-asistente">

            <div class="resultado-icono">
                👤
            </div>


            <h2>
                ${escaparHTML(asistente.nombre)}
            </h2>


            <div class="resultado-id">
                ${escaparHTML(asistente.id)}
            </div>


            <div class="datos-asistente">

                <div>

                    <span>📞 Teléfono</span>

                    <strong>
                        ${
                            asistente.telefono
                                ? escaparHTML(asistente.telefono)
                                : "Sin teléfono"
                        }
                    </strong>

                </div>


                <div>

                    <span>🎂 Edad</span>

                    <strong>
                        ${
                            asistente.edad
                                ? escaparHTML(asistente.edad) + " años"
                                : "Sin edad"
                        }
                    </strong>

                </div>

            </div>


            <div class="estado-asistente">

                <h3>Estado del asistente</h3>

                ${crearEstadoServicio(
                    "🚪",
                    "Entrada",
                    asistente.entrada,
                    asistente.horaEntrada
                )}

                ${crearEstadoServicio(
                    "🍽️",
                    "Comida",
                    asistente.comida,
                    asistente.horaComida
                )}

                ${crearEstadoServicio(
                    "🍿",
                    "Snack",
                    asistente.snack,
                    asistente.horaSnack
                )}

            </div>


            <div class="pago-asistente">

                <h3>💰 Pago del evento</h3>

                <div class="datos-pago">

                    <div>
                        <span>Costo</span>
                        <strong>$${costoEvento.toFixed(2)}</strong>
                    </div>

                    <div>
                        <span>Pagado</span>
                        <strong>
                            $${Number(asistente.pagado || 0).toFixed(2)}
                        </strong>
                    </div>

                    <div>
                        <span>Saldo</span>
                        <strong>
                            $${Math.max(
                                0,
                               costoEvento - Number(asistente.pagado || 0)
                            ).toFixed(2)}
                        </strong>
                    </div>

                </div>

         <div
             id="historialPagos"
             class="historial-pagos"
         >

          <h4>📋 Historial de pagos</h4>

          <div class="historial-cargando">
             Cargando historial...
          </div>

        </div>

                <button
                    id="btnAbonar"
                    class="boton principal"
                    type="button"
                >
                    💵 Registrar abono
                </button>
                
                <button
                    id="btnEnviarHistorial"
                    class="boton"
                    type="button"
                >
                    🧾 Enviar historial
                </button>

                <button
                    id="btnCompartirQR"
                    class="boton"
                    type="button"
                >
                    📤 Compartir QR
                </button>

                <button
                     id="btnEnviarQR"
                    class="boton"
                    type="button"
                >
                     📲 Enviar QR
                </button>

                <button
                    id="btnEditarAsistente"
                    class="boton"
                    type="button"
                >
                    ✏️ Editar datos
                </button>

                <button
                    id="btnEliminarAsistente"
                    class="boton boton-peligro"
                    type="button"
                >
                    🗑 Eliminar asistente
                </button>

            </div>


        </div>

    `;


    // -------------------------
    // BOTÓN REGISTRAR ABONO
    // -------------------------

    document
        .getElementById("btnAbonar")
        .addEventListener(
            "click",
            async () => {

                const pagadoActual =
                    Number(asistente.pagado || 0);

                const costoEvento =
    Number(asistente.costo || evento.costo || 0);

                const saldo =
                    Math.max(
                        0,
                        costoEvento - pagadoActual
                    );


                if (saldo <= 0) {

                    alert(
                        "Este asistente ya tiene el pago completo."
                    );

                    return;

                }


                const montoTexto =
                    prompt(
                        "¿Cuánto deseas abonar?\n\n" +
                        "Saldo pendiente: $" +
                        saldo.toFixed(2)
                    );


                if (
                    montoTexto === null ||
                    montoTexto.trim() === ""
                ) {
                    return;
                }


                const monto =
                    Number(
                        montoTexto.replace(",", ".")
                    );


                if (
                    !Number.isFinite(monto) ||
                    monto <= 0
                ) {

                    alert(
                        "Ingresa un monto válido."
                    );

                    return;

                }


                if (monto > saldo) {

                    alert(
                        "El abono no puede ser mayor al saldo pendiente de $" +
                        saldo.toFixed(2) +
                        "."
                    );

                    return;

                }


                try {

                    const resultado =
                      await registrarAbonoAPI(
    asistente.id,
    monto,
    evento.codigo
);


                    if (!resultado.ok) {

                        throw new Error(
                            resultado.mensaje ||
                            "No fue posible registrar el abono."
                        );

                    }


                    alert(
                        "Abono registrado correctamente."
                    );


                    // Actualizar los datos mostrados
                    asistente.pagado =
                        resultado.pagado;


                    mostrarResultadoAsistente(
                        asistente
                    );


                } catch (error) {

                    console.error(error);

                    alert(
                        "No fue posible registrar el abono.\n\n" +
                        error.message
                    );

                }

            }
        );

        document
    .getElementById("btnEnviarHistorial")
    .addEventListener(
        "click",
        async () => {

            const telefono =
                String(
                    asistente.telefono || ""
                )
                .replace(/\D/g, "");

            if (!telefono) {

                alert(
                    "Este asistente no tiene un teléfono registrado."
                );

                return;
            }

            try {

                const resultado =
                    await obtenerHistorialPagosAPI(
                    asistente.id,
                    evento.codigo
                    );

                if (!resultado.ok) {

                    throw new Error(
                        resultado.mensaje ||
                        "No fue posible obtener el historial."
                    );

                }

                const pagos =
                    resultado.pagos || [];

                const costoEvento =
                      Number(asistente.costo || evento.costo || 0);

                const totalPagado =
                    Number(
                        asistente.pagado || 0
                    );

                const saldo =
                    Math.max(
                        0,
                        costoEvento - totalPagado
                    );

                let mensaje =
                    "Hola " +
                    asistente.nombre +
                    " 👋\n\n" +
                    "Este es tu historial de pagos de " +
                    evento.nombre +
                    ".\n\n" +
                    "🆔 ID: " +
                    asistente.id +
                    "\n\n" +
                    "💰 Costo del evento: $" +
                    costoEvento.toFixed(2) +
                    "\n\n" +
                    "📋 Pagos realizados:\n\n";

                if (pagos.length === 0) {

                    mensaje +=
                        "📋 No hay abonos registrados actualmente.\n\n";

                } else {

                    pagos.forEach(pago => {

                        mensaje +=
                            "• " +
                            formatearFechaPago(
                                pago.fecha
                            ) +
                            " — Abono: $" +
                            Number(
                                pago.abono || 0
                            ).toFixed(2) +
                            "\n";

                    });

                    mensaje += "\n";
                }

                mensaje +=
                    "✅ Total pagado: $" +
                    totalPagado.toFixed(2) +
                    "\n" +
                    "💳 Saldo pendiente: $" +
                    saldo.toFixed(2) +
                    "\n\n" +
                    "Gracias por tu participación en " +
                    evento.nombre + ".";

                const url =
                    "https://wa.me/" +
                    telefono +
                    "?text=" +
                    encodeURIComponent(mensaje);

                window.open(
                    url,
                    "_blank"
                );

            } catch (error) {

                console.error(error);

                alert(
                    "No fue posible enviar el historial.\n\n" +
                    error.message
                );

            }

        }
    );

    
   document
    .getElementById("btnEnviarQR")
    .addEventListener(
        "click",
        () => {

            const telefono =
                String(
                    asistente.telefono || ""
                )
                .replace(/\D/g, "");


            if (!telefono) {

                alert(
                    "Este asistente no tiene un teléfono registrado."
                );

                return;

            }


            const qr =
                "https://quickchart.io/qr?text=" +
                encodeURIComponent(asistente.id) +
                "&size=500";


            const mensaje =
                "Hola " +
                asistente.nombre +
                " 👋\n\n" +
                "Este es tu registro para Sin Cadenas 2026.\n\n" +
                "🆔 ID: " +
                asistente.id +
                "\n\n" +
                "📲 Tu código QR:\n" +
                qr +
                "\n\n" +
                "💾 Guarda también la imagen de tu QR en tu teléfono para utilizarla el día del evento.";

            const url =
                "https://wa.me/" +
                telefono +
                "?text=" +
                encodeURIComponent(mensaje);


            window.open(
                url,
                "_blank"
            );

        }
    );
    
    document
    .getElementById("btnCompartirQR")
    .addEventListener(
        "click",
        () => {
            compartirQR(asistente);
        }
    );


    document
        .getElementById("btnEditarAsistente")
        .addEventListener(
            "click",
            () => mostrarFormularioAsistente(asistente)
        );


    document
        .getElementById("btnEliminarAsistente")
        .addEventListener(
            "click",
            async () => {

                const confirmar = window.confirm(
                    "¿Eliminar a " + asistente.nombre + "?\n\n" +
                    "También se eliminará su historial de pagos. " +
                    "Esta acción no se puede deshacer."
                );

                if (!confirmar) {
                    return;
                }

                try {

                    const resultado =
                        await eliminarAsistenteAPI(asistente.id);

                    if (!resultado.ok) {
                        throw new Error(
                            resultado.mensaje ||
                            "No fue posible eliminar al asistente."
                        );
                    }

                    alert("Asistente eliminado correctamente.");

                    mostrarListaAsistentes();

                } catch (error) {

                    console.error(error);

                    alert(
                        "No fue posible eliminar al asistente.\n\n" +
                        error.message
                    );

                }

            }
        );

        // -------------------------
    // CARGAR HISTORIAL DE PAGOS
    // -------------------------

   cargarHistorialPagos(
    asistente.id,
    evento.codigo
);

}

async function cargarHistorialPagos(
    id,
    codigoEvento
) {


    const contenedor =
        document.getElementById("historialPagos");


    if (!contenedor) {
        return;
    }


    try {

        const resultado =
            await obtenerHistorialPagosAPI(
    id,
    codigoEvento
);


        if (!resultado.ok) {

            throw new Error(
                resultado.mensaje ||
                "No fue posible cargar el historial."
            );

        }


        const pagos =
            resultado.pagos || [];


        if (pagos.length === 0) {

            contenedor.innerHTML = `

                <h4>📋 Historial de pagos</h4>

                <div class="historial-vacio">

                    Sin pagos registrados.

                </div>

            `;

            return;

        }


        contenedor.innerHTML = `

            <h4>📋 Historial de pagos</h4>

            <div class="lista-historial-pagos">

                ${pagos.map(pago => `

                    <div class="historial-pago">

                        <div class="historial-pago-fecha">

                            ${formatearFechaPago(
                                pago.fecha
                            )}

                        </div>


                        <div class="historial-pago-datos">

                            <div>

                                <span>Abono</span>

                                <strong>
                                    $${Number(
                                        pago.abono || 0
                                    ).toFixed(2)}
                                </strong>

                            </div>


                            <div>

                                <span>Acumulado</span>

                                <strong>
                                    $${Number(
                                        pago.pagado || 0
                                    ).toFixed(2)}
                                </strong>

                            </div>

                        </div>

                    </div>

                `).join("")}

            </div>

        `;


    } catch (error) {

        console.error(error);


        contenedor.innerHTML = `

            <h4>📋 Historial de pagos</h4>

            <div class="historial-error">

                No fue posible cargar el historial.

            </div>

        `;

    }

}

function formatearFechaPago(fecha) {

    if (!fecha) {
        return "Fecha no disponible";
    }


    const fechaObjeto =
        new Date(fecha);


    if (Number.isNaN(fechaObjeto.getTime())) {
        return "Fecha no disponible";
    }


    return fechaObjeto.toLocaleString(
        "es-MX",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function crearEstadoServicio(
    icono,
    nombre,
    registrado,
    hora
) {

    const estado =
        registrado === true;


    return `

        <div class="estado-servicio">

            <div class="estado-nombre">

                <span>${icono}</span>

                <strong>
                    ${nombre}
                </strong>

            </div>


            <div class="
                estado-indicador
                ${estado ? "estado-ok" : "estado-pendiente"}
            ">

                ${
                    estado
                        ? "✓ Registrado"
                        : "○ Pendiente"
                }

            </div>

        </div>

    `;

}

let asistentesLista = [];

let asistentesFiltrados = [];

let paginaAsistentes = 1;

const ASISTENTES_POR_PAGINA = 10;

async function mostrarListaAsistentes() {
    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p id="nombreEventoLista">
                    Cargando evento...
                </p>

            </header>

            <main class="app-content">

                <div class="app-card lista-card">

                    <div class="lista-acciones">

                        <button
                            class="boton lista-accion"
                            type="button"
                            data-lista-accion="volver"
                        >
                            ← Volver
                        </button>

                        <button
                            class="boton principal lista-accion"
                            type="button"
                            data-lista-accion="nuevo"
                        >
                            ＋ Nuevo asistente
                        </button>

                    </div>

                    <div
                        class="paginacion-lista paginacion-lista-superior"
                        data-paginacion-lista
                    ></div>

                    <div class="form-header">

                        <h2 id="tituloListaAsistentes">
                            📋 Lista de asistentes
                        </h2>

                        <p>
                            Consulta los registros del evento.
                        </p>

                    </div>

                    <div class="campo selector-evento-lista">

                        <label for="selectorEventoLista">
                            Evento
                        </label>

                        <select
                            id="selectorEventoLista"
                            disabled
                        >
                            <option>Cargando eventos...</option>
                        </select>

                    </div>

                    <div class="campo buscador-lista">

                        <label for="buscarLista">
                            Buscar
                        </label>

                        <input
                            id="buscarLista"
                            type="search"
                            placeholder="Nombre, ID o teléfono"
                            autocomplete="off"
                        >

                    </div>

                    <div class="lista-resumen">

                        <span id="totalLista">
                            Cargando asistentes...
                        </span>

                    </div>

                    <div id="contenedorLista">

                        <div class="lista-cargando">
                            Cargando...
                        </div>

                    </div>

                    <div
                        class="paginacion-lista"
                        data-paginacion-lista
                    ></div>

                    <div class="lista-acciones lista-acciones-inferiores">

                        <button
                            class="boton lista-accion"
                            type="button"
                            data-lista-accion="volver"
                        >
                            ← Volver
                        </button>

                        <button
                            class="boton principal lista-accion"
                            type="button"
                            data-lista-accion="nuevo"
                        >
                            ＋ Nuevo asistente
                        </button>

                    </div>

                </div>

            </main>

        </div>

    `;

    document
        .querySelectorAll("[data-lista-accion]")
        .forEach(boton => {

            boton.addEventListener("click", () => {

                if (boton.dataset.listaAccion === "nuevo") {
                    mostrarFormularioAsistente();
                    return;
                }

                mostrarAsistentes();

            });

        });

    document
        .getElementById("buscarLista")
        .addEventListener(
            "input",
            filtrarListaAsistentes
        );

    try {
        await prepararSelectorEvento(
            "selectorEventoLista",
            () => {
                paginaAsistentes = 1;
                actualizarEncabezadoLista();
                cargarListaAsistentes();
            }
        );

    } catch (error) {
        console.error(
            "No fue posible cargar eventos:",
            error
        );
    }

    actualizarEncabezadoLista();

    await cargarListaAsistentes();
}


function actualizarEncabezadoLista() {
    const evento = obtenerEventoSeleccionado();

    const nombreEvento =
        document.getElementById("nombreEventoLista");

    const titulo =
        document.getElementById(
            "tituloListaAsistentes"
        );

    if (nombreEvento) {
        nombreEvento.textContent =
            evento?.nombre || "Sin Cadenas 2026";
    }

    if (titulo) {
        titulo.textContent =
            evento?.tipo === "ahorro"
                ? "👥 Lista de servidores"
                : "📋 Lista de asistentes";
    }
}

function renderizarListaAsistentes() {

    const contenedor =
        document.getElementById("contenedorLista");

    const total =
        document.getElementById("totalLista");


    if (!contenedor || !total) {
        return;
    }


    total.textContent =
        `${asistentesFiltrados.length} ` +
        (
            asistentesFiltrados.length === 1
                ? "asistente"
                : "asistentes"
        );


    if (asistentesFiltrados.length === 0) {

        contenedor.innerHTML = `

            <div class="lista-vacia">

                <div>🔎</div>

                <strong>
                    No encontramos asistentes
                </strong>

                <p>
                    Prueba con otro nombre,
                    ID o teléfono.
                </p>

            </div>

        `;


        document
            .querySelectorAll("[data-paginacion-lista]")
            .forEach(paginacion => {
                paginacion.innerHTML = "";
            });


        return;

    }


    const totalPaginas =
        Math.ceil(
            asistentesFiltrados.length /
            ASISTENTES_POR_PAGINA
        );


    if (paginaAsistentes > totalPaginas) {
        paginaAsistentes = totalPaginas;
    }


    const inicio =
        (paginaAsistentes - 1) *
        ASISTENTES_POR_PAGINA;


    const fin =
        inicio +
        ASISTENTES_POR_PAGINA;


    const asistentesPagina =
        asistentesFiltrados.slice(
            inicio,
            fin
        );


    contenedor.innerHTML =
        asistentesPagina
            .map(crearTarjetaListaAsistente)
            .join("");


    conectarTarjetasLista();

    renderizarPaginacionLista(
        totalPaginas
    );

}

function crearTarjetaListaAsistente(asistente) {

    return `

        <button
            class="lista-asistente-item"
            data-id="${escaparHTML(asistente.id)}"
            type="button"
        >

            <div class="lista-avatar">
                👤
            </div>


            <div class="lista-info">

                <strong class="lista-nombre">

                    ${escaparHTML(asistente.nombre)}

                </strong>


                <div class="lista-id">

                    ${escaparHTML(asistente.id)}

                </div>


                <div class="lista-detalles">

                    ${
                        asistente.telefono
                            ? "📞 " +
                              escaparHTML(
                                  asistente.telefono
                              )
                            : "📞 Sin teléfono"
                    }

                    <span>•</span>

                    ${
                        asistente.edad
                            ? escaparHTML(
                                  asistente.edad
                              ) + " años"
                            : "Sin edad"
                    }

                </div>

            </div>


            <div class="lista-flecha">
                ›
            </div>

        </button>

    `;

}

function filtrarListaAsistentes(evento) {

    const termino =
        evento.target.value
            .trim()
            .toLowerCase();


    if (!termino) {

        asistentesFiltrados =
            [...asistentesLista];

    } else {

        asistentesFiltrados =
            asistentesLista.filter(
                asistente => {

                    const nombre =
                        String(
                            asistente.nombre || ""
                        ).toLowerCase();

                    const id =
                        String(
                            asistente.id || ""
                        ).toLowerCase();

                    const telefono =
                        String(
                            asistente.telefono || ""
                        ).toLowerCase();


                    return (
                        nombre.includes(termino) ||
                        id.includes(termino) ||
                        telefono.includes(termino)
                    );

                }
            );

    }


    paginaAsistentes = 1;

    renderizarListaAsistentes();

}

function renderizarPaginacionLista(
    totalPaginas
) {

    const paginaciones =
        document.querySelectorAll(
            "[data-paginacion-lista]"
        );


    if (totalPaginas <= 1) {

        paginaciones.forEach(paginacion => {
            paginacion.innerHTML = "";
        });

        return;

    }


    const controlesPaginacion = `

        <div class="paginacion">

            <button
                data-cambio-pagina="-1"
                type="button"
                ${paginaAsistentes === 1
                    ? "disabled"
                    : ""}
            >
                ←
            </button>


            <span>

                Página
                <strong>
                    ${paginaAsistentes}
                </strong>
                de
                <strong>
                    ${totalPaginas}
                </strong>

            </span>


            <button
                data-cambio-pagina="1"
                type="button"
                ${paginaAsistentes === totalPaginas
                    ? "disabled"
                    : ""}
            >
                →
            </button>

        </div>

    `;


    paginaciones.forEach(paginacion => {

        paginacion.innerHTML = controlesPaginacion;

        paginacion
            .querySelectorAll("[data-cambio-pagina]")
            .forEach(boton => {

                boton.addEventListener(
                    "click",
                    () => cambiarPaginaLista(
                        Number(boton.dataset.cambioPagina)
                    )
                );

            });

    });

}

function cambiarPaginaLista(cambio) {

    paginaAsistentes += cambio;

    renderizarListaAsistentes();


    document
        .querySelector(".lista-card")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}

function conectarTarjetasLista() {

    document
        .querySelectorAll(
            ".lista-asistente-item"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const id =
                        item.dataset.id;


                    const asistente =
                        asistentesLista.find(
                            persona =>
                                persona.id === id
                        );


                    if (asistente) {

                        mostrarDetalleDesdeLista(
                            asistente
                        );

                    }

                }
            );

        });

}

function mostrarDetalleDesdeLista(
    asistente
) {

    const app =
        document.getElementById("app");


    app.innerHTML = `

        <div class="app">

            <header class="app-header solo-logo">

                <p>Sin Cadenas 2026</p>

            </header>


            <main class="app-content">

                <div class="app-card">

                    <div id="resultadoBusqueda">
                    </div>


                    <button
                        id="btnVolverDesdeDetalle"
                        class="boton"
                        type="button"
                    >
                        ← Volver a la lista
                    </button>

                </div>

            </main>

        </div>

    `;


    mostrarResultadoAsistente(
        asistente
    );


    document
        .getElementById(
            "btnVolverDesdeDetalle"
        )
        .addEventListener(
            "click",
            mostrarListaAsistentes
        );

}

async function cargarListaAsistentes() {

    const contenedor =
        document.getElementById("contenedorLista");

    try {

        const respuesta =
            await listarAsistentesAPI(
    codigoEventoSeleccionado
);


        if (!respuesta.ok) {

            throw new Error(
                respuesta.mensaje ||
                "No fue posible cargar los asistentes."
            );

        }


        asistentesLista =
            respuesta.asistentes || [];


        asistentesFiltrados =
            [...asistentesLista];


        paginaAsistentes = 1;


        renderizarListaAsistentes();


    } catch (error) {

        console.error(error);


        contenedor.innerHTML = `

            <div class="mensaje-busqueda error-busqueda">

                <strong>
                    No pudimos cargar los asistentes
                </strong>

                <p>
                    Intenta nuevamente.
                </p>

            </div>

        `;

    }

}

