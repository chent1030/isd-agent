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
exports.registerSTTHandlers = registerSTTHandlers;
const electron_1 = require("electron");
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
function registerSTTHandlers() {
    electron_1.ipcMain.handle('stt:transcribe', async (_event, audioBuffer) => {
        const url = process.env.STT_API_URL;
        if (!url)
            throw new Error('STT_API_URL not configured');
        const model = process.env.STT_MODEL || process.env.NEWAPI_STT_MODEL;
        const fileField = process.env.STT_FILE_FIELD || 'file';
        const apiKey = process.env.STT_API_KEY || process.env.NEWAPI_API_KEY;
        const form = new form_data_1.default();
        form.append(fileField, Buffer.from(audioBuffer), {
            filename: 'audio.wav',
            contentType: 'audio/wav',
        });
        if (model)
            form.append('model', model);
        if (process.env.STT_LANGUAGE)
            form.append('language', process.env.STT_LANGUAGE);
        const response = await axios_1.default.post(url, form, {
            headers: {
                ...form.getHeaders(),
                ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            timeout: 30000,
        });
        const data = response.data ?? {};
        return {
            text: typeof data.text === 'string' ? data.text : '',
            task: typeof data.task === 'string' ? data.task : undefined,
            language: typeof data.language === 'string' ? data.language : undefined,
            duration: data.duration ?? null,
        };
    });
}
