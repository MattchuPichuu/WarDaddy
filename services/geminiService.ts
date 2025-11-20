
import { GoogleGenAI } from "@google/genai";
import { Player, PlayerStatus, Faction } from "../types";

export const generateSitrep = async (friendlies: Player[], enemies: Player[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Error: API Key not found. Please set the API_KEY environment variable.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter for interesting data
  const openEnemies = enemies.filter(e => e.status === PlayerStatus.OPEN).map(e => e.name);
  const expiringSoon = enemies.filter(e => {
    if (e.status !== PlayerStatus.PROTECTED || !e.lastShotTime) return false;
    const timeLeft = (e.lastShotTime + (60 * 60 * 1000)) - Date.now();
    return timeLeft > 0 && timeLeft < 15 * 60 * 1000; // Less than 15 mins
  }).map(e => e.name);

  const deadEnemies = enemies.filter(e => e.status === PlayerStatus.DEAD).map(e => e.name);

  const prompt = `
    You are an automated tracker assistant for the game MafiaMatrix.
    Generate a concise status report for Discord based on the current tracking data.
    
    Data:
    - Open Targets: ${openEnemies.length > 0 ? openEnemies.join(', ') : 'None'}
    - Targets Opening Soon (<15m): ${expiringSoon.length > 0 ? expiringSoon.join(', ') : 'None'}
    - Dead: ${deadEnemies.length > 0 ? deadEnemies.join(', ') : 'None'}

    Formatting:
    - Use bolding for emphasis.
    - Use simple bullet points.
    - Keep it strictly professional and informational.
    - No roleplay or character persona.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini generation failed:", error);
    return "AI Service Unavailable.";
  }
};
