import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const hasPerm = (user, requiredPermission) => {
  if (!requiredPermission) return true;
  if (!user) return false;
  if (user.rol === 'superadmin' || user.rol === 'admin' || user.esAdminPrincipal) {
    return true;
  }
  const { modulo, accion } = requiredPermission;
  return user?.permisos?.[modulo]?.[accion] === true;
};

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPerm(user, requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Renderizar los componentes hijos si está autenticado
  return children;
};

export default ProtectedRoute;
