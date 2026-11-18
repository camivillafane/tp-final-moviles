import { abrirBaseDeDatos } from "@/servicios/dbServicios";

type TipoCatalogo = "espacios" | "deportes";

async function prepararTabla() {
  const db = await abrirBaseDeDatos();

  const columnas = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(catalogo_cache);"
  );

  const tieneEstructuraCorrecta =
    columnas.some((columna) => columna.name === "tipo") &&
    columnas.some((columna) => columna.name === "datos") &&
    columnas.some((columna) => columna.name === "actualizadoEn");

  if (columnas.length > 0 && !tieneEstructuraCorrecta) {
    await db.execAsync("DROP TABLE IF EXISTS catalogo_cache;");
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS catalogo_cache (
      tipo TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      actualizadoEn TEXT NOT NULL
    );
  `);

  return db;
}

export async function guardarCatalogo<T>(
  tipo: TipoCatalogo,
  datos: T
): Promise<void> {
  const db = await prepararTabla();

  await db.runAsync(
    `INSERT OR REPLACE INTO catalogo_cache
      (tipo, datos, actualizadoEn)
     VALUES (?, ?, ?);`,
    [tipo, JSON.stringify(datos), new Date().toISOString()]
  );
}

export async function obtenerCatalogo<T>(
  tipo: TipoCatalogo
): Promise<T | null> {
  const db = await prepararTabla();

  const fila = await db.getFirstAsync<{ datos: string }>(
    `SELECT datos
     FROM catalogo_cache
     WHERE tipo = ?
     LIMIT 1;`,
    [tipo]
  );

  if (!fila) return null;

  try {
    return JSON.parse(fila.datos) as T;
  } catch {
    return null;
  }
}
