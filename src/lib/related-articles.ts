import type { CollectionEntry } from 'astro:content';

/**
 * 依分類（tags 第一個）列出相關文章，新的在前。
 * 分類從 CMS 文章的 tags 自動算出來，不寫死文章清單。
 */
export function relatedByCategory(
  posts: readonly CollectionEntry<'blog'>[],
  category: string,
  excludeId?: string,
  limit = 6,
): CollectionEntry<'blog'>[] {
  return posts
    .filter((post) => !post.data.unlisted && post.id !== excludeId && post.data.tags[0] === category)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, limit);
}
