# 连接 OmniRoute 与 n8n

[English](omniroute-n8n.md) | 中文

这些**默认关闭的参考配置**将 DSH 的模型请求路由到自托管的 [OmniRoute](https://github.com/diegosouzapw/OmniRoute) 网关，并通过实例级 MCP 服务器连接一个 [n8n](https://n8n.io/) 实例。它们位于 [`apps/cli/config/examples/tresor-de-miel/`](../../../apps/cli/config/examples/tresor-de-miel/)，同目录还有为一家小型企业编写的五个法语示例 skill；请复制该目录，并按你自己的实例修改这些 skill。

这些第三方配置仅作为互操作参考；收录不代表 DeepSeek 的认可、推荐、合作关系或持续支持承诺。

## DSH 负责什么

`omniroute.cordis.yml` 为 [`@deepseek-ai/dsh-llm-pi-ai`](../../../packages/llm/llm-pi-ai/README.zh.md) 添加一个使用 OpenAI Chat Completions 协议的 `omniroute` 提供方，并将 `auto/cheap` 设为新会话的默认模型。`n8n-mcp.cordis.yml` 添加一个 [`@deepseek-ai/dsh-mcp-client`](../../../packages/mcp/mcp-client/README.zh.md) 配置项，它连接 `<n8n 实例>/mcp-server/http`，并以 `mcp__n8n__<tool>` 的形式公开每个已发布的工作流。

DSH **不负责** 安装或启动 OmniRoute、在其控制台中连接上游模型提供方、创建 n8n 工作流，也不负责在 n8n 中开启 MCP 访问。这两个服务必须已经运行，并且运行 DSH 的机器能够访问它们。

## 保存凭据

两份 overlay 都不包含密钥。它们各自指定一个凭据引用，由[本地凭据存储](../../../packages/credentials/credentials-local/README.zh.md)依次从 `$DSH_HOME/.credentials.yaml`、启动环境、项目 `.env` 或 `$DSH_HOME/.env` 中解析。

| 变量 | 类型 | 值 |
|---|---|---|
| `OMNIROUTE_BASE_URL` | 地址，DSH 启动时读取 | 以 `/v1` 结尾的网关根地址；默认为 `http://localhost:20128/v1` |
| `OMNIROUTE_API_KEY` | 凭据 | OmniRoute **Dashboard → Endpoints** 中的密钥 |
| `N8N_BASE_URL` | 地址，DSH 启动时读取 | 实例根地址，例如 `https://<name>.app.n8n.cloud`；示例默认指向其作者的实例，请设置为你自己的实例 |
| `N8N_MCP_TOKEN` | 凭据 | n8n **Settings → Instance-level MCP → Connection details** 中的访问令牌 |

将这四行写入 `$DSH_HOME/.env`（默认为 `~/.dsh/.env`），并且不要将该文件纳入版本控制：

```sh
OMNIROUTE_BASE_URL=http://localhost:20128/v1
OMNIROUTE_API_KEY=<key from OmniRoute>
N8N_BASE_URL=https://<name>.app.n8n.cloud
N8N_MCP_TOKEN=<token from n8n>
```

## 启用 overlay

将其中一份或两份 overlay 传给 DSH：

```sh
dsh web \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/omniroute.cordis.yml" \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/n8n-mcp.cordis.yml"
```

这些路径可以指向磁盘任意位置的复制文件。不传 `--patch` 就会让两项都保持关闭。如果要跨次运行保留所选配置，请将这些 patch 合并到用户 patch 层：只对一个 profile 生效则写入 `$DSH_HOME/profiles/<name>/cordis.patch.yml`，对本机所有 profile 生效则写入 `$DSH_HOME/cordis.patch.yml`。不要覆盖已有文件，其中可能已经包含无关的用户 patch。

## OmniRoute 设置

启动 OmniRoute，在其控制台中至少连接一个上游提供方，并从 **Dashboard → Endpoints** 复制密钥。该 overlay 声明了 OmniRoute 的虚拟模型 `auto`、`auto/cheap`、`auto/fast`、`auto/smart` 和 `auto/coding`；网关会为每次请求选择一个符合条件的已连接提供方。如果要固定使用某个上游模型，请在 `models` 下添加它的 id，写法与 `GET /v1/models` 返回的完全一致，例如 `groq/llama-3.3-70b-versatile`。

该 overlay 设置了 `supportsDeveloperRole: false` 和 `maxTokensField: max_tokens`，因此请求保持为网关后每个上游都接受的 Chat Completions 写法。128,000 token 的上下文窗口和 8,192 token 的输出上限是针对免费额度的保守默认值；模型条目可以声明自己的 `contextWindow` 和 `maxTokens`。

## n8n MCP 设置

在 n8n 中打开 **Settings → Instance-level MCP**，开启 MCP 访问，并从 **Connection details** 复制访问令牌。然后打开 agent（智能体）可以调用的每个工作流，进入其设置并开启 **Available in MCP**。n8n 只列出已发布且开启了此开关的工作流。

该 overlay 为每次工具调用留出 300 秒，因为渲染视频的工作流要等渲染完成才会响应。如果你的工作流响应很快，请在复制的 overlay 中调低 `toolCallTimeoutMs`。

## 安装 skill

将示例 skill 复制到用户 skill 根目录，所有 profile 都会从这里发现它们：

```sh
mkdir -p "${DSH_HOME:-$HOME/.dsh}/skills"
cp -R apps/cli/config/examples/tresor-de-miel/skills/. "${DSH_HOME:-$HOME/.dsh}/skills/"
```

`tresor-de-miel` 包含品牌规则并指向其余四个 skill。`n8n-posts-a-valider`、`n8n-video-marketing` 和 `n8n-nettoyage-mails` 各自用 `curl` 调用一个 n8n webhook，并说明该工作流需要的 JSON 字段；不启用 MCP overlay 时它们也能工作。`omniroute-modeles` 检查网关并说明如何切换模型。这些文件中的 webhook 路径、品牌名称和地址属于示例作者；使用前请替换。

## 验证

1. 打开**设置 → 模型**，确认提供方列表中显示 **OmniRoute (modèles gratuits)**。
2. 新建一个会话并发送一条简短消息。收到回复说明网关接受了密钥并完成了路由。
3. 提问：`List the tools whose names start with mcp__n8n__.` MCP 发现是异步的，因此启动后请等待几秒再提问。
4. 提问：`Load the tresor-de-miel skill and draft an Instagram post about <topic>. Do not send it.` 确认回复遵循了该 skill 中的规则。

## 故障排查

| 现象 | 原因与解决方法 |
|---|---|
| 模型请求失败并返回 `MISSING_CREDENTIAL` | `OMNIROUTE_API_KEY` 没有解析出任何值。将它添加到 `$DSH_HOME/.env` 或保存到凭据存储中，然后重新发送请求。 |
| 模型请求失败并返回 HTTP 401 | 网关拒绝了该密钥。请从 **Dashboard → Endpoints** 重新复制。 |
| 模型请求因连接错误而失败 | OmniRoute 没有运行，或者 `OMNIROUTE_BASE_URL` 有误或缺少 `/v1`。修改地址后请重启 DSH。 |
| 网关拒绝某个请求字段 | 某个上游需要不同的写法。请在复制的 overlay 中调整 `compat` 开关；[模型配置指南](./providers.zh.md)介绍了这些开关。 |
| 没有出现 `mcp__n8n__` 工具 | n8n 配置项正在等待 `N8N_MCP_TOKEN`，令牌有误，n8n 中的 MCP 访问未开启，或者没有已发布的工作流开启 **Available in MCP**。 |
| 某个 skill 的 `curl` 命令返回 404 | 该 webhook 对应的工作流没有在 n8n 中发布，或者你的实例上 webhook 路径不同。 |
