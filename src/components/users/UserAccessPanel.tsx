import { Shield, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPrivilegesPanel } from "@/components/users/UserPrivilegesPanel";
import { UserRolePanel } from "@/components/users/UserRolePanel";
import type { AppRole } from "@/lib/api";
import type { ManagedUser } from "@/hooks/useUserManagement";
import type { Privilege } from "@/hooks/usePrivileges";

interface UserAccessPanelProps {
  user: ManagedUser;
  allPrivileges: Privilege[];
  privilegesLoading: boolean;
  allRoles: AppRole[];
  rolesLoading: boolean;
  accessPending: boolean;
  onAssignPrivileges: (privilegeIds: string[]) => void | Promise<unknown>;
  onRemovePrivilege: (privilegeId: string) => void | Promise<unknown>;
  onAssignRole: (roleId: string) => void | Promise<unknown>;
  onRemoveRole: (roleId: string) => void | Promise<unknown>;
}

export function UserAccessPanel({
  user,
  allPrivileges,
  privilegesLoading,
  allRoles,
  rolesLoading,
  accessPending,
  onAssignPrivileges,
  onRemovePrivilege,
  onAssignRole,
  onRemoveRole,
}: UserAccessPanelProps) {
  const privilegeCount = user.privileges?.length ?? 0;
  const hasRole = Boolean(user.appRole ?? user.appRoles?.[0]);

  return (
    <Tabs defaultValue="role" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="role" className="gap-2">
          <UserCog className="h-4 w-4" />
          Role
          <span className="tabular-nums text-muted-foreground">
            ({hasRole ? 1 : 0})
          </span>
        </TabsTrigger>
        <TabsTrigger value="privileges" className="gap-2">
          <Shield className="h-4 w-4" />
          Privileges
          <span className="tabular-nums text-muted-foreground">
            ({privilegeCount})
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="role" className="mt-4">
        <UserRolePanel
          user={user}
          allRoles={allRoles}
          rolesLoading={rolesLoading}
          accessPending={accessPending}
          onAssign={onAssignRole}
          onRemove={onRemoveRole}
        />
      </TabsContent>
      <TabsContent value="privileges" className="mt-4">
        <UserPrivilegesPanel
          user={user}
          allPrivileges={allPrivileges}
          privilegesLoading={privilegesLoading}
          accessPending={accessPending}
          onAssign={onAssignPrivileges}
          onRemove={onRemovePrivilege}
        />
      </TabsContent>
    </Tabs>
  );
}
