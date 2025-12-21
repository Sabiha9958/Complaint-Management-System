import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ComplaintList from "../../components/Complaint/ComplaintList";
import ComplaintDetail from "../../components/Complaint/ComplaintDetails";

export default function Complaints() {
  return (
    <Routes>
      <Route index element={<ComplaintList />} />
      <Route path=":id" element={<ComplaintDetail />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
