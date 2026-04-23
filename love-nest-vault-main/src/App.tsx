import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Fotos from "./pages/Fotos";
import Cartinhas from "./pages/Cartinhas";
import Recados from "./pages/Recados";
import Lugares from "./pages/Lugares";
import Datas from "./pages/Datas";
import Sobre from "./pages/Sobre";
import Filmes from "./pages/Filmes";
import Sugestoes from "./pages/Sugestoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => <AppLayout>{children}</AppLayout>;

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<Protected><Home /></Protected>} />
            <Route path="/fotos" element={<Protected><Fotos /></Protected>} />
            <Route path="/cartinhas" element={<Protected><Cartinhas /></Protected>} />
            <Route path="/recados" element={<Protected><Recados /></Protected>} />
            <Route path="/lugares" element={<Protected><Lugares /></Protected>} />
            <Route path="/datas" element={<Protected><Datas /></Protected>} />
            <Route path="/sobre" element={<Protected><Sobre /></Protected>} />
            <Route path="/filmes" element={<Protected><Filmes /></Protected>} />
            <Route path="/sugestoes" element={<Protected><Sugestoes /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
