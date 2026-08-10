import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { getToken, getUser } from '../utils/auth';

function ProtectedRoute({ children, roles = [] }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    if (user.role === 'hotel_owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
