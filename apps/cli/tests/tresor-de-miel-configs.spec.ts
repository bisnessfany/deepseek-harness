/**
 * The Trésor de Miel examples stay config-only. This suite parses both
 * checked-in overlays, verifies their provider route, MCP transport, and secret
 * handling, checks every example skill's frontmatter, then replaces only the
 * n8n endpoint with the package-owned keyless MCP fixture and verifies that the
 * real Cordis Loader discovers a tool through the generic bridge.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { PatchOptions } from '@deepseek-ai/cordis-plugin-include'
import { boot, loadOverlayPatches } from '@deepseek-ai/dsh-app-boot'
import { isSkillName } from '@deepseek-ai/dsh-skill'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as McpClient from '@deepseek-ai/dsh-mcp-client/src/index.ts'

interface InsertedRow {
  id?: string
  name?: string
  config?: Record<string, unknown>
}

interface ProviderProfile {
  api?: string
  apiKeyEnv?: string
  models?: { id: string }[]
}

const root = resolve(import.meta.dirname, '../../..')
const exampleDir = resolve(root, 'apps/cli/config/examples/tresor-de-miel')
const skillsDir = resolve(exampleDir, 'skills')
const baseConfig = resolve(import.meta.dirname, 'fixtures/memory-mcp-base.cordis.yml')
const fixtureServer = resolve(root, 'packages/mcp/mcp-client/tests/fixture-server.ts')
const overlays = ['omniroute.cordis.yml', 'n8n-mcp.cordis.yml']
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)

const liveContexts = new Set<Context>()

afterEach(async () => {
  await Promise.all([...liveContexts].map(async ctx => ctx.fiber.dispose()))
  liveContexts.clear()
})

function overlayPatches(file: string): PatchOptions[] {
  return loadOverlayPatches('tresor-de-miel-config-test', resolve(exampleDir, file))
}

function insertedRow(patches: PatchOptions[]): InsertedRow {
  expect(patches).toHaveLength(1)
  const insert = patches[0]?.insert
  expect(insert).toHaveLength(1)
  return insert?.[0] as InsertedRow
}

function frontmatter(source: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source)
  if (match === null) throw new Error('SKILL.md has no YAML frontmatter')
  // The example skills use single-line plain scalars only.
  return Object.fromEntries(
    [...match[1]!.matchAll(/^([a-z-]+): (.+)$/gm)].map(([, key, value]) => [key!, value!]),
  )
}

async function waitForTool(ctx: Context, name: string): Promise<void> {
  const deadline = Date.now() + 10_000
  while (!ctx.tools.schemas().some(schema => schema.name === name)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for ${name}`)
    await new Promise(resolveWait => setTimeout(resolveWait, 25))
  }
}

describe('Trésor de Miel example overlays', () => {
  it('routes the pi-ai adapter to OmniRoute through a credential reference', () => {
    const patches = overlayPatches('omniroute.cordis.yml')
    const adapter = patches.find(patch => patch.id === 'llm-pi-ai')?.config as
      { providers?: Record<string, ProviderProfile> } | undefined
    const omniroute = adapter?.providers?.omniroute

    expect(omniroute?.api).toBe('openai-completions')
    expect(omniroute?.apiKeyEnv).toBe('OMNIROUTE_API_KEY')
    expect(omniroute?.models?.map(model => model.id)).toContain('auto/cheap')
    expect(patches.find(patch => patch.id === 'agent-default-model')?.config).toEqual({
      provider: 'omniroute',
      model: 'auto/cheap',
    })
  })

  it('connects n8n through one generic Streamable HTTP row with a credential template', () => {
    const row = insertedRow(overlayPatches('n8n-mcp.cordis.yml'))

    expect(row.id).toBe('n8n-mcp')
    expect(row.name).toBe('@deepseek-ai/dsh-mcp-client')
    expect(row.config?.serverName).toBe('n8n')
    expect(row.config?.transport).toBe('streamable-http')
    expect(row.config?.expandTemplates).toBe(true)
    expect(row.config?.headers).toEqual({ Authorization: 'Bearer ${credential:N8N_MCP_TOKEN}' })
  })

  it.each(overlays)('keeps literal secrets out of %s', (file) => {
    const source = readFileSync(resolve(exampleDir, file), 'utf8')

    expect(source).not.toMatch(/\bsk-[A-Za-z0-9_-]{8,}\b/)
    expect(source).not.toContain('DEEPSEEK_API_KEY')
  })

  it('loads the n8n overlay and discovers a keyless fixture tool', async () => {
    const patches = overlayPatches('n8n-mcp.cordis.yml')
    const row = insertedRow(patches)
    // The static config gate verifies the checked-in bare package specifier.
    // The unit test maps it to the source module so a clean checkout needs no
    // prebuilt `lib/` artifacts before exercising the Loader/MCP behavior.
    row.name = 'cordis:memory-test-mcp-client'
    // A patch merges into the inserted row's config, so the HTTP-only fields
    // are replaced here rather than by a later patch.
    row.config = {
      serverName: 'n8n',
      transport: 'stdio',
      command: process.execPath,
      args: [fixtureServer],
      env: {},
      cwd: root,
      toolCallTimeoutMs: 5_000,
    }
    const ctx = await boot(
      'tresor-de-miel-config-test',
      baseConfig,
      patches,
      (ctx) => {
        liveContexts.add(ctx)
        ctx.loader.builtins['memory-test-system-prompt'] = SystemPrompt
        ctx.loader.builtins['memory-test-tools'] = ToolRuntime
        ctx.loader.builtins['memory-test-mcp-client'] = McpClient
      },
    )
    await waitForTool(ctx, 'mcp__n8n__greet')
  }, 15_000)
})

describe('Trésor de Miel example skills', () => {
  it('ships the five documented skills', () => {
    expect(skills.toSorted()).toEqual([
      'n8n-nettoyage-mails',
      'n8n-posts-a-valider',
      'n8n-video-marketing',
      'omniroute-modeles',
      'tresor-de-miel',
    ])
  })

  it.each(skills)('declares a loadable name and description in %s', (skill) => {
    const meta = frontmatter(readFileSync(resolve(skillsDir, skill, 'SKILL.md'), 'utf8'))

    expect(meta.name).toBe(skill)
    expect(isSkillName(skill)).toBe(true)
    expect((meta.description ?? '').trim()).not.toBe('')
  })
})
