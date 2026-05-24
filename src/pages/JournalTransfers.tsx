import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, ArrowLeftRight, Search, Eye, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
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
import { cn } from "@/lib/utils";

type EntryDraft = {
  id: string;
  transType: "Debit" | "Credit";
  accountId: string;
  debit: string;
  credit: string;
  remarks: string;
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Allow typing; strip commas and invalid chars, keep one decimal point */
function sanitizeAmountInput(raw: string): string {
  let t = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const firstDot = t.indexOf(".");
  if (firstDot !== -1) {
    t =
      t.slice(0, firstDot + 1) +
      t.slice(firstDot + 1).replace(/\./g, "");
  }
  return t;
}

function moneyToNumber(s: string): number {
  const cleaned = sanitizeAmountInput((s ?? "").toString());
  if (cleaned === "" || cleaned === ".") return 0;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function formatAmountDisplay(n: number): string {
  return amountFormatter.format(Number.isFinite(n) ? n : 0);
}

function formatAmountOnBlur(s: string): string {
  const cleaned = sanitizeAmountInput((s ?? "").toString());
  if (cleaned === "" || cleaned === ".") return "";
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return "";
  return amountFormatter.format(n);
}

function formatAmountFromApi(v: string | number | null | undefined): string {
  if (v == null) return amountFormatter.format(0);
  const s = String(v).replace(/,/g, "").trim();
  if (s === "") return amountFormatter.format(0);
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return String(v);
  return amountFormatter.format(n);
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
  const [commonTransactionDate, setCommonTransactionDate] = useState(() => new Date());
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
        transactionDate: commonTransactionDate.toISOString(),
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
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsLimit, setDetailsLimit] = useState(10);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const detailsQuery = useTempJournalTransfersList({
    referenceNo: selectedReferenceNo || undefined,
    page: detailsPage,
    limit: detailsLimit,
  });

  const detailRows = detailsQuery.data?.tempJournalTransfers ?? [];
  const detailsPagination = detailsQuery.data?.pagination ?? null;
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
                <Label>Transaction date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !commonTransactionDate && "text-muted-foreground",
                      )}
                    >
                      {commonTransactionDate ? (
                        format(commonTransactionDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-background border shadow-md"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={commonTransactionDate}
                      onSelect={(d) => {
                        if (d) setCommonTransactionDate(d);
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
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
                Debit: {formatAmountDisplay(totalDebit)}
              </Badge>
              <Badge variant={isBalanced ? "default" : "secondary"}>
                Credit: {formatAmountDisplay(totalCredit)}
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
                          type="text"
                          inputMode="decimal"
                          className="text-right tabular-nums"
                          value={e.debit}
                          disabled={e.transType !== "Debit"}
                          onFocus={() =>
                            updateRow(e.id, {
                              debit: e.debit.replace(/,/g, ""),
                            })
                          }
                          onChange={(ev) =>
                            updateRow(e.id, {
                              debit: sanitizeAmountInput(ev.target.value),
                            })
                          }
                          onBlur={() =>
                            updateRow(e.id, {
                              debit: formatAmountOnBlur(e.debit),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right min-w-[130px]">
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-right tabular-nums"
                          value={e.credit}
                          disabled={e.transType !== "Credit"}
                          onFocus={() =>
                            updateRow(e.id, {
                              credit: e.credit.replace(/,/g, ""),
                            })
                          }
                          onChange={(ev) =>
                            updateRow(e.id, {
                              credit: sanitizeAmountInput(ev.target.value),
                            })
                          }
                          onBlur={() =>
                            updateRow(e.id, {
                              credit: formatAmountOnBlur(e.credit),
                            })
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
                        <TableCell className="text-right tabular-nums">
                          {formatAmountFromApi(g.totalDebit)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAmountFromApi(g.totalCredit)}
                        </TableCell>
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
                              setDetailsPage(1);
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
                setDetailsPage(1);
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
                              {formatAmountFromApi(r.debit)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatAmountFromApi(r.credit)}
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

                  {detailsPagination && (
                    <TablePaginationBar
                      pagination={detailsPagination}
                      totalLabel="Total entries"
                      pageSize={detailsLimit}
                      onPageChange={setDetailsPage}
                      onPageSizeChange={(limit) => {
                        setDetailsLimit(limit);
                        setDetailsPage(1);
                      }}
                    />
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

