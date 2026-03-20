"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSkills = loadSkills;
exports.registerSkillsHandlers = registerSkillsHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const skillsMap = new Map();
async function loadSkills() {
    const skillsDir = path_1.default.join(process.cwd(), 'skills');
    if (!fs_1.default.existsSync(skillsDir))
        return;
    const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const manifestPath = path_1.default.join(skillsDir, entry.name, 'manifest.json');
        const indexPath = path_1.default.join(skillsDir, entry.name, 'index.js');
        if (!fs_1.default.existsSync(manifestPath) || !fs_1.default.existsSync(indexPath))
            continue;
        try {
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
            const mod = require(indexPath);
            skillsMap.set(manifest.id, { manifest, execute: mod.execute });
            console.log(`[Skills] Loaded: ${manifest.name}`);
        }
        catch (e) {
            console.error(`[Skills] Failed to load ${entry.name}:`, e);
        }
    }
}
function registerSkillsHandlers() {
    electron_1.ipcMain.handle('skills:list', () => {
        return Array.from(skillsMap.values()).map(s => s.manifest);
    });
    electron_1.ipcMain.handle('skills:execute', async (_event, { skillId, params }) => {
        const skill = skillsMap.get(skillId);
        if (!skill)
            throw new Error(`Skill not found: ${skillId}`);
        return skill.execute(params, {});
    });
}
