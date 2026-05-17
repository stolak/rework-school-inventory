import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { computeRunningAccountBalances } from "@/hooks/useAccountTransactionLog";
import { useStudentTransactionLog } from "@/hooks/useStudentTransactionLog";
import type { StudentTransactionLogData } from "@/lib/api";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function studentLabelFromLog(student: StudentTransactionLogData["student"]): string {
  const name = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
  return `${student.admissionNumber} — ${name}`;
}

export default function StudentTransactionLogReport() {
  const [searchParams] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  const [studentId, setStudentId] = useState(() => searchParams.get("studentId") ?? "");
  const [dateFrom, setDateFrom] = useState(
    () => searchParams.get("datefrom") ?? defaultFrom
  );
  const [dateTo, setDateTo] = useState(() => searchParams.get("dateTo") ?? defaultTo);

  useEffect(() => {
    const sid = searchParams.get("studentId");
    if (sid) setStudentId(sid);
    const df = searchParams.get("datefrom");
    if (df) setDateFrom(df);
    const dt = searchParams.get("dateTo");
    if (dt) setDateTo(dt);
  }, [searchParams]);

  const { students, isLoading: studentsLoading } = useStudents({
    page: 1,
    limit: 500,
    status: "Active",
  });
  const { classes } = useClasses({ page: 1, limit: 200 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });

  const studentOptions = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: `${s.admissionNumber} — ${s.firstName} ${s.lastName}`,
      })),
    [students]
  );

  const dateRangeInvalid = Boolean(
    dateFrom && dateTo && dateFrom > dateTo
  );

  const queryParams = useMemo(() => {
    if (!studentId) return null;
    if (dateRangeInvalid) return null;
    return {
      studentId,
      datefrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };
  }, [studentId, dateFrom, dateTo, dateRangeInvalid]);

  const { log, isLoading, isFetching, refetch, error } =
    useStudentTransactionLog(queryParams);

  const rowsWithBalance = useMemo(() => {
    if (!log) return [];
    return computeRunningAccountBalances(
      log.balanceBeforeDateFrom ?? "0",
      log.transactions ?? []
    );
  }, [log]);

  const className = useMemo(() => {
    const cid = log?.student?.classId;
    if (!cid) return "—";
    return classes.find((c) => c.id === cid)?.name ?? "—";
  }, [log, classes]);

  const subclassName = useMemo(() => {
    const sid = log?.student?.subClassId;
    if (!sid) return "—";
    return subClasses.find((sc) => sc.id === sid)?.name ?? "—";
  }, [log, subClasses]);

  const errMsg =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not load student transaction log.";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Student account transaction log
          </h1>
          <p className="text-muted-foreground mt-1">
            Ledger activity for a student account over a date range. Running balance uses the
            opening balance before the from date, then each line&apos;s debit minus credit.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={!queryParams || isFetching}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            <span className="text-destructive">Student is required.</span> Set the date range for
            transactions to include.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Student</Label>
              {studentsLoading ? (
                <p className="text-sm text-muted-foreground">Loading students…</p>
              ) : (
                <Combobox
                  value={studentId}
                  onValueChange={setStudentId}
                  options={studentOptions}
                  placeholder="Search by admission no or name…"
                  searchPlaceholder="Admission no or name…"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>From date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!studentId ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Choose a student above to load their transaction log.
          </CardContent>
        </Card>
      ) : dateRangeInvalid ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            The from date must be on or before the to date.
          </CardContent>
        </Card>
      ) : isLoading || isFetching ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">{errMsg}</CardContent>
        </Card>
      ) : log ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Student
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-semibold">{studentLabelFromLog(log.student)}</p>
                <p className="text-muted-foreground">
                  {className} · {subclassName}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Opening balance (before from date)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {money.format(Number(log.balanceBeforeDateFrom ?? 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Basis for running balance in the table
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Report window
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  <span className="text-muted-foreground">From: </span>
                  {log.transactionDateFrom
                    ? new Date(log.transactionDateFrom).toLocaleString()
                    : dateFrom}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">To: </span>
                  {log.transactionDateTo
                    ? new Date(log.transactionDateTo).toLocaleString()
                    : dateTo}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transactions ({rowsWithBalance.length})</CardTitle>
              <CardDescription>
                Rows sorted by date. <strong>Balance after</strong> is opening + cumulative
                (debit − credit) through each line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rowsWithBalance.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No transactions in this period for the selected student.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Manual ref</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance after</TableHead>
                       
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rowsWithBalance.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {row.transactionDate
                              ? new Date(row.transactionDate).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[160px] truncate">
                            {row.ref ?? "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[120px] truncate">
                            {row.manualRef?.trim() ? row.manualRef : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(row.debit ?? 0) !== 0
                              ? money.format(Number(row.debit ?? 0))
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {Number(row.credit ?? 0) !== 0
                              ? money.format(Number(row.credit ?? 0))
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {money.format(row.balanceAfter)}
                          </TableCell>
                         
                          <TableCell className="max-w-[220px] truncate text-sm">
                            {row.remarks?.trim() ? row.remarks : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No data returned.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
