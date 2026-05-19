import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Crown,
    Rocket,
    ShieldCheck,
    Sparkles,
    Zap,
    AlertCircle,
    Loader2,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
    getCurrentSubscription,
    upgradeSubscription,
} from "../../services/subscriptionApi";
import {
    createSubscriptionOrder,
    verifySubscriptionPayment,
} from "../../services/paymentApi";

const plans = [
    {
        id: "employer_free",
        name: "Free Hiring",
        price: "Free",
        description: "Start hiring without payment. Best for new companies and startups.",
        icon: Rocket,
        badge: "Free Forever",
        features: [
            "Post up to 2 active jobs",
            "Receive applications",
            "Limited applicant details",
            "Basic job management",
            "Manual candidate review",
        ],
        highlighted: false,
    },
    {
        id: "employer_pro",
        name: "Smart Hiring Pro",
        price: "₹999/month",
        description: "Upgrade for AI-powered hiring and smarter shortlisting.",
        icon: Zap,
        badge: "Recommended",
        features: [
            "Post up to 15 active jobs",
            "AI candidate ranking",
            "Resume match score",
            "Advanced applicant filters",
            "Priority job visibility",
            "Hiring analytics",
        ],
        highlighted: true,
    },
    {
        id: "employer_enterprise",
        name: "Enterprise Hiring",
        price: "Custom Pricing",
        description: "For large teams. Pricing depends on hiring volume and features.",
        icon: Crown,
        badge: "For Teams",
        features: [
            "Unlimited job posts",
            "Full AI hiring automation",
            "Bulk shortlisting",
            "Premium company branding",
            "Dedicated insights",
            "Custom support",
        ],
        highlighted: false,
    },
];

