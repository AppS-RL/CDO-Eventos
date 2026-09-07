function mostrarInicio() {

    const app = document.getElementById("app");

    app.innerHTML = `
        <main class="contenedor">

            <section class="card">

                <h1>CDO Eventos</h1>

                <p class="subtitulo">
                    Gestión Inteligente de Eventos
                </p>

                <button id="btnAdministrador" class="boton principal">
                    👑 Administrador
                </button>

                <button id="btnOperador" class="boton">
                    👷 Operador
                </button>

                <footer>
                    Versión 2.0
                </footer>

            </section>

        </main>
    `;

document
    .getElementById("btnAdministrador")
    .addEventListener("click", () => {

        if (solicitarAccesoAdministrador()) {

            mostrarListaAsistentes();

        }

});


    document
        .getElementById("btnOperador")
        .addEventListener("click", () => {

            cargarVista("operador");

        });

}
