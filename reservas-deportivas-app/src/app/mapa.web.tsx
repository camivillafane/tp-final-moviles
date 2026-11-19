import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Espacio } from "@/tipos/espacio";
import { EstadoCarga } from "@/componentes/EstadoCarga";
import { EstadoError } from "@/componentes/EstadoError";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { usePaleta } from "@/contextos/Tema";
import { listarEspacios } from "@/servicios/espacios";
import IonIcons from "@react-native-vector-icons/ionicons";

export default function MapaWeb() {
  const router = useRouter();
  const paleta = usePaleta();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [estado, setEstado] = useState<"loading" | "success" | "error">("loading");

  const cargarMapa = async () => {
    setEstado("loading");
    try {
      const { datos } = await listarEspacios();
      setEspacios(datos.filter((espacio) => espacio.activo));
      setEstado("success");
    } catch {
      setEstado("error");
    }
  };

  useEffect(() => {
    cargarMapa();
  }, []);

  if (estado === "loading") return <EstadoCarga mensaje="Cargando espacios..." />;
  if (estado === "error") {
    return <EstadoError mensaje="No se pudo cargar la lista de espacios." onReintentar={cargarMapa} />;
  }

  const estilos = crearEstilos(paleta);

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top"]}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <Text style={estilos.titulo}>Espacios deportivos</Text>
      <View style={estilos.lista}>
        {espacios.map((espacio) => (
          <Pressable
            key={espacio.id}
            style={estilos.tarjeta}
            onPress={() => router.push(`/espacios/${espacio.id}`)}
          >
            <View style={estilos.icono}>
              <IonIcons name="location" size={20} color={paleta.verdePrincipal} />
            </View>
            <View style={estilos.texto}>
              <Text style={estilos.nombre}>{espacio.nombre}</Text>
              <Text style={estilos.complejo}>{espacio.complejo}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function crearEstilos(paleta: ReturnType<typeof usePaleta>) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: paleta.fondo },
    titulo: { fontSize: 24, fontWeight: "700", color: paleta.texto, padding: 20 },
    lista: { gap: 10, paddingHorizontal: 20 },
    tarjeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: paleta.superficie,
    },
    icono: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    texto: { flex: 1 },
    nombre: { fontSize: 16, fontWeight: "700", color: paleta.texto },
    complejo: { fontSize: 14, color: paleta.textoSecundario, marginTop: 3 },
  });
}
