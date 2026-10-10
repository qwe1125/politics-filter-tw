import type { FeedAdapter } from "./types.js";

export const xAdapter: FeedAdapter = {
  id: "x",
  matches: (hostname) => hostname === "x.com" || hostname === "www.x.com",
  findPosts: (root) => Array.from(root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')),
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim()
};

export const facebookAdapter: FeedAdapter = {
  id: "facebook",
  matches: (hostname) => hostname.includes("facebook.com"),
  findPosts: (root) => Array.from(root.querySelectorAll<HTMLElement>('[role="article"]')),
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim()
};

export const youtubeAdapter: FeedAdapter = {
  id: "youtube",
  matches: (hostname) => hostname.includes("youtube.com"),
  findPosts(root) {
    const cardSelector = "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model";
    return Array.from(root.querySelectorAll<HTMLElement>(cardSelector)).filter((card) => {
      if (card.closest("ytd-ad-slot-renderer, ytd-search-pyv-renderer, ytd-promoted-video-renderer")) return false;
      if (card.parentElement?.closest(cardSelector)) return false;
      return Array.from(card.querySelectorAll<HTMLAnchorElement>("a[href]")).some((link) => {
        try {
          const url = new URL(link.href, location.href);
          return (url.hostname === "www.youtube.com" || url.hostname === "youtube.com")
            && ((url.pathname === "/watch" && url.searchParams.has("v"))
              || /^\/shorts\/[^/]+/.test(url.pathname));
        } catch {
          return false;
        }
      });
    });
  },
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim()
};
