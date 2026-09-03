import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  const models = await genAI.getGenerativeModel({model: "gemini-pro"});
  console.log("We need to fetch the REST API to list models, the SDK might not have listModels in this version.");
}
listModels();
