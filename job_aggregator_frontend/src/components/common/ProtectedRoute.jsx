import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { loading, isAuthenticated, role } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="h-10 w-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-300">Checking secure access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (role === "employer") return <Navigate to="/employer/dashboard" replace />;
        return <Navigate to="/candidate/dashboard" replace />;
    }

    return children;
}