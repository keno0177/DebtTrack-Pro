
import { GoogleGenAI } from "@google/genai";
import { Invoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCollectionInsights = async (invoices: Invoice[]) => {
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;
  const totalDebt = invoices.reduce((sum, i) => sum + i.remaining_amount, 0);
  const graceCount = invoices.filter(i => i.status === 'Grace Period').length;

  const prompt = `
    Analyze the following debt collection summary:
    - Total Remaining Debt: $${totalDebt.toFixed(2)}
    - Total Invoices: ${invoices.length}
    - Overdue Invoices: ${overdueCount}
    - Invoices in Grace Period: ${graceCount}

    Provide 3 high-priority collection tips and a brief risk assessment. 
    Format the response as clear bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to load AI insights at this time. Please check your connectivity.";
  }
};
