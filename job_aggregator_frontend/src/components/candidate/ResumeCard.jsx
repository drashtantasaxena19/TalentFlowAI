import { UploadCloud, CheckCircle } from "lucide-react";

export default function ResumeCard({
    resume,
    uploaded,
    setResume,
    setUploaded,
    handleUpload,
}) {
    return (
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
            <form onSubmit={handleUpload} className="space-y-6">
                <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                        <UploadCloud size={38} />
                    </div>

                    <h2 className="text-2xl font-extrabold">
                        Upload Resume
                    </h2>

                    <p className="text-slate-400 mt-2">
                        Supported: PDF, DOCX
                    </p>
                </div>

                <div className="w-full rounded-3xl border-2 border-dashed border-slate-700 hover:border-cyan-400 transition p-6 bg-slate-950/50">
                    <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                            setResume(e.target.files[0]);
                            setUploaded(false);
                        }}
                        className="w-full text-slate-300
                        file:mr-4 file:px-5 file:py-3
                        file:border-0 file:rounded-2xl
                        file:bg-cyan-500 file:text-slate-950
                        file:font-bold hover:file:bg-cyan-400"
                    />
                </div>

                {resume && (
                    <div className="text-sm text-slate-300 bg-slate-950 rounded-2xl p-4 border border-slate-800">
                        Selected File:{" "}
                        <span className="text-cyan-400">{resume.name}</span>
                    </div>
                )}

                {uploaded && (
                    <div className="flex items-center gap-3 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-green-400">
                        <CheckCircle size={22} />
                        Resume uploaded and profile updated successfully
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold text-lg hover:bg-cyan-400 transition"
                >
                    Upload & Auto Fill Profile
                </button>
            </form>
        </div>
    );
}