import { useLocation } from "react-router-dom";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { PrivacyDocument } from "@/components/legal/PrivacyDocument";
import { useLegalPageVariant } from "@/lib/legal/useLegalPageVariant";

export default function Privacy() {
  const { pathname } = useLocation();
  const variant = useLegalPageVariant();

  return (
    <LegalDocumentShell
      title="Политика конфиденциальности"
      subtitle="Обработка персональных данных"
      variant={variant}
    >
      <PrivacyDocument pathname={pathname} />
    </LegalDocumentShell>
  );
}
