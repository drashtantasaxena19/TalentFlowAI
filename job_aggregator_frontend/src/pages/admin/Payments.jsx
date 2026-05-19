import { useEffect, useMemo, useState } from "react";
import {
    IndianRupee,
    TrendingUp,
    Users,
    Building2,
    Search,
    RefreshCw,
    CreditCard,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/common/Loader";
import StatsCard from "../../components/admin/StatsCard";
import PaymentTable from "../../components/admin/PaymentTable";
import { getAdminPayments } from "../../services/adminApi";

const formatMoney = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({});
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminPayments({ search, role });

            setPayments(data.payments || []);
            setSummary(data.summary || {});
        } catch (err) {
            setError(
                err?.response?.data?.detail ||
                "Unable to load payment records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadPayments, 350);
        return () => clearTimeout(timer);
    }, [search, role]);

    const paymentStats = useMemo(() => {
        return [
            {
                title: "Total Revenue",
                value: formatMoney(summary.totalRevenue),
                icon: IndianRupee,
            },
            {
                title: "Candidate Revenue",
                value: formatMoney(summary.candidateRevenue),
                icon: Users,
            },
            {
                title: "Employer Revenue",
                value: formatMoney(summary.employerRevenue),
                icon: Building2,
            },
            {
                title: "Successful Payments",
                value: summary.successfulPayments || 0,
                icon: TrendingUp,
            },
        ];
    }, [summary]);

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-orange-500/10 via-cyan-500/10 to-blue-500/10 p-6 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                                Revenue Intelligence
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold">
                                Payments & Revenue
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Track candidate subscriptions, employer hiring plans, Razorpay records, and revenue performance.
                            </p>
                        </div>

                        <button
                            onClick={loadPayments}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    {paymentStats.map((item) => (
                        <StatsCard
                            key={item.title}
                            title={item.title}
                            value={item.value}
                            icon={item.icon}
                        />
                    ))}
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 text-xl font-bold">
                                <CreditCard className="text-cyan-400" size={22} />
                                Payment Records
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                {summary.totalPayments || payments.length || 0} transactions loaded.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    type="text"
                                    placeholder="Search email, plan, order ID..."
                                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400"
                                />
                            </div>

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                            >
                                <option value="all">All Roles</option>
                                <option value="candidate">Candidate</option>
                                <option value="employer">Employer</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <Loader text="Loading payment records..." />
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                            {error}
                        </div>
                    ) : (
                        <PaymentTable payments={payments} />
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}