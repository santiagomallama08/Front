// src/Api/auth.js
import axios from 'axios';

// ✅ Solo cambié esto:
const API_URL = `${import.meta.env.VITE_API_URL}/auth`; 

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || "Error al iniciar sesión";
  }
};

export const register = async (nombre_completo, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, {
      nombre_completo,
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.detail || "Error al registrar";
  }
};
