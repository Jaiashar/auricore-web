// app/api/identify-item-manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import { retryWithBackoff } from '@/utils/queryBuilder';
import { findMatchesFromVisionData, generateDisplayTitle } from '@/utils/visionMatchFinder';
import { getFirebaseDb } from '@/utils/config';
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';

/** Create synthetic Vision API result from text description */
async function generateSyntheticVisionData(description: string) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const systemPrompt = `
You are a luxury item analysis system. Generate a JSON structure that mimics Google Vision API results for the described item.
Output only valid JSON with this structure:
{
  "labels": [{"description": "string", "score": number}, ...],
  "bestGuessLabels": ["string", ...],
  "text": "string",
  "logos": [{"description": "string", "score": number}, ...],
  "objects": [{"name": "string", "score": number}, ...],
  "webEntities": [{"description": "string", "score": number}, ...]
}
Extract key features, brands, and attributes from the description and populate each field appropriately.
`;
  
  const userPrompt = `
Item description:
"""${description}"""

Generate synthetic vision data that represents what Google Vision API might return if this item was photographed.
`;

  const response = await retryWithBackoff(() =>
    anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      system: systemPrompt.trim(),
      messages: [{ role: "user", content: userPrompt.trim() }],
      max_tokens: 500,
      temperature: 0.0
    })
  , 2);
  
  const contents = (response as any).content;
  if (!Array.isArray(contents) || contents.length === 0) throw new Error('No content from Claude');
  const text = contents[0].text.trim();
  
  try {
    // Find and parse JSON in the response
    const jsonMatch = text.match(/({[\s\S]*})/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('No valid JSON found in Claude response');
  } catch (err) {
    console.error('Error parsing synthetic vision data:', err);
    // Fallback to a basic structure
    return {
      labels: [
        { description: description.split(' ')[0], score: 0.9 },
        { description: "luxury", score: 0.8 }
      ],
      bestGuessLabels: [description.split(' ')[0]],
      text: description,
      logos: [],
      objects: [],
      webEntities: []
    };
  }
}

/** Reuse same category classifier from photo API */
async function classifyCategoryWithClaude(vision: any): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = `
You are a luxury-item categorization assistant.
Possible categories: watches, handbags, jewelry, sneakers, preciousMetals.
Respond with exactly JSON wrapped in <json> tags:
<json>
{ "category": "handbags" }
</json>`;
  const userPrompt = `
Here is information about a luxury item (in Vision API format):
${JSON.stringify(vision, null, 2)}

Which single category does this item belong to? Return only the JSON object.`;

  const response = await retryWithBackoff(() =>
    anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      system: systemPrompt.trim(),
      messages: [{ role: "user", content: userPrompt.trim() }],
      max_tokens: 50,
      temperature: 0.0
    })
  , 2);

  const contents = (response as any).content;
  if (!Array.isArray(contents) || contents.length === 0) throw new Error('No content from Claude');
  const text = contents[0].text.trim();
  const m = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!m) throw new Error('Claude did not return category JSON');
  return JSON.parse(m[1]).category;
}

/** Fallback category determination (same as photo API) */
function fallbackDetermineCategory(vision: any): string {
  const guesses = [
    ...(vision.bestGuessLabels || []),
    ...(vision.labels?.map((l: any) => l.description) || []),
    ...(vision.webEntities?.map((e: any) => e.description) || []),
    ...(vision.objects?.map((o: any) => o.name) || [])
  ]
    .filter((s): s is string => typeof s === 'string')
    .map(s => s.toLowerCase());

  if (guesses.some(g => ['watch','timepiece','wristwatch'].includes(g)))   return 'watches';
  if (guesses.some(g => ['handbag','purse','bag'].includes(g)))           return 'handbags';
  if (guesses.some(g => ['ring','necklace','jewelry','bracelet'].includes(g))) return 'jewelry';
  if (guesses.some(g => ['sneaker','shoe','running shoe'].includes(g)))    return 'sneakers';
  if (guesses.some(g => ['gold','silver','platinum','bullion','bar'].includes(g))) return 'preciousMetals';
  return 'handbags';
}

