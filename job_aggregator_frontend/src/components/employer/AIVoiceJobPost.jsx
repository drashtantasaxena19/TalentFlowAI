import { useState } from "react";
import {
    Mic,
    WandSparkles,
    Volume2,
    Languages,
    AlertCircle,
    Cpu,
    CheckCircle2,
} from "lucide-react";
import Loader from "../common/Loader";

function extractJobFields(text) {
    const lower = text.toLowerCase();

    const skillKeywords = [
        "React",
        "Node.js",
        "MongoDB",
        "Python",
        "JavaScript",
        "TypeScript",
        "FastAPI",
        "Django",
        "Flask",
        "SQL",
        "Power BI",
        "Tailwind",
        "HTML",
        "CSS",
        "Express",
        "Java",
        "Spring Boot",
        "Machine Learning",
        "Data Analysis",
        "Excel",
        "Tableau",
        "Next.js",
        "Redux",
        "Git",
        "Docker",
        "AWS",
        "Azure",
        "REST API",
    ];

    const skills = skillKeywords.filter((skill) =>
        lower.includes(skill.toLowerCase())
    );

    const roleKeywords = [
        "React Developer",
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "Python Developer",
        "Data Analyst",
        "Data Scientist",
        "Machine Learning Engineer",
        "AI Engineer",
        "Java Developer",
        "Node.js Developer",
        "UI UX Designer",
        "Business Analyst",
        "Software Engineer",
        "Web Developer",
        "Intern",
    ];

    let title = "";
    const matchedRole = roleKeywords.find((role) =>
        lower.includes(role.toLowerCase())
    );

    if (matchedRole) {
        title = matchedRole;
    } else {
        const titleMatch =
            text.match(
                /(?:hiring|need|chahiye|required|looking for)\s+(?:a|an)?\s*([a-zA-Z\s./+-]+?)(?:\s+for|\s+in|\s+with|\s*,|$)/i
            ) ||
            text.match(
                /([a-zA-Z\s./+-]+?(?:developer|engineer|analyst|designer|manager|intern))/i
            );

        title = titleMatch?.[1]?.trim() || "";
    }

    const locationMatch =
        text.match(
            /(?:location|located|based)\s*(?:is|at|in)?\s+([a-zA-Z\s]+?)(?:\s+with|\s+for|\s*,|$)/i
        ) ||
        text.match(
            /(?:in|at)\s+([a-zA-Z\s]+?)(?:\s+with|\s+for|\s*,|$)/i
        );

    const experienceMatch = text.match(
        /(\d+\s*(?:-|to)?\s*\d*\s*(?:year|years|saal|yrs))/i
    );

    const salaryMatch =
        text.match(
            /(?:salary|package|ctc)\s*(?:is|of|around|upto|up to)?\s*([₹a-zA-Z0-9\s.-]+?)(?:\s+with|\s+for|\s*,|$)/i
        ) ||
        text.match(/(₹\s?\d+[a-zA-Z0-9\s.-]*)/i);

    let jobType = "Full-time";
    if (lower.includes("intern") || lower.includes("internship")) {
        jobType = "Internship";
    } else if (lower.includes("part time") || lower.includes("part-time")) {
        jobType = "Part-time";
    } else if (lower.includes("contract")) {
        jobType = "Contract";
    } else if (lower.includes("freelance")) {
        jobType = "Freelance";
    }

    let workMode = "On-site";
    if (lower.includes("remote")) {
        workMode = "Remote";
    } else if (lower.includes("hybrid")) {
        workMode = "Hybrid";
    }

    return {
        title,
        location: locationMatch?.[1]?.trim() || "",
        experience: experienceMatch?.[1]?.trim() || "",
        salary: salaryMatch?.[1]?.trim() || "",
        skills: skills.join(", "),
        jobType,
        workMode,
        description: text.trim(),
        requirements: skills.length
            ? `Candidate should have practical knowledge of ${skills.join(", ")}.`
            : "",
        responsibilities:
            "Work with the team, complete assigned tasks, communicate progress clearly, and contribute to project delivery.",
    };
}

