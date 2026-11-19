export const idsApiPorEspacioMock: Record<string, string> = {
  "espacio-01": "esp-01",
  "espacio-02": "esp-02",
  "espacio-03": "esp-04",
  "espacio-04": "esp-07",
  "espacio-07": "esp-03",
  "espacio-08": "esp-09",
  "espacio-09": "esp-10",
};

export function obtenerIdEspacioApi(espacioIdMock: string): string | null {
  return idsApiPorEspacioMock[espacioIdMock] ?? null;
}
