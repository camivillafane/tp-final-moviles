import * as SQLite from "expo-sqlite";
import type { Reserva } from "@/tipos/reserva";

export const abrirBaseDeDatos = async () => {
  const db = await SQLite.openDatabaseAsync("reservas.db");
  return db;
};

export const inicializarBaseDeDatos = async () => {
  const db = await abrirBaseDeDatos();


  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS reservas_locales (
      id TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL,
      espacioId TEXT NOT NULL,
      fecha TEXT NOT NULL,
      inicio TEXT NOT NULL,
      fin TEXT NOT NULL,
      cantidadPersonas INTEGER NOT NULL,
      precioPorHora REAL NOT NULL,
      precioTotal REAL NOT NULL,
      estado TEXT NOT NULL,
      qrToken TEXT NOT NULL,
      creadaEn TEXT NOT NULL,
      canceladaEn TEXT
    );
  `);

  const columnasReserva = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(reservas_locales);"
  );
  if (!columnasReserva.some((columna) => columna.name === "cancelableHasta")) {
    await db.execAsync("ALTER TABLE reservas_locales ADD COLUMN cancelableHasta TEXT;");
  }


  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos_locales (
      espacioId TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL
    );
  `);

  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS favoritos_usuario_locales (
    usuarioId TEXT NOT NULL,
    espacioId TEXT NOT NULL,
    PRIMARY KEY (usuarioId, espacioId)
  );
`);

  await db.execAsync(`
  CREATE TABLE IF NOT EXISTS usuarios_locales (
    id TEXT PRIMARY KEY NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT NOT NULL,
    claveHash TEXT NOT NULL,
    salt TEXT NOT NULL,
    rol TEXT NOT NULL,
    espaciosFavoritos TEXT NOT NULL DEFAULT '[]',
    cancelacionesTardias INTEGER NOT NULL DEFAULT 0,
    ausencias INTEGER NOT NULL DEFAULT 0
  );
`);
};

export const obtenerFavoritosLocales = async (
  usuarioId: string
): Promise<string[]> => {
  const db = await abrirBaseDeDatos();

  const filas = await db.getAllAsync<{ espacioId: string }>(
    `SELECT espacioId
    FROM favoritos_usuario_locales
    WHERE usuarioId = ?;`,
    [usuarioId]
  );

  return filas.map((fila) => fila.espacioId);
};

export const guardarFavoritoLocal = async (
  usuarioId: string,
  espacioId: string
): Promise<void> => {
  const db = await abrirBaseDeDatos();

  await db.runAsync(
    `INSERT OR IGNORE INTO favoritos_usuario_locales (usuarioId, espacioId)
    VALUES (?, ?);`,
    [usuarioId, espacioId]
  );
};

export const eliminarFavoritoLocal = async (
  usuarioId: string,
  espacioId: string
): Promise<void> => {
  const db = await abrirBaseDeDatos();

  await db.runAsync(
    `DELETE FROM favoritos_usuario_locales
    WHERE usuarioId = ? AND espacioId = ?;`,
    [usuarioId, espacioId]
  );
};

export const guardarReservaLocal = async (reserva: Reserva): Promise<void> => {
  const db = await abrirBaseDeDatos();
  await db.runAsync(
    `INSERT OR REPLACE INTO reservas_locales (id, usuarioId, espacioId, fecha, inicio, fin, cantidadPersonas, precioPorHora, precioTotal, estado, qrToken, creadaEn, canceladaEn, cancelableHasta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      reserva.id,
      reserva.usuarioId,
      reserva.espacioId,
      reserva.fecha,
      reserva.inicio,
      reserva.fin,
      reserva.cantidadPersonas,
      reserva.precioPorHora,
      reserva.precioTotal,
      reserva.estado,
      reserva.qrToken,
      reserva.creadaEn,
      reserva.canceladaEn || null,
      reserva.cancelableHasta,
    ]
  );
};


