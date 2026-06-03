import { useEffect } from "react";
import {
  IDEA_LAB_PAGE_TITLE,
  applyIdeaLabDocumentMeta,
  restoreWorkshopDocumentMeta,
} from "@/lib/ideaLab/documentMeta";

/** Title и favicon Idea Lab в вкладке браузера. */
export function useIdeaLabPageMeta(titleSuffix?: string) {
  useEffect(() => {
    const title = titleSuffix ? `${IDEA_LAB_PAGE_TITLE} · ${titleSuffix}` : IDEA_LAB_PAGE_TITLE;
    applyIdeaLabDocumentMeta(title);
    return restoreWorkshopDocumentMeta;
  }, [titleSuffix]);
}
