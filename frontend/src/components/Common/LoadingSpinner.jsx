import React, { useEffect, useState, forwardRef } from "react";
import PropTypes from "prop-types";

const COLOR_CLASSES = {
  blue: "text-blue-600",
  indigo: "text-indigo-600",
  gray: "text-gray-600",
  red: "text-red-600",
  green: "text-green-600",
};

/**
 * Full-screen loading spinner with optional auto-hide and fade-out.
 */
const LoadingSpinner = forwardRef(
  (
    {
      message = "Loading...",
      hideAfterMs = null,
      size = 64,
      color = "blue",
      backgroundColor = "bg-gray-50",
      className = "",
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
      if (hideAfterMs == null) return;

      const timer = setTimeout(() => {
        setFadeOut(true);
        const fadeTimer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(fadeTimer);
      }, hideAfterMs);

      return () => clearTimeout(timer);
    }, [hideAfterMs]);

    if (!visible) return null;

    const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES.blue;

    return (
      <div
        ref={ref}
        className={[
          "flex flex-col items-center justify-center min-h-screen",
          backgroundColor,
          "transition-opacity duration-300",
          fadeOut ? "opacity-0" : "opacity-100",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={message}
        {...props}
      >
        <svg
          className={`animate-spin ${colorClass}`}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            className="opacity-75"
            d="M4 12a8 8 0 018-8V0C5.373 0 
               0 5.373 0 12h4zm2 5.291A7.962 
               7.962 0 014 12H0c0 3.042 1.135 
               5.824 3 7.938l3-2.647z"
          />
        </svg>

        {message && <p className="mt-4 text-gray-600 font-medium">{message}</p>}
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  hideAfterMs: PropTypes.number,
  size: PropTypes.number,
  color: PropTypes.oneOf(["blue", "indigo", "gray", "red", "green"]),
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
};

export default LoadingSpinner;
