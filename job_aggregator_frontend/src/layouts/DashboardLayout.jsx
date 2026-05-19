import { useState } from "react";
import { Menu } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

export default function DashboardLayout({
    children,
    role = "candidate",
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            {/* Top Navbar */}
            <Navbar />

            {/* Mobile Dashboard Top Bar */}
            <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white hover:border-cyan-400 transition"
                    >
                        <Menu size={22} />
                    </button>

                    <h2 className="text-sm font-bold">
                        TalentFlow <span className="text-cyan-400">AI</span>
                    </h2>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex pt-16">
                {/* Dynamic Sidebar */}
                <Sidebar
                    role={role}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                {/* Main Content */}
                <main className="flex-1 min-h-screen ml-0 lg:ml-72 px-4 md:px-8 py-6 lg:py-8 pt-24 lg:pt-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}