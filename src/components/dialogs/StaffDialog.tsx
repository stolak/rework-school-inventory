import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff, StaffPosition, StaffStatus } from "@/lib/api";
import type { StaffUpdateInput } from "@/hooks/useStaffManagement";
import { STAFF_POSITIONS, STAFF_STATUSES } from "@/lib/staffConstants";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: Staff;
  onSubmit: (data: StaffUpdateInput) => void | Promise<unknown>;
  isSubmitting?: boolean;
}

export function StaffDialog({
  open,
  onOpenChange,
  staff,
  onSubmit,
  isSubmitting,
}: StaffDialogProps) {
  const [staffNumber, setStaffNumber] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState<StaffPosition>("teacher");
  const [status, setStatus] = useState<StaffStatus>("Active");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setStaffNumber(staff?.StaffNumber ?? "");
    setName(staff?.name ?? "");
    setPosition((staff?.position as StaffPosition) ?? "teacher");
    setStatus((staff?.status as StaffStatus) ?? "Active");
    setProfileImageUrl(staff?.profileImageUrl ?? "");
  }, [open, staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNumber.trim() || !name.trim()) return;
    try {
      await Promise.resolve(
        onSubmit({
          StaffNumber: staffNumber.trim(),
          name: name.trim(),
          position,
          status,
          profileImageUrl: profileImageUrl.trim() || undefined,
        }),
      );
      onOpenChange(false);
    } catch {
      /* toast from hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit staff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {staff?.email && (
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email (read-only)</Label>
                <p className="text-sm">{staff.email}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-staff-number">Staff number</Label>
              <Input
                id="edit-staff-number"
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-staff-name">Name</Label>
              <Input
                id="edit-staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position</Label>
                <Select
                  value={position}
                  onValueChange={(v) => setPosition(v as StaffPosition)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_POSITIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as StaffStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-profile-url">Profile image URL</Label>
              <Input
                id="edit-profile-url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !staffNumber.trim() || !name.trim()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
