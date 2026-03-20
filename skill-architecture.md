# Skill 架构说明

本文描述 `packages/opencode` 中 skill 的完整链路：发现、缓存、暴露、权限控制、按需加载与消费。

## 目标

Skill 系统主要解决四件事：

- 从本地/远程来源发现可复用指令。
- 只向当前 agent 暴露有权限使用的 skills。
- 按需加载（lazy load）skill 内容，避免一次性注入全部正文。
- 支持 skill 目录下的 references/scripts 等配套资源。

## 核心模块

- `src/skill/skill.ts`：核心注册表，负责扫描、缓存、查询。
- `src/skill/discovery.ts`：远程 skills 索引拉取与本地缓存。
- `src/tool/skill.ts`：`skill` 工具实现，按名称加载单个 skill。
- `src/session/system.ts`：把可用 skills 注入到 system prompt。
- `src/session/prompt.ts`：每轮推理构造 prompt 时调用 `SystemPrompt.skills()`。
- `src/agent/agent.ts`：把 skill 目录加入 `external_directory` 白名单。
- `src/command/index.ts`：把 skills 暴露为 slash command 来源。
- `src/server/server.ts`：`GET /skill` 接口，供 UI/SDK 列举。
- `src/effect/instances.ts`：将 `Skill.defaultLayer` 作为 instance 级服务接入。

## 数据模型

`Skill.Info`（定义于 `src/skill/skill.ts`）包含：

- `name`
- `description`
- `location`（`SKILL.md` 的绝对路径）
- `content`（frontmatter 之后的 markdown 正文）

运行时缓存（每个 instance 一份）：

- `skills: Record<string, Info>`
- `dirs: Set<string>`
- `task?: Promise<void>`（懒加载单飞任务）

## 发现来源与加载顺序

`Skill.load()` 的扫描顺序如下：

1. 外部全局目录（未禁用时）：
   - `~/.claude/skills/**/SKILL.md`
   - `~/.agents/skills/**/SKILL.md`
2. 外部项目目录（从当前目录向上走到 worktree）：
   - `.claude/skills/**/SKILL.md`
   - `.agents/skills/**/SKILL.md`
3. OpenCode 配置目录（`Config.directories()`），模式：
   - `{skill,skills}/**/SKILL.md`
   - 覆盖 `.opencode/skill`、`.opencode/skills`、`~/.config/opencode/skills` 等
4. `opencode.json` 里的本地路径扩展：
   - `skills.paths`（支持 `~/` 展开和相对路径）
5. `opencode.json` 里的远程源：
   - `skills.urls`，先 `Discovery.pull(url)` 拉取到缓存，再按本地目录扫描

同名 skill 的行为：

- 会记录 duplicate warning。
- 后扫描到的会覆盖先扫描到的 `skills[name]`。

## 解析与校验

每个 `SKILL.md` 通过 `ConfigMarkdown.parse()`（`gray-matter` + fallback 清洗）解析。

当前代码路径里的硬性要求：

- frontmatter 可解析。
- `name`、`description` 存在且是字符串。

当前未在 loader 强制执行的规则：

- `name` 的正则格式约束。
- 目录名必须与 `name` 一致。

这些规则目前主要在文档层面约定，不由 `Skill.add()` 强校验。

## 懒加载与缓存生命周期

`Skill` 为 instance 级、按需初始化：

- `get/all/dirs/available` 都会先走 `ensure()`。
- 首次调用触发一次 `load()`。
- 并发调用复用同一个 `task`（single-flight）。
- `load()` 失败会重置 `task`，后续调用可重试。

远程缓存：

- `Discovery.pull()` 缓存在 `Global.Path.cache/skills/<skill-name>/...`。
- 已存在文件不会重复下载（幂等）。

## Prompt 与 Tool 集成

### 1) 在 system prompt 中暴露可用 skills

每轮构造会话 prompt 时：

