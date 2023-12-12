import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const userInfo = localStorage.getItem('userInfo');
  const user = JSON.parse(userInfo);
  return user?.isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
