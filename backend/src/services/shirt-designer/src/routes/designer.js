import express from 'express';
import { convertImage } from '../controllers/images.js';
import { listPresets } from '../controllers/presets.js';
import { MAX_FILE_BYTES } from '../services/normalizeArtwork.js';

export const designer = express.Router();
designer.get('/presets', listPresets);
designer.post('/images', express.raw({ type: 'application/octet-stream', limit: MAX_FILE_BYTES, inflate: false }), convertImage);
