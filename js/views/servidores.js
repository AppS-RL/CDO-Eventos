const CLAVE_SESION_SERVIDOR = "cdoSesionServidor";


function mostrarAccesoServidor() {
    const sesion = obtenerSesionServidorGuardada();

    if (sesion && sesion.token) {
        validarSesionServidorGuardada(sesion.token);
        return;
    }

    renderizarAccesoServidor();
}


function renderizarAccesoServidor(modo = "ingreso") {
    const app = document.getElementById("app");
    const esActivacion = modo === "activacion";

    app.innerHTML = `
        <main class="servidores-acceso">
            <section class="servidores-acceso-card">
                <button
                    id="btnVolverInicioServidor"
                    class="servidores-volver"
                    type="button"
                    aria-label="Volver al inicio"
                >
                    ← Volver
                </button>

                <div class="servidores-identidad">
                    <span class="servidores-icono">🙋</span>
                    <h1>CDO Servidores</h1>
                    <p>
                        ${
                            esActivacion
                                ? "Activa tu acceso por primera vez"
                                : "Bienvenido a tu espacio de servicio"
                        }
                    </p>
                </div>

                <form id="formAccesoServidor" class="form-asistente">
                    <div class="campo">
                        <label for="servidorId">ID de servidor</label>
                        <input
                            id="servidorId"
                            type="text"
                            placeholder="SERVIDOR-0001"
                            autocomplete="username"
                            autocapitalize="characters"
                            required
                        >
                    </div>

                    ${
                        esActivacion
                            ? `
                                <div class="campo">
                                    <label for="servidorTelefono">
                                        Últimos 4 dígitos de tu teléfono
                                    </label>
                                    <input
                                        id="servidorTelefono"
                                        type="text"
                                        inputmode="numeric"
                                        pattern="[0-9]{4}"
                                        maxlength="4"
                                        autocomplete="off"
                                        placeholder="1234"
                                        required
                                    >
                                </div>
                            `
                            : ""
                    }

                    <div class="campo">
                        <label for="servidorPin">
                            ${esActivacion ? "Crea un PIN de 6 dígitos" : "PIN personal"}
                        </label>
                        <input
                            id="servidorPin"
                            type="password"
                            inputmode="numeric"
                            pattern="[0-9]{6}"
                            maxlength="6"
                            autocomplete="${esActivacion ? "new-password" : "current-password"}"
                            placeholder="••••••"
                            required
                        >
                    </div>

                    <div id="mensajeAccesoServidor" class="servidores-mensaje" aria-live="polite"></div>

                    <button
                        id="btnEnviarAccesoServidor"
                        class="boton principal"
                        type="submit"
                    >
                        ${esActivacion ? "Activar mi acceso" : "Entrar"}
                    </button>
                </form>

                <button
                    id="btnCambiarModoServidor"
                    class="servidores-enlace"
                    type="button"
                >
                    ${
                        esActivacion
                            ? "Ya tengo PIN"
                            : "Es mi primera vez"
                    }
                </button>
            </section>
        </main>
    `;

    document
        .getElementById("btnVolverInicioServidor")
        .addEventListener("click", mostrarInicio);

    document
        .getElementById("btnCambiarModoServidor")
        .addEventListener(
            "click",
            () => renderizarAccesoServidor(
                esActivacion ? "ingreso" : "activacion"
            )
        );

    document
        .getElementById("formAccesoServidor")
        .addEventListener(
            "submit",
            evento => procesarAccesoServidor(
                evento,
                esActivacion
            )
        );
}


