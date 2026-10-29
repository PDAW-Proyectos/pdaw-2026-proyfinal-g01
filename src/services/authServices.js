import bcrypt from 'bcryptjs';
import * as userModel from '../repositories/userModel.js';
import { Usuario } from '../models/Usuario.js';

export async function register({ nombre, username, contraseña }) {
  if (!nombre || !username || !contraseña) {
    const error = new Error('Todos los campos (nombre, username, contraseña) son obligatorios');
    error.name = 'ValidationError';
    throw error;
  }

  const usuarioExistente = await userModel.findByUsername(username);
  if (usuarioExistente) {
    const error = new Error('El nombre de usuario ya está en uso');
    error.name = 'BusinessRuleError';
    throw error;
  }

  const passwordHash = await bcrypt.hash(contraseña, 10);

  const nuevoUsuario = new Usuario({
    nombre,
    username,
    contraseña: passwordHash,
    mazos: []
  });

  await userModel.guardar(nuevoUsuario);

  // Usamos toJSON() directamente
  return nuevoUsuario.toJSON();
}

export async function login({ username, contraseña }) {
  if (!username || !contraseña) {
    const error = new Error('Credenciales incompletas');
    error.name = 'ValidationError';
    throw error;
  }

  const user = await userModel.findByUsername(username);
  const isValidPassword = user && (await user.verificarContraseña(contraseña));
  
  if (!isValidPassword) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.name = 'AuthenticationError';
    throw error;
  }

  // Usamos toJSON() directamente
  return user.toJSON();
}