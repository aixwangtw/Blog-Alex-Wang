import type { CollectionEntry } from 'astro:content';
import { isTeachingArticle } from '../consts';

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

/**
 * 同分類之外的其他教學類文章（isTeachingArticle），新的在前。
 * 補在「同分類」清單後面，讓教學文多放幾篇；教學文的判斷在 consts.ts 的 TEACHING_TAGS。
 */
export function moreTeachingArticles(
  posts: readonly CollectionEntry<'blog'>[],
  category: string,
  excludeId?: string,
  limit = 4,
): CollectionEntry<'blog'>[] {
  return posts
    .filter(
      (post) =>
        !post.data.unlisted &&
        post.id !== excludeId &&
        post.data.tags[0] !== category &&
        isTeachingArticle(post.data.tags),
    )
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, limit);
}
