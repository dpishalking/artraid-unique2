export const WORKSHOP_PAGE_TITLE =
  "Где сайт теряет деньги — экспресс-аудит за 60 секунд";

export const IDEA_LAB_PAGE_TITLE = "Idea Lab";

export const WORKSHOP_FAVICON_HREF = "/favicon.svg";

export const IDEAS_DOMAIN_FAVICON_HREF = "/ideas-favicon.svg";

function faviconForCurrentDomain(): string {
  if (typeof window === "undefined") return WORKSHOP_FAVICON_HREF;
  const host = window.location.hostname.replace(/^www\./, "");
  return host === "ideas.pishalking.ru" || host === "ideas.localhost"
    ? IDEAS_DOMAIN_FAVICON_HREF
    : WORKSHOP_FAVICON_HREF;
}

export function setDocumentFavicon(href: string, type?: string) {
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
  if (type) link.type = type;
  else link.removeAttribute("type");
}

export function applyIdeaLabDocumentMeta(title = IDEA_LAB_PAGE_TITLE) {
  document.title = title;
  setDocumentFavicon(faviconForCurrentDomain(), "image/svg+xml");
}

export function restoreWorkshopDocumentMeta() {
  document.title = WORKSHOP_PAGE_TITLE;
  setDocumentFavicon(faviconForCurrentDomain(), "image/svg+xml");
}
