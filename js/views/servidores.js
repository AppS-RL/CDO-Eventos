const CLAVE_SESION_SERVIDOR = "cdoSesionServidor";
let moduloActivoServidor = "";
let panelGestionActivoServidor = "aprobaciones";
let programaRolActivoServidor = "";
const mesesRolActivosServidor = {};


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
        cargarPanelServidor(
            respuesta.servidor,
            respuesta.token
        );
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
        cargarPanelServidor(respuesta.servidor, token);
    } catch (error) {
        eliminarSesionServidorGuardada();
        renderizarAccesoServidor();
    }
}


async function cargarPanelServidor(servidor, token) {
    mostrarPanelServidor(
        servidor,
        [],
        null,
        "Cargando contenido..."
    );

    try {
        const [respuesta, gestion] = await Promise.all([
            obtenerContenidoServidorAPI(token),
            obtenerGestionServidorAPI(token)
        ]);

        if (!respuesta?.ok || !gestion?.ok) {
            throw new Error(
                respuesta?.mensaje || gestion?.mensaje ||
                "No fue posible cargar el contenido."
            );
        }

        mostrarPanelServidor(
            servidor,
            respuesta.contenidos || [],
            gestion
        );
    } catch (error) {
        mostrarPanelServidor(
            servidor,
            [],
            null,
            error.message || "No fue posible cargar el contenido."
        );
    }
}


function mostrarPanelServidor(
    servidor,
    contenidos = [],
    gestion = null,
    mensajeEstado = ""
) {
    const app = document.getElementById("app");
    const nombre = escaparHTML(servidor?.nombre || "Servidor");
    const id = escaparHTML(servidor?.id || "");
    const uniformes = filtrarContenidoServidor(
        contenidos,
        "UNIFORME"
    );
    const actividades = filtrarContenidoServidor(
        contenidos,
        "ACTIVIDAD"
    );
    const predicaciones = filtrarContenidoServidor(
        contenidos,
        "PREDICACION"
    );
    const avisos = filtrarContenidoServidor(
        contenidos,
        "AVISO"
    );
    const notificaciones = combinarNotificacionesServidor(
        gestion?.notificaciones || [],
        contenidos
    );
    const notificacionesNuevas = notificaciones.filter(item => !item.leida).length;
    const pendientes = actividades
        .concat(predicaciones)
        .filter(item => !item.completada)
        .length;
    const uniforme = seleccionarUniformeServidor(uniformes);
    const perfil = gestion?.perfil || {
        roles: ["SERVIDOR"],
        permisosUsados: 0,
        limitePermisos: 6,
        faltasSinPermiso: 0,
        area: ""
    };
    const programasServicio = gestion?.programasServicio || [];
    const programaPrincipal = programasServicio[0] || null;
    const puedeExplorarRolesPorArea = perfil.roles.some(rol =>
        ["PASTOR", "COORDINADOR_ROLES", "ADMINISTRADOR"].includes(rol)
    );
    const descripcionPrograma = puedeExplorarRolesPorArea && programasServicio.length > 1
        ? `${programasServicio.length} áreas publicadas`
        : programaPrincipal
            ? `${programaPrincipal.area} · Publicado`
            : "Sin asignar";
    const coberturasPendientes = (gestion?.coberturas || [])
        .filter(item => item.coberturaEstado === "PENDIENTE")
        .length;
    const puedeSupervisar = perfil.roles.some(rol =>
        ["CAPITAN", "PASTOR", "ADMINISTRADOR"].includes(rol)
    );

    app.innerHTML = `
        <div class="app servidores-app">
            <header class="servidores-header">
                <div>
                    <span>CDO Servidores</span>
                    <h1>Hola, ${nombre}</h1>
                    <p>${id}</p>
                </div>
                <div class="servidores-header-acciones">
                    <button
                        class="servidores-campana"
                        type="button"
                        data-ir-modulo="notificacionesServidor"
                        aria-label="Notificaciones${notificacionesNuevas ? `, ${notificacionesNuevas} nuevas` : ""}"
                    >
                        <span aria-hidden="true">🔔</span>
                        ${notificacionesNuevas ? `<strong>${notificacionesNuevas > 99 ? "99+" : notificacionesNuevas}</strong>` : ""}
                    </button>
                    <button id="btnCerrarSesionServidor" type="button">
                        Salir
                    </button>
                </div>
            </header>

            <main class="servidores-panel">
                <section class="servidores-resumen" data-vista-inicio-servidor>
                    <strong>
                        ${
                            pendientes
                                ? pendientes + " pendiente" + (pendientes === 1 ? "" : "s")
                                : "Todo al día"
                        }
                    </strong>
                    <p>
                        Revisa aquí la información de tu próximo servicio.
                    </p>
                    <div class="servidores-resumen-datos">
                        ${crearInsigniasRolesServidor(perfil.roles)}
                        <span class="servidores-faltas ${claseSemaforoPermisosServidor(perfil.permisosUsados)}">
                            ${Number(perfil.permisosUsados || 0)} de ${Number(perfil.limitePermisos || 6)} permisos usados
                        </span>
                        ${Number(perfil.faltasSinPermiso || 0) ? `<span class="nivel-rojo">${Number(perfil.faltasSinPermiso)} falta${Number(perfil.faltasSinPermiso) === 1 ? "" : "s"} sin permiso</span>` : ""}
                        ${perfil.area ? `<span>Área: ${escaparHTML(perfil.area)}</span>` : ""}
                    </div>
                </section>

                <nav class="servidores-modulos" aria-label="Módulos de servidor" data-vista-inicio-servidor>
                    ${crearAccesoModuloServidor("🎛️", "Mi rol", descripcionPrograma, "rolServicioServidor")}
                    ${crearAccesoModuloServidor("👕", "Uniforme", uniforme ? "Publicado" : "Sin publicar", "uniformeServidor")}
                    ${crearAccesoModuloServidor("✅", "Actividades", actividades.length + " asignada" + (actividades.length === 1 ? "" : "s"), "actividadesServidor")}
                    ${crearAccesoModuloServidor("📖", "Predicaciones", predicaciones.length + " asignada" + (predicaciones.length === 1 ? "" : "s"), "predicacionesServidor")}
                    ${crearAccesoModuloServidor("📣", "Avisos", avisos.length + " publicado" + (avisos.length === 1 ? "" : "s"), "avisosServidor")}
                    ${crearAccesoModuloServidor("🗓️", "Permisos", (gestion?.permisos || []).length + " solicitud" + ((gestion?.permisos || []).length === 1 ? "" : "es"), "permisosServidor")}
                    ${crearAccesoModuloServidor("🤝", "Coberturas", coberturasPendientes ? coberturasPendientes + " por responder" : "Sin pendientes", "coberturasServidor")}
                    ${puedeSupervisar ? crearAccesoModuloServidor("📋", "Gestión", "Aprobaciones y asistencia", "gestionEquipoServidor") : ""}
                </nav>

                ${
                    mensajeEstado
                        ? `<p class="servidores-estado-carga">${escaparHTML(mensajeEstado)}</p>`
                        : ""
                }

                <div id="encabezadoModuloServidor" class="servidores-vista-encabezado" hidden>
                    <button id="btnVolverInicioServidor" type="button">← Volver al inicio</button>
                </div>

                ${renderizarNotificacionesServidor(notificaciones)}
                ${renderizarPermisosServidor(gestion)}
                ${renderizarCoberturasServidor(gestion)}
                ${puedeSupervisar ? renderizarGestionEquipoServidor(gestion) : ""}
                ${renderizarRolServicioServidor(programasServicio, perfil)}

                <section id="uniformeServidor" class="servidores-seccion servidores-uniforme">
                    <div class="servidores-seccion-titulo">
                        <span>👕</span>
                        <div>
                            <h2>Uniforme</h2>
                            <p>Indicación para el próximo servicio</p>
                        </div>
                    </div>
                    ${renderizarUniformeServidor(uniforme, uniformes)}
                </section>

                <section id="actividadesServidor" class="servidores-seccion">
                    <div class="servidores-seccion-titulo">
                        <span>✅</span>
                        <div>
                            <h2>Mis actividades</h2>
                            <p>Marca cada actividad cuando la termines</p>
                        </div>
                    </div>
                    ${renderizarListaContenidoServidor(
                        actividades,
                        "No tienes actividades pendientes.",
                        true
                    )}
                </section>

                <section id="predicacionesServidor" class="servidores-seccion">
                    <div class="servidores-seccion-titulo">
                        <span>📖</span>
                        <div>
                            <h2>Predicaciones</h2>
                            <p>Material de preparación y seguimiento</p>
                        </div>
                    </div>
                    ${renderizarListaContenidoServidor(
                        predicaciones,
                        "No tienes predicaciones asignadas.",
                        true
                    )}
                </section>

                <section id="avisosServidor" class="servidores-seccion">
                    <div class="servidores-seccion-titulo">
                        <span>📣</span>
                        <div>
                            <h2>Avisos</h2>
                            <p>Información importante de CDO</p>
                        </div>
                    </div>
                    ${renderizarListaContenidoServidor(
                        avisos,
                        "No hay avisos nuevos.",
                        false
                    )}
                </section>
            </main>
        </div>
    `;

    document
        .getElementById("btnCerrarSesionServidor")
        .addEventListener("click", cerrarSesionServidor);

    document
        .querySelectorAll("[data-ir-modulo]")
        .forEach(boton => {
            boton.addEventListener("click", () => {
                actualizarVistaModuloServidor(boton.dataset.irModulo);
            });
        });

    document
        .getElementById("btnVolverInicioServidor")
        ?.addEventListener("click", () => actualizarVistaModuloServidor(""));

    document
        .querySelectorAll("[data-contenido-completar]")
        .forEach(boton => {
            boton.addEventListener(
                "click",
                () => cambiarEstadoActividadServidor(
                    boton.dataset.contenidoCompletar,
                    boton.dataset.completada !== "true",
                    boton
                )
            );
        });

    configurarEventosNotificacionesServidor();
    configurarEventosGestionServidor(gestion);
    configurarNavegacionGestionServidor();
    configurarSelectorRolServicioServidor();
    const sesionPush = obtenerSesionServidorGuardada();
    if (sesionPush?.token && typeof sincronizarPushServidor === "function") {
        sincronizarPushServidor(sesionPush.token).catch(error => {
            console.warn("No fue posible actualizar las notificaciones del teléfono.", error);
        });
    }
    if (!moduloActivoServidor) {
        const moduloDesdeEnlace = new URLSearchParams(window.location.search).get("abrir");
        if (moduloDesdeEnlace && document.getElementById(moduloDesdeEnlace)) {
            moduloActivoServidor = moduloDesdeEnlace;
        }
    }
    actualizarVistaModuloServidor(moduloActivoServidor, false);
}


