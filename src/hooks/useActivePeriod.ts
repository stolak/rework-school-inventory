import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activePeriodApi, type ActivePeriod } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useActivePeriod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["active-period"],
    queryFn: async () => {
      const res = await activePeriodApi.get();
      if (!res?.success) throw new Error((res as { message?: string })?.message || "Failed to load active period");
      return res.data as ActivePeriod;
    },
  });

  const mutation = useMutation({
    mutationFn: activePeriodApi.upsert,
    onSuccess: (res: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["active-period"] });
      toast({
        title: "Saved",
        description: res?.message || "Active period saved successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to save active period",
        variant: "destructive",
      });
    },
  });

  return {
    activePeriod: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    upsertActivePeriod: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
