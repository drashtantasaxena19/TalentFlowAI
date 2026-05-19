import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Users,
    ShieldCheck,
    Ban,
    Trash2,
    RefreshCw,
    Crown,
    FileCheck2,
    UserPlus,
    X,
    Eye,
    EyeOff,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/common/Loader";
import {
    createAdminUser,
    deleteAdminUser,
    getAdminUsers,
    updateAdminUserStatus,
} from "../../services/adminApi";

const roleOptions = [
    { label: "All Roles", value: "all" },
    { label: "Candidates", value: "candidate" },
    { label: "Employers", value: "employer" },
    { label: "Admins", value: "admin" },
];

const initialAdminForm = {
    name: "",
    email: "",
    password: "",
};

const getRoleClass = (role) => {
    if (role === "admin") {
        return "border-orange-400/30 bg-orange-500/10 text-orange-300";
    }

    if (role === "employer") {
        return "border-blue-400/30 bg-blue-500/10 text-blue-300";
    }

    return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
};

const getStatusClass = (isActive) => {
    if (isActive === false) {
        return "border-red-400/30 bg-red-500/10 text-red-300";
    }

    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
};

const getPlanName = (user) => {
    return user?.subscription?.plan || "free";
};

export default function ManageUsers() {
    const [users, setUsers] = useState([]);
    const [role, setRole] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [adminForm, setAdminForm] = useState(initialAdminForm);
    const [adminError, setAdminError] = useState("");
    const [adminSuccess, setAdminSuccess] = useState("");
    const [creatingAdmin, setCreatingAdmin] = useState(false);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminUsers({ role, search });
            setUsers(data.users || []);
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                "Unable to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadUsers, 350);
        return () => clearTimeout(timer);
    }, [role, search]);

    const summary = useMemo(() => {
        return {
            total: users.length,
            active: users.filter((user) => user.isActive !== false).length,
            blocked: users.filter((user) => user.isActive === false).length,
            paid: users.filter((user) => {
                const plan = getPlanName(user);
                return !["free", "employer_free", "", null, undefined].includes(plan);
            }).length,
        };
    }, [users]);

    const handleToggleStatus = async (user) => {
        const nextStatus = user.isActive === false;

        try {
            setActionLoading(user.email);
            await updateAdminUserStatus(user.email, nextStatus);
            await loadUsers();
        } catch (err) {
            alert(err?.response?.data?.detail || "Unable to update user status.");
        } finally {
            setActionLoading("");
        }
    };

    const handleDelete = async (user) => {
        const ok = window.confirm(
            `Delete ${user.name || user.email}? This action cannot be undone.`
        );

        if (!ok) return;

        try {
            setActionLoading(user.email);
            await deleteAdminUser(user.email);
            await loadUsers();
        } catch (err) {
            alert(err?.response?.data?.detail || "Unable to delete user.");
        } finally {
            setActionLoading("");
        }
    };

    const openCreateAdminModal = () => {
        setAdminForm(initialAdminForm);
        setAdminError("");
        setAdminSuccess("");
        setShowPassword(false);
        setShowAdminModal(true);
    };

    const closeCreateAdminModal = () => {
        if (creatingAdmin) return;
        setShowAdminModal(false);
    };

    const handleAdminInput = (field, value) => {
        setAdminForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();

        setAdminError("");
        setAdminSuccess("");

        const name = adminForm.name.trim();
        const email = adminForm.email.trim().toLowerCase();
        const password = adminForm.password;

        if (!name || !email || !password) {
            setAdminError("Name, email and password are required.");
            return;
        }

        if (password.length < 8) {
            setAdminError("Password must be at least 8 characters.");
            return;
        }

        try {
            setCreatingAdmin(true);

            await createAdminUser({
                name,
                email,
                password,
            });

            setAdminSuccess("Admin user created successfully.");
            setAdminForm(initialAdminForm);

            await loadUsers();

            setTimeout(() => {
                setShowAdminModal(false);
                setAdminSuccess("");
            }, 700);
        } catch (err) {
            setAdminError(
                err?.response?.data?.detail ||
                "Unable to create admin user."
            );
        } finally {
            setCreatingAdmin(false);
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-orange-500/10 via-cyan-500/10 to-blue-500/10 p-6 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="text-cyan-400" size={32} />

                            <div>
                                <h1 className="text-3xl font-extrabold">
                                    Manage Users
                                </h1>

                                <p className="mt-1 text-slate-400">
                                    Search, filter, block, unblock, delete users, and create secure admin accounts.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={openCreateAdminModal}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
                            >
                                <UserPlus size={16} />
                                Create Admin
                            </button>

                            <button
                                onClick={loadUsers}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                        <p className="text-sm text-slate-400">Loaded Users</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.total}</h2>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                        <p className="text-sm text-emerald-300">Active</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.active}</h2>
                    </div>

                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
                        <p className="text-sm text-red-300">Blocked</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.blocked}</h2>
                    </div>

                    <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-5">
                        <p className="text-sm text-orange-300">Paid Plans</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.paid}</h2>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-xl">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, email, company..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400"
                            />
                        </div>

                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                        >
                            {roleOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <Loader text="Loading users..." />
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-sm text-slate-400">
                                        <th className="pb-4">User</th>
                                        <th className="pb-4">Role</th>
                                        <th className="pb-4">Subscription</th>
                                        <th className="pb-4">Profile / Resume</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="py-10 text-center text-slate-500"
                                            >
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => {
                                            const plan = getPlanName(user);
                                            const profileReady = Boolean(
                                                user.candidateProfile &&
                                                Object.keys(user.candidateProfile).length > 0
                                            );

                                            return (
                                                <tr
                                                    key={user._id || user.email}
                                                    className="border-b border-slate-800/80 text-sm transition hover:bg-slate-800/30"
                                                >
                                                    <td className="py-4">
                                                        <h3 className="font-semibold text-white">
                                                            {user.name || "Unnamed User"}
                                                        </h3>

                                                        <p className="mt-1 text-slate-400">
                                                            {user.email}
                                                        </p>

                                                        {user.companyName && (
                                                            <p className="mt-1 text-xs text-cyan-300">
                                                                {user.companyName}
                                                            </p>
                                                        )}
                                                    </td>

                                                    <td className="py-4">
                                                        <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getRoleClass(user.role)}`}>
                                                            {user.role || "user"}
                                                        </span>
                                                    </td>

                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <Crown size={15} className="text-orange-400" />
                                                            <span className="capitalize">
                                                                {String(plan).replaceAll("_", " ")}
                                                            </span>
                                                        </div>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {user.subscription?.status || "active"}
                                                        </p>
                                                    </td>

                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <FileCheck2 size={15} className="text-cyan-400" />

                                                            {user.role === "candidate"
                                                                ? profileReady
                                                                    ? "Profile available"
                                                                    : "Profile pending"
                                                                : "Not required"}
                                                        </div>
                                                    </td>

                                                    <td className="py-4">
                                                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(user.isActive)}`}>
                                                            {user.isActive === false ? "Blocked" : "Active"}
                                                        </span>
                                                    </td>

                                                    <td className="py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                disabled={actionLoading === user.email}
                                                                onClick={() => handleToggleStatus(user)}
                                                                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                                                                    user.isActive === false
                                                                        ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                                                        : "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                                                                }`}
                                                            >
                                                                {user.isActive === false ? (
                                                                    <ShieldCheck size={15} />
                                                                ) : (
                                                                    <Ban size={15} />
                                                                )}

                                                                {user.isActive === false ? "Unblock" : "Block"}
                                                            </button>

                                                            <button
                                                                disabled={actionLoading === user.email}
                                                                onClick={() => handleDelete(user)}
                                                                className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                                                            >
                                                                <Trash2 size={15} />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showAdminModal && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-xl rounded-[2rem] border border-slate-700 bg-slate-950 p-6 shadow-2xl">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-500/10">
                                        <UserPlus className="text-cyan-400" size={24} />
                                    </div>

                                    <h2 className="text-2xl font-bold text-white">
                                        Create Admin User
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Only existing admins can create another admin account.
                                    </p>
                                </div>

                                <button
                                    onClick={closeCreateAdminModal}
                                    disabled={creatingAdmin}
                                    className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:border-red-400 hover:text-red-300 disabled:opacity-60"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {adminError && (
                                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                    {adminError}
                                </div>
                            )}

                            {adminSuccess && (
                                <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                                    {adminSuccess}
                                </div>
                            )}

                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                                        Admin Name
                                    </label>

                                    <input
                                        value={adminForm.name}
                                        onChange={(e) => handleAdminInput("name", e.target.value)}
                                        placeholder="TalentFlow Admin"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                                        Admin Email
                                    </label>

                                    <input
                                        type="email"
                                        value={adminForm.email}
                                        onChange={(e) => handleAdminInput("email", e.target.value)}
                                        placeholder="admin@talentflow.ai"
                                        className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={adminForm.password}
                                            onChange={(e) => handleAdminInput("password", e.target.value)}
                                            placeholder="Minimum 8 characters"
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 pr-12 text-white outline-none transition focus:border-cyan-400"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <p className="mt-2 text-xs text-slate-500">
                                        Public signup cannot create admin accounts.
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={closeCreateAdminModal}
                                        disabled={creatingAdmin}
                                        className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900 disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={creatingAdmin}
                                        className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <UserPlus size={16} />
                                        {creatingAdmin ? "Creating..." : "Create Admin"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}