function actualizarVistaModuloServidor(destino = "", moverVista = true) {
    const secciones = Array.from(document.querySelectorAll(".servidores-seccion"));
    const destinoExiste = destino && document.getElementById(destino);
    moduloActivoServidor = destinoExiste ? destino : "";

    document.querySelectorAll("[data-vista-inicio-servidor]").forEach(elemento => {
        elemento.hidden = Boolean(moduloActivoServidor);
    });

    secciones.forEach(seccion => {
        seccion.hidden = seccion.id !== moduloActivoServidor;
    });

    const encabezado = document.getElementById("encabezadoModuloServidor");
    if (encabezado) encabezado.hidden = !moduloActivoServidor;

    if (moverVista) {
        document.querySelector(".servidores-panel")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function configurarNavegacionGestionServidor() {
    document.querySelectorAll("[data-ir-gestion-panel]").forEach(boton => {
        boton.addEventListener("click", () => {
            actualizarPanelGestionServidor(boton.dataset.irGestionPanel);
        });
    });

    actualizarPanelGestionServidor(panelGestionActivoServidor, false);
}


function actualizarPanelGestionServidor(panel, moverVista = true) {
    const paneles = Array.from(document.querySelectorAll("[data-gestion-panel]"));
    if (!paneles.length) return;

    const disponible = paneles.some(item => item.dataset.gestionPanel === panel);
    panelGestionActivoServidor = disponible
        ? panel
        : paneles[0].dataset.gestionPanel;

    paneles.forEach(item => {
        item.hidden = item.dataset.gestionPanel !== panelGestionActivoServidor;
    });

    document.querySelectorAll("[data-ir-gestion-panel]").forEach(boton => {
        const activo = boton.dataset.irGestionPanel === panelGestionActivoServidor;
        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });

    if (moverVista) {
        document.getElementById("gestionEquipoServidor")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function crearAccesoModuloServidor(
    icono,
    titulo,
    descripcion,
    destino
) {
    return `
        <button
            class="servidores-modulo"
            type="button"
            data-ir-modulo="${destino}"
        >
            <span>${icono}</span>
            <strong>${titulo}</strong>
            <small>${descripcion}</small>
            <em>Ver</em>
        </button>
    `;
}


function filtrarContenidoServidor(contenidos, tipo) {
    return contenidos.filter(item => item.tipo === tipo);
}


function combinarNotificacionesServidor(notificacionesGestion, contenidos) {
    const notificaciones = [...notificacionesGestion];
    const existentes = new Set(notificaciones.map(item => item.id));

    contenidos
        .filter(item => ["AVISO", "PREDICACION"].includes(item.tipo))
        .forEach(item => {
            const id = item.notificacionId || `${item.tipo}_${item.id}`;

            if (existentes.has(id)) return;

            const esPredicacion = item.tipo === "PREDICACION";
            notificaciones.push({
                id: id,
                tipo: item.tipo,
                titulo: esPredicacion ? "Nueva predicación" : "Nuevo aviso",
                descripcion: item.titulo,
                fecha: item.publicado || item.fecha,
                destino: esPredicacion ? "predicacionesServidor" : "avisosServidor",
                leida: Boolean(item.notificacionLeida)
            });
            existentes.add(id);
        });

    return notificaciones.sort((a, b) => {
        if (Boolean(a.leida) !== Boolean(b.leida)) {
            return a.leida ? 1 : -1;
        }

        return String(b.fecha || "").localeCompare(String(a.fecha || ""));
    });
}


function renderizarNotificacionesServidor(notificaciones) {
    const nuevas = notificaciones.filter(item => !item.leida);
    const estadoPush = typeof obtenerEstadoPushServidor === "function"
        ? obtenerEstadoPushServidor()
        : { estado: "CONFIGURANDO", titulo: "Notificaciones del teléfono", descripcion: "Configuración pendiente." };
    const puedeActivarPush = estadoPush.estado === "DISPONIBLES";

    return `
        <section id="notificacionesServidor" class="servidores-seccion servidores-notificaciones">
            <div class="servidores-seccion-titulo servidores-notificaciones-titulo">
                <span>🔔</span>
                <div>
                    <h2>Notificaciones</h2>
                    <p>${nuevas.length ? `${nuevas.length} nueva${nuevas.length === 1 ? "" : "s"}` : "Todo está leído"}</p>
                </div>
                ${nuevas.length ? `
                    <button id="btnLeerTodasNotificaciones" type="button">
                        Marcar todas como leídas
                    </button>
                ` : ""}
            </div>

            <div class="servidores-push servidores-push-${estadoPush.estado.toLowerCase()}">
                <span aria-hidden="true">📱</span>
                <div>
                    <strong>${escaparHTML(estadoPush.titulo)}</strong>
                    <small>${escaparHTML(estadoPush.descripcion)}</small>
                </div>
                ${puedeActivarPush ? `
                    <button id="btnActivarPushServidor" type="button">
                        Activar en este teléfono
                    </button>
                ` : ""}
            </div>

            ${notificaciones.length ? `
                <div class="servidores-notificaciones-lista">
                    ${notificaciones.map(notificacion => `
                        <button
                            class="servidores-notificacion ${notificacion.leida ? "leida" : "nueva"}"
                            type="button"
                            data-notificacion-id="${escaparHTML(notificacion.id)}"
                            data-notificacion-destino="${escaparHTML(notificacion.destino)}"
                            data-notificacion-leida="${Boolean(notificacion.leida)}"
                        >
                            <span class="servidores-notificacion-icono">${iconoNotificacionServidor(notificacion.tipo)}</span>
                            <span class="servidores-notificacion-contenido">
                                <strong>${escaparHTML(notificacion.titulo)}</strong>
                                <small>${escaparHTML(notificacion.descripcion)}</small>
                                <time>${escaparHTML(formatearFechaNotificacionServidor(notificacion.fecha))}</time>
                            </span>
                            ${notificacion.leida ? "" : `<span class="servidores-notificacion-punto" aria-label="Nueva"></span>`}
                        </button>
                    `).join("")}
                </div>
            ` : crearEstadoVacioServidor("Cuando llegue una solicitud, aviso o predicación, aparecerá aquí.")}
        </section>
    `;
}


function iconoNotificacionServidor(tipo) {
    return {
        PERMISO: "🗓️",
        COBERTURA: "🤝",
        AVISO: "📣",
        PREDICACION: "📖"
    }[tipo] || "🔔";
}


function formatearFechaNotificacionServidor(fecha) {
    if (!fecha) return "Fecha pendiente";
    const fechaSimple = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (fechaSimple) {
        return new Date(
            Number(fechaSimple[1]),
            Number(fechaSimple[2]) - 1,
            Number(fechaSimple[3])
        ).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
        return String(fecha);
    }

    return valor.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}


function configurarEventosNotificacionesServidor() {
    document.getElementById("btnActivarPushServidor")?.addEventListener("click", async evento => {
        const boton = evento.currentTarget;
        const sesion = obtenerSesionServidorGuardada();

        await ejecutarAccionGestionServidor(boton, "Activando...", async () => {
            const respuesta = await activarPushServidor(sesion.token);
            alert(respuesta?.mensaje || "Notificaciones activadas en este teléfono.");
            await cargarPanelServidor(sesion.servidor, sesion.token);
        });
    });

    document.querySelectorAll("[data-notificacion-id]").forEach(boton => {
        boton.addEventListener("click", async () => {
            const destino = boton.dataset.notificacionDestino || "";
            moduloActivoServidor = destino;

            if (boton.dataset.notificacionLeida === "true") {
                actualizarVistaModuloServidor(destino);
                return;
            }

            const sesion = obtenerSesionServidorGuardada();
            boton.disabled = true;

            try {
                const respuesta = await marcarNotificacionesServidorAPI(
                    sesion.token,
                    [boton.dataset.notificacionId]
                );

                if (!respuesta?.ok) {
                    throw new Error(respuesta?.mensaje || "No fue posible actualizar la notificación.");
                }

                await cargarPanelServidor(sesion.servidor, sesion.token);
            } catch (error) {
                boton.disabled = false;
                alert(error.message || "No fue posible actualizar la notificación.");
            }
        });
    });

    document.getElementById("btnLeerTodasNotificaciones")?.addEventListener("click", async evento => {
        const boton = evento.currentTarget;
        const ids = Array.from(document.querySelectorAll("[data-notificacion-leida='false']"))
            .map(item => item.dataset.notificacionId);
        const sesion = obtenerSesionServidorGuardada();

        await ejecutarAccionGestionServidor(boton, "Guardando...", async () => {
            const respuesta = await marcarNotificacionesServidorAPI(sesion.token, ids);
            if (!respuesta?.ok) throw new Error(respuesta?.mensaje || "No fue posible actualizar las notificaciones.");
            await cargarPanelServidor(sesion.servidor, sesion.token);
        });
    });
}


function renderizarRolServicioServidor(programas, perfil) {
    if (!programas.length) {
        return `
            <section id="rolServicioServidor" class="servidores-seccion servidores-rol-servicio">
                <div class="servidores-seccion-titulo">
                    <span>🎛️</span>
                    <div>
                        <h2>Mi rol de servicio</h2>
                        <p>Asignaciones publicadas por la coordinación</p>
                    </div>
                </div>
                ${crearEstadoVacioServidor("Todavía no tienes un rol de servicio asignado.")}
            </section>
        `;
    }

    if (!programas.some(programa => programa.id === programaRolActivoServidor)) {
        programaRolActivoServidor = programas[0].id;
    }

    const puedeExplorarAreas = (perfil.roles || []).some(rol =>
        ["PASTOR", "COORDINADOR_ROLES", "ADMINISTRADOR"].includes(rol)
    );

    if (!puedeExplorarAreas) {
        return `
            <section id="rolServicioServidor" class="servidores-seccion servidores-rol-servicio">
                ${renderizarDetalleProgramaRolServidor(programas[0], perfil)}
            </section>
        `;
    }

    return `
        <section id="rolServicioServidor" class="servidores-seccion servidores-rol-servicio">
            <div class="servidores-seccion-titulo">
                <span>🎛️</span>
                <div>
                    <h2>Mi rol de servicio</h2>
                    <p>Selecciona el área que deseas consultar</p>
                </div>
            </div>

            <nav class="servidores-programas-menu" aria-label="Roles por área">
                ${programas.map(programa => `
                    <button
                        type="button"
                        data-ir-programa-rol="${escaparHTML(programa.id)}"
                        class="${programa.id === programaRolActivoServidor ? "activo" : ""}"
                        aria-pressed="${programa.id === programaRolActivoServidor}"
                    >
                        <span>🎛️</span>
                        <strong>${escaparHTML(programa.area)}</strong>
                        <small>${escaparHTML(formatearPeriodoRolServidor(programa.periodoInicio, programa.periodoFin))}</small>
                    </button>
                `).join("")}
            </nav>

            ${programas.map(programa => `
                <div
                    class="servidores-programa-panel"
                    data-programa-rol-panel="${escaparHTML(programa.id)}"
                    ${programa.id === programaRolActivoServidor ? "" : "hidden"}
                >
                    ${renderizarDetalleProgramaRolServidor(programa, perfil)}
                </div>
            `).join("")}
        </section>
    `;
}


function renderizarDetalleProgramaRolServidor(programa, perfil) {
    const meses = [...new Set((programa.actividades || []).map(item => item.mes))];
    const mesActual = new Date().toISOString().slice(0, 7);
    let mesActivo = mesesRolActivosServidor[programa.id];

    if (!meses.includes(mesActivo)) {
        mesActivo = meses.includes(mesActual) ? mesActual : meses[0];
        mesesRolActivosServidor[programa.id] = mesActivo;
    }

    const equipo = (programa.equipo || []).map(persona => {
        const esCapitan = (persona.roles || []).includes("CAPITAN");
        return `<span>${escaparHTML(persona.nombre)}${esCapitan ? " · Capitán" : ""}</span>`;
    }).join("");

    return `
        <div class="servidores-programa-detalle">
            <div class="servidores-seccion-titulo">
                <span>🎛️</span>
                <div>
                    <h2>${escaparHTML(programa.titulo)}</h2>
                    <p>${escaparHTML(programa.area)} · ${formatearPeriodoRolServidor(programa.periodoInicio, programa.periodoFin)}</p>
                </div>
            </div>

            <div class="servidores-rol-publicacion">
                <div>
                    <small>Rol oficial publicado</small>
                    <strong>Elaborado por ${escaparHTML(programa.elaboradoPorNombre || "Coordinación")}</strong>
                </div>
                <span>Versión ${Number(programa.version || 1)}</span>
            </div>

            <div class="servidores-equipo-rol">
                <small>Equipo</small>
                <div>${equipo || `<span>${escaparHTML(perfil.area || programa.area)}</span>`}</div>
            </div>

            <label class="servidores-selector-mes">
                Ver asignaciones de
                <select data-selector-mes-rol="${escaparHTML(programa.id)}">
                    ${meses.map(mes => `
                        <option value="${escaparHTML(mes)}" ${mes === mesActivo ? "selected" : ""}>
                            ${escaparHTML(nombreMesRolServidor(mes))}
                        </option>
                    `).join("")}
                </select>
            </label>

            ${meses.map(mes => `
                <div class="servidores-cronograma" data-programa-mes="${escaparHTML(programa.id)}" data-rol-mes="${escaparHTML(mes)}" ${mes === mesActivo ? "" : "hidden"}>
                    ${(programa.actividades || [])
                        .filter(actividad => actividad.mes === mes)
                        .map(renderizarActividadRolServicioServidor)
                        .join("")}
                </div>
            `).join("")}

            <p class="servidores-rol-nota">
                Este rol sólo puede ser modificado por la coordinación. Una cobertura autorizada cambia quién realiza la actividad ese día, pero conserva la asignación original.
            </p>
        </div>
    `;
}


function renderizarActividadRolServicioServidor(actividad) {
    const responsables = (actividad.asignados || [])
        .map(persona => persona.nombre)
        .filter(Boolean)
        .join(", ");
    const asignacion = actividad.supervisor
        ? `${actividad.supervisor.nombre} supervisa · ${responsables} realiza`
        : actividad.tipoAsignacion === "EQUIPO"
            ? `Equipo: ${responsables}`
            : responsables;
    const destacada = actividad.meCorresponde || actividad.supervisor;
    const etiquetaPropia = actividad.supervisor
        ? "Supervisas"
        : actividad.meCorresponde
            ? "Te corresponde"
            : "";

    return `
        <article class="servidores-actividad-rol ${destacada ? "asignacion-propia" : ""}">
            <time>${escaparHTML(actividad.horario || "Horario pendiente")}</time>
            <div>
                ${etiquetaPropia ? `<span class="servidores-asignacion-propia">${etiquetaPropia}</span>` : ""}
                <h3>${escaparHTML(actividad.titulo)}</h3>
                <p>${escaparHTML(actividad.descripcion)}</p>
                <strong>${escaparHTML(asignacion || "Responsable pendiente")}</strong>
            </div>
        </article>
    `;
}


function configurarSelectorRolServicioServidor() {
    document.querySelectorAll("[data-ir-programa-rol]").forEach(boton => {
        boton.addEventListener("click", () => {
            programaRolActivoServidor = boton.dataset.irProgramaRol;

            document.querySelectorAll("[data-ir-programa-rol]").forEach(opcion => {
                const activo = opcion.dataset.irProgramaRol === programaRolActivoServidor;
                opcion.classList.toggle("activo", activo);
                opcion.setAttribute("aria-pressed", String(activo));
            });

            document.querySelectorAll("[data-programa-rol-panel]").forEach(panel => {
                panel.hidden = panel.dataset.programaRolPanel !== programaRolActivoServidor;
            });
        });
    });

    document.querySelectorAll("[data-selector-mes-rol]").forEach(selector => {
        selector.addEventListener("change", evento => {
            const programaId = evento.currentTarget.dataset.selectorMesRol;
            mesesRolActivosServidor[programaId] = evento.currentTarget.value;

            document.querySelectorAll("[data-programa-mes]").forEach(panel => {
                if (panel.dataset.programaMes === programaId) {
                    panel.hidden = panel.dataset.rolMes !== mesesRolActivosServidor[programaId];
                }
            });
        });
    });
}


function nombreMesRolServidor(mes) {
    if (!mes) return "Mes pendiente";
    const [anio, numeroMes] = mes.split("-").map(Number);
    return new Date(anio, numeroMes - 1, 1).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric"
    });
}


function formatearPeriodoRolServidor(inicio, fin) {
    if (!inicio || !fin) return "Periodo vigente";
    return `${nombreMesRolServidor(inicio.slice(0, 7))} a ${nombreMesRolServidor(fin.slice(0, 7))}`;
}


function seleccionarUniformeServidor(uniformes) {
    if (!uniformes.length) {
        return null;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    return uniformes.find(item => !item.fecha || item.fecha >= hoy) ||
        uniformes[uniformes.length - 1];
}


function renderizarUniformeServidor(uniforme, uniformes) {
    if (!uniforme) {
        return crearEstadoVacioServidor(
            "El uniforme del próximo servicio todavía no se ha publicado."
        );
    }

    const color = normalizarColorUniformeServidor(
        uniforme.color,
        uniforme.titulo
    );
    const prenda = normalizarPrendaUniformeServidor(
        uniforme.prenda,
        uniforme.titulo
    );
    const proximos = (uniformes || [])
        .filter(item => !item.fecha || item.fecha >= new Date().toISOString().slice(0, 10))
        .slice(0, 6);

    return `
        <article class="servidores-contenido destacado servidores-uniforme-destacado">
            ${crearSimulacionUniformeServidor(color, prenda)}
            <div class="servidores-uniforme-detalle">
                <span class="servidores-uniforme-etiqueta">Próximo servicio</span>
                ${crearFechaContenidoServidor(uniforme.fecha)}
                <h3>${escaparHTML(uniforme.titulo)}</h3>
                <p>${escaparHTML(uniforme.descripcion || "Consulta esta indicación antes del servicio.")}</p>
                ${crearEnlaceContenidoServidor(uniforme.enlace, "Ver referencia")}
            </div>
        </article>
        ${renderizarProximosUniformesServidor(proximos, uniforme.id)}
    `;
}


function crearSimulacionUniformeServidor(color, prenda) {
    const datosColor = obtenerDatosColorUniformeServidor(color);
    const esPolo = prenda === "POLO";

    return `
        <div
            class="servidores-playera ${esPolo ? "es-polo" : ""}"
            style="--color-playera: ${datosColor.fondo}; --color-logo: ${datosColor.logo}; --color-logo-secundario: ${datosColor.logoSecundario};"
            role="img"
            aria-label="${esPolo ? "Camisa tipo polo" : "Playera"} color ${escaparHTML(datosColor.nombre.toLowerCase())}"
        >
            <div class="servidores-playera-logo">
                <strong>Iglesia Juvenil</strong>
                <small>JÓVENES 18+</small>
            </div>
        </div>
    `;
}


function renderizarProximosUniformesServidor(uniformes, uniformeActualId) {
    if (!uniformes.length) {
        return "";
    }

    return `
        <div class="servidores-proximos-uniformes">
            <h3>Próximas fechas</h3>
            <div class="servidores-proximos-lista">
                ${uniformes.map(item => {
                    const color = normalizarColorUniformeServidor(item.color, item.titulo);
                    const prenda = normalizarPrendaUniformeServidor(item.prenda, item.titulo);
                    const datosColor = obtenerDatosColorUniformeServidor(color);

                    return `
                        <div class="servidores-proximo-uniforme ${item.id === uniformeActualId ? "actual" : ""}">
                            <span
                                class="servidores-muestra-color"
                                style="--muestra-color: ${datosColor.fondo};"
                                aria-hidden="true"
                            ></span>
                            <div>
                                ${crearFechaContenidoServidor(item.fecha)}
                                <strong>${escaparHTML(datosColor.nombre)}</strong>
                                <small>${prenda === "POLO" ? "Tipo polo" : "Playera"}</small>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}


function normalizarColorUniformeServidor(color, titulo) {
    const valor = `${color || ""} ${titulo || ""}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    if (valor.includes("MORAD")) return "MORADO";
    if (valor.includes("VERDE") || valor.includes("LIMA")) return "VERDE LIMA";
    if (valor.includes("AZUL")) return "AZUL";
    if (valor.includes("GRIS")) return "GRIS";
    return "NEGRO";
}


function normalizarPrendaUniformeServidor(prenda, titulo) {
    const valor = `${prenda || ""} ${titulo || ""}`.toUpperCase();
    return valor.includes("POLO") ? "POLO" : "PLAYERA";
}


function obtenerDatosColorUniformeServidor(color) {
    const colores = {
        "NEGRO": {
            nombre: "Negro",
            fondo: "#090909",
            logo: "#d8f21f",
            logoSecundario: "#ffffff"
        },
        "AZUL": {
            nombre: "Azul cielo",
            fondo: "#61b6e3",
            logo: "#d8f21f",
            logoSecundario: "#ffffff"
        },
        "VERDE LIMA": {
            nombre: "Verde lima",
            fondo: "#b5ff69",
            logo: "#6f8f00",
            logoSecundario: "#ffffff"
        },
        "GRIS": {
            nombre: "Gris",
            fondo: "#9b9b9b",
            logo: "#d8f21f",
            logoSecundario: "#ffffff"
        },
        "MORADO": {
            nombre: "Morado",
            fondo: "#9400b8",
            logo: "#d8f21f",
            logoSecundario: "#ffffff"
        }
    };

    return colores[color] || colores.NEGRO;
}


function renderizarListaContenidoServidor(
    contenidos,
    mensajeVacio,
    permiteCompletar
) {
    if (!contenidos.length) {
        return crearEstadoVacioServidor(mensajeVacio);
    }

    return contenidos
        .map(item => `
            <article class="servidores-contenido ${item.completada ? "completado" : ""}">
                <div class="servidores-contenido-cuerpo">
                    ${crearFechaContenidoServidor(item.fecha)}
                    <h3>${escaparHTML(item.titulo)}</h3>
                    ${
                        item.descripcion
                            ? `<p>${escaparHTML(item.descripcion)}</p>`
                            : ""
                    }
                    ${crearEnlaceContenidoServidor(item.enlace, "Abrir material")}
                </div>
                ${
                    permiteCompletar
                        ? `
                            <button
                                class="servidores-completar"
                                type="button"
                                data-contenido-completar="${escaparHTML(item.id)}"
                                data-completada="${Boolean(item.completada)}"
                                aria-pressed="${Boolean(item.completada)}"
                            >
                                ${item.completada ? "✓ Completada" : "Marcar como completada"}
                            </button>
                        `
                        : ""
                }
            </article>
        `)
        .join("");
}


function crearInsigniasRolesServidor(roles = []) {
    const etiquetas = {
        SERVIDOR: "Servidor",
        CAPITAN: "Capitán",
        PASTOR: "Pastor",
        COORDINADOR_ROLES: "Coordinación de roles",
        APROBADOR_PERMISOS: "Autoriza permisos",
        ADMINISTRADOR: "Administrador"
    };

    return roles
        .map(rol => `
            <span class="servidores-rol">
                ${escaparHTML(etiquetas[rol] || rol)}
            </span>
        `)
        .join("");
}


function claseSemaforoPermisosServidor(permisos) {
    const total = Number(permisos || 0);
    if (total >= 6) return "nivel-rojo";
    if (total >= 5) return "nivel-naranja";
    if (total >= 4) return "nivel-amarillo";
    return "nivel-verde";
}


function renderizarPermisosServidor(gestion) {
    if (!gestion) {
        return "";
    }

    const hoy = new Date().toISOString().slice(0, 10);
    const servicios = (gestion.servicios || [])
        .filter(servicio => servicio.activo && servicio.fecha >= hoy);
    const reemplazos = (gestion.servidoresDisponibles || [])
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    return `
        <section id="permisosServidor" class="servidores-seccion">
            <div class="servidores-seccion-titulo">
                <span>🗓️</span>
                <div>
                    <h2>Solicitar permiso</h2>
                    <p>Requiere autorización del capitán, pastor y reemplazo</p>
                </div>
            </div>

            <form id="formPermisoServidor" class="servidores-formulario">
                <label>
                    Tipo de permiso
                    <select name="tipo" required>
                        <option value="NORMAL">Permiso normal</option>
                        <option value="EMERGENCIA">Permiso por emergencia</option>
                    </select>
                </label>
                <label>
                    Fecha de servicio
                    <select name="servicioId" required>
                        <option value="">Selecciona una fecha</option>
                        ${servicios.map(servicio => `
                            <option value="${escaparHTML(servicio.id)}">
                                ${escaparHTML(formatearFechaBreveServidor(servicio.fecha))}
                            </option>
                        `).join("")}
                    </select>
                </label>
                <label class="servidores-campo-completo">
                    Servidor que cubrirá tu área
                    <select name="reemplazoId" required>
                        <option value="">Selecciona un reemplazo</option>
                        ${reemplazos.map(persona => `
                            <option value="${escaparHTML(persona.id)}">
                                ${escaparHTML(persona.nombre)}${persona.area ? ` · ${escaparHTML(persona.area)}` : ""}
                            </option>
                        `).join("")}
                    </select>
                </label>
                <label class="servidores-campo-completo">
                    Motivo
                    <textarea name="motivo" rows="3" required placeholder="Explica brevemente el motivo"></textarea>
                </label>
                <label class="servidores-campo-completo">
                    Comentario adicional <small>(opcional)</small>
                    <textarea name="comentario" rows="2"></textarea>
                </label>
                <p class="servidores-ayuda servidores-campo-completo">
                    Los permisos normales se recomiendan con 15 días de anticipación.
                    Si falta menos tiempo, podrás enviarlo y quedará marcado fuera de plazo.
                </p>
                <button class="servidores-accion-primaria" type="submit" ${servicios.length && reemplazos.length ? "" : "disabled"}>
                    Enviar solicitud
                </button>
            </form>

            <div class="servidores-subseccion">
                <h3>Mis solicitudes</h3>
                ${renderizarListaPermisosServidor(gestion.permisos || [], true)}
            </div>
        </section>
    `;
}


function renderizarListaPermisosServidor(permisos, propios) {
    if (!permisos.length) {
        return crearEstadoVacioServidor("Todavía no hay solicitudes de permiso.");
    }

    return `<div class="servidores-lista-gestion">${permisos.map(permiso => `
        <article class="servidores-tarjeta-gestion">
            <div class="servidores-tarjeta-cabecera">
                <div>
                    <span class="servidores-estado ${claseEstadoGestionServidor(permiso.estado)}">
                        ${escaparHTML(etiquetaEstadoGestionServidor(permiso.estado))}
                    </span>
                    <h3>${permiso.tipo === "EMERGENCIA" ? "Permiso por emergencia" : "Permiso normal"}</h3>
                    ${crearFechaContenidoServidor(permiso.fechaServicio)}
                </div>
                ${permiso.fueraPlazo ? `<span class="servidores-fuera-plazo">Fuera de plazo</span>` : ""}
            </div>
            ${propios ? "" : `<p><strong>Servidor:</strong> ${escaparHTML(permiso.servidorNombre)}</p>`}
            <p><strong>Motivo:</strong> ${escaparHTML(permiso.motivo)}</p>
            <p><strong>Reemplazo:</strong> ${escaparHTML(permiso.reemplazoNombre || "Pendiente")}</p>
            <div class="servidores-aprobaciones-resumen">
                <span>Capitán: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.capitanEstado))}</span>
                <span>Pastor: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.pastorEstado))}</span>
                <span>Cobertura: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.coberturaEstado))}</span>
            </div>
            ${propios && permiso.estado === "PENDIENTE" ? `
                <button class="servidores-accion-secundaria" type="button" data-cancelar-permiso="${escaparHTML(permiso.id)}">
                    Cancelar solicitud
                </button>
            ` : ""}
        </article>
    `).join("")}</div>`;
}


function renderizarCoberturasServidor(gestion) {
    if (!gestion) return "";

    const coberturas = gestion.coberturas || [];

    return `
        <section id="coberturasServidor" class="servidores-seccion">
            <div class="servidores-seccion-titulo">
                <span>🤝</span>
                <div>
                    <h2>Mis coberturas</h2>
                    <p>Servicios en los que apoyarás a otra persona</p>
                </div>
            </div>
            ${coberturas.length ? `
                <div class="servidores-lista-gestion">
                    ${coberturas.map(cobertura => `
                        <article class="servidores-tarjeta-gestion ${cobertura.coberturaEstado === "ACEPTADA" ? "cobertura-confirmada" : ""}">
                            <span class="servidores-estado ${claseEstadoGestionServidor(cobertura.coberturaEstado)}">
                                ${escaparHTML(etiquetaEstadoGestionServidor(cobertura.coberturaEstado))}
                            </span>
                            <h3>${cobertura.coberturaEstado === "ACEPTADA" ? "Cobertura asignada" : "Solicitud de cobertura"}</h3>
                            ${crearFechaContenidoServidor(cobertura.fechaServicio)}
                            <p>Cubrirás a <strong>${escaparHTML(cobertura.servidorNombre)}</strong>.</p>
                            ${cobertura.coberturaEstado === "PENDIENTE" ? `
                                <div class="servidores-acciones">
                                    <button type="button" class="servidores-accion-primaria" data-cobertura-id="${escaparHTML(cobertura.id)}" data-cobertura-respuesta="ACEPTAR">Aceptar cobertura</button>
                                    <button type="button" class="servidores-accion-secundaria" data-cobertura-id="${escaparHTML(cobertura.id)}" data-cobertura-respuesta="RECHAZAR">No puedo cubrir</button>
                                </div>
                            ` : ""}
                        </article>
                    `).join("")}
                </div>
            ` : crearEstadoVacioServidor("No tienes coberturas asignadas.")}
        </section>
    `;
}


function renderizarGestionEquipoServidor(gestion) {
    const perfil = gestion?.perfil || { roles: [] };
    const roles = perfil.roles || [];
    const esCapitan = roles.includes("CAPITAN");
    const esPastor = roles.includes("PASTOR");
    const esAdmin = roles.includes("ADMINISTRADOR");
    const puedeAprobarPermisos = Boolean(perfil.puedeAprobarPermisos);
    const solicitudes = gestion?.solicitudesAprobacion || [];
    const equipo = gestion?.equipo || [];
    const hoy = new Date().toISOString().slice(0, 10);
    const servicios = (gestion?.servicios || []).filter(item => item.fecha >= hoy);

    return `
        <section id="gestionEquipoServidor" class="servidores-seccion">
            <div class="servidores-seccion-titulo">
                <span>📋</span>
                <div>
                    <h2>Gestión del equipo</h2>
                    <p>Elige la herramienta que necesitas</p>
                </div>
            </div>

            <nav class="servidores-gestion-menu" aria-label="Herramientas de gestión">
                <button type="button" data-ir-gestion-panel="aprobaciones">✅ Aprobaciones${solicitudes.length ? ` (${solicitudes.length})` : ""}</button>
                ${(esCapitan || esAdmin) ? `<button type="button" data-ir-gestion-panel="asistencia">📝 Pase de lista</button>` : ""}
                <button type="button" data-ir-gestion-panel="avisos">📣 Publicar aviso</button>
                <button type="button" data-ir-gestion-panel="directorio">👥 Servidores</button>
            </nav>

            <div class="servidores-subseccion servidores-panel-gestion" data-gestion-panel="aprobaciones">
                <h3>Solicitudes por revisar</h3>
                ${solicitudes.length ? `
                    <div class="servidores-lista-gestion">
                        ${solicitudes.map(permiso => `
                            <article class="servidores-tarjeta-gestion">
                                <span class="servidores-estado ${claseEstadoGestionServidor(permiso.estado)}">${escaparHTML(etiquetaEstadoGestionServidor(permiso.estado))}</span>
                                <h3>${escaparHTML(permiso.servidorNombre)}</h3>
                                ${crearFechaContenidoServidor(permiso.fechaServicio)}
                                <p>${escaparHTML(permiso.motivo)}</p>
                                <p><strong>Reemplazo:</strong> ${escaparHTML(permiso.reemplazoNombre)}</p>
                                <div class="servidores-aprobaciones-resumen">
                                    <span>Capitán: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.capitanEstado))}</span>
                                    <span>Pastor: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.pastorEstado))}</span>
                                    <span>Cobertura: ${escaparHTML(etiquetaEstadoGestionServidor(permiso.coberturaEstado))}</span>
                                </div>
                                <div class="servidores-acciones-aprobacion">
                                    ${(esCapitan || esAdmin) && permiso.capitanEstado === "PENDIENTE" ? crearBotonesAprobacionServidor(permiso.id, "CAPITAN") : ""}
                                    ${puedeAprobarPermisos && permiso.pastorEstado === "PENDIENTE" ? crearBotonesAprobacionServidor(permiso.id, "PASTOR") : ""}
                                </div>
                            </article>
                        `).join("")}
                    </div>
                ` : crearEstadoVacioServidor("No hay permisos pendientes de revisión.")}
            </div>

            ${(esCapitan || esAdmin) ? `
                <div class="servidores-subseccion servidores-panel-gestion" data-gestion-panel="asistencia">
                    <h3>Pase de lista</h3>
                    ${equipo.length && servicios.length ? `
                        <form id="formAsistenciaServidor" class="servidores-formulario">
                            <label class="servidores-campo-completo">
                                Fecha de servicio
                                <select name="servicioId" required>
                                    ${servicios.map(servicio => `<option value="${escaparHTML(servicio.id)}">${escaparHTML(formatearFechaBreveServidor(servicio.fecha))}</option>`).join("")}
                                </select>
                            </label>
                            <div class="servidores-lista-asistencia servidores-campo-completo">
                                ${equipo.map(persona => `
                                    <label>
                                        <input type="checkbox" name="asistencia" value="${escaparHTML(persona.id)}" checked>
                                        <span><strong>${escaparHTML(persona.nombre)}</strong><small>${escaparHTML(persona.area || "Área pendiente")}</small></span>
                                        <em>${persona.permisosUsados} de ${persona.limitePermisos} permisos · ${persona.faltasSinPermiso} sin permiso</em>
                                    </label>
                                `).join("")}
                            </div>
                            <p class="servidores-ayuda servidores-campo-completo">Todos aparecen presentes inicialmente. Desmarca únicamente a quien no asistió.</p>
                            <button class="servidores-accion-primaria" type="submit">Guardar lista</button>
                        </form>
                    ` : crearEstadoVacioServidor("Falta configurar integrantes o fechas de servicio.")}
                </div>
            ` : ""}

            <div class="servidores-subseccion servidores-panel-gestion" data-gestion-panel="avisos">
                <h3>Publicar aviso</h3>
                <form id="formAvisoAreaServidor" class="servidores-formulario">
                    <label>
                        Título
                        <input name="titulo" required maxlength="80">
                    </label>
                    <label>
                        Fecha relacionada <small>(opcional)</small>
                        <input name="fecha" type="date">
                    </label>
                    <label class="servidores-campo-completo">
                        Aviso
                        <textarea name="descripcion" rows="3" required></textarea>
                    </label>
                    <button class="servidores-accion-primaria" type="submit">Publicar aviso</button>
                </form>
            </div>

            <div class="servidores-subseccion servidores-panel-gestion" data-gestion-panel="directorio">
                <h3>Información de servidores</h3>
                ${equipo.length ? `
                    <div class="servidores-directorio">
                        ${equipo.map(persona => `
                            <article>
                                <div><strong>${escaparHTML(persona.nombre)}</strong><small>${escaparHTML(persona.id)}</small></div>
                                <span>${escaparHTML(persona.area || "Área pendiente")}</span>
                                <em class="${claseSemaforoPermisosServidor(persona.permisosUsados)}">${persona.permisosUsados} / ${persona.limitePermisos} permisos · ${persona.faltasSinPermiso} faltas sin permiso</em>
                            </article>
                        `).join("")}
                    </div>
                ` : crearEstadoVacioServidor("Todavía no hay integrantes asignados a tu alcance.")}
            </div>
        </section>
    `;
}


function crearBotonesAprobacionServidor(permisoId, aprobador) {
    const etiqueta = aprobador === "PASTOR" ? "pastor" : "capitán";
    return `
        <div>
            <small>Decisión como ${etiqueta}</small>
            <button type="button" class="servidores-accion-primaria" data-aprobar-permiso="${escaparHTML(permisoId)}" data-decision="APROBAR" data-aprobador="${aprobador}">Aprobar</button>
            <button type="button" class="servidores-accion-secundaria" data-aprobar-permiso="${escaparHTML(permisoId)}" data-decision="RECHAZAR" data-aprobador="${aprobador}">Rechazar</button>
        </div>
    `;
}


function etiquetaEstadoGestionServidor(estado) {
    const etiquetas = {
        PENDIENTE: "Pendiente",
        APROBADO: "Aprobado",
        RECHAZADO: "Rechazado",
        ACEPTADA: "Aceptada",
        RECHAZADA: "Rechazada",
        AUTORIZADO: "Autorizado",
        EMERGENCIA_AUTORIZADA: "Emergencia autorizada",
        COBERTURA_RECHAZADA: "Cambiar reemplazo",
        CANCELADO: "Cancelado"
    };
    return etiquetas[estado] || estado || "Pendiente";
}


function claseEstadoGestionServidor(estado) {
    if (["AUTORIZADO", "EMERGENCIA_AUTORIZADA", "APROBADO", "ACEPTADA"].includes(estado)) return "estado-verde";
    if (["RECHAZADO", "RECHAZADA", "COBERTURA_RECHAZADA", "CANCELADO"].includes(estado)) return "estado-rojo";
    return "estado-amarillo";
}


function formatearFechaBreveServidor(fecha) {
    if (!fecha) return "Fecha pendiente";
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


function configurarEventosGestionServidor(gestion) {
    if (!gestion) return;

    const formPermiso = document.getElementById("formPermisoServidor");
    formPermiso?.addEventListener("submit", enviarSolicitudPermisoServidor);

    document.querySelectorAll("[data-cobertura-id]").forEach(boton => {
        boton.addEventListener("click", () => responderCoberturaDesdePortalServidor(
            boton.dataset.coberturaId,
            boton.dataset.coberturaRespuesta,
            boton
        ));
    });

    document.querySelectorAll("[data-aprobar-permiso]").forEach(boton => {
        boton.addEventListener("click", () => resolverPermisoDesdePortalServidor(
            boton.dataset.aprobarPermiso,
            boton.dataset.decision,
            boton.dataset.aprobador,
            boton
        ));
    });

    document.querySelectorAll("[data-cancelar-permiso]").forEach(boton => {
        boton.addEventListener("click", () => cancelarPermisoDesdePortalServidor(
            boton.dataset.cancelarPermiso,
            boton
        ));
    });

    document
        .getElementById("formAsistenciaServidor")
        ?.addEventListener("submit", guardarAsistenciaDesdePortalServidor);

    document
        .getElementById("formAvisoAreaServidor")
        ?.addEventListener("submit", publicarAvisoDesdePortalServidor);
}


async function enviarSolicitudPermisoServidor(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const sesion = obtenerSesionServidorGuardada();
    const boton = formulario.querySelector("button[type='submit']");
    const datos = Object.fromEntries(new FormData(formulario).entries());

    await ejecutarAccionGestionServidor(boton, "Enviando...", async () => {
        const respuesta = await solicitarPermisoServidorAPI(sesion.token, datos);
        if (!respuesta?.ok) throw new Error(respuesta?.mensaje || "No fue posible enviar la solicitud.");
        alert(respuesta.mensaje);
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function responderCoberturaDesdePortalServidor(permisoId, respuesta, boton) {
    const sesion = obtenerSesionServidorGuardada();
    await ejecutarAccionGestionServidor(boton, "Guardando...", async () => {
        const resultado = await responderCoberturaServidorAPI(sesion.token, permisoId, respuesta);
        if (!resultado?.ok) throw new Error(resultado?.mensaje || "No fue posible responder.");
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function resolverPermisoDesdePortalServidor(permisoId, decision, aprobador, boton) {
    const sesion = obtenerSesionServidorGuardada();
    await ejecutarAccionGestionServidor(boton, "Guardando...", async () => {
        const resultado = await resolverPermisoServidorAPI(sesion.token, permisoId, decision, aprobador);
        if (!resultado?.ok) throw new Error(resultado?.mensaje || "No fue posible resolver el permiso.");
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function cancelarPermisoDesdePortalServidor(permisoId, boton) {
    if (!confirm("¿Quieres cancelar esta solicitud?")) return;
    const sesion = obtenerSesionServidorGuardada();
    await ejecutarAccionGestionServidor(boton, "Cancelando...", async () => {
        const resultado = await cancelarPermisoServidorAPI(sesion.token, permisoId);
        if (!resultado?.ok) throw new Error(resultado?.mensaje || "No fue posible cancelar.");
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function guardarAsistenciaDesdePortalServidor(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const sesion = obtenerSesionServidorGuardada();
    const boton = formulario.querySelector("button[type='submit']");
    const servicioId = formulario.elements.servicioId.value;
    const registros = Array.from(formulario.querySelectorAll("input[name='asistencia']"))
        .map(campo => ({ servidorId: campo.value, asistio: campo.checked }));

    await ejecutarAccionGestionServidor(boton, "Guardando lista...", async () => {
        const resultado = await guardarListaAsistenciaServidorAPI(sesion.token, servicioId, registros);
        if (!resultado?.ok) throw new Error(resultado?.mensaje || "No fue posible guardar la lista.");
        alert(resultado.mensaje);
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function publicarAvisoDesdePortalServidor(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const sesion = obtenerSesionServidorGuardada();
    const boton = formulario.querySelector("button[type='submit']");
    const datos = Object.fromEntries(new FormData(formulario).entries());

    await ejecutarAccionGestionServidor(boton, "Publicando...", async () => {
        const resultado = await publicarAvisoAreaServidorAPI(sesion.token, datos);
        if (!resultado?.ok) throw new Error(resultado?.mensaje || "No fue posible publicar el aviso.");
        await cargarPanelServidor(sesion.servidor, sesion.token);
    });
}


async function ejecutarAccionGestionServidor(boton, texto, accion) {
    const textoAnterior = boton?.textContent || "";
    if (boton) {
        boton.disabled = true;
        boton.textContent = texto;
    }

    try {
        await accion();
    } catch (error) {
        alert(error.message || "No fue posible completar la acción.");
        if (boton) {
            boton.disabled = false;
            boton.textContent = textoAnterior;
        }
    }
}


function crearEstadoVacioServidor(mensaje) {
    return `
        <div class="servidores-vacio">
            <span>Todo tranquilo por aquí</span>
            <p>${escaparHTML(mensaje)}</p>
        </div>
    `;
}


function crearFechaContenidoServidor(fecha) {
    if (!fecha) {
        return "";
    }

    const valor = new Date(fecha + "T12:00:00");
    const texto = valor.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });

    return `<time datetime="${fecha}">${escaparHTML(texto)}</time>`;
}


function crearEnlaceContenidoServidor(enlace, texto) {
    const enlaceSeguro = normalizarEnlaceServidor(enlace);

    if (!enlaceSeguro) {
        return "";
    }

    return `
        <a
            class="servidores-enlace-contenido"
            href="${escaparHTML(enlaceSeguro)}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${escaparHTML(texto)} ↗
        </a>
    `;
}


function normalizarEnlaceServidor(enlace) {
    try {
        const url = new URL(String(enlace || ""));
        return url.protocol === "https:" ? url.href : "";
    } catch (error) {
        return "";
    }
}


async function cambiarEstadoActividadServidor(
    contenidoId,
    completada,
    boton
) {
    const sesion = obtenerSesionServidorGuardada();

    if (!sesion?.token) {
        renderizarAccesoServidor();
        return;
    }

    boton.disabled = true;
    boton.textContent = "Guardando...";

    try {
        const respuesta = await marcarActividadServidorAPI(
            sesion.token,
            contenidoId,
            completada
        );

        if (!respuesta || !respuesta.ok) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible actualizar la actividad."
            );
        }

        await cargarPanelServidor(
            sesion.servidor,
            sesion.token
        );
    } catch (error) {
        alert(
            error.message ||
            "No fue posible actualizar la actividad."
        );
        boton.disabled = false;
        boton.textContent = completada
            ? "Marcar como completada"
            : "✓ Completada";
    }
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
