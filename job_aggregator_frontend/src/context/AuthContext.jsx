import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
    loginUser,
    signupUser,
    getCurrentUser,
    logoutUser,
} from "../services/authApi";

const AuthContext = createContext(null);

const publicRoutes = ["/", "/login", "/signup"];

export function AuthProvider({ children }) {
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [role, setRole] = useState("");
    const [loading, setLoading] = useState(true);

    const setAuthUser = (authUser) => {
        setUser(authUser || null);
        setRole(authUser?.role || "");
    };

    const checkAuth = async () => {
        try {
            const response = await getCurrentUser();
            setAuthUser(response.user);
        } catch {
            setAuthUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const response = await loginUser(credentials);
        setAuthUser(response.user);
        return response;
    };

    const signup = async (payload) => {
        const response = await signupUser(payload);
        setAuthUser(response.user);
        return response;
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            setAuthUser(null);
        }
    };

    useEffect(() => {
        const isPublicPage = publicRoutes.includes(location.pathname);

        if (isPublicPage) {
            setLoading(false);
            return;
        }

        checkAuth();
    }, [location.pathname]);

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                loading,
                isAuthenticated: Boolean(user),
                login,
                signup,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}