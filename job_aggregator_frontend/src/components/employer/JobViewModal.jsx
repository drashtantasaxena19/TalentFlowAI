import { X, Edit3, Download } from "lucide-react";
import { downloadJobPdf } from "../../utils/jobPdfGenerator";

function Info({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-200">
                {value || "Not added"}
            </p>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="mb-2 text-sm font-black text-orange-300">{title}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {children}
            </p>
        </div>
    );
}

export default function JobViewModal({ job, onClose, onEdit }) {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-cyan-400/20 bg-slate-950 p-5 shadow-2xl sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
                            Posted Job Preview
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-white">
                            {job.title || "Untitled Job"}
                        </h2>

                        <p className="mt-1 text-slate-400">
                            {job.company || "Company not added"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 p-2 text-slate-300 hover:border-red-400 hover:text-red-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Location" value={job.location} />
                    <Info label="Salary" value={job.salary} />
                    <Info label="Experience" value={job.experience} />
                    <Info label="Job Type" value={job.jobType} />
                    <Info label="Work Mode" value={job.workMode} />
                    <Info label="Status" value={job.status || "active"} />
                    <Info label="Deadline" value={job.deadline} />
                    <Info label="HR Email" value={job.hrEmail} />
                    <Info label="HR Phone" value={job.hrPhone} />
                    <Info label="Apply Link" value={job.applyLink} />
                </div>

                <Section title="Skills">
                    {Array.isArray(job.skills)
                        ? job.skills.join(", ")
                        : job.skills || "No skills added"}
                </Section>

                <Section title="Description">
                    {job.description || "No description added"}
                </Section>

                <Section title="Requirements">
                    {job.requirements || "No requirements added"}
                </Section>

                <Section title="Responsibilities">
                    {job.responsibilities || "No responsibilities added"}
                </Section>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => downloadJobPdf(job)}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-5 py-3 font-black text-orange-200 hover:bg-orange-500/20"
                    >
                        <Download size={18} />
                        Download JD PDF
                    </button>

                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-5 py-3 font-black text-slate-950"
                    >
                        <Edit3 size={18} />
                        Edit This Job
                    </button>
                </div>
            </div>
        </div>
    );
}