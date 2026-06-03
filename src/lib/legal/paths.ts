import { isIdeaLabHost } from "@/constants/site";
import { isIdeaLabSurfaceRoute } from "@/lib/ideaLab/constants";

export type LegalDocId = "oferta" | "privacy";

function ideaLabPrefix(pathname: string): string {
  if (isIdeaLabHost()) return "";
  if (isIdeaLabSurfaceRoute(pathname)) return "/idea-lab";
  return "";
}

/** Путь к юридическому документу с учётом Idea Lab (поддомен или /idea-lab). */
export function legalDocPath(doc: LegalDocId, pathname?: string): string {
  const p =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  const prefix = ideaLabPrefix(p);
  return `${prefix}/${doc}`;
}

export function legalDocPaths(pathname?: string) {
  return {
    oferta: legalDocPath("oferta", pathname),
    privacy: legalDocPath("privacy", pathname),
  };
}
