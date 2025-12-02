// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle,
  Shield,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  Award,
  Zap,
  BarChart3,
  Bell,
  Sparkles,
  Play,
  MessageSquare,
  Target,
  Rocket,
  Heart,
  Briefcase,
  TrendingDown,
} from "lucide-react";

/* ================================================================
   📊 STATIC DATA & CONFIGURATION
   ================================================================ */

const FEATURES = [
  {
    icon: FileText,
    title: "Easy Submission",
    description:
      "Submit complaints in under 60 seconds with our intuitive guided form. Upload attachments, select categories, and track everything in real-time.",
    gradient: "from-blue-500 to-indigo-600",
    color: "blue",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    description:
      "Monitor your complaint status live with instant notifications. See exactly who's handling it and when updates happen throughout the process.",
    gradient: "from-purple-500 to-pink-600",
    color: "purple",
  },
  {
    icon: CheckCircle,
    title: "Smart Routing",
    description:
      "Complaints are automatically routed to the right department ensuring faster resolution times and greater accountability across campus.",
    gradient: "from-emerald-500 to-teal-600",
    color: "emerald",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Bank-level security with role-based access control. Your data is encrypted, protected, and handled with complete privacy at all times.",
    gradient: "from-rose-500 to-red-600",
    color: "rose",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Comprehensive insights for admins with detailed trends, response time metrics, and department performance analytics.",
    gradient: "from-amber-500 to-orange-600",
    color: "amber",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Get instant updates via email and in-app notifications for every status change, comment, and response on your complaints.",
    gradient: "from-cyan-500 to-blue-600",
    color: "cyan",
  },
];

const STATS = [
  {
    icon: FileText,
    value: "2,500+",
    label: "Complaints Resolved",
    change: "+12%",
    trend: "up",
    color: "indigo",
  },
  {
    icon: Users,
    value: "850+",
    label: "Active Users",
    change: "+8%",
    trend: "up",
    color: "purple",
  },
  {
    icon: TrendingUp,
    value: "96%",
    label: "Satisfaction Rate",
    change: "+3%",
    trend: "up",
    color: "emerald",
  },
  {
    icon: Clock,
    value: "18h",
    label: "Avg Response Time",
    change: "-15%",
    trend: "down",
    color: "amber",
  },
];

const TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    role: "B.Tech CSE • 3rd Year",
    content:
      "The Wi-Fi issue in my hostel was resolved within 24 hours. The tracking system kept me updated at every step. Truly impressive!",
    rating: 5,
    avatar: "RS",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Priya Patel",
    role: "M.Sc Chemistry • 1st Year",
    content:
      "Finally, a system that actually works! I could see exactly who was handling my lab equipment complaint and when it was being fixed.",
    rating: 5,
    avatar: "PP",
    color: "from-purple-500 to-pink-600",
  },
  {
    name: "Amit Kumar",
    role: "MBA • 2nd Year",
    content:
      "No more running between departments. Submit once, track everything online. This should have existed years ago!",
    rating: 5,
    avatar: "AK",
    color: "from-emerald-500 to-teal-600",
  },
];

const WORKFLOW_STEPS = [
  {
    step: 1,
    title: "Submit Complaint",
    description:
      "Choose category, describe your issue, attach supporting files, and submit your complaint in seconds.",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    step: 2,
    title: "Auto-Route & Track",
    description:
      "System intelligently routes to the right department. Track status changes and updates in real-time.",
    icon: Target,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    step: 3,
    title: "Get Resolution",
    description:
      "Receive timely updates, view detailed resolution notes, and provide feedback when your issue is closed.",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-teal-600",
  },
];

const ROLES = [
  {
    title: "For Students",
    description:
      "Submit, track, and manage your complaints from any device. Get instant notifications on updates and resolutions.",
    icon: Users,
    features: [
      "Submit complaints 24/7",
      "Real-time status tracking",
      "Mobile-friendly interface",
      "Secure & private",
    ],
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "For Staff",
    description:
      "Manage assigned complaints efficiently with priority settings, bulk actions, and status updates.",
    icon: Briefcase,
    features: [
      "Department dashboard",
      "Priority management",
      "Bulk actions support",
      "Performance analytics",
    ],
    gradient: "from-purple-500 to-pink-600",
  },
  {
    title: "For Admins",
    description:
      "Monitor campus-wide issues, generate detailed reports, and improve institutional processes with data-driven insights.",
    icon: Shield,
    features: [
      "Full analytics dashboard",
      "User management",
      "Reports & exports",
      "System-wide controls",
    ],
    gradient: "from-emerald-500 to-teal-600",
  },
];

/* ================================================================
   🎨 REUSABLE UI COMPONENTS
   ================================================================ */

