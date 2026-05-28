import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTableAsCsv } from "@/lib/reportExports";
import { useToast } from "@/hooks/use-toast";

export function ReportActions({
  tableId,
  filenameBase,
  disabled,
  className,
}: {
  tableId: string;
  filenameBase: string;
  disabled?: boolean;
  className?: string;
}) {
  const { toast } = useToast();

  const handleExportExcel = () => {
    try {
      exportTableAsCsv({
        tableId,
        filename: `${filenameBase}.csv`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error)?.message || "Failed to export",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={className ?? "flex gap-2 print:hidden"}>
      <Button
        onClick={handleExportExcel}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </Button>
      <Button
        onClick={handleExportPDF}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <Download className="h-4 w-4" />
        Export PDF
      </Button>
      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}

