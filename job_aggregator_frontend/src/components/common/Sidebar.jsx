import { Link, useLocation } from "react-router-dom";
import { X, Sparkles } from "lucide-react";

import { sidebarLinks } from "../../utils/sidebarConfig";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({
    role = "candidate",
    isOpen = false,
    onClose,
}) {
    const location = useLocation();
    const { user } = useAuth();

    const finalRole = user?.role || role;
    const menuItems = sidebarLinks[finalRole] || sidebarLinks.candidate;

    const roleTheme = {
        candidate: {
            accent: "text-cyan-400",
            activeBg: "bg-cyan-500",
            activeText: "text-slate-950",
            hoverText: "hover:text-cyan-400",
            glow: "from-cyan-500/20 to-blue-500/5",
            border: "border-cyan-500/20",
            ring: "shadow-cyan-500/20",
        },
        employer: {
            accent: "text-orange-400",
            activeBg: "bg-orange-500",
            activeText: "text-white",
            hoverText: "hover:text-orange-400",
            glow: "from-orange-500/20 to-amber-500/5",
            border: "border-orange-500/20",
            ring: "shadow-orange-500/20",
        },
        admin: {
            accent: "text-purple-400",
            activeBg: "bg-purple-500",
            activeText: "text-white",
            hoverText: "hover:text-purple-400",
            glow: "from-purple-500/20 to-pink-500/5",
            border: "border-purple-500/20",
            ring: "shadow-purple-500/20",
        },
    };

    const roleTitle = {
        candidate: "Career Dashboard",
        employer: "Employer Workspace",
        admin: "Admin Panel",
    };

    const modeText = {
        candidate: "Career Mode",
        employer: "Hiring Workspace",
        admin: "System Control",
    };

    const theme = roleTheme[finalRole] || roleTheme.candidate;

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
                />
            )}

            <aside
                className={`
                    fixed left-0 top-16 md:top-20 z-50
                    h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]
                    w-[82vw] max-w-72 lg:w-72
                    border-r backdrop-blur-2xl
                    bg-slate-950/95 border-slate-800
                    flex flex-col
                    transform transition-all duration-300 ease-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0
                `}
            >
                {/* Mobile Close */}
                <div className="lg:hidden absolute top-4 right-4">
                    <button
                        onClick={onClose}
                        className={`
                            w-10 h-10 rounded-2xl
                            bg-slate-900 border ${theme.border}
                            flex items-center justify-center
                            text-slate-200 hover:text-white transition
                        `}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Brand Header */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <div
                        className={`
                            rounded-[1.5rem] border ${theme.border}
                            bg-gradient-to-br ${theme.glow}
                            p-4
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div
                                    className={`
                                        absolute inset-0 rounded-2xl blur-xl
                                        bg-gradient-to-br ${theme.glow}
                                    `}
                                />

                                <img
                                    src="/assets/brand/favicon.png"
                                    alt="TalentFlow AI"
                                    className="relative w-11 h-11 object-contain"
                                />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-lg font-black tracking-tight text-white">
                                    TalentFlow{" "}
                                    <span className={theme.accent}>
                                        AI
                                    </span>
                                </h2>

                                <p className="text-xs text-slate-400 truncate">
                                    {roleTitle[finalRole] || "Dashboard"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <span
                                className={`
                                    inline-flex items-center gap-1.5
                                    rounded-full border ${theme.border}
                                    bg-slate-950/60 px-3 py-1
                                    text-[11px] font-semibold ${theme.accent}
                                `}
                            >
                                <Sparkles size={13} />
                                {modeText[finalRole] || "Workspace"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Links */}
                <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            location.pathname === item.path ||
                            location.pathname.startsWith(item.path + "/");

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => onClose?.()}
                                className={`
                                    group relative flex items-center gap-3
                                    px-4 py-3 rounded-2xl
                                    transition-all duration-300
                                    font-semibold text-sm
                                    ${
                                        active
                                            ? `${theme.activeBg} ${theme.activeText} shadow-lg ${theme.ring}`
                                            : `text-slate-300 hover:bg-slate-900/90 ${theme.hoverText}`
                                    }
                                `}
                            >
                                {active && (
                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-7 rounded-full bg-white/80" />
                                )}

                                <Icon
                                    size={21}
                                    className={active ? "scale-110" : "group-hover:scale-110 transition"}
                                />

                                <span className="truncate">
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Card */}
                <div className="p-4 border-t border-slate-800">
                    <div
                        className={`
                            rounded-[1.5rem] border ${theme.border}
                            bg-slate-900/70 p-4
                        `}
                    >
                        <p className="text-xs text-slate-400">
                            Logged in as
                        </p>

                        <h3 className="font-bold mt-1 truncate text-white">
                            {user?.name || user?.email || finalRole}
                        </h3>

                        {user?.companyName && (
                            <p className="text-xs text-slate-400 mt-1 truncate">
                                {user.companyName}
                            </p>
                        )}

                        <p className={`text-xs mt-2 capitalize font-semibold ${theme.accent}`}>
                            {modeText[finalRole] || "Workspace"}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}