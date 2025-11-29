import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../Api/auth';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import registerAnimation from '../../Assets/lotties/register-animation.json';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordFocus, setPasswordFocus] = useState(false);

  const passwordValidations = {
    minLength: form.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(form.password),
    hasLowerCase: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    try {
      const response = await register(form.nombre_completo, form.email, form.password);
      setSuccess(response.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Error al registrar usuario");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-6xl mx-auto bg-[#1c1c1e]/80 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
    >
      {/* Ilustración animada */}
      <div className="md:w-1/2 flex items-center justify-center bg-gradient-to-br from-[#007AFF] via-[#C633FF] to-[#FF4D00] p-10">
        <Lottie animationData={registerAnimation} loop={true} className="w-72 h-auto" />
      </div>

      {/* Formulario */}
      <div className="md:w-1/2 p-10 flex flex-col justify-center text-white space-y-6">
        <h2 className="text-4xl font-bold text-center">Crear una cuenta</h2>

        {error && <div className="bg-red-500 text-white p-2 rounded text-sm text-center">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded text-sm text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#2c2c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#2c2c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Correo electrónico"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocus(true)}
              onBlur={() => setPasswordFocus(false)}
              required
              className="w-full px-4 py-3 rounded-lg bg-[#2c2c2e] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Contraseña"
            />

            {(passwordFocus || form.password.length > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2 text-xs"
              >
                <div className={`flex items-center gap-2 ${passwordValidations.minLength ? 'text-green-400' : 'text-gray-400'}`}>
                  <span>{passwordValidations.minLength ? '✓' : '○'}</span>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidations.hasUpperCase ? 'text-green-400' : 'text-gray-400'}`}>
                  <span>{passwordValidations.hasUpperCase ? '✓' : '○'}</span>
                  <span>Una letra mayúscula</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidations.hasLowerCase ? 'text-green-400' : 'text-gray-400'}`}>
                  <span>{passwordValidations.hasLowerCase ? '✓' : '○'}</span>
                  <span>Una letra minúscula</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidations.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                  <span>{passwordValidations.hasNumber ? '✓' : '○'}</span>
                  <span>Un número</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidations.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                  <span>{passwordValidations.hasSpecial ? '✓' : '○'}</span>
                  <span>Un carácter especial (!@#$%^&*...)</span>
                </div>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full text-white font-semibold
              bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00]
              shadow-lg hover:shadow-[0_0_20px_rgba(199,51,255,0.6)]
              hover:brightness-110 transition duration-300"
          >
            Registrarse
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center">
          ¿Ya tienes cuenta?{' '}
          <button onClick={() => navigate('/login')} className="text-blue-400 hover:underline">
            Inicia sesión
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default RegisterForm;
