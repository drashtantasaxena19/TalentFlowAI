import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ResumeCard from "../../components/candidate/ResumeCard";
import Loader from "../../components/common/Loader";
import { FileText, CheckCircle } from "lucide-react";
import { uploadResume } from "../../services/resumeApi";
import { useAuth } from "../../context/AuthContext";

export default function ResumeUploadPage() {
    const { user, isAuthenticated } = useAuth();

    const [resume, setResume] = useState(null);
    const [uploaded, setUploaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [parsedProfile, setParsedProfile] = useState(null);

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!resume) {
            alert("Please select a resume first");
            return;
        }

        if (!isAuthenticated || !user?.email) {
            alert("Authentication expired. Please login again.");
            return;
        }

        try {
            setLoading(true);

            // COOKIE AUTH → only file, no email
            const response = await uploadResume(resume);

            setUploaded(true);
            setParsedProfile(response.profile);

            alert("Resume uploaded and profile updated successfully!");
        } catch (error) {
            alert(
                error.response?.data?.detail ||
                    "Resume upload failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role="candidate">
            <section className="mb-8">
                <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
                    <p className="text-cyan-400 font-semibold uppercase tracking-wider">
                        Resume Management
                    </p>

                    <h1 className="text-3xl md:text-5xl font-extrabold mt-3 leading-tight">
                        Upload Your
                        <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                            Professional Resume
                        </span>
                    </h1>

                    <p className="text-slate-300 mt-4 max-w-2xl">
                        Upload your resume and TalentFlow AI will extract your
                        skills, role, education, projects, certifications, and
                        auto-update your profile for ATS + job matching.
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
                    <Loader text="Uploading resume, parsing with AI, and updating profile..." />
                </div>
            ) : (
                <section className="grid lg:grid-cols-2 gap-8">
                    {/* Left Info */}
                    <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
                        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6">
                            <FileText size={40} />
                        </div>

                        <h2 className="text-3xl font-extrabold mb-4">
                            Why upload your resume?
                        </h2>

                        <ul className="space-y-4 text-slate-300">
                            <li>✔ AI extracts skills, education, and experience</li>
                            <li>✔ Auto-fills your candidate profile</li>
                            <li>✔ ATS-ready structured parsing</li>
                            <li>✔ Better AI job recommendations</li>
                            <li>✔ Resume score & profile strength</li>
                            <li>✔ Skill gap + recruiter intelligence</li>
                        </ul>

                        {parsedProfile && (
                            <div className="mt-6 rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
                                <div className="flex items-center gap-3 text-green-400 font-bold mb-3">
                                    <CheckCircle size={22} />
                                    Profile Auto Updated
                                </div>

                                <div className="space-y-2 text-sm text-slate-300">
                                    <p>
                                        <span className="text-slate-400">
                                            Name:
                                        </span>{" "}
                                        {parsedProfile.fullName || user?.name}
                                    </p>

                                    <p>
                                        <span className="text-slate-400">
                                            Role:
                                        </span>{" "}
                                        {parsedProfile.currentRole || "Detected"}
                                    </p>

                                    <p>
                                        <span className="text-slate-400">
                                            Skills:
                                        </span>{" "}
                                        {parsedProfile.skills || "Extracted"}
                                    </p>

                                    <p>
                                        <span className="text-slate-400">
                                            Qualification:
                                        </span>{" "}
                                        {parsedProfile.qualification || "Detected"}
                                    </p>

                                    <p>
                                        <span className="text-slate-400">
                                            Source:
                                        </span>{" "}
                                        {parsedProfile.resumeSource || "AI Parser"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resume Upload Card */}
                    <ResumeCard
                        resume={resume}
                        uploaded={uploaded}
                        setResume={setResume}
                        setUploaded={setUploaded}
                        handleUpload={handleUpload}
                    />
                </section>
            )}
        </DashboardLayout>
    );
}