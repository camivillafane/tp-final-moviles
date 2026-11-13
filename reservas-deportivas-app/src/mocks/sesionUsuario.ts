import { Usuario } from "../tipos/usuario";

export const usuarioJugador: Usuario = {
    id: "usr-207",
    nombre: "Emiliano Ruiz",
    email: "emiliano@mail.com",
    telefono: "3455-401122",
    rol: "jugador",
    espaciosFavoritos: ["espacio-02"],
    cancelacionesTardias: 0,
    ausencias: 0,
};

export const usuarioEncargado: Usuario = {
    id: "usr-208",
    nombre: "Marcelo",
    email: "marcelo@gmail.com",
    telefono: "+54 9 11 8765-4321",
    rol: "encargado",
    espaciosFavoritos: [],
    cancelacionesTardias: 0,
    ausencias: 0,
};

export const sesionMock: Usuario | null = usuarioJugador;

//export const sesionMock: Usuario | null = {
  //id: "usr-105",
  //nombre: "Usuario de prueba",
  //email: "prueba@mail.com",
  //telefono: "3455-000000",
  //rol: "jugador",
  //espaciosFavoritos: [],
  //cancelacionesTardias: 0,
  //ausencias: 0,
//};