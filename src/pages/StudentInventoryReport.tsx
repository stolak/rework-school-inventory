import { useMemo, useState } from "react"
import { FileText, Search, Download, Printer, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useClasses } from "@/hooks/useClasses"
import { useSessions } from "@/hooks/useSessions"
import { useStudents } from "@/hooks/useStudents"
import { useSubClasses } from "@/hooks/useSubClasses"
import { useTerms } from "@/hooks/useTerms"
import { useInventory } from "@/hooks/useInventory"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from "@tanstack/react-query"
import { studentCollectionsApi, type StudentCollectionSummaryRow } from "@/lib/api"

export default function StudentInventoryReport() {
  const today = useMemo(() => new Date(), [])
  const defaultTo = today.toISOString().slice(0, 10)
  const defaultFrom = new Date(
    today.getFullYear() - 1,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .slice(0, 10)

  const [selectedItemId, setSelectedItemId] = useState<string>("")
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSubClassId, setSelectedSubClassId] = useState<string>("")
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [transactionDateFrom, setTransactionDateFrom] = useState<string>(defaultFrom)
  const [transactionDateTo, setTransactionDateTo] = useState<string>(defaultTo)
  const [hasSearched, setHasSearched] = useState(true)

  const { classes } = useClasses()
  const { sessions } = useSessions({ status: 'active' })
  const { items } = useInventory()
  const { subClasses } = useSubClasses({ page: 1, limit: 500 })
  const { terms } = useTerms({ page: 1, limit: 200, status: "Active" })

  const { students: filteredStudents, isLoading: studentsLoading } = useStudents({
    status: "Active",
    page: 1,
    limit: 500,
    classId: selectedClassId || undefined,
    subClassId: selectedSubClassId || undefined,
  })
  const { toast } = useToast()

  const queryParams = useMemo(() => ({
    itemId: selectedItemId || undefined,
    studentId: selectedStudentId || undefined,
    classId: selectedClassId || undefined,
    subclassId: selectedSubClassId || undefined,
    sessionId: selectedSessionId || undefined,
    termId: selectedTermId || undefined,
    transactionDateFrom: transactionDateFrom || undefined,
    transactionDateTo: transactionDateTo || undefined,
  }), [
    selectedItemId,
    selectedStudentId,
    selectedClassId,
    selectedSubClassId,
    selectedSessionId,
    selectedTermId,
    transactionDateFrom,
    transactionDateTo,
  ])

  const { data, isLoading } = useQuery({
    queryKey: ["student-collections-summary", queryParams],
    queryFn: () => studentCollectionsApi.summary(queryParams),
    enabled: hasSearched,
  })

  const summaryRows: StudentCollectionSummaryRow[] = data?.data?.summary ?? []

  const selectedStudent = filteredStudents.find(s => s.id === selectedStudentId)
  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSubClass = subClasses.find(sc => sc.id === selectedSubClassId)
  const selectedSession = sessions.find(s => s.id === selectedSessionId)
  const selectedTerm = terms.find(t => t.id === selectedTermId)
  const selectedItem = items.find(i => i.id === selectedItemId)

  const handleSearch = () => {
    setHasSearched(true)
  }

  const handleClear = () => {
    setSelectedItemId("")
    setSelectedStudentId("")
    setSelectedClassId("")
    setSelectedSubClassId("")
    setSelectedSessionId("")
    setSelectedTermId("")
    setTransactionDateFrom(defaultFrom)
    setTransactionDateTo(defaultTo)
    setHasSearched(true)
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Convert data to CSV format
    const headers = [
      "Item Name",
      "Category",
      "Sub Category",
      "Brand",
      "Total Quantity Out",
    ];
    const csvData = [
      headers.join(","),
      ...summaryRows.map((item) =>
        [
          `"${item.item?.name ?? "Unknown Item"}"`,
          `"${item.item?.category?.name ?? ""}"`,
          `"${item.item?.subCategory?.name ?? ""}"`,
          `"${item.item?.brand?.name ?? ""}"`,
          item.totalQtyOut,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-collection-summary-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported to Excel successfully",
    });
  };

  const handleExportPDF = () => {
    window.print();
    toast({
      title: "Info",
      description: "Use your browser's print dialog to save as PDF",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Student Collection Summary</h1>
          <p className="text-muted-foreground">Summarize student collections by item over a date range</p>
        </div>
        <FileText className="h-8 w-8 text-primary" />
      </div>

      {/* Search Parameters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Item (Optional)</label>
              <Combobox
                value={selectedItemId}
                onValueChange={setSelectedItemId}
                options={[
                  { value: "", label: "All Items" },
                  ...items.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
                placeholder="All items"
                searchPlaceholder="Search items..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Student (Optional)</label>
              <Combobox
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                options={[
                  { value: "", label: "All Students" },
                  ...(studentsLoading ? [] : filteredStudents.map((student) => ({
                    value: student.id,
                    label: `${student.firstName} ${student.lastName} - ${student.admissionNumber}`,
                  }))),
                ]}
                placeholder={studentsLoading ? "Loading students..." : "All students"}
                searchPlaceholder="Search students..."
                disabled={studentsLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Class (Optional)</label>
              <Combobox
                value={selectedClassId}
                onValueChange={(v) => {
                  setSelectedClassId(v)
                  setSelectedSubClassId("")
                }}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map((class_) => ({
                    value: class_.id,
                    label: class_.name
                  }))
                ]}
                placeholder="Select class..."
                searchPlaceholder="Search classes..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sub class (Optional)</label>
              <Combobox
                value={selectedSubClassId}
                onValueChange={setSelectedSubClassId}
                options={[
                  { value: "", label: "All Sub classes" },
                  ...subClasses
                    .filter(sc => !selectedClassId || sc.classId === selectedClassId)
                    .map((sc) => ({
                      value: sc.id,
                      label: sc.name,
                    })),
                ]}
                placeholder="All sub classes"
                searchPlaceholder="Search sub classes..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Session (Optional)</label>
              <Combobox
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                options={[
                  { value: "", label: "All Sessions" },
                  ...sessions.map((session) => ({
                    value: session.id,
                    label: `${session.name} - ${session.session}`,
                  })),
                ]}
                placeholder="All sessions"
                searchPlaceholder="Search sessions..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Term (Optional)</label>
              <Combobox
                value={selectedTermId}
                onValueChange={setSelectedTermId}
                options={[
                  { value: "", label: "All Terms" },
                  ...terms.map((t) => ({
                    value: t.id,
                    label: t.name,
                  })),
                ]}
                placeholder="All terms"
                searchPlaceholder="Search terms..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Transaction Date From</label>
              <input
                type="date"
                value={transactionDateFrom}
                onChange={(e) => setTransactionDateFrom(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Transaction Date To</label>
              <input
                type="date"
                value={transactionDateTo}
                onChange={(e) => setTransactionDateTo(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Generate Summary
            </Button>
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                Summary Results
                {(selectedStudent || selectedClass || selectedSession || selectedTerm || selectedItem) && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    {selectedStudent ? `for ${selectedStudent.firstName} ${selectedStudent.lastName}` : "for All Students"}
                    {selectedClass && ` - ${selectedClass.name}`}
                    {selectedSubClass && ` - ${selectedSubClass.name}`}
                    {selectedSession && ` - ${selectedSession.name}`}
                    {selectedTerm && ` - ${selectedTerm.name}`}
                    {selectedItem && ` - ${selectedItem.name}`}
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-2 print:hidden">
                <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={handlePrint} variant="outline" size="sm" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : summaryRows.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No summary results</h3>
                <p className="text-muted-foreground">No student collections match the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <p className="text-sm text-muted-foreground">
                    Found {summaryRows.length} item{summaryRows.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Total Qty Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryRows.map((row) => (
                      <TableRow key={row.itemId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{row.item?.name ?? "Unknown Item"}</div>
                            {/* <Badge variant="secondary" className="text-xs">{row.itemId}</Badge> */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {row.item?.category?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {row.item.category.name}
                                </Badge>
                              )}
                              {row.item?.subCategory?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {row.item.subCategory.name}
                                </Badge>
                              )}
                              {row.item?.brand?.name && (
                                <Badge variant="outline" className="text-xs">
                                  {row.item.brand.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.totalQtyOut}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
