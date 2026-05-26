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
import type { AppMenu } from "@/lib/api";
import type { MenuFormData } from "@/hooks/useMenus";

interface MenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menu?: AppMenu;
  onSubmit: (data: MenuFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

function normalizeStatus(status?: string): "Active" | "Inactive" {
  return status?.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function MenuDialog({
  open,
  onOpenChange,
  menu,
  onSubmit,
  isSubmitting,
}: MenuDialogProps) {
  const [route, setRoute] = useState("");
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  useEffect(() => {
    if (!open) return;
    setRoute(menu?.route ?? "");
    setCaption(menu?.caption ?? "");
    setStatus(normalizeStatus(menu?.status));
  }, [open, menu]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route.trim() || !caption.trim()) return;
    try {
      await Promise.resolve(
        onSubmit({
          route: route.trim(),
          caption: caption.trim(),
          status,
        }),
      );
      onOpenChange(false);
    } catch {
      /* toast from hook */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{menu ? "Edit menu" : "Create menu"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="menu-route">Route</Label>
              <Input
                id="menu-route"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                placeholder="e.g. /inventory/items"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-caption">Caption</Label>
              <Input
                id="menu-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Inventory Items"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "Active" | "Inactive")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={isSubmitting || !route.trim() || !caption.trim()}
            >
              {menu ? "Save changes" : "Create menu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
