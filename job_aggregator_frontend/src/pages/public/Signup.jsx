import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import RoleSelector from "../../components/common/RoleSelector";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";

export default function Signup() {
    const navigate = useNavigate();
    const { signup } = useAuth();

    const [role, setRole] = useState("candidate");
    const [loading, setLoading] = useState(false);

    const redirectUser = (userRole) => {
        if (userRole === "candidate") {
            navigate("/candidate/dashboard", { replace: true });
        } else if (userRole === "employer") {
            navigate("/employer/dashboard", { replace: true });
        } else if (userRole === "admin") {
            navigate("/admin/dashboard", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const signupData = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim().toLowerCase(),
            password: String(formData.get("password") || ""),
            confirmPassword: String(formData.get("confirmPassword") || ""),
            role,
            companyName:
                role === "employer"
                    ? String(formData.get("companyName") || "").trim()
                    : "",
        };

        if (
            !signupData.name ||
            !signupData.email ||
            !signupData.password ||
            !signupData.confirmPassword
        ) {
            alert("Please fill all required fields");
            return;
        }

        if (signupData.password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        if (signupData.password !== signupData.confirmPassword) {
            alert("Password and Confirm Password do not match");
            return;
        }

        if (role === "employer" && !signupData.companyName) {
            alert("Company name is required for employer account");
            return;
        }

        try {
            setLoading(true);

            const response = await signup({
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                role: signupData.role,
                companyName: signupData.companyName,
            });

            if (!response?.user?.role) {
                throw new Error("Invalid signup response");
            }

            redirectUser(response.user.role);
        } catch (error) {
            alert(
                error.response?.data?.detail ||
                error.message ||
                "Signup failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <Navbar />

            <section className="min-h-[calc(100vh-66px)] px-5 pt-24 pb-6 flex items-center">
                <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.12fr_0.88fr] gap-10 xl:gap-14 items-center">
                    <div className="hidden lg:flex justify-center items-center">
                        <div className="relative flex items-center justify-center w-full max-w-xl min-h-[500px] overflow-visible">
                            <div className="absolute w-[470px] h-[470px] rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/15 to-blue-500/20 blur-3xl" />

                            <div className="absolute w-[390px] h-[390px] rounded-[4rem] border border-cyan-400/20 rotate-6" />
                            <div className="absolute w-[345px] h-[345px] rounded-[4rem] border border-purple-400/10 -rotate-6" />

                            <div className="relative rounded-[3rem] bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 shadow-2xl">
                                <img
                                    src="/assets/brand/splash_screen.png"
                                    alt="TalentFlow AI"
                                    className="w-[345px] xl:w-[385px] object-contain rounded-[2.5rem]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-full max-w-lg mx-auto lg:mt-4 bg-slate-900/75 border border-slate-800 rounded-[2.2rem] p-5 md:p-6 shadow-2xl">
                        {loading ? (
                            <Loader text="Creating your secure account..." />
                        ) : (
                            <>
                                <div className="text-center mb-4">
                                    <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                                        Join <span className="text-cyan-400">TalentFlow AI</span>
                                    </h1>

                                    <p className="text-slate-400 mt-2 text-sm md:text-base">
                                        Create your account and continue your journey
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="block mb-2 text-slate-300 text-sm font-medium">
                                            I am a
                                        </label>

                                        <RoleSelector
                                            selectedRole={role}
                                            onRoleChange={setRole}
                                        />
                                    </div>

                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="Full Name"
                                        autoComplete="name"
                                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400"
                                    />

                                    {role === "employer" && (
                                        <input
                                            type="text"
                                            name="companyName"
                                            required
                                            placeholder="Company Name"
                                            className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400"
                                        />
                                    )}

                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="Email"
                                        autoComplete="email"
                                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400"
                                    />

                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="Password"
                                        autoComplete="new-password"
                                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400"
                                    />

                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        placeholder="Confirm Password"
                                        autoComplete="new-password"
                                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400"
                                    />

                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition"
                                    >
                                        Create Secure Account
                                    </button>
                                </form>

                                <p className="text-center text-slate-400 mt-4 text-sm">
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="text-cyan-400 hover:underline font-medium"
                                    >
                                        Login
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}