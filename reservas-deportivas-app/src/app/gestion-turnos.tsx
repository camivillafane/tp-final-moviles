
import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

import { useSesion } from "@/contextos/Sesion";
import {
    obtenerTodasLasReservasLocales,
    obtenerNombreUsuario,
} from "@/servicios/dbServicios";
import {
    obtenerAsistenciasLocales,
    registrarAusencia,
} from "@/servicios/ingresos";
import { listarEspacios } from "@/servicios/espacios";
import type { Reserva } from "@/tipos/reserva";

export default function GestionTurnosPantalla() {
    const router = useRouter();
    const { usuario, cargando } = useSesion();

    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [asistencias, setAsistencias] = useState<
        { reservaId: string; estado: string }[]
    >([]);
    const [cargandoReservas, setCargandoReservas] = useState(true);

    const [nombresJugadores, setNombresJugadores] = useState<
        Record<string, string>
    >({});

    const [nombresEspacios, setNombresEspacios] = useState<
        Record<string, string>
    >({});

    useEffect(() => {
        async function cargarDatos() {
            try {
                const reservasGuardadas =
                    await obtenerTodasLasReservasLocales();

                setReservas(reservasGuardadas);

                const nombresDeJugadores: Record<string, string> = {};

                for (const reserva of reservasGuardadas) {
                    const nombre = await obtenerNombreUsuario(
                        reserva.usuarioId
                    );

                    nombresDeJugadores[reserva.id] = nombre ?? "Jugador";
                }

                setNombresJugadores(nombresDeJugadores);

                const espaciosGuardados = await listarEspacios();
                const nombresDeEspacios: Record<string, string> = {};

                for (const espacio of espaciosGuardados.datos) {
                    nombresDeEspacios[espacio.id] = espacio.nombre;
                }

                setNombresEspacios(nombresDeEspacios);

                const asistenciasGuardadas =
                    await obtenerAsistenciasLocales();

                setAsistencias(asistenciasGuardadas);
            } catch (error) {
                console.error("Error al cargar los turnos:", error);
            } finally {
                setCargandoReservas(false);
            }
        }

        cargarDatos();
    }, []);

    async function marcarAusente(reserva: Reserva) {
        if (!usuario) return;

        try {
            const registrado = await registrarAusencia(
                reserva,
                usuario.id
            );

            if (!registrado) return;

            const asistenciasActualizadas =
                await obtenerAsistenciasLocales();

            setAsistencias(asistenciasActualizadas);
        } catch (error) {
            console.error("Error al registrar la ausencia:", error);
        }
    }

    if (cargando || cargandoReservas) {
        return (
            <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
                <Text style={styles.mensaje}>Cargando turnos...</Text>
            </SafeAreaView>
        );
    }

    if (!usuario || usuario.rol !== "encargado") {
        return (
            <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
                <Text style={styles.mensaje}>
                    No tenés permiso para acceder a esta pantalla.
                </Text>

                <Pressable onPress={() => router.replace("/")}>
                    <Text style={styles.volver}>Volver</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
            <Pressable
                onPress={() => router.back()}
                style={styles.botonVolver}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
            >
                <IonIcons name="arrow-back" size={26} color={colores.verdePrincipal} />
            </Pressable>

            <Text style={styles.titulo}>Gestión de turnos</Text>

            <ScrollView contentContainerStyle={styles.contenido}>
                {reservas.length === 0 ? (
                    <Text style={styles.mensaje}>
                        No hay turnos registrados.
                    </Text>
                ) : (
                    reservas.map((reserva) => {
                        const asistencia = asistencias.find(
                            (item) => item.reservaId === reserva.id
                        );

                        return (
                            <View
                                key={reserva.id}
                                style={styles.tarjeta}
                            >
                                <Text style={styles.dato}>
                                    Jugador:{" "}
                                    {nombresJugadores[reserva.id] ??
                                        "Jugador"}
                                </Text>

                                <Text style={styles.dato}>
                                    Fecha: {reserva.fecha}
                                </Text>

                                <Text style={styles.dato}>
                                    Horario: {reserva.inicio} - {reserva.fin}
                                </Text>

                                <Text style={styles.dato}>
                                    Espacio:{" "}
                                    {nombresEspacios[reserva.espacioId] ??
                                        reserva.espacioId}
                                </Text>

                                <Text style={styles.dato}>
                                    Estado de reserva: {reserva.estado}
                                </Text>

                                <Text style={styles.dato}>
                                    Asistencia:{" "}
                                    {asistencia?.estado ?? "SIN REGISTRAR"}
                                </Text>

                                {!asistencia &&
                                    reserva.estado === "confirmada" && (
                                        <Pressable
                                            style={styles.botonAusente}
                                            onPress={() =>
                                                marcarAusente(reserva)
                                            }
                                        >
                                            <Text style={styles.textoBoton}>
                                                Marcar AUSENTE
                                            </Text>
                                        </Pressable>
                                    )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    contenedor: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 20,
    },
    contenido: {
        paddingBottom: 30,
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
    tarjeta: {
        backgroundColor: "#F1F5F2",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        gap: 10,
    },
    dato: {
        fontSize: 15,
        color: "#173D2B",
    },
    botonAusente: {
        backgroundColor: "#A33A3A",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    textoBoton: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
});
