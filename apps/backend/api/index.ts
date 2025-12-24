/**
 * Vercel Serverless Function Handler
 * Point d'entrée optimisé pour Vercel
 * 
 * Ce fichier est compilé vers dist/api/index.js
 * et pointe vers dist/src/serverless.js après le build
 */

// En développement, on importe depuis src
// En production (Vercel), on importe depuis dist
import type { Request, Response } from 'express';

type ServerlessHandler = (req: Request, res: Response) => Promise<void> | void;

let handler: ServerlessHandler;

// Try multiple paths to find the serverless handler
// Priority: dist/src/serverless.js > src/serverless.ts > api/src/serverless.js
try {
  handler = require('../dist/src/serverless').default;
} catch (e) {
  try {
    handler = require('../src/serverless').default;
  } catch (e2) {
    try {
      handler = require('./src/serverless').default;
    } catch (e3) {
      throw new Error('Could not find serverless handler. Build may have failed.');
    }
  }
}

export default handler;
