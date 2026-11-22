import { Router } from 'express';
import { getLooks } from '../controllers/looks.js';

export const lookbook = Router();
lookbook.get('/looks', getLooks);
