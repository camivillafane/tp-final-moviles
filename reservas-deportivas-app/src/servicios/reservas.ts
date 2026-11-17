import type { Reserva } from "@/tipos/reserva";
import type { SolicitudReserva } from "@/tipos/turno";
import { reservasEjemplo } from "@/mocks/reservas";
import {
  reservasMock,
  reservasFijasMock,
  diasBloqueadosMock,
} from "@/mocks/disponibilidad";
import { espaciosMock } from "@/mocks/espacios";
import {
  contarReservasActivasLocales,
  obtenerTodasLasReservasLocales,
} from "@/servicios/dbServicios";



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

  const turnoMockOcupado = reservasMock.some(
    (turno) =>
      turno.espacioId === solicitud.espacioId &&
      turno.fecha === solicitud.fecha &&
      turno.estado !== "libre" &&
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


  const precioPorHora = espacio.precioPorHora;
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


  reservasEjemplo.push(nuevaReserva);


  return nuevaReserva;
};


export const cancelarReserva = (reservaId: string): Reserva => {
  const reserva = reservasEjemplo.find((item) => item.id === reservaId);

  if (!reserva) {
    throw new Error("No se encontró la reserva especificada.");
  }

  if (reserva.estado === "cancelada") {
    throw new Error("La reserva ya se encuentra cancelada.");
  }

  reserva.estado = "cancelada";
  reserva.canceladaEn = new Date().toISOString();

  const turnoIndex = reservasMock.findIndex(
    (turno) => turno.reservaId === reservaId
  );

  if (turnoIndex !== -1) {
    reservasMock[turnoIndex].estado = "libre";
    reservasMock[turnoIndex].reservaId = null;
  }

  return reserva;
};
