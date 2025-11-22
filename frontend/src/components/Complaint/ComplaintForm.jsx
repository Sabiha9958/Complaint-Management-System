import React, { useState } from "react";
import { createComplaint } from "../../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Button from "../Common/Button";
import Input from "../Common/Input";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITY,
} from "../../utils/constants";

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Infrastructure",
    priority: "Medium",
    contactInfo: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested contactInfo fields
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createComplaint(formData);
      toast.success("Complaint submitted successfully!");
      navigate("/my-complaints");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to submit complaint"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="Brief description of your complaint"
        required
        minLength={5}
      />

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          required
          minLength={10}
          placeholder="Provide detailed information about your complaint"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {/* Category and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.values(COMPLAINT_PRIORITY).map((pri) => (
              <option key={pri} value={pri}>
                {pri}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Contact Information
        </h3>
        <div className="space-y-4">
          <Input
            label="Your Name"
            name="contactInfo.name"
            value={formData.contactInfo.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            name="contactInfo.email"
            value={formData.contactInfo.email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="contactInfo.phone"
            value={formData.contactInfo.phone}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            pattern="[0-9]{10}"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Submit Complaint
      </Button>
    </form>
  );
};

export default ComplaintForm;
