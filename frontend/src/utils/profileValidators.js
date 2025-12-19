// src/utils/profileValidators.js
export const VALIDATORS = {
  name: (value) => {
    if (!value?.trim()) return "Name is required";
    if (value.trim().length < 2) return "Min 2 characters required";
    if (value.trim().length > 50) return "Max 50 characters allowed";
    return null;
  },
  title: (value) => (value && value.length > 100 ? "Max 100 characters" : null),
  department: (value) =>
    value && value.length > 50 ? "Max 50 characters" : null,
  location: (value) =>
    value && value.length > 100 ? "Max 100 characters" : null,
  bio: (value) => (value && value.length > 500 ? "Max 500 characters" : null),
};

export const validateForm = (formData) => {
  const errors = {};
  Object.keys(VALIDATORS).forEach((field) => {
    const error = VALIDATORS[field](formData[field]);
    if (error) errors[field] = error;
  });
  return errors;
};
