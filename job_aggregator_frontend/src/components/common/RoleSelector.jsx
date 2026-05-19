import { Briefcase, Building2 } from "lucide-react";

const roles = [
    {
        id: "candidate",
        title: "Candidate",
        subtitle: "Find jobs, build profile, and grow career",
        icon: Briefcase,
    },
    {
        id: "employer",
        title: "Employer",
        subtitle: "Post jobs, hire talent, and manage hiring",
        icon: Building2,
    },
];

export default function RoleSelector({
    selectedRole = "candidate",
    onRoleChange,
}) {
    return (
        <div className="grid sm:grid-cols-2 gap-4">
            {roles.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.id;

                return (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => onRoleChange(role.id)}
                        className={`text-left rounded-[2rem] border p-5 transition-all ${
                            active
                                ? "border-cyan-400 bg-cyan-500/10 shadow-lg"
                                : "border-slate-800 bg-slate-900/60 hover:border-cyan-400/40 hover:bg-slate-900"
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                                    active
                                        ? "bg-cyan-500/15 border-cyan-400/30"
                                        : "bg-slate-950 border-slate-800"
                                }`}
                            >
                                <Icon
                                    size={26}
                                    className={
                                        active
                                            ? "text-cyan-400"
                                            : "text-slate-300"
                                    }
                                />
                            </div>

                            <div>
                                <h3
                                    className={`text-lg font-bold ${
                                        active
                                            ? "text-white"
                                            : "text-slate-200"
                                    }`}
                                >
                                    {role.title}
                                </h3>

                                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                                    {role.subtitle}
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}