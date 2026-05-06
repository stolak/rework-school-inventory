import { useEffect, useState } from "react"
import {
  Package,
  Users,
  BookOpen,
  ShoppingCart,
  ShoppingBag,
  Home,
  Package2,
  GraduationCap,
  Tag,
  Layers,
  Ruler,
  UserCheck,
  FileBarChart,
  BarChart,
  Gift,
  FolderKanban,
  ListTree,
  PackageMinus,
  Store,
  ArrowLeftRight,
  Scale,
  History,
  Landmark,
  Receipt,
  ChevronRight,
  LayoutDashboard,
  School,
  PieChart,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type NavMenuItem = {
  title: string
  url: string
  icon: LucideIcon
}

type SidebarNavSection = {
  title: string
  tooltip: string
  sectionIcon: LucideIcon
  items: NavMenuItem[]
}

const sidebarNavSections: SidebarNavSection[] = [
  {
    title: "Main",
    tooltip: "Main",
    sectionIcon: LayoutDashboard,
    items: [
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
    ],
  },
  {
    title: "School Management",
    tooltip: "School Management",
    sectionIcon: School,
    items: [
      { title: "Classes", url: "/classes", icon: GraduationCap },
      { title: "Sub Classes", url: "/sub-classes", icon: Layers },
      { title: "Students", url: "/students", icon: Users },
      { title: "Sessions", url: "/sessions", icon: BookOpen },
      { title: "Terms", url: "/terms", icon: BookOpen },
      { title: "Student Collections", url: "/student-collections", icon: UserCheck },
      { title: "Staff Collections", url: "/staff-collections", icon: UserCheck },
    ],
  },
  {
    title: "Analytics",
    tooltip: "Analytics",
    sectionIcon: PieChart,
    items: [
      { title: "Student collections summary", url: "/reports/student-inventory", icon: FileBarChart },
      { title: "Inventory Collections Report", url: "/reports/inventory-collections", icon: BarChart },
      { title: "Item balance report", url: "/reports/item-balances", icon: Scale },
      { title: "Item transaction log", url: "/reports/item-transaction-log", icon: History },
    ],
  },
  {
    title: "Accounting",
    tooltip: "Accounting",
    sectionIcon: Landmark,
    items: [
      { title: "Account subheads", url: "/account-subheads", icon: ListTree },
      { title: "Account chart setup", url: "/account-chart-setup", icon: Landmark },
      { title: "Billing items", url: "/billing-items", icon: Receipt },
      { title: "Concession discounts", url: "/concession-discounts", icon: Gift },
    ],
  },
]

function pathMatches(currentPath: string, url: string) {
  if (url === "/") return currentPath === "/"
  return currentPath === url || currentPath.startsWith(`${url}/`)
}

function NavCollapsibleSection({
  title,
  sectionIcon: SectionIcon,
  tooltip,
  items,
}: {
  title: string
  sectionIcon: LucideIcon
  tooltip: string
  items: NavMenuItem[]
}) {
  const location = useLocation()
  const currentPath = location.pathname
  const { state } = useSidebar()
  const isSidebarCollapsed = state === "collapsed"

  const hasActiveChild = items.some((item) => pathMatches(currentPath, item.url))
  const [open, setOpen] = useState(hasActiveChild)

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={isSidebarCollapsed ? tooltip : undefined}>
            <SectionIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{title}</span>
            <ChevronRight
              className={cn(
                "ml-auto h-4 w-4 shrink-0 transition-transform duration-200",
                "group-data-[state=open]/collapsible:rotate-90",
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => (
              <SidebarMenuSubItem key={item.title}>
                <SidebarMenuSubButton asChild isActive={pathMatches(currentPath, item.url)}>
                  <NavLink to={item.url} end={item.url === "/"}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
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

        {sidebarNavSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                <NavCollapsibleSection {...section} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
