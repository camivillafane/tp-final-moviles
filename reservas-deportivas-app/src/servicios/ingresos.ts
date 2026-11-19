
import { abrirBaseDeDatos } from "@/servicios/dbServicios";
import { post } from "@/servicios/cliente";
import type { Reserva } from "@/tipos/reserva";

export async function registrarAusenciaRemota(reservaId: string): Promise<void> {
    await post<unknown>(`/reservas/${encodeURIComponent(reservaId)}/ausente`);
}

type BaseDeDatos = Awaited<ReturnType<typeof abrirBaseDeDatos>>;

async function asegurarTablasAsistencia(db: BaseDeDatos): Promise<void> {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ingresos_locales (
            reservaId TEXT PRIMARY KEY NOT NULL,
            usuarioId TEXT NOT NULL,
            espacioId TEXT NOT NULL,
            encargadoId TEXT NOT NULL,
            fechaIngreso TEXT NOT NULL
        );
    `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS asistencias_locales (
            reservaId TEXT PRIMARY KEY NOT NULL,
            usuarioId TEXT NOT NULL,
            espacioId TEXT NOT NULL,
            encargadoId TEXT NOT NULL,
            estado TEXT NOT NULL,
            fechaRegistro TEXT NOT NULL
        );
    `);
}

export async function registrarIngreso(
    reserva: Reserva,
    encargadoId: string
): Promise<boolean> {
    const db = await abrirBaseDeDatos();
    await asegurarTablasAsistencia(db);

    const ingresoExistente = await db.getFirstAsync<{ reservaId: string }>(
        "SELECT reservaId FROM ingresos_locales WHERE reservaId = ?;",
        [reserva.id]
    );

    const asistenciaExistente = await db.getFirstAsync<{ reservaId: string }>(
        "SELECT reservaId FROM asistencias_locales WHERE reservaId = ?;",
        [reserva.id]
    );

    if (ingresoExistente || asistenciaExistente) {
        return false;
    }

    const fechaRegistro = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO ingresos_locales
        (reservaId, usuarioId, espacioId, encargadoId, fechaIngreso)
        VALUES (?, ?, ?, ?, ?);`,
        [
            reserva.id,
            reserva.usuarioId,
            reserva.espacioId,
            encargadoId,
            fechaRegistro,
        ]
    );

    await db.runAsync(
        `INSERT INTO asistencias_locales
        (reservaId, usuarioId, espacioId, encargadoId, estado, fechaRegistro)
        VALUES (?, ?, ?, ?, ?, ?);`,
        [
            reserva.id,
            reserva.usuarioId,
            reserva.espacioId,
            encargadoId,
            "PRESENTE",
            fechaRegistro,
        ]
    );

    return true;
}

export async function registrarAusencia(
    reserva: Reserva,
    encargadoId: string
): Promise<boolean> {
    const db = await abrirBaseDeDatos();
    await asegurarTablasAsistencia(db);

    const ingresoExistente = await db.getFirstAsync<{ reservaId: string }>(
        "SELECT reservaId FROM ingresos_locales WHERE reservaId = ?;",
        [reserva.id]
    );

    const asistenciaExistente = await db.getFirstAsync<{ reservaId: string }>(
        "SELECT reservaId FROM asistencias_locales WHERE reservaId = ?;",
        [reserva.id]
    );

    if (ingresoExistente || asistenciaExistente) {
        return false;
    }

    await db.runAsync(
        `INSERT INTO asistencias_locales
        (reservaId, usuarioId, espacioId, encargadoId, estado, fechaRegistro)
        VALUES (?, ?, ?, ?, ?, ?);`,
        [
            reserva.id,
            reserva.usuarioId,
            reserva.espacioId,
            encargadoId,
            "AUSENTE",
            new Date().toISOString(),
        ]
    );

    return true;
}
export async function obtenerAsistenciasLocales(): Promise<
    { reservaId: string; estado: string }[]
> {
    const db = await abrirBaseDeDatos();
    await asegurarTablasAsistencia(db);

    return await db.getAllAsync<{ reservaId: string; estado: string }>(
        `SELECT reservaId, estado FROM asistencias_locales;`
    );
}
