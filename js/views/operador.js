function mostrarOperador() {

    const app = document.getElementById("app");

    app.innerHTML = `

        <div class="app">

            <header class="app-header">

                <h1>👷 Modo Operador</h1>

                <p>
                    Sin Cadenas 2026
                </p>

            </header>


            <main class="app-content">

                <div class="app-card operador-card">

                    <div class="operador-header">

                        <h2>
                            ¿Qué vas a registrar?
                        </h2>

                        <p>
                            Selecciona el servicio que
                            estarás operando.
                        </p>

                    </div>


                    <div class="servicios-operador">


                        <button
                            class="servicio-operador entrada"
                            data-tipo="entrada"
                            type="button"
                        >

                            <span class="servicio-icono">
                                🚪
                            </span>

                            <div>

                                <strong>
                                    Entrada
                                </strong>

                                <small>
                                    Registrar acceso al evento
                                </small>

                            </div>

                            <span class="servicio-flecha">
                                ›
                            </span>

                        </button>


                        <button
                            class="servicio-operador comida"
                            data-tipo="comida"
                            type="button"
                        >

                            <span class="servicio-icono">
                                🍽️
                            </span>

                            <div>

                                <strong>
                                    Comida
                                </strong>

                                <small>
                                    Registrar entrega de comida
                                </small>

                            </div>

                            <span class="servicio-flecha">
                                ›
                            </span>

                        </button>


                        <button
                            class="servicio-operador snack"
                            data-tipo="snack"
                            type="button"
                        >

                            <span class="servicio-icono">
                                🍿
                            </span>

                            <div>

                                <strong>
                                    Snack
                                </strong>

                                <small>
                                    Registrar entrega de snack
                                </small>

                            </div>

                            <span class="servicio-flecha">
                                ›
                            </span>

                        </button>


                        <button
                            class="servicio-operador copa copa-varonil"
                            data-copa-categoria="VARONIL"
                            type="button"
                        >

                            <span class="servicio-icono">
                                ⚽
                            </span>

                            <div>

                                <strong>
                                    Copa Gol de Fe · Varonil
                                </strong>

                                <small>
                                    Equipos, partidos y resultados
                                </small>

                            </div>

                            <span class="servicio-flecha">
                                ›
                            </span>

                        </button>


                        <button
                            class="servicio-operador copa copa-femenil"
                            data-copa-categoria="FEMENIL"
                            type="button"
                        >

                            <span class="servicio-icono">
                                ⚽
                            </span>

                            <div>

                                <strong>
                                    Copa Gol de Fe · Femenil
                                </strong>

                                <small>
                                    Equipos, partidos y resultados
                                </small>

                            </div>

                            <span class="servicio-flecha">
                                ›
                            </span>

                        </button>


                    </div>


                    <button
                        id="btnSalirOperador"
                        class="boton"
                        type="button"
                    >
                        ← Cambiar modo
                    </button>

                </div>

            </main>

        </div>

    `;


    document
        .querySelectorAll(
            "[data-tipo]"
        )
        .forEach(boton => {

            boton.addEventListener(
                "click",
                () => {

                const tipo = boton.dataset.tipo;

                if (solicitarClaveServicio(tipo)) {

                abrirServicioOperador(
                tipo
                );

                }

                }
            );

        });


    document
        .querySelectorAll("[data-copa-categoria]")
        .forEach(boton => {

            boton.addEventListener("click", () => {

                mostrarCopaGolDeFe(
                    boton.dataset.copaCategoria
                );

            });

        });


    document
        .getElementById("btnSalirOperador")
        .addEventListener(
            "click",
            () => cargarVista("inicio")
        );

}

