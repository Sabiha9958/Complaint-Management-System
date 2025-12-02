import React, { forwardRef } from "react";
import PropTypes from "prop-types";

/**
 * Skeleton: pulse-animated block for loading placeholders.
 */
const Skeleton = forwardRef(
  (
    {
      width = "100%",
      height = "20px",
      className = "",
      style = {},
      rounded = "md", // "none" | "sm" | "md" | "lg" | "full"
      ...props
    },
    ref
  ) => {
    const radiusClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      full: "rounded-full",
    };

    return (
      <div
        ref={ref}
        className={[
          "animate-pulse bg-gray-200",
          radiusClasses[rounded] || radiusClasses.md,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width, height, ...style }}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading content"
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

Skeleton.propTypes = {
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  style: PropTypes.object,
  rounded: PropTypes.oneOf(["none", "sm", "md", "lg", "full"]),
};

/**
 * SkeletonCard: card-shaped loading skeleton with multiple lines.
 */
export const SkeletonCard = forwardRef(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={["bg-white rounded-xl shadow-sm p-4 space-y-3", className]
      .filter(Boolean)
      .join(" ")}
    aria-busy="true"
    aria-label="Loading card"
    {...props}
  >
    <Skeleton width="60%" height="24px" rounded="md" />
    <Skeleton width="100%" height="14px" rounded="md" />
    <Skeleton width="85%" height="14px" rounded="md" />
    <Skeleton width="40%" height="18px" rounded="full" />
  </div>
));

SkeletonCard.displayName = "SkeletonCard";

SkeletonCard.propTypes = {
  className: PropTypes.string,
};

export default Skeleton;
