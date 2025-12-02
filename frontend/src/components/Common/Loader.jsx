import React, { forwardRef } from "react";
import PropTypes from "prop-types";

const SIZE_CLASSES = {
  small: "h-6 w-6",
  medium: "h-10 w-10",
  large: "h-16 w-16",
};

const COLOR_CLASSES = {
  blue: {
    border: "border-blue-600",
    text: "text-blue-600",
  },
  indigo: {
    border: "border-indigo-600",
    text: "text-indigo-600",
  },
  gray: {
    border: "border-gray-600",
    text: "text-gray-600",
  },
  red: {
    border: "border-red-600",
    text: "text-red-600",
  },
  green: {
    border: "border-green-600",
    text: "text-green-600",
  },
};

const Loader = forwardRef(
  (
    {
      size = "medium",
      fullScreen = false,
      text = "Loading...",
      className = "",
      color = "blue",
      ...props
    },
    ref
  ) => {
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.medium;
    const colorSet = COLOR_CLASSES[color] || COLOR_CLASSES.blue;

    const spinner = (
      <svg
        className={`animate-spin rounded-full border-4 border-t-transparent ${colorSet.border} ${sizeClass}`}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        ref={ref}
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 
             0 5.373 0 12h4zm2 5.291A7.962 
             7.962 0 014 12H0c0 3.042 1.135 
             5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    const loaderContent = (
      <div
        className="flex flex-col items-center justify-center"
        role="status"
        aria-live="polite"
      >
        {spinner}
        {text && (
          <p className={`mt-3 text-sm font-medium ${colorSet.text}`}>{text}</p>
        )}
      </div>
    );

    if (fullScreen) {
      return (
        <div
          className="fixed inset-0 bg-white/90 z-50 flex items-center justify-center"
          aria-busy="true"
          aria-label="Loading, please wait"
        >
          {loaderContent}
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        aria-busy="true"
      >
        {loaderContent}
      </div>
    );
  }
);

Loader.displayName = "Loader";

Loader.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  fullScreen: PropTypes.bool,
  text: PropTypes.string,
  className: PropTypes.string,
  color: PropTypes.oneOf(["blue", "indigo", "gray", "red", "green"]),
};

export default Loader;
