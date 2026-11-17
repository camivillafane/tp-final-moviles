import type { Reserva } from "@/tipos/reserva";
import type { Espacio } from "@/tipos/espacio";
import type { SolicitudReserva, Turno } from "@/tipos/turno";
import {
  reservasMock,
  reservasFijasMock,
  diasBloqueadosMock,
} from "@/mocks/disponibilidad";
import { espaciosMock } from "@/mocks/espacios";
import { USAR_MOCKS } from "@/servicios/config";
import { getLista, getUno, post } from "@/servicios/cliente";
import { ErrorServicio } from "@/servicios/errores";
import {
  contarReservasActivasLocales,
  guardarReservaLocal,
  obtenerReservasLocales,
  obtenerReservaLocal,
  obtenerTodasLasReservasLocales,
  cancelarReservaLocal,
} from "@/servicios/dbServicios";

interface ReservaApi {
  id: string;
  turnoId: string;
  espacioId: string;
  usuarioId: string;
  cantidadPersonas: number;
  codigoQr: string;
  estado: Reserva["estado"];
  ingresoEn: string | null;
  creadaEn: string;
  cancelableHasta: string;
  // Datos locales opcionales, presentes solo si alguna versión de la API los envía.
  fecha?: string;
  inicio?: string;
  fin?: string;
  precioPorHora?: number;
}

type ContextoReserva = Pick<Reserva, "usuarioId"> &
  Partial<
    Pick<
      Reserva,
      | "espacioId"
      | "fecha"
      | "inicio"
      | "fin"
      | "cantidadPersonas"
      | "precioPorHora"
    >
  > & { turnoId?: string };

function datosTurnoDesdeId(turnoId: string): {
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
} | null {
  const partes = /^tur-(esp-[A-Za-z0-9_-]+)-(\d{4})(\d{2})(\d{2})-(\d{2})$/.exec(turnoId);
  if (!partes) return null;

  const [, espacioId, anio, mes, dia, hora] = partes;
  const horaFin = Number(hora) + 1;
  return {
    espacioId,
    fecha: `${anio}-${mes}-${dia}`,
    inicio: `${hora}:00`,
    fin: `${String(horaFin).padStart(2, "0")}:00`,
  };
}

function normalizarReservaApi(
  datos: ReservaApi,
  contexto: ContextoReserva,
  anterior?: Reserva
): Reserva {
  const turno = datosTurnoDesdeId(datos.turnoId);
  const espacioId = datos.espacioId || contexto.espacioId || turno?.espacioId || "";
  const fecha = datos.fecha ?? contexto.fecha ?? turno?.fecha ?? "";
  const inicio = datos.inicio ?? contexto.inicio ?? turno?.inicio ?? "";
  const fin = datos.fin ?? contexto.fin ?? turno?.fin ?? "";
  const precioPorHora =
    datos.precioPorHora ?? contexto.precioPorHora ?? anterior?.precioPorHora ?? 0;
  const duracionHoras = calcularDuracion(
    inicio || "00:00",
    fin || "00:00"
  );

  return {
    id: datos.id,
    usuarioId: datos.usuarioId || contexto.usuarioId,
    espacioId,
    fecha,
    inicio,
    fin,
    cantidadPersonas: datos.cantidadPersonas ?? contexto.cantidadPersonas ?? 1,
    precioPorHora,
    precioTotal:
      anterior?.precioTotal && anterior.precioTotal > 0
        ? anterior.precioTotal
        : precioPorHora * duracionHoras,
    estado: datos.estado,
    qrToken: datos.codigoQr,
    creadaEn: datos.creadaEn || anterior?.creadaEn || new Date().toISOString(),
    canceladaEn:
      datos.estado === "cancelada"
        ? anterior?.canceladaEn ?? new Date().toISOString()
        : null,
  };
}