- 调用 `SystemPrompt.skills(agent)`。
- 注入 verbose 的 `<available_skills>...</available_skills>`。
- 若该 agent 的 skill 能力被禁用，则整段省略。

这一步只暴露“可发现性”，不会注入完整 skill 正文。

### 2) 在工具定义中暴露 skill 列表

`SkillTool.init()` 基于 `Skill.available(agent)` 生成工具描述：

- 展示 skills 的名称和描述。
- 参数固定为 `{ name: string }`。

### 3) 实际加载 skill（按需）

模型调用 `skill({ name })` 后：

1. `Skill.get(name)` 找到 skill。
2. 触发权限门禁：`ctx.ask({ permission: "skill", patterns: [name], always: [name] })`。
3. 返回 `<skill_content name="...">`，内容包含：
   - 完整 skill markdown 正文
   - skill base directory URL
   - `<skill_files>` 样本文件列表（最多 10 个，排除 `SKILL.md`）

## 权限模型

这里有两层权限：

1. skill 可见性/可调用性
   - `Skill.available(agent)` 使用 `PermissionNext.evaluate("skill", skill.name, agent.permission)` 过滤。
   - `deny` 的 skill 不会出现在该 agent 的可用列表中。

2. skill 目录文件访问权限
   - `Agent.state()` 初始化默认权限时会调用 `Skill.dirs()`。
   - 将每个 skill 目录加入 `external_directory` 白名单（`dir/* -> allow`）。
   - 这样 skill 被加载后，agent 才能读取目录下 references/scripts。

## 外部开关

环境变量：

- `OPENCODE_DISABLE_CLAUDE_CODE`
- `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS`
- `OPENCODE_DISABLE_EXTERNAL_SKILLS`

效果：

- 禁用 `.claude` / `.agents` 来源扫描。
- `.opencode`、`skills.paths`、`skills.urls` 仍按常规配置流程生效。

## 远程发现协议

`Discovery.pull(url)` 约定：

- `${baseUrl}/index.json` 存在。
- schema 为 `skills: [{ name, files[] }]`。
- 每个 skill 的 `files` 必须包含 `SKILL.md`。

对每个 skill：

- 从 `${baseUrl}/${skill.name}/${file}` 下载声明文件。
- 写入本地缓存目录。
- 仅当缓存中存在 `SKILL.md` 时，认为该 skill 可用。

并发默认值：

- skill 级并发：`4`
- 文件级并发：`8`

## API 与 UI 暴露面

- Server API：`GET /skill` 返回 `Skill.all()`。
- TUI 的 skill 对话框通过 SDK `app.skills()` 拉取列表，并支持插入 `/<skill-name>` 快捷输入。
- Command 注册阶段也会把 skills 作为 `source: "skill"` 注入，模板正文使用 `skill.content`。

## 错误处理

- frontmatter 非法：跳过该 skill。
- 解析失败会发布 session error event，并记录 `failed to load skill`。
- `skills.paths` 指向不存在目录：告警后继续。
- 远程索引/下载失败：记录日志并返回部分或空结果，不阻断整体扫描。

## 端到端时序

1. instance 启动后，`Skill` 服务可用但尚未加载。
2. 首次调用任意 `Skill.*` 方法，触发扫描并建立缓存。
3. 会话构造 prompt 时注入可用 skills 列表。
4. 模型判断匹配某 skill，调用 `skill` 工具。
5. 对该 skill 名称执行权限检查。
6. 工具注入完整 skill 内容和目录上下文。
7. 模型继续读取 skill 目录下配套文件完成任务。

## 调试清单

- 列出最终发现结果：`opencode debug skill`
- 校验 `SKILL.md` frontmatter（`name`/`description`）
- 检查是否被环境变量禁用了外部来源
- 检查当前 agent 的 `permission.skill`
- 检查是否存在同名覆盖
- 检查远程缓存目录 `Global.Path.cache/skills`
