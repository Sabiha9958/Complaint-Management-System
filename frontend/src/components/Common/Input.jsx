import React, { forwardRef } from "react";
import PropTypes from "prop-types";

/**
 * Accessible Input with label, error, helper text, and optional icons.
 */
const Input = forwardRef(
  (
    {
      label,
      type = "text",
      name,
      value,
      onChange,
      placeholder = "",
      required = false,
      disabled = false,
      error = "",
      helperText = "",
      className = "",
      id,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;
    const hasError = Boolean(error);
    const describedByIds = [];

    if (helperText) describedByIds.push(`${inputId}-helper`);
    if (hasError) describedByIds.push(`${inputId}-error`);

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {required && (
              <span className="text-red-600 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              {leftIcon}
            </span>
          )}

          <input
            type={type}
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              describedByIds.length ? describedByIds.join(" ") : undefined
            }
            className={[
              "block w-full rounded-lg border px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              hasError
                ? "border-red-600 text-red-900 placeholder-red-300"
                : "border-gray-300 text-gray-900 placeholder-gray-400",
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white",
              leftIcon ? "pl-10" : "",
              rightIcon ? "pr-10" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />

          {rightIcon && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>

        {helperText && !hasError && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        )}

        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            aria-live="assertive"
            className="mt-1 text-xs text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

export default Input;
