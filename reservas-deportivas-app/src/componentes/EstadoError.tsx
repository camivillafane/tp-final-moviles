import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface EstadoErrorProps {
  mensaje?: string;
  onReintentar?: () => void;
}

export function EstadoError({
  mensaje = "No se pudieron cargar los datos.",
  onReintentar,
}: EstadoErrorProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <IonIcons name="alert-circle-outline" size={48} color={paleta.magentaPrincipal} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {onReintentar && (
        <Pressable
          style={estilos.boton}
          onPress={onReintentar}
          accessibilityRole="button"
        >
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      alignItems: "center",
      backgroundColor: paleta.fondo,
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    mensaje: {
      color: paleta.textoOscuro,
      fontSize: 16,
      marginTop: 12,
      textAlign: "center",
    },
    boton: {
      backgroundColor: paleta.magentaBoton,
      borderRadius: 8,
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    textoBoton: {
      color: paleta.textoInvertido,
      fontSize: 14,
      fontWeight: "600",
    },
  });
