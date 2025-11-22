import React from "react";
import { Link } from "react-router-dom";
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

const Home = () => {
  // Feature list
  const features = [
    {
      icon: FiFileText,
      title: "Easy Submission",
      description:
        "Submit complaints quickly with our simple and intuitive form.",
      color: "blue",
    },
    {
      icon: FiClock,
      title: "Real-time Tracking",
      description:
        "Track your complaint status in real-time with notifications.",
      color: "purple",
    },
    {
      icon: FiCheckCircle,
      title: "Quick Resolution",
      description: "Get your issues resolved efficiently by dedicated staff.",
      color: "green",
    },
    {
      icon: FiShield,
      title: "Secure & Private",
      description:
        "Your information is protected with enterprise-grade security.",
      color: "red",
    },
  ];

  // Statistics
  const stats = [
    { icon: FiFileText, value: "1000+", label: "Complaints Resolved" },
    { icon: FiUsers, value: "500+", label: "Active Users" },
    { icon: FiTrendingUp, value: "95%", label: "Success Rate" },
    { icon: FiClock, value: "24h", label: "Avg Response Time" },
  ];

  // Color mapping
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-20 md:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              College Complaint
              <br />
              <span className="text-blue-200">Management System</span>
            </h1>
            <p className="text-lg md:text-2xl mb-10 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              A modern platform to submit, track, and resolve student grievances
              efficiently and transparently
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/submit-complaint">
                <button className="group bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto">
                  <span>Submit a Complaint</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/login">
                <button className="group border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center space-x-2 w-full sm:w-auto">
                  <span>Track My Complaints</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm md:text-base text-gray-600">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Streamlined complaint management with transparency, efficiency,
              and accountability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 text-center group hover:-translate-y-2"
                >
                  <div
                    className={`${
                      colorClasses[feature.color]
                    } w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Simple 3-step process to resolve your issues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (hidden on mobile) */}
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-1 bg-blue-200"></div>

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Submit Complaint
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Fill out the complaint form with detailed information about your
                issue and submit it instantly
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Track Progress
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your complaint status in real-time and receive instant
                notifications on updates
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Get Resolution
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive timely resolution from our dedicated support team with
                complete transparency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                Built for Students, By the College
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our complaint management system is designed to give every
                student a voice. Whether it's infrastructure issues, academic
                concerns, or hostel problems, we ensure every complaint is heard
                and addressed promptly.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-4 mt-1">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      24/7 Submission
                    </h4>
                    <p className="text-gray-600">
                      Submit complaints anytime, anywhere
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-4 mt-1">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Complete Transparency
                    </h4>
                    <p className="text-gray-600">
                      Track every step of the resolution process
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-4 mt-1">
                    <FiCheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">
                      Fast Response
                    </h4>
                    <p className="text-gray-600">
                      Average response time under 24 hours
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right Content - Visual */}
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="bg-blue-600 p-3 rounded-full">
                    <FiFileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">New Complaint</p>
                    <p className="text-sm text-gray-600">
                      Broken AC in Hostel Room 301
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                    Pending
                  </span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                  <div className="bg-purple-600 p-3 rounded-full">
                    <FiClock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">In Progress</p>
                    <p className="text-sm text-gray-600">
                      Library Timing Extension Request
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    In Progress
                  </span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                  <div className="bg-green-600 p-3 rounded-full">
                    <FiCheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Resolved</p>
                    <p className="text-sm text-gray-600">
                      WiFi Connectivity Issue Fixed
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    Resolved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Submit your complaint now and we'll help resolve your issues quickly
            and efficiently
          </p>
          <Link to="/submit-complaint">
            <button className="group bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 rounded-lg font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center space-x-3">
              <span>Submit Complaint Now</span>
              <FiArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
