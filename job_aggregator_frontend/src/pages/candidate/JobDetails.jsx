import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    MapPin,
    IndianRupee,
    ExternalLink,
    Mail,
    Phone,
    MessageCircle,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Target,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function JobDetails() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const job = state?.job;

    if (!job) {
        return (
            <DashboardLayout role="candidate">
                <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-8 text-center">
                    <h2 className="text-2xl font-bold">Job not found</h2>
                    <button
                        onClick={() => navigate("/candidate/recommended-jobs")}
                        className="mt-5 px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold"
                    >
                        Back to Jobs
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="candidate">
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-slate-300 hover:text-cyan-400"
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <div className="space-y-6">
                <section className="rounded-[2rem] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-slate-800 p-6 md:p-8">
                    <p className="text-cyan-400 font-semibold uppercase tracking-wider">
                        Job Details
                    </p>

                    <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
                        {job.title}
                    </h1>

                    <p className="text-slate-300 mt-3 text-lg">{job.company}</p>

                    <div className="flex flex-wrap gap-4 mt-5 text-slate-300">
                        <span className="flex items-center gap-2">
                            <MapPin size={18} /> {job.location}
                        </span>

                        <span className="flex items-center gap-2">
                            <IndianRupee size={18} /> {job.salary}
                        </span>

                        <span className="flex items-center gap-2">
                            <Briefcase size={18} />{" "}
                            {job.experience || "Experience not specified"}
                        </span>
                    </div>
                </section>

                <section className="grid lg:grid-cols-[1fr_0.7fr] gap-6">
                    <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            AI Match Analysis
                        </h2>

                        <div className="text-5xl font-black text-green-400 mb-5">
                            {job.match || "0%"}
                        </div>

                        <p className="text-slate-300">
                            {job.reason ||
                                "This job is recommended based on your resume, skills, and profile similarity."}
                        </p>

                        <div className="mt-6">
                            <h3 className="font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                <Target size={18} />
                                Required Skills
                            </h3>
                            <SkillPills
                                skills={job.requiredSkills || []}
                                color="cyan"
                                icon={Target}
                                emptyText="Required skills not detected."
                            />
                        </div>

                        <div className="mt-6">
                            <h3 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                                <CheckCircle2 size={18} />
                                Matched Skills
                            </h3>
                            <SkillPills
                                skills={job.matchedSkills || []}
                                color="green"
                                icon={CheckCircle2}
                                emptyText="No matched skills found."
                            />
                        </div>

                        <div className="mt-6">
                            <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                Missing Skills
                            </h3>
                            <SkillPills
                                skills={job.missingSkills || []}
                                color="yellow"
                                icon={AlertTriangle}
                                emptyText="No major missing skills detected."
                            />
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                        <h2 className="text-2xl font-bold mb-5">
                            Take Action
                        </h2>

                        <div className="space-y-3">
                            <a
                                href={job.applyLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold flex justify-center items-center gap-2"
                            >
                                Apply Now <ExternalLink size={18} />
                            </a>

                            <a
                                href={job.chatLink}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-cyan-400 flex justify-center items-center gap-2"
                            >
                                <MessageCircle size={18} /> Chat with HR
                            </a>

                            <a
                                href={`tel:${job.hrPhone}`}
                                className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-cyan-400 flex justify-center items-center gap-2"
                            >
                                <Phone size={18} /> Call HR
                            </a>

                            <a
                                href={`mailto:${job.hrEmail}`}
                                className="w-full py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-cyan-400 flex justify-center items-center gap-2"
                            >
                                <Mail size={18} /> Mail HR
                            </a>
                        </div>

                        <div className="mt-6 rounded-2xl bg-slate-950 border border-slate-800 p-4">
                            <div className="flex items-center gap-2 text-cyan-400 font-bold">
                                <Sparkles size={18} />
                                Career Tip
                            </div>
                            <p className="text-slate-400 mt-2 text-sm">
                                {job.careerAdvice ||
                                    "Improve missing skills to increase your match score and hiring chances."}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

function SkillPills({ skills = [], color = "cyan", icon: Icon, emptyText }) {
    const colorMap = {
        cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
        green: "bg-green-500/10 text-green-300 border-green-500/30",
        yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    };

    if (!skills.length) {
        return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
                <span
                    key={`${skill}-${index}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${
                        colorMap[color] || colorMap.cyan
                    }`}
                >
                    {Icon && <Icon size={14} />}
                    {skill}
                </span>
            ))}
        </div>
    );
}