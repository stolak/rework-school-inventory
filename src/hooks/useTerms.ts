import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { termApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface Term {
  id: string;
  name: string;
  status: "Active" | "Inactive" | string;
  createdAt?: string;
}

export function useTerms(params?: { page?: number; limit?: number; status?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["terms", page, limit, params?.status ?? null],
    queryFn: () => termApi.list({ page, limit, status: params?.status }),
  });

  const rawTerms = (response as any)?.data?.terms ?? [];
  const pagination = (response as any)?.data?.pagination;

  const terms: Term[] = rawTerms.map((t: any) => ({
    id: t.id,
    name: t.name,
    status: t.status,
    createdAt: t.createdAt,
  }));

  const addMutation = useMutation({
    mutationFn: termApi.create,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      toast({
        title: "Success",
        description: res?.message || "Term created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create term",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Term> }) =>
      termApi.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      toast({
        title: "Success",
        description: res?.message || "Term updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update term",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: termApi.remove,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      toast({
        title: "Success",
        description: res?.message || "Term deleted successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete term",
        variant: "destructive",
      });
    },
  });

  return {
    terms,
    pagination,
    isLoading,
    error,
    addTerm: addMutation.mutateAsync,
    updateTerm: (id: string, data: Partial<Term>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteTerm: deleteMutation.mutateAsync,
  };
}

