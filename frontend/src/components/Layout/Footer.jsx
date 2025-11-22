import React from "react";
import { Link } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              ComplaintMS
            </h3>
            <p className="text-sm text-gray-400">
              An efficient complaint management system for colleges to handle
              and resolve student grievances.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm hover:text-white transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/submit-complaint"
                  className="text-sm hover:text-white transition-colors"
                >
                  Submit Complaint
                </Link>
              </li>
              <li>
                <Link
                  to="/my-complaints"
                  className="text-sm hover:text-white transition-colors"
                >
                  Track Complaints
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm">
                <FiMail className="h-4 w-4" />
                <span>support@college.com</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiPhone className="h-4 w-4" />
                <span>+91 1234567890</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiMapPin className="h-4 w-4" />
                <span>College Campus</span>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Information
            </h3>
            <p className="text-sm text-gray-400">
              Submit complaints 24/7. Response time: 24-48 hours
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} ComplaintMS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
