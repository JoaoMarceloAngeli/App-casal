import { Camera, MessageCircle, Mail, MapPin, CalendarHeart, User, Film, Lightbulb, Heart, LogOut } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Início", url: "/", icon: Heart },
  { title: "Fotos", url: "/fotos", icon: Camera },
  { title: "Recados", url: "/recados", icon: MessageCircle },
  { title: "Cartinhas", url: "/cartinhas", icon: Mail },
  { title: "Lugares", url: "/lugares", icon: MapPin },
  { title: "Datas", url: "/datas", icon: CalendarHeart },
  { title: "Sobre nós", url: "/sobre", icon: User },
  { title: "Filmes", url: "/filmes", icon: Film },
  { title: "Sugestões", url: "/sugestoes", icon: Lightbulb },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, signOut } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-primary fill-primary/40" strokeWidth={1.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg leading-tight">Nosso Cantinho</span>
              <span className="font-script text-sm text-primary leading-tight">João & Mariana</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display tracking-wider">Nosso mundo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end>
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span className="font-display text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className={`flex items-center gap-2 p-2 ${collapsed ? "justify-center" : ""}`}>
          <Avatar className="w-8 h-8 ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
              {profile?.display_name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">logado como</p>
                <p className="text-sm font-display truncate">{profile?.display_name}</p>
              </div>
              <button onClick={signOut} title="Sair" className="p-1.5 rounded hover:bg-sidebar-accent">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
