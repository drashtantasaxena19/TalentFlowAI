import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();

    const role = user?.role;

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const getDashboardLink = () => {
        if (role === "candidate") return "/candidate/dashboard";
        if (role === "employer") return "/employer/dashboard";
        if (role === "admin") return "/admin/dashboard";
        return "/";
    };

    return (
        <nav className="w-full fixed top-0 left-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <Link
                    to={isAuthenticated ? getDashboardLink() : "/"}
                    className="flex items-center gap-2 shrink-0"
                >
                    <img
                        src="/assets/brand/favicon.png"
                        alt="TalentFlow AI"
                        className="w-12 h-12 object-contain"
                    />

                    <span className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">
                        TalentFlow <span className="text-cyan-400">AI</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-6 text-slate-300 font-medium">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/" className="hover:text-cyan-400 transition">
                                Home
                            </Link>

                            <Link to="/login" className="hover:text-cyan-400 transition">
                                Login
                            </Link>

                            <Link
                                to="/signup"
                                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to={getDashboardLink()}
                                className="hover:text-cyan-400 transition"
                            >
                                Dashboard
                            </Link>

                            <span className="text-slate-400 max-w-40 truncate">
                                {user?.name || user?.email || "User"}
                            </span>

                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>

                <button className="md:hidden text-white text-3xl leading-none">
                    ☰
                </button>
            </div>
        </nav>
    );
}