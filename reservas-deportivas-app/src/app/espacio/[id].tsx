import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Espacio } from "@/tipos/espacio";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { BotonCta } from "@/componentes/BotonCta";
import { colores } from "@/constantes/colores";
import { getEspacioById } from "@/servicios/espacios";
import { deportesMock } from "@/mocks/deportes";

export default function DetalleEspacio() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

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

  return (
    <View style={estilos.contenedor}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <ScrollView style={estilos.scroll} showsVerticalScrollIndicator={false}>
        <FlatList
          data={espacio.imagenes}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={estilos.imagen} resizeMode="cover" />
          )}
        />

        <View style={estilos.contenido}>
          <Text style={estilos.complejo}>{espacio.complejo}</Text>
          <Text style={estilos.deporte}>{deporte?.nombre}</Text>
          <Text style={estilos.nombre}>{espacio.nombre}</Text>

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
              onPress={() => router.push({ pathname: "/disponibilidad/[id]", params: { id: espacio.id } })}
            />
            <Pressable style={estilos.secundario} onPress={() => router.push({ pathname: "/mapa", params: { espacioId: espacio.id } })}>
              <Text style={estilos.secundarioTexto}>Ver en el mapa</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  imagen: {
    height: 260,
    width: 360,
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
  nombre: {
    color: colores.textoOscuro,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
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
  }
});