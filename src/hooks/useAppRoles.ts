import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appRoleApi, type AppRole } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { AppRole };

export function useAppRoles(params?: { status?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusKey = params?.status ?? null;

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["app-roles", statusKey],
    queryFn: () => appRoleApi.list({ status: params?.status }),
  });

  const roles: AppRole[] = response?.data?.roles ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["app-roles"] });

  const createMutation = useMutation({
    mutationFn: appRoleApi.create,
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Role created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create role",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; status: "active" | "inactive" };
    }) => appRoleApi.update(id, data),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Role updated successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const assignPrivilegesMutation = useMutation({
    mutationFn: ({
      roleId,
      privilegeIds,
    }: {
      roleId: string;
      privilegeIds: string[];
    }) => appRoleApi.assignPrivileges(roleId, privilegeIds),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Privileges assigned successfully",
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
      roleId,
      privilegeId,
    }: {
      roleId: string;
      privilegeId: string;
    }) => appRoleApi.removePrivilege(roleId, privilegeId),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Privilege removed successfully",
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

  return {
    roles,
    isLoading,
    error,
    refetch,
    createRole: createMutation.mutateAsync,
    updateRole: (id: string, data: { name: string; status: "active" | "inactive" }) =>
      updateMutation.mutateAsync({ id, data }),
    assignPrivileges: (roleId: string, privilegeIds: string[]) =>
      assignPrivilegesMutation.mutateAsync({ roleId, privilegeIds }),
    removePrivilege: (roleId: string, privilegeId: string) =>
      removePrivilegeMutation.mutateAsync({ roleId, privilegeId }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isPrivilegePending:
      assignPrivilegesMutation.isPending || removePrivilegeMutation.isPending,
  };
}
