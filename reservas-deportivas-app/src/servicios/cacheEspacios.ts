import type { Espacio } from "@/tipos/espacio";
import type { RespuestaLista } from "@/tipos/api";
import { abrirBaseDeDatos } from "@/servicios/dbServicios";


async function prepararTabla() {
  const db = await abrirBaseDeDatos();

  const columnas = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(espacios_cache);"
  );

  const tieneClave = columnas.some((columna) => columna.name === "clave");

  if (columnas.length > 0 && !tieneClave) {
    await db.execAsync("DROP TABLE IF EXISTS espacios_cache;");
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS espacios_cache (
      clave TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      actualizadoEn TEXT NOT NULL
    );
  `);

  return db;
}

export async function guardarEspaciosCache(
  clave: string,
  respuesta: RespuestaLista<Espacio>
): Promise<void> {
  const db = await prepararTabla();

  await db.runAsync(
    `INSERT OR REPLACE INTO espacios_cache
      (clave, datos, actualizadoEn)
     VALUES (?, ?, ?);`,
    [clave, JSON.stringify(respuesta), new Date().toISOString()]
  );
}

export async function obtenerEspaciosCache(
  clave: string
): Promise<RespuestaLista<Espacio> | null> {
  const db = await prepararTabla();

  const fila = await db.getFirstAsync<{ datos: string }>(
    `SELECT datos FROM espacios_cache WHERE clave = ? LIMIT 1;`,
    [clave]
  );

  if (!fila) return null;

  try {
    return JSON.parse(fila.datos) as RespuestaLista<Espacio>;
  } catch {
    return null;
  }
}
