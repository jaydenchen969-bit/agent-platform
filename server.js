import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT || 3000);

let agents = [
  {
    id: 'agent-content',
    name: '内容策划 Agent',
    description: '把一个主题拆成可执行的内容方案。',
    systemPrompt: '你是一名专业的内容策划师，回答要结构清晰、可执行。',
    status: 'active',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'agent-research',
    name: '研究分析 Agent',
    description: '提炼资料、比较方案并输出结论。',
    systemPrompt: '你是一名严谨的研究分析师，先列事实，再给出判断。',
    status: 'active',
    updatedAt: new Date().toISOString()
  }
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function createId(prefix = 'agent') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function serveStatic(req, res) {
  const requested = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = normalize(join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/api/agents' && req.method === 'GET') {
      sendJson(res, 200, { agents });
      return;
    }

    if (req.url === '/api/agents' && req.method === 'POST') {
      const body = await readJson(req);
      if (!body.name?.trim()) {
        sendJson(res, 400, { error: 'Agent 名称不能为空' });
        return;
      }
      const agent = {
        id: createId(),
        name: body.name.trim(),
        description: body.description?.trim() || '还没有填写描述。',
        systemPrompt: body.systemPrompt?.trim() || '你是一个有帮助的 AI 助手。',
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      agents = [agent, ...agents];
      sendJson(res, 201, { agent });
      return;
    }

    if (req.url === '/api/chat' && req.method === 'POST') {
      const body = await readJson(req);
      const agent = agents.find((item) => item.id === body.agentId) || agents[0];
      const message = body.message?.trim();
      if (!message) {
        sendJson(res, 400, { error: '消息不能为空' });
        return;
      }
      sendJson(res, 200, {
        reply: `【${agent.name}】已收到你的需求：${message}\n\n这是 MVP 演示回复。下一步可以在 server.js 中接入真实模型、工具调用和会话记忆。`,
        agentId: agent.id
      });
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: '服务器内部错误' });
  }
});

server.listen(port, () => {
  console.log(`Agent Platform running at http://localhost:${port}`);
});
