import {
    CreditCard,
    Crown,
    Building2,
    CheckCircle2,
    XCircle,
    Clock,
} from "lucide-react";

const normalizeStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (["paid", "success", "captured", "verified"].includes(value)) {
        return "Success";
    }

    if (["failed", "cancelled"].includes(value)) {
        return "Failed";
    }

    return "Pending";
};

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

export default function PaymentTable({ payments = [] }) {
    const getStatusClass = (status) => {
        if (status === "Success") {
            return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
        }

        if (status === "Pending") {
            return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
        }

        return "bg-red-500/10 text-red-300 border-red-500/30";
    };

    const getRoleClass = (role) => {
        if (role === "employer") {
            return "bg-blue-500/10 text-blue-300 border-blue-500/30";
        }

        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
                <thead>
                    <tr className="border-b border-slate-800 text-sm text-slate-400">
                        <th className="pb-4">User</th>
                        <th className="pb-4">Role</th>
                        <th className="pb-4">Plan</th>
                        <th className="pb-4">Amount</th>
                        <th className="pb-4">Order ID</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Payment</th>
                    </tr>
                </thead>

                <tbody>
                    {payments.length === 0 ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="py-10 text-center text-slate-500"
                            >
                                No payment records found.
                            </td>
                        </tr>
                    ) : (
                        payments.map((payment) => {
                            const status = normalizeStatus(payment.status);

                            return (
                                <tr
                                    key={payment._id || payment.razorpay_order_id}
                                    className="border-b border-slate-800/70 text-sm transition hover:bg-slate-800/30"
                                >
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10">
                                                {payment.role === "employer" ? (
                                                    <Building2
                                                        className="text-blue-400"
                                                        size={18}
                                                    />
                                                ) : (
                                                    <CreditCard
                                                        className="text-cyan-400"
                                                        size={18}
                                                    />
                                                )}
                                            </div>

                                            <div>
                                                <span className="font-semibold text-white">
                                                    {payment.email || "Unknown user"}
                                                </span>

                                                {payment.razorpay_payment_id && (
                                                    <p className="mt-1 max-w-48 truncate text-xs text-slate-500">
                                                        {payment.razorpay_payment_id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getRoleClass(
                                                payment.role
                                            )}`}
                                        >
                                            {payment.role || "candidate"}
                                        </span>
                                    </td>

                                    <td className="py-4">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Crown
                                                size={15}
                                                className="text-orange-400"
                                            />

                                            <span className="capitalize">
                                                {String(payment.plan || "free").replaceAll("_", " ")}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="py-4 font-bold text-white">
                                        {formatMoney(payment.amount)}
                                    </td>

                                    <td className="py-4">
                                        <p className="max-w-52 truncate text-slate-400">
                                            {payment.razorpay_order_id || payment.receipt || "—"}
                                        </p>
                                    </td>

                                    <td className="py-4 text-slate-400">
                                        {formatDate(payment.createdAt)}
                                    </td>

                                    <td className="py-4">
                                        <span
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                status
                                            )}`}
                                        >
                                            {status}
                                        </span>
                                    </td>

                                    <td className="py-4">
                                        <div className="flex justify-end">
                                            {status === "Success" ? (
                                                <CheckCircle2
                                                    className="text-emerald-400"
                                                    size={18}
                                                />
                                            ) : status === "Pending" ? (
                                                <Clock
                                                    className="text-yellow-400"
                                                    size={18}
                                                />
                                            ) : (
                                                <XCircle
                                                    className="text-red-400"
                                                    size={18}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}