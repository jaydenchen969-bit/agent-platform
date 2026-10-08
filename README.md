# Agent Platform

一个面向多 Agent 管理、配置和对话的轻量级平台 MVP。

## 当前能力

- Agent 列表与状态展示
- 创建 Agent（名称、描述、系统提示词）
- 选择 Agent 并进行对话
- 内置 API：`GET /api/agents`、`POST /api/agents`、`POST /api/chat`
- 零依赖 Node.js 服务，方便后续接入数据库、模型供应商和工具调用

## 启动

```bash
npm run dev
```

打开 <http://localhost:3000>。

## 下一步建议

1. 接入 OpenAI / Anthropic 等模型适配层
2. 增加数据库持久化和用户登录
3. 增加 Agent 工作流、工具、知识库和运行日志
4. 增加团队空间、权限和计费
