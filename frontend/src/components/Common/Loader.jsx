import React from "react";

const Loader = ({
  size = "medium",
  fullScreen = false,
  text = "Loading...",
}) => {
  const sizes = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  };

  const loaderContent = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-4 border-b-4 border-blue-600 ${sizes[size]}`}
      ></div>
      {text && <p className="mt-4 text-gray-600 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">{loaderContent}</div>
  );
};

export default Loader;
