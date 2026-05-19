import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";
import {
    Brain,
    CheckCircle,
    AlertTriangle,
    Star,
    Lock,
    RefreshCcw,
    Crown,
    Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getCandidateProfile } from "../../services/profileApi";
import { getCurrentSubscription } from "../../services/subscriptionApi";

export default function ProfileAnalysis() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [subscription, setSubscription] = useState(null);

    const calculateAnalysis = (profile, currentPlan = "free") => {
        let score = 0;

        const strengths = [];
        const improvements = [];
        const proInsights = [];

        if (profile.fullName) score += 8;
        else improvements.push("Add your full name");

        if (profile.phone) score += 8;
        else improvements.push("Add phone number");

        if (profile.location) score += 8;
        else improvements.push("Add location");

        if (profile.currentRole) {
            score += 12;
            strengths.push(`Clear career role: ${profile.currentRole}`);
        } else {
            improvements.push("Add current or desired role");
        }

        if (profile.experience) {
            score += 10;
            strengths.push(`Experience added: ${profile.experience}`);
        } else {
            improvements.push("Add experience details");
        }

        if (profile.linkedin) {
            score += 8;
            strengths.push("LinkedIn profile added");
        } else {
            improvements.push("Add LinkedIn profile");
        }

        if (profile.github) {
            score += 8;
            strengths.push("GitHub / portfolio added");
        } else {
            improvements.push("Add GitHub or portfolio link");
        }

        if (profile.qualification) {
            score += 8;
            strengths.push(`Qualification added: ${profile.qualification}`);
        } else {
            improvements.push("Add highest qualification");
        }

        if (profile.college) score += 8;
        else improvements.push("Add college / university");

        let skillCount = 0;

        if (profile.skills) {
            skillCount = String(profile.skills)
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean).length;

            score += Math.min(skillCount * 3, 15);

            if (skillCount >= 5) {
                strengths.push(`Strong skill stack with ${skillCount} skills`);
            } else {
                improvements.push("Add more role-specific skills");
            }
        } else {
            improvements.push("Add technical skills");
        }

        if (profile.summary) {
            score += 15;
            strengths.push("Professional summary available");
        } else {
            improvements.push("Improve professional summary");
        }

        score = Math.min(score, 100);

        let quality = "C";
        let message = "Profile needs improvement";

        if (score >= 85) {
            quality = "A+";
            message = "Excellent job-ready profile";
        } else if (score >= 70) {
            quality = "A";
            message = "Good job-ready profile";
        } else if (score >= 50) {
            quality = "B";
            message = "Profile is moderate";
        }

        if (currentPlan === "pro" || currentPlan === "premium") {
            if (skillCount < 8) {
                proInsights.push(
                    "Your skill stack can be expanded with more role-targeted technologies."
                );
            }

            if (!profile.summary) {
                proInsights.push(
                    "A stronger ATS-friendly summary can significantly improve recruiter matching."
                );
            }

            if (!profile.linkedin || !profile.github) {
                proInsights.push(
                    "Portfolio + LinkedIn together can improve recruiter trust and profile depth."
                );
            }

            if (score >= 70) {
                proInsights.push(
                    "Your profile is competitive for AI-powered premium recommendations."
                );
            }
        }

        if (currentPlan === "premium") {
            proInsights.push(
                "Premium roadmap suggests focusing on advanced projects, quantified achievements, and interview preparation."
            );

            proInsights.push(
                "Premium users should target salary-aligned applications and role-specific ATS optimization."
            );
        }

        return {
            score,
            quality,
            message,
            strengths:
                strengths.length > 0 ? strengths : ["Basic profile created"],
            improvements:
                improvements.length > 0
                    ? improvements
                    : ["Your profile looks well optimized"],
            proInsights,
        };
    };

    const loadAnalysis = async () => {
        if (!user?.email) {
            setAnalysis({
                score: 0,
                quality: "C",
                message: "Please login again",
                strengths: ["Secure candidate dashboard loaded"],
                improvements: ["User session not found. Please login again."],
                proInsights: [],
            });

            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const [profileResponse, subscriptionResponse] = await Promise.allSettled([
                getCandidateProfile(user.email),
                getCurrentSubscription(),
            ]);

            const profile =
                profileResponse.status === "fulfilled"
                    ? profileResponse.value?.profile || {}
                    : {};

            const subscriptionData =
                subscriptionResponse.status === "fulfilled"
                    ? subscriptionResponse.value
                    : null;

            setSubscription(subscriptionData);

            const currentPlan =
                subscriptionData?.currentPlan || "free";

            const result = calculateAnalysis(profile, currentPlan);

            setAnalysis(result);
        } catch (error) {
            console.log("Could not load profile analysis", error);

            setAnalysis({
                score: 0,
                quality: "C",
                message: "Complete your profile first",
                strengths: ["Account authenticated successfully"],
                improvements: [
                    "Complete your profile",
                    "Add your skills",
                    "Upload your resume",
                    "Add a professional summary",
                ],
                proInsights: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalysis();
    }, [user]);

    const currentPlan = subscription?.currentPlan || "free";

    return (
        <DashboardLayout role="candidate">
            <section className="mb-8">
                <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
                    <p className="text-cyan-400 font-semibold uppercase tracking-wider">
                        AI Profile Analysis
                    </p>

                    <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
                        Understand Your
                        <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Career Strength
                        </span>
                    </h1>

                    <p className="text-slate-300 mt-4 max-w-2xl">
                        Get profile score, ATS-style strengths, improvements, and plan-based
                        AI career insights.
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
                    <Loader text="Analyzing your profile with AI..." />
                </div>
            ) : (
                <>
                    <section className="grid lg:grid-cols-4 gap-6 mb-8">
                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            <Brain className="text-cyan-400 mb-4" size={38} />
                            <p className="text-slate-400">Profile Score</p>
                            <h2 className="text-5xl font-extrabold mt-2">
                                {analysis?.score || 0}%
                            </h2>
                            <p className="text-green-400 mt-3">
                                {analysis?.message}
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            <Star className="text-purple-400 mb-4" size={38} />
                            <p className="text-slate-400">Resume Quality</p>
                            <h2 className="text-5xl font-extrabold mt-2">
                                {analysis?.quality || "C"}
                            </h2>
                            <p className="text-slate-300 mt-3">
                                Based on profile completeness
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            <Crown className="text-yellow-400 mb-4" size={38} />
                            <p className="text-slate-400">Current Plan</p>
                            <h2 className="text-3xl font-extrabold mt-2 capitalize">
                                {currentPlan}
                            </h2>
                            <p className="text-slate-300 mt-3">
                                {currentPlan === "free"
                                    ? "Basic AI only"
                                    : currentPlan === "pro"
                                        ? "Advanced AI enabled"
                                        : "Premium intelligence"}
                            </p>
                        </div>

                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            {currentPlan === "free" ? (
                                <>
                                    <Lock className="text-yellow-400 mb-4" size={38} />
                                    <p className="text-slate-400">Advanced AI Insights</p>
                                    <h2 className="text-2xl font-extrabold mt-2">
                                        Locked
                                    </h2>
                                    <p className="text-slate-300 mt-3">
                                        Upgrade for deeper analysis
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="text-cyan-400 mb-4" size={38} />
                                    <p className="text-slate-400">Advanced AI Insights</p>
                                    <h2 className="text-2xl font-extrabold mt-2">
                                        Active
                                    </h2>
                                    <p className="text-slate-300 mt-3">
                                        Premium analysis unlocked
                                    </p>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="grid lg:grid-cols-2 gap-6">
                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            <h2 className="text-2xl font-extrabold mb-5">
                                Strengths
                            </h2>

                            <div className="space-y-4">
                                {(analysis?.strengths || []).map((item) => (
                                    <div key={item} className="flex gap-3 text-slate-300">
                                        <CheckCircle
                                            className="text-green-400 shrink-0"
                                            size={22}
                                        />
                                        <p>{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6">
                            <h2 className="text-2xl font-extrabold mb-5">
                                Improve These
                            </h2>

                            <div className="space-y-4">
                                {(analysis?.improvements || []).map((item) => (
                                    <div key={item} className="flex gap-3 text-slate-300">
                                        <AlertTriangle
                                            className="text-yellow-400 shrink-0"
                                            size={22}
                                        />
                                        <p>{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {currentPlan !== "free" && (
                        <section className="mt-8">
                            <div className="rounded-[2rem] bg-slate-900/70 border border-cyan-400/20 p-6">
                                <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2">
                                    <Sparkles className="text-cyan-400" size={24} />
                                    {currentPlan === "premium"
                                        ? "Premium Career Intelligence"
                                        : "Pro AI Insights"}
                                </h2>

                                <div className="space-y-4">
                                    {(analysis?.proInsights || []).map((item) => (
                                        <div key={item} className="flex gap-3 text-slate-300">
                                            <CheckCircle
                                                className="text-cyan-400 shrink-0"
                                                size={22}
                                            />
                                            <p>{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {currentPlan === "free" && (
                        <section className="mt-8">
                            <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-500/10 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-extrabold flex items-center gap-2">
                                        <Crown className="text-yellow-400" size={26} />
                                        Unlock Pro AI Analysis
                                    </h2>

                                    <p className="text-slate-300 mt-2">
                                        Get advanced ATS insights, role-specific improvements,
                                        deeper AI analysis, and premium career roadmap.
                                    </p>
                                </div>

                                <Link
                                    to="/candidate/subscription"
                                    className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition text-center"
                                >
                                    Upgrade Now
                                </Link>
                            </div>
                        </section>
                    )}

                    <section className="mt-8 flex justify-end">
                        <button
                            onClick={loadAnalysis}
                            className="px-6 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center gap-2"
                        >
                            <RefreshCcw size={18} />
                            Refresh Analysis
                        </button>
                    </section>
                </>
            )}
        </DashboardLayout>
    );
}