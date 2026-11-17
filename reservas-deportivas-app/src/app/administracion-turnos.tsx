import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";

import { colores } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import {
  crearBloqueo,
  crearReservaFija,
  darDeBajaReservaFija,
  editarReservaFija,
  listarBloqueos,
  listarReservasFijas,
  quitarBloqueo,
} from "@/servicios/administracionTurnos";
import { listarEspaciosAdministracion } from "@/servicios/administracionEspacios";
import type { Bloqueo, ReservaFijaApi } from "@/tipos/api";
import type { Espacio } from "@/tipos/espacio";

type Seccion = "bloqueos" | "fijas";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const HORAS_INICIO_FIJA = Array.from({ length: 16 }, (_, indice) => `${String(indice + 8).padStart(2, "0")}:00`);

function fechaHoy() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function fechaLegible(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(anio, mes - 1, dia));
}

function horaValida(hora: string) {
  if (!/^\d{2}:00$/.test(hora)) return false;
  const valor = Number(hora.slice(0, 2));
  return valor >= 8 && valor <= 24;
}

function horaDespues(fin: string, inicio: string) {
  return Number(fin.slice(0, 2)) > Number(inicio.slice(0, 2));
}

export default function AdministracionTurnosPantalla() {
  const router = useRouter();
  const { usuario, cargando: cargandoSesion } = useSesion();
  const [seccion, setSeccion] = useState<Seccion>("bloqueos");
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fijas, setFijas] = useState<ReservaFijaApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [espacioId, setEspacioId] = useState("");
  const [fechaBloqueo, setFechaBloqueo] = useState(fechaHoy());
  const [diaCompleto, setDiaCompleto] = useState(true);
  const [inicioBloqueo, setInicioBloqueo] = useState("08:00");
  const [finBloqueo, setFinBloqueo] = useState("09:00");
  const [motivo, setMotivo] = useState("");
  const [titular, setTitular] = useState("");
  const [diaFija, setDiaFija] = useState(1);
  const [inicioFija, setInicioFija] = useState("08:00");
  const [finFija, setFinFija] = useState("09:00");
  const [desdeFija, setDesdeFija] = useState(fechaHoy());
  const [hastaFija, setHastaFija] = useState("");
  const [editandoFijaId, setEditandoFijaId] = useState<string | null>(null);

  const esAdministrador = usuario?.rol === "administrador";
  const espaciosPorId = useMemo(() => new Map(espacios.map((espacio) => [espacio.id, espacio.nombre])), [espacios]);
  const horasFinFija = useMemo(() => {
    const primeraHora = Number(inicioFija.slice(0, 2)) + 1;
    return Array.from({ length: Math.max(0, 25 - primeraHora) }, (_, indice) => `${String(primeraHora + indice).padStart(2, "0")}:00`);
  }, [inicioFija]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaEspacios, listaBloqueos, listaFijas] = await Promise.all([
        listarEspaciosAdministracion(),
        listarBloqueos(fechaHoy()),
        listarReservasFijas(),
      ]);
      const activos = listaEspacios.filter((espacio) => espacio.activo);
      setEspacios(activos);
      setBloqueos(listaBloqueos);
      setFijas(listaFijas);
      setEspacioId((actual) => activos.some((espacio) => espacio.id === actual) ? actual : activos[0]?.id ?? "");
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo cargar la administración de turnos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (!cargandoSesion && usuario && usuario.rol !== "jugador") void cargar();
  }, [cargandoSesion, usuario, cargar]));

  const guardarBloqueo = async () => {
    if (!espacioId) return Alert.alert("Falta el espacio", "Seleccioná un espacio activo.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaBloqueo)) return Alert.alert("Fecha inválida", "Usá el formato AAAA-MM-DD.");
    if (!motivo.trim()) return Alert.alert("Falta el motivo", "Indicá por qué se bloquea el turno.");
    if (!diaCompleto && (!horaValida(inicioBloqueo) || !horaValida(finBloqueo) || !horaDespues(finBloqueo, inicioBloqueo))) {
      return Alert.alert("Horario inválido", "Usá horas en punto entre 08:00 y 24:00; el fin debe ser posterior al inicio.");
    }
    setGuardando(true);
    try {
      await crearBloqueo({
        espacioIds: [espacioId],
        fecha: fechaBloqueo,
        ...(diaCompleto ? {} : { inicio: inicioBloqueo, fin: finBloqueo }),
        motivo: motivo.trim(),
      });
      setMotivo("");
      await cargar();
      Alert.alert("Bloqueo creado", "La agenda se actualizará con el bloqueo.");
    } catch (fallo) {
      Alert.alert("No se pudo crear el bloqueo", fallo instanceof Error ? fallo.message : "Intentá nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarQuitarBloqueo = (bloqueo: Bloqueo) => Alert.alert(
    "Quitar bloqueo",
    "Los turnos volverán a estar disponibles según las reservas y reglas vigentes.",
    [
      { text: "Volver", style: "cancel" },
      { text: "Quitar", style: "destructive", onPress: () => void (async () => {
        try { await quitarBloqueo(bloqueo.id); await cargar(); }
        catch (fallo) { Alert.alert("No se pudo quitar", fallo instanceof Error ? fallo.message : "Intentá nuevamente."); }
      })() },
    ]
  );

  const guardarFija = async () => {
    if (!esAdministrador) return;
    if (!espacioId) return Alert.alert("Falta el espacio", "Seleccioná un espacio activo.");
    if (!titular.trim()) return Alert.alert("Falta el titular", "Ingresá el nombre del grupo o responsable.");
    if (!horaValida(inicioFija) || !horaValida(finFija) || !horaDespues(finFija, inicioFija)) {
      return Alert.alert("Horario inválido", "Usá horas en punto entre 08:00 y 24:00; el fin debe ser posterior al inicio.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desdeFija) || (hastaFija && !/^\d{4}-\d{2}-\d{2}$/.test(hastaFija))) {
      return Alert.alert("Fecha inválida", "Usá el formato AAAA-MM-DD para las fechas.");
    }
    setGuardando(true);
    try {
      const datos = {
        titular: titular.trim(),
        dia: diaFija,
        inicio: inicioFija,
        fin: finFija,
        desde: desdeFija,
        hasta: hastaFija || null,
      };
      if (editandoFijaId) {
        await editarReservaFija(editandoFijaId, datos);
      } else {
        await crearReservaFija({ espacioId, ...datos });
      }
      setTitular("");
      setEditandoFijaId(null);
      await cargar();
      Alert.alert(editandoFijaId ? "Reserva fija actualizada" : "Reserva fija creada", "La reserva recurrente ya está registrada.");
    } catch (fallo) {
      Alert.alert(editandoFijaId ? "No se pudo actualizar la reserva fija" : "No se pudo crear la reserva fija", fallo instanceof Error ? fallo.message : "Intentá nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicionFija = (fija: ReservaFijaApi) => {
    setEditandoFijaId(fija.id);
    setEspacioId(fija.espacioId);
    setTitular(fija.titular);
    setDiaFija(fija.dia);
    setInicioFija(fija.inicio);
    setFinFija(fija.fin);
    setDesdeFija(fija.desde);
    setHastaFija(fija.hasta ?? "");
    setSeccion("fijas");
  };

  const cancelarEdicionFija = () => {
    setEditandoFijaId(null);
    setTitular("");
    setDiaFija(1);
    setInicioFija("08:00");
    setFinFija("09:00");
    setDesdeFija(fechaHoy());
    setHastaFija("");
  };

  const confirmarBajaFija = (fija: ReservaFijaApi) => Alert.alert(
    "Dar de baja reserva fija",
    `Se desactivará la reserva de ${fija.titular}.`,
    [
      { text: "Volver", style: "cancel" },
      { text: "Dar de baja", style: "destructive", onPress: () => void (async () => {
        try { await darDeBajaReservaFija(fija.id); await cargar(); }
        catch (fallo) { Alert.alert("No se pudo dar de baja", fallo instanceof Error ? fallo.message : "Intentá nuevamente."); }
      })() },
    ]
  );

  if (cargandoSesion) return <VistaMensaje mensaje="Verificando la sesión..." />;
  if (!usuario || usuario.rol === "jugador") return <VistaMensaje mensaje="Solo encargados y administradores pueden gestionar turnos." volver={() => router.replace("/")} />;

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><IonIcons name="arrow-back" size={24} color={colores.verdePrincipal} /></Pressable>
        <Text style={estilos.titulo}>Administración de turnos</Text>
        <Pressable onPress={() => void cargar()} accessibilityLabel="Actualizar" accessibilityRole="button"><IonIcons name="refresh-outline" size={23} color={colores.verdePrincipal} /></Pressable>
      </View>
      <Text style={estilos.descripcion}>Administrá los bloqueos por fecha y las reservas que se repiten cada semana.</Text>

      <View style={estilos.pestanas}>
        <BotonPestana activa={seccion === "bloqueos"} texto="Bloqueos" onPress={() => setSeccion("bloqueos")} />
        <BotonPestana activa={seccion === "fijas"} texto="Reservas fijas" onPress={() => setSeccion("fijas")} />
      </View>

      {cargando ? <View style={estilos.centro}><ActivityIndicator size="large" color={colores.verdePrincipal} /><Text style={estilos.secundario}>Cargando turnos...</Text></View> : error ? (
        <View style={estilos.centro}><Text style={estilos.error}>{error}</Text><Boton texto="Reintentar" onPress={() => void cargar()} /></View>
      ) : (
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          {seccion === "bloqueos" ? <>
            <View style={estilos.tarjeta}>
              <Text style={estilos.tituloTarjeta}>Crear bloqueo</Text>
              <Text style={estilos.ayuda}>Elegí un espacio y una fecha. Un bloqueo de día completo afecta todos sus horarios.</Text>
              <SelectorEspacio espacios={espacios} valor={espacioId} onChange={setEspacioId} />
              <Campo etiqueta="Fecha (AAAA-MM-DD)" valor={fechaBloqueo} onChange={setFechaBloqueo} placeholder="2026-11-17" />
              <FilaSwitch etiqueta="Bloquear el día completo" valor={diaCompleto} onChange={setDiaCompleto} />
              {!diaCompleto && <View style={estilos.fila}>
                <Campo compacto etiqueta="Desde (08:00–24:00)" valor={inicioBloqueo} onChange={setInicioBloqueo} placeholder="08:00" />
                <Campo compacto etiqueta="Hasta (08:00–24:00)" valor={finBloqueo} onChange={setFinBloqueo} placeholder="09:00" />
              </View>}
              <Campo etiqueta="Motivo" valor={motivo} onChange={setMotivo} placeholder="Mantenimiento, lluvia..." />
              <Boton texto={guardando ? "Guardando..." : "Crear bloqueo"} onPress={() => void guardarBloqueo()} deshabilitado={guardando} />
            </View>
            <Text style={estilos.seccionTitulo}>Bloqueos desde hoy</Text>
            {bloqueos.length === 0 ? <TextoVacio texto="No hay bloqueos futuros registrados." /> : bloqueos.map((bloqueo) => (
              <View key={bloqueo.id} style={estilos.item}>
                <View style={estilos.itemTexto}>
                  <Text style={estilos.nombre}>{espaciosPorId.get(bloqueo.espacioId) ?? bloqueo.espacioId}</Text>
                  <Text style={estilos.secundario}>{fechaLegible(bloqueo.fecha)} · {bloqueo.inicio && bloqueo.fin ? `${bloqueo.inicio}–${bloqueo.fin}` : "Día completo"}</Text>
                  <Text style={estilos.secundario}>{bloqueo.motivo}</Text>
                </View>
                <Pressable onPress={() => confirmarQuitarBloqueo(bloqueo)} accessibilityLabel="Quitar bloqueo"><IonIcons name="trash-outline" size={22} color={colores.magentaPrincipal} /></Pressable>
              </View>
            ))}
          </> : <>
            {esAdministrador ? <View style={estilos.tarjeta}>
              <Text style={estilos.tituloTarjeta}>{editandoFijaId ? "Editar reserva fija" : "Crear reserva fija"}</Text>
              <Text style={estilos.ayuda}>Se repetirá el mismo día y horario desde la fecha indicada. La fecha final es opcional.</Text>
              {!editandoFijaId && <SelectorEspacio espacios={espacios} valor={espacioId} onChange={setEspacioId} />}
              <Campo etiqueta="Titular / grupo" valor={titular} onChange={setTitular} placeholder="Grupo de entrenamiento" />
              <Text style={estilos.etiqueta}>Día de la semana</Text>
              <View style={estilos.dias}>{DIAS.map((dia, indice) => <Pressable key={dia} onPress={() => setDiaFija(indice)} style={[estilos.dia, diaFija === indice && estilos.diaActivo]}><Text style={[estilos.textoDia, diaFija === indice && estilos.textoDiaActivo]}>{dia.slice(0, 3)}</Text></Pressable>)}</View>
              <View style={estilos.fila}>
                <SelectorHora
                  etiqueta="Desde"
                  valor={inicioFija}
                  opciones={HORAS_INICIO_FIJA}
                  onChange={(hora) => {
                    setInicioFija(hora);
                    if (Number(finFija.slice(0, 2)) <= Number(hora.slice(0, 2))) {
                      setFinFija(`${String(Number(hora.slice(0, 2)) + 1).padStart(2, "0")}:00`);
                    }
                  }}
                />
                <SelectorHora etiqueta="Hasta" valor={finFija} opciones={horasFinFija} onChange={setFinFija} />
              </View>
              <Campo etiqueta="Vigente desde (AAAA-MM-DD)" valor={desdeFija} onChange={setDesdeFija} placeholder="2026-11-17" />
              <Campo etiqueta="Vigente hasta (opcional)" valor={hastaFija} onChange={setHastaFija} placeholder="Sin fecha de fin" />
              <Boton texto={guardando ? "Guardando..." : editandoFijaId ? "Guardar cambios" : "Crear reserva fija"} onPress={() => void guardarFija()} deshabilitado={guardando} />
              {editandoFijaId && <Pressable onPress={cancelarEdicionFija} style={estilos.cancelarEdicion}><Text style={estilos.textoCancelar}>Cancelar edición</Text></Pressable>}
            </View> : <View style={estilos.aviso}><Text style={estilos.secundario}>Solo administradores pueden crear o dar de baja reservas fijas.</Text></View>}
            <Text style={estilos.seccionTitulo}>Reservas fijas</Text>
            {fijas.length === 0 ? <TextoVacio texto="No hay reservas fijas registradas." /> : fijas.map((fija) => (
              <View key={fija.id} style={[estilos.item, !fija.activa && estilos.itemInactivo]}>
                <View style={estilos.itemTexto}>
                  <Text style={estilos.nombre}>{fija.titular}</Text>
                  <Text style={estilos.secundario}>{espaciosPorId.get(fija.espacioId) ?? fija.espacioId} · {DIAS[fija.dia]} · {fija.inicio}–{fija.fin}</Text>
                  <Text style={estilos.secundario}>{fechaLegible(fija.desde)} – {fija.hasta ? fechaLegible(fija.hasta) : "sin fecha de fin"} · {fija.activa ? "Activa" : "Inactiva"}</Text>
                </View>
                {esAdministrador && <View style={estilos.accionesItem}>
                  <Pressable onPress={() => iniciarEdicionFija(fija)} accessibilityLabel="Editar reserva fija"><IonIcons name="create-outline" size={23} color={colores.verdePrincipal} /></Pressable>
                  {fija.activa && <Pressable onPress={() => confirmarBajaFija(fija)} accessibilityLabel="Dar de baja reserva fija"><IonIcons name="remove-circle-outline" size={23} color={colores.magentaPrincipal} /></Pressable>}
                </View>}
              </View>
            ))}
          </>}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function VistaMensaje({ mensaje, volver }: { mensaje: string; volver?: () => void }) {
  return <SafeAreaView style={estilos.contenedor}><View style={estilos.centro}><Text style={estilos.secundario}>{mensaje}</Text>{volver && <Boton texto="Volver" onPress={volver} />}</View></SafeAreaView>;
}

function SelectorEspacio({ espacios, valor, onChange }: { espacios: Espacio[]; valor: string; onChange: (valor: string) => void }) {
  return <View><Text style={estilos.etiqueta}>Espacio</Text>{espacios.length === 0 ? <Text style={estilos.error}>No hay espacios activos para administrar.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.selector}>{espacios.map((espacio) => <Pressable key={espacio.id} onPress={() => onChange(espacio.id)} style={[estilos.chip, valor === espacio.id && estilos.chipActivo]}><Text style={[estilos.textoChip, valor === espacio.id && estilos.textoChipActivo]}>{espacio.nombre}</Text></Pressable>)}</ScrollView>}</View>;
}

function SelectorHora({ etiqueta, valor, opciones, onChange }: { etiqueta: string; valor: string; opciones: string[]; onChange: (valor: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <View style={estilos.selectorHoraContenedor}>
    <Text style={estilos.etiqueta}>{etiqueta}</Text>
    <Pressable style={estilos.selectorHora} onPress={() => setVisible(true)} accessibilityRole="button" accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Text style={estilos.valorHora}>{valor}</Text>
      <IonIcons name="chevron-down" size={18} color={colores.verdePrincipal} />
    </Pressable>
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setVisible(false)}>
      <Pressable style={estilos.fondoModal} onPress={() => setVisible(false)}>
        <Pressable style={estilos.modalHoras} onPress={(evento) => evento.stopPropagation()}>
          <View style={estilos.encabezadoModal}>
            <Text style={estilos.tituloModal}>Seleccionar {etiqueta.toLowerCase()}</Text>
            <Pressable onPress={() => setVisible(false)} accessibilityLabel="Cerrar selector"><IonIcons name="close" size={24} color={colores.verdePrincipal} /></Pressable>
          </View>
          <ScrollView style={estilos.listaHoras}>
            {opciones.map((hora) => <Pressable key={hora} style={[estilos.opcionHora, hora === valor && estilos.opcionHoraActiva]} onPress={() => { onChange(hora); setVisible(false); }}>
              <Text style={[estilos.textoOpcionHora, hora === valor && estilos.textoOpcionHoraActiva]}>{hora}</Text>
              {hora === valor && <IonIcons name="checkmark" size={20} color={colores.verdePrincipal} />}
            </Pressable>)}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  </View>;
}

function Campo({ etiqueta, valor, onChange, placeholder, compacto = false }: { etiqueta: string; valor: string; onChange: (valor: string) => void; placeholder: string; compacto?: boolean }) {
  return <View style={[estilos.campo, compacto && estilos.campoCompacto]}><Text style={estilos.etiqueta}>{etiqueta}</Text><TextInput value={valor} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colores.verdeGrisaceo} style={estilos.entrada} autoCapitalize="none" /></View>;
}

function FilaSwitch({ etiqueta, valor, onChange }: { etiqueta: string; valor: boolean; onChange: (valor: boolean) => void }) {
  return <View style={estilos.filaSwitch}><Text style={estilos.secundario}>{etiqueta}</Text><Switch value={valor} onValueChange={onChange} trackColor={{ true: colores.verdePrincipal }} /></View>;
}

function BotonPestana({ activa, texto, onPress }: { activa: boolean; texto: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[estilos.pestana, activa && estilos.pestanaActiva]}><Text style={[estilos.textoPestana, activa && estilos.textoPestanaActiva]}>{texto}</Text></Pressable>;
}

function Boton({ texto, onPress, deshabilitado = false }: { texto: string; onPress: () => void; deshabilitado?: boolean }) {
  return <Pressable onPress={onPress} disabled={deshabilitado} style={[estilos.boton, deshabilitado && estilos.botonDeshabilitado]}><Text style={estilos.textoBoton}>{texto}</Text></Pressable>;
}

function TextoVacio({ texto }: { texto: string }) {
  return <View style={estilos.vacio}><Text style={estilos.secundario}>{texto}</Text></View>;
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 },
  titulo: { color: colores.textoOscuro, fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  descripcion: { color: colores.verdeGrisaceo, fontSize: 14, lineHeight: 20, paddingHorizontal: 20, paddingBottom: 14 },
  pestanas: { flexDirection: "row", marginHorizontal: 18, padding: 4, borderRadius: 12, backgroundColor: colores.blanco },
  pestana: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 9 },
  pestanaActiva: { backgroundColor: colores.verdePrincipal },
  textoPestana: { color: colores.verdePrincipal, fontWeight: "700" },
  textoPestanaActiva: { color: colores.blanco },
  contenido: { padding: 18, paddingBottom: 32, gap: 12 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 16, padding: 16, gap: 12 },
  tituloTarjeta: { color: colores.textoOscuro, fontSize: 18, fontWeight: "700" },
  ayuda: { color: colores.verdeGrisaceo, fontSize: 13, lineHeight: 18 },
  etiqueta: { color: colores.textoOscuro, fontSize: 13, fontWeight: "600", marginBottom: 5 },
  campo: { flex: 1 },
  campoCompacto: { flex: 1 },
  entrada: { minHeight: 44, borderWidth: 1, borderColor: colores.borde, borderRadius: 9, paddingHorizontal: 11, color: colores.textoOscuro, backgroundColor: colores.blanco },
  fila: { flexDirection: "row", gap: 10 },
  filaSwitch: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  selector: { gap: 8, paddingVertical: 3 },
  chip: { borderWidth: 1, borderColor: colores.borde, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipActivo: { backgroundColor: colores.verdePrincipal, borderColor: colores.verdePrincipal },
  textoChip: { color: colores.textoOscuro, fontSize: 13 },
  textoChipActivo: { color: colores.blanco, fontWeight: "700" },
  boton: { alignItems: "center", backgroundColor: colores.verdePrincipal, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16 },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: colores.blanco, fontWeight: "700" },
  seccionTitulo: { color: colores.textoOscuro, fontSize: 17, fontWeight: "700", marginTop: 6 },
  item: { alignItems: "center", backgroundColor: colores.blanco, borderRadius: 13, flexDirection: "row", gap: 12, padding: 14 },
  itemInactivo: { opacity: 0.65 },
  itemTexto: { flex: 1, gap: 4 },
  nombre: { color: colores.textoOscuro, fontSize: 15, fontWeight: "700" },
  secundario: { color: colores.verdeGrisaceo, fontSize: 13, lineHeight: 18 },
  vacio: { backgroundColor: colores.blanco, borderRadius: 12, padding: 16 },
  aviso: { backgroundColor: colores.blanco, borderRadius: 12, padding: 14 },
  centro: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  error: { color: colores.magentaPrincipal, fontSize: 14, textAlign: "center" },
  dias: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  selectorHoraContenedor: { flex: 1 },
  selectorHora: { alignItems: "center", backgroundColor: colores.blanco, borderColor: colores.borde, borderRadius: 9, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 44, paddingHorizontal: 11 },
  valorHora: { color: colores.textoOscuro, fontSize: 15, fontWeight: "600" },
  fondoModal: { backgroundColor: "rgba(0, 0, 0, 0.42)", flex: 1, justifyContent: "center", padding: 24 },
  modalHoras: { backgroundColor: colores.blanco, borderRadius: 16, maxHeight: "75%", padding: 16 },
  encabezadoModal: { alignItems: "center", borderBottomColor: colores.borde, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", paddingBottom: 12 },
  tituloModal: { color: colores.textoOscuro, fontSize: 17, fontWeight: "700" },
  listaHoras: { marginTop: 6 },
  opcionHora: { alignItems: "center", borderBottomColor: colores.borde, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", justifyContent: "space-between", minHeight: 46, paddingHorizontal: 8 },
  opcionHoraActiva: { backgroundColor: "#e5f2e8" },
  textoOpcionHora: { color: colores.textoOscuro, fontSize: 15 },
  textoOpcionHoraActiva: { color: colores.verdePrincipal, fontWeight: "700" },
  dia: { alignItems: "center", borderColor: colores.borde, borderRadius: 18, borderWidth: 1, flex: 1, paddingVertical: 9 },
  accionesItem: { alignItems: "center", flexDirection: "row", gap: 12 },
  cancelarEdicion: { alignItems: "center", paddingVertical: 8 },
  textoCancelar: { color: colores.magentaPrincipal, fontWeight: "600" },
  diaActivo: { backgroundColor: colores.verdePrincipal, borderColor: colores.verdePrincipal },
  textoDia: { color: colores.textoOscuro, fontSize: 11 },
  textoDiaActivo: { color: colores.blanco, fontWeight: "700" },
});
