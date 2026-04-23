import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  likes: string | null;
  preferences: string | null;
  important_info: string | null;
}

const FIELDS = ["bio", "likes", "preferences", "important_info"] as const;
type FieldKey = typeof FIELDS[number];

const defaultLabels: Record<FieldKey, string> = {
  bio: "Sobre",
  likes: "Gostos",
  preferences: "Preferências",
  important_info: "Coisas importantes",
};

const labelsKey = (uid: string) => `sobre-labels-${uid}`;
const titleKey = "sobre-page-title";
const subtitleKey = "sobre-page-subtitle";

export default function Sobre() {
  const { user, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [labelsByProfile, setLabelsByProfile] = useState<Record<string, Record<FieldKey, string>>>({});
  const [editingLabel, setEditingLabel] = useState<{ pid: string; key: FieldKey } | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  const [pageTitle, setPageTitle] = useState(localStorage.getItem(titleKey) || "Sobre Nós");
  const [pageSubtitle, setPageSubtitle] = useState(localStorage.getItem(subtitleKey) || "quem somos, o que amamos");
  const [editingHeader, setEditingHeader] = useState(false);
  const [titleDraft, setTitleDraft] = useState(pageTitle);
  const [subtitleDraft, setSubtitleDraft] = useState(pageSubtitle);

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("display_name");
    if (data) {
      setProfiles(data as Profile[]);
      const map: Record<string, Record<FieldKey, string>> = {};
      (data as Profile[]).forEach((p) => {
        const stored = localStorage.getItem(labelsKey(p.id));
        map[p.id] = stored ? { ...defaultLabels, ...JSON.parse(stored) } : { ...defaultLabels };
      });
      setLabelsByProfile(map);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from("profiles").update({
      bio: editing.bio,
      likes: editing.likes,
      preferences: editing.preferences,
      important_info: editing.important_info,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Salvo ❤");
    setEditing(null);
    refreshProfile();
    load();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>, profileId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${profileId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profileId);
    toast.success("Foto atualizada ❤");
    refreshProfile();
    load();
  };

  const saveLabel = (pid: string, key: FieldKey) => {
    const next = { ...(labelsByProfile[pid] || defaultLabels), [key]: labelDraft.trim() || defaultLabels[key] };
    const updated = { ...labelsByProfile, [pid]: next };
    setLabelsByProfile(updated);
    localStorage.setItem(labelsKey(pid), JSON.stringify(next));
    setEditingLabel(null);
    toast.success("Tópico renomeado ❤");
  };

  const saveHeader = () => {
    const t = titleDraft.trim() || "Sobre Nós";
    const s = subtitleDraft.trim() || "quem somos, o que amamos";
    setPageTitle(t);
    setPageSubtitle(s);
    localStorage.setItem(titleKey, t);
    localStorage.setItem(subtitleKey, s);
    setEditingHeader(false);
    toast.success("Título atualizado ❤");
  };

  return (
    <div className="max-w-5xl mx-auto">
      {editingHeader ? (
        <div className="mb-8 space-y-2 paper-card p-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Título</Label>
          <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Subtítulo</Label>
          <Input value={subtitleDraft} onChange={(e) => setSubtitleDraft(e.target.value)} />
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={saveHeader}><Check className="w-4 h-4 mr-1" /> Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => { setTitleDraft(pageTitle); setSubtitleDraft(pageSubtitle); setEditingHeader(false); }}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <PageHeader title={pageTitle} subtitle={pageSubtitle} />
          <button
            onClick={() => setEditingHeader(true)}
            className="absolute top-2 right-2 p-1.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition"
            title="Editar título"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {profiles.map((p, i) => {
          const isMine = p.id === user?.id;
          const data = editing?.id === p.id ? editing : p;
          const labels = labelsByProfile[p.id] || defaultLabels;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="paper-card p-6"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-display text-2xl">
                      {p.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isMine && (
                    <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:scale-110 transition">
                      <Upload className="w-3 h-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e, p.id)} />
                    </label>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-3xl">{p.display_name}</h2>
                  {isMine && <p className="font-script text-primary text-lg">é você ❤</p>}
                </div>
              </div>

              {isMine && editing?.id === p.id ? (
                <div className="space-y-3">
                  {FIELDS.map((key) => (
                    <div key={key}>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        {labels[key]}
                      </Label>
                      <Textarea
                        value={(data as any)[key] ?? ""}
                        onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                        rows={2}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={save} className="flex-1"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {FIELDS.map((key) => (
                    <div key={key}>
                      {editingLabel?.pid === p.id && editingLabel.key === key ? (
                        <div className="flex gap-1 mb-1">
                          <Input
                            autoFocus
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveLabel(p.id, key)}
                            className="h-7 text-xs uppercase tracking-wider"
                          />
                          <button onClick={() => saveLabel(p.id, key)} className="p-1 rounded hover:bg-muted">
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button onClick={() => setEditingLabel(null)} className="p-1 rounded hover:bg-muted">
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mb-1 group/lbl">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{labels[key]}</p>
                          {isMine && (
                            <button
                              onClick={() => { setEditingLabel({ pid: p.id, key }); setLabelDraft(labels[key]); }}
                              className="p-0.5 rounded hover:bg-muted opacity-0 group-hover/lbl:opacity-100 transition"
                              title="Renomear tópico"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-foreground/90">
                        {(p as any)[key] || <span className="italic text-muted-foreground">— ainda vazio —</span>}
                      </p>
                    </div>
                  ))}
                  {isMine && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing(p)}>
                      Editar minhas info
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
