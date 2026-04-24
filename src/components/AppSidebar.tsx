import { Camera, MessageCircle, Mail, MapPin, CalendarHeart, User, Film, Lightbulb, Heart, LogOut, Languages } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";

export function AppSidebar() {
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { profile, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const collapsed = state === "collapsed";
  const location = useLocation();

  function handleNavClick() {
    if (isMobile) setOpenMobile(false);
  }

  function toggleLang() {
    const next = i18n.language === "pt" ? "en" : "pt";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  }

  const items = [
    { title: t("nav.home"), url: "/", icon: Heart },
    { title: t("nav.photos"), url: "/fotos", icon: Camera },
    { title: t("nav.messages"), url: "/recados", icon: MessageCircle },
    { title: t("nav.letters"), url: "/cartinhas", icon: Mail },
    { title: t("nav.places"), url: "/lugares", icon: MapPin },
    { title: t("nav.dates"), url: "/datas", icon: CalendarHeart },
    { title: t("nav.about"), url: "/sobre", icon: User },
    { title: t("nav.movies"), url: "/filmes", icon: Film },
    { title: t("nav.suggestions"), url: "/sugestoes", icon: Lightbulb },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={`flex items-center gap-3 p-2 ${collapsed ? "justify-center" : ""}`}>
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hover:bg-primary/20 transition"
            title={collapsed ? t("sidebar.openMenu") : t("sidebar.closeMenu")}
          >
            <Heart className="w-5 h-5 text-primary fill-primary/40" strokeWidth={1.5} />
          </button>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-lg leading-tight">{t("sidebar.title")}</span>
              <span className="font-script text-sm text-primary leading-tight">{t("sidebar.subtitle")}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display tracking-wider">{t("sidebar.world")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end onClick={handleNavClick}>
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
        <div className={`flex items-center gap-2 p-2 ${collapsed ? "justify-center flex-col" : ""}`}>
          <Avatar className="w-8 h-8 ring-2 ring-primary/30">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
              {profile?.display_name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{t("sidebar.loggedAs")}</p>
                <p className="text-sm font-display truncate">{profile?.display_name}</p>
              </div>
              <button
                onClick={toggleLang}
                title={t("sidebar.langSwitch")}
                className="p-1.5 rounded hover:bg-sidebar-accent"
              >
                <Languages className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={signOut} title={t("sidebar.logout")} className="p-1.5 rounded hover:bg-sidebar-accent">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={toggleLang}
              title={t("sidebar.langSwitch")}
              className="p-1.5 rounded hover:bg-sidebar-accent"
            >
              <Languages className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
