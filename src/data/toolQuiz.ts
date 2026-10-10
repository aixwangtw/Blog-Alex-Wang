import { SITE } from '../consts';

export const TOOL_QUIZ_RECOMMENDATIONS = {
  codex: {
    title: '第一步：先安裝 Codex',
    description: 'Codex 是操作其他工具、安裝 Skills、執行流程與協助除錯的入口。無論最後想做什麼，都先把它安裝好。',
    link: `${SITE.url}/blog/codex-windows-wsl-install/`,
    linkLabel: 'VS Code＋Codex 插件版安裝教學',
  },
  meta: {
    title: '你需要的是 Meta API 串接',
    description: '把發文動作自動化，排程、權限設定都靠這組 API。',
    link: `${SITE.url}/blog/threads-api-tutorial/`,
    linkLabel: 'Meta 三大 API 申請教學',
  },
  remotion: {
    title: '你需要的是 Remotion',
    description: '用程式化的方式做影片，適合需要固定版型、大量產出短影音的人。',
    link: 'https://www.remotion.dev/',
    linkLabel: 'Remotion 官方網站',
  },
  elevenlabs: {
    title: '你需要的是 ElevenLabs',
    description: '用 AI 生成配音與旁白，短影音不必每次都自己錄音。',
    link: 'https://elevenlabs.io/',
    linkLabel: 'ElevenLabs 官方網站',
  },
} as const;

export type ToolQuizKey = keyof typeof TOOL_QUIZ_RECOMMENDATIONS;

export function isToolQuizKey(value: unknown): value is ToolQuizKey {
  return typeof value === 'string' && value in TOOL_QUIZ_RECOMMENDATIONS;
}
