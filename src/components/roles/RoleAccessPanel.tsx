import { LayoutList, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RolePrivilegesPanel } from "@/components/roles/RolePrivilegesPanel";
import { RoleMenusPanel } from "@/components/roles/RoleMenusPanel";
import type { AppMenu, AppRole } from "@/lib/api";
import type { Privilege } from "@/hooks/usePrivileges";

interface RoleAccessPanelProps {
  role: AppRole;
  allPrivileges: Privilege[];
  privilegesLoading: boolean;
  allMenus: AppMenu[];
  menusLoading: boolean;
  accessPending: boolean;
  onAssignPrivileges: (privilegeIds: string[]) => void | Promise<unknown>;
  onRemovePrivilege: (privilegeId: string) => void | Promise<unknown>;
  onAssignMenus: (menuIds: string[]) => void | Promise<unknown>;
  onRemoveMenu: (menuId: string) => void | Promise<unknown>;
}

export function RoleAccessPanel({
  role,
  allPrivileges,
  privilegesLoading,
  allMenus,
  menusLoading,
  accessPending,
  onAssignPrivileges,
  onRemovePrivilege,
  onAssignMenus,
  onRemoveMenu,
}: RoleAccessPanelProps) {
  const privilegeCount = role.privileges?.length ?? 0;
  const menuCount = role.roleMenus?.length ?? 0;

  return (
    <Tabs defaultValue="privileges" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="privileges" className="gap-2">
          <Shield className="h-4 w-4" />
          Privileges
          <span className="tabular-nums text-muted-foreground">
            ({privilegeCount})
          </span>
        </TabsTrigger>
        <TabsTrigger value="menus" className="gap-2">
          <LayoutList className="h-4 w-4" />
          Menus
          <span className="tabular-nums text-muted-foreground">
            ({menuCount})
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="privileges" className="mt-4">
        <RolePrivilegesPanel
          role={role}
          allPrivileges={allPrivileges}
          privilegesLoading={privilegesLoading}
          accessPending={accessPending}
          onAssign={onAssignPrivileges}
          onRemove={onRemovePrivilege}
        />
      </TabsContent>
      <TabsContent value="menus" className="mt-4">
        <RoleMenusPanel
          role={role}
          allMenus={allMenus}
          menusLoading={menusLoading}
          accessPending={accessPending}
          onAssign={onAssignMenus}
          onRemove={onRemoveMenu}
        />
      </TabsContent>
    </Tabs>
  );
}
