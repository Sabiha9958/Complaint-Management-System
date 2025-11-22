import React, { useState, useEffect } from "react";
import { getComplaintStats, getAllComplaints } from "../../services/api";
import {
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi";
import Loader from "../Common/Loader";
import ComplaintCard from "../Complaint/ComplaintCard";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch dashboard statistics and recent complaints
  const fetchDashboardData = async () => {
    try {
      const [statsResponse, complaintsResponse] = await Promise.all([
        getComplaintStats(),
        getAllComplaints({ page: 1, limit: 6, sortBy: "createdAt" }),
      ]);

      setStats(statsResponse.data.data);
      setRecentComplaints(complaintsResponse.data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Stat Card Component
  const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-full`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <Loader fullScreen text="Loading Dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiFileText}
          title="Total Complaints"
          value={stats?.total || 0}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={FiClock}
          title="Pending"
          value={stats?.pending || 0}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatCard
          icon={FiTrendingUp}
          title="In Progress"
          value={stats?.inProgress || 0}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          icon={FiCheckCircle}
          title="Resolved"
          value={stats?.resolved || 0}
          color="text-green-600"
          bgColor="bg-green-100"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Category Breakdown
          </h2>
          <div className="space-y-3">
            {stats?.categoryBreakdown?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-gray-700">{item._id}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(item.count / stats.total) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Priority Breakdown
          </h2>
          <div className="space-y-3">
            {stats?.priorityBreakdown?.map((item) => {
              const colors = {
                Critical: "bg-red-600",
                High: "bg-orange-600",
                Medium: "bg-yellow-600",
                Low: "bg-green-600",
              };
              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700">{item._id}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colors[item._id]} h-2 rounded-full`}
                        style={{
                          width: `${(item.count / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {item.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Complaints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentComplaints.length > 0 ? (
            recentComplaints.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} />
            ))
          ) : (
            <p className="text-gray-500 col-span-3 text-center py-8">
              No recent complaints
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
