# Connect OmniRoute and n8n

English | [中文](omniroute-n8n.zh.md)

These **default-off reference configurations** route DSH model requests to a self-hosted [OmniRoute](https://github.com/diegosouzapw/OmniRoute) gateway and connect an [n8n](https://n8n.io/) instance through its instance-level MCP server. They live in [`apps/cli/config/examples/tresor-de-miel/`](../../../apps/cli/config/examples/tresor-de-miel/) together with five French example skills written for one small business; copy the folder and edit the skills for your own instance.

These third-party configurations are provided as interoperability examples only. Their inclusion does not imply endorsement, recommendation, partnership, or ongoing support by DeepSeek.

## What DSH does

`omniroute.cordis.yml` adds an `omniroute` provider to [`@deepseek-ai/dsh-llm-pi-ai`](../../../packages/llm/llm-pi-ai/README.md) that speaks OpenAI Chat Completions, and makes `auto/cheap` the default model of new sessions. `n8n-mcp.cordis.yml` adds one [`@deepseek-ai/dsh-mcp-client`](../../../packages/mcp/mcp-client/README.md) row that connects to `<n8n instance>/mcp-server/http` and exposes each published workflow as `mcp__n8n__<tool>`.

DSH does **not** install or start OmniRoute, connect upstream model providers in its dashboard, create n8n workflows, or enable MCP access in n8n. Both services must already be running and reachable from the machine that runs DSH.

## Store the credentials

Neither overlay contains a secret. Each one names a credential reference that the [local credential store](../../../packages/credentials/credentials-local/README.md) resolves from `$DSH_HOME/.credentials.yaml`, the launch environment, the project `.env`, or `$DSH_HOME/.env`.

| Variable | Kind | Value |
|---|---|---|
| `OMNIROUTE_BASE_URL` | Address, read when DSH starts | Gateway root ending in `/v1`; defaults to `http://localhost:20128/v1` |
| `OMNIROUTE_API_KEY` | Credential | The key from OmniRoute's **Dashboard → Endpoints** |
| `N8N_BASE_URL` | Address, read when DSH starts | Instance root such as `https://<name>.app.n8n.cloud`; the example defaults to its author's instance, so set your own |
| `N8N_MCP_TOKEN` | Credential | The access token from n8n's **Settings → Instance-level MCP → Connection details** |

Put the four lines in `$DSH_HOME/.env` (`~/.dsh/.env` by default) and keep that file out of version control:

```sh
OMNIROUTE_BASE_URL=http://localhost:20128/v1
OMNIROUTE_API_KEY=<key from OmniRoute>
N8N_BASE_URL=https://<name>.app.n8n.cloud
N8N_MCP_TOKEN=<token from n8n>
```

## Enable the overlays

Pass either overlay, or both, to DSH:

```sh
dsh web \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/omniroute.cordis.yml" \
  --patch "$PWD/apps/cli/config/examples/tresor-de-miel/n8n-mcp.cordis.yml"
```

The paths may point to copied files anywhere on disk. Omitting `--patch` keeps both disabled. To keep the selection across runs, merge the patches into a user patch layer — `$DSH_HOME/profiles/<name>/cordis.patch.yml` for one profile, or `$DSH_HOME/cordis.patch.yml` for every profile on the machine. Do not copy over an existing file: it may already contain unrelated user patches.

## OmniRoute setup

Start OmniRoute, connect at least one upstream provider in its dashboard, and copy the key from **Dashboard → Endpoints**. The overlay declares OmniRoute's virtual models `auto`, `auto/cheap`, `auto/fast`, `auto/smart`, and `auto/coding`; the gateway chooses an eligible connected provider for each request. To pin one upstream model, add its id under `models` exactly as `GET /v1/models` lists it, for example `groq/llama-3.3-70b-versatile`.

The overlay sets `supportsDeveloperRole: false` and `maxTokensField: max_tokens`, so requests stay in the Chat Completions dialect that every upstream behind the gateway accepts. Its 128,000-token context window and 8,192-token output limit are conservative defaults for free tiers; a model entry may declare its own `contextWindow` and `maxTokens`.

## n8n MCP setup

In n8n, open **Settings → Instance-level MCP**, turn on MCP access, and copy the access token from **Connection details**. Then open each workflow that the agent may call, open its settings, and turn on **Available in MCP**. n8n lists only published workflows that have this switch on.

The overlay allows each tool call 300 seconds because a workflow that renders video answers only after the render finishes. Lower `toolCallTimeoutMs` in a copied overlay when your workflows answer quickly.

## Install the skills

Copy the example skills into the user skill root, where every profile discovers them:

```sh
mkdir -p "${DSH_HOME:-$HOME/.dsh}/skills"
cp -R apps/cli/config/examples/tresor-de-miel/skills/. "${DSH_HOME:-$HOME/.dsh}/skills/"
```

`tresor-de-miel` holds the brand rules and points to the other four. `n8n-posts-a-valider`, `n8n-video-marketing`, and `n8n-nettoyage-mails` each call one n8n webhook with `curl` and state the JSON fields that the workflow expects; they work without the MCP overlay. `omniroute-modeles` checks the gateway and explains how to change model. The webhook paths, brand names, and addresses in these files belong to the example's author; replace them before use.

## Verify

1. Open **Settings → Models** and confirm that the provider list shows **OmniRoute (modèles gratuits)**.
2. Start a session and send a short message. A reply shows that the gateway accepted the key and routed the request.
3. Ask: `List the tools whose names start with mcp__n8n__.` MCP discovery is asynchronous, so wait a few seconds after startup before asking.
4. Ask: `Load the tresor-de-miel skill and draft an Instagram post about <topic>. Do not send it.` Confirm that the reply follows the rules in the skill.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A model request fails with `MISSING_CREDENTIAL` | `OMNIROUTE_API_KEY` resolves to nothing. Add it to `$DSH_HOME/.env` or save it in the credential store, then send the request again. |
| A model request fails with HTTP 401 | The gateway rejected the key. Copy it again from **Dashboard → Endpoints**. |
| A model request fails with a connection error | OmniRoute is not running, or `OMNIROUTE_BASE_URL` is wrong or lacks `/v1`. Restart DSH after changing the address. |
| The gateway rejects a request field | An upstream needs a different dialect. Adjust the `compat` switches in a copied overlay; the [model configuration guide](./providers.md) describes them. |
| No `mcp__n8n__` tool appears | The n8n row waits for `N8N_MCP_TOKEN`, the token is wrong, MCP access is off in n8n, or no published workflow has **Available in MCP** on. |
| A skill's `curl` command returns 404 | The workflow behind that webhook is not published in n8n, or the webhook path differs on your instance. |
