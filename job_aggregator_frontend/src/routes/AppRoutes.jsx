import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "../pages/public/Landing";
import Signup from "../pages/public/Signup";
import Login from "../pages/public/Login";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Candidate Pages
import CandidateDashboard from "../pages/candidate/CandidateDashboard";
import ResumeUploadPage from "../pages/candidate/ResumeUploadPage";
import ProfileAnalysis from "../pages/candidate/ProfileAnalysis";
import RecommendedJobs from "../pages/candidate/RecommendedJobs";
import JobDetails from "../pages/candidate/JobDetails";
import SavedJobs from "../pages/candidate/SavedJobs";
import CompleteProfile from "../pages/candidate/CompleteProfile";
import UpdateProfile from "../pages/candidate/UpdateProfile";
import CandidateSubscriptionPlans from "../pages/candidate/CandidateSubscriptionPlans";
import AppliedJobs from "../pages/candidate/AppliedJobs";

// Employer Pages
import EmployerDashboard from "../pages/employer/EmployerDashboard";
import CompanyProfile from "../pages/employer/CompanyProfile";
import PostJob from "../pages/employer/PostJob";
import ManageJobs from "../pages/employer/ManageJobs";
import Applicants from "../pages/employer/Applicants";
import CandidateRanking from "../pages/employer/CandidateRanking";
import EmployerSubscriptionPlans from "../pages/employer/EmployeeSubscriptionPlans";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageCompanies from "../pages/admin/ManageCompanies";
import AdminManageJobs from "../pages/admin/ManageJobs";
import Payments from "../pages/admin/Payments";
import Settings from "../pages/admin/Settings";

const protect = (role, component) => (
    <ProtectedRoute allowedRoles={[role]}>
        {component}
    </ProtectedRoute>
);

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* Candidate */}
            <Route path="/candidate/dashboard" element={protect("candidate", <CandidateDashboard />)} />
            <Route path="/candidate/resume-upload" element={protect("candidate", <ResumeUploadPage />)} />
            <Route path="/candidate/profile-analysis" element={protect("candidate", <ProfileAnalysis />)} />
            <Route path="/candidate/recommended-jobs" element={protect("candidate", <RecommendedJobs />)} />
            <Route path="/candidate/job-details" element={protect("candidate", <JobDetails />)} />
            <Route path="/candidate/saved-jobs" element={protect("candidate", <SavedJobs />)} />
            <Route path="/candidate/complete-profile" element={protect("candidate", <CompleteProfile />)} />
            <Route path="/candidate/update-profile" element={protect("candidate", <UpdateProfile />)} />
            <Route path="/candidate/subscription" element={protect("candidate", <CandidateSubscriptionPlans />)} />
            <Route path="/candidate/applied-jobs" element={protect("candidate", <AppliedJobs />)} />

            {/* Employer */}
            <Route path="/employer/dashboard" element={protect("employer", <EmployerDashboard />)} />
            <Route path="/employer/company-profile" element={protect("employer", <CompanyProfile />)} />
            <Route path="/employer/post-job" element={protect("employer", <PostJob />)} />
            <Route path="/employer/manage-jobs" element={protect("employer", <ManageJobs />)} />
            <Route path="/employer/applicants" element={protect("employer", <Applicants />)} />
            <Route path="/employer/candidate-ranking" element={protect("employer", <CandidateRanking />)} />
            <Route path="/employer/subscription" element={protect("employer", <EmployerSubscriptionPlans />)} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={protect("admin", <AdminDashboard />)} />
            <Route path="/admin/manage-users" element={protect("admin", <ManageUsers />)} />
            <Route path="/admin/manage-companies" element={protect("admin", <ManageCompanies />)} />
            <Route path="/admin/manage-jobs" element={protect("admin", <AdminManageJobs />)} />
            <Route path="/admin/payments" element={protect("admin", <Payments />)} />
            <Route path="/admin/settings" element={protect("admin", <Settings />)} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}