import { Navigate } from "react-router-dom";

const LOGIN_ROUTES = {
  admin: "/admin/login",
  customer: "/login",
  restaurant: "/restaurant/login",
  delivery: "/delivery/login",
};

const AuthRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    // Corrupted localStorage should not crash route rendering.
    localStorage.removeItem("user");
  }

  if (!token || !user) {
    return <Navigate to={LOGIN_ROUTES[role] || "/login"} replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthRoute;
