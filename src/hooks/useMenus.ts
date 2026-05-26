import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuApi, type AppMenu } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export type { AppMenu };

export type MenuFormData = {
  route: string;
  caption: string;
  status: "Active" | "Inactive";
};

export function useMenus(params?: { status?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusKey = params?.status ?? null;

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["menus", statusKey],
    queryFn: () => menuApi.list({ status: params?.status }),
  });

  const menus: AppMenu[] = response?.data?.menus ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["menus"] });

  const createMutation = useMutation({
    mutationFn: menuApi.create,
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Menu created successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create menu",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MenuFormData }) =>
      menuApi.update(id, data),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Success",
        description: res?.message || "Menu updated successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update menu",
        variant: "destructive",
      });
    },
  });

  return {
    menus,
    isLoading,
    error,
    refetch,
    createMenu: createMutation.mutateAsync,
    updateMenu: (id: string, data: MenuFormData) =>
      updateMutation.mutateAsync({ id, data }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
