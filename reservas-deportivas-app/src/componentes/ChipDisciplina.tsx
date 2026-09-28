import { Pressable, StyleSheet, Text } from "react-native";
import { Deporte } from "@/tipos/deporte";
import { colores } from "@/constantes/colores";

interface ChipDisciplinaProps {
  deporte: Deporte;
  seleccionado: boolean;
  onPress: () => void;
}

export function ChipDisciplina({ deporte, seleccionado, onPress }: ChipDisciplinaProps) {
  return (
    <Pressable
      style={[
        estilos.chip,
        seleccionado && { backgroundColor: colores.verdePrincipal, borderColor: colores.verdePrincipal },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          estilos.texto,
          seleccionado && { color: colores.blanco },
        ]}
      >
        {deporte.nombre}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  texto: {
    color: colores.verdePrincipal,
    fontSize: 14,
    fontWeight: "500",
  },
});
