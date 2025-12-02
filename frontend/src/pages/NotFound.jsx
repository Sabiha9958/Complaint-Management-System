import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/Common/Button";
import { FiHome } from "react-icons/fi";

const NotFound = () => {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <section
        className="text-center max-w-xl animate-fadeIn"
        aria-label="Page not found"
        tabIndex={-1}
      >
        <h1 className="text-9xl font-extrabold text-blue-600 mb-4 animate-bounce">
          404
        </h1>
        <h2 className="text-4xl font-bold text-gray-800 mb-4 animate-fadeIn delay-200">
          Page Not Found
        </h2>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed animate-fadeIn delay-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button
            className="flex items-center space-x-2 mx-auto animate-pulse"
            aria-label="Back to Home"
          >
            <FiHome className="h-5 w-5" aria-hidden="true" />
            <span>Back to Home</span>
          </Button>
        </Link>
      </section>
    </main>
  );
};

export default NotFound;