const Badge = ({ children, variant = "blue", className = "" }) => {
  const variants = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const StatCard = ({ icon: Icon, value, label, change, trend, color }) => {
  const colorClasses = {
    indigo: "from-indigo-500 to-purple-600",
    purple: "from-purple-500 to-pink-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
  };

  return (
    <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-2">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl group-hover:scale-110 transition-transform shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            trend === "up" ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {change}
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600 font-medium">{label}</p>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, gradient }) => (
  <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 overflow-hidden hover:-translate-y-2">
    <div
      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
    />
    <div className="relative z-10">
      <div
        className={`bg-gradient-to-br ${gradient} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  </div>
);

const TestimonialCard = ({ testimonial, isActive }) => (
  <div
    className={`transition-all duration-500 ${
      isActive
        ? "opacity-100 scale-100"
        : "opacity-0 scale-95 absolute inset-0 pointer-events-none"
    }`}
  >
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200">
      <div className="flex items-center justify-center gap-1 mb-6">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        ))}
      </div>
      <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed italic text-center">
        "{testimonial.content}"
      </p>
      <div className="flex items-center justify-center gap-4">
        <div
          className={`w-16 h-16 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg`}
        >
          {testimonial.avatar}
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
          <p className="text-gray-600 text-sm">{testimonial.role}</p>
        </div>
      </div>
    </div>
  </div>
);

const WorkflowStep = ({
  step,
  title,
  description,
  icon: Icon,
  gradient,
  isLast,
}) => (
  <div className="relative">
    <div className="flex flex-col items-center text-center group">
      <div className="relative mb-6">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity`}
        />
        <div
          className={`relative bg-gradient-to-br ${gradient} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-2xl group-hover:scale-110 transition-transform z-10`}
        >
          {step}
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all border border-gray-100 w-full">
        <div
          className={`bg-gradient-to-br ${gradient} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
    {!isLast && (
      <div className="hidden md:block absolute top-10 left-full w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 -translate-x-1/2">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse opacity-20" />
      </div>
    )}
  </div>
);

const RoleCard = ({ title, description, icon: Icon, features, gradient }) => (
  <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-2">
    <div
      className={`bg-gradient-to-br ${gradient} w-16 h-16 rounded-xl flex items-center justify-center mb-6 shadow-lg`}
    >
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
    <ul className="space-y-3">
      {features.map((feature, i) => (
        <li key={i} className="flex items-center gap-2 text-gray-700">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-medium">{feature}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ================================================================
   🚀 MAIN HOME COMPONENT
   ================================================================ */

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    // Testimonial carousel auto-rotation
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => {
      clearInterval(testimonialInterval);
    };
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/complaints/new");
    } else {
      navigate("/register");
    }
  };

  const handleTrackComplaints = () => {
    if (isAuthenticated) {
      navigate("/complaints/my");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ================================================================
          🎯 HERO SECTION
      ================================================================ */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20 md:py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div
          className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Top Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold">
                Trusted by 850+ students & staff
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              College Complaint
              <br />
              <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Management System
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-4">
              A unified platform where students submit issues, staff manage
              resolutions, and admins monitor campus-wide analytics.
            </p>
            <p className="text-base md:text-lg text-blue-200 max-w-2xl mx-auto">
              Built with React, Node.js, MongoDB • Secure • Real-time •
              Mobile-friendly
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="group relative bg-white text-indigo-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto"
            >
              <Rocket className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleTrackComplaints}
              className="group border-2 border-white/30 text-white backdrop-blur-sm bg-white/10 hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-2 w-full sm:w-auto"
            >
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Track Complaints</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Star className="text-yellow-300 fill-yellow-300" />
              <span className="font-semibold">4.9/5 Satisfaction</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="text-emerald-300" />
              <span className="font-semibold">Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Zap className="text-amber-300" />
              <span className="font-semibold">18h Avg Response</span>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ================================================================
          📊 STATS SECTION
      ================================================================ */}
      <section className="py-16 -mt-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          ✨ FEATURES SECTION
      ================================================================ */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="blue">
              <Zap className="w-4 h-4" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
              Everything You Need to Manage Complaints
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              A complete solution built for modern college campuses with
              advanced tracking, analytics, and automation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          🔄 HOW IT WORKS SECTION
      ================================================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="purple">
              <Target className="w-4 h-4" />
              Simple Workflow
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
              From Complaint to Resolution in 3 Steps
            </h2>
            <p className="text-lg text-gray-600">
              Our streamlined process ensures fast and efficient complaint
              handling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {WORKFLOW_STEPS.map((step, idx) => (
              <WorkflowStep
                key={idx}
                {...step}
                isLast={idx === WORKFLOW_STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          👥 ROLES SECTION
      ================================================================ */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="emerald">
              <Users className="w-4 h-4" />
              Built for Everyone
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
              Designed for Every Role
            </h2>
            <p className="text-lg text-gray-600">
              Tailored experiences for students, staff, and administrators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROLES.map((role, idx) => (
              <RoleCard key={idx} {...role} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          💬 TESTIMONIALS SECTION
      ================================================================ */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="amber">
              <Heart className="w-4 h-4" />
              Student Feedback
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-6 mb-4">
              Loved by Students & Staff
            </h2>
            <p className="text-lg text-gray-600">
              Real experiences from real users on our campus
            </p>
          </div>

          <div className="relative min-h-[400px]">
            {TESTIMONIALS.map((testimonial, idx) => (
              <TestimonialCard
                key={idx}
                testimonial={testimonial}
                isActive={idx === activeTestimonial}
              />
            ))}
          </div>

          {/* Carousel Controls */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTestimonial(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === activeTestimonial
                    ? "bg-indigo-600 w-8 h-3"
                    : "bg-gray-300 w-3 h-3 hover:bg-gray-400"
                }`}
                aria-label={`View testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          🎯 CTA SECTION
      ================================================================ */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Campus?
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of students and staff already using our platform to
            resolve complaints faster and more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group bg-white text-indigo-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span>Start For Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/login">
              <button className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto">
                <MessageSquare className="w-5 h-5" />
                <span>Contact Us</span>
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
