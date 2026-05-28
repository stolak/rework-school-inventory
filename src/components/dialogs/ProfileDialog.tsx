import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  );
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuth();

  const name = user?.name?.trim() || "—";
  const email = user?.email?.trim() || "—";
  const role = user?.role ? String(user.role) : "—";
  const userType = user?.userType ? String(user.userType) : "—";
  const id = user?.id ? String(user.id) : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xl font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Badge variant="secondary" className="capitalize">
              {role}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {userType}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Field label="User ID" value={id} />
          <Field label="Email" value={email} />
          <Field label="Role" value={role} />
          <Field label="User type" value={userType} />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

