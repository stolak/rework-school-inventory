import { useState } from "react"
import { 
  Package, 
  Users, 
  BookOpen, 
  ShoppingCart, 
  ShoppingBag,
  BarChart3, 
  Settings,
  Home,
  Package2,
  GraduationCap,
  FileText,
  ClipboardList,
  Tag,
  Layers,
  Ruler,
  UserCheck,
  FileBarChart,
  BarChart,
  Gift,
  FolderKanban,
  PackageMinus,
  Store,
  ArrowLeftRight,
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Purchases", url: "/purchases", icon: ShoppingCart },
  { title: "Donations", url: "/donations", icon: Gift },
  { title: "Project disbursement", url: "/project-disbursement", icon: PackageMinus },
  { title: "Sales", url: "/sales", icon: ShoppingBag },
  { title: "Suppliers", url: "/suppliers", icon: Users },
  { title: "Categories", url: "/categories", icon: Package2 },
  { title: "Sub-Categories", url: "/sub-categories", icon: Layers },
  { title: "Brands", url: "/brands", icon: Tag },
  { title: "Units", url: "/uoms", icon: Ruler },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Store setup", url: "/store-setup", icon: Store },
  { title: "Store transfers", url: "/store-transfers", icon: ArrowLeftRight },
]

const schoolMenuItems = [
  { title: "Classes", url: "/classes", icon: GraduationCap },
  { title: "Sub Classes", url: "/sub-classes", icon: Layers },
  { title: "Students", url: "/students", icon: Users },
  { title: "Sessions", url: "/sessions", icon: BookOpen },
  { title: "Terms", url: "/terms", icon: BookOpen },
  { title: "Class Entitlements", url: "/class-entitlements", icon: ClipboardList },
  { title: "Class Distributions", url: "/class-distributions", icon: Package },
  { title: "Student Collections", url: "/student-collections", icon: UserCheck },
  { title: "Staff Collections", url: "/staff-collections", icon: UserCheck },
]

const reportsMenuItems = [
  { title: "Student collections summary", url: "/reports/student-inventory", icon: FileBarChart },
  { title: "Inventory Collections Report", url: "/reports/inventory-collections", icon: BarChart },
  { title: "Distribution & Collection Report", url: "/reports/distribution-collection", icon: BarChart3 },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-foreground"

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-subtle">
        <div className="p-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">SchoolStore</h2>
                <p className="text-xs text-muted-foreground">Inventory Manager</p>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>School Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {schoolMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportsMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}