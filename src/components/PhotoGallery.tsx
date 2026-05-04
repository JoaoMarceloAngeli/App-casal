import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PhotoItem {
  id: string;
  storage_path: string;
  caption: string | null;
  uploader_id: string;
  created_at: string;
  url?: string;
}

const VIDEO_EXTS = ["mp4", "mov", "webm", "m4v", "quicktime"];
const isVideo = (path: string) => {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTS.includes(ext);
};

export function PhotoGallery({ kind, title, subtitle }: { kind: "photo" | "letter"; title: string; subtitle: string }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PhotoItem | null>(null);

  const acceptTypes = kind === "photo" ? "image/*,video/*" : "image/*";

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["photos", kind],
    queryFn: async () => {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      if (!data) return [];
      return data.map((p) => ({
        ...p,
        url: supabase.storage.from("couple-photos").getPublicUrl(p.storage_path).data.publicUrl,
      })) as PhotoItem[];
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("couple-photos")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase.from("photos").insert({
          uploader_id: user.id,
          kind,
          storage_path: path,
        });
        if (dbErr) throw dbErr;
      }
      toast.success(t(
        files.length === 1 ? "photos.uploadCount_one" : "photos.uploadCount_other",
        { count: files.length }
      ));
      queryClient.invalidateQueries({ queryKey: ["photos", kind] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (item: PhotoItem) => {
    if (!confirm(t("photos.deleteConfirm"))) return;
    await supabase.storage.from("couple-photos").remove([item.storage_path]);
    await supabase.from("photos").delete().eq("id", item.id);
    setPreview(null);
    queryClient.invalidateQueries({ queryKey: ["photos", kind] });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <label>
            <input
              type="file"
              accept={acceptTypes}
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? t("photos.uploading") : t("photos.add")}
              </span>
            </Button>
          </label>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="polaroid w-full">
              <div className="aspect-square bg-muted animate-pulse rounded-sm" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="paper-card p-12 text-center">
          <p className="font-script text-2xl text-muted-foreground">
            {kind === "photo" ? t("photos.emptyPhotos") : t("photos.emptyLetters")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((p, i) => {
            const video = isVideo(p.storage_path);
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => setPreview(p)}
                className={`polaroid block w-full text-left ${
                  i % 3 === 0 ? "rotate-tilt-1" : i % 3 === 1 ? "rotate-tilt-2" : "rotate-tilt-3"
                } hover:rotate-0 hover:scale-105 transition-transform duration-300`}
              >
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {video ? (
                    <>
                      <video
                        src={p.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center shadow-lg">
                          <Play className="w-6 h-6 text-primary fill-primary ml-0.5" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={p.url}
                      alt={p.caption ?? ""}
                      loading={i < 6 ? "eager" : "lazy"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="font-script text-center text-base mt-2 absolute bottom-2 left-0 right-0">
                  {p.caption || ""}
                </p>
              </motion.button>
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl bg-paper p-2 sm:p-4">
          {preview && (
            <div className="relative">
              {isVideo(preview.storage_path) ? (
                <video
                  src={preview.url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] rounded-sm bg-black"
                />
              ) : (
                <img src={preview.url} alt="" className="w-full max-h-[80vh] object-contain rounded-sm" />
              )}
              <div className="flex justify-between items-center mt-3 px-2">
                <p className="font-script text-lg">{preview.caption || ""}</p>
                {preview.uploader_id === user?.id && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(preview)}>
                    <Trash2 className="w-4 h-4 mr-1" /> {t("photos.delete")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
