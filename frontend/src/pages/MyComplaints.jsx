import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserComplaints } from "../services/api";
import ComplaintCard from "../components/Complaint/ComplaintCard";
import ComplaintFilters from "../components/Complaint/ComplaintFilters";
import Loader from "../components/Common/Loader";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const MyComplaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [filters, complaints]);

  // Fetch user's complaints
  const fetchComplaints = async () => {
    try {
      const response = await getUserComplaints(user._id);
      setComplaints(response.data.data);
      setFilteredComplaints(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to complaints
  const applyFilters = () => {
    let filtered = [...complaints];

    if (filters.status) {
      filtered = filtered.filter((c) => c.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter((c) => c.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter((c) => c.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.complaintId.toLowerCase().includes(searchLower)
      );
    }

    setFilteredComplaints(filtered);
  };

  if (loading) {
    return <Loader fullScreen text="Loading your complaints..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Complaints</h1>
          <p className="text-gray-600 mt-2">
            Track and manage your submitted complaints
          </p>
        </div>

        {/* Filters */}
        <ComplaintFilters filters={filters} setFilters={setFilters} />

        {/* Complaints Grid */}
        {filteredComplaints.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard key={complaint._id} complaint={complaint} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              {complaints.length === 0
                ? "You haven't submitted any complaints yet"
                : "No complaints match your filters"}
            </p>
            {complaints.length === 0 && (
              <Link
                to="/submit-complaint"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Submit your first complaint
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
