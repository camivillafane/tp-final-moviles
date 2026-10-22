import { Pressable, StyleSheet, Text } from "react-native";
import { colores } from "@/constantes/colores";

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
  color = colores.verdePrincipal,
}: ChipFiltroProps) {
  return (
    <Pressable
      style={[
        estilos.chip,
        seleccionado && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          estilos.texto,
          seleccionado && { color: colores.blanco },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
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
    color: colores.verdePrincipal,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
