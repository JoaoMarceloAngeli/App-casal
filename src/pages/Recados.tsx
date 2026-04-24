import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface Msg {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
interface ProfileLite { id: string; display_name: string; avatar_url: string | null; }

export default function Recados() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const dateLocale = i18n.language === "en" ? enUS : ptBR;

  const load = async () => {
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase.from("messages").select("*").order("created_at"),
      supabase.from("profiles").select("id, display_name, avatar_url"),
    ]);
    if (m) setMsgs(m as Msg[]);
    if (p) setProfiles(Object.fromEntries(p.map((x: any) => [x.id, x])));
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const content = text;
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, content });
  };

  const remove = async (id: string) => {
    await supabase.from("messages").delete().eq("id", id);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <PageHeader title={t("messages.title")} subtitle={t("messages.subtitle")} />

      <div className="paper-card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {msgs.length === 0 && (
            <p className="font-script text-2xl text-center text-muted-foreground mt-10">
              {t("messages.empty")}
            </p>
          )}
          <AnimatePresence>
            {msgs.map((m) => {
              const mine = m.sender_id === user?.id;
              const sender = profiles[m.sender_id];
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] group ${mine ? "items-end" : "items-start"} flex flex-col`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-secondary-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1 text-xs text-muted-foreground">
                      <span className="font-script text-sm">{sender?.display_name?.split(" ")[0] ?? "..."}</span>
                      <span>·</span>
                      <span>{format(new Date(m.created_at), "d MMM, HH:mm", { locale: dateLocale })}</span>
                      {mine && (
                        <button
                          onClick={() => remove(m.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="border-t border-border/60 p-3 flex gap-2 bg-background/50">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("messages.placeholder")}
            className="bg-background"
          />
          <Button type="submit" size="icon" disabled={!text.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
