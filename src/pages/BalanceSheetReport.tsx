import { useMemo, useState } from "react";
import { BookMarked } from "lucide-react";
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
  type BalanceSheetHeadSection,
  type BalanceSheetReportData,
} from "@/lib/api";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function isBalanceSheetHeadSection(v: unknown): v is BalanceSheetHeadSection {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.headcode === "number" &&
    typeof o.name === "string" &&
    Array.isArray(o.subheads)
  );
}

function parseHeadSections(raw: BalanceSheetReportData | undefined): BalanceSheetHeadSection[] {
  if (!raw || typeof raw !== "object") return [];
  return Object.values(raw).filter(isBalanceSheetHeadSection);
}

export default function BalanceSheetReport() {
  const TABLE_ID = "balance-sheet-summary-table";
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
    queryKey: ["balance-sheet-report", queryParams],
    queryFn: async () => {
      if (!queryParams) throw new Error("Missing as-of date");
      const res = await accountTransactionsApi.reportByHeadSubhead(queryParams);
      if (!res?.success) throw new Error(res?.message || "Failed to load balance sheet");
      return res.data as BalanceSheetReportData;
    },
    enabled: queryParams != null,
    staleTime: 30_000,
  });

  const headSections = useMemo(() => {
    const list = parseHeadSections(data);
    return [...list].sort((a, b) => a.headcode - b.headcode);
  }, [data]);

  const headTotals = useMemo(() => {
    return headSections.map((h) => ({
      headcode: h.headcode,
      name: h.name,
      total: h.subheads.reduce((s, sh) => s + Number(sh.balance ?? 0), 0),
    }));
  }, [headSections]);

  const grandTotal = useMemo(() => {
    return headSections.reduce(
      (sum, h) => sum + h.subheads.reduce((s, sh) => s + Number(sh.balance ?? 0), 0),
      0
    );
  }, [headSections]);

  const errMsg =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : "Could not load balance sheet.";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookMarked className="h-8 w-8" />
            Account balance sheet
          </h1>
          <p className="text-muted-foreground mt-1">
            Balances rolled up by account head and subhead as of the selected date (per API).
            Optional from date narrows the activity window.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center print:hidden">
          <ReportActions
            tableId={TABLE_ID}
            filenameBase="balance-sheet-report"
            disabled={isLoading || headTotals.length === 0}
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
            optional.
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
            Set the as-of (to) date to load the balance sheet.
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">As of {transactionDateTo}</CardTitle>
              <CardDescription>
                {transactionDateFrom
                  ? `From ${transactionDateFrom} through as-of date.`
                  : "Through as-of date (no from filter)."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Grand total (all subheads):{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {money.format(grandTotal)}
                </span>
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {headSections.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No head sections returned.</p>
            ) : (
              headSections.map((head) => {
                const sectionTotal = head.subheads.reduce(
                  (s, sh) => s + Number(sh.balance ?? 0),
                  0
                );
                return (
                  <Card key={head.headcode}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <CardTitle className="text-lg">
                          {head.headcode} — {head.name}
                        </CardTitle>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          Section total:{" "}
                          <span className="font-semibold text-foreground">
                            {money.format(sectionTotal)}
                          </span>
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {head.subheads.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No subhead lines.</p>
                      ) : (
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Subhead</TableHead>
                                <TableHead className="text-right w-[160px]">Balance</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {head.subheads.map((sh) => (
                                <TableRow key={sh.id}>
                                  <TableCell className="font-medium">{sh.name}</TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {money.format(Number(sh.balance ?? 0))}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50 font-medium">
                                <TableCell>Total — {head.name}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {money.format(sectionTotal)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {headSections.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary by head</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table id={TABLE_ID}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Head code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Total balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headTotals.map((h) => (
                        <TableRow key={h.headcode}>
                          <TableCell className="tabular-nums">{h.headcode}</TableCell>
                          <TableCell>{h.name}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {money.format(h.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={2}>Grand total</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {money.format(grandTotal)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : null}
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
