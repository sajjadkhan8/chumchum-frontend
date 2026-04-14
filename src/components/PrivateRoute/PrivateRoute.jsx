import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../../api/session';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const user = getStoredUser();
  const { pathname } = useLocation();

  if (!user) {
    return <Navigate to='/login' state={{ from: pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallbackPath = user.role === 'CREATOR'
      ? '/creator/dashboard'
      : user.role === 'ADMIN'
        ? '/admin/dashboard'
        : '/brand/dashboard';

    return <Navigate to={fallbackPath} replace />;
  }

  return children;

}

export default PrivateRoute