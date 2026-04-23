import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, CalendarHeart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO, differenceInDays, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRow {
  id: string;
  title: string;
  description: string | null;
  date: string;
}

export default function Datas() {
  const { user } = useAuth();
  const [dates, setDates] = useState<DateRow[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");

  const load = async () => {
    const { data } = await supabase.from("important_dates").select("*");
    if (!data) return;
    const today = new Date();
    const sorted = [...data].sort((a: any, b: any) => {
      const an = nextOccurrence(a.date, today);
      const bn = nextOccurrence(b.date, today);
      return an.getTime() - bn.getTime();
    });
    setDates(sorted as DateRow[]);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !date) return;
    await supabase.from("important_dates").insert({
      created_by: user.id, title, description: desc || null, date,
    });
    setTitle(""); setDesc(""); setDate(""); setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("important_dates").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Datas Importantes"
        subtitle="memórias do nosso tempo"
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Nova data</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display text-2xl">Adicionar data</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <Input placeholder="Título (ex: Aniversário do Marcelo)" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                <Textarea placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
                <Button type="submit" className="w-full">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {dates.length === 0 ? (
        <p className="font-script text-2xl text-center text-muted-foreground py-12">
          nenhuma data marcada ainda...
        </p>
      ) : (
        <div className="space-y-3">
          {dates.map((d, i) => {
            const today = new Date();
            const next = nextOccurrence(d.date, today);
            const days = differenceInDays(next, today);
            const soon = days <= 1;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`paper-card p-5 flex items-center gap-4 group ${soon ? "border-l-4 border-l-primary" : ""}`}
              >
                <div className="text-center bg-primary/10 rounded-sm p-3 min-w-[70px]">
                  <p className="font-display text-2xl text-primary leading-none">
                    {format(parseISO(d.date), "dd")}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-primary/80 mt-1">
                    {format(parseISO(d.date), "MMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-xl">{d.title}</h3>
                  {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                  <p className="text-xs text-primary mt-1 font-medium">
                    {isToday(next) ? "❤ é HOJE!" : isTomorrow(next) ? "❤ é amanhã!" : `em ${days} dias`}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(d.id)} className="opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function nextOccurrence(dateStr: string, from: Date) {
  const d = parseISO(dateStr);
  const next = new Date(from.getFullYear(), d.getMonth(), d.getDate());
  if (next < new Date(from.getFullYear(), from.getMonth(), from.getDate())) {
    next.setFullYear(from.getFullYear() + 1);
  }
  return next;
}
