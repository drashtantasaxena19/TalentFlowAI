import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
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

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                />
            )}

            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-slate-950/95 border-r border-slate-800 backdrop-blur-xl flex flex-col z-50 transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
            >
                <div className="lg:hidden absolute top-4 right-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-cyan-400 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <img
                            src="/assets/brand/favicon.png"
                            alt="TalentFlow AI"
                            className="w-12 h-12 object-contain"
                        />

                        <div>
                            <h2 className="text-lg font-extrabold">
                                TalentFlow <span className="text-cyan-400">AI</span>
                            </h2>

                            <p className="text-xs text-slate-400">
                                {roleTitle[finalRole] || "Dashboard"}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => onClose?.()}
                                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium
                ${active
                                        ? "bg-cyan-500 text-slate-950 shadow-lg"
                                        : "text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
                                    }`}
                            >
                                <Icon size={22} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
                        <p className="text-sm text-slate-400">Logged in as</p>

                        <h3 className="font-bold mt-1 truncate">
                            {user?.name || user?.email || finalRole}
                        </h3>

                        {user?.companyName && (
                            <p className="text-xs text-slate-400 mt-1 truncate">
                                {user.companyName}
                            </p>
                        )}

                        <p className="text-xs text-cyan-400 mt-1 capitalize">
                            {modeText[finalRole] || "Workspace"}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}