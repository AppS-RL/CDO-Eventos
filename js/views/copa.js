const COPA_EVENTO_CODIGO = "SEP26";

let copaCategoriaActual = "";
let copaJugadoresRegistro = [];
let copaAccionEnProceso = false;


async function mostrarCopaGolDeFe(categoria) {
    await detenerScannerQR();

    copaCategoriaActual = normalizarCategoriaCopa(categoria);

    const app = document.getElementById("app");
    const categoriaVisible = formatearCategoriaCopa(
        copaCategoriaActual
    );

    app.innerHTML = `
        <div class="app">
            <header class="app-header copa-header">
                <h1>⚽ Copa Gol de Fe</h1>
                <p>${categoriaVisible}</p>
            </header>

            <main class="app-content">
                <div class="app-card operador-card copa-card">
                    <button
                        id="btnVolverOperadorCopa"
                        class="boton copa-volver"
                        type="button"
                    >
                        ← Volver a Operador
                    </button>

                    <div id="contenidoCopa">
                        <div class="copa-cargando">
                            Cargando torneo...
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    document
        .getElementById("btnVolverOperadorCopa")
        .addEventListener("click", mostrarOperador);

    await cargarCopaGolDeFe();
}


async function cargarCopaGolDeFe() {
    const contenido = document.getElementById("contenidoCopa");

    if (!contenido) {
        return;
    }

    contenido.innerHTML = `
        <div class="copa-cargando">
            Cargando torneo...
        </div>
    `;

    try {
        const respuesta = await obtenerCopaGolDeFeAPI(
            copaCategoriaActual
        );

        if (!respuesta || respuesta.ok !== true) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible cargar el torneo."
            );
        }

        renderizarPanelCopa(respuesta);

    } catch (error) {
        console.error(error);

        contenido.innerHTML = `
            <div class="copa-mensaje copa-mensaje-error">
                <strong>No pudimos cargar la Copa.</strong>
                <p>${escaparHTMLCopa(error.message)}</p>
                <button
                    id="btnReintentarCopa"
                    class="boton"
                    type="button"
                >
                    Reintentar
                </button>
            </div>
        `;

        document
            .getElementById("btnReintentarCopa")
            .addEventListener("click", cargarCopaGolDeFe);
    }
}


function renderizarPanelCopa(datos) {
    const contenido = document.getElementById("contenidoCopa");

    if (!contenido) {
        return;
    }

    const equipos = Array.isArray(datos.equipos)
        ? datos.equipos
        : [];

    const partidos = Array.isArray(datos.partidos)
        ? datos.partidos
        : [];

    const torneoGenerado =
        datos.torneoGenerado === true ||
        partidos.length > 0 ||
        Boolean(datos.campeon);

    const inscripcionesAbiertas =
        datos.inscripcionesAbiertas !== false &&
        !torneoGenerado;

    contenido.innerHTML = `
        <section class="copa-resumen">
            <div>
                <span>Equipos</span>
                <strong>${equipos.length}</strong>
            </div>

            <div>
                <span>Estado</span>
                <strong>
                    ${
                        datos.campeon
                            ? "Finalizado"
                            : torneoGenerado
                                ? "En juego"
                                : "Inscripciones"
                    }
                </strong>
            </div>
        </section>

        ${crearCampeonCopa(datos.campeon)}

        <div class="copa-acciones">
            ${
                inscripcionesAbiertas
                    ? `
                        <button
                            id="btnRegistrarEquipoCopa"
                            class="boton principal"
                            type="button"
                        >
                            ＋ Registrar equipo
                        </button>

                        <button
                            id="btnGenerarTorneoCopa"
                            class="boton"
                            type="button"
                            ${equipos.length < 2 ? "disabled" : ""}
                        >
                            🏆 Generar torneo
                        </button>
                      `
                    : ""
            }
        </div>

        ${crearListaEquiposCopa(
            equipos,
            inscripcionesAbiertas
        )}

        ${crearListaPartidosCopa(partidos)}
    `;

    const registrar = document.getElementById(
        "btnRegistrarEquipoCopa"
    );

    if (registrar) {
        registrar.addEventListener("click", () => {
            mostrarRegistroEquipoCopa(copaCategoriaActual);
        });
    }

    const generar = document.getElementById(
        "btnGenerarTorneoCopa"
    );

    if (generar) {
        generar.addEventListener("click", () => {
            generarTorneoCopa(equipos.length);
        });
    }

    contenido
        .querySelectorAll("[data-eliminar-equipo]")
        .forEach(boton => {
            boton.addEventListener("click", () => {
                eliminarEquipoCopa(
                    boton.dataset.eliminarEquipo,
                    boton.dataset.nombreEquipo
                );
            });
        });

    contenido
        .querySelectorAll("[data-ganador-partido]")
        .forEach(boton => {
            boton.addEventListener("click", () => {
                elegirGanadorCopa(
                    boton.dataset.partidoId,
                    boton.dataset.ganadorPartido,
                    boton.dataset.nombreEquipo
                );
            });
        });
}


function crearCampeonCopa(campeon) {
    if (!campeon) {
        return "";
    }

    const nombre = typeof campeon === "string"
        ? campeon
        : campeon.nombre;

    return `
        <section class="copa-campeon">
            <span>🏆 Equipo campeón</span>
            <strong>${escaparHTMLCopa(nombre || "")}</strong>
        </section>
    `;
}


function crearListaEquiposCopa(
    equipos,
    inscripcionesAbiertas
) {
    const tarjetas = equipos.length
        ? equipos.map((equipo, indice) => {
            const jugadores = obtenerJugadoresEquipoCopa(equipo);
            const equipoId = obtenerIdEquipoCopa(equipo);
            const nombre = equipo.nombre || `Equipo ${indice + 1}`;

            return `
                <article class="copa-equipo">
                    <div class="copa-equipo-encabezado">
                        <strong>${escaparHTMLCopa(nombre)}</strong>

                        ${
                            inscripcionesAbiertas
                                ? `
                                    <button
                                        class="copa-eliminar"
                                        data-eliminar-equipo="${escaparAtributoCopa(equipoId)}"
                                        data-nombre-equipo="${escaparAtributoCopa(nombre)}"
                                        type="button"
                                        aria-label="Eliminar ${escaparAtributoCopa(nombre)}"
                                    >
                                        Eliminar
                                    </button>
                                  `
                                : ""
                        }
                    </div>

                    <div class="copa-jugadores-resumen">
                        ${jugadores.map(jugador => `
                            <span>
                                👤 ${escaparHTMLCopa(jugador.nombre || jugador.id)}
                                <small>${escaparHTMLCopa(jugador.id || "")}</small>
                            </span>
                        `).join("")}
                    </div>
                </article>
            `;
        }).join("")
        : `
            <div class="copa-vacio">
                <div>⚽</div>
                <strong>Aún no hay equipos inscritos</strong>
                <p>Registra el primero escaneando sus dos jugadores.</p>
            </div>
        `;

    return `
        <section class="copa-seccion">
            <h2>Equipos inscritos</h2>
            <div class="copa-lista-equipos">
                ${tarjetas}
            </div>
        </section>
    `;
}


function crearListaPartidosCopa(partidos) {
    if (!partidos.length) {
        return "";
    }

    const rondas = partidos.reduce((acumulado, partido) => {
        const ronda = partido.ronda || "Partidos";

        if (!acumulado[ronda]) {
            acumulado[ronda] = [];
        }

        acumulado[ronda].push(partido);
        return acumulado;
    }, {});

    return `
        <section class="copa-seccion copa-partidos">
            <h2>Llaves del torneo</h2>

            ${Object.entries(rondas).map(([ronda, lista]) => `
                <div class="copa-ronda">
                    <h3>${escaparHTMLCopa(ronda)}</h3>
                    ${lista.map(crearPartidoCopa).join("")}
                </div>
            `).join("")}
        </section>
    `;
}


function crearPartidoCopa(partido) {
    const equipo1 = normalizarEquipoPartidoCopa(
        partido.equipo1,
        partido.equipo1Id,
        partido.equipo1Nombre
    );

    const equipo2 = normalizarEquipoPartidoCopa(
        partido.equipo2,
        partido.equipo2Id,
        partido.equipo2Nombre
    );

    const ganadorId = String(
        partido.ganadorId || partido.ganador?.id || ""
    );

    const pendiente =
        !ganadorId &&
        equipo1.id &&
        equipo2.id;

    return `
        <article class="copa-partido ${ganadorId ? "copa-partido-finalizado" : ""}">
            <small>Partido ${escaparHTMLCopa(partido.numero || partido.orden || "")}</small>

            ${crearOpcionEquipoPartidoCopa(
                partido.id,
                equipo1,
                ganadorId,
                pendiente
            )}

            <span class="copa-versus">vs.</span>

            ${crearOpcionEquipoPartidoCopa(
                partido.id,
                equipo2,
                ganadorId,
                pendiente
            )}
        </article>
    `;
}


function crearOpcionEquipoPartidoCopa(
    partidoId,
    equipo,
    ganadorId,
    habilitado
) {
    if (!equipo.id) {
        return `
            <div class="copa-rival copa-rival-espera">
                Por definir
            </div>
        `;
    }

    const esGanador = String(equipo.id) === ganadorId;

    if (!habilitado) {
        return `
            <div class="copa-rival ${esGanador ? "copa-rival-ganador" : ""}">
                ${esGanador ? "✓ " : ""}${escaparHTMLCopa(equipo.nombre)}
            </div>
        `;
    }

    return `
        <button
            class="copa-rival copa-rival-seleccionable"
            data-partido-id="${escaparAtributoCopa(partidoId)}"
            data-ganador-partido="${escaparAtributoCopa(equipo.id)}"
            data-nombre-equipo="${escaparAtributoCopa(equipo.nombre)}"
            type="button"
        >
            ${escaparHTMLCopa(equipo.nombre)}
        </button>
    `;
}


async function mostrarRegistroEquipoCopa(categoria) {
    await detenerScannerQR();

    copaCategoriaActual = normalizarCategoriaCopa(categoria);
    copaJugadoresRegistro = [];

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="app">
            <header class="app-header copa-header">
                <h1>⚽ Nuevo equipo</h1>
                <p>Copa Gol de Fe · ${formatearCategoriaCopa(copaCategoriaActual)}</p>
            </header>

            <main class="app-content">
                <div class="app-card operador-card copa-card">
                    <div class="campo">
                        <label for="nombreEquipoCopa">
                            Nombre del equipo
                        </label>
                        <input
                            id="nombreEquipoCopa"
                            type="text"
                            maxlength="50"
                            placeholder="Ej. Guerreros de Fe"
                            autocomplete="off"
                        >
                    </div>

                    <section class="copa-registro-jugadores">
                        <h2>Jugadores</h2>
                        <p>Escanea exactamente dos códigos QR.</p>

                        <div id="jugadoresEquipoCopa" class="copa-jugadores-registro"></div>
                    </section>

                    <div id="zonaScanner" class="zona-scanner">
                        <div class="scanner-placeholder">
                            <div class="scanner-icono">📷</div>
                            <strong>Escáner QR</strong>
                            <p>La cámara aparecerá aquí.</p>
                        </div>
                    </div>

                    <div class="operador-prueba">
                        <p>Registro manual</p>

                        <div class="campo">
                            <input
                                id="idJugadorCopa"
                                type="text"
                                placeholder="Ej. SEP26-0014"
                                autocomplete="off"
                            >
                        </div>

                        <button
                            id="btnAgregarJugadorCopa"
                            class="boton"
                            type="button"
                        >
                            Agregar ID
                        </button>
                    </div>

                    <div id="resultadoCopa"></div>

                    <button
                        id="btnGuardarEquipoCopa"
                        class="boton principal"
                        type="button"
                        disabled
                    >
                        Guardar equipo
                    </button>

                    <button
                        id="btnCancelarEquipoCopa"
                        class="boton"
                        type="button"
                    >
                        ← Cancelar
                    </button>
                </div>
            </main>
        </div>
    `;

    actualizarJugadoresRegistroCopa();

    document
        .getElementById("btnAgregarJugadorCopa")
        .addEventListener("click", agregarJugadorManualCopa);

    document
        .getElementById("idJugadorCopa")
        .addEventListener("keydown", evento => {
            if (evento.key === "Enter") {
                agregarJugadorManualCopa();
            }
        });

    document
        .getElementById("btnGuardarEquipoCopa")
        .addEventListener("click", guardarEquipoCopa);

    document
        .getElementById("btnCancelarEquipoCopa")
        .addEventListener("click", async () => {
            await detenerScannerQR();
            mostrarCopaGolDeFe(copaCategoriaActual);
        });

    iniciarScannerQR(procesarJugadorCopa);
}


