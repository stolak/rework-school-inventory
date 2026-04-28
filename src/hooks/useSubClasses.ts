import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subClassApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface SubClass {
  id: string;
  name: string;
  classId: string;
  status: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
  class?: { id: string; name: string } | null;
}

export function useSubClasses(params?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["sub-classes", page, limit],
    queryFn: () => subClassApi.list({ page, limit }),
  });

  const rawSubClasses = (response as any)?.data?.subClasses ?? [];
  const pagination = (response as any)?.data?.pagination;

  const subClasses: SubClass[] = rawSubClasses.map((sc: any) => ({
    id: sc.id,
    name: sc.name,
    classId: sc.classId,
    status: sc.status,
    createdAt: sc.createdAt,
    updatedAt: sc.updatedAt,
    class: sc.class,
  }));

  const addMutation = useMutation({
    mutationFn: subClassApi.create,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["sub-classes"] });
      toast({
        title: "Success",
        description: res?.message || "Sub class created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create sub class",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubClass> }) =>
      subClassApi.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["sub-classes"] });
      toast({
        title: "Success",
        description: res?.message || "Sub class updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update sub class",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subClassApi.remove,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["sub-classes"] });
      toast({
        title: "Success",
        description: res?.message || "Sub class deleted successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete sub class",
        variant: "destructive",
      });
    },
  });

  return {
    subClasses,
    pagination,
    isLoading,
    error,
    addSubClass: addMutation.mutateAsync,
    updateSubClass: (id: string, data: Partial<SubClass>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteSubClass: deleteMutation.mutateAsync,
  };
}

