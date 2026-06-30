import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { dirname } from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const [REPO_OWNER, REPO_NAME] = (process.env.REPO || '').split('/');
const COMMENT_ID = process.env.COMMENT_ID;

const issueData = JSON.parse(readFileSync('/tmp/issue.json', 'utf-8'));
const { number: ISSUE_NUMBER, title: ISSUE_TITLE, body: ISSUE_BODY } = issueData;

async function updateComment(body) {
  await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${COMMENT_ID}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
}

function extractFilePaths(text) {
  const patterns = [
    /`((?:frontend|backend|src)\/[^\s\n`',)]+\.(tsx?|jsx?|prisma|yml|yaml|json))`/g,
    /\b((?:frontend|backend|src)\/[^\s\n`,)]+\.(tsx?|jsx?|prisma|yml|yaml))\b/g,
  ];
  const paths = new Set();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) paths.add(match[1]);
  }
  return [...paths];
}

function readFileSafe(path) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, 'utf-8');
  } catch { return null; }
}

async function callGroq(messages) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 8192,
      temperature: 0.1,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq API error');
  return data.choices[0].message.content;
}

async function main() {
  const branchName = `grok/issue-${ISSUE_NUMBER}-${Date.now()}`;

  try {
    await updateComment(`## 🤖 Grok Issue Engineer 작동 중\n\n이슈를 분석하고 있습니다...`);

    const mentionedFiles = extractFilePaths(ISSUE_BODY || '');
    const fileContents = {};
    for (const fp of mentionedFiles) {
      const c = readFileSafe(fp);
      if (c) fileContents[fp] = c;
    }

    const fileSection = Object.entries(fileContents)
      .map(([p, c]) => `### ${p}\n\`\`\`\n${c}\n\`\`\``)
      .join('\n\n');

    const systemPrompt = `You are an expert full-stack developer fixing GitHub issues in a Korean fintech learning app.
Stack: React 18 + TypeScript + Tailwind CSS (frontend/), NestJS + Prisma + PostgreSQL (backend/).

Return ONLY valid JSON with NO markdown fences, NO extra explanation:
{
  "summary": "한국어로 변경 내용 한 줄 요약",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "COMPLETE new file content — the entire file, not a snippet"
    }
  ]
}

CRITICAL RULES:
- "content" must be the ENTIRE file content after your fix, not a partial snippet
- Only include files that actually need changes
- Preserve all imports, exports, and existing code structure
- Do not add markdown code fences inside content values
- Make minimal focused changes to fix only what the issue describes`;

    const userPrompt = `## Issue #${ISSUE_NUMBER}: ${ISSUE_TITLE}

${ISSUE_BODY}

## 현재 파일 내용 (수정 시 전체 내용을 다시 작성하세요)
${fileSection || '(이슈 내용을 바탕으로 수정할 파일을 추론하고 전체 내용을 작성하세요)'}

위 이슈를 수정하세요. JSON만 반환하세요.`;

    await updateComment(`## 🤖 Grok Issue Engineer 작동 중\n\nGroq AI가 수정 코드를 생성하고 있습니다...`);

    const result = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let parsed;
    try {
      const cleaned = result.replace(/^```json\n?|^```\n?|\n?```$/gm, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`AI가 유효한 JSON을 반환하지 않았습니다:\n${result.substring(0, 400)}`);
    }

    if (!parsed.files || parsed.files.length === 0) {
      await updateComment(`## ⚠️ Grok Issue Engineer\n\nAI가 수정할 파일을 찾지 못했습니다.\n이슈에 파일 경로와 오류 내용을 더 구체적으로 작성해주세요.`);
      return;
    }

    execSync(`git config user.email "grok-bot@github-actions"`);
    execSync(`git config user.name "Grok Issue Engineer"`);
    execSync(`git checkout -b ${branchName}`);

    const applied = [];
    const failed = [];

    for (const { path, content } of parsed.files) {
      try {
        if (!content || content.trim() === '') {
          failed.push(`❌ \`${path}\` — content가 비어있음`);
          continue;
        }
        const dir = dirname(path);
        if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
        writeFileSync(path, content, 'utf-8');
        execSync(`git add "${path}"`);
        applied.push(`✅ \`${path}\``);
      } catch (err) {
        failed.push(`❌ \`${path}\` — ${err.message}`);
      }
    }

    if (applied.length === 0) {
      await updateComment(`## ❌ Grok Issue Engineer 실패\n\n파일 수정에 실패했습니다:\n\n${failed.join('\n')}`);
      return;
    }

    execSync(`git commit -m "fix: ${parsed.summary} (closes #${ISSUE_NUMBER})"`);
    execSync(`git push origin ${branchName}`);

    const prRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `fix: ${parsed.summary}`,
        body: [
          `## 🤖 Grok 자동 수정`,
          ``,
          `Closes #${ISSUE_NUMBER}`,
          ``,
          `### 수정된 파일`,
          ...applied,
          ...(failed.length ? ['', '### 실패한 파일', ...failed] : []),
          ``,
          `> Groq llama-3.3-70b-versatile 자동 생성`,
        ].join('\n'),
        head: branchName,
        base: 'main',
      }),
    });

    const pr = await prRes.json();

    await updateComment([
      `## ✅ Grok Issue Engineer 완료`,
      ``,
      `### 수정된 파일`,
      ...applied,
      ...(failed.length ? ['', '### 실패한 파일', ...failed] : []),
      ``,
      `### PR`,
      pr.html_url ? `[PR #${pr.number} 확인하기](${pr.html_url})` : '(PR 생성 실패)',
    ].join('\n'));

  } catch (err) {
    await updateComment([
      `## ❌ Grok Issue Engineer 실패`,
      ``,
      '```',
      err.message,
      '```',
      ``,
      `> 이슈에 \`@grok 다시 시도\` 댓글을 달면 재시도합니다.`,
    ].join('\n'));
    process.exit(1);
  }
}

main();
