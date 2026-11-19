
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import { obtenerReservaPorQrToken, obtenerNombreUsuario } from "@/servicios/dbServicios";
import { listarEspacios } from "@/servicios/espacios";
import type { Espacio } from "@/tipos/espacio";
import { registrarIngreso } from "@/servicios/ingresos";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";



export default function EscanearQrPantalla() {
const router = useRouter();
const { usuario, cargando } = useSesion();
const paleta = usePaleta();
const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
const [permiso, solicitarPermiso] = useCameraPermissions();
const [qrLeido, setQrLeido] = useState(false);
const [resultado, setResultado] = useState("");
const [detalleIngreso, setDetalleIngreso] = useState<{
    nombre: string;
    fecha: string;
    inicio: string;
    fin: string;
    espacio: string;
} | null>(null);
const [espacios, setEspacios] = useState<Espacio[]>([]);
const [espacioSeleccionado, setEspacioSeleccionado] = useState("");
const [cargandoEspacios, setCargandoEspacios] = useState(true);
const [mostrarEspacios, setMostrarEspacios] = useState(false);
const [huellaVerificada, setHuellaVerificada] = useState(false);
const [verificandoHuella, setVerificandoHuella] = useState(false);
const autenticacionIniciada = useRef(false);

const verificarHuella = async () => {
    setVerificandoHuella(true);
    setResultado("Verificando identidad...");

    try {
        const tieneHardware = await LocalAuthentication.hasHardwareAsync();
        const tieneHuellaRegistrada = await LocalAuthentication.isEnrolledAsync();

        if (!tieneHardware || !tieneHuellaRegistrada) {
            setResultado("El dispositivo no tiene autenticación biométrica configurada.");
            return;
        }

        const resultadoHuella = await LocalAuthentication.authenticateAsync({
            promptMessage: "Verificá tu identidad para escanear reservas",
            cancelLabel: "Cancelar",
            disableDeviceFallback: true,
        });

        if (resultadoHuella.success) {
            setHuellaVerificada(true);
            setResultado("Identidad verificada. Ya podés escanear.");
        } else {
            setHuellaVerificada(false);
            setResultado("No se pudo verificar la huella. Intentá nuevamente.");
        }
    } catch (error) {
        console.error("Error al verificar huella:", error);
        setResultado("No se pudo realizar la autenticación.");
    } finally {
        setVerificandoHuella(false);
    }
};

useEffect(() => {
    if (
        cargando ||
        !usuario ||
        usuario.rol !== "encargado" ||
        autenticacionIniciada.current
    ) {
        return;
    }

    autenticacionIniciada.current = true;
    verificarHuella();
}, [cargando, usuario]);


useEffect(() => {
    listarEspacios()
        .then((respuesta) => {
        setEspacios(respuesta.datos);
    })
    .catch((error) => {
        console.error("Error al cargar espacios:", error);
        setResultado("No se pudieron cargar los espacios.");
    })
    .finally(() => {
        setCargandoEspacios(false);
    });
}, []);

if (cargando) {
    return <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]} />;
}

if (!usuario || usuario.rol !== "encargado") {
    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
        <Text style={estilos.mensaje}>No tenés permiso para acceder.</Text>
        <Pressable onPress={() => router.replace("/")}>
        <Text style={estilos.botonTexto}>Volver al inicio</Text>
        </Pressable>
        </SafeAreaView>
    );
}

if (!huellaVerificada) {
    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
            <Text style={estilos.titulo}>Verificación de identidad</Text>

            <Text style={estilos.mensaje}>
                Necesitamos verificar tu identidad para permitirte escanear reservas.
            </Text>

            <Pressable
                style={estilos.boton}
                onPress={verificarHuella}
                disabled={verificandoHuella}
            >
                <Text style={estilos.botonTexto}>
                    {verificandoHuella ? "Verificando..." : "Verificar con huella"}
                </Text>
            </Pressable>

            <Text style={estilos.pista}>{resultado}</Text>
        </SafeAreaView>
    );
} 


if (!permiso) {
    return <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]} />;
}

if (!permiso.granted) {
    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
        <Text style={estilos.titulo}>Permiso de cámara</Text>
        <Text style={estilos.mensaje}>
            Necesitamos acceder a la cámara para escanear reservas.
        </Text>
        <Pressable style={estilos.boton} onPress={solicitarPermiso}>
        <Text style={estilos.botonTexto}>Dar permiso</Text>
        </Pressable>
        </SafeAreaView>
    );
}

    return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={estilos.contenido}>
    <Pressable
        onPress={() => router.back()}
        style={estilos.botonVolver}
        accessibilityRole="button"
        accessibilityLabel="Volver atrás"
    >
        <IonIcons name="arrow-back" size={26} color={paleta.verdePrincipal} />
    </Pressable>

    <Text style={estilos.titulo}>Escanear QR</Text>
    <Text style={estilos.mensaje}>
        Apuntá la cámara al código QR de la reserva.
    </Text>

