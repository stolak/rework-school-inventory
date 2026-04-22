import { useState } from "react"
import { FileText, Search, Download, Printer, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStudentCollections } from "@/hooks/useStudentCollections"
import { useClasses } from "@/hooks/useClasses"
import { useSessions } from "@/hooks/useSessions"
import { useInventory } from "@/hooks/useInventory"
import { useToast } from "@/hooks/use-toast"

export default function InventoryCollectionsReport() {
  const [selectedSessionTermIds, setSelectedSessionTermIds] = useState<string[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)

  const { classes } = useClasses()
  const { sessions } = useSessions({ status: 'active' })
  const { items } = useInventory()
  const { toast } = useToast()

  // Build query parameters - handle multiple session terms
  const queryParams: any = {}
  if (selectedSessionTermIds.length > 0) {
    // For multiple session terms, we'll fetch all and filter client-side
    // or modify the API to accept array
    queryParams.session_term_ids = selectedSessionTermIds
  }
  if (selectedClassId) queryParams.class_id = selectedClassId
  if (selectedInventoryItemId) queryParams.inventory_item_id = selectedInventoryItemId

  const { collections, isLoading } = useStudentCollections(queryParams)

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const selectedSessions = sessions.filter(s => selectedSessionTermIds.includes(s.id))
  const selectedItem = items.find(i => i.id === selectedInventoryItemId)

  // Filter collections by multiple session terms client-side
  const filteredCollections = selectedSessionTermIds.length > 0
    ? collections.filter(c => selectedSessionTermIds.includes(c.session_term_id))
    : collections

  const handleSearch = () => {
    if (selectedSessionTermIds.length === 0) {
      toast({
        title: "Error",
        description: "At least one Session/Term is required for this report",
        variant: "destructive"
      })
      return
    }
    setHasSearched(true)
  }

  const handleClear = () => {
    setSelectedSessionTermIds([])
    setSelectedClassId("")
    setSelectedInventoryItemId("")
    setHasSearched(false)
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Convert data to CSV format
    const headers = ["Student Name", "Admission Number", "Class", "Item Name", "Category", "Session/Term", "Quantity", "Eligible", "Received", "Collection Date"];
    const csvData = [
      headers.join(","),
      ...filteredCollections.map((item) =>
        [
          `"${item.students?.first_name} ${item.students?.last_name}"`,
          `"${item.students?.admission_number}"`,
          `"${(item as any).students?.school_classes?.name || 'N/A'}"`,
          `"${item.itemName}"`,
          `"${item.inventory_items?.categories?.name || 'Unknown Category'}"`,
          `"${item.sessionName}"`,
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
    a.download = `inventory-collections-report-${new Date().toISOString().split("T")[0]}.csv`;
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

  // Group collections by student for better organization
  const groupedCollections = filteredCollections.reduce((acc, collection) => {
    const studentKey = `${collection.student_id}-${collection.students?.first_name}-${collection.students?.last_name}`;
    if (!acc[studentKey]) {
      acc[studentKey] = {
        student: collection.students,
        collections: []
      };
    }
    acc[studentKey].collections.push(collection);
    return acc;
  }, {} as Record<string, { student: any; collections: any[] }>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Inventory Collections Report</h1>
          <p className="text-muted-foreground">View all inventory collections by session and class</p>
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
              <label className="text-sm font-medium">Session/Term * (Multiple)</label>
              <MultiCombobox
                value={selectedSessionTermIds}
                onValueChange={setSelectedSessionTermIds}
                options={sessions.map((session) => ({
                  value: session.id,
                  label: `${session.name} - ${session.session}`
                }))}
                placeholder="Select sessions/terms..."
                searchPlaceholder="Search sessions..."
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
              <label className="text-sm font-medium">Inventory Item (Optional)</label>
              <Combobox
                value={selectedInventoryItemId}
                onValueChange={setSelectedInventoryItemId}
                options={[
                  { value: "", label: "All Items" },
                  ...items.map((item) => ({
                    value: item.id,
                    label: `${item.name} - ${item.categories?.name}`
                  }))
                ]}
                placeholder="Select item..."
                searchPlaceholder="Search items..."
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
                {selectedSessions.length > 0 && (
                  <span className="text-lg font-normal text-muted-foreground ml-2">
                    for {selectedSessions.map(s => s.name).join(", ")}
                    {selectedClass && ` - ${selectedClass.name}`}
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
            ) : filteredCollections.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No collections found</h3>
                <p className="text-muted-foreground">No inventory collections match the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center print:hidden">
                  <p className="text-sm text-muted-foreground">
                    Found {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''} across {Object.keys(groupedCollections).length} student{Object.keys(groupedCollections).length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {Object.entries(groupedCollections).map(([studentKey, { student, collections: studentCollections }]) => (
                  <div key={studentKey} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                      <div>
                        <h3 className="font-semibold">
                          {student?.first_name} {student?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {student?.admission_number} • {student?.school_classes?.name || "No Class"}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {studentCollections.length} item{studentCollections.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Session/Term</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Eligible</TableHead>
                          <TableHead>Received</TableHead>
                          <TableHead>Collection Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentCollections.map((collection) => (
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
