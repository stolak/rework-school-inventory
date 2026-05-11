import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  tempJournalTransfersApi,
  type BatchStatus,
  type JournalTransferType,
  type TempJournalTransferGrouped,
  type TempJournalTransferRow,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export type JournalTransferEntryInput = {
  transType: JournalTransferType;
  accountId: number;
  debit: number | null;
  credit: number | null;
  manualReferenceNo?: string;
  transactionDate: string;
  batchStatus: BatchStatus;
  remarks?: string;
};

export function useTempJournalTransferGroups(params: { batchStatus?: BatchStatus }) {
  return useQuery({
    queryKey: ["temp-journal-transfers-grouped", params],
    queryFn: async () => {
      const res = await tempJournalTransfersApi.groupedByReferenceNo(params);
      if (!res.success) throw new Error(res.message || "Failed to load grouped journal transfers");
      return res.data as TempJournalTransferGrouped[];
    },
  });
}

export function useTempJournalTransfersList(params: {
  referenceNo?: string;
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: ["temp-journal-transfers", params],
    queryFn: async () => {
      const res = await tempJournalTransfersApi.list(params);
      if (!res.success) throw new Error(res.message || "Failed to load journal transfers");
      return res.data as { tempJournalTransfers: TempJournalTransferRow[]; pagination: any };
    },
    enabled: Boolean(params.referenceNo),
  });
}

export function useCreateTempJournalTransfers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (body: { entries: JournalTransferEntryInput[] }) => {
      // Client-side validation (matches your notes)
      const entries = body.entries;
      const totalDebit = entries.reduce((s, e) => s + toNumber(e.debit), 0);
      const totalCredit = entries.reduce((s, e) => s + toNumber(e.credit), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.000001) {
        throw new Error("Total debit must equal total credit.");
      }
      for (const e of entries) {
        if (e.transType === "Debit") {
          if (toNumber(e.credit) !== 0) throw new Error("Credit must be 0 for Debit rows.");
          if (e.debit == null || toNumber(e.debit) <= 0) throw new Error("Debit must be > 0 for Debit rows.");
        } else {
          if (toNumber(e.debit) !== 0) throw new Error("Debit must be 0 for Credit rows.");
          if (e.credit == null || toNumber(e.credit) <= 0) throw new Error("Credit must be > 0 for Credit rows.");
        }
      }

      return tempJournalTransfersApi.bulkCreate(body as any);
    },
    onSuccess: (res) => {
      toast({
        title: "Success",
        description: res.message || "Temp journal transfers created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["temp-journal-transfers-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["temp-journal-transfers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create journal transfer",
        variant: "destructive",
      });
    },
  });
}

