import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Place {
  id: string;
  name: string;
  description: string | null;
  status: "quero_ir" | "ja_fomos";
}

export default function Lugares() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const load = async () => {
    const { data } = await supabase.from("places").select("*").order("created_at", { ascending: false });
    if (data) setPlaces(data as Place[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    await supabase.from("places").insert({ created_by: user.id, name, description: desc || null });
    setName(""); setDesc(""); setOpen(false);
    load();
  };

  const toggle = async (p: Place) => {
    const next = p.status === "quero_ir" ? "ja_fomos" : "quero_ir";
    await supabase.from("places").update({ status: next }).eq("id", p.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("places").delete().eq("id", id);
    load();
  };

  const filter = (s: Place["status"]) => places.filter((p) => p.status === s);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Lugares pra Ir"
        subtitle="aventuras a dois"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Novo lugar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display text-2xl">Adicionar um lugar</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <Input placeholder="Nome do lugar" value={name} onChange={(e) => setName(e.target.value)} required />
                <Textarea placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="quero_ir">
        <TabsList className="mb-6">
          <TabsTrigger value="quero_ir">Queremos ir ({filter("quero_ir").length})</TabsTrigger>
          <TabsTrigger value="ja_fomos">Já fomos ({filter("ja_fomos").length})</TabsTrigger>
        </TabsList>

        {(["quero_ir", "ja_fomos"] as const).map((s) => (
          <TabsContent key={s} value={s}>
            {filter(s).length === 0 ? (
              <p className="font-script text-2xl text-center text-muted-foreground py-12">
                {s === "quero_ir" ? "nenhum sonho de viagem ainda..." : "nenhuma aventura registrada..."}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {filter(s).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="paper-card p-5 group"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl">{p.name}</h3>
                        {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                        <div className="flex gap-2 mt-3 opacity-70 group-hover:opacity-100 transition">
                          <Button size="sm" variant="outline" onClick={() => toggle(p)}>
                            <Check className="w-3 h-3 mr-1" />
                            {p.status === "quero_ir" ? "Marcar como visitado" : "Voltar pra lista"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
