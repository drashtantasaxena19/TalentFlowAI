import { Search } from "lucide-react";

const users = [
    {
        name: "Aarav Sharma",
        email: "aarav@email.com",
        role: "Candidate",
        status: "Active",
    },
    {
        name: "Riya Verma",
        email: "riya@company.com",
        role: "Employer",
        status: "Active",
    },
    {
        name: "Kabir Khan",
        email: "kabir@email.com",
        role: "Candidate",
        status: "Pending",
    },
];

export default function UserManage() {
    const getRoleClass = (role) => {
        if (role === "Employer") {
            return "bg-purple-500/10 text-purple-300 border-purple-500/20";
        }

        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    };

    const getStatusClass = (status) => {
        if (status === "Active") {
            return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
        }

        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
    };

    return (
        <div className="rounded-[2rem] bg-slate-900/75 border border-slate-800 p-6 shadow-xl">
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 mb-5">
                <Search className="text-cyan-400" size={20} />

                <input
                    placeholder="Search users..."
                    className="w-full bg-transparent outline-none text-white"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-800">
                            <th className="py-3">Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {users.map((user) => (
                            <tr
                                key={user.email}
                                className="border-b border-slate-800 text-slate-300"
                            >
                                <td className="py-4 font-semibold text-white">
                                    {user.name}
                                </td>

                                <td>{user.email}</td>

                                <td>
                                    <span
                                        className={`px-3 py-1 rounded-full border text-sm font-semibold ${getRoleClass(
                                            user.role
                                        )}`}
                                    >
                                        {user.role}
                                    </span>
                                </td>

                                <td>
                                    <span
                                        className={`px-3 py-1 rounded-full border text-sm font-semibold ${getStatusClass(
                                            user.status
                                        )}`}
                                    >
                                        {user.status}
                                    </span>
                                </td>

                                <td>
                                    <div className="flex justify-end gap-2">
                                        <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition">
                                            View
                                        </button>

                                        <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20 transition">
                                            Block
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}