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
exports.registerLLMHandlers = registerLLMHandlers;
const electron_1 = require("electron");
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function registerLLMHandlers() {
    electron_1.ipcMain.handle('llm:chat', async (event, { messages, channel }) => {
        const url = process.env.LLM_API_URL;
        const key = process.env.LLM_API_KEY;
        if (!url)
            throw new Error('LLM_API_URL not configured');
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            throw new Error('No window found');
        const response = await axios_1.default.post(url, { messages, stream: true }, {
            headers: {
                'Content-Type': 'application/json',
                ...(key ? { Authorization: `Bearer ${key}` } : {}),
            },
            responseType: 'stream',
            timeout: 60000,
        });
        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(Boolean);
                for (const line of lines) {
                    const data = line.replace(/^data: /, '').trim();
                    if (data === '[DONE]')
                        continue;
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content ?? json.content ?? '';
                        if (content)
                            win.webContents.send(channel, content);
                    }
                    catch {
                        // 非 JSON 行忽略
                    }
                }
            });
            response.data.on('end', () => {
                win.webContents.send(channel, '[DONE]');
                resolve();
            });
            response.data.on('error', reject);
        });
    });
}
