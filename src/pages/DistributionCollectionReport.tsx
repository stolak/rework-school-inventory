import { useState } from "react";
import { FileText, Search, Download, Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useDistributionCollection } from "@/hooks/useDistributionCollection";
import { useClasses } from "@/hooks/useClasses";
import { useSchoolSessions } from "@/hooks/useSchoolSessions";
import { useInventory } from "@/hooks/useInventory";
import { useClassTeachers } from "@/hooks/useClassTeachers";
import { useToast } from "@/hooks/use-toast";

export default function DistributionCollectionReport() {
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  const { classes } = useClasses();
  const { sessions } = useSchoolSessions({ status: "Active", page: 1, limit: 500 });
  const { items: inventory } = useInventory();
  const { classTeachers } = useClassTeachers({ status: "active" });
  const { toast } = useToast();

  // Build query parameters
  const queryParams: any = {};
  if (selectedInventoryId) queryParams.inventory_item_id = selectedInventoryId;
  if (selectedClassId) queryParams.class_id = selectedClassId;
  if (selectedSessionId) queryParams.session_term_id = selectedSessionId;
  if (selectedTeacherId) queryParams.teacher_id = selectedTeacherId;

  const { collections, isLoading } = useDistributionCollection(queryParams);

  const handleSearch = () => {
    // if (!selectedInventoryId && !selectedClassId && !selectedSessionId && !selectedTeacherId) {
    //   toast({
    //     title: "Error",
    //     description: "Please select at least one filter parameter",
    //     variant: "destructive",
    //   });
    //   return;
    // }
    setHasSearched(true);
  };

  const handleClear = () => {
    setSelectedInventoryId("");
    setSelectedClassId("");
    setSelectedSessionId("");
    setSelectedTeacherId("");
    setHasSearched(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // Convert data to CSV format
    const headers = ["Item Name", "SKU", "Category", "Total Received", "Total Distributed", "Balance", "Last Distribution Date"];
    const csvData = [
      headers.join(","),
      ...collections.map((item) =>
        [
          `"${item.item_name}"`,
          `"${item.inventory_items?.sku}"`,
          `"${item.inventory_items?.categories?.name}"`,
          item.total_received_quantity,
          item.total_distributed_quantity,
          item.balance_quantity,
          `"${new Date(item.last_distribution_date).toLocaleDateString()}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distribution-collection-report-${new Date().toISOString().split("T")[0]}.csv`;
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
          <h1 className="text-3xl font-bold">Distribution & Collection Report</h1>
          <p className="text-muted-foreground">View inventory distribution and collection summary</p>
        </div>
        <FileText className="h-8 w-8 text-primary" />
      </div>

      {/* Search Parameters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Inventory Item</label>
              <Combobox
                value={selectedInventoryId}
                onValueChange={setSelectedInventoryId}
                options={[
                  { value: "", label: "All Items" },
                  ...inventory.map((item) => ({
                    value: item.id,
                    label: `${item.name} - ${item?.sku}`,
                  })),
                ]}
                placeholder="Select item..."
                searchPlaceholder="Search items..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Class</label>
              <Combobox
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map((class_) => ({
                    value: class_.id,
                    label: class_.name,
                  })),
                ]}
                placeholder="Select class..."
                searchPlaceholder="Search classes..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Session/Term</label>
              <Combobox
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                options={[
                  { value: "", label: "All Sessions/Terms" },
                  ...sessions.map((session) => ({
                    value: session.id,
                    label: session.name,
                  })),
                ]}
                placeholder="Select session/term..."
                searchPlaceholder="Search sessions..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teacher</label>
              <Combobox
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                options={[
                  { value: "", label: "All Teachers" },
                  ...classTeachers.map((teacher) => ({
                    value: teacher?.id,
                    label: teacher.name,
                  })),
                ]}
                placeholder="Select teacher..."
                searchPlaceholder="Search teachers..."
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
              <CardTitle>Report Results</CardTitle>
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
                <h3 className="mt-4 text-lg font-semibold">No data found</h3>
                <p className="text-muted-foreground">No distribution/collection data matches the selected criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <p className="text-sm text-muted-foreground">
                    Found {collections.length} item{collections.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Received</TableHead>
                        <TableHead className="text-right">Total Distributed</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Last Distribution Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collections.map((item) => (
                        <TableRow key={item.inventory_item_id}>
                          <TableCell>
                            <div className="font-medium">{item.item_name}</div>
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="secondary">
                              {item.inventory_items?.categories?.name || 'No Category'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default" className="bg-success/10 text-success hover:bg-success/20">
                              {item.total_received_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                              {item.total_distributed_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="default"
                              className={
                                item.balance_quantity > 0
                                  ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                                  : "bg-warning/10 text-warning hover:bg-warning/20"
                              }
                            >
                              {item.balance_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(item.last_distribution_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
