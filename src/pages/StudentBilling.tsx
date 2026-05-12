import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  useStudentBillingsMutations,
  useStudentBillingsQuery,
} from "@/hooks/useStudentBillings";
import type { StudentBillingRow } from "@/lib/api";

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

function parseRowAmount(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isDraft(row: StudentBillingRow) {
  return String(row.status).toUpperCase() === "DRAFT";
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

function DraftAmountEditor({
  row,
  onSave,
  saving,
}: {
  row: StudentBillingRow;
  onSave: (amount: number) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(() =>
    formatAmountOnBlur(String(row.amount)) || formatAmountDisplay(parseRowAmount(row.amount))
  );

  useEffect(() => {
    setText(
      formatAmountOnBlur(String(row.amount)) || formatAmountDisplay(parseRowAmount(row.amount))
    );
  }, [row.amount, row.updatedAt]);

  if (!isDraft(row)) {
    return (
      <span className="tabular-nums font-medium">
        {formatAmountDisplay(parseRowAmount(row.amount))}
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

type DraftLine = { id: string; billingId: string; amount: string };

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

  useEffect(() => {
    if (!studentId) return;
    if (studentId === prevStudentRef.current) return;
    prevStudentRef.current = studentId;
    const s = students.find((x) => x.id === studentId);
    if (s?.classId) setClassId(s.classId);
    if (s?.subClassId) setSubclassId(s.subClassId);
  }, [studentId, students]);

  useEffect(() => {
    setPageStr("1");
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

  const [pageStr, setPageStr] = useState("1");
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const limit = 100;

  const listParams = useMemo(() => {
    if (!studentId || !classId || !subclassId || !sessionId || !termId) return null;
    return {
      studentId,
      classId,
      subclassId,
      session: sessionId,
      term: termId,
      page,
      limit,
    };
  }, [studentId, classId, subclassId, sessionId, termId, page, limit]);

  const billingsQuery = useStudentBillingsQuery(listParams);
  const rows = billingsQuery.data?.rows ?? [];
  const listPagination = billingsQuery.data?.pagination ?? null;

  const {
    bulkCreate,
    updateAmount,
    remove,
    isBulkCreating,
    isUpdating,
    isDeleting,
  } = useStudentBillingsMutations();

  const totalBill = useMemo(
    () => rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0),
    [rows]
  );

  const [draftLines, setDraftLines] = useState<DraftLine[]>(() => [
    { id: crypto.randomUUID(), billingId: "", amount: "" },
  ]);

  const addDraftLine = () => {
    setDraftLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), billingId: "", amount: "" },
    ]);
  };

  const removeDraftLine = (id: string) => {
    setDraftLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  };

  const updateDraftLine = (id: string, patch: Partial<DraftLine>) => {
    setDraftLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const contextComplete =
    Boolean(studentId) &&
    Boolean(classId) &&
    Boolean(subclassId) &&
    Boolean(sessionId) &&
    Boolean(termId);

  const canPostBulk = useMemo(() => {
    if (!contextComplete) return false;
    const entries = draftLines
      .map((l) => ({
        billingId: parseInt(l.billingId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter((e) => Number.isFinite(e.billingId) && e.billingId > 0 && e.amount > 0);
    return entries.length > 0;
  }, [contextComplete, draftLines]);

  const handleBulkPost = async () => {
    if (!contextComplete) return;
    const entries = draftLines
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
    setDraftLines([{ id: crypto.randomUUID(), billingId: "", amount: "" }]);
    setPageStr("1");
  };

  const [deleteTarget, setDeleteTarget] = useState<StudentBillingRow | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const listCanPrev = listPagination ? listPagination.page > 1 : page > 1;
  const listCanNext = listPagination
    ? listPagination.page < listPagination.totalPages
    : false;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Banknote className="h-8 w-8" />
          Student billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Assign billing items and amounts for a student in a class and session/term. Draft lines can
          be edited or removed until approved.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Student &amp; period</CardTitle>
          <CardDescription>
            Select the student, class, subclass, session, and term. The list below loads when all are
            set.
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
          <CardTitle className="text-lg">New charges</CardTitle>
          <CardDescription>
            Add one or more billing items with amounts (comma-separated thousands allowed). Posting
            sends a bulk create for this student and period.
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
              {draftLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Combobox
                      options={billingOptions}
                      value={line.billingId}
                      onValueChange={(v) => updateDraftLine(line.id, { billingId: v })}
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
                        updateDraftLine(line.id, {
                          amount: line.amount.replace(/,/g, ""),
                        })
                      }
                      onChange={(e) =>
                        updateDraftLine(line.id, {
                          amount: sanitizeAmountInput(e.target.value),
                        })
                      }
                      onBlur={() =>
                        updateDraftLine(line.id, {
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
                      onClick={() => removeDraftLine(line.id)}
                      disabled={draftLines.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap gap-2 justify-between">
            <Button type="button" variant="outline" onClick={addDraftLine} disabled={!contextComplete}>
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
            <Button
              type="button"
              onClick={handleBulkPost}
              disabled={!canPostBulk || isBulkCreating}
            >
              Post charges
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Billing lines</CardTitle>
          <CardDescription>
            Total includes every line in the table for the selected filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!contextComplete ? (
            <div className="p-8 text-center text-muted-foreground">
              Choose student, class, subclass, session, and term to load billings.
            </div>
          ) : billingsQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading billings…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No billing lines for this selection.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Billing item</TableHead>
                    <TableHead className="text-right min-w-[220px]">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right w-[90px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {billingLineLabel(r, billingNameById)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DraftAmountEditor
                          row={r}
                          saving={isUpdating}
                          onSave={async (amount) => {
                            await updateAmount({ id: r.id, amount });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDraft(r) ? "secondary" : "default"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.referentId}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isDraft(r) || isDeleting}
                          onClick={() => setDeleteTarget(r)}
                          title={
                            isDraft(r)
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

              <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between bg-muted/30">
                <div className="text-lg font-semibold tabular-nums">
                  Total bill: {formatAmountDisplay(totalBill)}
                </div>
                {listPagination && listPagination.totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!listCanPrev) return;
                            setPageStr(String(Math.max(1, page - 1)));
                          }}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-3 text-sm text-muted-foreground">
                          Page {listPagination.page} of {listPagination.totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!listCanNext) return;
                            setPageStr(String(page + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete billing line?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the draft billing line. Approved lines cannot be deleted here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
