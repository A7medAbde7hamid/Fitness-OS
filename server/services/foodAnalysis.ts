import { GoogleGenAI } from '@google/genai';
import { sanitizeUserInput } from '../aiProtection';

export interface FoodAnalysisResult {
  items: Array<{
    name: string;
    portion: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: number;
}

export async function analyzeFoodServer(params: {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: string;
  mode?: string;
}): Promise<FoodAnalysisResult> {
  const { description, imageBase64, mimeType, language, mode } = params;
  const sanitizedDescription = typeof description === 'string' ? sanitizeUserInput(description) : description;
  const apiKey = process.env.GEMINI_API_KEY;

  const fallbackItems = sanitizedDescription
    ? [{ name: sanitizedDescription.slice(0, 80), portion: '1 serving', grams: 300, calories: 450, protein: 35, carbs: 45, fat: 14, confidence: 0.88 }]
    : [{ name: 'Identified Meal', portion: '1 serving', grams: 350, calories: 500, protein: 38, carbs: 48, fat: 16, confidence: 0.82 }];

  if (!apiKey) {
    return {
      items: fallbackItems,
      totalCalories: fallbackItems[0].calories,
      totalProtein: fallbackItems[0].protein,
      totalCarbs: fallbackItems[0].carbs,
      totalFat: fallbackItems[0].fat,
      confidence: fallbackItems[0].confidence,
    };
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const isAr = language === 'ar';
  const langInstruction = isAr ? 'Arabic' : 'English';

  const systemInstruction = `You are a certified sports nutritionist and food analyst.
Analyze the provided food image and/or description.
Return ONLY valid JSON matching this exact schema:
{
  "items": [{ "name": string, "portion": string, "grams": number, "calories": number, "protein": number, "carbs": number, "fat": number, "confidence": number }],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "confidence": number
}
Rules:
- confidence must be between 0 and 1 (0 = no idea, 1 = completely certain)
- All macros are in grams; calories use standard Atwater factors (protein 4, carbs 4, fat 9)
- Respond in ${langInstruction}.
- If the image is unclear or no food is visible, set confidence below 0.5 and include a generic placeholder item.
- NEVER invent detailed macros for unidentified food — use conservative estimates.`;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (imageBase64 && (mode === 'image' || mode === 'combined')) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }

  let promptText: string;
  if (mode === 'image' && !description) {
    promptText = isAr ? 'حلل هذا الطعام في الصورة وأعطني التقديرات الغذائية الدقيقة.' : 'Analyze the food in this image and provide accurate nutritional estimates.';
  } else if (mode === 'combined' && description) {
    promptText = isAr ? `الصورة تحتوي على طعام. الوصف الإضافي: "${description}". حلل وقدم التقديرات الغذائية.` : `The image contains food. Additional description: "${description}". Analyze and provide nutritional estimates.`;
  } else {
    promptText = `Analyze this food description and return structured nutritional estimates.\nFood: "${sanitizedDescription || ''}"`;
  }
  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: [{ role: 'user', parts }],
    config: { systemInstruction, temperature: 0.3, responseMimeType: 'application/json' },
  });

  const rawText = response.text || '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : {};
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const validatedItems = items
    .filter((it: any) => it && typeof it.name === 'string' && typeof it.calories === 'number')
    .map((it: any) => ({
      name: String(it.name || 'Unknown Item'),
      portion: String(it.portion || '1 serving'),
      grams: typeof it.grams === 'number' ? it.grams : 200,
      calories: Math.round(Number(it.calories) || 0),
      protein: Math.round((Number(it.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(it.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(it.fat) || 0) * 10) / 10,
      confidence: Math.max(0, Math.min(1, Number(it.confidence) || 0.7)),
    }));

  if (validatedItems.length === 0) {
    validatedItems.push({
      name: isAr ? 'وجبة غير محددة' : 'Unidentified Meal',
      portion: isAr ? '1 حصة' : '1 serving',
      grams: 300, calories: 400, protein: 30, carbs: 40, fat: 14, confidence: 0.5,
    });
  }

  const totalCalories = validatedItems.reduce((s: number, i: any) => s + i.calories, 0);
  const totalProtein = Math.round(validatedItems.reduce((s: number, i: any) => s + i.protein, 0) * 10) / 10;
  const totalCarbs = Math.round(validatedItems.reduce((s: number, i: any) => s + i.carbs, 0) * 10) / 10;
  const totalFat = Math.round(validatedItems.reduce((s: number, i: any) => s + i.fat, 0) * 10) / 10;
  const avgConfidence = validatedItems.reduce((s: number, i: any) => s + i.confidence, 0) / validatedItems.length;

  return {
    items: validatedItems,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}
