import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [role, setRole] = useState("candidate");
    const [loading, setLoading] = useState(false);

    const redirectByRole = (userRole) => {
        if (userRole === "candidate") {
            navigate("/candidate/dashboard", { replace: true });
        } else if (userRole === "employer") {
            navigate("/employer/dashboard", { replace: true });
        } else {
            navigate("/admin/dashboard", { replace: true });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const loginData = {
            email: formData.get("email"),
            password: formData.get("password"),
            role,
        };

        try {
            setLoading(true);

            const response = await login(loginData);

            if (!response?.user?.role) {
                throw new Error("Invalid login response");
            }

            redirectByRole(response.user.role);
        } catch (error) {
            alert(
                error.response?.data?.detail ||
                error.message ||
                "Login failed. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
            <Navbar />

            <section className="min-h-[calc(100vh-66px)] px-5 pt-20 pb-6 flex items-center">
                <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-[1.12fr_0.88fr] gap-10 xl:gap-14 items-center">
                    {/* Left Branding Section */}
                    <div className="hidden lg:flex justify-center items-center">
                        <div className="relative rounded-[3rem] bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-6 shadow-2xl">
                            <img
                                src="/assets/brand/splash_screen.png"
                                alt="TalentFlow AI"
                                className="w-[345px] xl:w-[385px] object-contain rounded-[2.5rem]"
                            />
                        </div>
                    </div>

                    {/* Login Form Section */}
                    <div className="w-full max-w-lg mx-auto lg:mt-4 bg-slate-900/75 border border-slate-800 rounded-[2.2rem] p-6 md:p-8 shadow-2xl">
                        {loading ? (
                            <Loader text="Logging you in securely..." />
                        ) : (
                            <>
                                <div className="text-center mb-7">
                                    <h1 className="text-3xl md:text-4xl font-extrabold">
                                        Welcome{" "}
                                        <span className="text-cyan-400">
                                            Back
                                        </span>
                                    </h1>

                                    <p className="text-slate-400 mt-2 text-sm md:text-base">
                                        Login to continue your AI-powered journey
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    {/* Role Selector */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {["candidate", "employer", "admin"].map(
                                            (item) => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() =>
                                                        setRole(item)
                                                    }
                                                    className={`py-2.5 rounded-2xl border font-semibold capitalize transition ${
                                                        role === item
                                                            ? "bg-cyan-500 text-slate-950 border-cyan-400"
                                                            : "bg-slate-950 text-slate-300 border-slate-700 hover:border-cyan-500/50"
                                                    }`}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* Email */}
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        placeholder="Email"
                                        autoComplete="email"
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400 transition"
                                    />

                                    {/* Password */}
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        placeholder="Password"
                                        autoComplete="current-password"
                                        className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 outline-none focus:border-cyan-400 transition"
                                    />

                                    {/* Login Button */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-lg hover:bg-cyan-400 transition"
                                    >
                                        Login Securely
                                    </button>
                                </form>
                                {/* Signup Redirect */}
                                <p className="text-center text-slate-400 mt-5 text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        to="/signup"
                                        className="text-cyan-400 hover:underline font-medium"
                                    >
                                        Create Account
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