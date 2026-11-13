import * as SQLite from "expo-sqlite";
import type { Reserva } from "@/tipos/reserva";

// Abre (o crea) la base de datos SQLite de forma asíncrona
export const abrirBaseDeDatos = async () => {
  const db = await SQLite.openDatabaseAsync("reservas.db");
  return db;
};

// Inicializa las tablas necesarias para el módulo de reservas y favoritos
export const inicializarBaseDeDatos = async () => {
  const db = await abrirBaseDeDatos();

  // Tabla para almacenar las reservas del usuario localmente (offline)
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

  // Tabla para guardar los espacios favoritos del usuario localmente
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos_locales (
      espacioId TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL
    );
  `);
};

// 1. Guardar una nueva reserva en SQLite (para uso offline)
export const guardarReservaLocal = async (reserva: Reserva): Promise<void> => {
  const db = await abrirBaseDeDatos();
  await db.runAsync(
    `INSERT OR REPLACE INTO reservas_locales (id, usuarioId, espacioId, fecha, inicio, fin, cantidadPersonas, precioPorHora, precioTotal, estado, qrToken, creadaEn, canceladaEn) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
    ]
  );
};

// 2. Obtener todas las reservas de un usuario desde SQLite (offline)
export const obtenerReservasLocales = async (usuarioId: string): Promise<Reserva[]> => {
  const db = await abrirBaseDeDatos();
  const resultados = await db.getAllAsync<any>(
    `SELECT * FROM reservas_locales WHERE usuarioId = ? ORDER BY creadaEn DESC;`,
    [usuarioId]
  );

  // Mapeamos los resultados para asegurar el tipado correcto
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
  }));
};

// 3. Actualizar el estado de una reserva localmente (ej: cancelarla)
export const actualizarEstadoReservaLocal = async (reservaId: string, nuevoEstado: string): Promise<void> => {
  const db = await abrirBaseDeDatos();
  const canceladaEn = nuevoEstado === "cancelada" ? new Date().toISOString() : null;
  await db.runAsync(
    `UPDATE reservas_locales SET estado = ?, canceladaEn = ? WHERE id = ?;`,
    [nuevoEstado, canceladaEn, reservaId]
  );
};