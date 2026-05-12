import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Percent, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { useSchoolSessions } from "@/hooks/useSchoolSessions";
import { useTerms } from "@/hooks/useTerms";
import { useBillingItems } from "@/hooks/useBillingItems";
import { useConcessionDiscounts } from "@/hooks/useConcessionDiscounts";
import {
  useStudentBillingsMutations,
  useStudentBillingsQuery,
} from "@/hooks/useStudentBillings";
import {
  useStudentConcessionDiscountsMutations,
  useStudentConcessionDiscountsQuery,
} from "@/hooks/useStudentConcessionDiscounts";
import type { StudentBillingRow, StudentConcessionDiscountRow } from "@/lib/api";

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const SUMMARY_FETCH_LIMIT = 10_000;

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

function parseRowAmount(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isDraftStatus(status: string) {
  return String(status).toUpperCase() === "DRAFT";
}

function billingLineLabel(
  row: StudentBillingRow,
  fallbackById: Map<number, string>
): string {
  if (row.billing) {
    const code = row.billing.code?.trim();
    return code ? `${code} — ${row.billing.name}` : row.billing.name;
  }
  return fallbackById.get(row.billingId) ?? `Billing #${row.billingId}`;
}

function discountLineLabel(
  row: StudentConcessionDiscountRow,
  fallbackById: Map<number, string>
): string {
  if (row.concessionDiscount) {
    const code = row.concessionDiscount.code?.trim();
    return code
      ? `${code} — ${row.concessionDiscount.name}`
      : row.concessionDiscount.name;
  }
  return (
    fallbackById.get(row.concessionDiscountId) ??
    `Concession/discount #${row.concessionDiscountId}`
  );
}

function DraftAmountEditor({
  amount,
  updatedAt,
  status,
  onSave,
  saving,
}: {
  amount: string | number;
  updatedAt: string;
  status: string;
  onSave: (amount: number) => void | Promise<void>;
  saving: boolean;
}) {
  const [text, setText] = useState(() =>
    formatAmountOnBlur(String(amount)) || formatAmountDisplay(parseRowAmount(amount))
  );

  useEffect(() => {
    setText(
      formatAmountOnBlur(String(amount)) || formatAmountDisplay(parseRowAmount(amount))
    );
  }, [amount, updatedAt]);

  if (!isDraftStatus(status)) {
    return (
      <span className="tabular-nums font-medium">
        {formatAmountDisplay(parseRowAmount(amount))}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:justify-end">
      <Input
        type="text"
        inputMode="decimal"
        className="w-[140px] text-right tabular-nums"
        value={text}
        onFocus={() => setText((t) => t.replace(/,/g, ""))}
        onChange={(e) => setText(sanitizeAmountInput(e.target.value))}
        onBlur={() => setText((t) => formatAmountOnBlur(t) || t)}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={saving || moneyToNumber(text) <= 0}
        onClick={() => onSave(moneyToNumber(text))}
      >
        Save
      </Button>
    </div>
  );
}

type BillingDraftLine = { id: string; billingId: string; amount: string };
type DiscountDraftLine = { id: string; concessionDiscountId: string; amount: string };

export default function StudentBilling() {
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subclassId, setSubclassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const prevStudentRef = useRef<string>("");

  const { students } = useStudents({
    page: 1,
    limit: 500,
    status: "Active",
  });
  const { classes } = useClasses({ page: 1, limit: 200 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });
  const { sessions } = useSchoolSessions({ page: 1, limit: 100, status: "Active" });
  const { terms } = useTerms({ page: 1, limit: 100, status: "Active" });

  const { billingItems } = useBillingItems({
    status: "Active",
    page: 1,
    limit: 500,
  });

  const { concessionDiscounts } = useConcessionDiscounts({
    status: "Active",
    page: 1,
    limit: 500,
  });

  useEffect(() => {
    if (!studentId) return;
    if (studentId === prevStudentRef.current) return;
    prevStudentRef.current = studentId;
    const s = students.find((x) => x.id === studentId);
    if (s?.classId) setClassId(s.classId);
    if (s?.subClassId) setSubclassId(s.subClassId);
  }, [studentId, students]);

  useEffect(() => {
    setBillingPageStr("1");
    setDiscountPageStr("1");
  }, [studentId, classId, subclassId, sessionId, termId]);

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: `${s.admissionNumber} — ${s.firstName} ${s.lastName}`,
      })),
    [students]
  );

  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c.id, label: c.name })),
    [classes]
  );

  const filteredSubclasses = useMemo(() => {
    if (!classId) return subClasses;
    return subClasses.filter((sc) => sc.classId === classId);
  }, [subClasses, classId]);

  const subclassOptions = useMemo(
    () => filteredSubclasses.map((sc) => ({ value: sc.id, label: sc.name })),
    [filteredSubclasses]
  );

  const sessionOptions = useMemo(
    () => sessions.map((s) => ({ value: s.id, label: s.name })),
    [sessions]
  );

  const termOptions = useMemo(
    () => terms.map((t) => ({ value: t.id, label: t.name })),
    [terms]
  );

  const billingOptions = useMemo(
    () =>
      [...billingItems]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => ({
          value: String(b.id),
          label: `${b.code} — ${b.name}`,
        })),
    [billingItems]
  );

  const billingNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const b of billingItems) {
      m.set(b.id, `${b.code} — ${b.name}`);
    }
    return m;
  }, [billingItems]);

  const discountOptions = useMemo(
    () =>
      [...concessionDiscounts]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          value: String(d.id),
          label: `${d.code} — ${d.name}`,
        })),
    [concessionDiscounts]
  );

  const discountNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of concessionDiscounts) {
      m.set(d.id, `${d.code} — ${d.name}`);
    }
    return m;
  }, [concessionDiscounts]);

  const [billingPageStr, setBillingPageStr] = useState("1");
  const billingPage = Math.max(1, parseInt(billingPageStr || "1", 10) || 1);
  const [discountPageStr, setDiscountPageStr] = useState("1");
  const discountPage = Math.max(1, parseInt(discountPageStr || "1", 10) || 1);
  const tableLimit = 100;

  const [billingSelectedIds, setBillingSelectedIds] = useState<number[]>([]);
  const [discountSelectedIds, setDiscountSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setBillingSelectedIds([]);
    setDiscountSelectedIds([]);
  }, [studentId, classId, subclassId, sessionId, termId]);

  useEffect(() => {
    setBillingSelectedIds([]);
  }, [billingPageStr]);

  useEffect(() => {
    setDiscountSelectedIds([]);
  }, [discountPageStr]);

  const contextComplete =
    Boolean(studentId) &&
    Boolean(classId) &&
    Boolean(subclassId) &&
    Boolean(sessionId) &&
    Boolean(termId);

  const listParamsBase = useMemo(() => {
    if (!contextComplete) return null;
    return {
      studentId,
      classId,
      subclassId,
      session: sessionId,
      term: termId,
    };
  }, [studentId, classId, subclassId, sessionId, termId, contextComplete]);

  const billingListParams = useMemo(() => {
    if (!listParamsBase) return null;
    return { ...listParamsBase, page: billingPage, limit: tableLimit };
  }, [listParamsBase, billingPage]);

  const discountListParams = useMemo(() => {
    if (!listParamsBase) return null;
    return { ...listParamsBase, page: discountPage, limit: tableLimit };
  }, [listParamsBase, discountPage]);

  /** Full aggregate for amount due (not limited to current table page). */
  const summaryParams = useMemo(() => {
    if (!listParamsBase) return null;
    return { ...listParamsBase, page: 1, limit: SUMMARY_FETCH_LIMIT };
  }, [listParamsBase]);

  const billingsQuery = useStudentBillingsQuery(billingListParams);
  const billingRows = billingsQuery.data?.rows ?? [];
  const billingPagination = billingsQuery.data?.pagination ?? null;

  const billingSummaryQuery = useStudentBillingsQuery(summaryParams);
  const discountSummaryQuery = useStudentConcessionDiscountsQuery(summaryParams);

  const discountsQuery = useStudentConcessionDiscountsQuery(discountListParams);
  const discountRows = discountsQuery.data?.rows ?? [];
  const discountPagination = discountsQuery.data?.pagination ?? null;

  const {
    bulkCreate,
    updateAmount,
    remove,
    bulkPatchStatuses: bulkPatchBillingStatuses,
    isBulkCreating,
    isUpdating: isBillingUpdating,
    isDeleting: isBillingDeleting,
    isBulkPatchingStatus: isBillingBulkPatchingStatus,
  } = useStudentBillingsMutations();

  const {
    bulkCreate: bulkCreateDiscounts,
    updateAmount: updateDiscountAmount,
    remove: removeDiscount,
    bulkPatchStatuses: bulkPatchDiscountStatuses,
    isBulkCreating: isBulkDiscountCreating,
    isUpdating: isDiscountUpdating,
    isDeleting: isDiscountDeleting,
    isBulkPatchingStatus: isDiscountBulkPatchingStatus,
  } = useStudentConcessionDiscountsMutations();

  const billingPageIds = useMemo(() => billingRows.map((r) => r.id), [billingRows]);
  const discountPageIds = useMemo(() => discountRows.map((r) => r.id), [discountRows]);

  const billingHeaderCheckboxState = useMemo((): boolean | "indeterminate" => {
    if (billingPageIds.length === 0) return false;
    const onPage = billingSelectedIds.filter((id) => billingPageIds.includes(id)).length;
    if (onPage === 0) return false;
    if (onPage === billingPageIds.length) return true;
    return "indeterminate";
  }, [billingPageIds, billingSelectedIds]);

  const discountHeaderCheckboxState = useMemo((): boolean | "indeterminate" => {
    if (discountPageIds.length === 0) return false;
    const onPage = discountSelectedIds.filter((id) => discountPageIds.includes(id)).length;
    if (onPage === 0) return false;
    if (onPage === discountPageIds.length) return true;
    return "indeterminate";
  }, [discountPageIds, discountSelectedIds]);

  const totalBillingAll = useMemo(() => {
    const rows = billingSummaryQuery.data?.rows ?? [];
    return rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0);
  }, [billingSummaryQuery.data?.rows]);

  const totalDiscountAll = useMemo(() => {
    const rows = discountSummaryQuery.data?.rows ?? [];
    return rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0);
  }, [discountSummaryQuery.data?.rows]);

  const amountDue = totalBillingAll - totalDiscountAll;

  const [billingDraftLines, setBillingDraftLines] = useState<BillingDraftLine[]>(() => [
    { id: crypto.randomUUID(), billingId: "", amount: "" },
  ]);

  const [discountDraftLines, setDiscountDraftLines] = useState<DiscountDraftLine[]>(() => [
    { id: crypto.randomUUID(), concessionDiscountId: "", amount: "" },
  ]);

  const addBillingDraftLine = () => {
    setBillingDraftLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), billingId: "", amount: "" },
    ]);
  };

  const removeBillingDraftLine = (id: string) => {
    setBillingDraftLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)
    );
  };

  const updateBillingDraftLine = (id: string, patch: Partial<BillingDraftLine>) => {
    setBillingDraftLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addDiscountDraftLine = () => {
    setDiscountDraftLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), concessionDiscountId: "", amount: "" },
    ]);
  };

  const removeDiscountDraftLine = (id: string) => {
    setDiscountDraftLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)
    );
  };

  const updateDiscountDraftLine = (id: string, patch: Partial<DiscountDraftLine>) => {
    setDiscountDraftLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const canPostBilling = useMemo(() => {
    if (!contextComplete) return false;
    const entries = billingDraftLines
      .map((l) => ({
        billingId: parseInt(l.billingId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter((e) => Number.isFinite(e.billingId) && e.billingId > 0 && e.amount > 0);
    return entries.length > 0;
  }, [contextComplete, billingDraftLines]);

  const canPostDiscount = useMemo(() => {
    if (!contextComplete) return false;
    const entries = discountDraftLines
      .map((l) => ({
        concessionDiscountId: parseInt(l.concessionDiscountId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter(
        (e) =>
          Number.isFinite(e.concessionDiscountId) &&
          e.concessionDiscountId > 0 &&
          e.amount > 0
      );
    return entries.length > 0;
  }, [contextComplete, discountDraftLines]);

  const handleBulkPostBilling = async () => {
    if (!contextComplete) return;
    const entries = billingDraftLines
      .map((l) => ({
        billingId: parseInt(l.billingId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter((e) => Number.isFinite(e.billingId) && e.billingId > 0 && e.amount > 0);
    if (entries.length === 0) return;

    await bulkCreate({
      studentId,
      classId,
      subclassId,
      session: sessionId,
      term: termId,
      entries,
    });
    setBillingDraftLines([{ id: crypto.randomUUID(), billingId: "", amount: "" }]);
    setBillingPageStr("1");
  };

  const handleBulkPostDiscount = async () => {
    if (!contextComplete) return;
    const entries = discountDraftLines
      .map((l) => ({
        concessionDiscountId: parseInt(l.concessionDiscountId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter(
        (e) =>
          Number.isFinite(e.concessionDiscountId) &&
          e.concessionDiscountId > 0 &&
          e.amount > 0
      );
    if (entries.length === 0) return;

    await bulkCreateDiscounts({
      studentId,
      classId,
      subclassId,
      session: sessionId,
      term: termId,
      entries,
    });
    setDiscountDraftLines([
      { id: crypto.randomUUID(), concessionDiscountId: "", amount: "" },
    ]);
    setDiscountPageStr("1");
  };

  const [deleteBillingTarget, setDeleteBillingTarget] = useState<StudentBillingRow | null>(null);
  const [deleteDiscountTarget, setDeleteDiscountTarget] =
    useState<StudentConcessionDiscountRow | null>(null);

  const handleDeleteBilling = async () => {
    if (!deleteBillingTarget) return;
    await remove(deleteBillingTarget.id);
    setDeleteBillingTarget(null);
  };

  const handleDeleteDiscount = async () => {
    if (!deleteDiscountTarget) return;
    await removeDiscount(deleteDiscountTarget.id);
    setDeleteDiscountTarget(null);
  };

  const toggleBillingRowSelect = (id: number) => {
    setBillingSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleBillingSelectPage = () => {
    if (billingPageIds.length === 0) return;
    const allOnPage = billingPageIds.every((id) => billingSelectedIds.includes(id));
    if (allOnPage) {
      setBillingSelectedIds((prev) => prev.filter((id) => !billingPageIds.includes(id)));
    } else {
      setBillingSelectedIds((prev) => Array.from(new Set([...prev, ...billingPageIds])));
    }
  };

  const handleBillingBulkStatus = async (status: "APPROVED" | "DRAFT") => {
    if (billingSelectedIds.length === 0) return;
    await bulkPatchBillingStatuses({ ids: billingSelectedIds, status });
    setBillingSelectedIds([]);
  };

  const toggleDiscountRowSelect = (id: number) => {
    setDiscountSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDiscountSelectPage = () => {
    if (discountPageIds.length === 0) return;
    const allOnPage = discountPageIds.every((id) => discountSelectedIds.includes(id));
    if (allOnPage) {
      setDiscountSelectedIds((prev) => prev.filter((id) => !discountPageIds.includes(id)));
    } else {
      setDiscountSelectedIds((prev) => Array.from(new Set([...prev, ...discountPageIds])));
    }
  };

  const handleDiscountBulkStatus = async (status: "APPROVED" | "DRAFT") => {
    if (discountSelectedIds.length === 0) return;
    await bulkPatchDiscountStatuses({ ids: discountSelectedIds, status });
    setDiscountSelectedIds([]);
  };

  const billingCanPrev = billingPagination ? billingPagination.page > 1 : billingPage > 1;
  const billingCanNext = billingPagination
    ? billingPagination.page < billingPagination.totalPages
    : false;

  const discountCanPrev = discountPagination ? discountPagination.page > 1 : discountPage > 1;
  const discountCanNext = discountPagination
    ? discountPagination.page < discountPagination.totalPages
    : false;

  const summaryLoading =
    contextComplete && (billingSummaryQuery.isLoading || discountSummaryQuery.isLoading);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Banknote className="h-8 w-8" />
          Student billing &amp; discounts
        </h1>
        <p className="text-muted-foreground mt-1">
          Post billing charges and concession/discount lines for a student in a class and
          session/term. Draft rows can be edited or deleted until approved. Amount due is total
          billing minus total discounts.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Student &amp; period</CardTitle>
          <CardDescription>
            Select the student, class, subclass, session, and term. Tables load when all are set.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Student</Label>
            <Combobox
              options={studentOptions}
              value={studentId}
              onValueChange={setStudentId}
              placeholder="Search student…"
              searchPlaceholder="Admission no or name…"
            />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Combobox
              options={classOptions}
              value={classId}
              onValueChange={(v) => {
                setClassId(v);
                setSubclassId("");
              }}
              placeholder="Select class…"
              searchPlaceholder="Search classes…"
            />
          </div>
          <div className="space-y-2">
            <Label>Subclass</Label>
            <Combobox
              options={subclassOptions}
              value={subclassId}
              onValueChange={setSubclassId}
              placeholder="Select subclass…"
              searchPlaceholder="Search subclasses…"
            />
          </div>
          <div className="space-y-2">
            <Label>Session</Label>
            <Combobox
              options={sessionOptions}
              value={sessionId}
              onValueChange={setSessionId}
              placeholder="Select session…"
              searchPlaceholder="Search sessions…"
            />
          </div>
          <div className="space-y-2">
            <Label>Term</Label>
            <Combobox
              options={termOptions}
              value={termId}
              onValueChange={setTermId}
              placeholder="Select term…"
              searchPlaceholder="Search terms…"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">New billing charges</CardTitle>
          <CardDescription>
            Add billing items with amounts (comma-separated thousands allowed), then post for this
            student and period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Billing item</TableHead>
                <TableHead className="text-right w-[180px]">Amount</TableHead>
                <TableHead className="w-[70px]"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingDraftLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Combobox
                      options={billingOptions}
                      value={line.billingId}
                      onValueChange={(v) => updateBillingDraftLine(line.id, { billingId: v })}
                      placeholder="Select billing item…"
                      searchPlaceholder="Search…"
                      disabled={!contextComplete}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="text-right tabular-nums"
                      placeholder="0"
                      disabled={!contextComplete}
                      value={line.amount}
                      onFocus={() =>
                        updateBillingDraftLine(line.id, {
                          amount: line.amount.replace(/,/g, ""),
                        })
                      }
                      onChange={(e) =>
                        updateBillingDraftLine(line.id, {
                          amount: sanitizeAmountInput(e.target.value),
                        })
                      }
                      onBlur={() =>
                        updateBillingDraftLine(line.id, {
                          amount: formatAmountOnBlur(line.amount),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBillingDraftLine(line.id)}
                      disabled={billingDraftLines.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap gap-2 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addBillingDraftLine}
              disabled={!contextComplete}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
            <Button
              type="button"
              onClick={handleBulkPostBilling}
              disabled={!canPostBilling || isBulkCreating}
            >
              Create charges
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Billing lines</CardTitle>
          <CardDescription>
            Edit draft amounts or delete draft rows. Use checkboxes to approve selected lines or set them
            back to draft in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!contextComplete ? (
            <div className="p-8 text-center text-muted-foreground">
              Choose student, class, subclass, session, and term to load billings.
            </div>
          ) : billingsQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading billings…</div>
          ) : billingRows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No billing lines for this selection.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 border-b bg-muted/15">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {billingSelectedIds.length} selected
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBillingSelectedIds([])}
                  disabled={billingSelectedIds.length === 0}
                >
                  Clear selection
                </Button>
                <div className="flex-1 min-w-[8px]" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBillingBulkStatus("APPROVED")}
                  disabled={
                    billingSelectedIds.length === 0 || isBillingBulkPatchingStatus
                  }
                >
                  Approve selected
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBillingBulkStatus("DRAFT")}
                  disabled={
                    billingSelectedIds.length === 0 || isBillingBulkPatchingStatus
                  }
                >
                  Set to draft
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={billingHeaderCheckboxState}
                        onCheckedChange={() => toggleBillingSelectPage()}
                        aria-label="Select all billing lines on this page"
                      />
                    </TableHead>
                    <TableHead>Billing item</TableHead>
                    <TableHead className="text-right min-w-[220px]">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right w-[90px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="align-middle">
                        <Checkbox
                          checked={billingSelectedIds.includes(r.id)}
                          onCheckedChange={() => toggleBillingRowSelect(r.id)}
                          aria-label={`Select billing line ${r.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {billingLineLabel(r, billingNameById)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DraftAmountEditor
                          amount={r.amount}
                          updatedAt={r.updatedAt}
                          status={r.status}
                          saving={isBillingUpdating}
                          onSave={async (amount) => {
                            await updateAmount({ id: r.id, amount });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDraftStatus(r.status) ? "secondary" : "default"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.referentId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isDraftStatus(r.status) || isBillingDeleting}
                          onClick={() => setDeleteBillingTarget(r)}
                          title={
                            isDraftStatus(r.status)
                              ? "Delete draft line"
                              : "Only draft lines can be deleted"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {billingPagination && billingPagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-end bg-muted/30">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!billingCanPrev) return;
                            setBillingPageStr(String(Math.max(1, billingPage - 1)));
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-3 text-sm text-muted-foreground">
                          Page {billingPagination.page} of {billingPagination.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!billingCanNext) return;
                            setBillingPageStr(String(billingPage + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            New concession / discount lines
          </CardTitle>
          <CardDescription>
            Post concession or discount amounts (same scope as billing). Uses master concession/discount
            definitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concession / discount</TableHead>
                <TableHead className="text-right w-[180px]">Amount</TableHead>
                <TableHead className="w-[70px]"> </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discountDraftLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Combobox
                      options={discountOptions}
                      value={line.concessionDiscountId}
                      onValueChange={(v) =>
                        updateDiscountDraftLine(line.id, { concessionDiscountId: v })
                      }
                      placeholder="Select concession or discount…"
                      searchPlaceholder="Search…"
                      disabled={!contextComplete}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="text-right tabular-nums"
                      placeholder="0"
                      disabled={!contextComplete}
                      value={line.amount}
                      onFocus={() =>
                        updateDiscountDraftLine(line.id, {
                          amount: line.amount.replace(/,/g, ""),
                        })
                      }
                      onChange={(e) =>
                        updateDiscountDraftLine(line.id, {
                          amount: sanitizeAmountInput(e.target.value),
                        })
                      }
                      onBlur={() =>
                        updateDiscountDraftLine(line.id, {
                          amount: formatAmountOnBlur(line.amount),
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDiscountDraftLine(line.id)}
                      disabled={discountDraftLines.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap gap-2 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addDiscountDraftLine}
              disabled={!contextComplete}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
            <Button
              type="button"
              onClick={handleBulkPostDiscount}
              disabled={!canPostDiscount || isBulkDiscountCreating}
            >
              Create discounts
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Concession / discount lines
          </CardTitle>
          <CardDescription>
            Draft amounts can be changed; approved rows are locked. Bulk approve or set to draft using
            checkboxes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!contextComplete ? (
            <div className="p-8 text-center text-muted-foreground">
              Choose student, class, subclass, session, and term to load discount lines.
            </div>
          ) : discountsQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading concession/discounts…</div>
          ) : discountRows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No concession or discount lines for this selection.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 px-4 pt-4 pb-3 border-b bg-muted/15">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {discountSelectedIds.length} selected
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDiscountSelectedIds([])}
                  disabled={discountSelectedIds.length === 0}
                >
                  Clear selection
                </Button>
                <div className="flex-1 min-w-[8px]" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDiscountBulkStatus("APPROVED")}
                  disabled={
                    discountSelectedIds.length === 0 || isDiscountBulkPatchingStatus
                  }
                >
                  Approve selected
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDiscountBulkStatus("DRAFT")}
                  disabled={
                    discountSelectedIds.length === 0 || isDiscountBulkPatchingStatus
                  }
                >
                  Set to draft
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={discountHeaderCheckboxState}
                        onCheckedChange={() => toggleDiscountSelectPage()}
                        aria-label="Select all concession/discount lines on this page"
                      />
                    </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right min-w-[220px]">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right w-[90px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="align-middle">
                        <Checkbox
                          checked={discountSelectedIds.includes(r.id)}
                          onCheckedChange={() => toggleDiscountRowSelect(r.id)}
                          aria-label={`Select line ${r.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {discountLineLabel(r, discountNameById)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DraftAmountEditor
                          amount={r.amount}
                          updatedAt={r.updatedAt}
                          status={r.status}
                          saving={isDiscountUpdating}
                          onSave={async (amount) => {
                            await updateDiscountAmount({ id: r.id, amount });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDraftStatus(r.status) ? "secondary" : "default"}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.referentId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isDraftStatus(r.status) || isDiscountDeleting}
                          onClick={() => setDeleteDiscountTarget(r)}
                          title={
                            isDraftStatus(r.status)
                              ? "Delete draft line"
                              : "Only draft lines can be deleted"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {discountPagination && discountPagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-end bg-muted/30">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!discountCanPrev) return;
                            setDiscountPageStr(String(Math.max(1, discountPage - 1)));
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-3 text-sm text-muted-foreground">
                          Page {discountPagination.page} of {discountPagination.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!discountCanNext) return;
                            setDiscountPageStr(String(discountPage + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card border-primary/20 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
          <CardDescription>
            Totals include all billing and discount lines for this student and period (not only the
            current table page).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryLoading ? (
            <p className="text-sm text-muted-foreground">Calculating totals…</p>
          ) : !contextComplete ? (
            <p className="text-sm text-muted-foreground">Select context to see totals.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Total billing</div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatAmountDisplay(totalBillingAll)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total discounts</div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatAmountDisplay(totalDiscountAll)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount due</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {formatAmountDisplay(amountDue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Billing − discounts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteBillingTarget)}
        onOpenChange={(o) => !o && setDeleteBillingTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete billing line?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the draft billing line. Approved lines cannot be deleted here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBilling}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteDiscountTarget)}
        onOpenChange={(o) => !o && setDeleteDiscountTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete concession/discount line?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the draft line. Approved lines cannot be deleted here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDiscount}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
