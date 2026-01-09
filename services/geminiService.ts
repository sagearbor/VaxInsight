import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, VaccineData } from "../types";

// Access Vite environment variables (must be prefixed with VITE_)
// For local development: create .env file with VITE_GEMINI_API_KEY=your_key
// For Firebase Studio (idx.google.com): set VITE_GEMINI_API_KEY in .idx/dev.nix or project secrets
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
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

    CURRENT DATABASE (use EXACT IDs when returning updates):
    ${vaccineList}

    TASK: Find the latest HHS/CDC childhood vaccine schedule changes and identify ALL vaccines that have been removed, made optional, or had their recommendation status changed.

    SEARCH QUERIES TO USE:
    - "HHS childhood vaccine schedule changes 2025"
    - "CDC recommended vaccines reduced"
    - "RFK Kennedy vaccine schedule announcement"
    - "childhood vaccines removed from mandate"
    - "17 vaccines to 11 vaccines schedule"

    CRITICAL REQUIREMENTS:
    1. The recent HHS announcement reduced recommended childhood vaccines from 17 to 11, meaning 6 VACCINES WERE REMOVED OR MADE OPTIONAL.
    2. You MUST identify and return ALL 6 vaccines that were changed - not just 2 or 3.
    3. For each changed vaccine, provide EXACTLY these 3 fields:
       - id: The EXACT "id" from the CURRENT DATABASE above (e.g., "flu", "covid")
       - status: ONLY the word "Modified" (nothing else!)
       - recentChangeDescription: ONE SHORT SENTENCE (max 15 words) describing the change (e.g., "Removed from universal recommendation", "Made optional for low-risk groups", "No longer mandated for school entry")

    IMPORTANT: The "status" field must ONLY contain "Modified". Put ALL explanation text in "recentChangeDescription". Keep descriptions SHORT (under 15 words).

    VACCINES LIKELY AFFECTED (verify with search - use exact IDs):
    - Influenza (id: "flu") - often cited as removed from universal mandate
    - COVID-19 (id: "covid") - shifted to optional/high-risk only
    - Varicella/Chickenpox (id: "varicella") - potentially removed
    - HPV (id: "hpv") - often discussed as optional
    - Hepatitis B (id: "hepb") - birth dose sometimes removed
    - Hepatitis A (id: "hepa") - sometimes made optional
    - Rotavirus (id: "rotavirus") - sometimes made optional

    VACCINES TYPICALLY RETAINED (unless news says otherwise):
    - MMR/Measles (id: "measles") - usually kept due to high R0
    - Polio (id: "polio") - usually kept
    - DTaP series (ids: "dtap-d", "dtap-t", "pertussis") - usually kept
    - Hib (id: "hib") - usually kept
    - PCV/Pneumococcal (id: "pcv") - usually kept

    OUTPUT: Return 'updatedDataHints' array with ALL changed vaccines (expect ~6 items based on 17->11 reduction).
    Also return 'summary' with 150-word strategic analysis of the announcement and public health implications.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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
                        },
                        required: ["id", "status", "recentChangeDescription"]
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

    // Post-process updatedDataHints to fix AI formatting issues
    const sanitizedHints = (parsed.updatedDataHints || []).map((hint: any) => {
      let status = hint.status || 'Modified';
      let description = hint.recentChangeDescription;

      // If status contains more than just "Modified", extract description from it
      if (status.length > 20 || status.includes(',') || status.includes('.')) {
        // Extract first meaningful phrase as description
        const parts = status.split(/[,.]/).filter((p: string) => p.trim());
        if (parts.length > 1) {
          description = parts.slice(1, 3).join('. ').trim().slice(0, 80);
        } else {
          description = status.slice(0, 80);
        }
        status = 'Modified';
      }

      // Ensure description exists and is short
      if (!description || description === 'undefined') {
        description = 'Recommendation status changed';
      }
      if (description.length > 80) {
        description = description.slice(0, 77) + '...';
      }

      return {
        id: hint.id,
        status: status,
        recentChangeDescription: description
      };
    });

    return {
      summary: parsed.summary,
      sources: sources,
      updatedDataHints: sanitizedHints
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      summary: "Analysis unavailable. Ensure API connectivity or check quotas.",
      sources: []
    };
  }
};