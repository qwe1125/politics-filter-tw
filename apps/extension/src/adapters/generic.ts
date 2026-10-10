import type { FeedAdapter } from "./types.js";

export const xAdapter: FeedAdapter = {
  id: "x",
  matches: (hostname) => hostname === "x.com" || hostname === "www.x.com",
  findPosts: (root) => Array.from(root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]')),
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim(),
  getAuthor(post) {
    const link = post.querySelector<HTMLAnchorElement>('a[href^="/"]');
    return link && /^\/[A-Za-z0-9_]{1,15}\/?$/.test(new URL(link.href).pathname)
      ? new URL(link.href).pathname.toLowerCase() : null;
  }
};

export const facebookAdapter: FeedAdapter = {
  id: "facebook",
  matches: (hostname) => hostname.includes("facebook.com"),
  findPosts(root) {
    const articles = Array.from(root.querySelectorAll<HTMLElement>('[role="article"]'));
    const cards = new Set(articles);

    // Some Facebook feeds omit role="article". Their author is still a heading
    // linked to a profile; climb only as far as the first complete media post.
    for (const heading of root.querySelectorAll<HTMLElement>("h4")) {
      if (heading.closest('[role="article"]') || !(heading.closest("a[href]") || heading.querySelector("a[href]"))) continue;
      let candidate = heading.parentElement;
      while (candidate && candidate !== document.body) {
        const text = candidate.innerText?.trim() ?? "";
        const otherText = text.length - (heading.innerText?.length ?? 0);
        const media = candidate.querySelectorAll("img, video").length;
        if (otherText >= 20 && media >= 2) break;
        candidate = candidate.parentElement;
      }
      if (!candidate || candidate === document.body) continue;
      const text = candidate.innerText?.trim() ?? "";
      if (text.length > 2000 || candidate.querySelectorAll("h4").length !== 1) continue;
      if (candidate.getBoundingClientRect().width > 900) continue;
      cards.add(candidate);
    }

    return [...cards];
  },
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim(),
  getAuthor(post) {
    const heading = post.querySelector("h4");
    const link = heading?.closest("a[href]") ?? heading?.querySelector("a[href]");
    if (!link) return null;
    const url = new URL((link as HTMLAnchorElement).href, location.href);
    if (!url.hostname.endsWith("facebook.com")) return null;
    if (url.pathname === "/profile.php") return url.searchParams.has("id") ? `/profile.php?id=${url.searchParams.get("id")}` : null;
    return url.pathname.replace(/\/$/, "").toLowerCase();
  }
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
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim(),
  getAuthor(post) {
    const link = Array.from(post.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .find((item) => /^\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+)\/?$/.test(new URL(item.href, location.href).pathname));
    return link ? new URL(link.href, location.href).pathname.replace(/\/$/, "").toLowerCase() : null;
  }
};
