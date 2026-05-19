import { useEffect, useState } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Link,
  Globe,
  Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { getCandidateProfile } from "../../services/profileApi";

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

export default function CompleteProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(emptyProfile);
  const [fetching, setFetching] = useState(true);

  const filledFields = Object.values(profile).filter(
    (value) => String(value || "").trim() !== ""
  ).length;

  const completion = Math.round(
    (filledFields / Object.keys(profile).length) * 100
  );

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
        console.log("No saved profile found yet", error);

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

  const DetailItem = ({ icon: Icon, label, value }) => (
    <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
        <Icon size={17} className="text-cyan-400" />
        {label}
      </div>
      <p className="text-white font-semibold break-words">
        {value || "Not added"}
      </p>
    </div>
  );

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
      <section className="mb-6">
        <div className="rounded-[2rem] border border-slate-800 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div>
              <p className="text-cyan-400 font-semibold uppercase tracking-wider">
                Candidate Profile
              </p>

              <h1 className="text-3xl md:text-5xl font-extrabold mt-3">
                Your Professional
                <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                  Career Profile
                </span>
              </h1>

              <p className="text-slate-300 mt-4 max-w-2xl">
                This profile is used for AI job matching, resume scoring, and
                personalized recommendations.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-5 min-w-[230px]">
              <p className="text-slate-400 text-sm">Profile Completion</p>
              <h2 className="text-4xl font-black text-cyan-400 mt-1">
                {completion}%
              </h2>
              <div className="w-full h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full"
                  style={{ width: `${completion}%` }}
                />
              </div>

              <button
                onClick={() => navigate("/candidate/update-profile")}
                className="mt-5 w-full px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition flex items-center justify-center gap-2"
              >
                <Pencil size={18} />
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <User className="text-cyan-400" size={26} />
            <h2 className="text-2xl font-extrabold">Personal Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <DetailItem icon={User} label="Full Name" value={profile.fullName} />
            <DetailItem icon={Mail} label="Email" value={profile.email} />
            <DetailItem icon={Phone} label="Phone" value={profile.phone} />
            <DetailItem icon={MapPin} label="Location" value={profile.location} />
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <Briefcase className="text-cyan-400" size={26} />
            <h2 className="text-2xl font-extrabold">
              Professional Information
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <DetailItem
              icon={Briefcase}
              label="Current / Desired Role"
              value={profile.currentRole}
            />
            <DetailItem
              icon={Sparkles}
              label="Experience"
              value={profile.experience}
            />
            <DetailItem icon={Link} label="LinkedIn" value={profile.linkedin} />
            <DetailItem
              icon={Globe}
              label="GitHub"
              value={profile.github}
            />
            <DetailItem
              icon={Globe}
              label="Portfolio"
              value={profile.portfolio}
            />
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-900/70 border border-slate-800 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <GraduationCap className="text-cyan-400" size={26} />
            <h2 className="text-2xl font-extrabold">Education & Skills</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <DetailItem
              icon={GraduationCap}
              label="Qualification"
              value={profile.qualification}
            />
            <DetailItem
              icon={GraduationCap}
              label="Course"
              value={profile.course}
            />
            <DetailItem
              icon={GraduationCap}
              label="College"
              value={profile.college}
            />
            <DetailItem
              icon={GraduationCap}
              label="University"
              value={profile.university}
            />
          </div>

          <div className="mt-5">
            <DetailItem icon={Sparkles} label="Skills" value={profile.skills} />
          </div>

          <div className="mt-5">
            <DetailItem icon={User} label="Education Summary" value={profile.education} />
          </div>

          <div className="mt-5">
            <DetailItem
              icon={User}
              label="Professional Summary"
              value={profile.summary}
            />
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}