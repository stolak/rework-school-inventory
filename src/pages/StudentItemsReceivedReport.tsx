import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileBarChart,
  FileSpreadsheet,
  Printer,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClasses } from "@/hooks/useClasses";
import { useSubClasses } from "@/hooks/useSubClasses";
import { useSchoolSessions } from "@/hooks/useSchoolSessions";
import { useTerms } from "@/hooks/useTerms";
import { useInventory } from "@/hooks/useInventory";
import { useDefaultBillingPeriod } from "@/hooks/useDefaultBillingPeriod";
import { useToast } from "@/hooks/use-toast";
import {
  studentCollectionsApi,
  type StudentItemsReceivedReportRow,
  type StudentItemsReceivedReportStudentInfo,
} from "@/lib/api";

function formatStudentName(info: StudentItemsReceivedReportStudentInfo): string {
  return [info.firstName, info.middleName, info.lastName]
    .filter(Boolean)
    .join(" ");
}

export default function StudentItemsReceivedReport() {
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [subclassId, setSubclassId] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { defaultBillingPeriod } = useDefaultBillingPeriod();
  const seededSessionTermFromDefaultBilling = useRef(false);
  const { toast } = useToast();

  const { classes } = useClasses({ page: 1, limit: 200 });
  const { subClasses } = useSubClasses({ page: 1, limit: 500 });
  const { sessions } = useSchoolSessions({ page: 1, limit: 100, status: "Active" });
  const { terms } = useTerms({ page: 1, limit: 100, status: "Active" });
  const { items } = useInventory({ page: 1, limit: 500 });

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
    if (!classId) return [];
    return subClasses.filter((sc) => sc.classId === classId);
  }, [subClasses, classId]);

  const subclassOptions = useMemo(
    () => [
      { value: "", label: "All subclasses" },
      ...filteredSubclasses.map((sc) => ({ value: sc.id, label: sc.name })),
    ],
    [filteredSubclasses]
  );

  const sessionOptions = useMemo(
    () => sessions.map((s) => ({ value: s.id, label: s.name })),
    [sessions]
  );

  const termOptions = useMemo(
    () => [
      { value: "", label: "All terms" },
      ...terms.map((t) => ({ value: t.id, label: t.name })),
    ],
    [terms]
  );

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        value: item.id,
        label: item.category?.name
          ? `${item.name} — ${item.category.name}`
          : item.name,
      })),
    [items]
  );

  const filtersReady =
    Boolean(sessionId) &&
    Boolean(classId) &&
    selectedItemIds.length > 0;

  const reportParams = useMemo(
    () =>
      filtersReady
        ? {
            classId,
            sessionId,
            itemIds: selectedItemIds,
            ...(subclassId ? { subclassId } : {}),
            ...(termId ? { termId } : {}),
          }
        : null,
    [filtersReady, classId, subclassId, sessionId, termId, selectedItemIds]
  );

  const {
    data: reportResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["student-items-received-report", reportParams],
    queryFn: async () => {
      const res = await studentCollectionsApi.itemsReceivedReport(
        reportParams!
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to load report");
      }
      return res.data ?? [];
    },
    enabled: hasSearched && !!reportParams,
    staleTime: 30_000,
  });

  const reportRows: StudentItemsReceivedReportRow[] = reportResponse ?? [];

  const itemColumns = useMemo(() => {
    if (reportRows.length > 0 && reportRows[0].items.length > 0) {
      return reportRows[0].items.map((item) => ({
        id: item.itemId,
        name: item.itemName,
      }));
    }
    return selectedItemIds.map((id) => {
      const item = items.find((i) => i.id === id);
      return { id, name: item?.name ?? id };
    });
  }, [reportRows, selectedItemIds, items]);

  const qtyByStudentAndItem = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const row of reportRows) {
      const itemMap = new Map<string, number>();
      for (const cell of row.items) {
        itemMap.set(cell.itemId, cell.qtyReceived);
      }
      map.set(row.studentInfo.id, itemMap);
    }
    return map;
  }, [reportRows]);

  const columnTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const col of itemColumns) {
      totals.set(col.id, 0);
    }
    for (const row of reportRows) {
      const itemMap = qtyByStudentAndItem.get(row.studentInfo.id);
      for (const col of itemColumns) {
        totals.set(
          col.id,
          (totals.get(col.id) ?? 0) + (itemMap?.get(col.id) ?? 0)
        );
      }
    }
    return totals;
  }, [reportRows, itemColumns, qtyByStudentAndItem]);

  const filterSummary = useMemo(() => {
    const sessionLabel = sessions.find((s) => s.id === sessionId)?.name ?? "—";
    const termLabel = termId
      ? terms.find((t) => t.id === termId)?.name ?? "—"
      : "All terms";
    const classLabel = classes.find((c) => c.id === classId)?.name ?? "—";
    const subclassLabel = subclassId
      ? subClasses.find((sc) => sc.id === subclassId)?.name ?? "—"
      : "All subclasses";
    return { sessionLabel, termLabel, classLabel, subclassLabel };
  }, [
    sessionId,
    termId,
    classId,
    subclassId,
    sessions,
    terms,
    classes,
    subClasses,
  ]);

  const handleGenerate = () => {
    if (!filtersReady) {
      toast({
        title: "Missing filters",
        description:
          "Select session, class, and at least one item.",
        variant: "destructive",
      });
      return;
    }
    setHasSearched(true);
  };

  const handleClear = () => {
    setClassId("");
    setSubclassId("");
    setSelectedItemIds([]);
    setHasSearched(false);
  };

  const handleExportCsv = () => {
    if (reportRows.length === 0) return;
    const headers = ["Student", ...itemColumns.map((col) => col.name)];
    const lines = reportRows.map((row) => {
      const itemMap = qtyByStudentAndItem.get(row.studentInfo.id);
      const studentLabel = `${formatStudentName(row.studentInfo)} (${row.studentInfo.admissionNumber})`;
      return [
        `"${studentLabel}"`,
        ...itemColumns.map((col) =>
          String(itemMap?.get(col.id) ?? 0)
        ),
      ].join(",");
    });
    const totalLine = [
      '"Total"',
      ...itemColumns.map((col) => String(columnTotals.get(col.id) ?? 0)),
    ].join(",");
    const csv = [headers.map((h) => `"${h}"`).join(","), ...lines, totalLine].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-items-received-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Report downloaded as CSV." });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileBarChart className="h-8 w-8" />
            Student items received
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Matrix report: students in rows, selected items as columns, showing
            quantity received per student for the chosen class, session, and
            items. Term and subclass can be narrowed or left as All.
          </p>
        </div>
        {hasSearched && filtersReady && (
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
        )}
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Session defaults from the configured default billing period when
            available. Term and subclass are optional (use All to include every
            term or subclass). Class and items are required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <Label>Term (optional)</Label>
              <Combobox
                options={termOptions}
                value={termId}
                onValueChange={setTermId}
                placeholder="All terms"
                searchPlaceholder="Search terms…"
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
              <Label>Subclass (optional)</Label>
              <Combobox
                options={subclassOptions}
                value={subclassId}
                onValueChange={setSubclassId}
                placeholder={
                  classId ? "All subclasses" : "Select class first"
                }
                searchPlaceholder="Search subclasses…"
                disabled={!classId}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Items</Label>
            <MultiCombobox
              options={itemOptions}
              value={selectedItemIds}
              onValueChange={setSelectedItemIds}
              placeholder="Select one or more items…"
              searchPlaceholder="Search items…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleGenerate}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Generate report
            </Button>
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {!hasSearched ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Set filters and click Generate report to load the matrix.
          </CardContent>
        </Card>
      ) : !filtersReady ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Complete all required filters before generating the report.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {(error as Error)?.message ?? "Failed to load report"}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle>Items received matrix</CardTitle>
                <CardDescription className="mt-1">
                  {filterSummary.classLabel} · {filterSummary.subclassLabel} ·{" "}
                  {filterSummary.sessionLabel} · {filterSummary.termLabel}
                </CardDescription>
              </div>
              <div className="flex gap-2 print:hidden shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleExportCsv}
                  disabled={reportRows.length === 0}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.print()}
                  disabled={reportRows.length === 0}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reportRows.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No students found for the selected criteria.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-20 bg-muted min-w-[200px] border-r">
                        Student
                      </TableHead>
                      {itemColumns.map((col) => (
                        <TableHead
                          key={col.id}
                          className="text-center min-w-[100px] max-w-[160px]"
                          title={col.name}
                        >
                          <span className="line-clamp-2 text-xs font-medium">
                            {col.name}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRows.map((row) => {
                      const itemMap = qtyByStudentAndItem.get(
                        row.studentInfo.id
                      );
                      return (
                        <TableRow key={row.studentInfo.id}>
                          <TableCell className="sticky left-0 z-10 bg-background border-r font-medium">
                            <div>{formatStudentName(row.studentInfo)}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {row.studentInfo.admissionNumber}
                            </div>
                          </TableCell>
                          {itemColumns.map((col) => {
                            const qty = itemMap?.get(col.id) ?? 0;
                            return (
                              <TableCell
                                key={col.id}
                                className="text-center tabular-nums"
                              >
                                {qty}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-muted/80 font-semibold">
                      <TableCell className="sticky left-0 z-10 bg-muted border-r">
                        Total
                      </TableCell>
                      {itemColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          className="text-center tabular-nums"
                        >
                          {columnTotals.get(col.id) ?? 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
            {reportRows.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3 print:hidden">
                {reportRows.length} student
                {reportRows.length !== 1 ? "s" : ""} · {itemColumns.length}{" "}
                item{itemColumns.length !== 1 ? "s" : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
