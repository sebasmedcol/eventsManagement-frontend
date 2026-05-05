import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // ✅ usar instancia de axios configurada

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Verificar si hay un token almacenado al cargar la aplicación
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          const response = await api.get('/auth/me');
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setError('Sesión expirada. Por favor inicie sesión nuevamente.');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, [navigate]);

  const login = async (nombreUsuario, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { nombreUsuario, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      const me = await api.get('/auth/me');
      setUser(me.data);
      setIsAuthenticated(true);

      navigate('/dashboard');
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', payload);
      const { token, usuario, empresa } = response.data;

      const userData = {
        ...usuario,
        empresa,
      };

      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);

      if (
        empresa &&
        (empresa.estadoAprobacion === 'pendiente' || empresa.estado === false)
      ) {
        navigate('/empresa-pendiente');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la empresa');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