{cargandoEspacios ? (
    <Text style={estilos.pista}>Cargando espacios...</Text>
) : (
    <View>
        <Pressable
            style={estilos.boton}
            onPress={() => setMostrarEspacios(!mostrarEspacios)}
        >
            <Text style={estilos.botonTexto}>
                {espacioSeleccionado
                    ? espacios.find((item) => item.id === espacioSeleccionado)?.nombre
                    : "Seleccionar espacio ▼"}
            </Text>
        </Pressable>

        {mostrarEspacios && (
            <View>
                {espacios.map((espacio) => (
                    <Pressable
                        key={espacio.id}
                        style={estilos.opcionEspacio}
                        onPress={() => {
                            setEspacioSeleccionado(espacio.id);
                            setMostrarEspacios(false);
                            setQrLeido(false);
                            setResultado("");
                        }}
                    >
                        <Text style={estilos.opcionTexto}>
                            {espacio.nombre}
                        </Text>
                    </Pressable>
                ))}
            </View>
        )}
    </View>
)}

{espacioSeleccionado ? (
    <>
        <Text style={estilos.mensaje}>
            Espacio seleccionado:{" "}
            {espacios.find((item) => item.id === espacioSeleccionado)?.nombre}
        </Text>
        <View style={estilos.marcoCamara}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                autofocus="on"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}

                onBarcodeScanned={
                    qrLeido
                    ? undefined
                    : async ({ data }) => {
                        setQrLeido(true);
                        setResultado("Verificando reserva...");

                        try {
                            const reserva = await obtenerReservaPorQrToken(data);

                            if (!reserva) {
                            setResultado("QR inválido o reserva no confirmada.");
                            return;
                            }

                            if (reserva.espacioId !== espacioSeleccionado){
                                await vibrarResultadoQr(false);
                                setResultado ("Esta reserva no corresponde al espacio seleccionado.");
                                return;
                            }

                            

                            await vibrarResultadoQr(true);
                            setResultado("Ingreso autorizado.")


                            const ahora = new Date();
                            const anio = ahora.getFullYear();
                            const mes = String(ahora.getMonth() + 1).padStart(2, "0");
                            const dia = String(ahora.getDate()).padStart(2, "0");
                            const hoy = `${anio}-${mes}-${dia}`;

                            if (reserva.fecha !== hoy) {
                            if (reserva.fecha > hoy) {
                                setResultado(
                                `La reserva todavía no corresponde. Es para el ${reserva.fecha.split("-").reverse().join("/")}.`
                                );
                            } else {
                                setResultado("La fecha de esta reserva ya pasó.");
                            }
                            return;
                            }

                            if (reserva.espacioId !== espacioSeleccionado) {
                            setResultado("Esta reserva no corresponde al espacio seleccionado.");
                            return;
                            }

                            const espacio = espacios.find(
                            (item) => item.id === espacioSeleccionado
                            );

                            const ingresoRegistrado = await registrarIngreso(reserva, usuario.id);

                            if (!ingresoRegistrado) {
                                setResultado("Esta reserva ya tiene un ingreso registrado.");
                                return;
                            }
                            const nombreJugador = await obtenerNombreUsuario(reserva.usuarioId);

                        setDetalleIngreso({
                            nombre: nombreJugador ?? "Jugador",
                            fecha: reserva.fecha.split("-").reverse().join("/"),
                            inicio: reserva.inicio,
                            fin: reserva.fin,
                            espacio: espacio?.nombre ?? reserva.espacioId,
                        });
                            setResultado("¡Ingreso autorizado!");
                            } catch (error) {
                                console.error("Error al validar QR:", error);
                                setResultado("No se pudo verificar la reserva.");
                            }
                        }
                    }
                />
            <View pointerEvents="none" style={estilos.marcoEscaneo}>
        <View style={[estilos.esquina, estilos.esquinaSuperiorIzquierda]} />
        <View style={[estilos.esquina, estilos.esquinaSuperiorDerecha]} />
        <View style={[estilos.esquina, estilos.esquinaInferiorIzquierda]} />
        <View style={[estilos.esquina, estilos.esquinaInferiorDerecha]} />
            </View>    
        </View>
    </>
        ) : (
        <Text style={estilos.pista}>
            Primero seleccioná un espacio para activar la cámara.
        </Text>
        )}

