import { create } from "zustand";
import { UserRole } from "@prisma/client";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  departmentId: string | null;
  jobTitle: string | null;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    MEMBER: 1,
    MANAGER: 2,
    DIRECTOR: 3,
    HR_ADMIN: 4,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
