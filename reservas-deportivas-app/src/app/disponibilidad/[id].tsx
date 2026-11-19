import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BotonCta } from "@/componentes/BotonCta";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { EstadoVacio } from "@/componentes/EstadoVacio";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { getEspacioById } from "@/servicios/espacios";
import { getDisponibilidad, getProximosSieteDias, prepararSolicitudReserva } from "@/servicios/disponibilidad";
import { Espacio } from "@/tipos/espacio";
import { TurnoSeleccionado, Turno } from "@/tipos/turno";

const fechaLegible = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
const etiquetas: Record<Turno["estado"], string> = { libre: "Libre", reservado: "Reservado", fijo: "Fijo", mantenimiento: "Bloqueado" };
const fondoEstado = (estado: Turno["estado"], paleta: Paleta) =>
  ({
    libre: paleta.exitoFondo,
    reservado: paleta.badgeInactivoFondo,
    fijo: paleta.estadoFijoFondo,
    mantenimiento: paleta.errorFondo,
  })[estado];

export default function Disponibilidad() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const paleta = usePaleta();
  const styles = useMemo(() => crearEstilos(paleta), [paleta]);
  const fechas = useMemo(() => getProximosSieteDias(), []);
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [fecha, setFecha] = useState(fechas[0]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [seleccion, setSeleccion] = useState<Turno | null>(null);
  const [solicitud, setSolicitud] = useState<TurnoSeleccionado | null>(null);
  const [estado, setEstado] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("No se pudo cargar la disponibilidad.");
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = useCallback(async () => {
    if (!id) { setError("Falta indicar el espacio."); setEstado("error"); return; }
    setEstado("loading"); setSeleccion(null); setSolicitud(null);
    try {
      const [detalle, datos] = await Promise.all([getEspacioById(id), getDisponibilidad(id, fecha)]);
      if (!detalle) throw new Error("El espacio solicitado no existe.");
      setEspacio(detalle); setTurnos(datos); setEstado("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la disponibilidad."); setEstado("error");
    }
  }, [id, fecha]);
  useEffect(() => { void cargar(); }, [cargar]);

  if (estado === "loading") return <EstadoCarga mensaje="Cargando disponibilidad..." />;
  if (estado === "error") return <EstadoError mensaje={error} onReintentar={() => void cargar()} />;

  return (
    <View style={styles.contenedor}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>{espacio?.nombre ?? "Disponibilidad"}</Text>
        <Text style={styles.subtitulo}>Elegir un dia y un horario para continuar.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fechas}>
          {fechas.map((dia) => <Pressable key={dia} onPress={() => setFecha(dia)} style={[styles.fecha, fecha === dia && styles.fechaActiva]}>
            <Text style={[styles.fechaTexto, fecha === dia && styles.fechaTextoActiva]}>{fechaLegible(dia)}</Text>
          </Pressable>)}
        </ScrollView>
        <Text style={styles.seccion}>Horarios - 08:00 a 24:00</Text>
        {turnos.length === 0 ? <EstadoVacio mensaje="No hay horarios para esta fecha." /> : <View style={styles.grilla}>
          {turnos.map((turno) => {
            const reservable = prepararSolicitudReserva(turno) !== null;
            const activo = seleccion?.id === turno.id;
            const esPasado = terminoTurno(fecha, turno.fin, ahora);
            return <Pressable key={turno.id} disabled={!reservable} onPress={() => { setSeleccion(turno); setSolicitud(null); }} style={[styles.bloque, { backgroundColor: fondoEstado(turno.estado, paleta) }, esPasado && styles.bloquePasado, activo && styles.bloqueActivo, !reservable && styles.bloqueDeshabilitado]}>
              <Text style={styles.hora}>{turno.inicio}</Text><Text style={styles.estado}>{esPasado ? `Pasado · ${etiquetas[turno.estado]}` : etiquetas[turno.estado]}</Text>
              {turno.motivoBloqueo ? <Text style={styles.motivo}>Motivo: {turno.motivoBloqueo}</Text> : null}
            </Pressable>;
          })}
        </View>}
        {seleccion && <View style={styles.confirmacion}>
          <Text style={styles.seleccionTexto}>Seleccionaste {seleccion.inicio} a {seleccion.fin}</Text>
            <BotonCta
              titulo="Continuar"
              onPress={() => {
                const datos = prepararSolicitudReserva(seleccion);
                if (!datos) return;

                router.push({
                  pathname: "/confirmar-reserva",
                  params: {
                    turnoId: datos.turnoId,
                    espacioId: datos.espacioId,
                    fecha: datos.fecha,
                    inicio: datos.inicio,
                    fin: datos.fin,
                    precio: String(datos.precio),
                  },
                });
              }}
            />
        </View>}
        {solicitud && <Text style={styles.mensajeReserva}>Turno listo para reservar: {solicitud.fecha}, {solicitud.inicio} a {solicitud.fin} - {solicitud.precio === 0 ? "Gratis" : `${solicitud.precio.toLocaleString("es-AR")}`}</Text>}
      </ScrollView>
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: paleta.fondo },
    contenido: { padding: 16, paddingBottom: 36 },
    titulo: { color: paleta.textoOscuro, fontSize: 22, fontWeight: "700" },
    subtitulo: { color: paleta.verdeGrisaceo, marginTop: 5 },
    fechas: { gap: 8, paddingVertical: 18 },
    fecha: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.borde,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
    },
    fechaActiva: {
      backgroundColor: paleta.verdeBoton,
      borderColor: paleta.verdeBoton,
    },
    fechaTexto: { color: paleta.textoOscuro, textTransform: "capitalize" },
    fechaTextoActiva: { color: paleta.textoInvertido, fontWeight: "700" },
    seccion: {
      color: paleta.textoOscuro,
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 12,
    },
    grilla: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    bloque: {
      borderColor: paleta.borde,
      borderRadius: 10,
      borderWidth: 1,
      minHeight: 74,
      justifyContent: "center",
      padding: 10,
      width: "31%",
    },
    bloquePasado: {
      backgroundColor: paleta.estadoPasadoFondo,
      borderColor: paleta.bordeSuave,
    },
    bloqueActivo: { borderColor: paleta.magentaPrincipal, borderWidth: 2 },
    bloqueDeshabilitado: { opacity: 0.72 },
    hora: { color: paleta.textoOscuro, fontSize: 16, fontWeight: "700" },
    estado: { color: paleta.textoOscuro, fontSize: 12, marginTop: 3 },
    motivo: { color: paleta.verdeGrisaceo, fontSize: 10, marginTop: 3 },
    confirmacion: { gap: 12, marginTop: 20 },
    seleccionTexto: { color: paleta.textoOscuro, fontWeight: "600" },
    mensajeReserva: {
      color: paleta.verdePrincipal,
      fontWeight: "600",
      marginTop: 12,
    },
    leyenda: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
    leyendaTexto: { color: paleta.textoOscuro, fontSize: 12 },
  });

function terminoTurno(fecha: string, horaFin: string, ahora: Date): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hora, minuto] = horaFin.split(":").map(Number);
  if (![anio, mes, dia, hora, minuto].every(Number.isFinite)) return false;
  return new Date(anio, mes - 1, dia, hora, minuto).getTime() <= ahora.getTime();
}



