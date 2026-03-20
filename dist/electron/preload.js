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
    // LLM
    chatStream: (messages, onChunk) => {
        const channel = `llm:chunk:${Date.now()}`;
        electron_1.ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk));
        return electron_1.ipcRenderer.invoke('llm:chat', { messages, channel }).finally(() => {
            electron_1.ipcRenderer.removeAllListeners(channel);
        });
    },
    // Skills
    getSkills: () => electron_1.ipcRenderer.invoke('skills:list'),
    executeSkill: (skillId, params) => electron_1.ipcRenderer.invoke('skills:execute', { skillId, params }),
    // 窗口控制
    minimizeWindow: () => electron_1.ipcRenderer.send('window:minimize'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
});
