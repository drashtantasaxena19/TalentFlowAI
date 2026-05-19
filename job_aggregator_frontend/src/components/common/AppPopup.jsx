import { CheckCircle2, AlertCircle, X, Info, Sparkles } from "lucide-react";

export default function AppPopup({
    open,
    type = "success",
    title = "Success",
    message = "",
    onClose,
}) {
    if (!open) return null;

    const styles = {
        success: {
            icon: CheckCircle2,
            glow: "from-emerald-500/25 to-cyan-500/10",
            iconColor: "text-emerald-300",
            border: "border-emerald-400/30",
            button: "bg-emerald-400 text-slate-950 hover:bg-emerald-300",
        },
        error: {
            icon: AlertCircle,
            glow: "from-red-500/25 to-pink-500/10",
            iconColor: "text-red-300",
            border: "border-red-400/30",
            button: "bg-red-400 text-slate-950 hover:bg-red-300",
        },
        info: {
            icon: Info,
            glow: "from-cyan-500/25 to-violet-500/10",
            iconColor: "text-cyan-300",
            border: "border-cyan-400/30",
            button: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
        },
    };

    const current = styles[type] || styles.info;
    const Icon = current.icon;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
            <div
                className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border ${current.border} bg-slate-950 shadow-2xl`}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${current.glow}`} />
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />

                <div className="relative p-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-5 top-5 rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-400 transition hover:text-white"
                    >
                        <X size={18} />
                    </button>

                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
                        <Icon className={current.iconColor} size={34} />
                    </div>

                    <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                        <Sparkles size={15} />
                        TalentFlow AI
                    </p>

                    <h2 className="text-2xl font-black text-white">{title}</h2>

                    <p className="mt-3 leading-relaxed text-slate-300">{message}</p>

                    <button
                        type="button"
                        onClick={onClose}
                        className={`mt-6 w-full rounded-2xl px-5 py-3 font-extrabold transition ${current.button}`}
                    >
                        Okay
                    </button>
                </div>
            </div>
        </div>
    );
}