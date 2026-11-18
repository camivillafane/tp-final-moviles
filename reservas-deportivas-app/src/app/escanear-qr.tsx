
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import { obtenerReservaPorQrToken, obtenerNombreUsuario } from "@/servicios/dbServicios";
import { listarEspacios } from "@/servicios/espacios";
import type { Espacio } from "@/tipos/espacio";
import { registrarIngreso } from "@/servicios/ingresos";
import * as Haptics from "expo-haptics";


export default function EscanearQrPantalla() {
const router = useRouter();
const { usuario, cargando } = useSesion();
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
        <IonIcons name="arrow-back" size={26} color={colores.verdePrincipal} />
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

            // PARA VER SI EL QR PERTENECE A UNA RESERVA!!!!!!!!!!!!!!!
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

                            
                            // if (!ingresoRegistrado){
                            //     await vibrarResultadoQr(false);
                            //     setResultado ("Esta reserva ya tiene un ingreso registrado.");
                            //     return;
                            // }

                            await vibrarResultadoQr(true);
                            setResultado("Ingreso autorizado.")


                            // Obtener la fecha actual del celular
                            const ahora = new Date();
                            const anio = ahora.getFullYear();
                            const mes = String(ahora.getMonth() + 1).padStart(2, "0");
                            const dia = String(ahora.getDate()).padStart(2, "0");
                            const hoy = `${anio}-${mes}-${dia}`;

                            // Validar la fecha de la reserva
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

                            // Validar si la reserva pertenece al espacio seleccionado
                            if (reserva.espacioId !== espacioSeleccionado) {
                            setResultado("Esta reserva no corresponde al espacio seleccionado.");
                            return;
                            }

                            // Buscar el nombre del espacio seleccionado
                            const espacio = espacios.find(
                            (item) => item.id === espacioSeleccionado
                            );

                            // Registrar el ingreso del jugador
                            const ingresoRegistrado = await registrarIngreso(reserva, usuario.id);

                            if (!ingresoRegistrado) {
                                setResultado("Esta reserva ya tiene un ingreso registrado.");
                                return;
                            }
                                // Mostrar que la reserva es válida
                            const nombreJugador = await obtenerNombreUsuario(reserva.usuarioId);

// Guardar los datos para mostrar la tarjeta
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
    try{ 
        await Haptics.notificationAsync(
            valido 
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        );
    } catch {

    }
}

const estilos = StyleSheet.create({
    contenido: {
        paddingBottom: 30,
    },
    tarjetaIngreso: {
        backgroundColor: "#EAF5EE",
        borderWidth: 2,
        borderColor: "#287A55",
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        gap: 12,
    },
    tituloTarjeta: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#173D2B",
        textAlign: "center",
        marginBottom: 8,
    },
    datoTarjeta: {
        fontSize: 16,
        color: "#333333",
    },
    estadoIngreso: {
        backgroundColor: "#287A55",
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        padding: 10,
        borderRadius: 8,
        overflow: "hidden",
    },
    contenedor: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 20,
    },
    volver: {
        fontSize: 18,
        color: "#287A55",
        marginBottom: 24,
    },
    botonVolver: {
        marginBottom: 24,
    },
    titulo: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#173D2B",
        textAlign: "center",
    },
    mensaje: {
        fontSize: 16,
        color: "#555555",
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
        color: "#287A55",
    },
    boton: {
        backgroundColor: "#287A55",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    botonTexto: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    botonSeleccionado: {
        backgroundColor: "#173D2B",
        borderWidth: 3,
        borderColor: "#8BC9A5",
    },
    opcionEspacio: {
        backgroundColor: "#F1F5F2",
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#D5E2D9",
    },
    opcionTexto: {
        color: "#173D2B",
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
        borderColor: "#8BC9A5",
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
