import { useState } from "react"
import { FileText, Search, Download, Printer, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStudentCollections } from "@/hooks/useStudentCollections"
import { useClasses } from "@/hooks/useClasses"
import { useSessions } from "@/hooks/useSessions"
import { useStudents } from "@/hooks/useStudents"
import { useToast } from "@/hooks/use-toast"

export default function StudentInventoryReport() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedSessionTermId, setSelectedSessionTermId] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)

  const { classes } = useClasses()
  const { sessions } = useSessions({ status: 'active' })
  const { students: allStudents } = useStudents({ status: "Active", page: 1, limit: 500 })
  const { toast } = useToast()

  // Build query parameters
  const queryParams: any = {}
  if (selectedStudentId) queryParams.student_id = selectedStudentId
  if (selectedClassId) queryParams.class_id = selectedClassId
  if (selectedSessionTermId) queryParams.session_term_id = selectedSessionTermId

  const { collections, isLoading } = useStudentCollections(queryParams)

  const selectedStudent = allStudents.find(s => s.id === selectedStudentId)
  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSession = sessions.find(s => s.id === selectedSessionTermId)

  const handleSearch = () => {
    if (!selectedStudentId) {
      toast({
        title: "Error",
        description: "Student ID is required for this report",
        variant: "destructive"
      })
      return
    }
    setHasSearched(true)
  }

  const handleClear = () => {
    setSelectedStudentId("")
    setSelectedClassId("")
    setSelectedSessionTermId("")
    setHasSearched(false)
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Convert data to CSV format
    const headers = ["Item Name", "Category", "Session/Term", "Class", "Quantity", "Eligible", "Received", "Collection Date"];
    const csvData = [
      headers.join(","),
      ...collections.map((item) =>
        [
          `"${item.itemName}"`,
          `"${item.inventory_items?.categories?.name || 'Unknown Category'}"`,
          `"${item.sessionName}"`,
          `"${item.school_classes?.name || 'N/A'}"`,
          item.qty,
          item.eligible ? "Yes" : "No",
          item.received ? "Yes" : "No",
          `"${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
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
          <h1 className="text-3xl font-bold">Student Inventory Report</h1>
          <p className="text-muted-foreground">View inventory collections for specific students</p>
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
              <label className="text-sm font-medium">Student *</label>
              <Combobox
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                options={allStudents.map((student) => ({
                  value: student.id,
                  label: `${student.firstName} ${student.lastName} - ${student.admissionNumber}`
                }))}
                placeholder="Select student..."
                searchPlaceholder="Search students..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Class (Optional)</label>
              <Combobox
                value={selectedClassId}
                onValueChange={setSelectedClassId}
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
              <label className="text-sm font-medium">Session/Term (Optional)</label>
              <Combobox
                value={selectedSessionTermId}
                onValueChange={setSelectedSessionTermId}
                options={[
                  { value: "", label: "All Sessions/Terms" },
                  ...sessions.map((session) => ({
                    value: session.id,
                    label: `${session.name} - ${session.session}`
                  }))
                ]}
                placeholder="Select session/term..."
                searchPlaceholder="Search sessions..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Generate Report
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
                Report Results 
                {selectedStudent && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    for {selectedStudent.firstName} {selectedStudent.lastName}
                    {selectedClass && ` - ${selectedClass.name}`}
                    {selectedSession && ` - ${selectedSession.name}`}
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
            ) : collections.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No collections found</h3>
                <p className="text-muted-foreground">No inventory collections match the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <p className="text-sm text-muted-foreground">
                    Found {collections.length} collection{collections.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Session/Term</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Eligible</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Collection Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{collection.itemName}</div>
                            <Badge variant="secondary" className="text-xs">
                              {collection.inventory_items?.categories?.name || "Unknown Category"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{collection.sessionName}</TableCell>
                        <TableCell>{collection.school_classes?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{collection.qty}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={collection.eligible ? "default" : "secondary"}>
                            {collection.eligible ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={collection.received ? "default" : "secondary"}>
                            {collection.received ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {collection.created_at ? new Date(collection.created_at).toLocaleDateString() : "N/A"}
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
