function cargarVista(nombre){

    switch(nombre){

        case "inicio":
            mostrarInicio();
            break;

        case "asistentes":
            mostrarAsistentes();
            break;

        case "operador":
            mostrarOperador();
            break;

    }

}

const CLAVE_ADMINISTRADOR = "IJadmin";
const SESION_ADMINISTRADOR = "cdoAdministradorAutenticado";


function administradorAutenticado() {

    return sessionStorage.getItem(
        SESION_ADMINISTRADOR
    ) === "true";

}


function solicitarAccesoAdministrador() {

    if (administradorAutenticado()) {
        return true;
    }


    const clave = window.prompt(
        "🔐 Acceso de administrador\n\nIngresa la contraseña:"
    );


    if (clave === CLAVE_ADMINISTRADOR) {

        sessionStorage.setItem(
            SESION_ADMINISTRADOR,
            "true"
        );

        return true;

    }


    if (clave !== null) {

        alert(
            "❌ Contraseña incorrecta."
        );

    }


    return false;

}

function solicitarClaveServicio(tipo) {

    const claves = {

        entrada: "Entrada",
        comida: "Comida",
        snack: "Snack",
        varonil: "Varonil",
        femenil: "Femenil"

    };


    const claveCorrecta = claves[tipo];

    if (!claveCorrecta) {
        return false;
    }


    const clave = window.prompt(
        `🔐 Acceso a ${claveCorrecta}\n\nIngresa la contraseña:`
    );


    if (clave === claveCorrecta) {
        return true;
    }


    if (clave !== null) {

        alert(
            "❌ Contraseña incorrecta."
        );

    }


    return false;

}
