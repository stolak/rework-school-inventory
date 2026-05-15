import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PurchaseCreateForm } from "@/components/forms/PurchaseCreateForm"
import { PurchaseEditForm } from "@/components/forms/PurchaseEditForm"
import type { GroupedPurchase, Purchase } from "@/hooks/usePurchases"
import { groupedPurchaseTotalCost } from "@/hooks/usePurchases"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit" | "view"
  groupedPurchase?: GroupedPurchase
  purchase?: Purchase
  onSubmit: (data: unknown) => Promise<void>
}

export function PurchaseDialog({
  open,
  onOpenChange,
  mode,
  groupedPurchase,
  purchase,
  onSubmit,
}: PurchaseDialogProps) {
  const handleSubmit = async (data: unknown) => {
    await onSubmit(data)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const getTitle = () => {
    switch (mode) {
      case "add":
        return "New Purchase Order"
      case "edit":
        return "Edit Purchase Line"
      case "view":
        return "Purchase Order Details"
      default:
        return "Purchase Order"
    }
  }

  const createdByName = groupedPurchase?.createdBy
    ? `${groupedPurchase.createdBy.firstName ?? ""} ${groupedPurchase.createdBy.lastName ?? ""}`.trim()
    : ""

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

        {mode === "view" && groupedPurchase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Reference No</label>
                <p className="text-sm text-muted-foreground">
                  {groupedPurchase.referenceNo || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Supplier</label>
                <p className="text-sm text-muted-foreground">
                  {groupedPurchase.supplier?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Store</label>
                <p className="text-sm text-muted-foreground">
                  {groupedPurchase.store?.name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm text-muted-foreground capitalize">
                  {groupedPurchase.status}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Amount Paid</label>
                <p className="text-sm text-muted-foreground">
                  ₦{Number(groupedPurchase.amountPaid || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Total Cost</label>
                <p className="text-sm text-muted-foreground">
                  ₦{groupedPurchaseTotalCost(groupedPurchase).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Transaction Date</label>
                <p className="text-sm text-muted-foreground">
                  {groupedPurchase.transactionDate
                    ? new Date(groupedPurchase.transactionDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
              {createdByName ? (
                <div>
                  <label className="text-sm font-medium">Created By</label>
                  <p className="text-sm text-muted-foreground">{createdByName}</p>
                </div>
              ) : null}
            </div>

            {groupedPurchase.notes ? (
              <div>
                <label className="text-sm font-medium">Notes</label>
                <p className="text-sm text-muted-foreground">{groupedPurchase.notes}</p>
              </div>
            ) : null}

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Line cost (₦)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedPurchase.items.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        {line.item?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">{line.qtyIn}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        ₦{Number(line.inCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">{line.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : mode === "add" ? (
          <PurchaseCreateForm onSubmit={handleSubmit} onCancel={handleCancel} />
        ) : (
          <PurchaseEditForm
            purchase={purchase}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
