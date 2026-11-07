let scannerQR = null;

let scannerQRActivo = false;

let scannerQRProcesando = false;


async function iniciarScannerQR(
    onScan,
    opciones = {}
) {

    const prefijo = String(
        opciones.prefijo || "NAV26"
    )
        .trim()
        .toUpperCase();

    const prefijoSeguro = prefijo.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    const patronId = new RegExp(
        "^" + prefijoSeguro + "-\\d{4,}$"
    );

    const contenedor =
        document.getElementById("zonaScanner");


    if (!contenedor) {
        return;
    }


    // Detener cualquier cámara anterior
    await detenerScannerQR();


    contenedor.innerHTML = `

        <div id="reader"></div>

        <div
            id="estadoScanner"
            class="estado-scanner"
        >
            Iniciando cámara...
        </div>

    `;


    try {

        if (typeof Html5Qrcode === "undefined") {

            throw new Error(
                "La librería del escáner QR no está disponible."
            );

        }


        scannerQR =
            new Html5Qrcode("reader");


        await scannerQR.start(

            {
                facingMode: "environment"
            },

            {
                fps: 10,

                qrbox: {
                    width: 220,
                    height: 220
                },

                aspectRatio: 1
            },


            async (decodedText) => {

                if (scannerQRProcesando) {
                    return;
                }


                const codigo =
                    String(decodedText)
                        .trim()
                        .toUpperCase();


                // Solo aceptamos nuestros IDs
                if (
                    !patronId.test(codigo)
                ) {

                    mostrarEstadoScanner(
                        "⚠️ QR no válido para este evento."
                    );

                    scannerQRProcesando = true;


                    setTimeout(() => {

                        scannerQRProcesando = false;

                        mostrarEstadoScanner(
                            "Apunta la cámara al código QR."
                        );

                    }, 1500);


                    return;
                }


                scannerQRProcesando = true;


                mostrarEstadoScanner(
                    "✓ QR detectado. Procesando..."
                );


                try {

                    await onScan(codigo);

                } catch (error) {

                    console.error(error);

                }


                // Pequeña pausa para evitar múltiples
                // lecturas del mismo QR
                setTimeout(() => {

                    scannerQRProcesando = false;

                    mostrarEstadoScanner(
                        "Listo para el siguiente QR."
                    );

                }, 1800);

            },


            () => {

                // No hacemos nada aquí.
                // Es normal que muchos frames
                // no contengan un QR.

            }

        );


        scannerQRActivo = true;


        mostrarEstadoScanner(
            "Apunta la cámara al código QR."
        );


    } catch (error) {

        console.error(
            "Error iniciando scanner:",
            error
        );


        scannerQRActivo = false;


        contenedor.innerHTML = `

            <div class="scanner-error">

                <div>
                    ⚠️
                </div>

                <strong>
                    No pudimos abrir la cámara
                </strong>

                <p>
                    Revisa los permisos de cámara
                    del navegador.
                </p>

            </div>

        `;

    }

}


function mostrarEstadoScanner(mensaje) {

    const estado =
        document.getElementById(
            "estadoScanner"
        );


    if (estado) {

        estado.textContent =
            mensaje;

    }

}


async function detenerScannerQR() {

    if (!scannerQR) {
        return;
    }


    try {

        if (scannerQRActivo) {

            await scannerQR.stop();

        }


        scannerQR.clear();


    } catch (error) {

        console.warn(
            "No fue posible detener el scanner:",
            error
        );

    }


    scannerQR = null;

    scannerQRActivo = false;

    scannerQRProcesando = false;

}


