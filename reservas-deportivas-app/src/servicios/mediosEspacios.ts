import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

import type { ArchivoSubido } from "@/tipos/api";
import type { Espacio } from "@/tipos/espacio";
import type { MedioEspacio, TipoMedio } from "@/tipos/medioEspacio";
import { abrirBaseDeDatos } from "@/servicios/dbServicios";

const CARPETA_MEDIOS = "espacios";

interface FilaMedio {
  id: string;
  espacioId: string;
  tipo: string;
  url: string;
  rutaLocal: string | null;
  nombre: string;
  creadoEn: string;
}

const aMedio = (fila: FilaMedio): MedioEspacio => ({
  id: fila.id,
  espacioId: fila.espacioId,
  tipo: fila.tipo === "video" ? "video" : "imagen",
  url: fila.url,
  rutaLocal: fila.rutaLocal,
  nombre: fila.nombre,
  creadoEn: fila.creadoEn,
});

async function prepararTabla() {
  const db = await abrirBaseDeDatos();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medios_espacios (
      id TEXT PRIMARY KEY NOT NULL,
      espacioId TEXT NOT NULL,
      tipo TEXT NOT NULL,
      url TEXT NOT NULL,
      rutaLocal TEXT,
      nombre TEXT NOT NULL,
      creadoEn TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_medios_espacios_espacio
      ON medios_espacios (espacioId);
  `);

  return db;
}

function carpetaDeEspacio(espacioId: string): Directory {
  const carpeta = new Directory(Paths.document, CARPETA_MEDIOS, espacioId);

  if (!carpeta.exists) {
    carpeta.create({ idempotent: true, intermediates: true });
  }

  return carpeta;
}

function extensionDe(url: string): string {
  const sinParametros = url.split("?")[0];
  const punto = sinParametros.lastIndexOf(".");

  return punto >= 0 ? sinParametros.slice(punto) : "";
}

/** Copia el archivo al dispositivo para poder mostrarlo sin conexión. */
async function cachearMedio(medio: MedioEspacio): Promise<string | null> {
  try {
    const carpeta = carpetaDeEspacio(medio.espacioId);
    const destino = new File(carpeta, `${medio.id}${extensionDe(medio.url)}`);

    if (!destino.exists) {
      await File.downloadFileAsync(medio.url, destino, { idempotent: true });
    }

    return destino.exists ? destino.uri : null;
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudo guardar el archivo para uso sin conexión:", error);
    }

    return null;
  }
}

function rutaLocalDisponible(medio: MedioEspacio): string | null {
  if (!medio.rutaLocal) return null;

  try {
    return new File(medio.rutaLocal).exists ? medio.rutaLocal : null;
  } catch {
    return null;
  }
}

export async function listarMediosEspacio(
  espacioId: string
): Promise<MedioEspacio[]> {
  const db = await prepararTabla();

  const filas = await db.getAllAsync<FilaMedio>(
    `SELECT id, espacioId, tipo, url, rutaLocal, nombre, creadoEn
     FROM medios_espacios
     WHERE espacioId = ?
     ORDER BY creadoEn ASC;`,
    [espacioId]
  );

  return filas.map(aMedio);
}

export async function listarMediosPorEspacio(): Promise<
  Record<string, MedioEspacio[]>
> {
  const db = await prepararTabla();

  const filas = await db.getAllAsync<FilaMedio>(
    `SELECT id, espacioId, tipo, url, rutaLocal, nombre, creadoEn
     FROM medios_espacios
     ORDER BY creadoEn ASC;`
  );

  return filas.reduce<Record<string, MedioEspacio[]>>((acumulado, fila) => {
    const medio = aMedio(fila);
    acumulado[medio.espacioId] = [...(acumulado[medio.espacioId] ?? []), medio];
    return acumulado;
  }, {});
}

async function borrarMediosDeTipo(
  espacioId: string,
  tipo: TipoMedio
): Promise<void> {
  const medios = await listarMediosEspacio(espacioId);

  for (const medio of medios.filter((item) => item.tipo === tipo)) {
    await eliminarMedioEspacio(medio);
  }
}

export async function guardarMedioEspacio(
  espacioId: string,
  archivo: ArchivoSubido,
  nombre: string
): Promise<MedioEspacio> {
  const db = await prepararTabla();
  const tipo: TipoMedio = archivo.tipo === "video" ? "video" : "imagen";

  // Cada espacio tiene un solo video propio: el nuevo reemplaza al anterior.
  if (tipo === "video") {
    await borrarMediosDeTipo(espacioId, "video");
  }

  const medio: MedioEspacio = {
    id: Crypto.randomUUID(),
    espacioId,
    tipo,
    url: archivo.url,
    rutaLocal: null,
    nombre,
    creadoEn: new Date().toISOString(),
  };

  await db.runAsync(
    `INSERT INTO medios_espacios
      (id, espacioId, tipo, url, rutaLocal, nombre, creadoEn)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      medio.id,
      medio.espacioId,
      medio.tipo,
      medio.url,
      medio.rutaLocal,
      medio.nombre,
      medio.creadoEn,
    ]
  );

  const rutaLocal = await cachearMedio(medio);

  if (rutaLocal) {
    medio.rutaLocal = rutaLocal;
    await db.runAsync(
      "UPDATE medios_espacios SET rutaLocal = ? WHERE id = ?;",
      [rutaLocal, medio.id]
    );
  }

  return medio;
}

export async function eliminarMedioEspacio(
  medio: MedioEspacio
): Promise<void> {
  const db = await prepararTabla();

  await db.runAsync("DELETE FROM medios_espacios WHERE id = ?;", [medio.id]);

  try {
    if (medio.rutaLocal) {
      const archivo = new File(medio.rutaLocal);
      if (archivo.exists) archivo.delete();
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudo borrar el archivo local del espacio:", error);
    }
  }
}

/**
 * Agrega al espacio las fotos y el video subidos desde Gestión de espacios.
 * Se prioriza la copia local para poder mostrarlos sin conexión.
 */
export async function aplicarMediosEspacios(
  espacios: Espacio[]
): Promise<Espacio[]> {
  if (espacios.length === 0) return espacios;

  let mediosPorEspacio: Record<string, MedioEspacio[]>;

  try {
    mediosPorEspacio = await listarMediosPorEspacio();
  } catch (error) {
    if (__DEV__) {
      console.warn("No se pudieron leer los medios guardados:", error);
    }

    return espacios;
  }

  return espacios.map((espacio) => {
    const medios = mediosPorEspacio[espacio.id];

    if (!medios || medios.length === 0) return espacio;

    const imagenesPropias = medios
      .filter((medio) => medio.tipo === "imagen")
      .map((medio) => rutaLocalDisponible(medio) ?? medio.url);

    const videoPropio = medios.find((medio) => medio.tipo === "video");
    const videoUrl = videoPropio
      ? rutaLocalDisponible(videoPropio) ?? videoPropio.url
      : espacio.videoUrl;

    return {
      ...espacio,
      imagenes: [...new Set([...imagenesPropias, ...espacio.imagenes])],
      videoUrl,
    };
  });
}
