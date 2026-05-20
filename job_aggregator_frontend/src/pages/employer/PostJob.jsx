import { useEffect, useState } from "react";

import {
    Crown,
    Briefcase,
    Sparkles,
    AlertCircle,
    FileText,
    UploadCloud,
    Loader2,
    CheckCircle2,
    Cpu,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";

import JobPostForm from "../../components/employer/JobPostForm";

import AIVoiceJobPost from "../../components/employer/AIVoiceJobPost";

import {
    parseEmployerJD,
} from "../../services/employerApi";

import { useNavigate } from "react-router-dom";

import { useEmployerData } from "../../context/EmployerDataContext";

export default function PostJob() {

    const {
        subscription,
        activeJobsCount,
        refreshJobs,
        refreshSubscription,
    } = useEmployerData();

    const [generatedFields, setGeneratedFields] =
        useState({});

    const [loading, setLoading] =
        useState(true);

    const [message, setMessage] =
        useState(null);

    const [jdFile, setJdFile] =
        useState(null);

    const [jdParsing, setJdParsing] =
        useState(false);

    const navigate = useNavigate();

    useEffect(() => {

        loadEmployerPlan();

    }, []);

    useEffect(() => {

        if (!message) return;

        const timer = setTimeout(() => {

            setMessage(null);

        }, 3500);

        return () => clearTimeout(timer);

    }, [message]);

    const loadEmployerPlan =
        async () => {

            try {

                setLoading(true);

                await Promise.all([
                    refreshSubscription(),
                    refreshJobs(),
                ]);

            } catch (err) {

                setMessage({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Failed to load employer subscription",
                });

            } finally {

                setLoading(false);

            }

        };

    const handleGenerateFields =
        (fields) => {

            setGeneratedFields(
                fields || {}
            );

        };

    const handleJDFileChange =
        (e) => {

            const file =
                e.target.files?.[0];

            if (!file) {

                setJdFile(null);

                return;

            }

            const allowedTypes = [
                ".pdf",
                ".docx",
                ".txt",
            ];

            const fileName =
                file.name.toLowerCase();

            const isAllowed =
                allowedTypes.some(
                    (type) =>
                        fileName.endsWith(
                            type
                        )
                );

            if (!isAllowed) {

                setMessage({
                    type: "error",
                    text:
                        "Only PDF, DOCX, or TXT JD files are allowed.",
                });

                setJdFile(null);

                e.target.value = "";

                return;

            }

            setJdFile(file);

            setMessage(null);

        };

    const handleParseJD =
        async () => {

            if (!jdFile) {

                setMessage({
                    type: "error",
                    text:
                        "Please select a JD file first.",
                });

                return;

            }

            try {

                setJdParsing(true);

                setMessage(null);

                const response =
                    await parseEmployerJD(
                        jdFile
                    );

                const job =
                    response?.job ||
                    response?.parsed ||
                    {};

                const mappedFields = {
                    title:
                        job.title || "",

                    company:
                        job.company || "",

                    location:
                        job.location || "",

                    salary:
                        job.salary || "",

                    experience:
                        job.experienceYears !==
                            undefined &&
                            job.experienceYears !==
                            null
                            ? String(
                                job.experienceYears
                            )
                            : "",

                    jobType:
                        job.jobType || "",

                    workMode:
                        job.workMode || "",

                    skills: Array.isArray(
                        job.skills
                    )
                        ? job.skills.join(
                            ", "
                        )
                        : job.skills || "",

                    description:
                        job.description ||
                        job.summary ||
                        "",

                    requirements:
                        Array.isArray(
                            job.requirements
                        )
                            ? job.requirements.join(
                                "\n"
                            )
                            : job.requirements ||
                            "",

                    responsibilities:
                        Array.isArray(
                            job.responsibilities
                        )
                            ? job.responsibilities.join(
                                "\n"
                            )
                            : job.responsibilities ||
                            "",

                    link:
                        job.link || "",

                    hrEmail:
                        job.contactEmail ||
                        "",

                    hrPhone:
                        job.contactPhone ||
                        "",
                };

                setGeneratedFields(
                    (prev) => ({
                        ...prev,
                        ...mappedFields,
                    })
                );

                setMessage({
                    type: "success",
                    text:
                        "JD parsed successfully. Job form has been auto-filled.",
                });

            } catch (err) {

                setMessage({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "JD parsing failed. Please try again.",
                });

            } finally {

                setJdParsing(false);

            }

        };

    const currentPlanName =
        subscription?.features?.name ||
        "Free Hiring";

    const maxJobs =
        subscription?.features
            ?.active_jobs_limit ?? 2;

    const unlimited =
        maxJobs === -1;

    const activeJobs =
        activeJobsCount;

    const jobsRemaining =
        unlimited
            ? "Unlimited"
            : Math.max(
                maxJobs - activeJobs,
                0
            );

    const limitReached =
        !unlimited &&
        activeJobs >= maxJobs;

    const handleUpgrade =
        () => {

            navigate(
                "/employer/subscription"
            );

        };

    return (

        <DashboardLayout role="employer">

            <div className="space-y-5">

                {message && (

                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 ${message.type ===
                                "success"
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                : "border-red-400/30 bg-red-500/10 text-red-300"
                            }`}
                    >

                        {message.type ===
                            "success" ? (

                            <CheckCircle2
                                className="mt-0.5 shrink-0"
                                size={20}
                            />

                        ) : (

                            <AlertCircle
                                className="mt-0.5 shrink-0"
                                size={20}
                            />

                        )}

                        <span>
                            {message.text}
                        </span>

                    </div>

                )}

                <div className="rounded-[2rem] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 border border-cyan-400/20 p-5 shadow-xl">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div>

                            <p className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider">

                                <Sparkles size={16} />

                                TalentFlow AI Employer

                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold">

                                Post a Job

                            </h1>

                            <p className="text-slate-400 mt-2 max-w-3xl">

                                Add jobs manually,
                                upload a JD for AI parsing,
                                or use AI voice posting
                                in Hindi,
                                English,
                                or Hinglish.

                            </p>

                        </div>

                        <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 px-4 py-3">

                            <p className="text-sm text-slate-400">

                                Current Plan

                            </p>

                            <h3 className="text-lg font-bold text-cyan-300">

                                {loading
                                    ? "Loading..."
                                    : currentPlanName}

                            </h3>

                        </div>

                    </div>

                </div>

                <div className="rounded-[2rem] bg-slate-900/75 border border-slate-800 p-4 shadow-xl">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                        <div className="flex items-start gap-4">

                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">

                                <Briefcase
                                    className="text-cyan-400"
                                    size={23}
                                />

                            </div>

                            <div>

                                <h2 className="text-lg font-bold">

                                    Current Plan:{" "}
                                    {loading
                                        ? "Loading..."
                                        : currentPlanName}

                                </h2>

                                <p className="text-slate-400 mt-1 text-sm">

                                    Active Jobs Used:{" "}
                                    {loading
                                        ? "..."
                                        : activeJobs}
                                    /
                                    {loading
                                        ? "..."
                                        : unlimited
                                            ? "Unlimited"
                                            : maxJobs}

                                </p>

                                <p
                                    className={`text-sm mt-1 ${limitReached
                                            ? "text-red-300"
                                            : "text-yellow-300"
                                        }`}
                                >

                                    {loading
                                        ? "Checking limits..."
                                        : limitReached
                                            ? "Job posting limit reached. Upgrade your employer plan."
                                            : unlimited
                                                ? "Unlimited active job posting available."
                                                : `You can post ${jobsRemaining} more active job(s).`}

                                </p>

                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleUpgrade}
                            className="px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2"
                        >

                            <Crown size={18} />

                            Upgrade Plan

                        </button>

                    </div>

                </div>

                {limitReached ? (

                    <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center shadow-xl">

                        <Crown
                            className="mx-auto text-red-300 mb-4"
                            size={40}
                        />

                        <h2 className="text-2xl font-extrabold text-white">

                            Posting Limit Reached

                        </h2>

                        <p className="text-slate-300 mt-3 max-w-2xl mx-auto">

                            Your current employer subscription has reached its
                            active job posting limit.

                        </p>

                        <button
                            onClick={handleUpgrade}
                            className="mt-5 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 text-slate-950 font-black"
                        >

                            Upgrade Employer Plan

                        </button>

                    </div>

                ) : (

                    <>

                        <div className="rounded-[2rem] bg-slate-900/75 border border-orange-400/20 p-5 shadow-xl">

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                                <div className="flex items-start gap-4">

                                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-400/20 flex items-center justify-center">

                                        <FileText
                                            className="text-orange-300"
                                            size={24}
                                        />

                                    </div>

                                    <div>

                                        <h2 className="text-xl font-extrabold text-white">

                                            AI JD Parser

                                        </h2>

                                        <p className="text-slate-400 mt-1 max-w-2xl text-sm">

                                            Upload a PDF,
                                            DOCX,
                                            or TXT job description.
                                            TalentFlow AI will parse
                                            the JD and auto-fill
                                            the job posting form.

                                        </p>

                                        {jdFile && (

                                            <p className="mt-2 text-xs text-cyan-300">

                                                Selected:
                                                {" "}
                                                {jdFile.name}

                                            </p>

                                        )}

                                    </div>

                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

                                    <label className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-300 hover:border-orange-400/50 transition flex items-center justify-center gap-2">

                                        <UploadCloud
                                            size={18}
                                        />

                                        <span className="text-sm font-semibold">

                                            Choose JD

                                        </span>

                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.txt"
                                            onChange={handleJDFileChange}
                                            className="hidden"
                                        />

                                    </label>

                                    <button
                                        type="button"
                                        onClick={handleParseJD}
                                        disabled={
                                            jdParsing ||
                                            !jdFile
                                        }
                                        className="rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-5 py-3 text-slate-950 font-black disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >

                                        {jdParsing ? (

                                            <>

                                                <Loader2
                                                    size={18}
                                                    className="animate-spin"
                                                />

                                                Parsing...

                                            </>

                                        ) : (

                                            <>

                                                <Cpu
                                                    size={18}
                                                />

                                                Parse JD

                                            </>

                                        )}

                                    </button>

                                </div>

                            </div>

                        </div>

                        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-5 items-start">

                            <JobPostForm
                                generatedFields={
                                    generatedFields
                                }
                            />

                            <AIVoiceJobPost
                                onGenerateFields={
                                    handleGenerateFields
                                }
                            />

                        </div>

                    </>

                )}

            </div>

        </DashboardLayout>

    );
}