function abrirServicioOperador(tipo) {

    const configuracion = {

        entrada: {
            icono: "🚪",
            titulo: "Entrada",
            descripcion:
                "Escanea el QR para registrar el acceso."
        },

        comida: {
            icono: "🍽️",
            titulo: "Comida",
            descripcion:
                "Escanea el QR para registrar la entrega."
        },

        snack: {
            icono: "🍿",
            titulo: "Snack",
            descripcion:
                "Escanea el QR para registrar la entrega."
        }

    };


    const servicio =
        configuracion[tipo];


    if (!servicio) {
        mostrarOperador();
        return;
    }


    const app =
        document.getElementById("app");


    app.innerHTML = `

        <div class="app">

            <header class="app-header">

                <h1>
                    ${servicio.icono}
                    ${servicio.titulo}
                </h1>

                <p>
                    Modo Operador
                </p>

            </header>


            <main class="app-content">

                <div class="app-card operador-card">


                    <div class="operador-servicio-header">

                        <div class="operador-servicio-icono">
                            ${servicio.icono}
                        </div>

                        <h2>
                            ${servicio.titulo}
                        </h2>

                        <p>
                            ${servicio.descripcion}
                        </p>

                    </div>


                    <div
                        id="zonaScanner"
                        class="zona-scanner"
                    >

                        <div class="scanner-placeholder">

                            <div class="scanner-icono">
                                📷
                            </div>

                            <strong>
                                Escáner QR
                            </strong>

                            <p>
                                La cámara aparecerá aquí.
                            </p>

                        </div>

                    </div>


                    <div class="operador-prueba">

                        <p>
                            Prueba manual
                        </p>

                        <div class="campo">

                            <input
                                id="idPruebaOperador"
                                type="text"
                                placeholder="Ej. SEP26-0014"
                                autocomplete="off"
                            >

                        </div>


                        <button
                            id="btnProbarRegistro"
                            class="boton principal"
                            type="button"
                        >
                            Registrar ID
                        </button>

                    </div>


                    <div id="resultadoOperador"></div>


                    <button
                        id="btnCambiarServicio"
                        class="boton"
                        type="button"
                    >
                        ← Cambiar servicio
                    </button>


                </div>

            </main>

        </div>

    `;


document
    .getElementById(
        "btnCambiarServicio"
    )
    .addEventListener(
        "click",
        async () => {

            await detenerScannerQR();

            mostrarOperador();

        }
    );


    document
        .getElementById(
            "btnProbarRegistro"
        )
        .addEventListener(
            "click",
            () => {

                const id =
                    document
                        .getElementById(
                            "idPruebaOperador"
                        )
                        .value
                        .trim()
                        .toUpperCase();


                if (id) {

                    procesarRegistroOperador(
                        tipo,
                        id
                    );

                }

            }
        );

        iniciarScannerQR(

    async (codigo) => {

        await procesarRegistroOperador(
            tipo,
            codigo
        );

    }

);

}

let registroOperadorEnProceso = false;

async function procesarRegistroOperador(
    tipo,
    id
) {

if (registroOperadorEnProceso) {
    return;
}

registroOperadorEnProceso = true;


    const resultado =
        document.getElementById(
            "resultadoOperador"
        );


    const boton =
        document.getElementById(
            "btnProbarRegistro"
        );


    try {

        if (boton) {
            boton.disabled = true;
            boton.textContent =
                "Registrando...";
        }


        resultado.innerHTML = `

            <div class="operador-procesando">

                Procesando...

            </div>

        `;


        const respuesta =
            await registrarServicioAPI(
                tipo,
                id
            );


        mostrarResultadoOperador(
            respuesta,
            tipo
        );

setTimeout(() => {

    const resultadoActual =
        document.getElementById(
            "resultadoOperador"
        );

    const input =
        document.getElementById(
            "idPruebaOperador"
        );


    if (resultadoActual) {

        resultadoActual.innerHTML = "";

    }


    if (input) {

        input.value = "";

    }


    registroOperadorEnProceso = false;

}, 3000);



    } catch (error) {

        console.error(error);


        resultado.innerHTML = `

            <div class="
                resultado-operador
                resultado-operador-error
            ">

                <div class="resultado-operador-icono">
                    ⚠️
                </div>

                <strong>
                    Error de conexión
                </strong>

                <p>
                    Intenta nuevamente.
                </p>

            </div>

        `;


} finally {

    if (boton) {

        boton.disabled = false;

        boton.textContent =
            "Registrar ID";

    }



}

}

function mostrarResultadoOperador(
    respuesta,
    tipo
) {

    const resultado =
        document.getElementById(
            "resultadoOperador"
        );


    if (!resultado) {
        return;
    }


    const exitoso =
        respuesta.ok === true;


    const icono =
        exitoso
            ? "✓"
            : "⚠️";


    const clase =
        exitoso
            ? "resultado-operador-ok"
            : "resultado-operador-alerta";


    resultado.innerHTML = `

        <div class="
            resultado-operador
            ${clase}
        ">

            <div class="resultado-operador-icono">

                ${icono}

            </div>


            ${
                respuesta.nombre
                    ? `
                        <h2>
                            ${escaparHTML(
                                respuesta.nombre
                            )}
                        </h2>
                      `
                    : ""
            }


            <strong>

                ${escaparHTML(
                    respuesta.mensaje ||
                    "No fue posible realizar el registro."
                )}

            </strong>

        </div>

    `;

}