const generarId = (): string => {
  return `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
};

const generarQrToken = (): string => {
  return `qr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const horariosSeSuperponen = (
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean => {
  return inicioA < finB && finA > inicioB;
};

const calcularDuracion = (inicio: string, fin: string): number => {
  const [horaInicio, minutosInicio] = inicio.split(":").map(Number);
  const [horaFin, minutosFin] = fin.split(":").map(Number);

  const minutosTotalesInicio = horaInicio * 60 + minutosInicio;
  const minutosTotalesFin = horaFin * 60 + minutosFin;

  return (minutosTotalesFin - minutosTotalesInicio) / 60;
};


export const crearReserva = async (
  solicitud: SolicitudReserva,
  usuarioId: string
): Promise<Reserva> => {


  if (!usuarioId) {
    throw new Error("Debés iniciar sesión para reservar.");
  }

  if (!USAR_MOCKS) {
    if (!solicitud.turnoId) {
      throw new Error("No se identificó el turno seleccionado.");
    }
    if (!Number.isInteger(solicitud.cantidadPersonas) || solicitud.cantidadPersonas < 1) {
      throw new Error("La cantidad de personas no es válida.");
    }

    const respuesta = await post<ReservaApi>("/reservas", {
      turnoId: solicitud.turnoId,
      cantidadPersonas: solicitud.cantidadPersonas,
    });
    return normalizarReservaApi(respuesta, {
      usuarioId,
      turnoId: solicitud.turnoId,
      espacioId: solicitud.espacioId,
      fecha: solicitud.fecha,
      inicio: solicitud.inicio,
      fin: solicitud.fin,
      cantidadPersonas: solicitud.cantidadPersonas,
      precioPorHora: solicitud.precio,
    });
  }


  const espacio = espaciosMock.find((item) => item.id === solicitud.espacioId);
  if (!espacio || !espacio.activo) {
    throw new Error("El espacio no existe o no está disponible.");
  }


  if (
    !Number.isInteger(solicitud.cantidadPersonas) ||
    solicitud.cantidadPersonas < 1 ||
    solicitud.cantidadPersonas > espacio.capacidad
  ) {
    throw new Error(
      `La cantidad de personas debe estar entre 1 y ${espacio.capacidad}.`
    );
  }


  const duracion = calcularDuracion(solicitud.inicio, solicitud.fin);
  if (!Number.isFinite(duracion) || duracion <= 0) {
    throw new Error("El horario seleccionado no es válido.");
  }


  const diaBloqueado = diasBloqueadosMock.some(
    (dia) =>
      dia.espacioId === solicitud.espacioId && dia.fecha === solicitud.fecha
  );
  if (diaBloqueado) {
    throw new Error("El espacio está bloqueado para esa fecha.");
  }


  const reservasLocales = await obtenerTodasLasReservasLocales();
  const reservasLocalesPorId = new Map(
    reservasLocales.map((reserva) => [reserva.id, reserva])
  );

  const turnoMockOcupado = reservasMock.some(
    (turno) =>
      turno.espacioId === solicitud.espacioId &&
      turno.fecha === solicitud.fecha &&
      turno.estado !== "libre" &&
      (!turno.reservaId ||
        reservasLocalesPorId.get(turno.reservaId)?.estado !== "cancelada") &&
      horariosSeSuperponen(
        solicitud.inicio,
        solicitud.fin,
        turno.inicio,
        turno.fin
      )
  );

  const turnoLocalOcupado = reservasLocales.some(
    (reserva) =>
      reserva.estado === "confirmada" &&
      reserva.espacioId === solicitud.espacioId &&
      reserva.fecha === solicitud.fecha &&
      horariosSeSuperponen(
        solicitud.inicio,
        solicitud.fin,
        reserva.inicio,
        reserva.fin
      )
  );

  if (turnoMockOcupado || turnoLocalOcupado) {
    throw new Error("El horario seleccionado ya está ocupado.");
  }


  const fechaSeleccionada = new Date(`${solicitud.fecha}T12:00:00`);
  const diaSemana = fechaSeleccionada.getDay();

  const reservaFija = reservasFijasMock.some((fija) => {
    const dentroDeVigencia =
      solicitud.fecha >= fija.vigenteDesde &&
      (fija.vigenteHasta === null || solicitud.fecha <= fija.vigenteHasta);

    return (
      fija.espacioId === solicitud.espacioId &&
      fija.diaSemana === diaSemana &&
      dentroDeVigencia &&
      horariosSeSuperponen(
        solicitud.inicio,
        solicitud.fin,
        fija.inicio,
        fija.fin
      )
    );
  });
  if (reservaFija) {
    throw new Error("El horario coincide con una reserva fija.");
  }


  const cantidadReservasActivas =
  await contarReservasActivasLocales(usuarioId);

if (cantidadReservasActivas >= 3) {
  throw new Error("No podés tener más de 3 reservas activas.");
}


  if (!Number.isInteger(solicitud.precio) || solicitud.precio < 0) {
    throw new Error("El precio por hora no es válido.");
  }

  const precioPorHora = solicitud.precio;
  const precioTotal = precioPorHora * duracion;


  const nuevaReserva: Reserva = {
    id: generarId(),
    usuarioId,
    espacioId: espacio.id,
    fecha: solicitud.fecha,
    inicio: solicitud.inicio,
    fin: solicitud.fin,
    cantidadPersonas: solicitud.cantidadPersonas,
    precioPorHora,
    precioTotal,
    estado: "confirmada",
    qrToken: generarQrToken(),
    creadaEn: new Date().toISOString(),
    canceladaEn: null,
  };


  const nuevoTurno: Turno = {
    id: `turno-${nuevaReserva.id}`,
    espacioId: espacio.id,
    fecha: solicitud.fecha,
    inicio: solicitud.inicio,
    fin: solicitud.fin,
    estado: "reservado",
    reservaId: nuevaReserva.id,
    motivoBloqueo: null,
    precio: precioPorHora,
  };
  reservasMock.push(nuevoTurno);

  return nuevaReserva;
};


export async function listarMisReservas(usuarioId: string): Promise<Reserva[]> {
  if (!usuarioId) return [];
  if (USAR_MOCKS) return obtenerReservasLocales(usuarioId);

  try {
    const [proximas, pasadas] = await Promise.all([
      getLista<ReservaApi>("/yo/reservas", { cuando: "proximas", pagina: 1, porPagina: 100 }),
      getLista<ReservaApi>("/yo/reservas", { cuando: "pasadas", pagina: 1, porPagina: 100 }),
    ]);
    const reservasLocales = await obtenerReservasLocales(usuarioId);
    const reservasLocalesPorId = new Map(
      reservasLocales.map((reserva) => [reserva.id, reserva])
    );
    const reservas = await Promise.all(
      [...proximas.datos, ...pasadas.datos].map((reserva) =>
        normalizarReservaApi(reserva, {
          usuarioId: reserva.usuarioId || usuarioId,
          turnoId: reserva.turnoId,
          espacioId: reserva.espacioId ?? reservasLocalesPorId.get(reserva.id)?.espacioId,
          fecha: reserva.fecha ?? reservasLocalesPorId.get(reserva.id)?.fecha,
          inicio: reserva.inicio ?? reservasLocalesPorId.get(reserva.id)?.inicio,
          fin: reserva.fin ?? reservasLocalesPorId.get(reserva.id)?.fin,
          cantidadPersonas: reserva.cantidadPersonas,
          precioPorHora: reserva.precioPorHora ?? reservasLocalesPorId.get(reserva.id)?.precioPorHora,
        }, reservasLocalesPorId.get(reserva.id))
      )
    );
    await Promise.all(reservas.map((reserva) => guardarReservaLocal(reserva)));

    const idsDevueltosPorApi = new Set(reservas.map((reserva) => reserva.id));
    const confirmadasLocalesPendientes = reservasLocales.filter(
      (reserva) =>
        reserva.estado === "confirmada" && !idsDevueltosPorApi.has(reserva.id)
    );

    return [...reservas, ...confirmadasLocalesPendientes];
  } catch (error) {
    if (error instanceof ErrorServicio && error.codigo === "ERROR_RED") {
      return obtenerReservasLocales(usuarioId);
    }
    throw error;
  }
}

export async function obtenerDetalleReserva(
  reservaId: string,
  usuarioId: string
): Promise<Reserva | null> {
  if (USAR_MOCKS) return obtenerReservaLocal(reservaId, usuarioId);

  try {
    const reservaAnterior = await obtenerReservaLocal(reservaId, usuarioId);
    const datos = await getUno<ReservaApi>(`/reservas/${encodeURIComponent(reservaId)}`);
    const precioEspacio =
      reservaAnterior?.precioPorHora && reservaAnterior.precioPorHora > 0
        ? reservaAnterior.precioPorHora
        : (await getUno<Espacio>(`/espacios/${datos.espacioId}`).catch(() => null))
            ?.precioPorHora;
    const reserva = await normalizarReservaApi(datos, {
      usuarioId,
      turnoId: datos.turnoId,
      espacioId: reservaAnterior?.espacioId ?? datos.espacioId,
      fecha: reservaAnterior?.fecha || datos.fecha,
      inicio: reservaAnterior?.inicio || datos.inicio,
      fin: reservaAnterior?.fin || datos.fin,
      cantidadPersonas: datos.cantidadPersonas,
      precioPorHora: datos.precioPorHora ?? precioEspacio,
    }, reservaAnterior ?? undefined);
    await guardarReservaLocal(reserva);
    return reserva;
  } catch (error) {
    if (error instanceof ErrorServicio && error.codigo === "ERROR_RED") {
      return obtenerReservaLocal(reservaId, usuarioId);
    }
    throw error;
  }
}

export async function cancelarReserva(
  reservaId: string,
  usuarioId: string
): Promise<Reserva> {
  if (!USAR_MOCKS) {
    const reservaAnterior = await obtenerReservaLocal(reservaId, usuarioId).catch(() => null);
    const datos = await post<ReservaApi>(
      `/reservas/${encodeURIComponent(reservaId)}/cancelacion`
    );
    const reserva = await normalizarReservaApi(
      datos,
      {
        usuarioId,
        turnoId: datos.turnoId,
        espacioId: reservaAnterior?.espacioId ?? datos.espacioId,
        fecha: reservaAnterior?.fecha ?? datos.fecha,
        inicio: reservaAnterior?.inicio ?? datos.inicio,
        fin: reservaAnterior?.fin ?? datos.fin,
        cantidadPersonas: reservaAnterior?.cantidadPersonas ?? datos.cantidadPersonas,
        precioPorHora: reservaAnterior?.precioPorHora ?? datos.precioPorHora,
      },
      reservaAnterior ?? undefined
    );
    await guardarReservaLocal(reserva);
    return reserva;
  }

  await cancelarReservaLocal(reservaId, usuarioId);
  const reserva = await obtenerReservaLocal(reservaId, usuarioId);
  if (!reserva) throw new Error("No se encontró la reserva especificada.");
  return reserva;
};
