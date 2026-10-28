import bcrypt from 'bcryptjs';
import * as userModel from '../models/userModel.js';
import { Usuario } from '../models/Usuario.js';

export async function register({ nombre, username, contraseña }) {
  if (!nombre || !username || !contraseña) {
    const error = new Error('Todos los campos (nombre, username, contraseña) son obligatorios');
    error.name = 'ValidationError';
    throw error;
  }

  if (userModel.findByUsername(username)) {
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

  userModel.save(nuevoUsuario);

  return nuevoUsuario.toPublicJSON();
}

export async function login({ username, contraseña }) {
  if (!username || !contraseña) {
    const error = new Error('Credenciales incompletas');
    error.name = 'ValidationError';
    throw error;
  }

  const user = userModel.findByUsername(username);
  const isValidPassword = user && (await user.verificarContraseña(contraseña));
  
  if (!isValidPassword) {
    const error = new Error('Usuario o contraseña incorrectos');
    error.name = 'AuthenticationError';
    throw error;
  }

  return user.toPublicJSON();
}