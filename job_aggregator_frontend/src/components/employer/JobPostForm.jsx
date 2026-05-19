import { useEffect, useState } from "react";
import {
    Briefcase,
    MapPin,
    IndianRupee,
    Clock,
    Laptop,
    Mail,
    Phone,
    Link,
    Save,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { postEmployerJob } from "../../services/employerApi";

const initialForm = {
    title: "",
    company: "",
    location: "",
    salary: "",
    experience: "",
    jobType: "Full-time",
    workMode: "On-site",
    skills: "",
    description: "",
    requirements: "",
    responsibilities: "",
    link: "",
    hrEmail: "",
    hrPhone: "",
    deadline: "",
    status: "active",
};

export default function JobPostForm({
    generatedFields = {},
    onPosted,
    disabledByPlan = false,
}) {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (generatedFields && Object.keys(generatedFields).length > 0) {
            setForm((prev) => ({
                ...prev,
                ...generatedFields,
            }));

            setToast({
                type: "success",
                text: "AI generated fields added to the form.",
            });
        }
    }, [generatedFields]);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (disabledByPlan) {
            setToast({
                type: "error",
                text: "Free plan active job limit reached. Close an active job or upgrade.",
            });
            return;
        }

        setLoading(true);
        setToast(null);

        try {
            const payload = {
                title: form.title,
                company: form.company,
                location: form.location,
                salary: form.salary,
                experience: form.experience,
                jobType: form.jobType,
                workMode: form.workMode,
                skills: String(form.skills || "")
                    .split(",")
                    .map((skill) => skill.trim())
                    .filter(Boolean),
                description: form.description,
                requirements: form.requirements,
                responsibilities: form.responsibilities,
                link: form.link,
                hrEmail: form.hrEmail,
                hrPhone: form.hrPhone,
                deadline: form.deadline,
                status: form.status,
            };

            const res = await postEmployerJob(payload);

            setToast({
                type: "success",
                text: res?.message || "Job posted successfully.",
            });

            setForm(initialForm);

            if (typeof onPosted === "function") {
                onPosted();
            }
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to publish job.",
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500";

    const fieldClass =
        "flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 transition focus-within:border-orange-400/80 focus-within:shadow-[0_0_24px_rgba(251,146,60,0.16)]";

    const fullInputClass =
        "w-full rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/80 focus:shadow-[0_0_24px_rgba(251,146,60,0.16)]";

    const textAreaClass =
        "w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/80 focus:shadow-[0_0_24px_rgba(251,146,60,0.16)]";

    return (
        <div className="relative rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">
            {toast && (
                <div className="fixed right-4 top-5 z-[9999] w-[calc(100%-2rem)] max-w-md">
                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                            toast.type === "success"
                                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                                : "border-red-400/30 bg-red-500/15 text-red-200"
                        }`}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                        ) : (
                            <AlertCircle className="mt-0.5 shrink-0" size={21} />
                        )}

                        <div>
                            <p className="font-bold">
                                {toast.type === "success" ? "Success" : "Error"}
                            </p>
                            <p className="text-sm opacity-90">{toast.text}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                    Structured Posting
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                    Complete Job Details
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                    These fields will be saved in MongoDB and shown in posted job preview.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                <div className={fieldClass}>
                    <Briefcase className="shrink-0 text-orange-300" size={18} />
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Job Title *"
                        required
                    />
                </div>

                <div className={fieldClass}>
                    <Briefcase className="shrink-0 text-orange-300" size={18} />
                    <input
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Company Name"
                    />
                </div>

                <div className={fieldClass}>
                    <MapPin className="shrink-0 text-cyan-300" size={18} />
                    <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Location"
                    />
                </div>

                <div className={fieldClass}>
                    <IndianRupee className="shrink-0 text-cyan-300" size={18} />
                    <input
                        name="salary"
                        value={form.salary}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Salary Range"
                    />
                </div>

                <div className={fieldClass}>
                    <Clock className="shrink-0 text-orange-300" size={18} />
                    <input
                        name="experience"
                        value={form.experience}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Experience Required"
                    />
                </div>

                <select
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                    className={fullInputClass}
                >
                    <option className="bg-slate-950">Full-time</option>
                    <option className="bg-slate-950">Part-time</option>
                    <option className="bg-slate-950">Internship</option>
                    <option className="bg-slate-950">Contract</option>
                    <option className="bg-slate-950">Freelance</option>
                </select>

                <div className={fieldClass}>
                    <Laptop className="shrink-0 text-cyan-300" size={18} />
                    <select
                        name="workMode"
                        value={form.workMode}
                        onChange={handleChange}
                        className="w-full bg-transparent text-sm text-white outline-none"
                    >
                        <option className="bg-slate-950">On-site</option>
                        <option className="bg-slate-950">Remote</option>
                        <option className="bg-slate-950">Hybrid</option>
                    </select>
                </div>

                <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    className={fullInputClass}
                />

                <input
                    name="skills"
                    value={form.skills}
                    onChange={handleChange}
                    className={`${fullInputClass} md:col-span-2`}
                    placeholder="Required Skills: React, Node.js, MongoDB"
                />

                <textarea
                    rows="3"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className={`${textAreaClass} md:col-span-2`}
                    placeholder="Job Description"
                />

                <textarea
                    rows="3"
                    name="requirements"
                    value={form.requirements}
                    onChange={handleChange}
                    className={`${textAreaClass} md:col-span-2`}
                    placeholder="Requirements"
                />

                <textarea
                    rows="3"
                    name="responsibilities"
                    value={form.responsibilities}
                    onChange={handleChange}
                    className={`${textAreaClass} md:col-span-2`}
                    placeholder="Responsibilities"
                />

                <div className={fieldClass}>
                    <Link className="shrink-0 text-orange-300" size={18} />
                    <input
                        name="link"
                        value={form.link}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Apply Link"
                    />
                </div>

                <div className={fieldClass}>
                    <Mail className="shrink-0 text-cyan-300" size={18} />
                    <input
                        name="hrEmail"
                        value={form.hrEmail}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="HR Email"
                    />
                </div>

                <div className={fieldClass}>
                    <Phone className="shrink-0 text-cyan-300" size={18} />
                    <input
                        name="hrPhone"
                        value={form.hrPhone}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="HR Phone"
                    />
                </div>

                <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={fullInputClass}
                >
                    <option className="bg-slate-950" value="active">
                        Active
                    </option>
                    <option className="bg-slate-950" value="closed">
                        Closed
                    </option>
                </select>

                <button
                    type="submit"
                    disabled={loading || disabledByPlan}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                >
                    <Save size={18} />
                    {loading
                        ? "Publishing..."
                        : disabledByPlan
                        ? "Plan Limit Reached"
                        : "Publish Job"}
                </button>
            </form>
        </div>
    );
}