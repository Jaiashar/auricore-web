/**
 * Utility functions for Claude Vision-based product identification
 */
import Anthropic from '@anthropic-ai/sdk';
import { retryWithBackoff, fetchInitialMatches, enhanceMatchesWithClaude, ensureDistinctResults } from '@/utils/queryBuilder';

/**
 * Extract detailed product attributes directly from an image using Claude Vision
 * @param {Buffer} imageBuffer - Raw image buffer or base64 string
 * @param {string} categoryHint - Optional category hint (watches, handbags, etc.)
 * @returns {Promise<Object>} - Detailed product information
 */
export async function extractProductDetailsFromImage(imageBuffer, categoryHint = null) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  // Convert buffer to base64 if not already a string
  const base64Image = typeof imageBuffer === 'string' 
    ? imageBuffer 
    : imageBuffer.toString('base64');
  
  // Create specialized system prompt based on product categories
  const systemPrompt = `
You are a luxury product identification expert with deep knowledge of high-end watches, handbags, jewelry, sneakers, and precious metals.
Your task is to precisely identify the exact product shown in the image, providing comprehensive and accurate details.

${categoryHint ? `The user has indicated this might be a ${categoryHint} item.` : ''}

Focus on these details for each category:

WATCHES:
- Brand (e.g., Rolex, Omega, Patek Philippe)
- Exact model name and reference number if visible
- Case material (steel, gold, titanium, etc.)
- Movement type (automatic, manual, quartz)
- Dial color and features
- Bezel type
- Bracelet/strap material
- Approximate year if identifiable

HANDBAGS:
- Brand (e.g., Louis Vuitton, Chanel, Hermès)
- Exact model name and style number if visible
- Material (leather type, canvas, fabric)
- Size category (mini, small, medium, large)
- Color(s)
- Hardware color and type
- Special edition or collection details

JEWELRY:
- Type (ring, necklace, bracelet, earrings)
- Brand if identifiable
- Metal (gold, silver, platinum)
- Gemstone type and approximate carat if applicable
- Setting style
- Design elements

SNEAKERS:
- Brand (e.g., Nike, Adidas, New Balance)
- Exact model name and style code if visible (e.g. "Air Jordan 1" or "Dunk High")
- Colorway description (use official colorway name if recognizable)
- Release year if identifiable
- Special edition or collaboration details
- Size if visible
- Materials (leather, suede, canvas, etc.)
- Gender (Men's, Women's) if applicable
- Any distinguishing features or technology

PRECIOUS METALS:
- Metal type (gold, silver, platinum, palladium)
- Form (bar, coin, round, ingot)
- Weight if discernible
- Purity/fineness if visible (e.g., 999, 24K)
- Mint/manufacturer if identifiable
- Any distinctive markings

First determine which category the item belongs to, then provide the specific details relevant to that category.
Respond with exactly a JSON object wrapped in <json> tags with the following structure:

<json>
{
  "category": "watches|handbags|jewelry|sneakers|preciousMetals",
  "attributes": {
    // Include all relevant attributes for the identified category
    // Use consistent key names that match the expected fields
    "brand": "",
    "modelName": "",
    // Additional attributes specific to the category...
  },
  "searchQuery": "optimized search query with key details to find this exact item",
  "confidence": 0.95 // Your confidence score from 0-1
}
</json>
`;

  try {
    const response = await retryWithBackoff(() =>
      anthropic.messages.create({
        model: "claude-3-opus-20240229", // Using most capable model for best identification
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: base64Image
                }
              },
              {
                type: "text",
                text: "Identify this luxury item with as much specific detail as possible. Give me the exact brand, model, and details that would help find matching products."
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Lower temperature for more precise identification
      })
    , 3); // 3 retries

    // Extract and parse JSON response
    const contents = response.content;
    if (!Array.isArray(contents) || contents.length === 0) {
      throw new Error('No content returned from Claude');
    }
    
    // Filter to text content
    const textContents = contents.filter(content => content.type === 'text');
    if (textContents.length === 0) {
      throw new Error('No text content in Claude response');
    }
    
    const text = textContents[0].text;
    const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/);
    
    if (!jsonMatch) {
      throw new Error('Claude did not return valid JSON');
    }
    
    try {
      const result = JSON.parse(jsonMatch[1]);
      console.log('Claude identified item:', JSON.stringify(result, null, 2));
      return result;
    } catch (e) {
      console.error('Failed to parse JSON from Claude:', e, jsonMatch[1]);
      throw new Error('Failed to parse JSON from Claude');
    }
  } catch (error) {
    console.error('Error calling Claude Vision API:', error);
    throw error;
  }
}

