import React from "react";
import { createRoot } from "react-dom/client";
import { LeaveRequestsList } from "./app.jsx";
import "./style.css";

createRoot(document.getElementById("content")).render(
  <LeaveRequestsList apiUrl="/api/leaverequests" />
);
