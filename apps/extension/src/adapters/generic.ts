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
  findPosts: (root) => Array.from(root.querySelectorAll<HTMLElement>("ytd-rich-item-renderer, ytd-video-renderer")),
  getText: (post) => post.innerText.replace(/\s+/g, " ").trim()
};