{detalleIngreso ? (
        <View style={estilos.tarjetaIngreso}>
            <Text style={estilos.tituloTarjeta}>¡Ingreso autorizado!</Text>
            <Text style={estilos.datoTarjeta}>
                Jugador: {detalleIngreso.nombre}
            </Text>
            <Text style={estilos.datoTarjeta}>
                Fecha: {detalleIngreso.fecha}
            </Text>
            <Text style={estilos.datoTarjeta}>
                Horario: {detalleIngreso.inicio} a {detalleIngreso.fin}
            </Text>
            <Text style={estilos.datoTarjeta}>
                Espacio: {detalleIngreso.espacio}
            </Text>
            <Text style={estilos.estadoIngreso}>✓ PRESENTE</Text>
        </View>
    ) : (
        <Text style={estilos.pista}>
            {resultado || "Esperando código QR..."}
        </Text>
    )}
        </ScrollView>
    </SafeAreaView>
    );
}

async function vibrarResultadoQr(valido: boolean) {
    try {
        await Haptics.notificationAsync(
            valido
                ? Haptics.NotificationFeedbackType.Success
                : Haptics.NotificationFeedbackType.Error
        );
    } catch {}
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        contenido: {
            paddingBottom: 30,
        },
        tarjetaIngreso: {
            backgroundColor: paleta.exitoFondo,
            borderWidth: 2,
            borderColor: paleta.verdePrincipal,
            borderRadius: 16,
            padding: 20,
            marginTop: 24,
            gap: 12,
        },
        tituloTarjeta: {
            fontSize: 22,
            fontWeight: "bold",
            color: paleta.exitoTexto,
            textAlign: "center",
            marginBottom: 8,
        },
        datoTarjeta: {
            fontSize: 16,
            color: paleta.textoOscuro,
        },
        estadoIngreso: {
            backgroundColor: paleta.verdeBoton,
            color: paleta.textoInvertido,
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            padding: 10,
            borderRadius: 8,
            overflow: "hidden",
        },
        contenedor: {
            flex: 1,
            backgroundColor: paleta.fondo,
            padding: 20,
        },
        volver: {
            fontSize: 18,
            color: paleta.verdePrincipal,
            marginBottom: 24,
        },
        botonVolver: {
            marginBottom: 24,
        },
        titulo: {
            fontSize: 24,
            fontWeight: "bold",
            color: paleta.textoOscuro,
            textAlign: "center",
        },
        mensaje: {
            fontSize: 16,
            color: paleta.verdeGrisaceo,
            textAlign: "center",
            marginVertical: 16,
        },
        marcoCamara: {
            height: 320,
            overflow: "hidden",
            borderRadius: 16,
            marginTop: 20,
        },
        pista: {
            textAlign: "center",
            marginTop: 20,
            fontSize: 16,
            color: paleta.verdePrincipal,
        },
        boton: {
            backgroundColor: paleta.verdeBoton,
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
        },
        botonTexto: {
            color: paleta.textoInvertido,
            fontWeight: "bold",
            fontSize: 16,
        },
        botonSeleccionado: {
            backgroundColor: paleta.verdeBoton,
            borderWidth: 3,
            borderColor: paleta.verdePrincipal,
        },
        opcionEspacio: {
            backgroundColor: paleta.superficieAlt,
            padding: 14,
            borderBottomWidth: 1,
            borderBottomColor: paleta.bordeSuave,
        },
        opcionTexto: {
            color: paleta.textoOscuro,
            fontSize: 15,
        },
        marcoEscaneo: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
                esquina: {
            position: "absolute",
            width: 35,
            height: 35,
            borderColor: paleta.verdePrincipal,
        },
        esquinaSuperiorIzquierda: {
            top: 20,
            left: 20,
            borderTopWidth: 4,
            borderLeftWidth: 4,
            borderTopLeftRadius: 8,
        },
        esquinaSuperiorDerecha: {
            top: 20,
            right: 20,
            borderTopWidth: 4,
            borderRightWidth: 4,
            borderTopRightRadius: 8,
        },
        esquinaInferiorIzquierda: {
            bottom: 20,
            left: 20,
            borderBottomWidth: 4,
            borderLeftWidth: 4,
            borderBottomLeftRadius: 8,
        },
        esquinaInferiorDerecha: {
            bottom: 20,
            right: 20,
            borderBottomWidth: 4,
            borderRightWidth: 4,
            borderBottomRightRadius: 8,
        },
    });