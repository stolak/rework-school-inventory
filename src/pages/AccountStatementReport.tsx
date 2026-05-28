import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReportActions } from "@/components/reports/ReportActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccountCharts } from "@/hooks/useAccountCharts";
import {
  computeRunningAccountBalances,
  useAccountTransactionLog,
} from "@/hooks/useAccountTransactionLog";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function accountOptionLabel(a: {
  accountNo?: string | null;
  accountDescription: string;
  subhead?: { name?: string } | null;
}): string {
  const no = a.accountNo?.trim();
  const sub = a.subhead?.name?.trim();
  const base = no ? `${no} — ${a.accountDescription}` : a.accountDescription;
  return sub ? `${base} (${sub})` : base;
}

export default function AccountStatementReport() {
  const TABLE_ID = "account-statement-report-table";
  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10);

  const [accountIdStr, setAccountIdStr] = useState("");
  const [transactionDateFrom, setTransactionDateFrom] = useState(defaultFrom);
  const [transactionDateTo, setTransactionDateTo] = useState(defaultTo);

  const { charts, isLoading: chartsLoading } = useAccountCharts({ status: "All" });

  const accountOptions = useMemo(() => {
    return [...charts]
      .sort((a, b) => {
        const na = (a.accountNo ?? "").toString();
        const nb = (b.accountNo ?? "").toString();
        if (na !== nb) return na.localeCompare(nb, undefined, { numeric: true });
        return a.accountDescription.localeCompare(b.accountDescription);
      })
      .map((a) => ({
        value: String(a.id),
        label: accountOptionLabel(a),
      }));
  }, [charts]);

  const queryParams = useMemo(() => {
    const id = parseInt(accountIdStr, 10);
    if (!accountIdStr || !Number.isFinite(id)) return null;
    if (
      transactionDateFrom &&
      transactionDateTo &&
      transactionDateFrom > transactionDateTo
    ) {
      return null;
    }
    return {
      accountId: id,
      transactionDateFrom: transactionDateFrom || undefined,
      transactionDateTo: transactionDateTo || undefined,
    };
  }, [accountIdStr, transactionDateFrom, transactionDateTo]);

  const dateRangeInvalid = Boolean(
    transactionDateFrom &&
      transactionDateTo &&
      transactionDateFrom > transactionDateTo
  );

  const { log, isLoading, isFetching, refetch, error } =
    useAccountTransactionLog(queryParams);

  const rowsWithBalance = useMemo(() => {
    if (!log) return [];
    return computeRunningAccountBalances(
      log.balanceBeforeFromDate ?? "0",
      log.transactions ?? []
    );
  }, [log]);

  const selectedAccount = charts.find((c) => String(c.id) === accountIdStr);

  const statementErrorMessage =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not load statement.";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ScrollText className="h-8 w-8" />
            Account statement
          </h1>
          <p className="text-muted-foreground mt-1">
            Select a chart account and date range. Running balance uses the opening balance before
            the from date, then each line’s debit minus credit.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center print:hidden">
          <ReportActions
            tableId={TABLE_ID}
            filenameBase="account-statement-report"
            disabled={isLoading || !queryParams || rowsWithBalance.length === 0}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={!queryParams}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            <span className="text-destructive">Account is required</span> to load the statement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Account</Label>
              {chartsLoading ? (
                <p className="text-sm text-muted-foreground">Loading accounts…</p>
              ) : (
                <Combobox
                  value={accountIdStr}
                  onValueChange={setAccountIdStr}
                  options={accountOptions}
                  placeholder="Select account…"
                  searchPlaceholder="Search by number or description…"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-2">
                <Label>From date</Label>
                <Input
                  type="date"
                  value={transactionDateFrom}
                  onChange={(e) => setTransactionDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To date</Label>
                <Input
                  type="date"
                  value={transactionDateTo}
                  onChange={(e) => setTransactionDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!accountIdStr ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Choose an account above to load its transaction statement.
          </CardContent>
        </Card>
      ) : dateRangeInvalid ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            The from date must be on or before the to date. Adjust the range and the statement
            will load automatically.
          </CardContent>
        </Card>
      ) : isLoading || isFetching ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            {statementErrorMessage}
          </CardContent>
        </Card>
      ) : log ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-semibold">
                  {log.account?.accountNo?.trim()
                    ? `${log.account.accountNo} — ${log.account.accountDescription}`
                    : log.account?.accountDescription ?? selectedAccount?.accountDescription ?? "—"}
                </p>
                <p className="text-muted-foreground">
                  {[log.account?.group?.name, log.account?.head?.name, log.account?.subhead?.name]
                    .filter(Boolean)
                    .join(" · ") || "—"}
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
                  {money.format(Number(log.balanceBeforeFromDate ?? 0))}
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
                    : transactionDateFrom}
                </p>
                <p className="mt-1">
                  <span className="text-muted-foreground">To: </span>
                  {log.transactionDateTo
                    ? new Date(log.transactionDateTo).toLocaleString()
                    : transactionDateTo}
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
                  No transactions in this period for the selected account.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table id={TABLE_ID}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Manual ref</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance after</TableHead>
                        <TableHead>Project</TableHead>
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
                          <TableCell className="max-w-[140px] truncate text-sm">
                            {row.project?.name ?? "—"}
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