function agregarJugadorManualCopa() {
    const input = document.getElementById("idJugadorCopa");
    const id = String(input?.value || "")
        .trim()
        .toUpperCase();

    if (!id) {
        return;
    }

    input.value = "";
    procesarJugadorCopa(id);
}


async function procesarJugadorCopa(id) {
    if (copaAccionEnProceso || copaJugadoresRegistro.length >= 2) {
        return;
    }

    const resultado = document.getElementById("resultadoCopa");

    if (copaJugadoresRegistro.some(jugador => jugador.id === id)) {
        mostrarMensajeRegistroCopa(
            "Ese jugador ya está agregado al equipo.",
            false
        );
        return;
    }

    copaAccionEnProceso = true;

    if (resultado) {
        resultado.innerHTML = `
            <div class="operador-procesando">
                Buscando jugador...
            </div>
        `;
    }

    try {
        const respuesta = await buscarAsistenteAPI(
            id,
            COPA_EVENTO_CODIGO
        );

        if (!respuesta || respuesta.ok !== true || !respuesta.asistente) {
            throw new Error(
                respuesta?.mensaje ||
                "No encontramos un asistente con ese QR."
            );
        }

        copaJugadoresRegistro.push({
            id: respuesta.asistente.id,
            nombre: respuesta.asistente.nombre
        });

        actualizarJugadoresRegistroCopa();

        mostrarMensajeRegistroCopa(
            `${respuesta.asistente.nombre} fue agregado.`,
            true
        );

    } catch (error) {
        console.error(error);
        mostrarMensajeRegistroCopa(error.message, false);

    } finally {
        copaAccionEnProceso = false;
    }
}


