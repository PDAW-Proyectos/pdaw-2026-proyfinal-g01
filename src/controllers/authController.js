import * as authService from '../services/authServices.js';

export async function register(req, res) {
  try {
    const { nombre, username, contraseña } = req.body;
    const usuarioPublico = await authService.register({ nombre, username, contraseña });
    return res.status(201).json(usuarioPublico);
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'BusinessRuleError') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function login(req, res) {
  try {
    const { username, contraseña } = req.body;
    const usuarioPublico = await authService.login({ username, contraseña });
    return res.status(200).json({ message: 'Inicio de sesión exitoso', usuario: usuarioPublico });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.name === 'AuthenticationError') {
      return res.status(401).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function logout(req, res) {
  return res.status(200).json({ message: 'Cierre de sesión exitoso' });
}