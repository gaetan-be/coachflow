import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const publicDir = path.join(__dirname, '..', '..', 'public');

// Small in-memory cache of raw HTML files so disk IO is one-shot.
const fileCache = new Map<string, string>();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderBranded(req: Request, res: Response, relPath: string): void {
  if (!req.coach) {
    res.status(500).send('Coach not resolved');
    return;
  }

  const full = path.join(publicDir, relPath);
  let html = fileCache.get(full);
  if (!html) {
    html = fs.readFileSync(full, 'utf-8');
    fileCache.set(full, html);
  }

  const { brand_name, logo_letter, accent_color } = req.coach;

  const rendered = html
    .replace(/\{\{brand_name\}\}/g, escapeHtml(brand_name))
    .replace(/\{\{logo_letter\}\}/g, escapeHtml(logo_letter))
    .replace(/\{\{accent_color\}\}/g, escapeHtml(accent_color));

  res.type('html').send(rendered);
}
