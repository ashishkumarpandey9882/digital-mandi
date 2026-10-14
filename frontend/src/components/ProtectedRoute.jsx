import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, isLoggedIn } = useAuth();

  // User logged in nahi hai
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Role required hai aur user ka role match nahi karta
  if (role && user?.role !== role) {
    if (user?.role === "farmer") {
      return <Navigate to="/farmer-dashboard" replace />;
    }

    if (user?.role === "buyer") {
      return <Navigate to="/buyer-dashboard" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;