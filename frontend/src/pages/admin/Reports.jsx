import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./Reports.css";

const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (dateRange.startDate) params.append("startDate", dateRange.startDate);
      if (dateRange.endDate) params.append("endDate", dateRange.endDate);

      const response = await axios.get(
        `http://localhost:5000/api/reports?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReportsData(response.data.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchReports();
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-spinner">Loading reports...</div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="reports-container">
        <div className="error-message">Failed to load reports data</div>
      </div>
    );
  }

  const { complaints, users, recentActivity } = reportsData;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Reports & Analytics</h1>
        <div className="date-filter">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, startDate: e.target.value })
            }
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange({ ...dateRange, endDate: e.target.value })
            }
            placeholder="End Date"
          />
          <button onClick={handleDateFilter} className="btn-primary">
            Apply Filter
          </button>
          <button
            onClick={() => {
              setDateRange({ startDate: "", endDate: "" });
              fetchReports();
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.total}</p>
          <span className="stat-label">Active: {users.active}</span>
        </div>
        <div className="summary-card">
          <h3>Total Complaints</h3>
          <p className="stat-number">
            {complaints.statusBreakdown.reduce(
              (sum, item) => sum + item.count,
              0
            )}
          </p>
        </div>
        <div className="summary-card">
          <h3>Avg Resolution Time</h3>
          <p className="stat-number">
            {complaints.averageResolutionTime[0]
              ? `${complaints.averageResolutionTime[0].avgTime.toFixed(1)}h`
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Status Breakdown */}
        <div className="chart-card">
          <h3>Complaints by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={complaints.statusBreakdown}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {complaints.statusBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="chart-card">
          <h3>Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaints.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Breakdown */}
        <div className="chart-card">
          <h3>Complaints by Priority</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaints.priorityBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="chart-card">
          <h3>Monthly Complaint Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={complaints.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id"
                tickFormatter={(value) => `${value.month}/${value.year}`}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity-section">
        <h3>Recent Complaints</h3>
        <div className="activity-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((complaint) => (
                <tr key={complaint._id}>
                  <td>{complaint.complaintId}</td>
                  <td>{complaint.title}</td>
                  <td>
                    <span
                      className={`badge badge-${complaint.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {complaint.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${complaint.priority.toLowerCase()}`}
                    >
                      {complaint.priority}
                    </span>
                  </td>
                  <td>{complaint.createdBy?.name || "Anonymous"}</td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
