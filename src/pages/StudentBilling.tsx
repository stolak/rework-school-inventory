import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Download, Mail, Percent, Plus, Trash2 } from "lucide-react";
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
import { TablePaginationBar } from "@/components/ui/table-pagination-bar";
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
import { useDefaultBillingPeriod } from "@/hooks/useDefaultBillingPeriod";
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
import { classDefaultBillingsApi } from "@/lib/api";
import type { StudentBillingRow, StudentConcessionDiscountRow } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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

function isApprovedStatus(status: string) {
  return String(status).toUpperCase() === "APPROVED";
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

function PostedStatusCell({
  isPosted,
  postedAt,
}: {
  isPosted: boolean;
  postedAt: string | null;
}) {
  if (isPosted) {
    return (
      <div className="space-y-0.5">
        <Badge variant="outline" className="border-green-600/40 text-green-800 bg-green-500/10">
          Posted
        </Badge>
        {postedAt ? (
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(postedAt).toLocaleString()}
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <Badge variant="secondary" className="font-normal">
      Not posted
    </Badge>
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
  const { toast } = useToast();
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subclassId, setSubclassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const { defaultBillingPeriod } = useDefaultBillingPeriod();
  const seededSessionTermFromDefaultBilling = useRef(false);

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

  /** One-time seed from Settings → default billing period (session + term still user-editable). */
  useEffect(() => {
    if (seededSessionTermFromDefaultBilling.current) return;
    if (!defaultBillingPeriod) return;
    const sid = defaultBillingPeriod.sessionId;
    const tid = defaultBillingPeriod.termId;
    const sessionOk = Boolean(sid && sessions.some((s) => s.id === sid));
    const termOk = Boolean(tid && terms.some((t) => t.id === tid));
    if (!sessionOk || !termOk) return;
    setSessionId(sid);
    setTermId(tid);
    seededSessionTermFromDefaultBilling.current = true;
  }, [defaultBillingPeriod, sessions, terms]);

  useEffect(() => {
    setBillingPage(1);
    setDiscountPage(1);
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

  const [billingPage, setBillingPage] = useState(1);
  const [billingLimit, setBillingLimit] = useState(10);
  const [discountPage, setDiscountPage] = useState(1);
  const [discountLimit, setDiscountLimit] = useState(10);

  const [billingSelectedIds, setBillingSelectedIds] = useState<number[]>([]);
  const [discountSelectedIds, setDiscountSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setBillingSelectedIds([]);
    setDiscountSelectedIds([]);
  }, [studentId, classId, subclassId, sessionId, termId]);

  useEffect(() => {
    setBillingSelectedIds([]);
  }, [billingPage]);

  useEffect(() => {
    setDiscountSelectedIds([]);
  }, [discountPage]);

  const contextComplete =
    Boolean(studentId) &&
    Boolean(classId) &&
    Boolean(subclassId) &&
    Boolean(sessionId) &&
    Boolean(termId);

  const classPeriodContextComplete =
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
    return { ...listParamsBase, page: billingPage, limit: billingLimit };
  }, [listParamsBase, billingPage, billingLimit]);

  const discountListParams = useMemo(() => {
    if (!listParamsBase) return null;
    return { ...listParamsBase, page: discountPage, limit: discountLimit };
  }, [listParamsBase, discountPage, discountLimit]);

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

  useEffect(() => {
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    setBillingSelectedIds((prev) =>
      prev.filter((id) => {
        const r = byId.get(id);
        return Boolean(r) && !r.isPosted;
      })
    );
  }, [billingRows]);

  useEffect(() => {
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    setDiscountSelectedIds((prev) =>
      prev.filter((id) => {
        const r = byId.get(id);
        return Boolean(r) && !r.isPosted;
      })
    );
  }, [discountRows]);

  const {
    bulkCreate,
    updateAmount,
    remove,
    bulkPatchStatuses: bulkPatchBillingStatuses,
    bulkPost: bulkPostBilling,
    notifyParent: notifyParentBilling,
    isBulkCreating,
    isUpdating: isBillingUpdating,
    isDeleting: isBillingDeleting,
    isBulkPatchingStatus: isBillingBulkPatchingStatus,
    isBulkPosting: isBillingBulkPosting,
    isNotifyingParent,
  } = useStudentBillingsMutations();

  const {
    bulkCreate: bulkCreateDiscounts,
    updateAmount: updateDiscountAmount,
    remove: removeDiscount,
    bulkPatchStatuses: bulkPatchDiscountStatuses,
    bulkPost: bulkPostDiscountLines,
    isBulkCreating: isBulkDiscountCreating,
    isUpdating: isDiscountUpdating,
    isDeleting: isDiscountDeleting,
    isBulkPatchingStatus: isDiscountBulkPatchingStatus,
    isBulkPosting: isDiscountBulkPosting,
  } = useStudentConcessionDiscountsMutations();

  const billingSelectablePageIds = useMemo(
    () => billingRows.filter((r) => !r.isPosted).map((r) => r.id),
    [billingRows]
  );
  const discountSelectablePageIds = useMemo(
    () => discountRows.filter((r) => !r.isPosted).map((r) => r.id),
    [discountRows]
  );

  const billingHeaderCheckboxState = useMemo((): boolean | "indeterminate" => {
    if (billingSelectablePageIds.length === 0) return false;
    const onPage = billingSelectedIds.filter((id) =>
      billingSelectablePageIds.includes(id)
    ).length;
    if (onPage === 0) return false;
    if (onPage === billingSelectablePageIds.length) return true;
    return "indeterminate";
  }, [billingSelectablePageIds, billingSelectedIds]);

  const discountHeaderCheckboxState = useMemo((): boolean | "indeterminate" => {
    if (discountSelectablePageIds.length === 0) return false;
    const onPage = discountSelectedIds.filter((id) =>
      discountSelectablePageIds.includes(id)
    ).length;
    if (onPage === 0) return false;
    if (onPage === discountSelectablePageIds.length) return true;
    return "indeterminate";
  }, [discountSelectablePageIds, discountSelectedIds]);

  /** Post only when every selected row is APPROVED and not yet posted (no draft or posted rows). */
  const billingPostSelectedEnabled = useMemo(() => {
    if (billingSelectedIds.length === 0) return false;
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    for (const id of billingSelectedIds) {
      const r = byId.get(id);
      if (!r) return false;
      if (!isApprovedStatus(r.status) || r.isPosted) return false;
    }
    return true;
  }, [billingSelectedIds, billingRows]);

  const discountPostSelectedEnabled = useMemo(() => {
    if (discountSelectedIds.length === 0) return false;
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    for (const id of discountSelectedIds) {
      const r = byId.get(id);
      if (!r) return false;
      if (!isApprovedStatus(r.status) || r.isPosted) return false;
    }
    return true;
  }, [discountSelectedIds, discountRows]);

  /** Approve only when every selected row is DRAFT (no APPROVED in selection). */
  const billingApproveEnabled = useMemo(() => {
    if (billingSelectedIds.length === 0) return false;
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    let hasApproved = false;
    let hasDraft = false;
    for (const id of billingSelectedIds) {
      const r = byId.get(id);
      if (!r) continue;
      if (isApprovedStatus(r.status)) hasApproved = true;
      if (isDraftStatus(r.status)) hasDraft = true;
    }
    return hasDraft && !hasApproved;
  }, [billingSelectedIds, billingRows]);

  /** Set to draft only when every selected row is APPROVED (no DRAFT in selection). */
  const billingSetDraftEnabled = useMemo(() => {
    if (billingSelectedIds.length === 0) return false;
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    let hasApproved = false;
    let hasDraft = false;
    for (const id of billingSelectedIds) {
      const r = byId.get(id);
      if (!r) continue;
      if (isApprovedStatus(r.status)) hasApproved = true;
      if (isDraftStatus(r.status)) hasDraft = true;
    }
    return hasApproved && !hasDraft;
  }, [billingSelectedIds, billingRows]);

  const discountApproveEnabled = useMemo(() => {
    if (discountSelectedIds.length === 0) return false;
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    let hasApproved = false;
    let hasDraft = false;
    for (const id of discountSelectedIds) {
      const r = byId.get(id);
      if (!r) continue;
      if (isApprovedStatus(r.status)) hasApproved = true;
      if (isDraftStatus(r.status)) hasDraft = true;
    }
    return hasDraft && !hasApproved;
  }, [discountSelectedIds, discountRows]);

  const discountSetDraftEnabled = useMemo(() => {
    if (discountSelectedIds.length === 0) return false;
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    let hasApproved = false;
    let hasDraft = false;
    for (const id of discountSelectedIds) {
      const r = byId.get(id);
      if (!r) continue;
      if (isApprovedStatus(r.status)) hasApproved = true;
      if (isDraftStatus(r.status)) hasDraft = true;
    }
    return hasApproved && !hasDraft;
  }, [discountSelectedIds, discountRows]);

  const totalBillingAll = useMemo(() => {
    const rows = billingSummaryQuery.data?.rows ?? [];
    return rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0);
  }, [billingSummaryQuery.data?.rows]);

  const totalDiscountAll = useMemo(() => {
    const rows = discountSummaryQuery.data?.rows ?? [];
    return rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0);
  }, [discountSummaryQuery.data?.rows]);

  const amountDue = totalBillingAll - totalDiscountAll;

  const approvedBillingCount = useMemo(() => {
    const rows = billingSummaryQuery.data?.rows ?? [];
    return rows.filter((r) => isApprovedStatus(r.status)).length;
  }, [billingSummaryQuery.data?.rows]);

  const [billingDraftLines, setBillingDraftLines] = useState<BillingDraftLine[]>(() => [
    { id: crypto.randomUUID(), billingId: "", amount: "" },
  ]);
  const [isImportingClassDefaults, setIsImportingClassDefaults] = useState(false);

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

  const handleImportClassDefaults = async () => {
    if (!classPeriodContextComplete) return;
    setIsImportingClassDefaults(true);
    try {
      const res = await classDefaultBillingsApi.list({
        classId,
        subclassId,
        session: sessionId,
        term: termId,
      });
      if (!res.success) {
        throw new Error(res.message || "Failed to load class default billings");
      }
      const defaults = Array.isArray(res.data) ? res.data : [];
      if (defaults.length === 0) {
        toast({
          title: "No class defaults",
          description:
            "No default billings are configured for this class, subclass, session, and term.",
        });
        return;
      }

      setBillingDraftLines((prev) => {
        const importedIds = new Set(defaults.map((d) => d.billingId));
        const imported = defaults.map((row) => ({
          id: crypto.randomUUID(),
          billingId: String(row.billingId),
          amount:
            formatAmountOnBlur(String(row.amount)) ||
            formatAmountDisplay(parseRowAmount(row.amount)),
        }));
        const extras = prev.filter((line) => {
          const bid = parseInt(line.billingId, 10);
          return Number.isFinite(bid) && bid > 0 && !importedIds.has(bid);
        });
        const combined = [...imported, ...extras];
        return combined.length > 0
          ? combined
          : [{ id: crypto.randomUUID(), billingId: "", amount: "" }];
      });

      toast({
        title: "Defaults imported",
        description: `${defaults.length} billing line${defaults.length === 1 ? "" : "s"} added for review.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description:
          error instanceof Error ? error.message : "Could not load class default billings",
        variant: "destructive",
      });
    } finally {
      setIsImportingClassDefaults(false);
    }
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
    setBillingPage(1);
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
    setDiscountPage(1);
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

  const toggleBillingRowSelect = (row: StudentBillingRow) => {
    if (row.isPosted) return;
    setBillingSelectedIds((prev) =>
      prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]
    );
  };

  const toggleBillingSelectPage = () => {
    if (billingSelectablePageIds.length === 0) return;
    const allOnPage = billingSelectablePageIds.every((id) =>
      billingSelectedIds.includes(id)
    );
    if (allOnPage) {
      setBillingSelectedIds((prev) =>
        prev.filter((id) => !billingSelectablePageIds.includes(id))
      );
    } else {
      setBillingSelectedIds((prev) =>
        Array.from(new Set([...prev, ...billingSelectablePageIds]))
      );
    }
  };

  const handleBillingBulkStatus = async (status: "APPROVED" | "DRAFT") => {
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    const ids =
      status === "APPROVED"
        ? billingSelectedIds.filter((id) => {
            const r = byId.get(id);
            return r && isDraftStatus(r.status);
          })
        : billingSelectedIds.filter((id) => {
            const r = byId.get(id);
            return r && isApprovedStatus(r.status);
          });
    if (ids.length === 0) return;
    await bulkPatchBillingStatuses({ ids, status });
    setBillingSelectedIds([]);
  };

  const toggleDiscountRowSelect = (row: StudentConcessionDiscountRow) => {
    if (row.isPosted) return;
    setDiscountSelectedIds((prev) =>
      prev.includes(row.id) ? prev.filter((x) => x !== row.id) : [...prev, row.id]
    );
  };

  const toggleDiscountSelectPage = () => {
    if (discountSelectablePageIds.length === 0) return;
    const allOnPage = discountSelectablePageIds.every((id) =>
      discountSelectedIds.includes(id)
    );
    if (allOnPage) {
      setDiscountSelectedIds((prev) =>
        prev.filter((id) => !discountSelectablePageIds.includes(id))
      );
    } else {
      setDiscountSelectedIds((prev) =>
        Array.from(new Set([...prev, ...discountSelectablePageIds]))
      );
    }
  };

  const handleDiscountBulkStatus = async (status: "APPROVED" | "DRAFT") => {
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    const ids =
      status === "APPROVED"
        ? discountSelectedIds.filter((id) => {
            const r = byId.get(id);
            return r && isDraftStatus(r.status);
          })
        : discountSelectedIds.filter((id) => {
            const r = byId.get(id);
            return r && isApprovedStatus(r.status);
          });
    if (ids.length === 0) return;
    await bulkPatchDiscountStatuses({ ids, status });
    setDiscountSelectedIds([]);
  };

  const handleBillingBulkPost = async () => {
    if (!billingPostSelectedEnabled) return;
    const byId = new Map(billingRows.map((r) => [r.id, r]));
    const ids = billingSelectedIds.filter((id) => {
      const r = byId.get(id);
      return r && isApprovedStatus(r.status) && !r.isPosted;
    });
    if (ids.length === 0) return;
    await bulkPostBilling({ ids });
    setBillingSelectedIds([]);
  };

  const handleDiscountBulkPost = async () => {
    if (!discountPostSelectedEnabled) return;
    const byId = new Map(discountRows.map((r) => [r.id, r]));
    const ids = discountSelectedIds.filter((id) => {
      const r = byId.get(id);
      return r && isApprovedStatus(r.status) && !r.isPosted;
    });
    if (ids.length === 0) return;
    await bulkPostDiscountLines({ ids });
    setDiscountSelectedIds([]);
  };

  const summaryLoading =
    contextComplete && (billingSummaryQuery.isLoading || discountSummaryQuery.isLoading);

  const canNotifyParent =
    contextComplete && approvedBillingCount > 0 && !summaryLoading;

  const handleNotifyParent = async () => {
    if (!canNotifyParent) return;
    await notifyParentBilling({
      studentId,
      classId,
      subclassId,
      sessionId,
      termId,
    });
  };

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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">New billing charges</CardTitle>
            <CardDescription>
              Add billing items with amounts (comma-separated thousands allowed), then create
              charges for this student and period. Use import to load class defaults for review.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            disabled={!classPeriodContextComplete || isImportingClassDefaults}
            onClick={handleImportClassDefaults}
          >
            <Download className="mr-2 h-4 w-4" />
            {isImportingClassDefaults ? "Importing…" : "Import class defaults"}
          </Button>
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
            Edit draft amounts or delete draft rows. Approve lines, then use Post selected to post only
            approved records (draft lines cannot be posted).
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
                  disabled={!billingApproveEnabled || isBillingBulkPatchingStatus}
                  title={
                    billingApproveEnabled
                      ? undefined
                      : "Approve only when all selected lines are draft (no approved rows)."
                  }
                >
                  Approve selected
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBillingBulkStatus("DRAFT")}
                  disabled={!billingSetDraftEnabled || isBillingBulkPatchingStatus}
                  title={
                    billingSetDraftEnabled
                      ? undefined
                      : "Set to draft only when all selected lines are approved (no draft rows)."
                  }
                >
                  Set to draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleBillingBulkPost()}
                  disabled={
                    !billingPostSelectedEnabled ||
                    isBillingBulkPosting ||
                    isBillingBulkPatchingStatus
                  }
                  title="Post only when every selected line is approved and not yet posted. Posted lines cannot be selected."
                >
                  Post selected
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={billingHeaderCheckboxState}
                        onCheckedChange={() => toggleBillingSelectPage()}
                        disabled={billingSelectablePageIds.length === 0}
                        aria-label="Select all unposted billing lines on this page"
                      />
                    </TableHead>
                    <TableHead>Billing item</TableHead>
                    <TableHead className="text-right min-w-[220px]">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posting</TableHead>
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
                          onCheckedChange={() => toggleBillingRowSelect(r)}
                          disabled={r.isPosted}
                          aria-label={
                            r.isPosted
                              ? `Billing line ${r.id} (posted, cannot select)`
                              : `Select billing line ${r.id}`
                          }
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
                      <TableCell>
                        <PostedStatusCell isPosted={r.isPosted} postedAt={r.postedAt} />
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

              {billingPagination && (
                <TablePaginationBar
                  pagination={billingPagination}
                  totalLabel="Total billing lines"
                  pageSize={billingLimit}
                  onPageChange={setBillingPage}
                  onPageSizeChange={(limit) => {
                    setBillingLimit(limit);
                    setBillingPage(1);
                  }}
                />
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
            Draft amounts can be changed; approved rows are locked. Post selected sends only approved,
            not-yet-posted lines.
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
                  disabled={!discountApproveEnabled || isDiscountBulkPatchingStatus}
                  title={
                    discountApproveEnabled
                      ? undefined
                      : "Approve only when all selected lines are draft (no approved rows)."
                  }
                >
                  Approve selected
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDiscountBulkStatus("DRAFT")}
                  disabled={!discountSetDraftEnabled || isDiscountBulkPatchingStatus}
                  title={
                    discountSetDraftEnabled
                      ? undefined
                      : "Set to draft only when all selected lines are approved (no draft rows)."
                  }
                >
                  Set to draft
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={() => handleDiscountBulkPost()}
                  disabled={
                    !discountPostSelectedEnabled ||
                    isDiscountBulkPosting ||
                    isDiscountBulkPatchingStatus
                  }
                  title="Post only when every selected line is approved and not yet posted. Posted lines cannot be selected."
                >
                  Post selected
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[44px]">
                      <Checkbox
                        checked={discountHeaderCheckboxState}
                        onCheckedChange={() => toggleDiscountSelectPage()}
                        disabled={discountSelectablePageIds.length === 0}
                        aria-label="Select all unposted concession/discount lines on this page"
                      />
                    </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right min-w-[220px]">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posting</TableHead>
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
                          onCheckedChange={() => toggleDiscountRowSelect(r)}
                          disabled={r.isPosted}
                          aria-label={
                            r.isPosted
                              ? `Line ${r.id} (posted, cannot select)`
                              : `Select line ${r.id}`
                          }
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
                      <TableCell>
                        <PostedStatusCell isPosted={r.isPosted} postedAt={r.postedAt} />
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

              {discountPagination && (
                <TablePaginationBar
                  pagination={discountPagination}
                  totalLabel="Total discount lines"
                  pageSize={discountLimit}
                  onPageChange={setDiscountPage}
                  onPageSizeChange={(limit) => {
                    setDiscountLimit(limit);
                    setDiscountPage(1);
                  }}
                />
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
            <div className="space-y-4">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {approvedBillingCount > 0
                    ? `${approvedBillingCount} approved billing line${approvedBillingCount !== 1 ? "s" : ""} for this period.`
                    : "Approve at least one billing line to email the parent."}
                </p>
                <Button
                  type="button"
                  variant="default"
                  className="shrink-0"
                  disabled={!canNotifyParent || isNotifyingParent}
                  onClick={handleNotifyParent}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isNotifyingParent ? "Sending…" : "Notify parent"}
                </Button>
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
