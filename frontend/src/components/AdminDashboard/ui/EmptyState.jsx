import React, { memo } from "react";
import { Filter } from "lucide-react";

export default memo(function EmptyState({
  title = "Nothing to show",
  subtitle = "Try adjusting filters or refresh the page.",
  icon: Icon = Filter,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-gray-100 p-4 text-gray-500">
        <Icon className="h-8 w-8" />
      </div>
      <p className="text-sm font-extrabold text-gray-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-gray-600">{subtitle}</p>
    </div>
  );
});
