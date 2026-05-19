import {
    Briefcase,
    FileText,
    TrendingUp,
    UserCircle,
} from "lucide-react";

export default function ProfileStrength({
    profileCompletion = 0,
    resumeScore = 0,
    recommendedJobsCount = 0,
    skillGrowth = "0%",
}) {
    const stats = [
        {
            title: "Profile Completion",
            value: `${profileCompletion}%`,
            icon: UserCircle,
            color: "text-cyan-400",
        },
        {
            title: "Resume Score",
            value: `${resumeScore}/100`,
            icon: FileText,
            color: "text-purple-400",
        },
        {
            title: "Recommended Jobs",
            value: recommendedJobsCount,
            icon: Briefcase,
            color: "text-green-400",
        },
        {
            title: "Skill Growth",
            value: skillGrowth,
            icon: TrendingUp,
            color: "text-yellow-400",
        },
    ];

    return (
        <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            {stats.map((item) => {
                const Icon = item.icon;

                return (
                    <div
                        key={item.title}
                        className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">{item.title}</p>

                                <h2 className="text-3xl font-extrabold mt-2">
                                    {item.value}
                                </h2>
                            </div>

                            <div className={item.color}>
                                <Icon size={34} />
                            </div>
                        </div>

                        {item.title === "Profile Completion" && (
                            <div className="w-full h-2 bg-slate-800 rounded-full mt-4 overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400 rounded-full transition-all"
                                    style={{ width: `${profileCompletion}%` }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    );
}