import { useQuery } from "@tanstack/react-query";
import { distributionCollectionApi } from "@/lib/api";

export interface DistributionCollection {
  inventory_item_id: string;
  total_received_quantity: number;
  total_distributed_quantity: number;
  balance_quantity: number;
  inventory_items: {
    id: string;
    name: string;
    sku: string;
    categories: {
      id: string;
      name: string;
    };
  };
  item_name: string;
  last_distribution_date: string;
}

export const useDistributionCollection = (params?: {
  inventory_item_id?: string;
  class_id?: string;
  session_term_id?: string;
  teacher_id?: string;
}) => {
  const {
    data: collections = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["distribution-collection", params],
    queryFn: () => distributionCollectionApi.query(params),
    enabled: true || Object.keys(params || {}).length > 0,
  });

  return {
    collections: collections as DistributionCollection[],
    isLoading,
    error,
  };
};
