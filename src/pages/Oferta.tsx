import { useLocation } from "react-router-dom";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { OfertaDocument } from "@/components/legal/OfertaDocument";
import { useLegalPageVariant } from "@/lib/legal/useLegalPageVariant";

export default function Oferta() {
  const { pathname } = useLocation();
  const variant = useLegalPageVariant();

  return (
    <LegalDocumentShell
      title="Пользовательское соглашение"
      subtitle="Публичная оферта на оказание услуг"
      variant={variant}
    >
      <OfertaDocument pathname={pathname} />
    </LegalDocumentShell>
  );
}
