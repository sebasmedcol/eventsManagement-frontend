import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { usePlan } from '../context/planContext';
import PlanBlockModal from './plan/PlanBlockModal';

const hasPerm = (user, requiredPermission) => {
  if (!requiredPermission) return true;
  if (!user) return false;
  if (user.isOwnerSuperAdmin === true) return true;
  if (user.isEmpresaSuperAdmin !== true) {
    if (user.rol === 'superadmin' || user.rol === 'admin' || user.esAdminPrincipal) return true;
  }
  const { modulo, accion } = requiredPermission;
  if (user.rol_id && user.rol_id.activo && user.rol_id.permisos) {
    if (user.rol_id.permisos?.[modulo]?.[accion] === true) return true;
  }
  return user?.permisos?.[modulo]?.[accion] === true;
};

const RUTAS_PERMITIDAS_SIN_PLAN = ['/planes', '/suscripcion', '/checkout', '/pago/exito', '/pago/error', '/empresa-pendiente'];

const Spinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useContext(AuthContext);
  const { loading: planLoading, showBlockModal, dismissBlockModal } = usePlan();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasPerm(user, requiredPermission)) return <Navigate to="/dashboard" replace />;

  const rutaPermitida = RUTAS_PERMITIDAS_SIN_PLAN.some((r) => location.pathname.startsWith(r));
  if (!rutaPermitida && planLoading) return <Spinner />;

  // La modal se controla íntegramente desde PlanContext: aparece al iniciar
  // sesión si el plan ya estaba vencido, y cada vez que una petición de
  // gestión (POST/PUT/PATCH/DELETE) recibe 403. NO se reabre por navegar
  // entre módulos, y nunca se muestra en rutas exentas (planes, checkout...).
  return (
    <>
      {children}
      {!rutaPermitida && showBlockModal && <PlanBlockModal onClose={dismissBlockModal} />}
    </>
  );
};

export default ProtectedRoute;