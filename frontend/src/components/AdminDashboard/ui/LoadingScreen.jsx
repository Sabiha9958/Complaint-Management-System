import React, { memo } from "react";
import { Activity } from "lucide-react";

export default memo(function LoadingScreen({ message = "Loading dashboard…" }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <Activity className="absolute inset-0 m-auto h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-sm font-semibold text-gray-600">{message}</p>
      </div>
    </div>
  );
});