/** Extract attributes (same as photo API) */
async function extractAttributesWithClaude(
  itemText: string,
  categoryId: string,
  fieldIds: string[]
): Promise<Record<string,string>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const systemPrompt = `
You are a luxury-item attribute extractor.
Return exactly JSON wrapped in <json> tags
with keys matching the requested field IDs.
Do not include other keys.`;
  const userPrompt = `
Category: ${categoryId}
Fields: ${fieldIds.join(', ')}

Item description:
"""${itemText}"""

Respond with:
<json>
{ ${fieldIds.map(id => `"${id}": ""`).join(', ')} }
</json>`;

  const response = await retryWithBackoff(() =>
    anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      system: systemPrompt.trim(),
      messages: [{ role: 'user', content: userPrompt.trim() }],
      max_tokens: 200,
      temperature: 0.0
    })
  , 2);

  const contents = (response as any).content;
  if (!Array.isArray(contents) || contents.length === 0) throw new Error('No content from Claude');
  const text = contents[0].text;
  const m = text.match(/<json>([\s\S]*?)<\/json>/);
  if (!m) throw new Error('Claude did not return JSON');
  return JSON.parse(m[1]);
}

export async function POST(req: NextRequest) {
  try {
    const db = getFirebaseDb();
    const body = await req.json();
    const { description } = body;
    
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'No description provided' }, { status: 400 });
    }

    // Generate synthetic vision data from the text description
    const visionData = await generateSyntheticVisionData(description);
    
    // Determine category using Claude
    let categoryId: string;
    try {
      categoryId = await classifyCategoryWithClaude(visionData);
    } catch {
      categoryId = fallbackDetermineCategory(visionData);
    }

    // Fetch all categories from Firestore (same as photo API)
    const snap = await getDocs(collection(db, 'categories'));
    const categories: Record<string, { id: string; label: string; fields: any[] }> = {};
    snap.forEach(docSnap => {
      const d = docSnap.data() as any;
      categories[docSnap.id] = { id: docSnap.id, label: d.label, fields: d.fields || [] };
    });

    const categoryData = categories[categoryId] || { id: categoryId, label: categoryId, fields: [] };

    // Find matches using the shared function from visionMatchFinder
    const { item, matches, queryUsed } = await findMatchesFromVisionData(
      visionData,
      categoryId,
      categoryData.fields,
      categories
    );

    // Process matches to add structured attributes (same as photo API)
    const fieldIds = categoryData.fields.map((f: any) => f.id);
    const finalMatches = await Promise.all(matches.map(async match => {
      const text = `${match.title}. ${match.description || ''}`;
      let attrs: Record<string, string>;
      
      try {
        attrs = await extractAttributesWithClaude(text, categoryId, fieldIds);
      } catch {
        attrs = fieldIds.reduce((a, id) => (a[id] = '', a), {} as Record<string, string>);
      }
      
      const displayTitle = generateDisplayTitle(match, attrs, categoryData);
      return { ...match, structuredAttributes: attrs, displayTitle };
    }));

    // Store results in Firebase (same format as photo API)
    const resultId = uuidv4();
    const resultData = {
      matches: finalMatches,
      categoryData,
      item,
      queryUsed,
      inputType: 'manual', // Add this to differentiate from photo inputs
      userDescription: description, // Store the original text
      timestamp: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // Expires in 24 hours
    };

    await setDoc(doc(db, 'analysisResults', resultId), resultData);

    return NextResponse.json({ 
      resultId,
      categoryId,
      // Include a minimal response for immediate feedback
      summary: {
        matchCount: finalMatches.length,
        category: categoryData.label
      }
    });
  } catch (err: any) {
    console.error('Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}