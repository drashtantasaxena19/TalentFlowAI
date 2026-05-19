import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    Globe,
    MapPin,
    Mail,
    Phone,
    Users,
    Calendar,
    Link,
    Image,
    Factory,
    Save,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Cpu,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getCompanyProfile, saveCompanyProfile } from "../../services/employerApi";

const initialForm = {
    companyName: "",
    industry: "",
    website: "",
    location: "",
    size: "",
    foundedYear: "",
    description: "",
    logoUrl: "",
    linkedin: "",
    contactEmail: "",
    contactPhone: "",
};

export default function CompanyProfile() {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const completion = useMemo(() => {
        const keys = Object.keys(initialForm);
        const filled = keys.filter((key) => String(form[key] || "").trim()).length;
        return Math.round((filled / keys.length) * 100);
    }, [form]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const res = await getCompanyProfile();

                if (res?.profile) {
                    setForm({
                        ...initialForm,
                        ...res.profile,
                        foundedYear: res.profile.foundedYear || "",
                    });
                }
            } catch (err) {
                setToast({
                    type: "error",
                    text: err?.response?.data?.detail || "Failed to load company profile",
                });
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setToast(null);

        try {
            const payload = {
                ...form,
                foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
            };

            const res = await saveCompanyProfile(payload);

            if (res?.profile) {
                setForm({
                    ...initialForm,
                    ...res.profile,
                    foundedYear: res.profile.foundedYear || "",
                });
            }

            setToast({
                type: "success",
                text: res?.message || "Company profile saved successfully",
            });
        } catch (err) {
            setToast({
                type: "error",
                text: err?.response?.data?.detail || "Failed to save company profile",
            });
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full bg-transparent outline-none text-white placeholder:text-slate-500 text-sm sm:text-base";

    const fieldBoxClass =
        "flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 transition focus-within:border-orange-400/80 focus-within:shadow-[0_0_24px_rgba(251,146,60,0.16)]";

    const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

    return (
        <DashboardLayout role="employer">
            <div className="relative space-y-6">
                {toast && (
                    <div className="fixed right-4 top-5 z-[9999] w-[calc(100%-2rem)] max-w-md">
                        <div
                            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
                                toast.type === "success"
                                    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                                    : "border-red-400/30 bg-red-500/15 text-red-200"
                            }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                            ) : (
                                <AlertCircle className="mt-0.5 shrink-0" size={21} />
                            )}

                            <div>
                                <p className="font-bold">
                                    {toast.type === "success" ? "Saved" : "Error"}
                                </p>
                                <p className="text-sm opacity-90">{toast.text}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-[2rem] border border-orange-400/20 bg-slate-950/80 shadow-2xl">
                    <div className="relative p-5 sm:p-6 lg:p-8">
                        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-500/20 blur-3xl" />
                        <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-orange-400/30 bg-orange-500/10">
                                    <Cpu className="text-orange-300" size={28} />
                                </div>

                                <div>
                                    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                                        <Sparkles size={16} />
                                        Employer Identity Engine
                                    </p>

                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">
                                        Company Profile
                                    </h1>

                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                                        Build a trusted company identity for candidates and improve profile completion.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-64">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-semibold text-slate-300">
                                        Completion
                                    </p>
                                    <p className="text-xl font-black text-orange-300">
                                        {completion}%
                                    </p>
                                </div>

                                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-cyan-300 to-blue-400 transition-all duration-500"
                                        style={{ width: `${completion}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-800 bg-slate-900/75 p-4 shadow-xl sm:p-6 lg:p-7">
                    {loading ? (
                        <div className="flex min-h-[280px] items-center justify-center text-slate-400">
                            Loading company profile...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className={labelClass}>Company Name</label>
                                <div className={fieldBoxClass}>
                                    <Building2 className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        name="companyName"
                                        value={form.companyName}
                                        onChange={handleChange}
                                        placeholder="Enter company name"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Industry</label>
                                <div className={fieldBoxClass}>
                                    <Factory className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        name="industry"
                                        value={form.industry}
                                        onChange={handleChange}
                                        placeholder="IT, Finance, Healthcare..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Website</label>
                                <div className={fieldBoxClass}>
                                    <Globe className="shrink-0 text-cyan-300" size={20} />
                                    <input
                                        name="website"
                                        value={form.website}
                                        onChange={handleChange}
                                        placeholder="https://company.com"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Location</label>
                                <div className={fieldBoxClass}>
                                    <MapPin className="shrink-0 text-cyan-300" size={20} />
                                    <input
                                        name="location"
                                        value={form.location}
                                        onChange={handleChange}
                                        placeholder="Noida, India"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Company Size</label>
                                <div className={fieldBoxClass}>
                                    <Users className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        name="size"
                                        value={form.size}
                                        onChange={handleChange}
                                        placeholder="1-10, 11-50, 51-200..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Founded Year</label>
                                <div className={fieldBoxClass}>
                                    <Calendar className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        type="number"
                                        name="foundedYear"
                                        value={form.foundedYear}
                                        onChange={handleChange}
                                        placeholder="2020"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Contact Email</label>
                                <div className={fieldBoxClass}>
                                    <Mail className="shrink-0 text-cyan-300" size={20} />
                                    <input
                                        name="contactEmail"
                                        value={form.contactEmail}
                                        onChange={handleChange}
                                        placeholder="hr@company.com"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Contact Phone</label>
                                <div className={fieldBoxClass}>
                                    <Phone className="shrink-0 text-cyan-300" size={20} />
                                    <input
                                        name="contactPhone"
                                        value={form.contactPhone}
                                        onChange={handleChange}
                                        placeholder="+91 9999999999"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>LinkedIn</label>
                                <div className={fieldBoxClass}>
                                    <Link className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        name="linkedin"
                                        value={form.linkedin}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/company/..."
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Logo URL</label>
                                <div className={fieldBoxClass}>
                                    <Image className="shrink-0 text-orange-300" size={20} />
                                    <input
                                        name="logoUrl"
                                        value={form.logoUrl}
                                        onChange={handleChange}
                                        placeholder="https://logo-url.com/logo.png"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className={labelClass}>Company Description</label>
                                <textarea
                                    rows="5"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Write about your company..."
                                    className="w-full resize-none rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/80 focus:shadow-[0_0_24px_rgba(251,146,60,0.16)] sm:text-base"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-400 via-cyan-400 to-blue-500 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    <Save size={19} />
                                    {saving ? "Saving Profile..." : "Save Company Profile"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}