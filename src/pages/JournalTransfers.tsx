import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowLeftRight, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import {
  useCreateTempJournalTransfers,
  useTempJournalTransferGroups,
  useTempJournalTransfersList,
  type JournalTransferEntryInput,
} from "@/hooks/useJournalTransfers";

type EntryDraft = {
  id: string;
  transType: "Debit" | "Credit";
  accountId: string;
  debit: string;
  credit: string;
  remarks: string;
};

function moneyToNumber(s: string): number {
  const n = parseFloat((s ?? "").toString());
  return Number.isFinite(n) ? n : 0;
}

function isoNowLocal(): string {
  return new Date().toISOString();
}

export default function JournalTransfers() {
  const [tab, setTab] = useState<"create" | "history">("create");

  const { charts: accountCharts = [] } = useAccountCharts({ status: "All" });
  const accountOptions = useMemo(() => {
    const mapped = accountCharts.map((a) => ({
      value: String(a.id),
      label: `${a.accountNo?.trim() ? `${a.accountNo} — ` : ""}${a.accountDescription}`,
    }));
    mapped.sort((x, y) => x.label.localeCompare(y.label));
    return mapped;
  }, [accountCharts]);

  const [commonManualRef, setCommonManualRef] = useState("");
  const [commonDate, setCommonDate] = useState(isoNowLocal());
  const commonBatchStatus = "Processed" as const;

  const [entries, setEntries] = useState<EntryDraft[]>([
    {
      id: crypto.randomUUID(),
      transType: "Debit",
      accountId: "",
      debit: "",
      credit: "",
      remarks: "",
    },
    {
      id: crypto.randomUUID(),
      transType: "Credit",
      accountId: "",
      debit: "",
      credit: "",
      remarks: "",
    },
  ]);

  const totalDebit = useMemo(
    () => entries.reduce((s, e) => s + moneyToNumber(e.debit), 0),
    [entries]
  );
  const totalCredit = useMemo(
    () => entries.reduce((s, e) => s + moneyToNumber(e.credit), 0),
    [entries]
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.000001;

  const addRow = (type: EntryDraft["transType"]) => {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        transType: type,
        accountId: "",
        debit: "",
        credit: "",
        remarks: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateRow = (id: string, patch: Partial<EntryDraft>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next: EntryDraft = { ...e, ...patch };
        // enforce rule: only one side has value (and disable other)
        if (next.transType === "Debit") {
          next.credit = "";
        } else {
          next.debit = "";
        }
        return next;
      })
    );
  };

  const copyRemarksFromRow = (fromId: string) => {
    const from = entries.find((e) => e.id === fromId);
    const text = from?.remarks ?? "";
    setEntries((prev) => prev.map((e) => ({ ...e, remarks: text })));
  };

  const copyRemarksDown = (fromIndex: number) => {
    setEntries((prev) => {
      const from = prev[fromIndex];
      const text = from?.remarks ?? "";
      return prev.map((e, idx) => (idx > fromIndex ? { ...e, remarks: text } : e));
    });
  };

  const createMutation = useCreateTempJournalTransfers();

  const canSubmit = useMemo(() => {
    if (entries.length < 2) return false;
    if (!isBalanced) return false;
    for (const e of entries) {
      const accountId = parseInt(e.accountId, 10);
      if (!Number.isFinite(accountId) || accountId <= 0) return false;
      if (e.transType === "Debit") {
        if (moneyToNumber(e.debit) <= 0) return false;
        if (moneyToNumber(e.credit) !== 0) return false;
      } else {
        if (moneyToNumber(e.credit) <= 0) return false;
        if (moneyToNumber(e.debit) !== 0) return false;
      }
    }
    return true;
  }, [entries, isBalanced]);

  const submit = async () => {
    const payloadEntries: JournalTransferEntryInput[] = entries.map((e) => {
      const accountId = parseInt(e.accountId, 10);
      const debit = e.transType === "Debit" ? moneyToNumber(e.debit) : 0;
      const credit = e.transType === "Credit" ? moneyToNumber(e.credit) : 0;
      return {
        transType: e.transType,
        accountId,
        debit,
        credit,
        manualReferenceNo: commonManualRef || undefined,
        transactionDate: commonDate || isoNowLocal(),
        batchStatus: commonBatchStatus,
        remarks: e.remarks || undefined,
      };
    });

    const res = await createMutation.mutateAsync({ entries: payloadEntries });
    // Reset to fresh draft (keep last common values)
    setEntries([
      {
        id: crypto.randomUUID(),
        transType: "Debit",
        accountId: "",
        debit: "",
        credit: "",
        remarks: "",
      },
      {
        id: crypto.randomUUID(),
        transType: "Credit",
        accountId: "",
        debit: "",
        credit: "",
        remarks: "",
      },
    ]);
    setTab("history");
    setHistoryBatchStatus("Processed");
    setSelectedReferenceNo(res.data.referenceNo);
  };

  // History
  const [historyBatchStatus, setHistoryBatchStatus] = useState<
    "Pending" | "Processed" | "Failed"
  >("Processed");
  const [historySearch, setHistorySearch] = useState("");
  const { data: grouped = [], isLoading: groupedLoading } =
    useTempJournalTransferGroups({ batchStatus: historyBatchStatus });

  const groupedFiltered = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return grouped;
    return grouped.filter((g) => g.referenceNo.toLowerCase().includes(q));
  }, [grouped, historySearch]);

  const [selectedReferenceNo, setSelectedReferenceNo] = useState<string>("");
  const [detailsPageStr, setDetailsPageStr] = useState("1");
  const detailsPage = Math.max(1, parseInt(detailsPageStr || "1", 10) || 1);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const detailsQuery = useTempJournalTransfersList({
    referenceNo: selectedReferenceNo || undefined,
    page: detailsPage,
    limit: 100,
  });

  const detailRows = detailsQuery.data?.tempJournalTransfers ?? [];
  const detailsPagination = detailsQuery.data?.pagination ?? null;
  const detailsCanPrev = detailsPagination ? detailsPagination.page > 1 : detailsPage > 1;
  const detailsCanNext = detailsPagination
    ? detailsPagination.page < detailsPagination.totalPages
    : false;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8" />
            Journal transfers
          </h1>
          <p className="text-muted-foreground mt-1">
            Create balanced debit/credit batches and review by reference number.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "create" ? "default" : "outline"}
            onClick={() => setTab("create")}
          >
            Create
          </Button>
          <Button
            variant={tab === "history" ? "default" : "outline"}
            onClick={() => setTab("history")}
          >
            History
          </Button>
        </div>
      </div>

      {tab === "create" ? (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Batch defaults</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Manual reference no</Label>
                <Input
                  value={commonManualRef}
                  onChange={(e) => setCommonManualRef(e.target.value)}
                  placeholder="e.g. INV-0001"
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction date (ISO)</Label>
                <Input
                  value={commonDate}
                  onChange={(e) => setCommonDate(e.target.value)}
                  placeholder={isoNowLocal()}
                />
              </div>
              <div className="space-y-2">
                <Label>Batch status</Label>
                <div className="h-10 flex items-center rounded-md border px-3 text-sm text-muted-foreground">
                  Processed (default)
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => addRow("Debit")}>
                <Plus className="mr-2 h-4 w-4" />
                Add debit row
              </Button>
              <Button variant="outline" onClick={() => addRow("Credit")}>
                <Plus className="mr-2 h-4 w-4" />
                Add credit row
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isBalanced ? "default" : "secondary"}>
                Debit: {totalDebit}
              </Badge>
              <Badge variant={isBalanced ? "default" : "secondary"}>
                Credit: {totalCredit}
              </Badge>
              {!isBalanced && (
                <span className="text-sm text-muted-foreground">
                  Totals must match.
                </span>
              )}
            </div>
          </div>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right w-[170px]">Remark tools</TableHead>
                    <TableHead className="text-right w-[70px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e, idx) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Select
                          value={e.transType}
                          onValueChange={(v) =>
                            updateRow(e.id, { transType: v as any })
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Debit">Debit</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[260px]">
                        <Combobox
                          options={accountOptions}
                          value={e.accountId}
                          onValueChange={(v) => updateRow(e.id, { accountId: v })}
                          placeholder="Select account…"
                          searchPlaceholder="Search accounts…"
                        />
                      </TableCell>
                      <TableCell className="text-right min-w-[130px]">
                        <Input
                          type="number"
                          min={0}
                          value={e.debit}
                          disabled={e.transType !== "Debit"}
                          onChange={(ev) =>
                            updateRow(e.id, { debit: ev.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right min-w-[130px]">
                        <Input
                          type="number"
                          min={0}
                          value={e.credit}
                          disabled={e.transType !== "Credit"}
                          onChange={(ev) =>
                            updateRow(e.id, { credit: ev.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <Input
                          value={e.remarks}
                          onChange={(ev) =>
                            updateRow(e.id, { remarks: ev.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyRemarksDown(idx)}
                            disabled={!e.remarks}
                            title="Copy this remark to rows below"
                          >
                            Copy down
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyRemarksFromRow(e.id)}
                            disabled={!e.remarks}
                            title="Copy this remark to all rows"
                          >
                            Copy all
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeRow(e.id)}
                          disabled={entries.length <= 2}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={!canSubmit || createMutation.isPending}
            >
              Post batch
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Batches</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Batch status</Label>
                <Select
                  value={historyBatchStatus}
                  onValueChange={(v) =>
                    setHistoryBatchStatus(v as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1 lg:col-span-2">
                <Label>Search reference no</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="e.g. TJT-20260511-..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Batches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {groupedLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading batches…
                </div>
              ) : groupedFiltered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No batches found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference no</TableHead>
                      <TableHead>Batch status</TableHead>
                      <TableHead className="text-right">Total debit</TableHead>
                      <TableHead className="text-right">Total credit</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right w-[90px]">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedFiltered.map((g) => (
                      <TableRow key={g.referenceNo}>
                        <TableCell className="font-medium">{g.referenceNo}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{g.batchStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{g.totalDebit}</TableCell>
                        <TableCell className="text-right tabular-nums">{g.totalCredit}</TableCell>
                        <TableCell className="text-right tabular-nums">{g.count}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(g.latestTransactionDate).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReferenceNo(g.referenceNo);
                              setDetailsPageStr("1");
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={detailsOpen}
            onOpenChange={(open) => {
              setDetailsOpen(open);
              if (!open) {
                setSelectedReferenceNo("");
                setDetailsPageStr("1");
              }
            }}
          >
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>
                  Batch entries {selectedReferenceNo ? `• ${selectedReferenceNo}` : ""}
                </DialogTitle>
              </DialogHeader>

              {detailsQuery.isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading entries…
                </div>
              ) : detailRows.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No entries found.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    {detailsPagination
                      ? `Page ${detailsPagination.page} of ${detailsPagination.totalPages} • Total ${detailsPagination.total}`
                      : `Showing ${detailRows.length} rows`}
                  </div>

                  <div className="max-h-[60vh] overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead>Manual Ref</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.transType}</TableCell>
                            <TableCell className="text-sm">
                              {r.account?.accountDescription ?? `Account ${r.accountId}`}
                              {r.account?.accountNo ? (
                                <div className="text-xs text-muted-foreground">
                                  {r.account.accountNo}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.debit ?? "0"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.credit ?? "0"}
                            </TableCell>
                            <TableCell>{r.manualReferenceNo ?? "—"}</TableCell>
                            <TableCell className="text-sm">
                              {new Date(r.transactionDate).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {r.remarks ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {detailsPagination && detailsPagination.totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!detailsCanPrev) return;
                              setDetailsPageStr(String(Math.max(1, detailsPage - 1)));
                            }}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (!detailsCanNext) return;
                              setDetailsPageStr(String(detailsPage + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

