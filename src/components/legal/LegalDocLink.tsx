import { Link, useLocation } from "react-router-dom";
import { legalDocPath, type LegalDocId } from "@/lib/legal/paths";
import { cn } from "@/lib/utils";

type Props = {
  doc: LegalDocId;
  className?: string;
  children: React.ReactNode;
};

export function LegalDocLink({ doc, className, children }: Props) {
  const { pathname } = useLocation();
  return (
    <Link to={legalDocPath(doc, pathname)} className={cn(className)}>
      {children}
    </Link>
  );
}