function actualizarJugadoresRegistroCopa() {
    const contenedor = document.getElementById(
        "jugadoresEquipoCopa"
    );

    if (!contenedor) {
        return;
    }

    const espacios = [0, 1].map(indice => {
        const jugador = copaJugadoresRegistro[indice];

        if (!jugador) {
            return `
                <div class="copa-jugador-pendiente">
                    <span>${indice + 1}</span>
                    <div>
                        <strong>Jugador ${indice + 1}</strong>
                        <small>Pendiente de escanear</small>
                    </div>
                </div>
            `;
        }

        return `
            <div class="copa-jugador-agregado">
                <span>✓</span>
                <div>
                    <strong>${escaparHTMLCopa(jugador.nombre)}</strong>
                    <small>${escaparHTMLCopa(jugador.id)}</small>
                </div>
                <button
                    data-quitar-jugador="${indice}"
                    type="button"
                    aria-label="Quitar jugador"
                >
                    ×
                </button>
            </div>
        `;
    }).join("");

    contenedor.innerHTML = espacios;

    contenedor
        .querySelectorAll("[data-quitar-jugador]")
        .forEach(boton => {
            boton.addEventListener("click", () => {
                copaJugadoresRegistro.splice(
                    Number(boton.dataset.quitarJugador),
                    1
                );
                actualizarJugadoresRegistroCopa();
            });
        });

    const guardar = document.getElementById(
        "btnGuardarEquipoCopa"
    );

    if (guardar) {
        guardar.disabled = copaJugadoresRegistro.length !== 2;
    }
}


