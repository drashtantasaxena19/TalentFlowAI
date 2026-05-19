import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import {
    ShieldCheck,
    Bell,
    Lock,
    Mail,
    Globe,
    Save,
    CreditCard,
    Database,
    Bot,
    ToggleLeft,
    RefreshCw,
} from "lucide-react";

import Loader from "../../components/common/Loader";
import {
    getAdminSettings,
    updateAdminSettings,
} from "../../services/adminApi";

const defaultSettings = {
    platformFeePercent: 0,
    aiProviderPrimary: "groq",
    aiProviderFallback: "gemini",
    candidateFreeLimit: 10,
    employerFreeActiveJobs: 2,
    featureToggles: {
        aiResumeParsing: true,
        aiJobMatching: true,
        voiceJobPosting: true,
        payments: true,
        employerRanking: true,
        emailAlerts: true,
        platformAnnouncements: false,
        dailyBackupProtection: true,
        twoFactorAdmin: false,
    },
};

export default function Settings() {
    const [settings, setSettings] = useState(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const data = await getAdminSettings();

            setSettings({
                ...defaultSettings,
                ...(data.settings || {}),
                featureToggles: {
                    ...defaultSettings.featureToggles,
                    ...(data.settings?.featureToggles || {}),
                },
            });
        } catch (err) {
            setError(err?.response?.data?.detail || "Unable to load settings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const updateField = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const updateToggle = (field, value) => {
        setSettings((prev) => ({
            ...prev,
            featureToggles: {
                ...prev.featureToggles,
                [field]: value,
            },
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                platformFeePercent: Number(settings.platformFeePercent || 0),
                aiProviderPrimary: settings.aiProviderPrimary,
                aiProviderFallback: settings.aiProviderFallback,
                candidateFreeLimit: Number(settings.candidateFreeLimit || 0),
                employerFreeActiveJobs: Number(settings.employerFreeActiveJobs || 0),
                featureToggles: settings.featureToggles,
            };

            const data = await updateAdminSettings(payload);

            setSettings({
                ...defaultSettings,
                ...(data.settings || {}),
                featureToggles: {
                    ...defaultSettings.featureToggles,
                    ...(data.settings?.featureToggles || {}),
                },
            });

            setSuccess("Settings saved successfully.");
        } catch (err) {
            setError(err?.response?.data?.detail || "Unable to save settings.");
        } finally {
            setSaving(false);
        }
    };

    const ToggleRow = ({ icon: Icon, label, value, onChange }) => (
        <label className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <span className="flex items-center gap-3 text-slate-300">
                <Icon size={18} className="text-cyan-400" />
                {label}
            </span>

            <input
                type="checkbox"
                className="h-5 w-5 accent-cyan-500"
                checked={Boolean(value)}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-r from-orange-500/10 via-cyan-500/10 to-blue-500/10 p-6 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">
                                Platform Control
                            </p>

                            <h1 className="mt-2 text-3xl font-extrabold">
                                Admin Settings
                            </h1>

                            <p className="mt-2 text-slate-400">
                                Configure SaaS limits, AI providers, payments, security, and production feature toggles.
                            </p>
                        </div>

                        <button
                            onClick={loadSettings}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                        <Loader text="Loading platform settings..." />
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">
                                {success}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5 flex items-center gap-3">
                                    <Bot className="text-cyan-400" size={24} />
                                    <h2 className="text-xl font-semibold">AI Settings</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-400">
                                            Primary AI Provider
                                        </label>

                                        <select
                                            value={settings.aiProviderPrimary}
                                            onChange={(e) => updateField("aiProviderPrimary", e.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                                        >
                                            <option value="groq">Groq</option>
                                            <option value="gemini">Gemini</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm text-slate-400">
                                            Fallback AI Provider
                                        </label>

                                        <select
                                            value={settings.aiProviderFallback}
                                            onChange={(e) => updateField("aiProviderFallback", e.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                                        >
                                            <option value="gemini">Gemini</option>
                                            <option value="groq">Groq</option>
                                        </select>
                                    </div>

                                    <ToggleRow
                                        icon={Bot}
                                        label="AI Resume Parsing"
                                        value={settings.featureToggles.aiResumeParsing}
                                        onChange={(value) => updateToggle("aiResumeParsing", value)}
                                    />

                                    <ToggleRow
                                        icon={ToggleLeft}
                                        label="AI Job Matching"
                                        value={settings.featureToggles.aiJobMatching}
                                        onChange={(value) => updateToggle("aiJobMatching", value)}
                                    />

                                    <ToggleRow
                                        icon={ToggleLeft}
                                        label="Voice Job Posting"
                                        value={settings.featureToggles.voiceJobPosting}
                                        onChange={(value) => updateToggle("voiceJobPosting", value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5 flex items-center gap-3">
                                    <CreditCard className="text-cyan-400" size={24} />
                                    <h2 className="text-xl font-semibold">Subscription Controls</h2>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm text-slate-400">
                                            Platform Fee Percent
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.platformFeePercent}
                                            onChange={(e) => updateField("platformFeePercent", e.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm text-slate-400">
                                            Candidate Free Recommendation Limit
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.candidateFreeLimit}
                                            onChange={(e) => updateField("candidateFreeLimit", e.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm text-slate-400">
                                            Employer Free Active Jobs Limit
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.employerFreeActiveJobs}
                                            onChange={(e) => updateField("employerFreeActiveJobs", e.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    <ToggleRow
                                        icon={CreditCard}
                                        label="Payments Enabled"
                                        value={settings.featureToggles.payments}
                                        onChange={(value) => updateToggle("payments", value)}
                                    />

                                    <ToggleRow
                                        icon={ShieldCheck}
                                        label="Employer AI Ranking"
                                        value={settings.featureToggles.employerRanking}
                                        onChange={(value) => updateToggle("employerRanking", value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5 flex items-center gap-3">
                                    <ShieldCheck className="text-cyan-400" size={24} />
                                    <h2 className="text-xl font-semibold">Security Settings</h2>
                                </div>

                                <div className="space-y-4">
                                    <ToggleRow
                                        icon={Lock}
                                        label="Admin Two-Factor Authentication"
                                        value={settings.featureToggles.twoFactorAdmin}
                                        onChange={(value) => updateToggle("twoFactorAdmin", value)}
                                    />

                                    <ToggleRow
                                        icon={Database}
                                        label="Daily Backup Protection"
                                        value={settings.featureToggles.dailyBackupProtection}
                                        onChange={(value) => updateToggle("dailyBackupProtection", value)}
                                    />
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-xl">
                                <div className="mb-5 flex items-center gap-3">
                                    <Bell className="text-cyan-400" size={24} />
                                    <h2 className="text-xl font-semibold">Notifications</h2>
                                </div>

                                <div className="space-y-4">
                                    <ToggleRow
                                        icon={Mail}
                                        label="Email Alerts"
                                        value={settings.featureToggles.emailAlerts}
                                        onChange={(value) => updateToggle("emailAlerts", value)}
                                    />

                                    <ToggleRow
                                        icon={Globe}
                                        label="Global Platform Announcements"
                                        value={settings.featureToggles.platformAnnouncements}
                                        onChange={(value) => updateToggle("platformAnnouncements", value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={18} />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}