function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function EmployeeSubscriptionPlans() {
    const [subscription, setSubscription] = useState(null);
    const [currentPlan, setCurrentPlan] = useState("employer_free");
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState("");
    const [message, setMessage] = useState(null);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const res = await getCurrentSubscription();

            setSubscription(res);
            setCurrentPlan(res?.currentPlan || "employer_free");
        } catch (err) {
            setMessage({
                type: "error",
                text: err?.response?.data?.detail || "Failed to load subscription",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscription();
    }, []);

    const handleFreePlan = async () => {
        try {
            setProcessingPlan("employer_free");
            const res = await upgradeSubscription("employer_free");

            setCurrentPlan(res?.currentPlan || "employer_free");
            setMessage({
                type: "success",
                text: "Free Hiring plan activated.",
            });

            await loadSubscription();
        } catch (err) {
            setMessage({
                type: "error",
                text: err?.response?.data?.detail || "Could not activate Free plan",
            });
        } finally {
            setProcessingPlan("");
        }
    };

    const handleEnterprise = () => {
        setMessage({
            type: "success",
            text: "Enterprise request noted. Add contact/sales workflow later.",
        });
    };

    const handlePaidPlan = async (planId) => {
        try {
            setProcessingPlan(planId);
            setMessage(null);

            const loaded = await loadRazorpayScript();
            if (!loaded) {
                setMessage({
                    type: "error",
                    text: "Razorpay SDK failed to load. Check internet connection.",
                });
                setProcessingPlan("");
                return;
            }

            const orderRes = await createSubscriptionOrder(planId);

            const options = {
                key: orderRes.key,
                amount: orderRes.order.amount,
                currency: orderRes.order.currency,
                name: "TalentFlow AI",
                description: orderRes.plan.displayName,
                order_id: orderRes.order.id,
                handler: async (response) => {
                    try {
                        const verifyRes = await verifySubscriptionPayment({
                            plan: planId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        setCurrentPlan(verifyRes?.currentPlan || planId);
                        setMessage({
                            type: "success",
                            text:
                                verifyRes?.message ||
                                "Subscription upgraded successfully.",
                        });

                        await loadSubscription();
                    } catch (err) {
                        setMessage({
                            type: "error",
                            text:
                                err?.response?.data?.detail ||
                                "Payment verification failed",
                        });
                    } finally {
                        setProcessingPlan("");
                    }
                },
                modal: {
                    ondismiss: () => {
                        setProcessingPlan("");
                    },
                },
                theme: {
                    color: "#f97316",
                },
            };

            const razorpay = new window.Razorpay(options);

            razorpay.on("payment.failed", function () {
                setMessage({
                    type: "error",
                    text: "Payment failed or cancelled.",
                });
                setProcessingPlan("");
            });

            razorpay.open();
        } catch (err) {
            setMessage({
                type: "error",
                text: err?.response?.data?.detail || "Could not start payment",
            });
            setProcessingPlan("");
        }
    };

    const handlePlanAction = (plan) => {
        if (plan.id === currentPlan) return;

        if (plan.id === "employer_free") {
            handleFreePlan();
            return;
        }

        if (plan.id === "employer_enterprise") {
            handleEnterprise();
            return;
        }

        handlePaidPlan(plan.id);
    };

    const currentPlanName =
        subscription?.features?.name ||
        plans.find((plan) => plan.id === currentPlan)?.name ||
        "Free Hiring";

    return (
        <DashboardLayout role="employer">
            <div className="space-y-5">
                <div className="rounded-[2rem] border border-orange-400/20 bg-slate-950/80 p-5 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                                <Sparkles size={16} />
                                Employer SaaS Access
                            </p>

                            <h1 className="mt-2 text-3xl font-black text-white">
                                Employer Subscription
                            </h1>

                            <p className="mt-2 max-w-3xl text-slate-400">
                                Job posting is free. Upgrade for AI ranking, priority visibility,
                                advanced filters, and hiring analytics.
                            </p>
                        </div>

                        <div className="hidden rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 md:block">
                            <Sparkles className="text-orange-300" size={26} />
                        </div>
                    </div>
                </div>

                {message && (
                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 ${
                            message.type === "success"
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                : "border-red-400/30 bg-red-500/10 text-red-300"
                        }`}
                    >
                        <AlertCircle className="mt-0.5 shrink-0" size={20} />
                        <span>{message.text}</span>
                    </div>
                )}

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold">Current Plan</h2>

                            <p className="mt-1 text-sm text-slate-400">
                                {loading
                                    ? "Checking your current employer subscription..."
                                    : `Your company is currently using the ${currentPlanName} plan.`}
                            </p>
                        </div>

                        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                            {loading ? "Loading..." : `${currentPlanName} Active`}
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-3">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrent = currentPlan === plan.id;
                        const isProcessing = processingPlan === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`flex min-h-[500px] flex-col rounded-[2rem] border p-5 shadow-xl transition hover:-translate-y-1 ${
                                    plan.highlighted
                                        ? "border-orange-400/40 bg-orange-500/10"
                                        : "border-slate-800 bg-slate-900/75"
                                } ${isCurrent ? "ring-2 ring-emerald-400/40" : ""}`}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">
                                        <Icon className="text-orange-300" size={23} />
                                    </div>

                                    <span
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                            isCurrent
                                                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                                                : plan.highlighted
                                                ? "border-orange-400/30 bg-orange-500/15 text-orange-300"
                                                : "border-slate-700 bg-slate-800 text-slate-300"
                                        }`}
                                    >
                                        {isCurrent ? "Current" : plan.badge}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-extrabold">
                                    {plan.name}
                                </h3>

                                <p className="mt-2 min-h-[44px] text-sm text-slate-400">
                                    {plan.description}
                                </p>

                                <div className="mt-4">
                                    <span className="text-3xl font-black">
                                        {plan.price}
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-1 flex-col justify-between">
                                    <div className="space-y-2.5">
                                        {plan.features.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-start gap-3 text-sm text-slate-300"
                                            >
                                                <CheckCircle2
                                                    className="mt-0.5 shrink-0 text-orange-300"
                                                    size={16}
                                                />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isCurrent || isProcessing || loading}
                                        onClick={() => handlePlanAction(plan)}
                                        className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            plan.highlighted
                                                ? "bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 text-slate-950"
                                                : "border border-slate-700 text-slate-300 hover:border-orange-400 hover:text-orange-300"
                                        }`}
                                    >
                                        {isProcessing && (
                                            <Loader2
                                                className="animate-spin"
                                                size={18}
                                            />
                                        )}

                                        {isCurrent
                                            ? "Current Plan"
                                            : plan.id === "employer_enterprise"
                                            ? "Request Enterprise"
                                            : plan.id === "employer_free"
                                            ? "Activate Free"
                                            : "Upgrade to Pro"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">
                    <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10">
                            <ShieldCheck className="text-orange-300" size={22} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold">
                                TalentFlow AI Employer Policy
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Companies can post jobs for free. Paid plans unlock AI ranking,
                                priority promotion, resume match score, analytics, and bulk hiring.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}