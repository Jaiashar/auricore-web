// src/app/api/identify-item/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import sharp from 'sharp'
import Anthropic from '@anthropic-ai/sdk'
import { retryWithBackoff } from '@/utils/queryBuilder'
import { generateDisplayTitle } from '@/utils/visionMatchFinder'
import { getFirebaseDb } from '@/utils/config'
import { collection, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore'
import { getApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { handlePreciousMetals } from '@/utils/queryBuilder'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

/**
 * Ultra-robust Claude API call function with better JSON handling
 */
async function callClaude(prompt: string, maxTokens: number = 300) {
  try {
    const resp = await retryWithBackoff(
      () => anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0,
      }),
      2
    );
    
    // Extract content safely
    const content = resp.content;
    const text = Array.isArray(content) ? content.map(c => c.text || '').join('') : String(content || '');
    
    // Get only the text within JSON tags using the most robust extraction method
    const jsonRegex = /<json>([\s\S]*?)<\/json>/;
    const jsonMatch = text.match(jsonRegex);
    
    if (!jsonMatch || !jsonMatch[1]) {
      // Try a more flexible approach
      const altRegex = /<json[^>]*>([\s\S]*?)(?:<\/json>|$)/;
      const altMatch = text.match(altRegex);
      
      if (!altMatch || !altMatch[1]) {
        // Last resort: try to find any JSON-like structure
        const bracesMatch = /\{[\s\S]*\}/;
        const potentialJson = text.match(bracesMatch);
        
        if (!potentialJson) {
          console.error('Could not find JSON in Claude response:', text);
          throw new Error('No JSON found in Claude response');
        }
        
        // Try to parse what we found
        try {
          return JSON.parse(potentialJson[0]);
        } catch (e) {
          console.error('Failed to parse extracted JSON-like content:', potentialJson[0]);
          throw new Error('Invalid JSON in Claude response');
        }
      }
      
      // Use the alternative match
      return parseJsonSafely(altMatch[1]);
    }
    
    // Use the standard match
    return parseJsonSafely(jsonMatch[1]);
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

/**
 * Extremely defensive JSON parsing function
 */
function parseJsonSafely(jsonStr: string) {
  // Initial cleanup
  let cleaned = jsonStr.trim();
  
  // Try direct parsing first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Start cleaning more aggressively
    
    // Sometimes Claude adds commentary before or after the JSON
    // Try to extract just the JSON part (anything between outermost { and })
    const jsonPattern = /(\{[\s\S]*\})/;
    const extracted = cleaned.match(jsonPattern);
    
    if (extracted) {
      try {
        return JSON.parse(extracted[1]);
      } catch (e2) {
        // More cleanup needed
      }
    }
    
    // Fix common JSON issues
    
    // 1. Fix unbalanced braces/brackets
    const openBraces = (cleaned.match(/\{/g) || []).length;
    const closeBraces = (cleaned.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      cleaned += '}'.repeat(openBraces - closeBraces);
    }
    
    const openBrackets = (cleaned.match(/\[/g) || []).length;
    const closeBrackets = (cleaned.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      cleaned += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // 2. Remove trailing commas
    cleaned = cleaned.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');
    
    // 3. Fix unquoted property names
    cleaned = cleaned.replace(/(\{|\,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    
    // 4. Fix missing quotes around string values
    cleaned = cleaned.replace(/:(\s*)([a-zA-Z0-9_]+)(\s*)(,|})/g, ':"$2"$3$4');
    
    // 5. Handle terminating characters after valid JSON
    // This is likely causing the "Unexpected non-whitespace character after JSON" errors
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    
    if (lastBrace > lastBracket && lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    } else if (lastBracket > lastBrace && lastBracket !== -1) {
      cleaned = cleaned.substring(0, lastBracket + 1);
    }
    
    // Try parsing again
    try {
      return JSON.parse(cleaned);
    } catch (e3) {
      // If all else fails, construct a minimal valid object as fallback
      console.error('All JSON parsing methods failed for:', jsonStr);
      console.error('Cleaned version:', cleaned);
      console.error('Parse error:', e3);
      
      // Return a minimal valid response based on the context
      if (cleaned.includes('"category"')) {
        return { category: "handbags" }; // Default category
      } else if (cleaned.includes('"filtered"')) {
        return { filtered: [] };
      } else if (cleaned.includes('"unique"')) {
        return { unique: [] };
      } else if (cleaned.includes('"bestIdx"')) {
        return { bestIdx: 0 };
      }
      
      // Generic fallback
      return {};
    }
  }
}

/** Fallback category determination */
function determineCategory(vision: any): string {
  const guesses = [
    ...(vision.bestGuessLabels || []),
    ...(vision.labels?.map((l: any) => l.description) || []),
    ...(vision.webEntities?.map((e: any) => e.description) || []),
    ...(vision.objects?.map((o: any) => o.name) || []),
  ].filter(Boolean).map(s => String(s).toLowerCase());

  if (guesses.some(g => ['watch','timepiece','wristwatch'].includes(g))) return 'watches';
  if (guesses.some(g => ['handbag','purse','bag'].includes(g))) return 'handbags';
  if (guesses.some(g => ['ring','necklace','jewelry','bracelet'].includes(g))) return 'jewelry';
  if (guesses.some(g => ['sneaker','shoe','running shoe'].includes(g))) return 'sneakers';
  if (guesses.some(g => ['gold','silver','platinum','bullion','bar'].includes(g))) return 'preciousMetals';
  return 'handbags';
}

/** Identify item from image URL */
async function identifyItem(imageUrl: string) {
  // Search using SerpAPI
  const { data } = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'google_lens',
      url: imageUrl,
      hl: 'en',
      country: 'us',
      api_key: process.env.SERPAPI_KEY!,
    },
  });

  // Extract matches
  let rawMatches = data.visual_matches || [];
  if (data.products_page_token) {
    const prod = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_lens',
        page_token: data.products_page_token,
        hl: 'en',
        country: 'us',
        api_key: process.env.SERPAPI_KEY!,
      },
    });
    rawMatches = prod.data.products || rawMatches;
  }

  // Format matches
  const serpMatches = rawMatches
    .map((m: any) => ({
      title: m.title,
      link: m.link,
      thumbnail: m.thumbnail || m.image || '',
      thumbnail_width: m.thumbnail_width || m.image_width || 0,
      thumbnail_height: m.thumbnail_height || m.image_height || 0,
      source: m.source,
      price: m.price?.extracted_value ?? parseFloat(m.price?.value || ''),
      currency: m.price?.currency ?? null,
      in_stock: m.in_stock ?? null,
      condition: m.condition ?? null,
      rating: m.rating ?? null,
      reviews: m.reviews ?? null,
    }))
    .filter((m: { price: any }) => typeof m.price === 'number')
    .slice(0, 10); // Limit to 10 matches to prevent API issues

  // Create vision data
  const visionData = {
    labels: serpMatches.map((m: { title: any }, i: number) => ({ description: m.title, score: 1 - i * 0.1 })),
    bestGuessLabels: data.best_guess ? [data.best_guess] : [],
    _source: 'serp_api',
  };

  // Create search query
  const topTitle = serpMatches[0]?.title || '';
  const rawQuery = topTitle.split(/[-|]/)[0].trim();
  const searchQuery = rawQuery || data.best_guess || determineCategory(visionData);

  // Determine category
  let category;
  try {
    // Simpler prompt to reduce parsing issues
    const prompt = `
You are a luxury-item categorization assistant. Look at this data and determine the item category.
Choose only from: watches, handbags, jewelry, sneakers, preciousMetals.

Data: ${JSON.stringify(visionData, null, 2)}

Reply with ONLY a JSON object like this (no explanation needed):
<json>
{ "category": "category_name_here" }
</json>`;

    const result = await callClaude(prompt, 100);
    category = result.category;
    
    if (!category || !['watches', 'handbags', 'jewelry', 'sneakers', 'preciousMetals'].includes(category)) {
      throw new Error('Invalid category result');
    }
  } catch (error) {
    console.error('Category classification failed:', error);
    category = determineCategory(visionData);
  }

  return { visionData, category, searchQuery, serpMatches };
}

