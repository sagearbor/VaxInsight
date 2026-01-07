import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, VaccineData } from "../types";

// Safe access to environment variables in browser context
const getEnvVar = (key: string): string | undefined => {
  try {
    // Check if process is defined (Node-like env)
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // Fallback if injected directly into window (sometimes used in specific bundles)
    if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
      return (window as any).process.env[key];
    }
    return undefined;
  } catch (e) {
    return undefined;
  }
};

const API_KEY = getEnvVar('API_KEY');
const hasApiKey = !!API_KEY;

export const analyzeHHSChanges = async (currentData: VaccineData[]): Promise<AnalysisResult> => {
  if (!hasApiKey || !API_KEY) {
    console.warn("No API KEY found. Returning mock analysis.");
    return {
      summary: "API Key not detected. Unable to fetch live HHS data. Displaying baseline analysis based on historical trends.",
      sources: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Create a structured list of IDs to force the model to reference them exactly
  const vaccineList = currentData.map(v => `- ID: "${v.id}", Name: "${v.name}", Current Status: "${v.status}"`).join('\n');
  const today = new Date().toLocaleDateString();

  const prompt = `
    You are a database synchronization agent for a public health dashboard.
    TODAY'S DATE: ${today}
    
    CURRENT DATABASE:
    ${vaccineList}

    TASKS:
    1. **Search Phase**: Search for "HHS CDC vaccine schedule reduction 17 to 11" or "vaccines removed from childhood mandate 2025" or "HHS vaccine announcement today".
       - Look for the SPECIFIC announcement from HHS regarding changes to the childhood vaccine schedule.
       - The goal is to identify the reduction from 17 mandated vaccines to 11.
       - Identify which specific vaccines are being removed, made optional, or restricted to reach the "11 recommended vaccines" target.

    2. **Analyze & Infer**: 
       - Map the news findings to the "CURRENT DATABASE".
       - If the news mentions reducing the schedule from 17 to 11, identify the 6 most likely candidates for removal based on the announcement.
       - Common candidates for removal in these discussions are: Flu, Covid, Hepatitis B (at birth), Rotavirus, Varicella (Chickenpox), Hepatitis A, or HPV.
       - **Do NOT** remove Polio, Measles (MMR), DTaP/Tetanus unless explicitly stated in the announcement.

    3. **JSON Output Phase**: 
       - Return a JSON array 'updatedDataHints'.
       - **Example Output**: 
         [
           { "id": "flu", "status": "Modified", "recentChangeDescription": "Removed from mandate in recent HHS overhaul." }, 
           { "id": "covid", "status": "Modified", "recentChangeDescription": "Shifted to optional/seasonal." },
           { "id": "varicella", "status": "Modified", "recentChangeDescription": "Requirement lifted." }
         ]
       - Ensure you use the EXACT IDs from the "CURRENT DATABASE" list.
    
    4. **Summary**: Write a 150-word strategic analysis describing the recent HHS announcement. Discuss the rationale cited (e.g., "bloated schedule", "focus on core diseases") and the potential public health trade-offs.

    OUTPUT FORMAT:
    Strict JSON only. No markdown formatting outside the JSON structure.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
            type: "OBJECT",
            properties: {
                summary: { type: "STRING" },
                sources: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            title: { type: "STRING" },
                            uri: { type: "STRING" }
                        }
                    }
                },
                updatedDataHints: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                             id: { type: "STRING" },
                             status: { type: "STRING" },
                             recentChangeDescription: { type: "STRING" }
                        }
                    }
                }
            }
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Clean markdown (```json ... ```) to prevent parsing errors
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    
    let sources = parsed.sources || [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri) {
                sources.push({ title: chunk.web.title || 'Verified Source', uri: chunk.web.uri });
            }
        });
    }

    return {
      summary: parsed.summary,
      sources: sources,
      updatedDataHints: parsed.updatedDataHints
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Analysis unavailable. Ensure API connectivity or check quotas.",
      sources: []
    };
  }
};