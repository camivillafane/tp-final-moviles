import type { Espacio } from "@/tipos/espacio";
import type { Turno } from "@/tipos/turno";
import { obtenerTodasLasReservasLocales } from "./dbServicios";
import { obtenerIdEspacioApi } from "./mapeoEspacios";
import { getLista } from "./cliente";

export interface ReservaAgenda {
  id: string;
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  estado: "confirmada" | "cancelada" | "cumplida" | "ausente";
  origen?: "api" | "local";
}

export interface DatosAgenda {
  turnos: Turno[];
  reservas: ReservaAgenda[];
  espacios: Espacio[];
}

async function listarTodasLasPaginas<T>(
  ruta: string,
  filtros: Record<string, unknown>,
  porPagina = 100
): Promise<T[]> {
  const primera = await getLista<T>(ruta, {
    ...filtros,
    pagina: 1,
    porPagina,
  });
  const cantidadPaginas = Math.ceil(primera.meta.total / porPagina);

  if (cantidadPaginas <= 1) return primera.datos;

  const siguientes = await Promise.all(
    Array.from({ length: cantidadPaginas - 1 }, (_, indice) =>
      getLista<T>(ruta, {
        ...filtros,
        pagina: indice + 2,
        porPagina,
      })
    )
  );

  return primera.datos.concat(...siguientes.map((pagina) => pagina.datos));
}

export async function obtenerAgenda(fecha: string): Promise<DatosAgenda> {
  const [turnos, reservasApi, espacios, reservasLocales] = await Promise.all([
    listarTodasLasPaginas<Turno>("/agenda", { fecha }, 500),
    listarTodasLasPaginas<ReservaAgenda>("/reservas", { fecha }),
    listarTodasLasPaginas<Espacio>("/espacios", {}),
    obtenerTodasLasReservasLocales(),
  ]);

  const reservas: ReservaAgenda[] = reservasApi.map((reserva) => ({
    ...reserva,
    origen: "api",
  }));
  const turnosCombinados = [...turnos];

  for (const reservaLocal of reservasLocales) {
    if (reservaLocal.fecha !== fecha || reservaLocal.estado !== "confirmada") continue;

    const espacioId = obtenerIdEspacioApi(reservaLocal.espacioId);
    if (!espacioId) continue;
    const indiceTurno = turnosCombinados.findIndex(
      (turno) =>
        turno.espacioId === espacioId &&
        turno.fecha === fecha &&
        turno.inicio === reservaLocal.inicio &&
        turno.fin === reservaLocal.fin
    );

    if (indiceTurno === -1) continue;

    const turno = turnosCombinados[indiceTurno];
    turnosCombinados[indiceTurno] = {
      ...turno,
      estado: "reservado",
      reservaId: reservaLocal.id,
      motivoBloqueo: null,
    };
    reservas.push({
      id: reservaLocal.id,
      turnoId: turno.id,
      espacioId,
      usuarioId: reservaLocal.usuarioId,
      cantidadPersonas: reservaLocal.cantidadPersonas,
      estado: "confirmada",
      origen: "local",
    });
  }

  return { turnos: turnosCombinados, reservas, espacios };
}