async function guardarEquipoCopa() {
    if (copaAccionEnProceso) {
        return;
    }

    const nombre = String(
        document.getElementById("nombreEquipoCopa")?.value || ""
    ).trim();

    if (!nombre) {
        mostrarMensajeRegistroCopa(
            "Escribe el nombre del equipo.",
            false
        );
        return;
    }

    if (copaJugadoresRegistro.length !== 2) {
        mostrarMensajeRegistroCopa(
            "Debes agregar exactamente dos jugadores.",
            false
        );
        return;
    }

    copaAccionEnProceso = true;

    const boton = document.getElementById("btnGuardarEquipoCopa");

    if (boton) {
        boton.disabled = true;
        boton.textContent = "Guardando...";
    }

    try {
        const respuesta = await registrarEquipoCopaAPI(
            copaCategoriaActual,
            nombre,
            copaJugadoresRegistro.map(jugador => jugador.id)
        );

        if (!respuesta || respuesta.ok !== true) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible guardar el equipo."
            );
        }

        await detenerScannerQR();
        await mostrarCopaGolDeFe(copaCategoriaActual);

    } catch (error) {
        console.error(error);
        mostrarMensajeRegistroCopa(error.message, false);

        if (boton) {
            boton.disabled = false;
            boton.textContent = "Guardar equipo";
        }

    } finally {
        copaAccionEnProceso = false;
    }
}


