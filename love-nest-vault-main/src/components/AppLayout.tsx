import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

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
          <header className="h-12 flex items-center border-b border-border/60 bg-background/70 backdrop-blur-sm sticky top-0 z-10">
            <SidebarTrigger className="ml-2" />
            <div className="flex-1" />
          </header>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 p-4 sm:p-6 lg:p-8"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </SidebarProvider>
  );
}
