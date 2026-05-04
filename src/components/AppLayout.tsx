import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

function MobileSidebarTrigger() {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden mr-2 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition"
      title={t("sidebar.openMenu")}
    >
      <Heart className="w-5 h-5 text-primary fill-primary/40" strokeWidth={1.5} />
    </button>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { t, i18n } = useTranslation();

  function toggleLang() {
    const next = i18n.language === "pt" ? "en" : "pt";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Heart className="w-10 h-10 text-primary animate-heart-beat fill-primary/30" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 border-b border-border/60 bg-background/70 backdrop-blur-sm sticky top-0 z-10">
            <MobileSidebarTrigger />
            <span className="font-script text-primary text-2xl">{t("layout.tagline")}</span>
            <div className="flex-1" />
            <button
              onClick={toggleLang}
              title={t("sidebar.langSwitch")}
              className="flex items-center px-2.5 py-1.5 rounded-full hover:bg-muted transition"
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
            </button>
          </header>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 p-4 sm:p-6 lg:p-8"
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('input, textarea, button, a, select, [role="button"]')) {
                (document.activeElement as HTMLElement)?.blur();
                window.getSelection()?.removeAllRanges();
              }
            }}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}
