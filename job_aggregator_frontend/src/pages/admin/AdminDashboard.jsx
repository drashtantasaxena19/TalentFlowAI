import { useEffect, useState } from "react";
import {
    Users,
    Building2,
    Briefcase,
    CreditCard,
    UserCheck,
    UserCog,
    TrendingUp,
    Activity,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import StatsCard from "../../components/admin/StatsCard";
import Loader from "../../components/common/Loader";
import { getAdminDashboard } from "../../services/adminApi";

const formatMoney = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function AdminDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminDashboard();
            setDashboard(data);
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                "Unable to load admin dashboard."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const stats = dashboard?.stats || {};

    const statCards = [
        {
            title: "Total Users",
            value: stats.totalUsers || 0,
            icon: Users,
        },
        {
            title: "Candidates",
            value: stats.candidates || 0,
            icon: UserCheck,
        },
        {
            title: "Employers",
            value: stats.employers || 0,
            icon: Building2,
        },
        {
            title: "Active Subscriptions",
            value: stats.activeSubscriptions || 0,
            icon: UserCog,
        },
        {
            title: "Total Revenue",
            value: formatMoney(stats.revenue),
            icon: CreditCard,
        },
        {
            title: "Monthly Revenue",
            value: formatMoney(stats.monthlyRevenue),
            icon: TrendingUp,
        },
        {
            title: "Total Jobs",
            value: stats.totalJobs || 0,
            icon: Briefcase,
        },
        {
            title: "Active Jobs",
            value: stats.activeJobs || 0,
            icon: Activity,
        },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-orange-500/10 via-cyan-500/10 to-blue-500/10 p-6 shadow-xl">
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                        Enterprise Control Center
                    </p>

                    <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
                        Admin Dashboard
                    </h1>

                    <p className="mt-2 max-w-3xl text-slate-400">
                        Monitor users, employers, jobs, payments, subscriptions, and moderation signals from one secure admin workspace.
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                        <Loader text="Loading admin analytics..." />
                    </div>
                ) : error ? (
                    <div className="rounded-[2rem] border border-red-500/30 bg-red-500/10 p-6 text-red-300">
                        {error}
                    </div>
                ) : (
                    <>
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {statCards.map((item) => (
                                <StatsCard
                                    key={item.title}
                                    title={item.title}
                                    value={item.value}
                                    icon={item.icon}
                                />
                            ))}
                        </div>

                        <div className="grid gap-6 xl:grid-cols-2">
                            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            Recent Registrations
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Latest users joining TalentFlow AI.
                                        </p>
                                    </div>

                                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
                                        {stats.recentRegistrations || 0} this week
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {(dashboard?.recentUsers || []).length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No recent users found.
                                        </p>
                                    ) : (
                                        dashboard.recentUsers.map((user) => (
                                            <div
                                                key={user._id || user.email}
                                                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-white">
                                                        {user.name || user.email}
                                                    </h3>
                                                    <p className="text-sm text-slate-400">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-300">
                                                        {user.role || "user"}
                                                    </span>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        {formatDate(user.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5">
                                    <h2 className="text-xl font-bold">
                                        Recent Payments
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Latest Razorpay/subscription activity.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {(dashboard?.recentPayments || []).length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No payment records found.
                                        </p>
                                    ) : (
                                        dashboard.recentPayments.map((payment) => (
                                            <div
                                                key={payment._id || payment.razorpay_order_id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-white">
                                                        {payment.email || "Unknown user"}
                                                    </h3>
                                                    <p className="text-sm text-slate-400 capitalize">
                                                        {payment.plan || "Plan"} · {payment.role || "role"}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-bold text-white">
                                                        {formatMoney(payment.amount)}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {formatDate(payment.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}