/**
 * Convert Claude Vision results to a format compatible with the existing system
 * @param {Object} claudeResults - Results from Claude Vision analysis
 * @returns {Object} - Vision data in a format compatible with existing functions
 */
export function convertClaudeResultsToVisionData(claudeResults) {
  // Create structure compatible with the rest of the pipeline
  const { category, attributes, searchQuery, confidence } = claudeResults;
  
  // Create a synthetic visionData object that mimics what we'd get from Google Vision API
  const visionData = {
    labels: [
      // Convert attributes to labels for compatibility
      { description: category, score: confidence },
      { description: attributes.brand || "", score: confidence },
      { description: attributes.modelName || "", score: confidence }
    ],
    text: '', // Empty text field as a fallback
    logos: [],
    objects: [],
    webEntities: [],
    // Include the detailed structured data directly
    claudeAttributes: attributes,
    // Include Claude's search query suggestion
    claudeSearchQuery: searchQuery,
    // For debugging
    _source: "claude_vision"
  };
  
  // Add any color info as a label if available
  if (attributes.color) {
    visionData.labels.push({ description: attributes.color, score: confidence });
  }
  
  // Add any material info as a label if available
  if (attributes.material) {
    visionData.labels.push({ description: attributes.material, score: confidence });
  }
  
  // Add style code as a label if available (especially useful for sneakers)
  if (attributes.styleCode) {
    visionData.labels.push({ description: attributes.styleCode, score: confidence });
  }
  
  return { visionData, category };
}

/**
 * Find product matches based on Claude Vision analysis
 * @param {Object} claudeResults - Results from Claude Vision analysis
 * @param {Object} categories - Category definitions from database
 * @returns {Promise<Object>} - Matching results
 */
export async function findMatchesFromClaudeVision(claudeResults, categories) {
  try {
    const { category, attributes, searchQuery, confidence } = claudeResults;
    
    // Create synthetic item from Claude's attributes
    const syntheticItem = { 
      category, 
      dynamicFields: attributes 
    };
    
    // Use recommended search query from Claude if available
    const query = searchQuery || buildQueryFromAttributes(attributes, category);
    console.log(`Generated query from Claude Vision: ${query}`);
    
    // Special case for precious metals
    if (category === 'preciousMetals') {
      // Handle precious metals differently
      const { handlePreciousMetals } = require('@/utils/queryBuilder');
      const metalMatches = await handlePreciousMetals(syntheticItem);
      return { 
        item: syntheticItem, 
        matches: metalMatches, 
        queryUsed: query 
      };
    }
    
    // Fetch initial matches
    const serpResults = await fetchInitialMatches(query);
    
    let matches = serpResults
      .filter(r => r.extracted_price || r.price)
      .slice(0, 15)
      .map(r => ({
        title: r.title,
        image: r.thumbnail || r.image || null,
        link: r.link,
        source: r.source || 'Unknown',
        queryUsed: query,
        originalItem: syntheticItem
      }));
    
    console.log(`Found ${matches.length} initial matches`);
    
    // Enhance matches with additional Claude analysis
    try {
      console.log('Enhancing matches with Claude...');
      const enhanced = await enhanceMatchesWithClaude(matches, syntheticItem);
      matches = enhanced.length > 0 ? ensureDistinctResults(enhanced, 8) : matches.slice(0, 8);
      console.log(`Enhanced to ${matches.length} distinct matches`);
    } catch (e) {
      console.error('Claude enhancement failed:', e);
      matches = matches.slice(0, 8);
    }
    
    return { 
      item: syntheticItem, 
      matches, 
      queryUsed: query,
      claudeResults // Include the original Claude analysis
    };
  } catch (error) {
    console.error('Error in findMatchesFromClaudeVision:', error);
    throw error;
  }
}

