import {
    LayoutDashboard,
    UserCircle,
    Upload,
    Brain,
    Briefcase,
    Bookmark,
    Settings,
    Building2,
    FilePlus,
    Users,
    Trophy,
    ShieldCheck,
    CreditCard,
} from "lucide-react";

export const sidebarLinks = {
    candidate: [
        { name: "Dashboard", path: "/candidate/dashboard", icon: LayoutDashboard },
        { name: "Complete Profile", path: "/candidate/complete-profile", icon: UserCircle },
        { name: "Resume Upload", path: "/candidate/resume-upload", icon: Upload },
        { name: "Profile Analysis", path: "/candidate/profile-analysis", icon: Brain },
        { name: "Recommended Jobs", path: "/candidate/recommended-jobs", icon: Briefcase },
        { name: "Saved Jobs", path: "/candidate/saved-jobs", icon: Bookmark },
        { name: "Subscription", path: "/candidate/subscription", icon: CreditCard },
        { name: "Update Profile", path: "/candidate/update-profile", icon: Settings },
    ],

    employer: [
        { name: "Dashboard", path: "/employer/dashboard", icon: LayoutDashboard },
        { name: "Company Profile", path: "/employer/company-profile", icon: Building2 },
        { name: "Post Job", path: "/employer/post-job", icon: FilePlus },
        { name: "Manage Jobs", path: "/employer/manage-jobs", icon: Briefcase },
        { name: "Applicants", path: "/employer/applicants", icon: Users },
        { name: "Candidate Ranking", path: "/employer/candidate-ranking", icon: Trophy },
        { name: "Subscription", path: "/employer/subscription", icon: CreditCard },
    ],

    admin: [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Manage Users", path: "/admin/manage-users", icon: Users },
        { name: "Manage Companies", path: "/admin/manage-companies", icon: Building2 },
        { name: "Manage Jobs", path: "/admin/manage-jobs", icon: Briefcase },
        { name: "Payments", path: "/admin/payments", icon: CreditCard },
        { name: "Settings", path: "/admin/settings", icon: ShieldCheck },
    ],
};