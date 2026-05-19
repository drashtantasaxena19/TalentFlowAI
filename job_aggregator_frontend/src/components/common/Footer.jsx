import { Link } from "react-router-dom";

export default function Footer() {
    const socials = [
        { name: "Instagram", label: "IG", url: "#" },
        { name: "Facebook", label: "FB", url: "#" },
        { name: "X", label: "X", url: "#" },
        { name: "LinkedIn", label: "IN", url: "#" },
        { name: "GitHub", label: "GH", url: "#" },
        { name: "Email", label: "@", url: "mailto:support@talentflowai.com" },
    ];

    return (
        <footer className="bg-slate-950 border-t border-slate-800 px-5 py-12">
            <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">

                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src="/assets/brand/favicon.png"
                            alt="TalentFlow AI"
                            className="w-12 h-12 object-contain"
                        />

                        <h2 className="text-2xl font-bold text-white">
                            TalentFlow <span className="text-cyan-400">AI</span>
                        </h2>
                    </div>

                    <p className="text-slate-400">
                        AI-powered resume analysis and smart job recommendation platform.
                    </p>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4">Quick Links</h3>

                    <div className="space-y-3 text-slate-400">
                        <Link to="/" className="block hover:text-cyan-400">Home</Link>
                        <Link to="/signup" className="block hover:text-cyan-400">Signup</Link>
                        <Link to="/login" className="block hover:text-cyan-400">Login</Link>
                        <Link to="/recommended-jobs" className="block hover:text-cyan-400">
                            Recommended Jobs
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4">Features</h3>

                    <div className="space-y-3 text-slate-400">
                        <p>AI Resume Analysis</p>
                        <p>Job Matching</p>
                        <p>Skill Gap Insights</p>
                        <p>Saved Jobs</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-white font-bold mb-4">Connect</h3>

                    <p className="text-slate-400 mb-4">www.talentflowai.com</p>

                    <div className="flex flex-wrap gap-3">
                        {socials.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center text-slate-300 font-bold hover:border-cyan-400 hover:text-cyan-400 transition"
                            >
                                {social.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-800 text-center text-slate-500">
                © {new Date().getFullYear()} TalentFlow AI. All rights reserved.
            </div>
        </footer>
    );
}