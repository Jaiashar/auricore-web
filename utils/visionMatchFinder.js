import {
    buildLooseQuery,
    fetchInitialMatches,
    enhanceMatchesWithClaude,
    ensureDistinctResults,
    handlePreciousMetals
  } from '@/utils/queryBuilder';
  import { retryWithBackoff } from '@/utils/queryBuilder';
  import Anthropic from '@anthropic-ai/sdk';
  
  /**
   * Call Google Vision API to extract core details (used on server-side)
   */
  async function extractAttributesFromVision(visionData, categoryId, fieldIds) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
    const systemPrompt = `
  You are a luxury-item attribute extractor.
  Given a Google Vision API JSON result and a list of fields,
  return exactly a JSON object wrapped in <json> tags,
  with keys = fieldIds and string values.
  Do NOT include anything else.
  `;
  
    const userPrompt = `
  Category: ${categoryId}
  Fields: ${fieldIds.join(', ')}
  
  Vision data (JSON):
  ${JSON.stringify(visionData, null, 2)}
  
  Respond with:
  
  <json>
  {
    ${fieldIds.map(id => `"${id}": ""`).join(',\n    ')}
  }
  </json>
  `;
  
    const response = await retryWithBackoff(
      () => anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        system: systemPrompt.trim(),
        messages: [{ role: 'user', content: userPrompt.trim() }],
        max_tokens: 200,
        temperature: 0.0
      }),
      2
    );
  
    const contents = response.content;
    if (!Array.isArray(contents) || contents.length === 0) {
      console.error('extractAttributesFromVision: unexpected response', response);
      throw new Error('No content returned from Claude');
    }
    const text = contents[0].text;
    const m = text.match(/<json>([\s\S]*?)<\/json>/);
    if (!m) {
      console.error('extractAttributesFromVision: missing JSON tags', text);
      throw new Error('Claude did not return valid JSON');
    }
    try {
      return JSON.parse(m[1]);
    } catch (e) {
      console.error('extractAttributesFromVision: JSON parse error', e, m[1]);
      throw new Error('Failed to parse JSON from Claude');
    }
  }
  
  /**
   * Main vision-to-matches flow
   */
  export async function findMatchesFromVisionData(
    visionData,
    categoryId,
    categoryFields,
    categories
  ) {
    try {
      if (categoryId === 'preciousMetals') {
        const metalType = visionData.labels.find(l => /gold|silver|platinum|palladium/i.test(l.description))?.description || 'gold';
        const form = visionData.labels.find(l => /bar|coin|round|ingot/i.test(l.description))?.description || 'bar';
        const simplified = { category: 'preciousMetals', dynamicFields: { metalType, form } };
        const matches = await handlePreciousMetals(simplified);
        return { item: simplified, matches, queryUsed: 'precious-metals-display' };
      }
  
      const fieldIds = categoryFields.map(f => f.id);
      const attrs = await extractAttributesFromVision(visionData, categoryId, fieldIds);
  
      const syntheticItem = { category: categoryId, dynamicFields: { ...attrs } };
      const weights = categories[categoryId]?.parameterWeights || [];
      const query = buildLooseQuery(syntheticItem, weights);
  
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
  
      try {
        const enhanced = await enhanceMatchesWithClaude(matches, syntheticItem);
        matches = enhanced.length > 0 ? ensureDistinctResults(enhanced, 8) : matches.slice(0, 8);
      } catch (e) {
        console.error('Claude enhancement failed:', e);
        matches = matches.slice(0, 8);
      }
  
      return { item: syntheticItem, matches, queryUsed: query };
    } catch (error) {
      console.error('Error in findMatchesFromVisionData:', error);
      throw error;
    }
  }
  
  /**
   * Use your server-side Claude extraction API for client-side formatting
   */
  async function extractAttributesWithClaude(match, categoryFields, categoryData) {
    try {
      const res = await fetch('/api/extract-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match, categoryFields, categoryData })
      });
      if (!res.ok) {
        console.warn('Attribute extraction failed', await res.text());
        return categoryFields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {});
      }
      return await res.json();
    } catch (e) {
      console.error('extractAttributesWithClaude error:', e);
      return categoryFields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {});
    }
  }
  
  /**
   * Generate a display title from attributes
   */
  export function generateDisplayTitle(match, attributes, categoryData) {
    if (attributes.brand && attributes.modelName) {
      let title = `${attributes.brand} ${attributes.modelName}`;
      switch (categoryData.id) {
        case 'watches':
          if (attributes.caseMaterial) title += ` ${attributes.caseMaterial}`;
          if (attributes.yearManufacture) title += ` (${attributes.yearManufacture})`;
          break;
        case 'handbags':
          if (attributes.size) title += ` ${attributes.size}`;
          if (attributes.material) title += ` ${attributes.material}`;
          if (attributes.color) title += ` in ${attributes.color}`;
          break;
        case 'jewelry':
          if (attributes.material) title += ` ${attributes.material}`;
          if (attributes.gemstoneType) title += ` with ${attributes.gemstoneType}`;
          break;
        case 'sneakers':
          if (attributes.colorway) title += ` "${attributes.colorway}"`;
          if (attributes.size) title += ` Size ${attributes.size}`;
          break;
      }
      return title;
    }
    if (match.title && match.title.includes(' x ')) return match.title;
    if (match.title) return match.title.replace(/^Men's\s+/, '').replace(/^Women's\s+/, '').replace(/\s+\d+\.?\d*\s*US$/, '').trim();
    return 'Unknown Item';
  }
  
  /**
   * Format matches for display with your extraction API
   */
  /**
   * Format matches for display with NLP and category awareness
   *
   * @param {Array} matches - Array of suggested matches
   * @param {Object} categories - Categories data from Firebase
   * @returns {Array} - Matches with formatted display titles and structured attributes
   */
  export async function formatMatchesForDisplay(matches, categories) {
      if (!Array.isArray(matches) || matches.length === 0) return [];
  
      // Process first 3 matches immediately (visible on screen)
      const priorityMatches = matches.slice(0, 3);
      const remainingMatches = matches.slice(3);
  
      // Process priority matches immediately
      const formattedPriorityMatches = await Promise.all(priorityMatches.map(async match => {
          const originalItem = match.originalItem || {};
          const categoryId = originalItem.category;
          const categoryData = categories[categoryId];
          const fields = categoryData?.fields || [];

          if (fields.length === 0) {
            return matches.map(match => ({
              ...match,
              displayTitle: match.title || 'Unknown Item',
              structuredAttributes: {}
            }));
          }
  
          // Extract attributes using your server-side API
          const attributes = await extractAttributesWithClaude(match, fields, categoryData);
  
          // Generate display title
          const displayTitle = generateDisplayTitle(match, attributes, categoryData);
  
          return {
              ...match,
              displayTitle,
              structuredAttributes: attributes
          };
      }));
  
      // Process remaining matches in batches to avoid overwhelming the API
      const batchSize = 4;
      let formattedRemainingMatches = [];
  
      for (let i = 0; i < remainingMatches.length; i += batchSize) {
          const batch = remainingMatches.slice(i, i + batchSize);
          const formattedBatch = await Promise.all(batch.map(async match => {
              const originalItem = match.originalItem || {};
              const categoryId = originalItem.category;
              const categoryData = categories[categoryId];
              const fields = categoryData?.fields || [];
  
              // Extract attributes via your API
              let attributes = {};
  
              try {
                  attributes = await extractAttributesWithClaude(match, fields, categoryData);
              } catch (err) {
                  console.error('Attribute extraction error:', err);
                  // Fallback to empty values
                  fields.forEach(field => {
                      attributes[field.id] = '';
                  });
              }
  
              const displayTitle = generateDisplayTitle(match, attributes, categoryData);
  
              return {
                  ...match,
                  displayTitle,
                  structuredAttributes: attributes
              };
          }));
  
          formattedRemainingMatches = [...formattedRemainingMatches, ...formattedBatch];
      }
  
      return [...formattedPriorityMatches, ...formattedRemainingMatches];
  }
  
  export { extractAttributesFromVision, extractAttributesWithClaude };
  