/** Extract attributes from matches */
async function extractAttributes(matches: any[], categoryId: string, fieldIds: string[]) {
  if (matches.length === 0 || fieldIds.length === 0) return [];
  
  // Limit matches to prevent token overflow
  const limitedMatches = matches.slice(0, 6);
  
  try {
    // Simplified prompt to reduce JSON errors
    const prompt = `
You are a luxury item attribute extractor. Extract these attributes: ${fieldIds.join(', ')}.
For these items: ${JSON.stringify(limitedMatches.map((m, i) => ({ 
  idx: i, 
  title: m.title || ""
})), null, 2)}

Reply with ONLY this JSON format, no explanation:
<json>
{
  "filtered": [
    { "idx": 0, ${fieldIds.map(id => `"${id}": "value"`).join(', ')} }
  ]
}
</json>

Use "N/A" for unknown values.`;

    const result = await callClaude(prompt, 800);
    
    if (!result.filtered || !Array.isArray(result.filtered)) {
      throw new Error('Invalid filtered array in response');
    }
    
    // Validate items
    return result.filtered
      .filter((item: { idx: string }) => typeof item.idx === 'number' || !isNaN(parseInt(item.idx)))
      .map((item: { idx: string }) => ({
        ...item,
        idx: typeof item.idx === 'number' ? item.idx : parseInt(item.idx)
      }));
  } catch (error) {
    console.error('Attribute extraction failed:', error);
    
    // Fallback: return minimal items with empty attributes
    return limitedMatches.slice(0, 3).map((_, i) => {
      const item: any = { idx: i };
      fieldIds.forEach(id => item[id] = 'N/A');
      return item;
    });
  }
}

