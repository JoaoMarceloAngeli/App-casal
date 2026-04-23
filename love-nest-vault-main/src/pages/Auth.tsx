import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import vintageBg from "@/assets/vintage-bg.jpg";

const ALLOWED = [
  { name: "João Marcelo", email: "joao@nosso.amor" },
  { name: "Mariana", email: "mariana@nosso.amor" },
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selected, setSelected] = useState(ALLOWED[0]);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    // Try sign in first
    let { error } = await supabase.auth.signInWithPassword({ email: selected.email, password });
    if (error && error.message.toLowerCase().includes("invalid")) {
      // First-time setup: create the account
      const { error: signUpError } = await supabase.auth.signUp({
        email: selected.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: selected.name },
        },
      });
      if (signUpError) {
        toast.error(signUpError.message);
        setBusy(false);
        return;
      }
      // Sign in after signup
      const r = await supabase.auth.signInWithPassword({ email: selected.email, password });
      error = r.error;
    }
    if (error) {
      toast.error("Senha incorreta 💔");
      setBusy(false);
      return;
    }
    toast.success(`Bem-vindo(a), ${selected.name} ❤`);
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(hsl(36 33% 95% / 0.85), hsl(30 30% 88% / 0.85)), url(${vintageBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="paper-card w-full max-w-md p-8 sm:p-10 relative"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="inline-block"
          >
            <Heart className="w-10 h-10 text-primary fill-primary/30 mx-auto mb-3" strokeWidth={1.5} />
          </motion.div>
          <h1 className="font-display text-4xl text-foreground">Nosso Cantinho</h1>
          <p className="font-script text-2xl text-primary mt-1">João Marcelo & Mariana</p>
          <div className="ink-divider mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-sm uppercase tracking-widest text-muted-foreground">Quem é você?</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ALLOWED.map((u) => (
                <button
                  type="button"
                  key={u.email}
                  onClick={() => setSelected(u)}
                  className={`p-3 rounded-sm border-2 transition-all font-display text-lg ${
                    selected.email === u.email
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background/50 text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-sm uppercase tracking-widest text-muted-foreground">
              Senha secreta
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              className="mt-2 bg-background/60 border-border/80"
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground mt-2 italic">
              Primeiro acesso? A senha que digitar agora será salva como sua senha.
            </p>
          </div>

          <Button type="submit" disabled={busy} className="w-full text-base h-11">
            {busy ? "Entrando..." : "Entrar no nosso mundo ❤"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
