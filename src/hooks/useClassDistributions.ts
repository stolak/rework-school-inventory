import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classDistributionApi } from "@/lib/api";
import { toast } from "sonner";

export interface ClassDistribution {
  id: string;
  class_id: string;
  inventory_item_id: string;
  session_term_id: string;
  distributed_quantity: number;
  distribution_date: string;
  received_by?: string;
  receiver_name?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relations
  school_classes?: { id: string; name: string };
  inventory_items?: {
    id: string;
    name: string;
    sku?: string;
    categories?: { id: string; name: string };
    cost_price?: number;
    selling_price?: number;
  };
  academic_session_terms?: {
    id: string;
    name: string;
    session?: string;
  };
  class_teachers?: {
    id: string;
    name: string;
  };
}

export function useClassDistributions(params?: {
  class_id?: string;
  session_term_id?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["class-distributions", params],
    queryFn: () => classDistributionApi.list(params),
  });

  const distributions = response?.data || [];
  const pagination = response?.pagination;

  const addMutation = useMutation({
    mutationFn: classDistributionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-distributions"] });
      toast.success("Distribution recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to record distribution: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      classDistributionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-distributions"] });
      toast.success("Distribution updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update distribution: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: classDistributionApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-distributions"] });
      toast.success("Distribution deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete distribution: ${error.message}`);
    },
  });

  return {
    distributions,
    pagination,
    isLoading,
    addDistribution: (data: any) => addMutation.mutate(data),
    updateDistribution: (id: string, data: any) =>
      updateMutation.mutate({ id, data }),
    deleteDistribution: (id: string) => deleteMutation.mutate(id),
  };
}
