import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  storeTransferApi,
  type StoreTransferListRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function parseApiErrorMessage(err: unknown): string {
  if (!(err instanceof Error) || !err.message) return "Request failed";
  const raw = err.message.trim();
  if (raw.startsWith("{")) {
    try {
      const j = JSON.parse(raw) as { message?: string };
      if (j?.message) return String(j.message);
    } catch {
      /* fallthrough */
    }
  }
  return raw;
}

export type StoreTransferRowView = StoreTransferListRow & {
  createdByName?: string;
};

export function useStoreTransfers(params?: {
  status?: string;
  sourceStoreId?: string;
  destStoreId?: string;
  itemId?: string;
  transactionDateFrom?: string;
  transactionDateTo?: string;
  page?: number;
  limit?: number;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["store-transfers", params],
    queryFn: () => storeTransferApi.list(params),
  });

  const raw: StoreTransferListRow[] =
    (response as any)?.data?.transfers ?? [];
  const pagination = (response as any)?.data?.pagination;

  const transfers: StoreTransferRowView[] = raw.map((t) => ({
    ...t,
    createdByName: t.createdBy
      ? `${t.createdBy.firstName ?? ""} ${t.createdBy.lastName ?? ""}`.trim()
      : undefined,
  }));

  const createMutation = useMutation({
    mutationFn: async (
      body: Parameters<typeof storeTransferApi.create>[0]
    ) => {
      const res = await storeTransferApi.create(body);
      if (!res?.success) {
        throw new Error(res?.message || "Store transfer failed");
      }
      return res;
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["store-transfers"] });
      toast({
        title: "Success",
        description:
          res?.message ||
          `Transfer completed${res?.data?.referenceNo ? ` (${res.data.referenceNo})` : ""}`,
      });
    },
    onError: (e: unknown) => {
      toast({
        title: "Transfer failed",
        description: parseApiErrorMessage(e),
        variant: "destructive",
      });
    },
  });

  return {
    transfers,
    pagination,
    isLoading,
    error,
    createTransfer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
