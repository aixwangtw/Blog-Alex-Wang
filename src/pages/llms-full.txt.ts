import type { APIRoute } from 'astro';
import { llmsFullText } from '../lib/agent-docs';

// llms-full.txt：服務、教學、演講、免費資源與 FAQ 的完整純文字，內容來源見 src/lib/agent-docs.ts。
export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await llmsFullText(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
