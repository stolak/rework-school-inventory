import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultBillingPeriodApi, type DefaultBillingPeriod } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useDefaultBillingPeriod() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["default-billing-period"],
    queryFn: async () => {
      const res = await defaultBillingPeriodApi.get();
      if (!res?.success)
        throw new Error(
          (res as { message?: string })?.message || "Failed to load default billing period"
        );
      return res.data as DefaultBillingPeriod;
    },
  });

  const mutation = useMutation({
    mutationFn: defaultBillingPeriodApi.upsert,
    onSuccess: (res: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["default-billing-period"] });
      toast({
        title: "Saved",
        description: res?.message || "Default billing period saved successfully",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Error",
        description: e?.message || "Failed to save default billing period",
        variant: "destructive",
      });
    },
  });

  return {
    defaultBillingPeriod: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    upsertDefaultBillingPeriod: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
