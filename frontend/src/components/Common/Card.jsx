import React, { forwardRef } from "react";
import PropTypes from "prop-types";

const Card = forwardRef(
  (
    {
      children,
      className = "",
      hover = false,
      clickable = false,
      onClick,
      role,
      tabIndex,
      variant = "default", // "default" | "border"
      ...props
    },
    ref
  ) => {
    const baseStyles = "bg-white rounded-xl p-4 shadow-sm";

    const variantStyles = {
      default: "shadow-sm",
      border: "border border-gray-200 shadow-none",
    };

    const hoverStyles =
      hover || clickable
        ? "cursor-pointer hover:shadow-md transition-shadow duration-200"
        : "";

    const focusStyles =
      clickable || onClick
        ? "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        : "";

    const combinedClassName = [
      baseStyles,
      variantStyles[variant] || variantStyles.default,
      hoverStyles,
      focusStyles,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const isInteractive = Boolean(onClick || clickable);

    const accessibleRole = role || (isInteractive ? "button" : undefined);

    const accessibleTabIndex =
      typeof tabIndex !== "undefined"
        ? tabIndex
        : isInteractive
          ? 0
          : undefined;

    const handleKeyDown = (e) => {
      if (!isInteractive || !onClick) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };

    return (
      <div
        ref={ref}
        className={combinedClassName}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={accessibleRole}
        tabIndex={accessibleTabIndex}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  role: PropTypes.string,
  tabIndex: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  variant: PropTypes.oneOf(["default", "border"]),
};

export default Card;
