"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // 人脸识别
    recognizeFace: (imageBase64) => electron_1.ipcRenderer.invoke('face:recognize', imageBase64),
    // STT
    transcribeAudio: (audioBuffer) => electron_1.ipcRenderer.invoke('stt:transcribe', audioBuffer),
    // TTS
    synthesizeSpeech: (text) => electron_1.ipcRenderer.invoke('tts:synthesize', text),
    // LLM（含 skills 注入）
    chatStream: (messages, isAuthenticated, onChunk) => {
        const channel = `llm:chunk:${Date.now()}`;
        electron_1.ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk));
        return electron_1.ipcRenderer.invoke('llm:chat', { messages, channel, isAuthenticated }).finally(() => {
            electron_1.ipcRenderer.removeAllListeners(channel);
        });
    },
    // Dify Chat
    difyChat: (query, conversationId, user, onChunk) => {
        const channel = `dify:chunk:${Date.now()}`;
        electron_1.ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk));
        return electron_1.ipcRenderer
            .invoke('dify:chat', { query, conversationId, channel, user })
            .finally(() => electron_1.ipcRenderer.removeAllListeners(channel));
    },
    // Skills
    getSkills: (isAuthenticated) => electron_1.ipcRenderer.invoke('skills:list', { isAuthenticated }),
    loadSkill: (name) => electron_1.ipcRenderer.invoke('skills:load', { name }),
    // 窗口控制
    minimizeWindow: () => electron_1.ipcRenderer.send('window:minimize'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
});
