import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, type UserRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type ManagedUser = UserRow & {
  displayName: string;
};

function mapUser(u: UserRow): ManagedUser {
  return {
    ...u,
    displayName:
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
  };
}

export function useUserManagement(params?: {
  roleId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: [
      "users",
      "management",
      params?.roleId ?? null,
      params?.status ?? null,
      page,
      limit,
    ],
    queryFn: () =>
      usersApi.list({
        roleId: params?.roleId,
        status: params?.status,
        page,
        limit,
      }),
  });

  const users: ManagedUser[] = (response?.data?.users ?? []).map(mapUser);
  const pagination = response?.data?.pagination;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["users", "management"] });

  const assignPrivilegesMutation = useMutation({
    mutationFn: ({
      userId,
      privilegeIds,
    }: {
      userId: string;
      privilegeIds: string[];
    }) => usersApi.assignPrivileges(userId, privilegeIds),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Privileges added to user successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to assign privileges",
        variant: "destructive",
      });
    },
  });

  const removePrivilegeMutation = useMutation({
    mutationFn: ({
      userId,
      privilegeId,
    }: {
      userId: string;
      privilegeId: string;
    }) => usersApi.removePrivilege(userId, privilegeId),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Privilege removed from user successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to remove privilege",
        variant: "destructive",
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApi.assignRole(userId, roleId),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description:
          res?.message || "Application role assigned to user successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to assign role",
        variant: "destructive",
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApi.removeRole(userId, roleId),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Role removed from user successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to remove role",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    pagination,
    isLoading,
    error,
    refetch,
    assignPrivileges: (userId: string, privilegeIds: string[]) =>
      assignPrivilegesMutation.mutateAsync({ userId, privilegeIds }),
    removePrivilege: (userId: string, privilegeId: string) =>
      removePrivilegeMutation.mutateAsync({ userId, privilegeId }),
    assignRole: (userId: string, roleId: string) =>
      assignRoleMutation.mutateAsync({ userId, roleId }),
    removeRole: (userId: string, roleId: string) =>
      removeRoleMutation.mutateAsync({ userId, roleId }),
    isAccessPending:
      assignPrivilegesMutation.isPending ||
      removePrivilegeMutation.isPending ||
      assignRoleMutation.isPending ||
      removeRoleMutation.isPending,
  };
}
