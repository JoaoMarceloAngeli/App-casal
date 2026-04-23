import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Lightbulb, Trash2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";

interface Suggestion {
  id: string;
  content: string;
  done: boolean;
  created_by: string;
}

export default function Sugestoes() {
  const { user } = useAuth();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const { data } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as Suggestion[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    await supabase.from("suggestions").insert({ created_by: user.id, content: text });
    setText("");
    load();
  };

  const toggle = async (s: Suggestion) => {
    await supabase.from("suggestions").update({ done: !s.done }).eq("id", s.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("suggestions").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Sugestões" subtitle="ideias soltas pra nós" />

      <form onSubmit={add} className="paper-card p-4 mb-6 flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="uma ideia, um sonho, uma vontade..."
          rows={2}
          className="resize-none"
        />
        <Button type="submit" disabled={!text.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="font-script text-2xl text-center text-muted-foreground py-12">
          nenhuma ideia por aqui ainda...
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.03 }}
                className="paper-card p-4 flex items-start gap-3 group"
              >
                <Checkbox checked={s.done} onCheckedChange={() => toggle(s)} className="mt-1" />
                <Lightbulb className={`w-4 h-4 mt-1 shrink-0 ${s.done ? "text-muted-foreground" : "text-gold"}`} />
                <p className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>
                  {s.content}
                </p>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
