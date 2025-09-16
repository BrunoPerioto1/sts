import { BarChart3, Target, Building2, User, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar 
} from "@/components/ui/sidebar";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/dashboard" },
  { id: "apostas", label: "Apostas", icon: Target, path: "/nova-aposta" },
  { id: "casas", label: "Casas de Apostas", icon: Building2, path: "/casas" },
  { id: "perfil", label: "Perfil", icon: User, path: "/perfil" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  return (
    <Sidebar 
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-[#070750] border-r border-[#090960] h-screen`}
      collapsible="icon"
    >
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="p-6">
            {!collapsed && (
              <h2 className="text-lg font-bold text-white">SportsBet Manager</h2>
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          end
                          className={({ isActive }) =>
                            `flex items-center gap-4 rounded-lg px-6 py-5 transition-colors ${
                              isActive
                                ? "bg-[#0A0A7A] text-white font-medium"
                                : "text-white hover:bg-[#0A0A7A]/50"
                            }`
                          }
                        >
                          <Icon className="h-7 w-7" />
                          {!collapsed && <span className="text-lg">{item.label}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <SidebarMenu className="p-4">
          <SidebarMenuItem className="mt-auto border-t border-sidebar-subtle-border pt-4">
            <SidebarMenuButton asChild>
              <NavLink
                to="/logout"
                end
                className="flex items-center gap-4 rounded-lg px-6 py-5 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-7 w-7" />
                {!collapsed && <span className="text-lg">Sair</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}