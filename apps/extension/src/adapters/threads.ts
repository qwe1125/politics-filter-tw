import type { FeedAdapter } from "./types.js";

const postPath = /^\/@[^/]+\/post\/[^/]+\/?$/;
const threadsHosts = ["www.threads.com", "threads.com", "www.threads.net", "threads.net"];

export const threadsAdapter: FeedAdapter = {
  id: "threads",
  matches: (hostname) => threadsHosts.includes(hostname),
  findPosts(root) {
    if (location.pathname.includes("/post/")) return [];
    return Array.from(root.querySelectorAll<HTMLElement>('[data-pressable-container="true"]'))
      .filter((card) => {
        if (card.parentElement?.closest('[data-pressable-container="true"]')) return false;
        const links = card.querySelectorAll<HTMLAnchorElement>('a[href*="/post/"]');
        return Array.from(links).some((link) => {
          try {
            const url = new URL(link.href, location.href);
            return url.hostname === location.hostname && postPath.test(url.pathname)
              && link.closest('[data-pressable-container="true"]') === card;
          } catch {
            return false;
          }
        });
      });
  },
  findRecommendations(root) {
    return Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href*="trend_fbid="]'))
      .filter((link) => {
        try {
          const url = new URL(link.href, location.href);
          return threadsHosts.includes(url.hostname) && url.pathname === "/search"
            && url.searchParams.get("serp_type") === "trends"
            && Boolean(url.searchParams.get("trend_fbid"));
        } catch {
          return false;
        }
      });
  },
  getText(post) {
    return post.innerText.replace(/\s+/g, " ").trim();
  },
  getAuthor(post) {
    const link = Array.from(post.querySelectorAll<HTMLAnchorElement>('a[href*="/@"]'))
      .find((item) => {
        try {
          const url = new URL(item.href, location.href);
          return threadsHosts.includes(url.hostname) && /^\/@[^/]+\/?$/.test(url.pathname);
        } catch {
          return false;
        }
      });
    if (!link) return null;
    return new URL(link.href, location.href).pathname.replace(/\/$/, "").toLowerCase();
  }
};
