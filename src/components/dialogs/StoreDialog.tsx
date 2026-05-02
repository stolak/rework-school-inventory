import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoreForm, type StoreFormData } from "@/components/forms/StoreForm";
import type { UserWithDisplay } from "@/hooks/useUsers";
import type { StoreListItem } from "@/hooks/useStores";

interface StoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreListItem;
  adminUsers: UserWithDisplay[];
  usersLoading?: boolean;
  onSubmit: (data: StoreFormData) => void | Promise<void>;
}

export function StoreDialog({
  open,
  onOpenChange,
  store,
  adminUsers,
  usersLoading,
  onSubmit,
}: StoreDialogProps) {
  const handleSubmit = async (data: StoreFormData) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch {
      /* errors surfaced by mutation toast */
    }
  };

  const handleCancel = () => onOpenChange(false);

  if (!store) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit store</DialogTitle>
        </DialogHeader>
        <StoreForm
          key={store.id}
          initialData={store}
          adminUsers={adminUsers}
          usersLoading={usersLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update store"
        />
      </DialogContent>
    </Dialog>
  );
}
