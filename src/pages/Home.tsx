import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Camera, MessageCircle, Mail, MapPin, CalendarHeart, User, Film, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";

const cards = [
  { url: "/fotos", icon: Camera, title: "Fotos", note: "nossos momentos" },
  { url: "/recados", icon: MessageCircle, title: "Recados", note: "palavras pra você" },
  { url: "/cartinhas", icon: Mail, title: "Cartinhas", note: "cartas de amor" },
  { url: "/lugares", icon: MapPin, title: "Lugares", note: "pra explorar juntos" },
  { url: "/datas", icon: CalendarHeart, title: "Datas", note: "nossas memórias" },
  { url: "/sobre", icon: User, title: "Sobre nós", note: "quem somos" },
  { url: "/filmes", icon: Film, title: "Filmes", note: "nossa lista" },
  { url: "/sugestoes", icon: Lightbulb, title: "Sugestões", note: "ideias livres" },
];

export default function Home() {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<{ title: string; when: string; days: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("important_dates").select("*");
      if (!data) return;
      const today = new Date();
      const upcoming = data
        .map((d) => {
          const dt = parseISO(d.date as string);
          const next = new Date(today.getFullYear(), dt.getMonth(), dt.getDate());
          if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            next.setFullYear(today.getFullYear() + 1);
          }
          const days = differenceInDays(next, today);
          let when = `em ${days} dias`;
          if (isToday(next)) when = "é HOJE!";
          else if (isTomorrow(next)) when = "é AMANHÃ ❤";
          return { title: d.title as string, when, days, next };
        })
        .sort((a, b) => a.days - b.days)
        .slice(0, 3);
      setReminders(upcoming);
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={`${greeting}, ${profile?.display_name?.split(" ")[0] ?? "amor"}`}
        subtitle="que bom que você voltou ❤"
      />

      {reminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="paper-card p-5 mb-8 border-l-4 border-l-primary"
        >
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-primary fill-primary/40 mt-1 shrink-0" />
            <div className="flex-1">
              <p className="font-display text-xl mb-2">Lembretes de datas especiais</p>
              <ul className="space-y-1.5">
                {reminders.map((r, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{r.title}</span>
                    <span className="text-muted-foreground"> — {r.when}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.url}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={c.url}
              className="paper-card group block p-6 h-full hover:-translate-y-1 transition-transform duration-300"
            >
              <c.icon className="w-7 h-7 text-primary mb-3 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
              <h3 className="font-display text-2xl">{c.title}</h3>
              <p className="font-script text-lg text-muted-foreground">{c.note}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="text-center font-script text-2xl text-primary/70 mt-12">
        feito com amor, só pra nós dois
      </p>
    </div>
  );
}
