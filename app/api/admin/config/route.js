import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

// Helper to initialize config if not exists
const getStoredConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = {
      broadcast: "",
      engines: { gemini: true, groq: true, openrouter: true },
      stats: { tokens: 0, cost: 0 }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch (e) {
    return {
      broadcast: "",
      engines: { gemini: true, groq: true, openrouter: true },
      stats: { tokens: 0, cost: 0 }
    };
  }
};

export async function GET() {
  try {
    const config = getStoredConfig();
    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const config = getStoredConfig();
    
    const newConfig = { ...config, ...body };
    // Merge nested objects properly
    if (body.engines) newConfig.engines = { ...config.engines, ...body.engines };
    if (body.stats) newConfig.stats = { ...config.stats, ...body.stats };
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
    
    return NextResponse.json(newConfig);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
