import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
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
  accountTransactionsApi,
  type StudentBalanceRow,
  type StudentBalanceStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useClasses } from "@/hooks/useClasses";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const STUDENT_STATUSES: StudentBalanceStatus[] = [
  "Active",
  "Inactive",
  "Graduated",
  "Transferred",
  "Suspended",
  "Archived",
];

function parseAmount(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function studentName(row: StudentBalanceRow): string {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ");
}

function studentLabel(row: StudentBalanceRow): string {
  return `${row.admissionNumber} — ${studentName(row)}`;
}

function studentTransactionLogHref(studentId: string, asAtDate: string): string {
  const params = new URLSearchParams({ studentId });
  if (asAtDate) {
    params.set("dateTo", asAtDate);
    const from = new Date(`${asAtDate}T12:00:00`);
    from.setFullYear(from.getFullYear() - 1);
    params.set("datefrom", from.toISOString().slice(0, 10));
  }
  return `/reports/student-transaction-log?${params.toString()}`;
}

function studentJournalPaymentHref(studentId: string): string {
  const params = new URLSearchParams({
    studentId,
    transferMode: "Payment",
    tab: "create",
  });
  return `/student-journal-transfers?${params.toString()}`;
}

export default function StudentBalancesReport() {
  const today = useMemo(() => new Date(), []);
  const defaultAsAt = today.toISOString().slice(0, 10);

  const [asAtDate, setAsAtDate] = useState(defaultAsAt);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState<StudentBalanceStatus>("Active");

  const { classes } = useClasses({ page: 1, limit: 200 });
  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c.id, label: c.name })),
    [classes]
  );
  const classLabel = classId
    ? classes.find((c) => c.id === classId)?.name ?? "—"
    : "All classes";
  const [orderBy, setOrderBy] = useState<"classId" | "balance">("classId");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [asAtDate, classId, status, orderBy, orderDirection]);

  const queryParams = useMemo(() => {
    if (!asAtDate) return null;
    return {
      asAtDate,
      status,
      ...(classId ? { classId } : {}),
      orderBy,
      orderDirection,
      page,
      limit,
    };
  }, [asAtDate, classId, status, orderBy, orderDirection, page, limit]);

  const { data, isLoading, isFetching, refetch, error, isError } = useQuery({
    queryKey: ["student-balances-report", queryParams],
    queryFn: async () => {
      if (!queryParams) throw new Error("As-at date is required");
      const res = await accountTransactionsApi.studentBalances(queryParams);
      if (!res.success) throw new Error(res.message || "Failed to load student balances");
      return res.data;
    },
    enabled: queryParams != null,
    staleTime: 30_000,
  });

  const rows = data?.rows ?? [];
  const pagination = data?.pagination;

  const pageTotals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        sumCredit: acc.sumCredit + parseAmount(r.sumCredit),
        sumDebit: acc.sumDebit + parseAmount(r.sumDebit),
        balance: acc.balance + parseAmount(r.balance),
      }),
      { sumCredit: 0, sumDebit: 0, balance: 0 }
    );
  }, [rows]);

  const asAtDisplay = data?.asAtDate
    ? new Date(data.asAtDate).toLocaleString()
    : asAtDate;

  const errMsg =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not load student balances.";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Student balances
          </h1>
          <p className="text-muted-foreground mt-1">
            Ledger balances per student as at a chosen date. Credit and debit totals reflect
            account activity through the as-at date; balance is net credit minus debit.
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
            <span className="text-destructive">As-at date is required.</span> Optionally filter by
            class; set status and sort order as needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <Label>As-at date</Label>
            <Input
              type="date"
              value={asAtDate}
              onChange={(e) => setAsAtDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Combobox
              options={[{ value: "", label: "All classes" }, ...classOptions]}
              value={classId}
              onValueChange={setClassId}
              placeholder="All classes"
              searchPlaceholder="Search classes…"
            />
          </div>
          <div className="space-y-2">
            <Label>Student status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StudentBalanceStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order by</Label>
            <Select
              value={orderBy}
              onValueChange={(v) => setOrderBy(v as "classId" | "balance")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classId">Class</SelectItem>
                <SelectItem value="balance">Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={orderDirection}
              onValueChange={(v) => setOrderDirection(v as "asc" | "desc")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!queryParams ? (
        <p className="text-center text-muted-foreground py-8">Select an as-at date to run the report.</p>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : isError ? (
        <p className="text-center text-destructive py-8">{errMsg}</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Students
              {pagination ? ` (${pagination.total})` : ` (${rows.length})`}
            </CardTitle>
            <CardDescription>
              As at {asAtDisplay} · {classLabel} · Status {data?.status ?? status} · Sorted by{" "}
              {data?.orderBy ?? orderBy} ({data?.orderDirection ?? orderDirection})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No students match these filters.
              </p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subclass</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total credit</TableHead>
                      <TableHead className="text-right">Total debit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right w-[130px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const balance = parseAmount(r.balance);
                      return (
                        <TableRow key={r.studentId}>
                          <TableCell className="font-medium">
                            <Link
                              to={studentTransactionLogHref(r.studentId, asAtDate)}
                              className="text-primary hover:underline underline-offset-4"
                            >
                              {studentLabel(r)}
                            </Link>
                          </TableCell>
                          <TableCell>{r.classInfo?.name ?? "—"}</TableCell>
                          <TableCell>{r.subclassInfo?.name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money.format(parseAmount(r.sumCredit))}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {money.format(parseAmount(r.sumDebit))}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums font-medium",
                              balance < 0 && "text-destructive",
                              balance > 0 && "text-green-700 dark:text-green-400"
                            )}
                          >
                            {money.format(balance)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={studentJournalPaymentHref(r.studentId)}>
                                <Banknote className="mr-1.5 h-3.5 w-3.5" />
                                Pay
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={4}>Page totals</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(pageTotals.sumCredit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {money.format(pageTotals.sumDebit)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          pageTotals.balance < 0 && "text-destructive",
                          pageTotals.balance > 0 && "text-green-700 dark:text-green-400"
                        )}
                      >
                        {money.format(pageTotals.balance)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
                </div>
                {pagination && (
                  <TablePaginationBar
                    pagination={pagination}
                    totalLabel="Total students"
                    pageSize={limit}
                    onPageChange={setPage}
                    onPageSizeChange={(nextLimit) => {
                      setLimit(nextLimit);
                      setPage(1);
                    }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
