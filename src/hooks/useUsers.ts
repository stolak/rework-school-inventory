import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.list,
  });

  // Transform the data to include a display name
  const transformedUsers = users.map((user: any) => ({
    ...user,
    displayName:
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email,
  }));

  return {
    users: transformedUsers,
    isLoading,
    error,
  };
}
