import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { schoolSessionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface SchoolSession {
  id: string;
  name: string;
  status: "Active" | "Inactive" | string;
  createdAt?: string;
}

export function useSchoolSessions(params?: { page?: number; limit?: number; status?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["school-sessions", page, limit, params?.status ?? null],
    queryFn: () => schoolSessionApi.list({ page, limit, status: params?.status }),
  });

  const rawSessions = (response as any)?.data?.sessions ?? [];
  const pagination = (response as any)?.data?.pagination;

  const sessions: SchoolSession[] = rawSessions.map((s: any) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    createdAt: s.createdAt,
  }));

  const addMutation = useMutation({
    mutationFn: schoolSessionApi.create,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["school-sessions"] });
      toast({
        title: "Success",
        description: res?.message || "Session created successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to create session",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SchoolSession> }) =>
      schoolSessionApi.update(id, data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["school-sessions"] });
      toast({
        title: "Success",
        description: res?.message || "Session updated successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to update session",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: schoolSessionApi.remove,
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["school-sessions"] });
      toast({
        title: "Success",
        description: res?.message || "Session deleted successfully",
      });
    },
    onError: (e: any) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete session",
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    pagination,
    isLoading,
    error,
    addSession: addMutation.mutateAsync,
    updateSession: (id: string, data: Partial<SchoolSession>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteSession: deleteMutation.mutateAsync,
  };
}

