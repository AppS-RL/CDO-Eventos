function mostrarLayout(opciones) {

    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="layout">

            <header class="app-header">
                <h1>CDO Eventos</h1>
                <p id="eventoNombreLayout">Príncipe de paz</p>
            </header>

            <main class="app-content">
                ${opciones.contenido}
            </main>

            <nav class="bottom-nav">
                ${opciones.navbar || ""}
            </nav>

        </div>
    `;

}