async function eliminarEquipoCopa(equipoId, nombre) {
    if (
        copaAccionEnProceso ||
        !confirm(`¿Eliminar al equipo ${nombre}?`)
    ) {
        return;
    }

    copaAccionEnProceso = true;

    try {
        const respuesta = await eliminarEquipoCopaAPI(
            copaCategoriaActual,
            equipoId
        );

        if (!respuesta || respuesta.ok !== true) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible eliminar el equipo."
            );
        }

        await cargarCopaGolDeFe();

    } catch (error) {
        console.error(error);
        alert(error.message);

    } finally {
        copaAccionEnProceso = false;
    }
}


async function generarTorneoCopa(cantidadEquipos) {
    if (copaAccionEnProceso || cantidadEquipos < 2) {
        return;
    }

    const confirmado = confirm(
        "Al generar el torneo se cerrarán las inscripciones y se crearán las llaves de eliminación directa. ¿Continuar?"
    );

    if (!confirmado) {
        return;
    }

    copaAccionEnProceso = true;

    try {
        const respuesta = await generarTorneoCopaAPI(
            copaCategoriaActual
        );

        if (!respuesta || respuesta.ok !== true) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible generar el torneo."
            );
        }

        await cargarCopaGolDeFe();

    } catch (error) {
        console.error(error);
        alert(error.message);

    } finally {
        copaAccionEnProceso = false;
    }
}


async function elegirGanadorCopa(
    partidoId,
    equipoId,
    nombre
) {
    if (
        copaAccionEnProceso ||
        !confirm(`¿Confirmar a ${nombre} como ganador?`)
    ) {
        return;
    }

    copaAccionEnProceso = true;

    try {
        const respuesta = await registrarGanadorCopaAPI(
            copaCategoriaActual,
            partidoId,
            equipoId
        );

        if (!respuesta || respuesta.ok !== true) {
            throw new Error(
                respuesta?.mensaje ||
                "No fue posible registrar al ganador."
            );
        }

        await cargarCopaGolDeFe();

    } catch (error) {
        console.error(error);
        alert(error.message);

    } finally {
        copaAccionEnProceso = false;
    }
}


function mostrarMensajeRegistroCopa(mensaje, exitoso) {
    const resultado = document.getElementById("resultadoCopa");

    if (!resultado) {
        return;
    }

    resultado.innerHTML = `
        <div class="copa-mensaje ${
            exitoso
                ? "copa-mensaje-ok"
                : "copa-mensaje-error"
        }">
            ${escaparHTMLCopa(mensaje)}
        </div>
    `;
}


function obtenerJugadoresEquipoCopa(equipo) {
    if (Array.isArray(equipo.jugadores)) {
        return equipo.jugadores;
    }

    return [
        {
            id: equipo.jugador1Id,
            nombre: equipo.jugador1Nombre
        },
        {
            id: equipo.jugador2Id,
            nombre: equipo.jugador2Nombre
        }
    ].filter(jugador => jugador.id || jugador.nombre);
}


function obtenerIdEquipoCopa(equipo) {
    return String(
        equipo.id || equipo.equipoId || ""
    );
}


function normalizarEquipoPartidoCopa(
    equipo,
    idAlternativo,
    nombreAlternativo
) {
    if (typeof equipo === "string") {
        return {
            id: idAlternativo || equipo,
            nombre: nombreAlternativo || equipo
        };
    }

    return {
        id: String(equipo?.id || idAlternativo || ""),
        nombre: String(
            equipo?.nombre || nombreAlternativo || "Por definir"
        )
    };
}


function normalizarCategoriaCopa(categoria) {
    return String(categoria || "")
        .trim()
        .toUpperCase() === "FEMENIL"
            ? "FEMENIL"
            : "VARONIL";
}


function formatearCategoriaCopa(categoria) {
    return normalizarCategoriaCopa(categoria) === "FEMENIL"
        ? "Femenil"
        : "Varonil";
}


function escaparHTMLCopa(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escaparAtributoCopa(valor) {
    return escaparHTMLCopa(valor);
}
