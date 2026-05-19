export default function Loader({
    text = "Loading...",
}) {
    return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

            <p className="text-sm font-medium text-slate-400">
                {text}
            </p>
        </div>
    );
}