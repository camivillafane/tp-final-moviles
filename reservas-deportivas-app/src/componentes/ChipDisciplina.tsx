import { Deporte } from "@/tipos/deporte";
import { ChipFiltro } from "./ChipFiltro";

interface ChipDisciplinaProps {
  deporte: Deporte;
  seleccionado: boolean;
  onPress: () => void;
}

export function ChipDisciplina({ deporte, seleccionado, onPress }: ChipDisciplinaProps) {
  return (
    <ChipFiltro
      etiqueta={deporte.nombre}
      seleccionado={seleccionado}
      onPress={onPress}
      color={deporte.color}
    />
  );
}