/**
 * Generate a display title based on Claude-detected attributes
 * @param {Object} match - The match object
 * @param {Object} attributes - Attributes detected by Claude
 * @param {Object} categoryData - Category definition data
 * @returns {string} - Formatted display title
 */
export function generateDisplayTitleFromClaude(match, attributes, categoryData) {
  if (!attributes) return match.title || 'Unknown Item';
  
  // Start with brand and model if available
  if (attributes.brand && attributes.modelName) {
    let title = `${attributes.brand} ${attributes.modelName}`;
    
    // Add category-specific details
    switch (categoryData.id) {
      case 'watches':
        if (attributes.caseMaterial) title += ` ${attributes.caseMaterial}`;
        if (attributes.dialColor) title += ` ${attributes.dialColor} Dial`;
        if (attributes.yearManufacture) title += ` (${attributes.yearManufacture})`;
        break;
        
      case 'handbags':
        if (attributes.size) title += ` ${attributes.size}`;
        if (attributes.material) title += ` ${attributes.material}`;
        if (attributes.color) title += ` in ${attributes.color}`;
        break;
        
      case 'jewelry':
        if (attributes.metalType) title += ` ${attributes.metalType}`;
        if (attributes.gemstoneType) title += ` with ${attributes.gemstoneType}`;
        break;
        
      case 'sneakers':
        // For sneakers, include the style code if available as it's most specific
        if (attributes.styleCode) title += ` ${attributes.styleCode}`;
        else if (attributes.colorway) title += ` "${attributes.colorway}"`;
        if (attributes.releaseYear) title += ` (${attributes.releaseYear})`;
        break;
        
      case 'preciousMetals':
        if (attributes.purity) title += ` ${attributes.purity}`;
        if (attributes.weight) title += ` ${attributes.weight}`;
        break;
    }
    
    return title;
  }
  
  // Fallbacks if brand/model not available
  if (match.title) {
    return match.title
      .replace(/^Men's\s+/, '')
      .replace(/^Women's\s+/, '')
      .replace(/\s+\d+\.?\d*\s*US$/, '')
      .trim();
  }
  
  return 'Unknown Item';
}

/**
 * Build an optimized search query from Claude-extracted attributes
 * This is a fallback if Claude doesn't provide a search query
 */
function buildQueryFromAttributes(attributes, category) {
  const queryParts = [];
  
  // Add brand as highest priority if available
  if (attributes.brand) {
    queryParts.push(attributes.brand);
  }
  
  // Add model name as second highest priority
  if (attributes.modelName) {
    queryParts.push(attributes.modelName);
  }
  
  // Add category-specific attributes
  switch (category) {
    case 'watches':
      if (attributes.caseMaterial) queryParts.push(attributes.caseMaterial);
      if (attributes.dialColor) queryParts.push(attributes.dialColor);
      break;
      
    case 'handbags':
      if (attributes.material) queryParts.push(attributes.material);
      if (attributes.color) queryParts.push(attributes.color);
      if (attributes.size) queryParts.push(attributes.size);
      break;
      
    case 'jewelry':
      if (attributes.metalType) queryParts.push(attributes.metalType);
      if (attributes.gemstoneType) queryParts.push(attributes.gemstoneType);
      break;
      
    case 'sneakers':
      if (attributes.colorway) queryParts.push(attributes.colorway);
      // If we have style code, use it - often most specific
      if (attributes.styleCode) {
        // For Nike, style codes are super specific (e.g. "DQ7645-001")
        return `${attributes.brand} ${attributes.styleCode}`;
      }
      break;
      
    case 'preciousMetals':
      if (attributes.metalType) queryParts.push(attributes.metalType);
      if (attributes.form) queryParts.push(attributes.form);
      break;
  }
  
  // Limit query to most important parts (3-4 terms max)
  return queryParts.slice(0, 4).join(' ');
}

export { retryWithBackoff };