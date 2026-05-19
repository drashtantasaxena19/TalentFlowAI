import { useEffect, useMemo, useState } from "react";
import {
    Trophy,
    Brain,
    Star,
    Users,
    Cpu,
    Sparkles,
    Search,
    RefreshCw,
    AlertCircle,
    BarChart3,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import CandidateRankingCard from "../../components/employer/CandidateRankingCard";
import { getEmployerApplicants } from "../../services/employerApi";

export default function CandidateRanking() {
    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({
        totalApplicants: 0,
        shortlisted: 0,
        pendingReview: 0,
        strongMatches: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [scoreFilter, setScoreFilter] = useState("all");

    const loadRankings = async (silent = false) => {
        try {
            silent ? setRefreshing(true) : setLoading(true);
            setError("");

            const res = await getEmployerApplicants();

            const sorted = [...(res?.applicants || [])].sort(
                (a, b) =>
                    Number(b.matchScore || b.score || 0) -
                    Number(a.matchScore || a.score || 0)
            );

            setCandidates(sorted);
            setStats(
                res?.stats || {
                    totalApplicants: sorted.length,
                    shortlisted: 0,
                    pendingReview: 0,
                    strongMatches: sorted.filter(
                        (item) => Number(item.matchScore || item.score || 0) >= 80
                    ).length,
                }
            );
        } catch (err) {
            setError(err?.response?.data?.detail || "Failed to load candidate rankings");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRankings();
    }, []);

    const filteredCandidates = useMemo(() => {
        const q = search.trim().toLowerCase();

        return candidates.filter((candidate) => {
            const score = Number(candidate.matchScore || candidate.score || 0);

            const matchesScore =
                scoreFilter === "all"
                    ? true
                    : scoreFilter === "top"
                    ? score >= 85
                    : scoreFilter === "strong"
                    ? score >= 70 && score < 85
                    : score < 70;

            const skills = Array.isArray(candidate.skills)
                ? candidate.skills.join(" ")
                : candidate.skills || "";

            const haystack = [
                candidate.name,
                candidate.candidateName,
                candidate.fullName,
                candidate.email,
                candidate.candidateEmail,
                candidate.role,
                candidate.detectedRole,
                candidate.currentRole,
                candidate.jobTitle,
                candidate.recommendation,
                candidate.aiStatus,
                skills,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = q ? haystack.includes(q) : true;

            return matchesScore && matchesSearch;
        });
    }, [candidates, search, scoreFilter]);

    const averageScore = useMemo(() => {
        if (!candidates.length) return 0;

        const total = candidates.reduce(
            (sum, item) => sum + Number(item.matchScore || item.score || 0),
            0
        );

        return Math.round(total / candidates.length);
    }, [candidates]);

    const statCards = [
        {
            title: "Candidates Analyzed",
            value: stats.totalApplicants || candidates.length,
            icon: Users,
            color: "text-orange-300",
        },
        {
            title: "Top Ranked",
            value: filteredCandidates.filter(
                (item) => Number(item.matchScore || item.score || 0) >= 85
            ).length,
            icon: Trophy,
            color: "text-emerald-300",
        },
        {
            title: "Strong Matches",
            value: stats.strongMatches || 0,
            icon: Star,
            color: "text-cyan-300",
        },
        {
            title: "Average Match",
            value: `${averageScore}%`,
            icon: BarChart3,
            color: "text-slate-300",
        },
    ];

    return (
        <DashboardLayout role="employer">
            <div className="space-y-6">
                <div className="overflow-hidden rounded-[2rem] border border-orange-400/20 bg-slate-950/80 shadow-2xl">
                    <div className="relative p-5 sm:p-6 lg:p-8">
                        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
                        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">
                                    <Cpu className="text-orange-300" size={28} />
                                </div>

                                <div>
                                    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                                        <Sparkles size={16} />
                                        AI Talent Ranking
                                    </p>

                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                                        Candidate Ranking Dashboard
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                                        Discover top AI-ranked applicants based on skills, resume quality,
                                        profile strength, and job match score.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <Brain className="text-cyan-300" size={28} />
                                    <div>
                                        <p className="text-sm text-slate-400">AI Matching</p>
                                        <h3 className="font-bold text-white">Groq → Gemini Active</h3>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => loadRankings(true)}
                                disabled={refreshing}
                                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-orange-400/60 hover:text-orange-200 disabled:opacity-60"
                            >
                                <RefreshCw
                                    size={18}
                                    className={refreshing ? "animate-spin" : ""}
                                />
                                {refreshing ? "Refreshing..." : "Refresh Ranking"}
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">
                        <AlertCircle className="mt-0.5 shrink-0" size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="rounded-[1.5rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl"
                            >
                                <Icon className={`mb-3 ${item.color}`} size={28} />
                                <p className="text-sm text-slate-400">{item.title}</p>
                                <h2 className="mt-1 text-3xl font-black text-white">
                                    {item.value}
                                </h2>
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 lg:min-w-[380px]">
                            <Search className="shrink-0 text-orange-300" size={18} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search candidate, job, skill, email..."
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {[
                                ["all", "All"],
                                ["top", "Top 85%+"],
                                ["strong", "Strong 70-84%"],
                                ["review", "Review <70%"],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setScoreFilter(value)}
                                    className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                                        scoreFilter === value
                                            ? "border-orange-400/40 bg-orange-500/10 text-orange-200"
                                            : "border-slate-700 bg-slate-950/80 text-slate-300 hover:border-orange-400/50 hover:text-orange-200"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl sm:p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white">
                                Top Recommended Candidates
                            </h2>
                            <p className="text-sm text-slate-400">
                                Showing {filteredCandidates.length} ranked candidate(s)
                            </p>
                        </div>

                        <Trophy className="text-orange-300" size={30} />
                    </div>

                    {loading ? (
                        <div className="flex min-h-[260px] items-center justify-center text-slate-400">
                            Loading AI-ranked candidates...
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="py-14 text-center">
                            <Users className="mx-auto mb-4 text-orange-300" size={44} />
                            <h2 className="text-2xl font-black text-white">
                                No ranked candidates found
                            </h2>
                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                                Candidate rankings will appear after applicants apply to your jobs.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCandidates.map((candidate, index) => (
                                <CandidateRankingCard
                                    key={candidate._id || `${candidate.email}-${candidate.jobId}`}
                                    candidate={candidate}
                                    rank={index + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}