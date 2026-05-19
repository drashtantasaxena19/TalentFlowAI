import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    Search,
    ShieldCheck,
    XCircle,
    Clock,
    RefreshCw,
    Crown,
    Briefcase,
    Mail,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import Loader from "../../components/common/Loader";
import {
    getAdminCompanies,
    updateCompanyVerification,
} from "../../services/adminApi";

const getStatusClass = (status) => {
    if (status === "verified") {
        return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    }

    if (status === "rejected") {
        return "border-red-400/30 bg-red-500/10 text-red-300";
    }

    return "border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
};

export default function ManageCompanies() {
    const [companies, setCompanies] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [error, setError] = useState("");

    const loadCompanies = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getAdminCompanies({ search, status });
            setCompanies(data.companies || []);
        } catch (err) {
            setError(err?.response?.data?.detail || "Unable to load companies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(loadCompanies, 350);
        return () => clearTimeout(timer);
    }, [search, status]);

    const summary = useMemo(() => {
        return {
            total: companies.length,
            verified: companies.filter((c) => c.status === "verified").length,
            pending: companies.filter((c) => c.status === "pending").length,
            rejected: companies.filter((c) => c.status === "rejected").length,
        };
    }, [companies]);

    const handleVerification = async (company, nextStatus) => {
        try {
            setActionLoading(`${company.employerEmail}-${nextStatus}`);
            await updateCompanyVerification(company.employerEmail, nextStatus);
            await loadCompanies();
        } catch (err) {
            alert(err?.response?.data?.detail || "Unable to update company status.");
        } finally {
            setActionLoading("");
        }
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-orange-500/10 via-cyan-500/10 to-blue-500/10 p-6 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="text-cyan-400" size={32} />

                            <div>
                                <h1 className="text-3xl font-extrabold">
                                    Manage Companies
                                </h1>

                                <p className="mt-1 text-slate-400">
                                    Verify employer companies, review owners, subscriptions, and active job volume.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={loadCompanies}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
                        <p className="text-sm text-slate-400">Loaded Companies</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.total}</h2>
                    </div>

                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                        <p className="text-sm text-emerald-300">Verified</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.verified}</h2>
                    </div>

                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5">
                        <p className="text-sm text-yellow-300">Pending</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.pending}</h2>
                    </div>

                    <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
                        <p className="text-sm text-red-300">Rejected</p>
                        <h2 className="mt-1 text-3xl font-black">{summary.rejected}</h2>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full lg:max-w-xl">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search company, owner, email..."
                                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-cyan-400"
                            />
                        </div>

                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                        >
                            <option value="all">All Status</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {loading ? (
                        <Loader text="Loading companies..." />
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                            {error}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-sm text-slate-400">
                                        <th className="pb-4">Company</th>
                                        <th className="pb-4">Owner</th>
                                        <th className="pb-4">Subscription</th>
                                        <th className="pb-4">Active Jobs</th>
                                        <th className="pb-4">Status</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {companies.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-10 text-center text-slate-500">
                                                No companies found.
                                            </td>
                                        </tr>
                                    ) : (
                                        companies.map((company) => (
                                            <tr
                                                key={company._id || company.employerEmail}
                                                className="border-b border-slate-800/80 text-sm transition hover:bg-slate-800/30"
                                            >
                                                <td className="py-4">
                                                    <h3 className="font-semibold text-white">
                                                        {company.companyName || "Unnamed Company"}
                                                    </h3>

                                                    <p className="mt-1 text-slate-400">
                                                        {company.industry || company.location || "No company details"}
                                                    </p>

                                                    {company.website && (
                                                        <p className="mt-1 max-w-64 truncate text-xs text-cyan-300">
                                                            {company.website}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="py-4">
                                                    <p className="font-semibold text-white">
                                                        {company.ownerName || "Employer"}
                                                    </p>

                                                    <p className="mt-1 flex items-center gap-2 text-slate-400">
                                                        <Mail size={14} />
                                                        {company.employerEmail || company.contactEmail}
                                                    </p>
                                                </td>

                                                <td className="py-4">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <Crown size={15} className="text-orange-400" />
                                                        <span className="capitalize">
                                                            {String(company.subscription?.plan || "employer_free").replaceAll("_", " ")}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-4">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <Briefcase size={15} className="text-cyan-400" />
                                                        {company.activeJobs || 0}
                                                    </div>
                                                </td>

                                                <td className="py-4">
                                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(company.status)}`}>
                                                        {company.status || "pending"}
                                                    </span>
                                                </td>

                                                <td className="py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            disabled={actionLoading === `${company.employerEmail}-verified`}
                                                            onClick={() => handleVerification(company, "verified")}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                                                        >
                                                            <ShieldCheck size={15} />
                                                            Approve
                                                        </button>

                                                        <button
                                                            disabled={actionLoading === `${company.employerEmail}-pending`}
                                                            onClick={() => handleVerification(company, "pending")}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/20 disabled:opacity-60"
                                                        >
                                                            <Clock size={15} />
                                                            Pending
                                                        </button>

                                                        <button
                                                            disabled={actionLoading === `${company.employerEmail}-rejected`}
                                                            onClick={() => handleVerification(company, "rejected")}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
                                                        >
                                                            <XCircle size={15} />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}