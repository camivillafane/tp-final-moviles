import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Espacio } from "@/tipos/espacio";
import { Deporte } from "@/tipos/deporte";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { EstadoVacio } from "@/componentes/EstadoVacio";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { Buscador } from "@/componentes/Buscador";
import { ChipDisciplina } from "@/componentes/ChipDisciplina";
import { ChipFiltro } from "@/componentes/ChipFiltro";
import { CardEspacio } from "@/componentes/CardEspacio";
import { colores } from "@/constantes/colores";
import { getEspacios } from "@/servicios/espacios";
import { deportesMock } from "@/mocks/deportes";
import { MenuPerfil } from "@/componentes/MenuPerfil";
import { useSesion } from "@/contextos/Sesion";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const router = useRouter();
  const { usuario, cerrarSesion } = useSesion();
  const [menuPerfilVisible, setMenuPerfilVisible] = useState(false);

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [estado, setEstado] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const deportes = useMemo<Deporte[]>(() => {
    const idsConEspacios = new Set(
      espacios
        .filter((espacio) => espacio.activo)
        .map((espacio) => espacio.deporteId)
    );
    return deportesMock.filter((deporte) => idsConEspacios.has(deporte.id));
  }, [espacios]);

  const [deporteSeleccionado, setDeporteSeleccionado] = useState<string | null>(null);
  const [complejoSeleccionado, setComplejoSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const cargarEspacios = async () => {
    setEstado("loading");
    setError(null);

    try {
      const datos = await getEspacios();
      setEspacios(datos);
      setEstado("success");
    } catch (e) {
      setError("No se pudieron cargar los espacios. Intentá de nuevo.");
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarEspacios();
  }, []);

  const [refrescando, setRefrescando] = useState(false);

  const refrescar = async () => {
    setRefrescando(true);
    try {
      const datos = await getEspacios();
      setEspacios(datos);
    } catch {
      setError("No se pudieron cargar los espacios. Intentalo nuevamente.");
      setEstado("error");
    } finally {
      setRefrescando(false);
    }
  };

  const complejos = useMemo(() => {
    return Array.from(
      new Set(
        espacios
          .filter((espacio) => espacio.activo)
          .map((espacio) => espacio.complejo)
      )
    );
  }, [espacios]);

  const espaciosFiltrados = useMemo(() => {
    return espacios.filter((espacio) => {
      if (!espacio.activo) return false;

      const coincideDeporte = deporteSeleccionado
        ? espacio.deporteId === deporteSeleccionado
        : true;

      const coincideComplejo = complejoSeleccionado
        ? espacio.complejo === complejoSeleccionado
        : true;

      const termino = busqueda.trim().toLowerCase();
      const coincideBusqueda = termino
        ? espacio.nombre.toLowerCase().includes(termino) ||
          espacio.complejo.toLowerCase().includes(termino)
        : true;

      return coincideDeporte && coincideComplejo && coincideBusqueda;
    });
  }, [espacios, deporteSeleccionado, complejoSeleccionado, busqueda]);

  if (estado === "loading") {
    return <EstadoCarga mensaje="Cargando espacios..." />;
  }

  if (estado === "error") {
    return <EstadoError mensaje={error ?? "Ocurrió un error"} onReintentar={cargarEspacios} />;
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top"]}>
      <HeaderInstitucional onPerfilPress={() => setMenuPerfilVisible(true)} />

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.contenidoScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            />
        }
      >
        <Buscador valor={busqueda} onChangeText={setBusqueda} />

        <Text style={estilos.tituloSeccion}>Filtrar por deporte</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.chips}
        >
          <ChipDisciplina
            deporte={{ id: "todos", nombre: "Todos", icono: "apps-outline", color: colores.verdePrincipal }}
            seleccionado={deporteSeleccionado === null}
            onPress={() => setDeporteSeleccionado(null)}
          />
          {deportes.map((deporte) => (
            <ChipDisciplina
              key={deporte.id}
              deporte={deporte}
              seleccionado={deporteSeleccionado === deporte.id}
              onPress={() => setDeporteSeleccionado(deporte.id)}
            />
          ))}
        </ScrollView>

        <Text style={estilos.tituloSeccion}>Filtrar por complejo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={estilos.chips}
        >
          <ChipFiltro
            etiqueta="Todos"
            seleccionado={complejoSeleccionado === null}
            onPress={() => setComplejoSeleccionado(null)}
          />
          {complejos.map((complejo) => (
            <ChipFiltro
              key={complejo}
              etiqueta={complejo}
              seleccionado={complejoSeleccionado === complejo}
              onPress={() => setComplejoSeleccionado(complejo)}
            />
          ))}
        </ScrollView>

        <Pressable
          style={estilos.bloqueMapa}
          onPress={() => router.push("/mapa")}
        >
          <Text style={estilos.tituloMapa}>Ver todos en el mapa</Text>
          <Text style={estilos.subtituloMapa}>Encontrá los espacios deportivos de Villaguay</Text>
        </Pressable>

        <Text style={estilos.tituloSeccion}>Espacios disponibles</Text>

        {espaciosFiltrados.length === 0 ? (
          <EstadoVacio mensaje="No se encontraron espacios con ese filtro." />
        ) : (
          espaciosFiltrados.map((espacio) => (
            <CardEspacio
              key={espacio.id}
              espacio={espacio}
              onVerDetalle={() =>
                router.push({
                  pathname: "/espacio/[id]",
                  params: { id: espacio.id },
                })
              }
            />
          ))
        )}
      </ScrollView>

      <MenuPerfil
        visible={menuPerfilVisible}
        usuario={usuario}
        onCerrar={() => setMenuPerfilVisible(false)}
        onCerrarSesion={async() => {
          await cerrarSesion();
          setMenuPerfilVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: colores.fondo,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contenidoScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  tituloSeccion: {
    color: colores.textoOscuro,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 20,
  },
  chips: {
    paddingBottom: 4,
  },
  bloqueMapa: {
    backgroundColor: colores.verdePrincipal,
    borderRadius: 16,
    marginTop: 20,
    padding: 20,
  },
  tituloMapa: {
    color: colores.blanco,
    fontSize: 16,
    fontWeight: "700",
  },
  subtituloMapa: {
    color: colores.blanco,
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9,
  },
});
