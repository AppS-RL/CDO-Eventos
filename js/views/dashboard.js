function mostrarDashboard() {
    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header">

                <h1>📊 Dashboard</h1>

                <p id="nombreEventoDashboard">
                    Cargando evento...
                </p>

            </header>

            <main class="app-content">

                <div class="app-card dashboard-card">
                                    <nav class="lista-nav">

                <button
                    id="navAsistentes"
                    class="nav-item"
                >
                    👥
                </button>

                <button
                    id="navDashboard"
                    class="nav-item nav-activo"
                >
                    📊
                </button>

                <button
                    id="navConfiguracion"
                    class="nav-item"
                >
                    ⚙️
                </button>

            </nav>

                    <div class="dashboard-header">

                        <h2>Resumen del evento</h2>

                        <p>
                            Estado general en tiempo real.
                        </p>

                    </div>

                    <div class="campo selector-evento-dashboard">

                        <label for="selectorEventoDashboard">
                            Evento
                        </label>

                        <select
                            id="selectorEventoDashboard"
                            disabled
                        >
                            <option>
                                Cargando eventos...
                            </option>
                        </select>

                    </div>

                    <div
                        id="dashboardContenido"
                        class="dashboard-contenido"
                    >
                        <div class="dashboard-cargando">
                            Cargando estadísticas...
                        </div>
                    </div>

                    <button
                        id="btnActualizarDashboard"
                        class="boton principal"
                    >
                        ↻ Actualizar
                    </button>

                </div>

            </main>



        </div>

    `;

    document
        .getElementById("navAsistentes")
        .addEventListener("click", mostrarListaAsistentes);

    document
        .getElementById("navConfiguracion")
        .addEventListener("click", mostrarConfiguracion);

    document
        .getElementById("btnActualizarDashboard")
        .addEventListener("click", cargarDashboard);

    prepararDashboard();
}


async function prepararDashboard() {
    const selector = document.getElementById(
        "selectorEventoDashboard"
    );

    try {
        await cargarEventosDisponibles();

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
            cargarDashboard();
        });

    } catch (error) {
        console.error(
            "No fue posible cargar eventos:",
            error
        );
    }

    cargarDashboard();
}


async function cargarDashboard() {
    const contenedor = document.getElementById(
        "dashboardContenido"
    );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `

        <div class="dashboard-cargando">
            Cargando estadísticas...
        </div>

    `;

    const evento =
        obtenerEventoSeleccionado();

    const titulo =
        document.getElementById(
            "nombreEventoDashboard"
        );

    if (titulo) {
        titulo.textContent =
            evento?.nombre || "Sin Cadenas 2026";
    }

    try {
        const respuesta =
            await listarAsistentesAPI(
                codigoEventoSeleccionado
            );

        if (
            !respuesta ||
            !respuesta.ok ||
            !Array.isArray(respuesta.asistentes)
        ) {
            throw new Error(
                "No fue posible obtener los registros."
            );
        }

        const asistentes = respuesta.asistentes;

        if (evento?.tipo === "ahorro") {
            renderizarDashboardAhorro(asistentes);
            return;
        }

        renderizarDashboardEvento(
            asistentes,
            evento
        );

    } catch (error) {
        console.error(
            "Error cargando dashboard:",
            error
        );

        contenedor.innerHTML = `

            <div class="dashboard-error">

                <strong>
                    ⚠️ No pudimos cargar las estadísticas
                </strong>

                <p>
                    Intenta actualizar nuevamente.
                </p>

            </div>

        `;
    }
}


function renderizarDashboardEvento(
    asistentes,
    evento
) {
    const total = asistentes.length;

    const entradas = asistentes.filter(
        asistente => asistente.entrada === true
    ).length;

    const comidas = asistentes.filter(
        asistente => asistente.comida === true
    ).length;

    const snacks = asistentes.filter(
        asistente => asistente.snack === true
    ).length;

    const totalCobrado = asistentes.reduce(
        (totalActual, asistente) =>
            totalActual +
            Number(asistente.pagado || 0),
        0
    );

    const saldoPendiente = asistentes.reduce(
        (totalActual, asistente) =>
            totalActual +
            Math.max(
                0,
                Number(asistente.costo || 0) -
                Number(asistente.pagado || 0)
            ),
        0
    );

    const liquidados = asistentes.filter(
        asistente =>
            Number(asistente.costo || 0) > 0 &&
            Number(asistente.pagado || 0) >=
            Number(asistente.costo || 0)
    ).length;

    const contenedor = document.getElementById(
        "dashboardContenido"
    );

    if (!contenedor) {
        return;
    }

    const esSinCadenas =
        evento?.codigo === "SEP26";

    contenedor.innerHTML = `

        <div class="dashboard-grid">

            ${crearTarjetaDashboard(
                "👥",
                "Registrados",
                total
            )}

            ${crearTarjetaDashboard(
                "💰",
                "Cobrado",
                formatearDineroDashboard(totalCobrado)
            )}

            ${crearTarjetaDashboard(
                "⏳",
                "Pendiente",
                formatearDineroDashboard(saldoPendiente)
            )}

            ${crearTarjetaDashboard(
                "✅",
                "Liquidados",
                liquidados
            )}

        </div>

        ${
            esSinCadenas
                ? crearResumenServicios(
                    total,
                    entradas,
                    comidas,
                    snacks
                )
                : crearResumenEntrada(
                    total,
                    entradas
                )
        }

    `;
}


function renderizarDashboardAhorro(servidores) {
    const saldoTotal = servidores.reduce(
        (totalActual, servidor) =>
            totalActual +
            Number(servidor.pagado || 0),
        0
    );

    const contenedor = document.getElementById(
        "dashboardContenido"
    );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `

        <div class="dashboard-grid">

            ${crearTarjetaDashboard(
                "👥",
                "Servidores",
                servidores.length
            )}

            ${crearTarjetaDashboard(
                "🏦",
                "Saldo ahorrado",
                formatearDineroDashboard(saldoTotal)
            )}

        </div>

    `;
}


function crearResumenServicios(
    total,
    entradas,
    comidas,
    snacks
) {
    return `

        <div class="dashboard-pendientes">

            <span>
                ⏳ Pendientes por llegar
            </span>

            <strong>
                ${total - entradas}
            </strong>

        </div>

        <div class="dashboard-progreso">

            ${crearProgresoDashboard(
                "🚪 Entrada",
                entradas,
                total
            )}

            ${crearProgresoDashboard(
                "🍽️ Comida",
                comidas,
                total
            )}

            ${crearProgresoDashboard(
                "🍿 Snack",
                snacks,
                total
            )}

        </div>

    `;
}


function crearResumenEntrada(
    total,
    entradas
) {
    return `

        <div class="dashboard-pendientes">

            <span>
                ⏳ Pendientes por llegar
            </span>

            <strong>
                ${total - entradas}
            </strong>

        </div>

        <div class="dashboard-progreso">

            ${crearProgresoDashboard(
                "🚪 Entrada",
                entradas,
                total
            )}

        </div>

    `;
}


function crearTarjetaDashboard(
    icono,
    titulo,
    valor
) {
    return `

        <div class="dashboard-stat">

            <div class="dashboard-stat-icono">
                ${icono}
            </div>

            <strong>
                ${valor}
            </strong>

            <span>
                ${titulo}
            </span>

        </div>

    `;
}


function crearProgresoDashboard(
    nombre,
    valor,
    total
) {
    const porcentaje = calcularPorcentaje(
        valor,
        total
    );

    return `

        <div class="dashboard-progreso-item">

            <div class="dashboard-progreso-info">

                <span>
                    ${nombre}
                </span>

                <strong>
                    ${valor}/${total}
                    ·
                    ${porcentaje}%
                </strong>

            </div>

            <div class="dashboard-barra">

                <div
                    class="dashboard-barra-progreso"
                    style="width:${porcentaje}%"
                >
                </div>

            </div>

        </div>

    `;
}


function formatearDineroDashboard(monto) {
    return "$" + Number(monto || 0)
        .toLocaleString("es-MX", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}


function calcularPorcentaje(
    valor,
    total
) {
    if (!total) {
        return 0;
    }

    return Math.round(
        (valor / total) * 100
    );
}