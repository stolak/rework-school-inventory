import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaleCreateForm } from "@/components/forms/SaleCreateForm";
import type { GroupedSale } from "@/hooks/useSales";
import {
  groupedSaleCustomerName,
  groupedSaleTotalAmount,
  groupedSaleTotalQty,
} from "@/hooks/useSales";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "view";
  groupedSale?: GroupedSale;
  onSubmit: (data: unknown) => Promise<void>;
}

export function SaleDialog({
  open,
  onOpenChange,
  mode,
  groupedSale,
  onSubmit,
}: SaleDialogProps) {
  const handleSubmit = async (data: unknown) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getTitle = () => {
    switch (mode) {
      case "add":
        return "New Sale";
      case "view":
        return "Sale Details";
      default:
        return "Sale";
    }
  };

  const createdByName = groupedSale?.createdBy
    ? `${groupedSale.createdBy.firstName ?? ""} ${groupedSale.createdBy.lastName ?? ""}`.trim()
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {mode === "view" && groupedSale ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Reference</label>
                <p className="text-sm text-muted-foreground">
                  {groupedSale.referenceNo || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Customer</label>
                <p className="text-sm text-muted-foreground">
                  {groupedSaleCustomerName(groupedSale) || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Store</label>
                <p className="text-sm text-muted-foreground">
                  {groupedSale.store?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground capitalize">
                  {groupedSale.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction Date</label>
                <p className="text-sm text-muted-foreground">
                  {groupedSale.transactionDate
                    ? new Date(groupedSale.transactionDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Created By</label>
                <p className="text-sm text-muted-foreground">
                  {createdByName || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Quantity</label>
                <p className="text-sm text-muted-foreground">
                  {groupedSaleTotalQty(groupedSale)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Amount</label>
                <p className="text-sm text-muted-foreground">
                  ₦{groupedSaleTotalAmount(groupedSale).toLocaleString()}
                </p>
              </div>
            </div>

            {groupedSale.notes ? (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground">{groupedSale.notes}</p>
              </div>
            ) : null}

            <div>
              <label className="text-sm font-medium">Line Items</label>
              <div className="mt-2 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedSale.items.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.item?.name || "N/A"}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.qtyOut}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ₦{Number(line.outCost || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize">{line.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <SaleCreateForm
            onSubmit={async (data) => {
              await handleSubmit(data);
            }}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
