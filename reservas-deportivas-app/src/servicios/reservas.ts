import type { Reserva } from "@/tipos/reserva";
import type { SolicitudReserva, Turno } from "@/tipos/turno";
import { reservasEjemplo } from "@/mocks/reservas";
import {
  reservasMock,
  reservasFijasMock,
  diasBloqueadosMock,
} from "@/mocks/disponibilidad";
import { espaciosMock } from "@/mocks/espacios";
import { sesionMock } from "@/mocks/sesionUsuario"; 


// --- FUNCIONES AUXILIARES DE SOPORTE ---

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

// --- 1. CREAR RESERVA ---

export const crearReserva = (solicitud: SolicitudReserva): Reserva => {
  // 1. Validar sesión iniciada
  if (!sesionMock) {
    throw new Error("Debés iniciar sesión para reservar.");
  }

  // 2. Buscar el espacio solicitado
  const espacio = espaciosMock.find((item) => item.id === solicitud.espacioId);
  if (!espacio || !espacio.activo) {
    throw new Error("El espacio no existe o no está disponible.");
  }

  // 3. Validar cantidad de personas vs capacidad
  if (
    !Number.isInteger(solicitud.cantidadPersonas) ||
    solicitud.cantidadPersonas < 1 ||
    solicitud.cantidadPersonas > espacio.capacidad
  ) {
    throw new Error(
      `La cantidad de personas debe estar entre 1 y ${espacio.capacidad}.`
    );
  }

  // 4. Validar horario y duración
  const duracion = calcularDuracion(solicitud.inicio, solicitud.fin);
  if (!Number.isFinite(duracion) || duracion <= 0) {
    throw new Error("El horario seleccionado no es válido.");
  }

  // 5. Validar que el día no esté bloqueado (mantenimiento/lluvia)
  const diaBloqueado = diasBloqueadosMock.some(
    (dia) =>
      dia.espacioId === solicitud.espacioId && dia.fecha === solicitud.fecha
  );
  if (diaBloqueado) {
    throw new Error("El espacio está bloqueado para esa fecha.");
  }

  // 6. Validar superposición con turnos ocupados
  const turnoOcupado = reservasMock.some(
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
  if (turnoOcupado) {
    throw new Error("El horario seleccionado ya está ocupado.");
  }

  // 7. Validar reservas fijas institucionales
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

  // 8. Validar máximo de 3 reservas activas por usuario
  if (
    reservasEjemplo.filter(
      (reserva) =>
        reserva.usuarioId === sesionMock!.id && reserva.estado === "confirmada"
    ).length >= 3
  ) {
    throw new Error("No podés tener más de 3 reservas activas.");
  }
  // 9. Calcular precio total de forma segura
  const precioPorHora = espacio.precioPorHora;
  const precioTotal = precioPorHora * duracion;

  // 10. Construir el objeto de la nueva reserva
  const nuevaReserva: Reserva = {
    id: generarId(),
    usuarioId: sesionMock!.id,
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

  // 11. Guardar en el arreglo de reservas
  reservasEjemplo.push(nuevaReserva);

  // 12. Registrar el turno como ocupado en la disponibilidad
  const nuevoTurno: Turno = {
    id: `turno-${nuevaReserva.id}`,
    espacioId: espacio.id,
    fecha: solicitud.fecha,
    inicio: solicitud.inicio,
    fin: solicitud.fin,
    estado: "reservado",
    reservaId: nuevaReserva.id,
    motivoBloqueo: null,
    precio: precioTotal,
  };
  reservasMock.push(nuevoTurno);

  return nuevaReserva;
};

// --- 2. CANCELAR RESERVA ---

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