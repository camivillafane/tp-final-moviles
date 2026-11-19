import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import { obtenerAgenda, type ReservaAgenda } from "@/servicios/agenda";
import { getUno } from "@/servicios/cliente";
import { registrarAusenciaRemota } from "@/servicios/ingresos";
import type { Usuario } from "@/tipos/usuario";

interface ReservaGestion extends ReservaAgenda {
    fecha: string;
    inicio: string;
    fin: string;
}

function fechaActualLocal(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function puedeMarcarAusente(reserva: ReservaGestion, ahora: Date): boolean {
    const [anio, mes, dia] = reserva.fecha.split("-").map(Number);
    const [hora, minuto] = reserva.inicio.split(":").map(Number);
    if (![anio, mes, dia, hora, minuto].every(Number.isFinite)) return false;

    const inicio = new Date(anio, mes - 1, dia, hora, minuto);
    const habilitadoDesde = inicio.getTime() + 15 * 60 * 1000;
    return ahora.getTime() >= habilitadoDesde;
}

function estadoAsistencia(estadoReserva: ReservaGestion["estado"]): string {
    if (estadoReserva === "cumplida") return "PRESENTE";
    if (estadoReserva === "ausente") return "AUSENTE";
    if (estadoReserva === "cancelada") return "CANCELADA";
    return "SIN REGISTRAR";
}

export default function GestionTurnosPantalla() {
    const router = useRouter();
    const { usuario, cargando } = useSesion();
    const paleta = usePaleta();
    const styles = useMemo(() => crearEstilos(paleta), [paleta]);
    const [reservas, setReservas] = useState<ReservaGestion[]>([]);
    const [nombresJugadores, setNombresJugadores] = useState<Record<string, string>>({});
    const [nombresEspacios, setNombresEspacios] = useState<Record<string, string>>({});
    const [cargandoReservas, setCargandoReservas] = useState(true);
    const [errorCarga, setErrorCarga] = useState<string | null>(null);
    const [reservaEnProceso, setReservaEnProceso] = useState<string | null>(null);
    const [ahora, setAhora] = useState(() => new Date());
    const [fecha] = useState(fechaActualLocal);

    useEffect(() => {
        const intervalo = setInterval(() => setAhora(new Date()), 30_000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarDatos = useCallback(async () => {
        setCargandoReservas(true);
        setErrorCarga(null);

        try {
            const agenda = await obtenerAgenda(fecha);
            const turnosPorReserva = new Map(
                agenda.turnos
                    .filter((turno) => turno.reservaId)
                    .map((turno) => [turno.reservaId as string, turno])
            );

            // Las asistencias compartidas salen de la API. Una copia local no
            // demuestra que la reserva ni la ausencia existan en el servidor.
            const reservasApi = agenda.reservas.filter(
                (reserva) => reserva.origen === "api"
            );
            const reservasParaMostrar: ReservaGestion[] = reservasApi.map((reserva) => {
                const turno = turnosPorReserva.get(reserva.id)
                    ?? agenda.turnos.find((item) => item.id === reserva.turnoId);
                return {
                    ...reserva,
                    fecha: turno?.fecha ?? fecha,
                    inicio: turno?.inicio ?? "--:--",
                    fin: turno?.fin ?? "--:--",
                };
            });
            setReservas(reservasParaMostrar);

            const nombresEspaciosNuevos: Record<string, string> = {};
            for (const espacio of agenda.espacios) {
                nombresEspaciosNuevos[espacio.id] = espacio.nombre;
            }
            setNombresEspacios(nombresEspaciosNuevos);

            const idsJugadores = [...new Set(reservasApi.map((reserva) => reserva.usuarioId))];
            const jugadores = await Promise.all(
                idsJugadores.map(async (id) => {
                    try {
                        const jugador = await getUno<Usuario>(`/usuarios/${encodeURIComponent(id)}`);
                        return [id, jugador.nombre] as const;
                    } catch {
                        return [id, "Jugador"] as const;
                    }
                })
            );
            setNombresJugadores(Object.fromEntries(jugadores));
        } catch (error) {
            setErrorCarga(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar las reservas de hoy."
            );
        } finally {
            setCargandoReservas(false);
        }
    }, [fecha]);

    useFocusEffect(
        useCallback(() => {
            if (!cargando && usuario?.rol === "encargado") {
                void cargarDatos();
            }
        }, [cargando, usuario?.rol, cargarDatos])
    );

    const marcarAusente = async (reserva: ReservaGestion) => {
        if (!puedeMarcarAusente(reserva, ahora)) {
            Alert.alert(
                "Todavía no se puede marcar",
                "La API permite registrar la ausencia a partir de 15 minutos después del inicio del turno."
            );
            return;
        }

        setReservaEnProceso(reserva.id);
        try {
            await registrarAusenciaRemota(reserva.id);
            await cargarDatos();
            Alert.alert("Ausencia registrada", "La reserva se actualizó en el servidor.");
        } catch (error) {
            Alert.alert(
                "No se pudo registrar la ausencia",
                error instanceof Error ? error.message : "Intentá nuevamente."
            );
        } finally {
            setReservaEnProceso(null);
        }
    };

    if (cargando) {
        return (
            <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
                <ActivityIndicator color={paleta.verdePrincipal} />
                <Text style={styles.mensaje}>Verificando la sesión...</Text>
            </SafeAreaView>
        );
    }

    if (!usuario || usuario.rol !== "encargado") {
        return (
            <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
                <Text style={styles.mensaje}>No tenés permiso para acceder a esta pantalla.</Text>
                <Pressable onPress={() => router.replace("/")}>
                    <Text style={styles.volver}>Volver</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    if (cargandoReservas) {
        return (
            <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
                <ActivityIndicator color={paleta.verdePrincipal} />
                <Text style={styles.mensaje}>Cargando reservas de hoy...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.contenedor} edges={["top", "bottom"]}>
            <View style={styles.encabezado}>
                <Pressable
                    onPress={() => router.back()}
                    style={styles.botonVolver}
                    accessibilityRole="button"
                    accessibilityLabel="Volver"
                >
                    <IonIcons name="arrow-back" size={26} color={paleta.verdePrincipal} />
                </Pressable>
                <Text style={styles.titulo}>Gestión de turnos</Text>
                <Pressable
                    onPress={() => void cargarDatos()}
                    accessibilityRole="button"
                    accessibilityLabel="Actualizar reservas"
                >
                    <IonIcons name="refresh-outline" size={24} color={paleta.verdePrincipal} />
                </Pressable>
            </View>

            <Text style={styles.subtitulo}>Reservas de hoy · {fecha}</Text>

            {errorCarga ? (
                <View style={styles.estadoError}>
                    <Text style={styles.mensaje}>{errorCarga}</Text>
                    <Pressable style={styles.botonReintentar} onPress={() => void cargarDatos()}>
                        <Text style={styles.textoBoton}>Reintentar</Text>
                    </Pressable>
                </View>
            ) : reservas.length === 0 ? (
                <Text style={styles.mensaje}>No hay reservas para hoy.</Text>
            ) : (
                <ScrollView contentContainerStyle={styles.contenido}>
                    {reservas.map((reserva) => {
                        const asistencia = estadoAsistencia(reserva.estado);
                        const habilitada = puedeMarcarAusente(reserva, ahora);
                        const guardando = reservaEnProceso === reserva.id;

                        return (
                            <View key={reserva.id} style={styles.tarjeta}>
                                <Text style={styles.dato}>
                                    Jugador: {nombresJugadores[reserva.usuarioId] ?? "Jugador"}
                                </Text>
                                <Text style={styles.dato}>Fecha: {reserva.fecha}</Text>
                                <Text style={styles.dato}>
                                    Horario: {reserva.inicio} - {reserva.fin}
                                </Text>
                                <Text style={styles.dato}>
                                    Espacio: {nombresEspacios[reserva.espacioId] ?? reserva.espacioId}
                                </Text>
                                <Text style={styles.dato}>
                                    Estado de reserva: {reserva.estado}
                                </Text>
                                <Text style={styles.dato}>Asistencia: {asistencia}</Text>

                                {reserva.estado === "confirmada" && (
                                    <Pressable
                                        style={[
                                            styles.botonAusente,
                                            (!habilitada || guardando) && styles.botonDeshabilitado,
                                        ]}
                                        disabled={!habilitada || guardando}
                                        onPress={() => void marcarAusente(reserva)}
                                    >
                                        <Text style={styles.textoBotonAusente}>
                                            {guardando
                                                ? "Registrando..."
                                                : habilitada
                                                  ? "Marcar AUSENTE"
                                                  : "Disponible 15 min después del inicio"}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        contenedor: {
            flex: 1,
            backgroundColor: paleta.fondo,
            padding: 20,
        },
        encabezado: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        contenido: {
            paddingBottom: 30,
        },
        volver: {
            fontSize: 18,
            color: paleta.verdePrincipal,
            marginBottom: 24,
        },
        botonVolver: {
            paddingVertical: 8,
        },
        titulo: {
            fontSize: 24,
            fontWeight: "bold",
            color: paleta.textoOscuro,
            textAlign: "center",
        },
        subtitulo: {
            color: paleta.verdeGrisaceo,
            fontSize: 14,
            marginTop: 8,
            marginBottom: 12,
            textAlign: "center",
        },
        mensaje: {
            fontSize: 16,
            color: paleta.verdeGrisaceo,
            textAlign: "center",
            marginVertical: 16,
        },
        estadoError: {
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
        },
        botonReintentar: {
            backgroundColor: paleta.verdeBoton,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 8,
        },
        tarjeta: {
            backgroundColor: paleta.superficie,
            borderColor: paleta.bordeSuave,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            gap: 10,
        },
        dato: {
            fontSize: 15,
            color: paleta.textoOscuro,
        },
        botonAusente: {
            backgroundColor: paleta.errorFondo,
            borderColor: paleta.errorTexto,
            borderWidth: 1,
            padding: 12,
            borderRadius: 8,
            alignItems: "center",
        },
        botonDeshabilitado: {
            opacity: 0.55,
        },
        textoBoton: {
            color: paleta.textoInvertido,
            fontWeight: "bold",
        },
        textoBotonAusente: {
            color: paleta.errorTexto,
            fontWeight: "bold",
        },
    });
