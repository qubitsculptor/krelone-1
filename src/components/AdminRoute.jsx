import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

export default function AdminRoute() {
  const { isAdmin } = useRole();
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}