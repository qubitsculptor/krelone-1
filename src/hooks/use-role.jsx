import { useAuth } from "@/lib/AuthContext";

export function useRole() {
  const { user } = useAuth();
  return { user, isAdmin: user?.role === "admin" };
}