export default function AIVoiceJobPost({ onGenerateFields }) {
    const [loading, setLoading] = useState(false);
    const [voiceText, setVoiceText] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isListening, setIsListening] = useState(false);

    const handleVoiceInput = () => {
        setError("");
        setSuccess("");

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError(
                "Voice input is not supported in this browser. Please use Chrome/Edge or type manually."
            );
            return;
        }

        try {
            const recognition = new SpeechRecognition();

            recognition.lang = "en-IN";
            recognition.interimResults = false;
            recognition.continuous = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
                setLoading(false);
                setError("");
                setSuccess("");
            };

            recognition.onresult = (event) => {
                const transcript = event.results?.[0]?.[0]?.transcript || "";

                if (transcript) {
                    setVoiceText(transcript);
                    setSuccess("Voice captured successfully. Now generate job fields.");
                } else {
                    setError("No voice text detected. Please try again.");
                }
            };

            recognition.onerror = (event) => {
                if (event.error === "not-allowed") {
                    setError(
                        "Microphone permission blocked. Allow microphone from browser site settings, then reload the page."
                    );
                } else if (event.error === "no-speech") {
                    setError("No speech detected. Please speak clearly and try again.");
                } else if (event.error === "audio-capture") {
                    setError(
                        "No microphone found. Please connect or enable your microphone."
                    );
                } else if (event.error === "network") {
                    setError(
                        "Speech service network error. Please check internet or type manually."
                    );
                } else {
                    setError(
                        `Voice input failed: ${event.error}. Please try again or type manually.`
                    );
                }
            };

            recognition.onend = () => {
                setIsListening(false);
                setLoading(false);
            };

            recognition.start();
        } catch (err) {
            console.error("Voice input start error:", err);
            setIsListening(false);
            setLoading(false);
            setError(
                "Voice input could not start. Please allow microphone permission or type manually."
            );
        }
    };

    const handleGenerate = () => {
        setError("");
        setSuccess("");

        if (!voiceText.trim()) {
            setError("Please speak or type job requirement first.");
            return;
        }

        setLoading(true);

        setTimeout(() => {
            const generatedFields = extractJobFields(voiceText);

            if (typeof onGenerateFields === "function") {
                onGenerateFields(generatedFields);
            }

            setSuccess("Job fields generated and sent to the form.");
            setLoading(false);
        }, 700);
    };

    if (loading) {
        return (
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">
                <Loader text="Generating job fields with AI..." />
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">
                        <Mic className="text-orange-300" size={26} />
                    </div>

                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">
                        Voice Parser
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                        AI Voice Job Posting
                    </h2>

                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        Speak or type the job requirement. AI will convert it into structured job fields.
                    </p>
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-200 sm:flex">
                    <Languages size={15} />
                    Hindi + English
                </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-orange-300">
                        <Cpu size={16} />
                        <p className="text-sm font-bold">English Example</p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                        We are hiring a React Developer in Noida with 1 to 2 years experience, salary ₹4 LPA.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-cyan-300">
                        <Cpu size={16} />
                        <p className="text-sm font-bold">Hinglish Example</p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                        Hume Noida ke liye React Developer chahiye, 1-2 saal experience, React Tailwind skills.
                    </p>
                </div>
            </div>

            {error && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {isListening && (
                <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-300">
                    Listening... speak clearly now.
                </div>
            )}

            <button
                type="button"
                onClick={handleVoiceInput}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 py-3 font-bold text-orange-200 transition hover:bg-orange-500/15"
            >
                <Volume2 size={19} />
                {isListening ? "Listening..." : "Start Voice Input"}
            </button>

            <textarea
                rows="5"
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="Voice text or typed requirement will appear here..."
                className="mt-4 w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-orange-400/80 focus:shadow-[0_0_24px_rgba(251,146,60,0.16)] sm:text-base"
            />

            <button
                type="button"
                onClick={handleGenerate}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:scale-[1.01]"
            >
                <WandSparkles size={20} />
                Generate Job Fields
            </button>
        </div>
    );
}