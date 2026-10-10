export interface FeedAdapter {
  id: string;
  matches(hostname: string): boolean;
  findPosts(root: ParentNode): HTMLElement[];
  findRecommendations?(root: ParentNode): HTMLElement[];
  getText(post: HTMLElement): string;
  getAuthor?(post: HTMLElement): string | null;
}
