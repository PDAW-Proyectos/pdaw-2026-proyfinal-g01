//base datos de prueba
import { Usuario } from './Usuario.js';

const usuariosDB = [];

export function findByUsername(username) {
  const data = usuariosDB.find(u => u.username === username);
  if (!data) return null;
  return Usuario.fromJSON(data);
}

export function save(usuarioInstance) {
  const data = usuarioInstance.toJSON();
  
  const index = usuariosDB.findIndex(u => u.username === data.username);
  if (index >= 0) {
    usuariosDB[index] = data;
  } else {
    usuariosDB.push(data);
  }
  return usuarioInstance;
}