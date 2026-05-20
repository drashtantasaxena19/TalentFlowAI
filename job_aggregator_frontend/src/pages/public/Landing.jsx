import { Link } from "react-router-dom";
import {
    ArrowRight,
    Brain,
    Briefcase,
    FileText,
    Sparkles,
    Target,
    TrendingUp,
    Search,
} from "lucide-react";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

export default function Landing() {
    const features = [
        {
            icon: FileText,
            title: "AI Resume Analysis",
            text: "Upload your resume and get a smart profile with skills, experience, and strengths.",
        },
        {
            icon: Target,
            title: "Job Matching",
            text: "Find jobs that match your resume, skills, role preference, and career level.",
        },
        {
            icon: TrendingUp,
            title: "Match Score",
            text: "Every job gets a percentage score so you know where you fit best.",
        },
        {
            icon: Brain,
            title: "Skill Gap Insights",
            text: "Understand missing skills and improve your profile for better opportunities.",
        },
    ];

    const steps = [
        "Create your account",
        "Upload your resume",
        "Get AI profile analysis",
        "Apply to recommended jobs",
    ];

    const stats = [
        ["AI", "Resume Parsing"],
        ["90%+", "Smart Matching"],
        ["24/7", "Job Discovery"],
        ["Fast", "Career Insights"],
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <Navbar />

            <section className="relative pt-24 md:pt-28 px-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.15),transparent_35%)]" />

                <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center min-h-[88vh]">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 mb-6">
                            <Sparkles size={18} />
                            AI-Powered Career Intelligence
                        </div>

                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight">
                            Smart Resume.
                            <br />
                            Smart Jobs.
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                Smart Future.
                            </span>
                        </h1>

                        <p className="mt-6 text-slate-300 text-base sm:text-lg md:text-xl max-w-xl leading-relaxed">
                            TalentFlow AI analyzes your resume, builds your professional profile, and recommends the best matching jobs using advanced AI.
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition">
                                Get Started <ArrowRight size={20} />
                            </Link>

                            <Link to="/jobs" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 transition">
                                <Search size={20} />
                                Browse Jobs
                            </Link>

                            <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl border border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-300 transition">
                                Login
                            </Link>
                        </div>
                    </div>

                    <div className="relative flex justify-center">
                        <div className="absolute w-72 h-72 md:w-96 md:h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                        <img
                            src="/assets/brand/app_icon.png"
                            alt="TalentFlow AI"
                            className="relative w-72 sm:w-80 md:w-[420px] rounded-[50%] object-contain drop-shadow-[0_0_60px_rgba(34,211,238,0.35)]"
                        />
                    </div>
                </div>
            </section>

            <section className="px-5 py-12">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map(([number, label]) => (
                        <div key={label} className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 text-center">
                            <h3 className="text-3xl md:text-4xl font-extrabold text-cyan-400">
                                {number}
                            </h3>
                            <p className="text-slate-400 mt-2">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-5 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="text-cyan-400 font-semibold uppercase tracking-widest">
                            Features
                        </p>

                        <h2 className="text-3xl md:text-5xl font-extrabold mt-3">
                            Everything you need to build your career
                        </h2>

                        <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
                            TalentFlow AI combines AI analysis, profile building, and job recommendations into one intelligent ecosystem.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 hover:border-cyan-400/40 transition">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5">
                                    <Icon size={28} />
                                </div>

                                <h3 className="text-xl font-bold mb-3">{title}</h3>
                                <p className="text-slate-400 leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-5 py-20 bg-slate-900/40">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="text-purple-400 font-semibold uppercase tracking-widest">
                            How It Works
                        </p>

                        <h2 className="text-3xl md:text-5xl font-extrabold mt-3">
                            From Resume to Recruitment
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-5">
                        {steps.map((step, index) => (
                            <div key={step} className="rounded-3xl bg-slate-950 border border-slate-800 p-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-black flex items-center justify-center mb-5">
                                    {index + 1}
                                </div>
                                <h3 className="text-lg font-bold">{step}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-5 py-20">
                <div className="max-w-5xl mx-auto text-center rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-8 md:p-14">
                    <Briefcase className="mx-auto text-cyan-400 mb-5" size={42} />

                    <h2 className="text-3xl md:text-5xl font-extrabold">
                        Ready to unlock better career opportunities?
                    </h2>

                    <p className="text-slate-300 mt-5 max-w-2xl mx-auto leading-relaxed">
                        Join TalentFlow AI today and transform your resume into real career growth with AI-powered recommendations.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition">
                            Start Your Journey <ArrowRight size={20} />
                        </Link>

                        <Link to="/jobs" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10 transition">
                            Browse Jobs <Briefcase size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}