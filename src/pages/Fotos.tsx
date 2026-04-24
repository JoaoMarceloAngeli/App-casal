import { PhotoGallery } from "@/components/PhotoGallery";
import { useTranslation } from "react-i18next";

export default function Fotos() {
  const { t } = useTranslation();
  return <PhotoGallery kind="photo" title={t("photos.title")} subtitle={t("photos.subtitle")} />;
}
