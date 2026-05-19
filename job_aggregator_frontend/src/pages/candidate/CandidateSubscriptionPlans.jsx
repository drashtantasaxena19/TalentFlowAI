import {
    CheckCircle2,
    Crown,
    Sparkles,
    Zap,
    ShieldCheck,
    Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
    getCurrentSubscription,
    cancelSubscription,
} from "../../services/subscriptionApi";
import {
    createSubscriptionOrder,
    verifySubscriptionPayment,
} from "../../services/paymentApi";

const plans = [
    {
        name: "free",
        displayName: "Free",
        price: "₹0",
        tag: "Starter",
        icon: Sparkles,
        badge: "Starter",
        features: [
            "Basic job recommendations",
            "Save up to 5 jobs",
            "Resume upload",
            "Basic profile completion",
            "Limited AI profile analysis",
        ],
    },
    {
        name: "pro",
        displayName: "Pro",
        price: "₹199",
        tag: "For active job seekers",
        icon: Zap,
        badge: "Recommended",
        features: [
            "Advanced AI job matching",
            "Unlimited saved jobs",
            "Detailed profile analysis",
            "Missing skills suggestions",
            "Priority recommendations",
            "Resume improvement tips",
        ],
    },
    {
        name: "premium",
        displayName: "Premium",
        price: "₹499",
        tag: "Maximum career boost",
        icon: Crown,
        badge: "Best Value",
        features: [
            "Everything in Pro",
            "AI resume booster",
            "Career roadmap",
            "Premium job alerts",
            "Early access jobs",
            "Interview insights",
        ],
    },
];

export default function CandidateSubscriptionPlans() {
    const [currentPlan, setCurrentPlan] = useState("free");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const response = await getCurrentSubscription();
            setCurrentPlan(response.currentPlan || "free");
        } catch (error) {
            console.error(error);
            setCurrentPlan("free");
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpayScript = () => {
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
    };

    const handlePaidUpgrade = async (plan) => {
        try {
            setActionLoading(plan);

            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {
                alert("Razorpay SDK failed to load.");
                return;
            }

            const orderResponse = await createSubscriptionOrder(plan);

            const options = {
                key: orderResponse.key,
                amount: orderResponse.order.amount,
                currency: orderResponse.order.currency,
                name: "TalentFlow AI",
                description: orderResponse.plan.displayName,
                order_id: orderResponse.order.id,

                handler: async function (response) {
                    try {
                        await verifySubscriptionPayment({
                            plan,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        alert(
                            `${plan.toUpperCase()} activated successfully!`
                        );

                        await loadSubscription();
                    } catch (error) {
                        alert(
                            error.response?.data?.detail ||
                            "Payment verification failed"
                        );
                    }
                },

                theme: {
                    color: "#06b6d4",
                },

                modal: {
                    ondismiss: function () {
                        setActionLoading("");
                    },
                },

                prefill: {},
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            alert(
                error.response?.data?.detail ||
                "Could not initiate payment"
            );
        } finally {
            setActionLoading("");
        }
    };

    const handlePlanAction = async (plan) => {
        if (plan === "free") {
            try {
                setActionLoading(plan);

                await cancelSubscription();

                alert("Downgraded to Free Plan");

                await loadSubscription();
            } catch (error) {
                alert(
                    error.response?.data?.detail ||
                    "Could not downgrade plan"
                );
            } finally {
                setActionLoading("");
            }

            return;
        }

        await handlePaidUpgrade(plan);
    };

    useEffect(() => {
        loadSubscription();
    }, []);

    return (
        <DashboardLayout role="candidate">
            <div className="space-y-5">
                <div className="rounded-[2rem] bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-purple-500/15 border border-cyan-400/20 p-5 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <p className="text-cyan-400 font-semibold mb-1">
                                TalentFlow AI Subscriptions
                            </p>

                            <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
                                Choose Your Career
                                <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                                    Growth Plan
                                </span>
                            </h1>

                            <p className="text-slate-400 mt-2 max-w-2xl">
                                Unlock smarter recommendations, deeper AI analysis, and premium
                                career tools.
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-cyan-400" size={26} />
                                <div>
                                    <p className="text-sm text-slate-400">Current Status</p>
                                    <h3 className="font-bold capitalize">
                                        {loading ? "Loading..." : `${currentPlan} Plan Active`}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {plans.map((plan) => {
                        const Icon = plan.icon;

                        const isCurrent = currentPlan === plan.name;

                        return (
                            <div
                                key={plan.name}
                                className={`rounded-[2rem] border bg-slate-900/75 shadow-xl p-5 flex flex-col ${plan.name === "pro"
                                        ? "border-cyan-400 shadow-cyan-500/20"
                                        : "border-slate-800"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                                        <Icon className="text-cyan-400" size={26} />
                                    </div>

                                    <span
                                        className={`text-xs font-bold px-3 py-1 rounded-full ${isCurrent
                                                ? "bg-green-500 text-slate-950"
                                                : plan.name === "pro"
                                                    ? "bg-cyan-500 text-slate-950"
                                                    : "bg-slate-800 text-slate-300"
                                            }`}
                                    >
                                        {isCurrent ? "Current Plan" : plan.badge}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-extrabold">
                                    {plan.displayName}
                                </h2>

                                <p className="text-slate-400 text-sm mt-1">
                                    {plan.tag}
                                </p>

                                <div className="mt-3 pb-4 border-b border-slate-800">
                                    <span className="text-4xl font-black">
                                        {plan.price}
                                    </span>

                                    <span className="text-slate-400 ml-1">
                                        / month
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2.5 flex-1">
                                    {plan.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-start gap-3"
                                        >
                                            <CheckCircle2
                                                className="text-cyan-400 shrink-0 mt-0.5"
                                                size={18}
                                            />

                                            <p className="text-slate-300 text-sm leading-relaxed">
                                                {feature}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    disabled={isCurrent || actionLoading === plan.name}
                                    onClick={() => handlePlanAction(plan.name)}
                                    className={`w-full mt-5 py-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${isCurrent
                                            ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                                            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg hover:shadow-cyan-500/25"
                                        }`}
                                >
                                    {actionLoading === plan.name ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Processing...
                                        </>
                                    ) : isCurrent ? (
                                        "Current Plan"
                                    ) : plan.name === "free" ? (
                                        "Downgrade to Free"
                                    ) : (
                                        `Buy ${plan.displayName}`
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