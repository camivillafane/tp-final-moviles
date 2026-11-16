
import { abrirBaseDeDatos } from "@/servicios/dbServicios";
import type { Reserva } from "@/tipos/reserva";

export async function registrarIngreso(
    reserva: Reserva,
    encargadoId: string
): Promise<boolean> {
    console.log("1. Entró a registrarIngreso");
    const db = await abrirBaseDeDatos();
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ingresos_locales (
            reservaId TEXT PRIMARY KEY NOT NULL,
            usuarioId TEXT NOT NULL,
            espacioId TEXT NOT NULL,
            encargadoId TEXT NOT NULL,
            fechaIngreso TEXT NOT NULL
        );
    `);

    const existente = await db.getFirstAsync<{ reservaId: string }>(
        "SELECT reservaId FROM ingresos_locales WHERE reservaId = ?;",
        [reserva.id]
    );

    if (existente) {
        return false;
    }

    await db.runAsync(
        `INSERT INTO ingresos_locales
        (reservaId, usuarioId, espacioId, encargadoId, fechaIngreso)
        VALUES (?, ?, ?, ?, ?);`,
        [
            reserva.id,
            reserva.usuarioId,
            reserva.espacioId,
            encargadoId,
            new Date().toISOString(),
        ]
    );

    return true;
}
