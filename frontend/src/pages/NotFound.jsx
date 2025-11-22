import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import { FiHome } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-4xl font-bold text-gray-800 mt-4 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="flex items-center space-x-2 mx-auto">
            <FiHome />
            <span>Back to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
