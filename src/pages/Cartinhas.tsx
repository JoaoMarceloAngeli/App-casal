import { PhotoGallery } from "@/components/PhotoGallery";
import { useTranslation } from "react-i18next";

export default function Cartinhas() {
  const { t } = useTranslation();
  return <PhotoGallery kind="letter" title={t("letters.title")} subtitle={t("letters.subtitle")} />;
}