/** Deduplicate items */
async function deduplicateItems(items: any[]) {
  if (items.length <= 3) return items.map(item => ({ idx: item.idx }));
  
  try {
    // Simplified prompt
    const prompt = `
Find unique items from this list. Group by brand and model.
Items: ${JSON.stringify(items.map(i => ({
  idx: i.idx,
  brand: i.structuredAttributes.brand || '',
  modelName: i.structuredAttributes.modelName || ''
})), null, 2)}

Reply with ONLY this JSON format, no explanation:
<json>
{ "unique": [ { "idx": 0 } ] }
</json>`;

    const result = await callClaude(prompt, 200);
    
    if (!result.unique || !Array.isArray(result.unique)) {
      throw new Error('Invalid unique array in response');
    }
    
    return result.unique.map((item: { idx: string }) => ({
      idx: typeof item.idx === 'number' ? item.idx : parseInt(item.idx)
    }));
  } catch (error) {
    console.error('Deduplication failed:', error);
    // Return all items as fallback
    return items.map(item => ({ idx: item.idx }));
  }
}

/** Rank thumbnails by quality */
async function rankThumbnails(items: any[]) {
  if (items.length <= 1) return 0;
  
  try {
    // Simplified prompt
    const prompt = `
Select image with highest quality (largest width × height).
Images: ${JSON.stringify(items.map(i => ({
  idx: i.idx,
  width: i.thumbnail_width || 0,
  height: i.thumbnail_height || 0
})), null, 2)}

Reply with ONLY this JSON, no explanation:
<json>
{ "bestIdx": 0 }
</json>`;

    const result = await callClaude(prompt, 100);
    
    if (typeof result.bestIdx !== 'number' && isNaN(parseInt(String(result.bestIdx)))) {
      throw new Error('Invalid bestIdx in response');
    }
    
    return typeof result.bestIdx === 'number' ? 
      result.bestIdx : 
      parseInt(String(result.bestIdx));
  } catch (error) {
    console.error('Thumbnail ranking failed:', error);
    // Return first item as fallback
    return 0;
  }
}

