import type { FeedAdapter } from "./types.js";

function uniqueTopLevel(elements: HTMLElement[]): HTMLElement[] {
  return elements.filter((el) => !elements.some((other) => other !== el && other.contains(el)));
}

export const threadsAdapter: FeedAdapter = {
  id: "threads",
  matches: (hostname) => hostname === "www.threads.net" || hostname === "threads.net",
  findPosts(root) {
    const candidates = Array.from(root.querySelectorAll<HTMLElement>("article"));
    if (candidates.length) return uniqueTopLevel(candidates);

    const fallback = Array.from(root.querySelectorAll<HTMLElement>('div[role="button"]'))
      .map((node) => node.closest<HTMLElement>("div"))
      .filter((node): node is HTMLElement => Boolean(node && node.innerText.length > 20));
    return uniqueTopLevel(fallback);
  },
  getText(post) {
    return post.innerText.replace(/\s+/g, " ").trim();
  }
};
