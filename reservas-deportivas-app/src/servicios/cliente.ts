import axios from "axios";

export const cliente = axios.create({
  baseURL: "https://api.villaguay.gob.ar",
  timeout: 10000,
});
