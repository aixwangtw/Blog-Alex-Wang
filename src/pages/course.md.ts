import type { APIRoute } from 'astro';
import { agentPageMarkdown } from '../lib/agent-docs';

// /course/ 的 Markdown 版，給 AI 讀取；內容來源見 src/lib/agent-docs.ts。
export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await agentPageMarkdown('course'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
