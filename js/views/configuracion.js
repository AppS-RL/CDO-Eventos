function mostrarConfiguracion() {

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header">

                <h1>⚙️ Configuración</h1>

                <p>Sin Cadenas 2026</p>

            </header>


            <main class="app-content">

                <div class="app-card configuracion-card">

                    <nav class="lista-nav">

                <button
                    id="navAsistentes"
                    class="nav-item">
                    👥
                </button>

                <button
                    id="navDashboard"
                    class="nav-item">
                    📊
                </button>

                <button
                    id="navConfiguracion"
                    class="nav-item nav-activo">
                    ⚙️
                </button>

            </nav>


                    <div class="config-header">

                        <h2>Configuración del sistema</h2>

                        <p>
                            Información y herramientas de CDO Eventos.
                        </p>

                    </div>


                    <!-- EVENTO -->

                    <section class="config-seccion">

                        <h3>🎪 Evento</h3>

                        <div class="config-info">

                            <div>
                                <span>Nombre</span>
                                <strong>Sin Cadenas 2026</strong>
                            </div>

                            <div>
                                <span>Sistema</span>
                                <strong>CDO Eventos</strong>
                            </div>

                            <div>
                                <span>Estado</span>
                                <strong class="config-estado-ok">
                                    ● Activo
                                </strong>
                            </div>

                        </div>

                    </section>


                    <!-- SISTEMA -->

                    <section class="config-seccion">

                        <h3>🔌 Sistema</h3>

                        <p class="config-descripcion">
                            Comprueba la conexión con la base
                            de datos del evento.
                        </p>

                        <button
                            id="btnProbarConexion"
                            class="boton config-boton"
                        >
                            🔄 Comprobar conexión
                        </button>

                        <div
                            id="resultadoConexion"
                            class="config-resultado"
                        ></div>

                    </section>


                    <!-- OPERACION -->

                    <section class="config-seccion">

                        <h3>📱 Operación</h3>

                        <p class="config-descripcion">
                            Cambia esta pantalla al modo utilizado
                            para registrar entrada, comida y snack.
                        </p>

                        <button
                            id="btnModoOperadorConfig"
                            class="boton principal config-boton"
                        >
                            👷 Abrir Modo Operador
                        </button>

                    </section>


                    <!-- VERSION -->

                    <section class="config-seccion config-version">

                        <span>
                            CDO Eventos
                        </span>

                        <strong>
                            Versión 2.0
                        </strong>

                    </section>


                </div>

            </main>




        </div>

    `;


    document
        .getElementById("navAsistentes")
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
        .getElementById("btnModoOperadorConfig")
        .addEventListener(
            "click",
            mostrarOperador
        );


    document
        .getElementById("btnProbarConexion")
        .addEventListener(
            "click",
            comprobarConexionSistema
        );

}

async function comprobarConexionSistema() {

    const resultado =
        document.getElementById(
            "resultadoConexion"
        );


    const boton =
        document.getElementById(
            "btnProbarConexion"
        );


    resultado.innerHTML =
        "Comprobando conexión...";


    boton.disabled = true;


    try {

        const respuesta =
            await listarAsistentesAPI();


        if (
            respuesta &&
            respuesta.ok
        ) {

            resultado.innerHTML = `

                <div class="conexion-ok">

                    ✓ Sistema conectado

                    <span>
                        ${respuesta.total}
                        asistentes disponibles
                    </span>

                </div>

            `;

        } else {

            throw new Error(
                "Respuesta inválida"
            );

        }


    } catch (error) {

        console.error(error);


        resultado.innerHTML = `

            <div class="conexion-error">

                ⚠️ Sin conexión con el sistema

                <span>
                    Revisa la conexión a internet
                    e intenta nuevamente.
                </span>

            </div>

        `;

    } finally {

        boton.disabled = false;

    }

}
