import { Asset } from "expo-asset";

/**
 * Resuelve un asset local a un string (URI).
 *
 * - `.uri` es `string`
 * - `.localUri` es `string | null` y queda null hasta downloadAsync()
 */
const local = (modulo: number): string => Asset.fromModule(modulo).uri;

/**
 * Videos locales por espacio.
 *
 * Este archivo está en `src/mocks/`, por eso la ruta necesita DOS `../`
 * para llegar a la raíz de la app: src/mocks -> src -> raíz.
 */
export const videosEspacio: Record<string, string> = {
  "espacio-07": local(
    require("../../assets/espacios/espacio-futbol11-cancha1.mp4")
  ),
};
