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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDifyHandlers = registerDifyHandlers;
const electron_1 = require("electron");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Dify Chat API (SSE streaming)
// POST /v1/chat-messages
// Headers: Authorization: Bearer <API_KEY>
// Body: { query, inputs, conversation_id, response_mode: 'streaming', user }
function registerDifyHandlers() {
    electron_1.ipcMain.handle('dify:chat', async (event, { query, conversationId, channel, user, }) => {
        const baseUrl = process.env.DIFY_API_URL;
        const apiKey = process.env.DIFY_API_KEY;
        if (!baseUrl)
            throw new Error('DIFY_API_URL not configured');
        if (!apiKey)
            throw new Error('DIFY_API_KEY not configured');
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            throw new Error('No window found');
        const body = JSON.stringify({
            query,
            inputs: {},
            response_mode: 'streaming',
            conversation_id: conversationId ?? '',
            user,
        });
        // 使用 Node.js 原生 https/http 处理 SSE，避免 axios 缓冲问题
        const url = new URL('/v1/chat-messages', baseUrl);
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? await Promise.resolve().then(() => __importStar(require('https'))) : await Promise.resolve().then(() => __importStar(require('http')));
        return new Promise((resolve, reject) => {
            const req = transport.request({
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Length': Buffer.byteLength(body),
                },
            }, (res) => {
                let newConversationId = conversationId ?? '';
                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? ''; // 保留不完整的行
                    for (const line of lines) {
                        if (!line.startsWith('data: '))
                            continue;
                        const data = line.slice(6).trim();
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            const event = parsed.event;
                            if (event === 'message' || event === 'agent_message') {
                                const text = parsed.answer ?? '';
                                if (text)
                                    win.webContents.send(channel, text);
                                if (parsed.conversation_id)
                                    newConversationId = parsed.conversation_id;
                            }
                            else if (event === 'message_end') {
                                if (parsed.conversation_id)
                                    newConversationId = parsed.conversation_id;
                            }
                            else if (event === 'error') {
                                win.webContents.send(channel, '[DONE]');
                                reject(new Error(parsed.message ?? 'Dify error'));
                                return;
                            }
                        }
                        catch {
                            // 忽略非 JSON 行
                        }
                    }
                });
                res.on('end', () => {
                    win.webContents.send(channel, '[DONE]');
                    resolve({ conversationId: newConversationId });
                });
                res.on('error', (err) => {
                    win.webContents.send(channel, '[DONE]');
                    reject(err);
                });
            });
            req.on('error', (err) => {
                win.webContents.send(channel, '[DONE]');
                reject(err);
            });
            req.write(body);
            req.end();
        });
    });
}
