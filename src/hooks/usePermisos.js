import { useContext, useCallback } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * Hook para verificar permisos del usuario actual
 * @returns {Object} Funciones para verificar permisos
 */
const usePermisos = () => {
  const { user } = useContext(AuthContext);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param {string} modulo - El módulo a verificar (ej: 'clientes', 'productos')
   * @param {string} accion - La acción a verificar ('crear', 'ver', 'editar', 'eliminar')
   * @returns {boolean} - true si tiene permiso, false si no
   */
  const tienePermiso = useCallback((modulo, accion) => {
    if (!user) return false;
    
    // Superadmin y admin principal siempre tienen todos los permisos
    if (user.rol === 'superadmin' || user.esAdminPrincipal) {
      return true;
    }
    
    // Admin tiene todos los permisos de su empresa
    if (user.rol === 'admin') {
      return true;
    }
    
    // Verificar permisos desde rol_id (nuevo sistema de roles)
    if (user.rol_id && user.rol_id.activo && user.rol_id.permisos) {
      const permisosRol = user.rol_id.permisos;
      return permisosRol?.[modulo]?.[accion] === true;
    }
    
    // Fallback a permisos embebidos del usuario (legacy)
    return user?.permisos?.[modulo]?.[accion] === true;
  }, [user]);

  /**
   * Verifica si puede ver un módulo
   */
  const puedeVer = useCallback((modulo) => tienePermiso(modulo, 'ver'), [tienePermiso]);

  /**
   * Verifica si puede crear en un módulo
   */
  const puedeCrear = useCallback((modulo) => tienePermiso(modulo, 'crear'), [tienePermiso]);

  /**
   * Verifica si puede editar en un módulo
   */
  const puedeEditar = useCallback((modulo) => tienePermiso(modulo, 'editar'), [tienePermiso]);

  /**
   * Verifica si puede eliminar en un módulo
   */
  const puedeEliminar = useCallback((modulo) => tienePermiso(modulo, 'eliminar'), [tienePermiso]);

  return {
    tienePermiso,
    puedeVer,
    puedeCrear,
    puedeEditar,
    puedeEliminar,
  };
};

export default usePermisos;
