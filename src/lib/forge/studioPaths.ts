import { isForgeStudioHost } from "@/constants/site";

export function studioPortalPath(token: string): string {
  return isForgeStudioHost() ? `/${token}` : `/studio/${token}`;
}

export function studioResultPath(token: string, slug: string): string {
  return isForgeStudioHost() ? `/${token}/result/${slug}` : `/studio/${token}/result/${slug}`;
}

export function publicLpPath(slug: string): string {
  return `/lp/${slug}`;
}
