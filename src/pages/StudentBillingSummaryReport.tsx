import { useEffect, useMemo, useRef, useState } from "react";
import { FileBarChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { useSchoolSessions } from "@/hooks/useSchoolSessions";
import { useTerms } from "@/hooks/useTerms";
import { useDefaultBillingPeriod } from "@/hooks/useDefaultBillingPeriod";
import { studentBillingsApi, type StudentBillingSummaryReportRow } from "@/lib/api";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function studentLabel(row: StudentBillingSummaryReportRow): string {
  const s = row.student;
  const name = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
  return `${s.admissionNumber} — ${name}`;
}

export default function StudentBillingSummaryReport() {
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [subclassId, setSubclassId] = useState("");

  const { defaultBillingPeriod } = useDefaultBillingPeriod();
  const seededSessionTermFromDefaultBilling = useRef(false);

  const { classes } = useClasses({ page: 1, limit: 200 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });
  const { sessions } = useSchoolSessions({ page: 1, limit: 100, status: "Active" });
  const { terms } = useTerms({ page: 1, limit: 100, status: "Active" });

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

  const filtersReady = Boolean(sessionId) && Boolean(termId);

  const { data: rows, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["student-billings-summary-report", sessionId, termId, classId, subclassId],
    queryFn: async () => {
      const res = await studentBillingsApi.summaryReport({
        session: sessionId,
        term: termId,
        ...(classId ? { classId } : {}),
        ...(subclassId ? { subclassId } : {}),
      });
      if (!res.success) throw new Error(res.message || "Failed to load report");
      return res.data;
    },
    enabled: filtersReady,
    staleTime: 30_000,
  });

  const totals = useMemo(() => {
    const list = rows ?? [];
    return list.reduce(
      (acc, r) => ({
        approvedBilling: acc.approvedBilling + Number(r.approvedBillingTotal ?? 0),
        draftBilling: acc.draftBilling + Number(r.draftBillingTotal ?? 0),
        approvedDiscount: acc.approvedDiscount + Number(r.approvedDiscountTotal ?? 0),
        draftDiscount: acc.draftDiscount + Number(r.draftDiscountTotal ?? 0),
      }),
      { approvedBilling: 0, draftBilling: 0, approvedDiscount: 0, draftDiscount: 0 }
    );
  }, [rows]);

  const netApproved = totals.approvedBilling - totals.approvedDiscount;

  const filterSummary = useMemo(() => {
    const sessionLabel = sessions.find((s) => s.id === sessionId)?.name ?? "—";
    const termLabel = terms.find((t) => t.id === termId)?.name ?? "—";
    const classLabel = classId
      ? classes.find((c) => c.id === classId)?.name ?? "—"
      : "All classes";
    const subclassLabel = subclassId
      ? subClasses.find((sc) => sc.id === subclassId)?.name ?? "—"
      : "All subclasses";
    return { sessionLabel, termLabel, classLabel, subclassLabel };
  }, [sessionId, termId, classId, subclassId, sessions, terms, classes, subClasses]);

  const showClassColumns = !classId || !subclassId;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="h-8 w-8" />
            Student billing summary
          </h1>
          <p className="text-muted-foreground mt-1">
            Approved and draft totals for billing and concessions/discounts by student. Session and
            term are required; class and subclass can be set to{" "}
            <span className="text-foreground">All</span> to include every class or subclass.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={!filtersReady || isFetching}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Session and term default from the configured default billing period when available.
            Class and subclass default to <span className="text-foreground">All</span> (optional
            filters).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="space-y-2">
            <Label>Class</Label>
            <Combobox
              options={[
                { value: "", label: "All classes" },
                ...classOptions,
              ]}
              value={classId}
              onValueChange={(v) => {
                setClassId(v);
                setSubclassId("");
              }}
              placeholder="All classes"
              searchPlaceholder="Search classes…"
            />
          </div>
          <div className="space-y-2">
            <Label>Subclass</Label>
            <Combobox
              options={[
                { value: "", label: "All subclasses" },
                ...subclassOptions,
              ]}
              value={subclassId}
              onValueChange={setSubclassId}
              placeholder="All subclasses"
              searchPlaceholder="Search subclasses…"
            />
          </div>
        </CardContent>
      </Card>

      {!filtersReady ? (
        <p className="text-center text-muted-foreground py-8">
          Select session and term to load the report. Optionally narrow by class and subclass.
        </p>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : isError ? (
        <p className="text-center text-destructive py-8">
          {error instanceof Error ? error.message : "Could not load report."}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Students ({rows?.length ?? 0})</CardTitle>
            <CardDescription>
              {filterSummary.classLabel} · {filterSummary.subclassLabel} ·{" "}
              {filterSummary.sessionLabel} · {filterSummary.termLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!rows?.length ? (
              <p className="text-center text-muted-foreground py-10">No data for this period.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      {showClassColumns ? (
                        <>
                          <TableHead>Class</TableHead>
                          <TableHead>Subclass</TableHead>
                        </>
                      ) : null}
                      <TableHead className="text-right">Approved billing</TableHead>
                      <TableHead className="text-right">Draft billing</TableHead>
                      <TableHead className="text-right">Approved discount</TableHead>
                      <TableHead className="text-right">Draft discount</TableHead>
                      <TableHead className="text-right">Net (approved)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const net =
                        Number(r.approvedBillingTotal ?? 0) -
                        Number(r.approvedDiscountTotal ?? 0);
                      return (
                        <TableRow key={`${r.studentId}-${r.classId}-${r.subclassId}`}>
                          <TableCell className="font-medium">{studentLabel(r)}</TableCell>
                          {showClassColumns ? (
                            <>
                              <TableCell>{r.classInfo?.name ?? "—"}</TableCell>
                              <TableCell>{r.subclassInfo?.name ?? "—"}</TableCell>
                            </>
                          ) : null}
                          <TableCell className="text-right tabular-nums">
                            {money.format(Number(r.approvedBillingTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money.format(Number(r.draftBillingTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money.format(Number(r.approvedDiscountTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money.format(Number(r.draftDiscountTotal ?? 0))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {money.format(net)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Totals</TableCell>
                      {showClassColumns ? (
                        <>
                          <TableCell />
                          <TableCell />
                        </>
                      ) : null}
                      <TableCell className="text-right tabular-nums">
                        {money.format(totals.approvedBilling)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(totals.draftBilling)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(totals.approvedDiscount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(totals.draftDiscount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(netApproved)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
