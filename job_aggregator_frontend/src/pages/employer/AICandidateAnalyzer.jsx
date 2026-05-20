import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from "recharts";

import DashboardLayout from "../../layouts/DashboardLayout";
import { analyzeCandidateAI } from "../../services/employerApi";
import { extractTextFromFile } from "../../utils/extractText";

export default function AICandidateAnalyzer() {
    const [jdText, setJdText] = useState("");
    const [resumeText, setResumeText] = useState("");

    const [jdFileName, setJdFileName] = useState("");
    const [resumeFileName, setResumeFileName] = useState("");

    const [loading, setLoading] = useState(false);

    const [analysis, setAnalysis] = useState(null);

    const scoreCards = useMemo(() => {
        if (!analysis?.scoreBreakdown) {
            return [];
        }

        return Object.entries(
            analysis.scoreBreakdown
        ).map(([key, value]) => ({
            label: key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
            value,
        }));
    }, [analysis]);

    const radarData = scoreCards.map((item) => ({
        subject: item.label,
        score: item.value,
    }));

    const handleJDUpload = async (event) => {
        try {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            setJdFileName(file.name);

            const extractedText =
                await extractTextFromFile(file);

            setJdText(extractedText);

        } catch (error) {
            console.error(error);

            alert(
                "Failed to extract recruiter JD."
            );
        }
    };

    const handleResumeUpload = async (event) => {
        try {
            const file = event.target.files?.[0];

            if (!file) {
                return;
            }

            setResumeFileName(file.name);

            const extractedText =
                await extractTextFromFile(file);

            setResumeText(extractedText);

        } catch (error) {
            console.error(error);

            alert(
                "Failed to extract candidate resume."
            );
        }
    };

    const handleAnalyze = async () => {
        try {
            if (!jdText.trim()) {
                return alert(
                    "Recruiter job description is required."
                );
            }

            if (!resumeText.trim()) {
                return alert(
                    "Candidate resume is required."
                );
            }

            setLoading(true);

            const response =
                await analyzeCandidateAI({
                    jd_text: jdText,
                    resume_text: resumeText,
                });

            setAnalysis(response);

        } catch (error) {
            console.error(error);

            alert(
                error?.response?.data?.detail ||
                "Recruiter AI analysis failed."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="employer">
            <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[#050816] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(249,115,22,0.14),transparent_30%)]" />

                <div className="relative z-10 p-6 md:p-10">
                    <div className="mb-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="mb-3 text-sm uppercase tracking-[0.4em] text-cyan-400">
                                TalentFlow AI
                            </p>

                            <h1 className="bg-gradient-to-r from-cyan-300 via-white to-orange-300 bg-clip-text text-5xl font-black leading-tight text-transparent md:text-7xl">
                                Recruiter
                                <br />
                                Intelligence Engine
                            </h1>

                            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-400">
                                AI-powered recruiter intelligence system
                                for semantic candidate analysis, hiring
                                confidence evaluation, recruiter scoring,
                                and advanced hiring insights.
                            </p>
                        </div>

                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.9,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                            }}
                            className="rounded-[2rem] border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(34,211,238,0.18)]"
                        >
                            <p className="mb-5 text-center text-sm uppercase tracking-[0.3em] text-slate-400">
                                AI Recruiter Match
                            </p>

                            <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[14px] border-slate-800" />

                                <motion.div
                                    initial={{
                                        rotate: 0,
                                    }}
                                    animate={{
                                        rotate: 360,
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 10,
                                        ease: "linear",
                                    }}
                                    className="absolute inset-0 rounded-full border-[14px] border-cyan-400 border-t-orange-400"
                                />

                                <div className="text-center">
                                    <h2 className="text-6xl font-black text-cyan-300">
                                        {analysis?.overallMatchPercentage || 0}%
                                    </h2>

                                    <p className="mt-2 text-sm text-slate-400">
                                        {analysis?.recommendation ||
                                            "Awaiting Recruiter Analysis"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <motion.div
                            initial={{
                                opacity: 0,
                                x: -40,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            className="rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-400">
                                        Recruiter Input
                                    </p>

                                    <h2 className="text-3xl font-bold">
                                        Recruiter Job Description
                                    </h2>
                                </div>

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10 text-2xl">
                                    📄
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-dashed border-cyan-500/30 bg-[#0b1120]/70 p-8 text-center transition-all duration-300 hover:border-cyan-400">
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleJDUpload}
                                    className="hidden"
                                    id="jd-upload"
                                />

                                <label
                                    htmlFor="jd-upload"
                                    className="cursor-pointer"
                                >
                                    <div className="mb-5 text-6xl">
                                        📄
                                    </div>

                                    <h3 className="mb-3 text-2xl font-bold">
                                        Upload Recruiter JD
                                    </h3>

                                    <p className="text-slate-400">
                                        PDF, DOCX, TXT supported
                                    </p>

                                    {!!jdFileName && (
                                        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-cyan-300">
                                            {jdFileName}
                                        </div>
                                    )}
                                </label>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{
                                opacity: 0,
                                x: 40,
                            }}
                            animate={{
                                opacity: 1,
                                x: 0,
                            }}
                            className="rounded-[2rem] border border-orange-500/10 bg-white/5 p-8 backdrop-blur-xl"
                        >
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-orange-400">
                                        Candidate Intelligence
                                    </p>

                                    <h2 className="text-3xl font-bold">
                                        Candidate Resume
                                    </h2>
                                </div>

                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-2xl">
                                    👤
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-dashed border-orange-500/30 bg-[#0b1120]/70 p-8 text-center transition-all duration-300 hover:border-orange-400">
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleResumeUpload}
                                    className="hidden"
                                    id="resume-upload"
                                />

                                <label
                                    htmlFor="resume-upload"
                                    className="cursor-pointer"
                                >
                                    <div className="mb-5 text-6xl">
                                        👤
                                    </div>

                                    <h3 className="mb-3 text-2xl font-bold">
                                        Upload Candidate Resume
                                    </h3>

                                    <p className="text-slate-400">
                                        AI semantic extraction enabled
                                    </p>

                                    {!!resumeFileName && (
                                        <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-orange-300">
                                            {resumeFileName}
                                        </div>
                                    )}
                                </label>
                            </div>
                        </motion.div>
                    </div>

                    <div className="my-10 flex justify-center">
                        <motion.button
                            whileHover={{
                                scale: 1.03,
                            }}
                            whileTap={{
                                scale: 0.98,
                            }}
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="rounded-full border border-cyan-400/20 bg-gradient-to-r from-cyan-500 to-orange-500 px-10 py-5 text-lg font-bold tracking-wide shadow-[0_0_40px_rgba(34,211,238,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                                        <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-200 delay-100" />
                                        <span className="h-3 w-3 animate-pulse rounded-full bg-orange-200 delay-200" />
                                    </div>

                                    <span>
                                        Running Recruiter Intelligence Analysis...
                                    </span>
                                </div>
                            ) : (
                                "⚡ Run Recruiter AI Analysis"
                            )}
                        </motion.button>
                    </div>

                    {loading && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            className="mx-auto mt-10 max-w-5xl rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <p className="mb-2 text-sm uppercase tracking-[0.3em] text-cyan-400">
                                        Recruiter Intelligence Engine
                                    </p>

                                    <h2 className="text-3xl font-black">
                                        AI Semantic Hiring Analysis
                                    </h2>
                                </div>

                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-500/10 text-3xl">
                                    🧠
                                </div>
                            </div>

                            <div className="space-y-5">
                                {[
                                    "Parsing recruiter job description...",
                                    "Extracting candidate intelligence...",
                                    "Running semantic compatibility engine...",
                                    "Analyzing transferable skills...",
                                    "Evaluating recruiter hiring confidence...",
                                    "Generating recruiter insights...",
                                ].map((step, index) => (
                                    <motion.div
                                        key={step}
                                        initial={{
                                            opacity: 0,
                                            x: -20,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                        }}
                                        transition={{
                                            delay: index * 0.3,
                                        }}
                                        className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-orange-500 font-bold">
                                            {index + 1}
                                        </div>

                                        <div className="flex-1">
                                            <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                                <motion.div
                                                    initial={{
                                                        width: 0,
                                                    }}
                                                    animate={{
                                                        width: "100%",
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        delay: index * 0.3,
                                                    }}
                                                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-orange-400"
                                                />
                                            </div>

                                            <p className="text-slate-300">
                                                {step}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {!!scoreCards.length && (
                        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {scoreCards.map((item) => (
                                <motion.div
                                    key={item.label}
                                    whileHover={{
                                        y: -4,
                                    }}
                                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                                >
                                    <div className="mb-5 flex items-center justify-between">
                                        <h3 className="max-w-[180px] text-sm font-semibold uppercase tracking-wide text-slate-300">
                                            {item.label}
                                        </h3>

                                        <span className="text-3xl font-black text-cyan-300">
                                            {item.value}%
                                        </span>
                                    </div>

                                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                        <motion.div
                                            initial={{
                                                width: 0,
                                            }}
                                            animate={{
                                                width: `${item.value}%`,
                                            }}
                                            transition={{
                                                duration: 1,
                                            }}
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-orange-400"
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {!!analysis && (
                        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <div className="rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">
                                        Matched Skills
                                    </h2>

                                    <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
                                        Semantic Match
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {(analysis?.matchedSkills || []).map(
                                        (skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-orange-500/10 bg-white/5 p-8 backdrop-blur-xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">
                                        Missing Skills
                                    </h2>

                                    <span className="rounded-full bg-orange-500/10 px-4 py-2 text-xs text-orange-300">
                                        Gap Analysis
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {(analysis?.missingSkills || []).map(
                                        (skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-200"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">
                                        Hiring Recommendation
                                    </h2>

                                    <span className="rounded-full bg-green-500/10 px-4 py-2 text-xs text-green-300">
                                        {analysis?.hiringConfidence ||
                                            "AI Confidence"}
                                    </span>
                                </div>

                                <p className="leading-8 text-slate-300">
                                    {analysis?.aiInsights ||
                                        "Recruiter intelligence insights will appear here."}
                                </p>
                            </div>
                        </div>
                    )}

                    {!!analysis && (
                        <div className="mt-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">
                                        Candidate Strengths
                                    </h2>

                                    <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
                                        Recruiter Intelligence
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(analysis?.candidateStrengths || []).map(
                                        (
                                            strength,
                                            index
                                        ) => (
                                            <div
                                                key={index}
                                                className="rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-slate-200"
                                            >
                                                {strength}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-orange-500/10 bg-white/5 p-8 backdrop-blur-xl">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">
                                        Hiring Risk Factors
                                    </h2>

                                    <span className="rounded-full bg-orange-500/10 px-4 py-2 text-xs text-orange-300">
                                        Recruiter Risk Analysis
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {(analysis?.candidateWeaknesses || []).map(
                                        (
                                            weakness,
                                            index
                                        ) => (
                                            <div
                                                key={index}
                                                className="rounded-2xl border border-orange-500/10 bg-orange-500/5 p-4 text-slate-200"
                                            >
                                                {weakness}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!!analysis?.semanticAnalysis && (
                        <div className="mt-10 rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-3xl font-bold">
                                    Semantic Recruiter Intelligence
                                </h2>

                                <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
                                    AI Recruiter Reasoning
                                </span>
                            </div>

                            <p className="max-w-6xl text-lg leading-9 text-slate-300">
                                {analysis.semanticAnalysis}
                            </p>
                        </div>
                    )}

                    {!!radarData.length && (
                        <div className="mt-10 rounded-[2rem] border border-cyan-500/10 bg-white/5 p-8 backdrop-blur-xl">
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <p className="mb-2 text-sm uppercase tracking-[0.3em] text-cyan-400">
                                        Recruiter Analytics
                                    </p>

                                    <h2 className="text-4xl font-black">
                                        Semantic Intelligence Radar
                                    </h2>
                                </div>

                                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-500/10 text-3xl">
                                    📊
                                </div>
                            </div>

                            <div className="h-[500px] w-full">
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <RadarChart
                                        data={radarData}
                                    >
                                        <PolarGrid stroke="#334155" />

                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{
                                                fill: "#cbd5e1",
                                                fontSize: 12,
                                            }}
                                        />

                                        <PolarRadiusAxis
                                            angle={30}
                                            domain={[0, 100]}
                                            tick={{
                                                fill: "#64748b",
                                            }}
                                        />

                                        <Radar
                                            name="Recruiter Intelligence"
                                            dataKey="score"
                                            stroke="#22d3ee"
                                            fill="#22d3ee"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}