import type { CollectionEntry } from 'astro:content';
import { isTeachingArticle } from '../consts';

/**
 * 「AI 教學」清單：目前頁面以外的所有教學類文章（分組對照見 consts.ts）。
 * 第一個標籤和 firstTag 相同的文章排前面，其餘照發佈日新到舊。
 */
export function teachingArticles(
  posts: readonly CollectionEntry<'blog'>[],
  firstTag: string | undefined,
  excludeId?: string,
): CollectionEntry<'blog'>[] {
  const byDateDesc = (a: CollectionEntry<'blog'>, b: CollectionEntry<'blog'>) =>
    b.data.pubDate.getTime() - a.data.pubDate.getTime();
  const rank = (post: CollectionEntry<'blog'>) => (post.data.tags[0] === firstTag ? 0 : 1);
  return posts
    .filter((post) => !post.data.unlisted && post.id !== excludeId && isTeachingArticle(post.data.tags))
    .sort((a, b) => rank(a) - rank(b) || byDateDesc(a, b));
}