export const obtenerReservasLocales = async (usuarioId: string): Promise<Reserva[]> => {
  const db = await abrirBaseDeDatos();
  const resultados = await db.getAllAsync<any>(
    `SELECT * FROM reservas_locales WHERE usuarioId = ? ORDER BY creadaEn DESC;`,
    [usuarioId]
  );


  return resultados.map((row) => ({
    id: row.id,
    usuarioId: row.usuarioId,
    espacioId: row.espacioId,
    fecha: row.fecha,
    inicio: row.inicio,
    fin: row.fin,
    cantidadPersonas: row.cantidadPersonas,
    precioPorHora: row.precioPorHora,
    precioTotal: row.precioTotal,
    estado: row.estado,
    qrToken: row.qrToken,
    creadaEn: row.creadaEn,
    canceladaEn: row.canceladaEn,
    cancelableHasta: row.cancelableHasta ?? null,
  }));
};

export const obtenerTodasLasReservasLocales = async (): Promise<Reserva[]> => {
  const db = await abrirBaseDeDatos();

  return await db.getAllAsync<Reserva>(
    `SELECT * FROM reservas_locales ORDER BY fecha DESC, inicio ASC;`
  );
};

export const obtenerReservaLocal = async (
  reservaId: string,
  usuarioId: string
): Promise<Reserva | null> => {
  const db = await abrirBaseDeDatos();

  const reserva = await db.getFirstAsync<Reserva>(
    `SELECT *
    FROM reservas_locales
    WHERE id = ? AND usuarioId = ?
    LIMIT 1;`,
    [reservaId, usuarioId]
  );

  return reserva ?? null;
};


export const contarReservasActivasLocales = async (
  usuarioId: string
): Promise<number> => {
  const db = await abrirBaseDeDatos();

  const resultado = await db.getFirstAsync<{ cantidad: number }>(
    `SELECT COUNT(*) AS cantidad
     FROM reservas_locales
     WHERE usuarioId = ? AND estado = 'confirmada';`,
    [usuarioId]
  );

  return resultado?.cantidad ?? 0;
};

export const cancelarReservaLocal = async (
  reservaId: string,
  usuarioId: string
): Promise<void> => {
  const db = await abrirBaseDeDatos();

  const reserva = await db.getFirstAsync<{ estado: string }>(
    `SELECT estado
    FROM reservas_locales
    WHERE id = ? AND usuarioId = ?;`,
    [reservaId, usuarioId]
  );

  if (!reserva) {
    throw new Error("No se encontró la reserva.");
  }

  if (reserva.estado !== "confirmada") {
    throw new Error("La reserva ya está cancelada.");
  }

  await db.runAsync(
    `UPDATE reservas_locales
    SET estado = ?, canceladaEn = ?
    WHERE id = ? AND usuarioId = ?;`,
    ["cancelada", new Date().toISOString(), reservaId, usuarioId]
  );
};

export const actualizarEstadoReservaLocal = async (reservaId: string, nuevoEstado: string): Promise<void> => {
  const db = await abrirBaseDeDatos();
  const canceladaEn = nuevoEstado === "cancelada" ? new Date().toISOString() : null;
  await db.runAsync(
    `UPDATE reservas_locales SET estado = ?, canceladaEn = ? WHERE id = ?;`,
    [nuevoEstado, canceladaEn, reservaId]
  );
};

export async function obtenerReservaPorQrToken(qrToken: string) {
  const db = await abrirBaseDeDatos();

  return await db.getFirstAsync<Reserva>(
    `SELECT * FROM reservas_locales
    WHERE qrToken = ? AND estado = 'confirmada';`, [qrToken]
  );
}
export async function obtenerNombreUsuario(usuarioId: string): Promise<string | null> {
  const db = await abrirBaseDeDatos();

  const usuario = await db.getFirstAsync<{ nombre: string }>(
    `SELECT nombre
    FROM usuarios_locales
    WHERE id = ?
    LIMIT 1;`,
    [usuarioId]
  );

  return usuario?.nombre ?? null;
}