async function procesarAccesoServidor(evento, esActivacion) {
    evento.preventDefault();

    const id = document
        .getElementById("servidorId")
        .value
        .trim()
        .toUpperCase();
    const pin = document
        .getElementById("servidorPin")
        .value
        .trim();
    const mensaje = document.getElementById(
        "mensajeAccesoServidor"
    );
    const boton = document.getElementById(
        "btnEnviarAccesoServidor"
    );

    if (!/^SERVIDOR-\d{4,}$/.test(id)) {
        mostrarMensajeAccesoServidor(
            mensaje,
            "Revisa tu ID. Debe verse como SERVIDOR-0001.",
            true
        );
        return;
    }

    if (!/^\d{6}$/.test(pin)) {
        mostrarMensajeAccesoServidor(
            mensaje,
            "El PIN debe tener exactamente 6 números.",
            true
        );
        return;
    }

    boton.disabled = true;
    boton.textContent = esActivacion
        ? "Activando..."
        : "Ingresando...";

    try {
        let respuesta;

        if (esActivacion) {
            const ultimosTelefono = document
                .getElementById("servidorTelefono")
                .value
                .trim();

            if (!/^\d{4}$/.test(ultimosTelefono)) {
                throw new Error(
                    "Escribe los últimos 4 números de tu teléfono."
                );
            }

            respuesta = await activarAccesoServidorAPI(
                id,
                ultimosTelefono,
                pin
            );
        } else {
            respuesta = await iniciarSesionServidorAPI(
                id,
                pin
            );
        }

        if (!respuesta || !respuesta.ok) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible completar el acceso."
            );
        }

        guardarSesionServidor(respuesta);
        mostrarPanelServidor(respuesta.servidor);
    } catch (error) {
        mostrarMensajeAccesoServidor(
            mensaje,
            error.message || "No fue posible completar el acceso.",
            true
        );
    } finally {
        boton.disabled = false;
        boton.textContent = esActivacion
            ? "Activar mi acceso"
            : "Entrar";
    }
}


async function validarSesionServidorGuardada(token) {
    try {
        const respuesta = await validarSesionServidorAPI(token);

        if (!respuesta || !respuesta.ok) {
            throw new Error("La sesión terminó.");
        }

        guardarSesionServidor(respuesta, token);
        mostrarPanelServidor(respuesta.servidor);
    } catch (error) {
        eliminarSesionServidorGuardada();
        renderizarAccesoServidor();
    }
}


function mostrarPanelServidor(servidor) {
    const app = document.getElementById("app");
    const nombre = escaparHTML(servidor?.nombre || "Servidor");
    const id = escaparHTML(servidor?.id || "");

    app.innerHTML = `
        <div class="app servidores-app">
            <header class="servidores-header">
                <div>
                    <span>CDO Servidores</span>
                    <h1>Hola, ${nombre}</h1>
                    <p>${id}</p>
                </div>
                <button id="btnCerrarSesionServidor" type="button">
                    Salir
                </button>
            </header>

            <main class="servidores-panel">
                <section class="servidores-resumen">
                    <strong>Tu espacio ya está listo</strong>
                    <p>
                        Aquí aparecerán tus avisos, uniforme y actividades.
                    </p>
                </section>

                <section class="servidores-modulos" aria-label="Módulos de servidor">
                    ${crearTarjetaModuloServidor("👕", "Uniforme", "Próximo servicio")}
                    ${crearTarjetaModuloServidor("📖", "Predicaciones", "Material asignado")}
                    ${crearTarjetaModuloServidor("✅", "Mis tareas", "Actividades pendientes")}
                    ${crearTarjetaModuloServidor("📣", "Avisos", "Comunicados de CDO")}
                </section>

                <p class="servidores-siguiente-etapa">
                    Acceso personal habilitado. El contenido de cada módulo se agregará en la siguiente etapa.
                </p>
            </main>
        </div>
    `;

    document
        .getElementById("btnCerrarSesionServidor")
        .addEventListener("click", cerrarSesionServidor);
}


function crearTarjetaModuloServidor(icono, titulo, descripcion) {
    return `
        <article class="servidores-modulo">
            <span>${icono}</span>
            <strong>${titulo}</strong>
            <small>${descripcion}</small>
            <em>Próximamente</em>
        </article>
    `;
}


async function cerrarSesionServidor() {
    const sesion = obtenerSesionServidorGuardada();
    eliminarSesionServidorGuardada();

    try {
        if (sesion?.token) {
            await cerrarSesionServidorAPI(sesion.token);
        }
    } catch (error) {
        console.error(error);
    }

    renderizarAccesoServidor();
}


function mostrarMensajeAccesoServidor(contenedor, texto, esError) {
    contenedor.textContent = texto;
    contenedor.classList.toggle("es-error", Boolean(esError));
}


function guardarSesionServidor(respuesta, tokenExistente = "") {
    localStorage.setItem(
        CLAVE_SESION_SERVIDOR,
        JSON.stringify({
            token: respuesta.token || tokenExistente,
            servidor: respuesta.servidor || null
        })
    );
}


function obtenerSesionServidorGuardada() {
    try {
        return JSON.parse(
            localStorage.getItem(CLAVE_SESION_SERVIDOR)
        );
    } catch (error) {
        return null;
    }
}


function eliminarSesionServidorGuardada() {
    localStorage.removeItem(CLAVE_SESION_SERVIDOR);
}
