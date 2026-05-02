import { useQuery } from "@tanstack/react-query";
import { usersApi, type UserRow } from "@/lib/api";

export type UserWithDisplay = UserRow & {
  displayName: string;
};

export function useUsers(params?: {
  userType?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["users", params?.userType ?? "all", page, limit],
    queryFn: () => usersApi.list(params),
  });

  const rawUsers: UserRow[] = (response as any)?.data?.users ?? [];
  const pagination = (response as any)?.data?.pagination;

  const users: UserWithDisplay[] = rawUsers.map((u) => ({
    ...u,
    displayName:
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
  }));

  return {
    users,
    pagination,
    isLoading,
    error,
  };
}
