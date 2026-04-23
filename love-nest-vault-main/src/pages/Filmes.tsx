import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Film, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Movie {
  id: string;
  title: string;
  notes: string | null;
  status: "quero_ver" | "ja_vimos";
}

export default function Filmes() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
    if (data) setMovies(data as Movie[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    await supabase.from("movies").insert({ created_by: user.id, title, notes: notes || null });
    setTitle(""); setNotes(""); setOpen(false);
    load();
  };

  const toggle = async (m: Movie) => {
    const next = m.status === "quero_ver" ? "ja_vimos" : "quero_ver";
    await supabase.from("movies").update({ status: next }).eq("id", m.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("movies").delete().eq("id", id);
    load();
  };

  const filter = (s: Movie["status"]) => movies.filter((m) => m.status === s);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Filmes & Séries"
        subtitle="nossa sessão a dois"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display text-2xl">Adicionar filme/série</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Textarea placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="quero_ver">
        <TabsList className="mb-6">
          <TabsTrigger value="quero_ver">Queremos ver ({filter("quero_ver").length})</TabsTrigger>
          <TabsTrigger value="ja_vimos">Já vimos ({filter("ja_vimos").length})</TabsTrigger>
        </TabsList>

        {(["quero_ver", "ja_vimos"] as const).map((s) => (
          <TabsContent key={s} value={s}>
            {filter(s).length === 0 ? (
              <p className="font-script text-2xl text-center text-muted-foreground py-12">
                nada por aqui ainda...
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filter(s).map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="paper-card p-4 flex items-start gap-3 group"
                  >
                    <Film className="w-5 h-5 text-primary mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg">{m.title}</h3>
                      {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                      <div className="flex gap-2 mt-2 opacity-70 group-hover:opacity-100 transition">
                        <Button size="sm" variant="outline" onClick={() => toggle(m)}>
                          <Check className="w-3 h-3 mr-1" />
                          {s === "quero_ver" ? "Já vimos" : "Voltar"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
