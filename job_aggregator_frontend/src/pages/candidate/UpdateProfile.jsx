import { useEffect, useState } from "react";
import { Save, User, Briefcase, GraduationCap, Sparkles } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import {
  getCandidateProfile,
  saveCandidateProfile,
} from "../../services/profileApi";

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  currentRole: "",
  experience: "",
  linkedin: "",
  github: "",
  portfolio: "",
  qualification: "",
  course: "",
  college: "",
  university: "",
  education: "",
  skills: "",
  summary: "",
};

export default function UpdateProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!user?.email) return;

        setFetching(true);

        const response = await getCandidateProfile();
        const savedProfile = response?.profile || {};

        setProfile({
          ...emptyProfile,
          ...savedProfile,
          email: user.email,
          fullName: savedProfile.fullName || user.name || "",
        });
      } catch (error) {
        console.log("Profile load failed", error);

        setProfile({
          ...emptyProfile,
          fullName: user?.name || "",
          email: user?.email || "",
        });
      } finally {
        setFetching(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.email) {
      alert("User not authenticated. Please login again.");
      return;
    }

    try {
      setLoading(true);

      await saveCandidateProfile(profile);

      alert("Profile updated successfully!");
    } catch (error) {
      alert(error.response?.data?.detail || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout role="candidate">
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-8 text-center text-slate-300">
          Loading profile...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="candidate">
      <section className="mb-8">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
          <p className="text-cyan-400 font-semibold uppercase tracking-wider">
            Profile Settings
          </p>

          <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
            Update Your
            <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Career Profile
            </span>
          </h1>

          <p className="text-slate-300 mt-4 max-w-2xl">
            Keep your details updated for better AI recommendations and smarter
            job matching.
          </p>
        </div>
      </section>

      <section className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2">
              <User className="text-cyan-400" size={24} />
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="input-style"
              />

              <input
                name="email"
                value={profile.email}
                readOnly
                className="input-style opacity-70"
              />

              <input
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                className="input-style"
              />

              <input
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="Location"
                className="input-style"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2">
              <Briefcase className="text-cyan-400" size={24} />
              Professional Information
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <input
                name="currentRole"
                value={profile.currentRole}
                onChange={handleChange}
                placeholder="Current / Desired Role"
                className="input-style"
              />

              <input
                name="experience"
                value={profile.experience}
                onChange={handleChange}
                placeholder="Experience"
                className="input-style"
              />

              <input
                name="linkedin"
                value={profile.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn URL"
                className="input-style"
              />

              <input
                name="github"
                value={profile.github}
                onChange={handleChange}
                placeholder="GitHub URL"
                className="input-style"
              />

              <input
                name="portfolio"
                value={profile.portfolio}
                onChange={handleChange}
                placeholder="Portfolio URL"
                className="input-style md:col-span-2"
              />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2">
              <GraduationCap className="text-cyan-400" size={24} />
              Education
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <input
                name="qualification"
                value={profile.qualification}
                onChange={handleChange}
                placeholder="Qualification"
                className="input-style"
              />

              <input
                name="course"
                value={profile.course}
                onChange={handleChange}
                placeholder="Course / Specialization"
                className="input-style"
              />

              <input
                name="college"
                value={profile.college}
                onChange={handleChange}
                placeholder="College"
                className="input-style"
              />

              <input
                name="university"
                value={profile.university}
                onChange={handleChange}
                placeholder="University"
                className="input-style"
              />
            </div>

            <textarea
              name="education"
              value={profile.education}
              onChange={handleChange}
              rows="4"
              placeholder="Education Summary"
              className="input-style resize-none mt-5"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold mb-5 flex items-center gap-2">
              <Sparkles className="text-cyan-400" size={24} />
              Skills & Technologies
            </h2>

            <textarea
              name="skills"
              value={profile.skills}
              onChange={handleChange}
              rows="4"
              placeholder="Python, React, SQL, FastAPI, Power BI..."
              className="input-style resize-none"
            />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold mb-5">
              Professional Summary
            </h2>

            <textarea
              name="summary"
              value={profile.summary}
              onChange={handleChange}
              rows="5"
              placeholder="Write your professional summary..."
              className="input-style resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Save size={20} />
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </section>
    </DashboardLayout>
  );
}