/** Main route handler */
export async function POST(req: NextRequest) {
  try {
    // Get database and form data
    const db = getFirebaseDb();
    const form = await req.formData();
    const imageField = form.get('image');

    // Validate image upload
    if (!imageField || typeof (imageField as Blob).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // Get image buffer
    const rawBuffer = Buffer.from(await (imageField as Blob).arrayBuffer());
    const buf = ['image/avif','image/heic','image/heif'].includes((imageField as any).type)
      ? await sharp(rawBuffer).jpeg().toBuffer()
      : rawBuffer;

    // Upload to Firebase
    const id = uuidv4();
    const storage = getStorage(getApp());
    const imgRef = ref(storage, `lensImages/${id}.jpg`);
    await uploadBytes(imgRef, buf, { contentType: 'image/jpeg' });
    const imageUrl = await getDownloadURL(imgRef);

    // Identify item
    let category, searchQuery, serpMatches;
    try {
      const result = await identifyItem(imageUrl);
      category = result.category;
      searchQuery = result.searchQuery;
      serpMatches = result.serpMatches;
    } catch (error) {
      console.error('Item identification failed:', error);
      // Fallback values
      category = 'handbags';
      searchQuery = 'luxury handbag';
      serpMatches = [];
    }
    
    // Get category fields
    const catSnap = await getDocs(collection(db, 'categories'));
    const categories: Record<string, any> = {};
    catSnap.forEach(d => {
      const dt = d.data() as any;
      categories[d.id] = { id: d.id, label: dt.label, fields: dt.fields || [] };
    });
    
    const categoryData = categories[category] || { id: category, label: category, fields: [] };
    const fieldIds = categoryData.fields.map((f: any) => f.id);

    // Build basic matches if we have none
    if (serpMatches.length === 0) {
      serpMatches = [{
        title: 'Luxury Item',
        link: '#',
        thumbnail: '',
        thumbnail_width: 0,
        thumbnail_height: 0,
        source: 'fallback',
        price: 0,
        currency: 'USD',
        in_stock: null,
        condition: null,
        rating: null,
        reviews: null
      }];
    }

    // Extract attributes from matches
    let extractedItems = [];
    try {
      extractedItems = await extractAttributes(serpMatches, category, fieldIds);
    } catch (error) {
      console.error('Attribute extraction error:', error);
      // Fallback extraction
      extractedItems = serpMatches.slice(0, 3).map((_: any, i: any) => {
        const item: any = { idx: i };
        fieldIds.forEach((id: string | number) => item[id] = 'N/A');
        return item;
      });
    }
    
    // Build matches with attributes
    let finalMatches = extractedItems.map((item: { [x: string]: any; idx: string | number }) => {
      const src = serpMatches[item.idx];
      if (!src) return null;
      
      // Process attributes
      const attrs: Record<string, string> = {};
      for (const id of fieldIds) {
        const value = String(item[id] || '').trim();
        if (value && !['n/a', 'unknown', 'not available', 'unavailable'].includes(value.toLowerCase())) {
          attrs[id] = value;
        }
      }
      
      return {
        ...src,
        structuredAttributes: attrs,
        displayTitle: generateDisplayTitle(src, attrs, categoryData),
        idx: item.idx,
        thumbnail_width: src.thumbnail_width || 0,
        thumbnail_height: src.thumbnail_height || 0,
      };
    }).filter(Boolean);

    // Ensure we have matches
    if (finalMatches.length === 0) {
      finalMatches = serpMatches.slice(0, 3).map((src: { title: any; thumbnail_width: any; thumbnail_height: any }, idx: any) => {
        const attrs: Record<string, string> = {};
        return {
          ...src,
          structuredAttributes: attrs,
          displayTitle: src.title || categoryData.label,
          idx,
          thumbnail_width: src.thumbnail_width || 0,
          thumbnail_height: src.thumbnail_height || 0,
        };
      });
    }

    // Skip deduplication and ranking if we have few matches
    if (finalMatches.length > 3) {
      // Deduplicate matches
      try {
        const uniqueIndices = await deduplicateItems(finalMatches);
        if (uniqueIndices.length > 0) {
          finalMatches = finalMatches.filter((m: { idx: any }) => uniqueIndices.some((u: { idx: any }) => u.idx === m.idx));
        }
      } catch (error) {
        console.error('Deduplication error:', error);
      }

      // Ensure we still have matches
      if (finalMatches.length === 0) {
        finalMatches = serpMatches.slice(0, 3).map((src: { title: any; thumbnail_width: any; thumbnail_height: any }, idx: any) => {
          return {
            ...src,
            structuredAttributes: {},
            displayTitle: src.title || categoryData.label,
            idx,
            thumbnail_width: src.thumbnail_width || 0,
            thumbnail_height: src.thumbnail_height || 0,
          };
        });
      }

      // Rank thumbnails
      try {
        const bestIdx = await rankThumbnails(finalMatches);
        finalMatches.sort((a: { idx: any }, b: { idx: any }) => a.idx === bestIdx ? -1 : (b.idx === bestIdx ? 1 : 0));
      } catch (error) {
        console.error('Thumbnail ranking error:', error);
      }
    }

    // Handle precious metals special case
    if (category === 'preciousMetals' && finalMatches.length === 0) {
      try {
        finalMatches = await handlePreciousMetals({ category, dynamicFields: {} });
      } catch (error) {
        console.error('Precious metals error:', error);
        finalMatches = [{
          title: 'Gold Bullion',
          link: '#',
          thumbnail: '',
          thumbnail_width: 0,
          thumbnail_height: 0,
          source: 'fallback',
          price: 0,
          currency: 'USD',
          in_stock: null,
          condition: null,
          rating: null,
          reviews: null,
          structuredAttributes: {},
          displayTitle: 'Gold Bullion',
          idx: 0
        }];
      }
    }

    // Save results
    const resultId = uuidv4();
    const prevRef = ref(storage, `analysisImages/${resultId}.jpg`);
    await uploadBytes(prevRef, buf, { contentType: 'image/jpeg' });
    const previewUrl = await getDownloadURL(prevRef);

    await setDoc(doc(db, 'analysisResults', resultId), {
      matches: JSON.parse(JSON.stringify(finalMatches)),
      categoryData,
      item: { category, dynamicFields: {} },
      queryUsed: searchQuery,
      imageUrl: previewUrl,
      timestamp: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 86400_000)),
    });

    // Return result
    return NextResponse.json({
      resultId,
      previewUrl,
      summary: {
        matchCount: finalMatches.length,
        category: categoryData.label,
        identifiedAs:
          finalMatches[0]?.structuredAttributes.brand
            ? `${finalMatches[0].structuredAttributes.brand} ${finalMatches[0].structuredAttributes.modelName || ''}`.trim()
            : categoryData.label,
      },
    });
  } catch (err: any) {
    console.error('identify-item error:', err);
    return NextResponse.json({ 
      error: err.message || 'An unexpected error occurred',
      fallbackSummary: {
        matchCount: 0,
        category: 'Unknown',
        identifiedAs: 'Unknown item'
      }
    }, { status: 500 });
  }
}