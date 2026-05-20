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
    upgradeSubscription,
} from "../../services/subscriptionApi";

import {
    createSubscriptionOrder,
    verifySubscriptionPayment,
} from "../../services/paymentApi";

import { useEmployerData } from "../../context/EmployerDataContext";

const plans = [
    {
        id: "employer_free",
        name: "Free Hiring",
        price: "Free",
        description:
            "Start hiring without payment. Best for startups and small companies.",
        icon: Rocket,
        badge: "Free Forever",
        features: [
            "Post up to 2 active jobs",
            "Receive applications",
            "Basic candidate management",
            "Manual hiring workflow",
            "Standard visibility",
        ],
        highlighted: false,
    },

    {
        id: "employer_pro",
        name: "Smart Hiring Pro",
        price: "₹999/month",
        description:
            "AI-powered hiring with advanced analytics and ranking.",
        icon: Zap,
        badge: "Recommended",
        features: [
            "Post up to 15 active jobs",
            "AI candidate ranking",
            "Resume match score",
            "Advanced applicant filters",
            "Priority visibility",
            "Hiring analytics",
        ],
        highlighted: true,
    },

    {
        id: "employer_enterprise",
        name: "Enterprise Hiring",
        price: "Custom Pricing",
        description:
            "Advanced enterprise hiring workflow with unlimited scale.",
        icon: Crown,
        badge: "Enterprise",
        features: [
            "Unlimited job posts",
            "Unlimited AI ranking",
            "Bulk candidate management",
            "Dedicated support",
            "Custom branding",
            "Enterprise analytics",
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

        const script =
            document.createElement("script");

        script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () =>
            resolve(true);

        script.onerror = () =>
            resolve(false);

        document.body.appendChild(script);

    });

}

