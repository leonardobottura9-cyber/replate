import { SwapSuggestion } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';

// Detailed system prompt — placed under cache_control so it's cached across
// repeat requests. Caching activates once the system prompt reaches the model's
// minimum token threshold (~2048 for Haiku 4.5). In the meantime the marker
// is a no-op and adds no cost.
const SYSTEM_PROMPT = `You are a certified nutritionist and culinary expert specializing in healthy ingredient substitutions. Your mission is to help people eat better by suggesting practical, science-backed ingredient swaps.

TASK
When given a recipe name, a list of ingredients, or pasted recipe text, identify the 3–6 ingredients with the highest health impact and suggest a specific, readily available healthier alternative for each.

SELECTION CRITERIA — prioritize ingredients that are:
- High in saturated fat (butter, lard, shortening, full-fat cheese, cream)
- High in refined sugar (white sugar, corn syrup, condensed milk)
- Made from refined grains (white flour, white rice)
- High calorie with low nutritional density (mayonnaise, sour cream, heavy cream)
- Processed or high in sodium (canned soups, packaged seasonings)

SWAP CRITERIA — each suggested swap must:
- Be available at most grocery stores
- Serve the same culinary function (binding, moisture, sweetness, flavor, texture)
- Be measurably healthier in at least one key macro (fewer calories, less fat, more protein, more fiber)
- Work at the same quantity as the original unless the swap ratio is standard (e.g., applesauce replaces oil 1:1)

MACRO DATA
- Provide accurate macronutrients for the EXACT quantity mentioned in the ingredient (not per 100g)
- If no quantity is specified, use 1 cup as the default serving
- All macro values must be whole numbers
- Required fields: calories, protein (g), fat (g), carbs (g)

REASON FORMAT
One sentence, maximum 15 words. Be specific — mention the actual nutritional improvement.
Good: "Cuts saturated fat from 81g to 1g while adding 12g protein"
Bad: "A healthier and more nutritious option"

OUTPUT FORMAT
Return ONLY valid JSON. No markdown fences, no explanation, no preamble. Any non-JSON output will break the app.

Schema:
{
  "swaps": [
    {
      "original": {
        "ingredient": "ingredient name with quantity, e.g. '2 cups whole milk'",
        "macros": { "calories": 298, "protein": 16, "fat": 16, "carbs": 23 }
      },
      "swap": {
        "ingredient": "swap ingredient with same quantity, e.g. '2 cups unsweetened almond milk'",
        "macros": { "calories": 60, "protein": 2, "fat": 5, "carbs": 2 },
        "reason": "Cuts calories by 80% and fat by 69% with similar texture"
      }
    }
  ]
}

If the input contains no ingredients that benefit from swapping (e.g., already healthy), return: {"swaps": []}`;

export async function analyzeSwaps(input: string): Promise<SwapSuggestion[]> {
  // NOTE: Storing the API key in EXPO_PUBLIC_ exposes it in the JS bundle.
  // For production, proxy this call through a Supabase Edge Function.
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Analyze the following and suggest healthier ingredient swaps:\n\n${input}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    let message = `API request failed (${response.status})`;
    try {
      const err = await response.json();
      message = err.error?.message ?? message;
    } catch {
      // ignore parse errors on the error body
    }
    throw new Error(message);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '';

  // Strip accidental markdown code fences Claude occasionally adds
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: { swaps: SwapSuggestion[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Could not parse the AI response. Please try again.');
  }

  if (!Array.isArray(parsed.swaps)) {
    throw new Error('Unexpected response format from AI.');
  }

  return parsed.swaps;
}
