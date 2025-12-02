import React, { forwardRef } from "react";
import PropTypes from "prop-types";

const Spinner = () => (
  <svg
    aria-hidden="true"
    className="animate-spin h-5 w-5 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    role="img"
    focusable="false"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 
         7.962 0 014 12H0c0 3.042 1.135 5.824 3 
         7.938l3-2.647z"
    />
  </svg>
);

const Button = forwardRef(
  (
    {
      children,
      onClick,
      type = "button",
      variant = "primary",
      disabled = false,
      loading = false,
      fullWidth = false,
      className = "",
      leftIcon,
      rightIcon,
      loadingText,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg " +
      "font-semibold transition-all duration-200 focus:outline-none " +
      "focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 " +
      "disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
      secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:ring-gray-400",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
      ghost:
        "bg-transparent text-gray-800 hover:bg-gray-100 focus-visible:ring-gray-300",
    };

    const isIconOnly = !children && (leftIcon || rightIcon);
    const computedAriaLabel =
      ariaLabel || (typeof children === "string" ? children : undefined);

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
          baseStyles,
          variants[variant] || variants.primary,
          fullWidth ? "w-full" : "",
          isIconOnly ? "p-2" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={computedAriaLabel}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Spinner />}

        {!loading && leftIcon}
        {loading ? loadingText || children : children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "danger",
    "success",
    "ghost",
  ]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  loadingText: PropTypes.node,
  ariaLabel: PropTypes.string,
};

export default Button;
