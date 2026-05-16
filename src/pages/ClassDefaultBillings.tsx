import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { useSchoolSessions } from "@/hooks/useSchoolSessions";
import { useTerms } from "@/hooks/useTerms";
import { useDefaultBillingPeriod } from "@/hooks/useDefaultBillingPeriod";
import { useBillingItems } from "@/hooks/useBillingItems";
import {
  useClassDefaultBillingsMutations,
  useClassDefaultBillingsQuery,
} from "@/hooks/useClassDefaultBillings";
import type { ClassDefaultBillingRow } from "@/lib/api";

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

function billingLineLabel(
  row: ClassDefaultBillingRow,
  fallbackById: Map<number, string>
): string {
  if (row.billing) {
    const code = row.billing.code?.trim();
    return code ? `${code} — ${row.billing.name}` : row.billing.name;
  }
  return fallbackById.get(row.billingId) ?? `Billing #${row.billingId}`;
}

type DraftLine = { id: string; billingId: string; amount: string };

function AmountEditor({
  amount,
  updatedKey,
  onSave,
  saving,
}: {
  amount: string | number;
  updatedKey: string;
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
  }, [amount, updatedKey]);

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

export default function ClassDefaultBillings() {
  const [classId, setClassId] = useState("");
  const [subclassId, setSubclassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const { defaultBillingPeriod } = useDefaultBillingPeriod();
  const seededSessionTermFromDefaultBilling = useRef(false);

  const { classes } = useClasses({ page: 1, limit: 200 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });
  const { sessions } = useSchoolSessions({ page: 1, limit: 100, status: "Active" });
  const { terms } = useTerms({ page: 1, limit: 100, status: "Active" });
  const { billingItems } = useBillingItems({ status: "Active", page: 1, limit: 500 });

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

  const contextComplete =
    Boolean(classId) && Boolean(subclassId) && Boolean(sessionId) && Boolean(termId);

  const listParams = contextComplete
    ? {
        classId,
        subclassId,
        session: sessionId,
        term: termId,
      }
    : null;

  const { data: rows = [], isLoading, isError, error } =
    useClassDefaultBillingsQuery(listParams);

  const {
    bulkCreate,
    updateAmount,
    remove,
    isBulkCreating,
    isUpdating,
    isDeleting,
  } = useClassDefaultBillingsMutations();

  const [draftLines, setDraftLines] = useState<DraftLine[]>(() => [
    { id: crypto.randomUUID(), billingId: "", amount: "" },
  ]);

  const [deleteTarget, setDeleteTarget] = useState<ClassDefaultBillingRow | null>(null);

  const existingBillingIds = useMemo(
    () => new Set(rows.map((r) => r.billingId)),
    [rows]
  );

  const draftBillingOptions = useMemo(
    () =>
      billingOptions.filter((o) => !existingBillingIds.has(Number(o.value))),
    [billingOptions, existingBillingIds]
  );

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

  const canBulkCreate = useMemo(() => {
    if (!contextComplete) return false;
    const items = draftLines
      .map((l) => ({
        billingId: parseInt(l.billingId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter((x) => Number.isFinite(x.billingId) && x.billingId > 0 && x.amount > 0);
    return items.length > 0;
  }, [contextComplete, draftLines]);

  const handleBulkCreate = async () => {
    if (!contextComplete) return;
    const items = draftLines
      .map((l) => ({
        billingId: parseInt(l.billingId, 10),
        amount: moneyToNumber(l.amount),
      }))
      .filter((x) => Number.isFinite(x.billingId) && x.billingId > 0 && x.amount > 0);
    if (items.length === 0) return;

    await bulkCreate({
      classId,
      subclassId,
      session: sessionId,
      term: termId,
      items,
    });
    setDraftLines([{ id: crypto.randomUUID(), billingId: "", amount: "" }]);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const totalDefault = useMemo(
    () => rows.reduce((sum, r) => sum + parseRowAmount(r.amount), 0),
    [rows]
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-7 w-7 text-primary" />
          Class default billing
        </h1>
        <p className="text-muted-foreground mt-1">
          Set default billing amounts per class, subclass, session, and term. These apply when
          billing students in that context.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Context</CardTitle>
          <CardDescription>
            Select class, subclass, session, and term to view or manage default billings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              disabled={!classId}
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
          <CardTitle className="text-lg">Add default billings</CardTitle>
          <CardDescription>
            Choose billing items and amounts to create defaults for this context. Items already
            configured are hidden from the picker.
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
                      options={draftBillingOptions}
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
            <Button
              type="button"
              variant="outline"
              onClick={addDraftLine}
              disabled={!contextComplete || draftBillingOptions.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add line
            </Button>
            <Button
              type="button"
              onClick={handleBulkCreate}
              disabled={!canBulkCreate || isBulkCreating}
            >
              {isBulkCreating ? "Saving…" : "Save defaults"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Configured defaults</CardTitle>
            <CardDescription>
              {contextComplete
                ? "Edit amounts inline or remove lines you no longer need."
                : "Select context above to load defaults."}
            </CardDescription>
          </div>
          {contextComplete && rows.length > 0 ? (
            <div className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatAmountDisplay(totalDefault)}
              </span>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {!contextComplete ? (
            <p className="text-sm text-muted-foreground">Select class, subclass, session, and term.</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading defaults…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {(error as Error)?.message || "Failed to load defaults"}
            </p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No default billings for this context. Add lines above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Billing item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[80px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {billingLineLabel(row, billingNameById)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AmountEditor
                        amount={row.amount}
                        updatedKey={`${row.id}-${row.amount}`}
                        saving={isUpdating}
                        onSave={(amount) => updateAmount({ id: row.id, amount })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting}
                        onClick={() => setDeleteTarget(row)}
                        aria-label="Delete default billing"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete default billing?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove "${billingLineLabel(deleteTarget, billingNameById)}" from defaults for this class and period.`
                : ""}
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