export default function EmployeeSubscriptionPlans() {

    const {
        subscription,
        refreshSubscription,
    } = useEmployerData();

    const [loading, setLoading] =
        useState(true);

    const [processingPlan, setProcessingPlan] =
        useState("");

    const [message, setMessage] =
        useState(null);

    const currentPlan =
        subscription?.currentPlan ||
        "employer_free";

    useEffect(() => {

        loadSubscription();

    }, []);

    const loadSubscription =
        async () => {

            try {

                setLoading(true);

                await refreshSubscription();

            } catch (err) {

                setMessage({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Failed to load subscription",
                });

            } finally {

                setLoading(false);

            }

        };

    const handleFreePlan =
        async () => {

            try {

                setProcessingPlan(
                    "employer_free"
                );

                await upgradeSubscription(
                    "employer_free"
                );

                setMessage({
                    type: "success",
                    text:
                        "Free Hiring plan activated.",
                });

                await refreshSubscription({
                    force: true,
                });

            } catch (err) {

                setMessage({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Could not activate Free plan",
                });

            } finally {

                setProcessingPlan("");

            }

        };

    const handleEnterprise =
        () => {

            setMessage({
                type: "success",
                text:
                    "Enterprise contact workflow can be added later.",
            });

        };

    const handlePaidPlan =
        async (planId) => {

            try {

                setProcessingPlan(planId);

                const loaded =
                    await loadRazorpayScript();

                if (!loaded) {

                    setMessage({
                        type: "error",
                        text:
                            "Razorpay SDK failed to load.",
                    });

                    setProcessingPlan("");

                    return;

                }

                const orderRes =
                    await createSubscriptionOrder(
                        planId
                    );

                const options = {
                    key: orderRes.key,

                    amount:
                        orderRes.order.amount,

                    currency:
                        orderRes.order.currency,

                    name: "TalentFlow AI",

                    description:
                        orderRes.plan
                            .displayName,

                    order_id:
                        orderRes.order.id,

                    handler:
                        async (
                            response
                        ) => {

                            try {

                                await verifySubscriptionPayment(
                                    {
                                        plan: planId,

                                        razorpay_order_id:
                                            response.razorpay_order_id,

                                        razorpay_payment_id:
                                            response.razorpay_payment_id,

                                        razorpay_signature:
                                            response.razorpay_signature,
                                    }
                                );

                                setMessage({
                                    type: "success",
                                    text:
                                        "Subscription upgraded successfully.",
                                });

                                await refreshSubscription(
                                    {
                                        force: true,
                                    }
                                );

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

                const razorpay =
                    new window.Razorpay(
                        options
                    );

                razorpay.open();

            } catch (err) {

                setMessage({
                    type: "error",
                    text:
                        err?.response?.data?.detail ||
                        "Could not start payment",
                });

                setProcessingPlan("");

            }

        };

    const handlePlanAction =
        (plan) => {

            if (
                plan.id === currentPlan
            )
                return;

            if (
                plan.id ===
                "employer_free"
            ) {

                handleFreePlan();

                return;

            }

            if (
                plan.id ===
                "employer_enterprise"
            ) {

                handleEnterprise();

                return;

            }

            handlePaidPlan(plan.id);

        };

    const currentPlanName =
        subscription?.features?.name ||
        plans.find(
            (plan) =>
                plan.id === currentPlan
        )?.name ||
        "Free Hiring";

    return (

        <DashboardLayout role="employer">

            <div className="space-y-6">

                <div className="rounded-[2rem] border border-orange-400/20 bg-slate-950/80 p-6 shadow-2xl">

                    <div className="flex items-start justify-between gap-4">

                        <div>

                            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">

                                <Sparkles size={16} />

                                Employer SaaS Access

                            </p>

                            <h1 className="mt-2 text-3xl font-black text-white">

                                Employer Subscription

                            </h1>

                            <p className="mt-3 max-w-3xl text-slate-400">

                                Upgrade your employer workspace
                                with AI ranking,
                                hiring analytics,
                                premium visibility,
                                and enterprise features.

                            </p>

                        </div>

                    </div>

                </div>

                {message && (

                    <div
                        className={`flex items-start gap-3 rounded-2xl border p-4 ${
                            message.type ===
                            "success"
                                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                : "border-red-400/30 bg-red-500/10 text-red-300"
                        }`}
                    >

                        <AlertCircle
                            className="mt-0.5 shrink-0"
                            size={20}
                        />

                        <span>
                            {message.text}
                        </span>

                    </div>

                )}

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-5 shadow-xl">

                    <div className="flex items-center justify-between gap-4">

                        <div>

                            <h2 className="text-lg font-bold">

                                Current Plan

                            </h2>

                            <p className="mt-1 text-sm text-slate-400">

                                {loading
                                    ? "Loading current subscription..."
                                    : `Currently using ${currentPlanName}`}

                            </p>

                        </div>

                        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">

                            {loading
                                ? "Loading..."
                                : `${currentPlanName} Active`}

                        </div>

                    </div>

                </div>

                <div className="grid gap-6 xl:grid-cols-3">

                    {plans.map((plan) => {

                        const Icon =
                            plan.icon;

                        const isCurrent =
                            currentPlan ===
                            plan.id;

                        const isProcessing =
                            processingPlan ===
                            plan.id;

                        return (

                            <div
                                key={plan.id}
                                className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl transition ${
                                    plan.highlighted
                                        ? "border-cyan-400/30 bg-gradient-to-b from-cyan-500/10 to-slate-950"
                                        : "border-slate-800 bg-slate-900/75"
                                }`}
                            >

                                {plan.badge && (

                                    <div className="absolute right-4 top-4 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">

                                        {plan.badge}

                                    </div>

                                )}

                                <div className="mb-5 flex items-center gap-4">

                                    <div
                                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                                            plan.highlighted
                                                ? "bg-cyan-500/10 border border-cyan-400/30"
                                                : "bg-orange-500/10 border border-orange-400/20"
                                        }`}
                                    >

                                        <Icon
                                            size={28}
                                            className={
                                                plan.highlighted
                                                    ? "text-cyan-300"
                                                    : "text-orange-300"
                                            }
                                        />

                                    </div>

                                    <div>

                                        <h2 className="text-2xl font-black text-white">

                                            {plan.name}

                                        </h2>

                                        <p className="text-sm text-slate-400">

                                            {plan.price}

                                        </p>

                                    </div>

                                </div>

                                <p className="text-sm leading-relaxed text-slate-400">

                                    {plan.description}

                                </p>

                                <div className="mt-6 space-y-3">

                                    {plan.features.map(
                                        (
                                            feature
                                        ) => (

                                            <div
                                                key={
                                                    feature
                                                }
                                                className="flex items-start gap-3"
                                            >

                                                <CheckCircle2
                                                    className="mt-0.5 shrink-0 text-emerald-300"
                                                    size={18}
                                                />

                                                <span className="text-sm text-slate-300">

                                                    {
                                                        feature
                                                    }

                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        isCurrent ||
                                        isProcessing
                                    }
                                    onClick={() =>
                                        handlePlanAction(
                                            plan
                                        )
                                    }
                                    className={`mt-8 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${
                                        isCurrent
                                            ? "cursor-not-allowed border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                            : plan.highlighted
                                            ? "bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 text-slate-950 hover:scale-[1.01]"
                                            : "border border-slate-700 bg-slate-950 text-white hover:border-orange-400/40"
                                    }`}
                                >

                                    {isProcessing ? (

                                        <>

                                            <Loader2
                                                size={18}
                                                className="animate-spin"
                                            />

                                            Processing...

                                        </>

                                    ) : isCurrent ? (

                                        <>

                                            <ShieldCheck
                                                size={18}
                                            />

                                            Current Plan

                                        </>

                                    ) : (

                                        <>

                                            <Crown
                                                size={18}
                                            />

                                            Choose Plan

                                        </>

                                    )}

                                </button>

                            </div>

                        );

                    })}

                </div>

            </div>

        </DashboardLayout>

    );
}