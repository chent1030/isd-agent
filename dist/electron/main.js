"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv = __importStar(require("dotenv"));
// 优先加载 resourcesPath 下的 .env（打包后），其次当前目录（开发时）
const envPaths = [
    path_1.default.join(process.resourcesPath ?? '', '.env'),
    path_1.default.join(electron_1.app.getPath('userData'), '.env'),
    path_1.default.join(process.cwd(), '.env'),
];
for (const p of envPaths) {
    if (fs_1.default.existsSync(p)) {
        dotenv.config({ path: p });
        break;
    }
}
const face_1 = require("./ipc/face");
const stt_1 = require("./ipc/stt");
const tts_1 = require("./ipc/tts");
const llm_1 = require("./ipc/llm");
const dify_1 = require("./ipc/dify");
const skills_1 = require("./ipc/skills");
const isDev = !electron_1.app.isPackaged || process.env.NODE_ENV === 'development';
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
    (0, dify_1.registerDifyHandlers)();
    (0, skills_1.registerSkillHandlers)();
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
