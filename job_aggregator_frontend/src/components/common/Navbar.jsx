import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Menu,
    X,
    LayoutDashboard,
    LogOut,
    LogIn,
    UserPlus,
    Home,
    Briefcase,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const role = user?.role;

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
        setMobileMenuOpen(false);
    };

    const getDashboardLink = () => {
        if (role === "candidate") return "/candidate/dashboard";
        if (role === "employer") return "/employer/dashboard";
        if (role === "admin") return "/admin/dashboard";
        return "/";
    };

    const roleTheme = {
        candidate: {
            glow: "from-cyan-500/20 to-blue-500/10",
            text: "text-cyan-400",
            button: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
            border: "border-cyan-500/20",
        },
        employer: {
            glow: "from-orange-500/20 to-amber-500/10",
            text: "text-orange-400",
            button: "bg-orange-500 hover:bg-orange-400 text-white",
            border: "border-orange-500/20",
        },
        admin: {
            glow: "from-purple-500/20 to-pink-500/10",
            text: "text-purple-400",
            button: "bg-purple-500 hover:bg-purple-400 text-white",
            border: "border-purple-500/20",
        },
        guest: {
            glow: "from-cyan-500/20 to-blue-500/10",
            text: "text-cyan-400",
            button: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
            border: "border-cyan-500/20",
        },
    };

    const currentTheme = roleTheme[role] || roleTheme.guest;

    return (
        <nav className={`fixed top-0 left-0 z-50 w-full border-b backdrop-blur-2xl bg-slate-950/80 ${currentTheme.border}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="h-16 md:h-20 flex items-center justify-between">
                    <Link to={isAuthenticated ? getDashboardLink() : "/"} className="flex items-center gap-3 group">
                        <div className={`relative rounded-2xl bg-gradient-to-br ${currentTheme.glow} p-1 transition-all duration-300 group-hover:scale-105`}>
                            <img src="/assets/brand/favicon.png" alt="TalentFlow AI" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                        </div>

                        <div className="leading-tight">
                            <h1 className="text-lg md:text-2xl font-black tracking-tight text-white">
                                TalentFlow <span className={currentTheme.text}>AI</span>
                            </h1>
                            <p className="hidden sm:block text-[10px] md:text-xs text-slate-400">
                                Smart Recruitment Platform
                            </p>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-5">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/" className="text-slate-300 hover:text-white transition">
                                    Home
                                </Link>

                                <Link to="/jobs" className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition">
                                    <Briefcase size={18} />
                                    Browse Jobs
                                </Link>

                                <Link to="/login" className="text-slate-300 hover:text-white transition">
                                    Login
                                </Link>

                                <Link to="/signup" className={`px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 shadow-lg ${currentTheme.button}`}>
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/jobs" className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition">
                                    <Briefcase size={18} />
                                    Browse Jobs
                                </Link>

                                <Link to={getDashboardLink()} className="flex items-center gap-2 text-slate-300 hover:text-white transition">
                                    <LayoutDashboard size={18} />
                                    Dashboard
                                </Link>

                                <div className="px-4 py-2 rounded-2xl border border-slate-800 bg-slate-900/70 max-w-[180px] truncate text-slate-300">
                                    {user?.name || user?.email || "User"}
                                </div>

                                <button onClick={handleLogout} className="px-5 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-all duration-300">
                                    Logout
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden w-11 h-11 rounded-2xl border border-slate-800 bg-slate-900/80 flex items-center justify-center text-white"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl">
                    <div className="px-4 py-5 flex flex-col gap-3">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-slate-200">
                                    <Home size={18} />
                                    Home
                                </Link>

                                <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-slate-200">
                                    <Briefcase size={18} />
                                    Browse Jobs
                                </Link>

                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-slate-200">
                                    <LogIn size={18} />
                                    Login
                                </Link>

                                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold ${currentTheme.button}`}>
                                    <UserPlus size={18} />
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900 text-slate-300">
                                    {user?.name || user?.email || "User"}
                                </div>

                                <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-slate-200">
                                    <Briefcase size={18} />
                                    Browse Jobs
                                </Link>

                                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-slate-200">
                                    <LayoutDashboard size={18} />
                                    Dashboard
                                </Link>

                                <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-semibold transition">
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}