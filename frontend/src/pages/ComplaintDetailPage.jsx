import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getComplaintById, updateComplaintStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ComplaintDetails from "../components/Complaint/ComplaintDetails";
import StatusUpdateModal from "../components/Admin/StatusUpdateModal";
import Button from "../components/Common/Button";
import Loader from "../components/Common/Loader";
import { toast } from "react-toastify";
import { FiArrowLeft, FiEdit } from "react-icons/fi";

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStaff } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  // Fetch complaint details
  const fetchComplaint = async () => {
    try {
      const response = await getComplaintById(id);
      setComplaint(response.data.data.complaint);
      setHistory(response.data.data.history);
    } catch (error) {
      toast.error("Failed to fetch complaint details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (status, notes) => {
    try {
      await updateComplaintStatus(id, { status, notes });
      toast.success("Status updated successfully");
      setShowModal(false);
      fetchComplaint();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <Loader fullScreen text="Loading complaint details..." />;
  }

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Complaint not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <FiArrowLeft />
            <span>Back</span>
          </Button>

          {isStaff && (
            <Button
              onClick={() => setShowModal(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <FiEdit />
              <span>Update Status</span>
            </Button>
          )}
        </div>

        {/* Complaint Details */}
        <ComplaintDetails complaint={complaint} history={history} />

        {/* Status Update Modal */}
        {showModal && (
          <StatusUpdateModal
            complaint={complaint}
            onClose={() => setShowModal(false)}
            onUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailPage;
