"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSkills = loadSkills;
exports.getSkillInfos = getSkillInfos;
exports.buildSkillsSystemPrompt = buildSkillsSystemPrompt;
exports.loadSkillContent = loadSkillContent;
exports.executeSkillScript = executeSkillScript;
exports.registerSkillHandlers = registerSkillHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const gray_matter_1 = __importDefault(require("gray-matter"));
// instance 级缓存
const skillsMap = new Map();
let loadTask = null;
async function load() {
    skillsMap.clear();
    const skillsDir = path_1.default.join(process.cwd(), 'skills');
    if (!fs_1.default.existsSync(skillsDir))
        return;
    const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const skillMdPath = path_1.default.join(skillsDir, entry.name, 'SKILL.md');
        if (!fs_1.default.existsSync(skillMdPath))
            continue;
        try {
            const raw = fs_1.default.readFileSync(skillMdPath, 'utf-8');
            const { data, content } = (0, gray_matter_1.default)(raw);
            if (!data.name || !data.description) {
                console.warn(`[skills] skip ${entry.name}: missing name or description in frontmatter`);
                continue;
            }
            const scriptsDir = path_1.default.join(skillsDir, entry.name, 'scripts');
            const skill = {
                name: data.name,
                description: data.description,
                requiresAuth: data.requiresAuth !== false, // 默认需要认证
                location: skillMdPath,
                content: content.trim(),
                scriptsDir: fs_1.default.existsSync(scriptsDir) ? scriptsDir : null,
            };
            if (skillsMap.has(skill.name)) {
                console.warn(`[skills] duplicate skill name "${skill.name}", overwriting`);
            }
            skillsMap.set(skill.name, skill);
            console.log(`[skills] loaded: ${skill.name}`);
        }
        catch (e) {
            console.error(`[skills] failed to load ${entry.name}:`, e);
        }
    }
}
/** 懒加载，single-flight */
async function ensure() {
    if (skillsMap.size > 0)
        return;
    if (!loadTask) {
        loadTask = load().catch(e => {
            console.error('[skills] load failed:', e);
            loadTask = null; // 允许重试
        });
    }
    await loadTask;
}
/** 启动时主动加载 */
async function loadSkills() {
    await load();
}
/** 返回所有 skill 信息（供前端展示） */
async function getSkillInfos(isAuthenticated) {
    await ensure();
    return Array.from(skillsMap.values()).filter(s => !s.requiresAuth || isAuthenticated);
}
/**
 * 构建注入 LLM system prompt 的 <available_skills> 块
 * 只暴露名称和描述，不注入完整正文（按需加载）
 */
async function buildSkillsSystemPrompt(isAuthenticated) {
    await ensure();
    const available = Array.from(skillsMap.values()).filter(s => !s.requiresAuth || isAuthenticated);
    if (available.length === 0)
        return '';
    const lines = available.map(s => `- ${s.name}: ${s.description}`).join('\n');
    return `<available_skills>\n${lines}\n</available_skills>`;
}
/**
 * 按需加载单个 skill 完整内容，注入 LLM 上下文
 * 返回 <skill_content> 块，包含正文 + scripts 文件列表
 */
async function loadSkillContent(name) {
    await ensure();
    const skill = skillsMap.get(name);
    if (!skill)
        throw new Error(`Skill not found: ${name}`);
    let block = `<skill_content name="${skill.name}">\n${skill.content}\n`;
    if (skill.scriptsDir) {
        const files = fs_1.default.readdirSync(skill.scriptsDir).slice(0, 10);
        block += `\n<skill_files base="${skill.scriptsDir}">\n${files.join('\n')}\n</skill_files>\n`;
    }
    block += `</skill_content>`;
    return block;
}
/**
 * 执行 skill scripts/index.js（如存在）
 */
async function executeSkillScript(name, params) {
    await ensure();
    const skill = skillsMap.get(name);
    if (!skill)
        throw new Error(`Skill not found: ${name}`);
    if (!skill.scriptsDir)
        throw new Error(`Skill "${name}" has no scripts directory`);
    const indexPath = path_1.default.join(skill.scriptsDir, 'index.js');
    if (!fs_1.default.existsSync(indexPath))
        throw new Error(`Skill "${name}" has no scripts/index.js`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(indexPath);
    return mod.execute(params);
}
function registerSkillHandlers() {
    // 前端获取 skill 列表（展示用）
    electron_1.ipcMain.handle('skills:list', async (_e, { isAuthenticated }) => {
        return getSkillInfos(isAuthenticated);
    });
    // 按需加载 skill 完整内容（LLM 调用时）
    electron_1.ipcMain.handle('skills:load', async (_e, { name }) => {
        return loadSkillContent(name);
    });
    // 执行 skill scripts
    electron_1.ipcMain.handle('skills:execute', async (_e, { name, params }) => {
        return executeSkillScript(name, params);
    });
}
