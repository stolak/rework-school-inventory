import { useMemo, useState } from "react";
import { Equal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  accountTransactionsApi,
  type TrialBalanceReportRow,
} from "@/lib/api";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function accountLabel(a: TrialBalanceReportRow["account"]): string {
  const no = a.accountNo?.trim();
  if (no) return `${no} — ${a.accountDescription}`;
  const ref = a.accountRef?.trim();
  if (ref) return `${ref.slice(0, 8)}… — ${a.accountDescription}`;
  return a.accountDescription;
}

export default function TrialBalanceReport() {
  const TABLE_ID = "trial-balance-report-table";
  const today = useMemo(() => new Date(), []);
  const defaultTo = today.toISOString().slice(0, 10);

  const [transactionDateFrom, setTransactionDateFrom] = useState("");
  const [transactionDateTo, setTransactionDateTo] = useState(defaultTo);

  const dateRangeInvalid = Boolean(
    transactionDateFrom &&
      transactionDateTo &&
      transactionDateFrom > transactionDateTo
  );

  const queryParams = useMemo(() => {
    if (!transactionDateTo) return null;
    if (dateRangeInvalid) return null;
    return {
      transactionDateTo,
      transactionDateFrom: transactionDateFrom || undefined,
    };
  }, [transactionDateTo, transactionDateFrom, dateRangeInvalid]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["trial-balance-report", queryParams],
    queryFn: async () => {
      if (!queryParams) throw new Error("Missing as-of date");
      const res = await accountTransactionsApi.reportByAccount(queryParams);
      if (!res?.success) throw new Error(res?.message || "Failed to load trial balance");
      return res.data;
    },
    enabled: queryParams != null,
    staleTime: 30_000,
  });

  const sortedRows = useMemo(() => {
    const rows = data?.rows ?? [];
    return [...rows].sort((a, b) => {
      const ga = a.account.group?.name ?? "";
      const gb = b.account.group?.name ?? "";
      if (ga !== gb) return ga.localeCompare(gb);
      const ha = a.account.head?.code ?? a.account.head?.name ?? "";
      const hb = b.account.head?.code ?? b.account.head?.name ?? "";
      if (ha !== hb) return ha.localeCompare(hb, undefined, { numeric: true });
      const sa = a.account.subhead?.code ?? a.account.subhead?.name ?? "";
      const sb = b.account.subhead?.code ?? b.account.subhead?.name ?? "";
      if (sa !== sb) return sa.localeCompare(sb, undefined, { numeric: true });
      return accountLabel(a.account).localeCompare(accountLabel(b.account));
    });
  }, [data?.rows]);

  const netTotal = useMemo(() => {
    return sortedRows.reduce((sum, r) => sum + Number(r.sumCreditMinusDebit ?? 0), 0);
  }, [sortedRows]);

  /** Sum of |credit − debit| for accounts with net &lt; 0 (debit column). */
  const debitColumnTotal = useMemo(() => {
    return sortedRows.reduce((sum, r) => {
      const v = Number(r.sumCreditMinusDebit ?? 0);
      return v < 0 ? sum + Math.abs(v) : sum;
    }, 0);
  }, [sortedRows]);

  /** Sum of (credit − debit) for accounts with net &gt; 0 (credit column). */
  const creditColumnTotal = useMemo(() => {
    return sortedRows.reduce((sum, r) => {
      const v = Number(r.sumCreditMinusDebit ?? 0);
      return v > 0 ? sum + v : sum;
    }, 0);
  }, [sortedRows]);

  const errMsg =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not load trial balance.";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Equal className="h-8 w-8" />
            Trial balance
          </h1>
          <p className="text-muted-foreground mt-1">
            Account balances as of the selected date. Each value is net{" "}
            <span className="text-foreground font-medium">credit − debit</span> for that account
            (per API). Optional from date narrows the movement window.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center print:hidden">
          <ReportActions
            tableId={TABLE_ID}
            filenameBase="trial-balance-report"
            disabled={isLoading || sortedRows.length === 0}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={!queryParams || isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parameters</CardTitle>
          <CardDescription>
            <span className="text-destructive">As-of (to) date is required.</span> From date is
            optional; leave empty to include all activity up to the to date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            <div className="space-y-2">
              <Label>From date (optional)</Label>
              <Input
                type="date"
                value={transactionDateFrom}
                onChange={(e) => setTransactionDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>As-of date (to)</Label>
              <Input
                type="date"
                value={transactionDateTo}
                onChange={(e) => setTransactionDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!transactionDateTo ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Set the as-of (to) date to load the trial balance.
          </CardContent>
        </Card>
      ) : dateRangeInvalid ? (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            The from date must be on or before the as-of (to) date.
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
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Report window
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">From: </span>
                  {data.transactionDateFrom
                    ? new Date(data.transactionDateFrom).toLocaleString()
                    : "— (inception)"}
                </p>
                <p>
                  <span className="text-muted-foreground">To: </span>
                  {data.transactionDateTo
                    ? new Date(data.transactionDateTo).toLocaleString()
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Check total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">{money.format(netTotal)}</p>
                <p className="text-xs text-muted-foreground mt-2 space-y-0.5">
                  <span className="block">
                    Debit column total: {money.format(debitColumnTotal)} (sum of |net| where net
                    &lt; 0)
                  </span>
                  <span className="block">
                    Credit column total: {money.format(creditColumnTotal)} (sum of net where net
                    &gt; 0)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Net of all accounts (credit − debit) should be zero if books balance.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accounts ({sortedRows.length})</CardTitle>
              <CardDescription>
                Sorted by group, head, subhead, then account. Negative net (credit − debit) appears
                under Debit; positive net under Credit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sortedRows.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No rows returned.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table id={TABLE_ID}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Head</TableHead>
                        <TableHead>Subhead</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRows.map((row) => {
                        const net = Number(row.sumCreditMinusDebit ?? 0);
                        const debitCell =
                          net < 0 ? money.format(Math.abs(net)) : "—";
                        const creditCell = net > 0 ? money.format(net) : "—";
                        return (
                        <TableRow key={row.accountId}>
                          <TableCell className="text-sm">
                            {row.account.group?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[140px]">
                            <div className="truncate" title={row.account.head?.name}>
                              {row.account.head?.code
                                ? `${row.account.head.code} — ${row.account.head.name}`
                                : (row.account.head?.name ?? "—")}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm max-w-[140px]">
                            <div className="truncate" title={row.account.subhead?.name}>
                              {row.account.subhead?.code
                                ? `${row.account.subhead.code} — ${row.account.subhead.name}`
                                : (row.account.subhead?.name ?? "—")}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[260px]">
                            <div className="truncate" title={accountLabel(row.account)}>
                              {accountLabel(row.account)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {debitCell}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {creditCell}
                          </TableCell>
                        </TableRow>
                      );
                      })}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {debitColumnTotal > 0
                            ? money.format(debitColumnTotal)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {creditColumnTotal > 0
                            ? money.format(creditColumnTotal)
                            : "—"}
                        </TableCell>
                      </TableRow>
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
