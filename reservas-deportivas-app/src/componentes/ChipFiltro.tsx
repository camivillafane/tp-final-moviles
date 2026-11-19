import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface ChipFiltroProps {
  etiqueta: string;
  seleccionado: boolean;
  onPress: () => void;
  color?: string;
}

export function ChipFiltro({
  etiqueta,
  seleccionado,
  onPress,
  color,
}: ChipFiltroProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
  const colorActivo = color ?? paleta.verdeBoton;

  return (
    <Pressable
      style={[
        estilos.chip,
        seleccionado && { backgroundColor: colorActivo, borderColor: colorActivo },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado }}
    >
      <Text
        style={[
          estilos.texto,
          seleccionado && { color: paleta.textoInvertido },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    chip: {
      alignItems: "center",
      backgroundColor: paleta.superficie,
      borderColor: paleta.borde,
      borderRadius: 20,
      borderWidth: 1,
      justifyContent: "center",
      marginRight: 8,
      maxWidth: 150,
      minWidth: 88,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    texto: {
      color: paleta.verdePrincipal,
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center",
    },
  });
