import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Espacio } from "@/tipos/espacio";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { BotonCta } from "@/componentes/BotonCta";
import { colores } from "@/constantes/colores";
import { getEspacioById } from "@/servicios/espacios";
import { deportesMock } from "@/mocks/deportes";
import { VideoEspacio } from "@/componentes/VideoEspacio";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useFavoritos } from "@/contextos/Favoritos";
import { useSesion } from "@/contextos/Sesion";

export default function DetalleEspacio() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useSesion();
  const { esFavorito, cambiarFavorito } = useFavoritos();

  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [estado, setEstado] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const cargarEspacio = async () => {
    if (!id) {
      setError("No se proporcionó un identificador de espacio.");
      setEstado("error");
      return;
    }

    setEstado("loading");
    setError(null);

    try {
      const datos = await getEspacioById(id);

      if (!datos) {
        setError("El espacio solicitado no existe.");
        setEstado("error");
        return;
      }

      setEspacio(datos);
      setEstado("success");
    } catch (e) {
      setError("No se pudo cargar el espacio. Intentá de nuevo.");
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarEspacio();
  }, [id]);

  if (estado === "loading") {
    return <EstadoCarga mensaje="Cargando espacio..." />;
  }

  if (estado === "error") {
    return <EstadoError mensaje={error ?? "Ocurrió un error"} onReintentar={cargarEspacio} />;
  }

  if (!espacio) {
    return <EstadoError mensaje="El espacio no existe." />;
  }

  const deporte = deportesMock.find((d) => d.id === espacio?.deporteId);
  const favorito = esFavorito(espacio.id);

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <ScrollView style={estilos.scroll} showsVerticalScrollIndicator={false}>
        <GaleriaEspacio imagenes={espacio.imagenes} />

        <View style={estilos.contenido}>
          <Text style={estilos.complejo}>{espacio.complejo}</Text>
          <Text style={estilos.deporte}>{deporte?.nombre}</Text>
          <View style={estilos.filaNombre}>
            <Text style={estilos.nombre}>{espacio.nombre}</Text>
            {usuario && (
              <Pressable
                style={estilos.botonFavorito}
                onPress={() => cambiarFavorito(espacio.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  favorito ? "Quitar de favoritos" : "Agregar a favoritos"
                }
              >
                <IonIcons
                  name={favorito ? "heart" : "heart-outline"}
                  size={28}
                  color={colores.magentaPrincipal}
                />
              </Pressable>
            )}
          </View>

          {!espacio.activo && (
            <View style={estilos.badgeInactivo}>
              <Text style={estilos.badgeTexto}>No disponible</Text>
            </View>
          )}

          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Video del espacio</Text>
            <VideoEspacio url={espacio.videoUrl} />
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Características</Text>
            <FilaCaracteristica label="Superficie" valor={espacio.superficie} />
            <FilaCaracteristica label="Techado" valor={espacio.techado ? "Sí" : "No"} />
            <FilaCaracteristica label="Iluminación nocturna" valor={espacio.iluminacion ? "Sí" : "No"} />
            <FilaCaracteristica label="Capacidad" valor={`${espacio.capacidad} personas`} />
            <FilaCaracteristica
              label="Precio por hora"
              valor={
                espacio.precioPorHora === 0
                  ? "Gratis"
                  : `$${espacio.precioPorHora.toLocaleString("es-AR")}`
              }
            />
          </View>

          <View style={estilos.seccion}>
            <Text style={estilos.tituloSeccion}>Reglas de uso</Text>
            <Text style={estilos.reglas}>{espacio.reglas}</Text>
          </View>

          <View style={estilos.seccion}>
            <BotonCta
              titulo="Ver disponibilidad"
              deshabilitado={!espacio.activo}
              onPress={() => router.push({ pathname: "/disponibilidad/[id]", params: { id: espacio.id } })}
            />
            <Pressable style={estilos.secundario} onPress={() => router.push({ pathname: "/mapa", params: { espacioId: espacio.id } })}>
              <Text style={estilos.secundarioTexto}>Ver en el mapa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface GaleriaEspacioProps {
  imagenes: string[];
}

function GaleriaEspacio({ imagenes }: GaleriaEspacioProps) {
  const [ancho, setAncho] = useState(0);
  const [indice, setIndice] = useState(0);

  const alto = Math.round((ancho * 805) / 1200);

  const alTerminarScroll = (
    evento: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (ancho === 0) return;

    const nuevoIndice = Math.round(
      evento.nativeEvent.contentOffset.x / ancho
    );
    if (nuevoIndice !== indice) setIndice(nuevoIndice);
  };

  if (imagenes.length === 0) {
    return (
      <View style={estilos.galeriaVacia}>
        <Text style={estilos.textoVacio}>
          Este espacio todavía no tiene fotos.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={estilos.galeria}
      onLayout={(evento) => {
        const medido = evento.nativeEvent.layout.width;
        if (Math.abs(medido - ancho) > 0.5) setAncho(medido);
      }}
    >
      {ancho > 0 && (
        <FlatList
          data={imagenes}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${index}-${item}`}
          onMomentumScrollEnd={alTerminarScroll}
          getItemLayout={(_, index) => ({
            length: ancho,
            offset: ancho * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <Image
              source={{ uri: item }}
              style={[estilos.foto, { width: ancho, height: alto }]}
              resizeMode="cover"
              accessibilityLabel={`Foto ${index + 1} de ${imagenes.length}`}
            />
          )}
        />
      )}

      {imagenes.length > 1 && (
        <View style={estilos.dotsContenedor} pointerEvents="none">
          <View style={estilos.dotsFondo}>
            {imagenes.map((_, i) => (
              <View
                key={i}
                style={[estilos.dot, i === indice && estilos.dotActivo]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

interface FilaCaracteristicaProps {
  label: string;
  valor: string;
}

function FilaCaracteristica({ label, valor }: FilaCaracteristicaProps) {
  return (
    <View style={estilos.fila}>
      <Text style={estilos.label}>{label}</Text>
      <Text style={estilos.valor}>{valor}</Text>
    </View>
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
  foto: {
    backgroundColor: colores.fondo,
  },
  galeria: {
    position: "relative",
    width: "100%",
  },
  galeriaVacia: {
    alignItems: "center",
    backgroundColor: colores.fondo,
    justifyContent: "center",
    minHeight: 160,
    paddingHorizontal: 20,
    width: "100%",
  },
  textoVacio: {
    color: colores.verdeGrisaceo,
    fontSize: 14,
  },
  dotsContenedor: {
    alignItems: "center",
    bottom: 12,
    left: 0,
    position: "absolute",
    right: 0,
  },
  dotsFondo: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotActivo: {
    backgroundColor: colores.blanco,
    width: 18,
  },
  contenido: {
    padding: 20,
    paddingBottom: 40,
  },
  complejo: {
    color: colores.verdeGrisaceo,
    fontSize: 13,
    textTransform: "uppercase",
  },
  deporte: {
    color: colores.verdeSecundario,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  filaNombre: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  nombre: {
    color: colores.textoOscuro,
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
  },
  botonFavorito: {
    padding: 4,
  },
  seccion: {
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  tituloSeccion: {
    color: colores.verdePrincipal,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: colores.verdeGrisaceo,
    fontSize: 14,
  },
  valor: {
    color: colores.textoOscuro,
    fontSize: 14,
    fontWeight: "500",
  },
  reglas: {
    color: colores.textoOscuro,
    fontSize: 14,
    lineHeight: 20,
  },
  secundario: {
    alignItems: "center",
    marginTop: 12,
  },
  secundarioTexto: {
    color: colores.verdePrincipal,
    fontSize: 14,
    fontWeight: "600",
  },
  badgeInactivo: {
    alignSelf: "flex-start",
    backgroundColor: "#f3e1e1",
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: "#8a2f2f",
    fontSize: 12,
    fontWeight: "700",
  }
});