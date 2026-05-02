import { useQuery } from "@tanstack/react-query";
import { storeApi, type MyStoreRow } from "@/lib/api";

export function useMyStores(params?: { page?: number; limit?: number }) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["stores", "me", page, limit],
    queryFn: () => storeApi.listMine({ page, limit }),
  });

  const stores: MyStoreRow[] = (response as any)?.data?.stores ?? [];
  const pagination = (response as any)?.data?.pagination;

  return { stores, pagination, isLoading, error };
}
