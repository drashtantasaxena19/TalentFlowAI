export default function StatsCard({
    title,
    value,
    icon: Icon,
}) {
    return (
        <div className="rounded-[2rem] bg-slate-900/75 border border-slate-800 p-5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mb-4">
                <Icon className="text-cyan-400" size={24} />
            </div>

            <p className="text-slate-400">{title}</p>

            <h2 className="text-3xl font-black mt-1">
                {value}
            </h2>
        </div>
    );
}