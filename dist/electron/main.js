"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const face_1 = require("./ipc/face");
const stt_1 = require("./ipc/stt");
const tts_1 = require("./ipc/tts");
const llm_1 = require("./ipc/llm");
const skills_1 = require("./ipc/skills");
const isDev = process.env.NODE_ENV === 'development';
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 680,
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#0f172a',
    });
    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
}
electron_1.app.whenReady().then(async () => {
    // 允许摄像头访问
    electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true);
        }
        else {
            callback(false);
        }
    });
    await (0, skills_1.loadSkills)();
    (0, face_1.registerFaceHandlers)();
    (0, stt_1.registerSTTHandlers)();
    (0, tts_1.registerTTSHandlers)();
    (0, llm_1.registerLLMHandlers)();
    (0, skills_1.registerSkillsHandlers)();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
