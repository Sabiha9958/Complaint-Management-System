import React, { useState, useEffect } from "react";
import { getAllComplaints, deleteComplaint } from "../../services/api";
import { toast } from "react-toastify";
import ComplaintCard from "../Complaint/ComplaintCard";
import ComplaintFilters from "../Complaint/ComplaintFilters";
import Loader from "../Common/Loader";
import Button from "../Common/Button";
import { FiTrash2 } from "react-icons/fi";

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });

  useEffect(() => {
    fetchComplaints();
  }, [filters, pagination.currentPage]);

  // Fetch complaints with filters and pagination
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await getAllComplaints({
        ...filters,
        page: pagination.currentPage,
        limit: 12,
      });

      setComplaints(response.data.data);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
    } catch (error) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  // Delete complaint handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      try {
        await deleteComplaint(id);
        toast.success("Complaint deleted successfully");
        fetchComplaints();
      } catch (error) {
        toast.error("Failed to delete complaint");
      }
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, currentPage: newPage });
  };

  if (loading && complaints.length === 0) {
    return <Loader fullScreen text="Loading complaints..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">All Complaints</h1>
          <p className="text-gray-600 mt-1">
            Showing {complaints.length} of {pagination.total} complaints
          </p>
        </div>
      </div>

      {/* Filters */}
      <ComplaintFilters filters={filters} setFilters={setFilters} />

      {/* Complaints Grid */}
      {loading ? (
        <Loader text="Loading..." />
      ) : complaints.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="relative">
                <ComplaintCard complaint={complaint} />
                <button
                  onClick={() => handleDelete(complaint._id)}
                  className="absolute top-4 right-4 bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors"
                  title="Delete complaint"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <Button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                variant="secondary"
              >
                Previous
              </Button>

              <div className="flex space-x-1">
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pagination.currentPage === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No complaints found</p>
        </div>
      )}
    </div>
  );
};

export default ComplaintList;
