import React from "react";
import ComplaintForm from "../components/Complaint/ComplaintForm";

const SubmitComplaint = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Submit a Complaint
          </h1>
          <p className="text-gray-600 text-lg">
            Please provide detailed information about your issue
          </p>
        </div>

        {/* Complaint Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <ComplaintForm />
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>
              Provide accurate and detailed information for faster resolution
            </li>
            <li>You will receive a unique complaint ID for tracking</li>
            <li>Updates will be sent to your registered email</li>
            <li>Expected response time: 24-48 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaint;
