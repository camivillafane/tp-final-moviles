import { Asset } from "expo-asset";

/**
 * Fotos locales de los espacios.
 *
 * Se resuelven a un string (URI) para respetar el contrato `imagenes: string[]`
 * acordado con el Integrante 2, sin tener que cambiar el tipo `Espacio`.
 *
 * Los espacios que todavía no tienen fotos locales conservan las URLs
 * definidas en `espaciosMock`.
 */
const local = (modulo: number): string => Asset.fromModule(modulo).uri;

export const imagenesEspacio: Record<string, string[]> = {
  // espacio-01 — Cancha 1 de Fútbol 5 (Polideportivo Municipal)
  "espacio-01": [
    local(require("../../assets/espacios/espacio-futbol5-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-futbol5-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-futbol5-cancha1-03.jpg")),
  ],

  // espacio-03 — Cancha de Básquet (Polideportivo Municipal)
  "espacio-03": [
    local(require("../../assets/espacios/espacio-basquet-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-basquet-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-basquet-cancha1-03.jpg")),
  ],

  // espacio-07 — Cancha de Fútbol 11 (Parque Berduc)
  "espacio-07": [
    local(require("../../assets/espacios/espacio-futbol11-cancha1-01.jpg")),
    local(require("../../assets/espacios/espacio-futbol11-cancha1-02.jpg")),
    local(require("../../assets/espacios/espacio-futbol11-cancha1-03.jpg")),
  ],
};
