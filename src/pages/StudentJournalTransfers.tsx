import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeftRight, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudents } from "@/hooks/useStudents";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import {
  useCreateStudentJournalTransfer,
  useStudentJournalTransfersList,
} from "@/hooks/useStudentJournalTransfers";
import type { StudentJournalTransferGroup } from "@/lib/api";

type EntryDraft = {
  id: string;
  accountId: string;
  amount: string;
  transactionType: "debit" | "credit";
  remarks: string;
};

/** Header-level mode: Payment (cash accounts, debit only) vs Journal (full behavior). */
type TransferMode = "Payment" | "Journal";

function createEmptyEntry(transactionType: EntryDraft["transactionType"]): EntryDraft {
  return {
    id: crypto.randomUUID(),
    accountId: "",
    amount: "",
    transactionType,
    remarks: "",
  };
}

function defaultEntriesForMode(mode: TransferMode): EntryDraft[] {
  if (mode === "Payment") {
    return [createEmptyEntry("debit")];
  }
  return [createEmptyEntry("debit"), createEmptyEntry("credit")];
}

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function sanitizeAmountInput(raw: string): string {
  let t = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const firstDot = t.indexOf(".");
  if (firstDot !== -1) {
    t = t.slice(0, firstDot + 1) + t.slice(firstDot + 1).replace(/\./g, "");
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

function transferRecordTotal(group: StudentJournalTransferGroup): number {
  return group.record.reduce((sum, line) => sum + Number(line.amount ?? 0), 0);
}

/** Combobox value for “all students” (empty string breaks CommandItem keys). */
const ALL_STUDENTS_VALUE = "__all__";

function isAllStudentsSelection(id: string): boolean {
  return id === ALL_STUDENTS_VALUE || id === "";
}

function transferModeFromParam(value: string | null): TransferMode {
  return value === "Journal" ? "Journal" : "Payment";
}

export default function StudentJournalTransfers() {
  const [searchParams] = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId")?.trim() ?? "";

  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(
    today.getFullYear(),
    today.getMonth() - 3,
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  const [tab, setTab] = useState<"create" | "history">(() =>
    searchParams.get("tab") === "history" ? "history" : "create"
  );

  const { students, isLoading: studentsLoading } = useStudents({
    page: 1,
    limit: 500,
    status: "Active",
  });
  const { charts: allAccountCharts = [] } = useAccountCharts({ status: "All" });
  const { charts: cashAccountCharts = [] } = useAccountCharts({
    status: "All",
    accountType: "Cash",
  });

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: `${s.admissionNumber} — ${s.firstName} ${s.lastName}`,
      })),
    [students]
  );

  const studentOptionsWithAll = useMemo(
    () => [{ value: ALL_STUDENTS_VALUE, label: "All" }, ...studentOptions],
    [studentOptions]
  );

  const studentLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) {
      m.set(s.id, `${s.admissionNumber} — ${s.firstName} ${s.lastName}`);
    }
    return m;
  }, [students]);

  const [transferMode, setTransferMode] = useState<TransferMode>(() =>
    transferModeFromParam(searchParams.get("transferMode"))
  );

  const accountChartsForMode =
    transferMode === "Payment" ? cashAccountCharts : allAccountCharts;

  const cashAccountIdSet = useMemo(
    () => new Set(cashAccountCharts.map((a) => String(a.id))),
    [cashAccountCharts]
  );

  const accountOptions = useMemo(() => {
    const mapped = accountChartsForMode.map((a) => ({
      value: String(a.id),
      label: `${a.accountNo?.trim() ? `${a.accountNo} — ` : ""}${a.accountDescription}`,
    }));
    mapped.sort((x, y) => x.label.localeCompare(y.label));
    return mapped;
  }, [accountChartsForMode]);

  const [studentId, setStudentId] = useState(() =>
    studentIdFromUrl && !isAllStudentsSelection(studentIdFromUrl)
      ? studentIdFromUrl
      : ALL_STUDENTS_VALUE
  );
  const [manualRef, setManualRef] = useState("");
  const [transactionDate, setTransactionDate] = useState(defaultTo);
  const [entries, setEntries] = useState<EntryDraft[]>(() => defaultEntriesForMode("Payment"));

  const [historyStudentId, setHistoryStudentId] = useState(ALL_STUDENTS_VALUE);
  const [historyDateFrom, setHistoryDateFrom] = useState(defaultFrom);
  const [historyDateTo, setHistoryDateTo] = useState(defaultTo);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<StudentJournalTransferGroup | null>(null);

  const totalDebit = useMemo(
    () =>
      entries.reduce(
        (s, e) =>
          e.transactionType === "debit" ? s + moneyToNumber(e.amount) : s,
        0
      ),
    [entries]
  );
  const totalCredit = useMemo(
    () =>
      entries.reduce(
        (s, e) =>
          e.transactionType === "credit" ? s + moneyToNumber(e.amount) : s,
        0
      ),
    [entries]
  );
  const isPaymentMode = transferMode === "Payment";

  const handleTransferModeChange = (mode: TransferMode) => {
    setTransferMode(mode);
    if (mode === "Payment") {
      setEntries((prev) =>
        prev.map((e) => ({
          ...e,
          transactionType: "debit" as const,
          accountId:
            e.accountId && cashAccountIdSet.has(e.accountId) ? e.accountId : "",
        }))
      );
    } else {
      setEntries((prev) => {
        if (prev.length >= 2) return prev;
        if (prev.length === 0) return defaultEntriesForMode("Journal");
        const hasCredit = prev.some((e) => e.transactionType === "credit");
        if (hasCredit) return prev;
        return [...prev, createEmptyEntry("credit")];
      });
    }
  };

  const addRow = (type: EntryDraft["transactionType"]) => {
    const rowType = isPaymentMode ? "debit" : type;
    setEntries((prev) => [...prev, createEmptyEntry(rowType)]);
  };

  const removeRow = (id: string) => {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((e) => e.id !== id)));
  };

  const updateRow = (id: string, patch: Partial<EntryDraft>) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...patch };
        if (transferMode === "Payment") {
          return { ...next, transactionType: "debit" };
        }
        return next;
      })
    );
  };

  const createMutation = useCreateStudentJournalTransfer();

  const canSubmit = useMemo(() => {
    if (isAllStudentsSelection(studentId)) return false;
    if (!transactionDate) return false;
    if (entries.length < 1) return false;
    for (const e of entries) {
      const accountId = parseInt(e.accountId, 10);
      if (!Number.isFinite(accountId) || accountId <= 0) return false;
      if (moneyToNumber(e.amount) <= 0) return false;
    }
    return true;
  }, [studentId, transactionDate, entries]);

  const submit = async () => {
    const payloadEntries = entries.map((e) => ({
      amount: moneyToNumber(e.amount),
      accountId: e.accountId,
      transactionType: e.transactionType,
      remarks: e.remarks || undefined,
    }));

    const res = await createMutation.mutateAsync({
      studentId,
      manualRef: manualRef.trim() || undefined,
      transactionDate,
      entries: payloadEntries,
    });

    setHistoryStudentId(studentId);
    setHistoryDateFrom(
      new Date(
        new Date(`${transactionDate}T12:00:00`).getTime() - 7 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10)
    );
    setHistoryDateTo(transactionDate);
    if (res.data?.ref) setManualRef("");
    setEntries(defaultEntriesForMode(transferMode));
    setTab("history");
  };

  const historyDateInvalid = Boolean(
    historyDateFrom && historyDateTo && historyDateFrom > historyDateTo
  );

  const historyAllStudents = isAllStudentsSelection(historyStudentId);

  const historyParams = useMemo(() => {
    if (historyDateInvalid) return null;
    if (historyAllStudents) {
      return {
        allStudents: true,
        dateFrom: historyDateFrom || undefined,
        dateTo: historyDateTo || undefined,
      };
    }
    if (!historyStudentId) return null;
    return {
      allStudents: false,
      studentId: historyStudentId,
      dateFrom: historyDateFrom || undefined,
      dateTo: historyDateTo || undefined,
    };
  }, [historyStudentId, historyAllStudents, historyDateFrom, historyDateTo, historyDateInvalid]);

  const {
    data: historyGroups = [],
    isLoading: historyLoading,
    isError: historyError,
    error: historyErr,
    refetch: refetchHistory,
    isFetching: historyFetching,
  } = useStudentJournalTransfersList(historyParams);

  useEffect(() => {
    const id = searchParams.get("studentId")?.trim() ?? "";
    if (id && !isAllStudentsSelection(id)) {
      setStudentId(id);
      setTab(searchParams.get("tab") === "history" ? "history" : "create");
      setTransferMode(transferModeFromParam(searchParams.get("transferMode")));
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      tab === "history" &&
      !isAllStudentsSelection(studentId) &&
      isAllStudentsSelection(historyStudentId)
    ) {
      setHistoryStudentId(studentId);
    }
  }, [tab, studentId, historyStudentId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8" />
            Student journal transfers
          </h1>
          <p className="text-muted-foreground mt-1">
            Post debit and credit entries against a student&apos;s account, then review past
            transfers by student and date range.
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
              <CardTitle className="text-lg">Transfer details</CardTitle>
              <CardDescription>
                Choose a student (not All), transfer type, and transaction date. Payment posts
                debits to cash accounts only; Journal allows debit and credit on any account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>Student</Label>
                {studentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading students…</p>
                ) : (
                  <Combobox
                    value={studentId}
                    onValueChange={setStudentId}
                    options={studentOptionsWithAll}
                    placeholder="All students"
                    searchPlaceholder="Admission no or name…"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Transfer type</Label>
                <Select
                  value={transferMode}
                  onValueChange={(v) => handleTransferModeChange(v as TransferMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Payment">Payment</SelectItem>
                    <SelectItem value="Journal">Journal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Manual reference</Label>
                <Input
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="Optional reference"
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction date</Label>
                <Input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => addRow("debit")}>
                <Plus className="mr-2 h-4 w-4" />
                {isPaymentMode ? "Add line" : "Add debit"}
              </Button>
              {!isPaymentMode ? (
                <Button type="button" variant="outline" onClick={() => addRow("credit")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add credit
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                Debit: {formatAmountDisplay(totalDebit)}
              </Badge>
              {!isPaymentMode ? (
                <Badge variant="secondary">
                  Credit: {formatAmountDisplay(totalCredit)}
                </Badge>
              ) : null}
            </div>
          </div>

          <Card className="shadow-card overflow-hidden">
            <CardContent className="p-0 pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right w-[160px]">Amount</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {isPaymentMode ? (
                          <Badge variant="secondary" className="font-normal">
                            Debit
                          </Badge>
                        ) : (
                          <Select
                            value={row.transactionType}
                            onValueChange={(v) =>
                              updateRow(row.id, {
                                transactionType: v as EntryDraft["transactionType"],
                              })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debit">Debit</SelectItem>
                              <SelectItem value="credit">Credit</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Combobox
                          options={accountOptions}
                          value={row.accountId}
                          onValueChange={(v) => updateRow(row.id, { accountId: v })}
                          placeholder="Select account…"
                          searchPlaceholder="Search accounts…"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-right tabular-nums"
                          placeholder="0"
                          value={row.amount}
                          onFocus={() =>
                            updateRow(row.id, {
                              amount: row.amount.replace(/,/g, ""),
                            })
                          }
                          onChange={(e) =>
                            updateRow(row.id, {
                              amount: sanitizeAmountInput(e.target.value),
                            })
                          }
                          onBlur={() =>
                            updateRow(row.id, {
                              amount: formatAmountOnBlur(row.amount),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.remarks}
                          onChange={(e) => updateRow(row.id, { remarks: e.target.value })}
                          placeholder="Remarks"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={entries.length <= 1}
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
            <Button onClick={submit} disabled={!canSubmit || createMutation.isPending}>
              {createMutation.isPending ? "Posting…" : "Post transfer"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Search</CardTitle>
              <CardDescription>
                Choose All or a specific student, then set the date range. Use View to open
                line items for each transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Student</Label>
                <Combobox
                  value={historyStudentId}
                  onValueChange={setHistoryStudentId}
                  options={studentOptionsWithAll}
                  placeholder="All students"
                  searchPlaceholder="Admission no or name…"
                />
              </div>
              <div className="space-y-2">
                <Label>From date</Label>
                <Input
                  type="date"
                  value={historyDateFrom}
                  onChange={(e) => setHistoryDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To date</Label>
                <Input
                  type="date"
                  value={historyDateTo}
                  onChange={(e) => setHistoryDateTo(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {historyDateInvalid ? (
            <p className="text-center text-destructive py-8">
              From date must be on or before to date.
            </p>
          ) : historyLoading || historyFetching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : historyError ? (
            <p className="text-center text-destructive py-8">
              {(historyErr as Error)?.message || "Failed to load transfers"}
            </p>
          ) : historyGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transfers in this period.
            </p>
          ) : (
            <Card className="shadow-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-lg">
                    Transfers ({historyGroups.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {historyDateFrom} to {historyDateTo}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchHistory()}
                  disabled={historyFetching}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {historyAllStudents ? <TableHead>Student</TableHead> : null}
                        <TableHead>Reference</TableHead>
                        <TableHead>Manual ref</TableHead>
                        <TableHead>Transaction date</TableHead>
                        <TableHead className="text-right">Lines</TableHead>
                        <TableHead className="text-right">Total amount</TableHead>
                        <TableHead className="text-right w-[90px]">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyGroups.map((group) => (
                        <TableRow key={`${group.studentId}-${group.ref}`}>
                          {historyAllStudents ? (
                            <TableCell className="text-sm font-medium max-w-[200px] truncate">
                              {studentLabelById.get(group.studentId) ?? group.studentId}
                            </TableCell>
                          ) : null}
                          <TableCell className="font-mono text-sm font-medium">
                            {group.ref}
                          </TableCell>
                          <TableCell className="text-sm">
                            {group.manualRef?.trim() ? group.manualRef : "—"}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {group.transactionDate
                              ? new Date(group.transactionDate).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {group.record.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatAmountDisplay(transferRecordTotal(group))}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTransfer(group);
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
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog
            open={detailsOpen}
            onOpenChange={(open) => {
              setDetailsOpen(open);
              if (!open) setSelectedTransfer(null);
            }}
          >
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  Transfer entries
                  {selectedTransfer ? ` · ${selectedTransfer.ref}` : ""}
                </DialogTitle>
              </DialogHeader>
              {selectedTransfer ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {selectedTransfer.manualRef?.trim() ? (
                      <span>Manual ref: {selectedTransfer.manualRef} · </span>
                    ) : null}
                    {selectedTransfer.transactionDate
                      ? new Date(selectedTransfer.transactionDate).toLocaleString()
                      : "—"}
                  </div>
                  {selectedTransfer.record.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">No line items.</p>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTransfer.record.map((line, idx) => (
                            <TableRow key={`${selectedTransfer.ref}-${idx}`}>
                              <TableCell>
                                {line.account?.name ??
                                  `Account #${line.account?.id ?? "—"}`}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="font-normal">
                                  {line.transactionType?.trim() || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatAmountDisplay(Number(line.amount ?? 0))}
                              </TableCell>
                              <TableCell className="max-w-[320px] truncate text-sm">
                                {line.remarks?.trim() ? line.remarks : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="flex justify-end text-sm font-medium tabular-nums">
                    Total: {formatAmountDisplay(transferRecordTotal(selectedTransfer))}
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
