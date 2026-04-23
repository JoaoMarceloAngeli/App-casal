import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Save, Upload, Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

interface ExtraTopic {
  id: string;
  label: string;
  content: string;
}

interface EditTopic {
  id: string;
  label: string;
  content: string;
  dbKey?: FieldKey;
}

const DB_FIELDS = ["bio", "likes", "preferences", "important_info"] as const;
type FieldKey = typeof DB_FIELDS[number];

const defaultLabels: Record<FieldKey, string> = {
  bio: "Sobre",
  likes: "Gostos",
  preferences: "Preferências",
  important_info: "Coisas importantes",
};

const labelsKey = (uid: string) => `sobre-labels-${uid}`;
const hiddenKey = (uid: string) => `sobre-hidden-${uid}`;
const extraKey = (uid: string) => `sobre-extra-${uid}`;

export default function Sobre() {
  const { user, refreshProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [editing, setEditing] = useState<Profile | null>(null);
  const [editTopics, setEditTopics] = useState<EditTopic[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraftEdit, setLabelDraftEdit] = useState("");

  const [labelsByProfile, setLabelsByProfile] = useState<Record<string, Record<FieldKey, string>>>({});
  const [hiddenByProfile, setHiddenByProfile] = useState<Record<string, Set<FieldKey>>>({});
  const [extraByProfile, setExtraByProfile] = useState<Record<string, ExtraTopic[]>>({});

  const [editingLabel, setEditingLabel] = useState<{ pid: string; key: FieldKey } | null>(null);
  const [labelDraft, setLabelDraft] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const myProfileId = user?.id ?? "";

  const load = async () => {
    const { data } = await supabase.from("profiles").select("*").order("display_name");
    if (data) {
      setProfiles(data as Profile[]);
      const labMap: Record<string, Record<FieldKey, string>> = {};
      const hidMap: Record<string, Set<FieldKey>> = {};
      const extMap: Record<string, ExtraTopic[]> = {};
      (data as Profile[]).forEach((p) => {
        const storedLab = localStorage.getItem(labelsKey(p.id));
        labMap[p.id] = storedLab ? { ...defaultLabels, ...JSON.parse(storedLab) } : { ...defaultLabels };
        const storedHid = localStorage.getItem(hiddenKey(p.id));
        hidMap[p.id] = storedHid ? new Set(JSON.parse(storedHid) as FieldKey[]) : new Set();
        const storedExt = localStorage.getItem(extraKey(p.id));
        extMap[p.id] = storedExt ? JSON.parse(storedExt) : [];
      });
      setLabelsByProfile(labMap);
      setHiddenByProfile(hidMap);
      setExtraByProfile(extMap);
    }
  };

  useEffect(() => { load(); }, []);

  const getActiveTopics = (p: Profile) => {
    const labels = labelsByProfile[p.id] || defaultLabels;
    const hidden = hiddenByProfile[p.id] || new Set<FieldKey>();
    const extras = extraByProfile[p.id] || [];
    return [
      ...DB_FIELDS.filter(key => !hidden.has(key)).map(key => ({
        id: key,
        label: labels[key],
        content: (p as any)[key] as string | null,
        isDb: true,
        dbKey: key as FieldKey,
      })),
      ...extras.map(t => ({ id: t.id, label: t.label, content: t.content, isDb: false, dbKey: undefined as FieldKey | undefined })),
    ];
  };

  const startEditing = (p: Profile) => {
    const labels = labelsByProfile[p.id] || defaultLabels;
    const hidden = hiddenByProfile[p.id] || new Set<FieldKey>();
    const extras = extraByProfile[p.id] || [];
    setEditing(p);
    setEditTopics([
      ...DB_FIELDS.filter(k => !hidden.has(k)).map(k => ({
        id: k,
        label: labels[k],
        content: (p as any)[k] ?? "",
        dbKey: k as FieldKey,
      })),
      ...extras.map(t => ({ id: t.id, label: t.label, content: t.content, dbKey: undefined })),
    ]);
  };

  const addTopic = () => {
    if (!editing) return;
    const usedDbKeys = new Set(editTopics.filter(t => t.dbKey).map(t => t.dbKey as FieldKey));
    const freeDbKey = DB_FIELDS.find(k => !usedDbKeys.has(k));
    if (freeDbKey) {
      const labels = labelsByProfile[editing.id] || defaultLabels;
      setEditTopics(prev => [...prev, {
        id: freeDbKey,
        label: labels[freeDbKey],
        content: (editing as any)[freeDbKey] ?? "",
        dbKey: freeDbKey,
      }]);
    } else {
      setEditTopics(prev => [...prev, {
        id: `extra-${Date.now()}`,
        label: "Novo tópico",
        content: "",
        dbKey: undefined,
      }]);
    }
  };

  const removeTopic = (id: string) => {
    setEditTopics(prev => prev.filter(t => t.id !== id));
  };

  const updateTopic = (id: string, field: "label" | "content", value: string) => {
    setEditTopics(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const save = async () => {
    if (!editing) return;
    const dbData: Record<FieldKey, string | null> = {
      bio: null, likes: null, preferences: null, important_info: null,
    };
    const newLabels: Record<FieldKey, string> = { ...defaultLabels };
    const newHidden = new Set<FieldKey>(DB_FIELDS);
    const newExtra: ExtraTopic[] = [];

    editTopics.forEach(t => {
      if (t.dbKey) {
        dbData[t.dbKey] = t.content || null;
        newLabels[t.dbKey] = t.label;
        newHidden.delete(t.dbKey);
      } else {
        newExtra.push({ id: t.id, label: t.label, content: t.content });
      }
    });

    const { error } = await supabase.from("profiles").update(dbData).eq("id", editing.id);
    if (error) return toast.error(error.message);

    localStorage.setItem(labelsKey(editing.id), JSON.stringify(newLabels));
    localStorage.setItem(hiddenKey(editing.id), JSON.stringify([...newHidden]));
    localStorage.setItem(extraKey(editing.id), JSON.stringify(newExtra));

    toast.success("Salvo ❤");
    setEditing(null);
    refreshProfile();
    load();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myProfileId) return;
    e.target.value = "";
    const ext = file.name.split(".").pop();
    const path = `${myProfileId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", myProfileId);
    toast.success("Foto atualizada ❤");
    refreshProfile();
    load();
  };

  const removeAvatar = async (profileId: string) => {
    await supabase.from("profiles").update({ avatar_url: null }).eq("id", profileId);
    toast.success("Foto removida");
    refreshProfile();
    load();
  };

  const saveLabel = (pid: string, key: FieldKey) => {
    const next = { ...(labelsByProfile[pid] || defaultLabels), [key]: labelDraft.trim() || defaultLabels[key] };
    setLabelsByProfile({ ...labelsByProfile, [pid]: next });
    localStorage.setItem(labelsKey(pid), JSON.stringify(next));
    setEditingLabel(null);
    toast.success("Tópico renomeado ❤");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Sobre Nós" subtitle="quem somos, o que amamos" />

      <div className="grid md:grid-cols-2 gap-6">
        {profiles.map((p, i) => {
          const isMine = p.id === user?.id;
          const activeTopics = getActiveTopics(p);
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
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={uploadAvatar}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full hover:scale-110 transition"
                            title="Editar foto"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-3.5 h-3.5 mr-2" /> Alterar foto
                          </DropdownMenuItem>
                          {p.avatar_url && (
                            <DropdownMenuItem
                              onClick={() => removeAvatar(p.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover foto
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-3xl">{p.display_name}</h2>
                  {isMine && <p className="font-script text-primary text-lg">é você ❤</p>}
                </div>
              </div>

              {isMine && editing?.id === p.id ? (
                <div className="space-y-3">
                  {editTopics.map((topic) => (
                    <div key={topic.id}>
                      <div className="flex items-center gap-1 mb-1">
                        {editingLabelId === topic.id ? (
                          <Input
                            autoFocus
                            value={labelDraftEdit}
                            onChange={(e) => setLabelDraftEdit(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateTopic(topic.id, "label", labelDraftEdit.trim() || topic.label);
                                setEditingLabelId(null);
                              }
                              if (e.key === "Escape") setEditingLabelId(null);
                            }}
                            onBlur={() => {
                              updateTopic(topic.id, "label", labelDraftEdit.trim() || topic.label);
                              setEditingLabelId(null);
                            }}
                            className="h-7 text-xs uppercase tracking-wider flex-1"
                          />
                        ) : (
                          <button
                            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 flex-1 text-left"
                            onClick={() => { setEditingLabelId(topic.id); setLabelDraftEdit(topic.label); }}
                            title="Clique para renomear"
                          >
                            {topic.label}
                            <Pencil className="w-3 h-3 opacity-40" />
                          </button>
                        )}
                        <button
                          onClick={() => removeTopic(topic.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                          title="Remover tópico"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <Textarea
                        value={topic.content}
                        onChange={(e) => updateTopic(topic.id, "content", e.target.value)}
                        rows={2}
                        placeholder={`Escreva sobre ${topic.label.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed"
                    onClick={addTopic}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Adicionar tópico
                  </Button>
                  <div className="flex gap-2">
                    <Button onClick={save} className="flex-1"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
                    <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {activeTopics.map((topic) => (
                    <div key={topic.id}>
                      {isMine && topic.isDb && editingLabel?.pid === p.id && editingLabel.key === topic.dbKey ? (
                        <div className="flex gap-1 mb-1">
                          <Input
                            autoFocus
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveLabel(p.id, topic.dbKey as FieldKey)}
                            className="h-7 text-xs uppercase tracking-wider"
                          />
                          <button onClick={() => saveLabel(p.id, topic.dbKey as FieldKey)} className="p-1 rounded hover:bg-muted">
                            <Check className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button onClick={() => setEditingLabel(null)} className="p-1 rounded hover:bg-muted">
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mb-1 group/lbl">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{topic.label}</p>
                          {isMine && topic.isDb && (
                            <button
                              onClick={() => { setEditingLabel({ pid: p.id, key: topic.dbKey as FieldKey }); setLabelDraft(topic.label); }}
                              className="p-0.5 rounded hover:bg-muted opacity-0 group-hover/lbl:opacity-100 transition"
                              title="Renomear tópico"
                            >
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-foreground/90">
                        {topic.content || <span className="italic text-muted-foreground">— ainda vazio —</span>}
                      </p>
                    </div>
                  ))}
                  {isMine && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => startEditing(p)}>
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
