// Add these imports at the top
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * Fetch initial matches for an item
 * @param {string} query - Search query to use
 * @returns {Promise<Array>} - Initial search results
 */
async function fetchInitialMatches(query) {
    try {
        const response = await fetchSerpApiPage(query);

        // Extract and combine all shopping results
        const results = [];

        // Process shopping results
        if (response.data.shopping_results && Array.isArray(response.data.shopping_results)) {
            results.push(...response.data.shopping_results);
        }

        // Process related shopping results
        if (response.data.related_shopping_results && Array.isArray(response.data.related_shopping_results)) {
            results.push(...response.data.related_shopping_results);
        }

        return results;
    } catch (error) {
        console.error(`Error fetching initial matches for "${query}":`, error);
        return [];
    }
}

const fetchSerpApiPage = async (query, startIndex = null) => {
    const SERPAPI_KEY = process.env.SERPAPI_KEY || '';

    // Define the params properly
    const params = {
        api_key: SERPAPI_KEY,
        engine: 'google_shopping',
        q: query,
        google_domain: 'google.com',
        gl: 'us', // US results only
        hl: 'en',
        no_cache: 'false',
        num: 100 // Maximum results per page
    };

    // Add pagination parameter if provided
    if (startIndex) {
        params.start = startIndex;
    }

    // Add timeout options to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
        console.log(`Fetching SerpAPI with query: ${query}`);
        const response = await axios.get('https://serpapi.com/search.json', {
            params: params,
            signal: controller.signal,
            timeout: 15000 // Axios timeout option
        });
        clearTimeout(timeoutId);
        console.log(`SerpAPI response received with status: ${response.status}`);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`SerpAPI fetch failed: ${error.message}`);
        return { data: { shopping_results: [], serpapi_pagination: null } };
    }
};

/**
 * Streamlines match data to include only necessary fields
 * This function removes unnecessary fields and standardizes the data structure
 * Price is intentionally omitted as it will be recalculated later
 *
 * @param {Object} match - The match object to streamline
 * @param {Object} item - The original item being searched for
 * @returns {Object} - Streamlined match data
 */
function streamlineMatchData(match, item) {
    // Return a clean object with only the fields we need, excluding price
    return {
        title: match.title || '',
        image: match.image || null,
        link: match.link || null,
        source: match.source || 'Unknown',
        matchScore: match.matchScore || 0,
        queryUsed: match.queryUsed || ''
    };
}

/**
 * Retry a function with exponential backoff
 * Specifically handling Anthropic 529 overloaded errors
 *
 * @param {Function} fn - The function to retry
 * @param {number} retries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @returns {Promise<any>} - Result of the function
 */
async function retryWithBackoff(fn, retries = 5, initialDelay = 1000, maxDelay = 10000) {
    let delay = initialDelay;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            // Check if it's an Anthropic 529 error
            const isOverloaded =
                (err.status === 529) ||
                (err.response?.status === 529) ||
                (err.message?.includes('overloaded')) ||
                (err.error?.type === 'overloaded_error');

            // If it's not an overloaded error or it's the last retry, throw
            if (!isOverloaded || attempt === retries) {
                throw err;
            }

            // Calculate backoff with jitter for better distribution
            const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85-1.15
            delay = Math.min(delay * 1.5 * jitter, maxDelay);

            console.warn(`Anthropic API overloaded. Retry ${attempt}/${retries} in ${Math.round(delay)}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Uses Claude to group similar items and select the best representatives from each group
 * This function enhances search results without changing any UI components
 *
 * @param {Array} matches - Initial search results already matched with your algorithm
 * @param {Object} item - The original item submitted by the user
 * @returns {Promise<Array>} - Enhanced list of distinct matches
 */
async function enhanceMatchesWithClaude(matches, item) {
    // Skip Claude if we have fewer than 3 matches
    if (!matches || matches.length < 3) {
        console.log("Too few matches to use Claude enhancement, returning original matches");
        // Make sure even these few matches are streamlined with category awareness
        return matches.map(match => streamlineMatchData(match, item));
    }

    // Wrap the Claude API call in the retry function
    return retryWithBackoff(async () => {
        // Initialize Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Build description of the item
        const itemDescription = buildItemDescription(item);

        // Prepare simplified matches for the Claude prompt
        const simplifiedMatches = matches.map((match, idx) => ({
            index: idx,
            title: match.title,
            source: match.source,
            hasImage: !!match.image,
            matchScore: match.matchScore,
            price: match.price // Include price for Claude analysis but we won't store it
        }));

        console.log("🧠 Using Claude to find distinct product variations");

        // Customize Claude prompt based on item category
        let categorySpecificInstructions = '';

        if (item.category === 'watches') {
            categorySpecificInstructions = `
For watches specifically, focus on these key differences:
1. MOVEMENT VARIATIONS - Automatic vs. Manual vs. Quartz
2. CASE MATERIAL DIFFERENCES - Steel vs. Gold vs. Titanium vs. Ceramic
3. COMPLICATIONS - Date, Chronograph, GMT, etc.
4. DIAL VARIATIONS - Color, texture, special editions
5. SIZE DIFFERENCES - Case diameter (e.g. 36mm vs 41mm) 
6. BRACELET/STRAP VARIATIONS - Metal bracelet vs. leather strap
7. VINTAGE/PRODUCTION YEAR - Different production years if significant`;
        } else if (item.category === 'handbags') {
            categorySpecificInstructions = `
For handbags specifically, focus on these key differences:
1. MATERIAL VARIATIONS - Different materials (leather, canvas, exotic skins)
2. SIZE DIFFERENCES - Mini vs. Small vs. Medium vs. Large
3. HARDWARE DIFFERENCES - Gold vs. Silver vs. Special hardware
4. LIMITED EDITIONS - Seasonal vs. Standard vs. Collaboration pieces
5. STYLE VARIATIONS - Shoulder bag vs. Tote vs. Crossbody
6. COLOR DIFFERENCES - Different colorways if significantly distinct
7. VINTAGE/YEAR - Different years if design has changed`;
        } else if (item.category === 'jewelry') {
            categorySpecificInstructions = `
For jewelry specifically, focus on these key differences:
1. MATERIAL VARIATIONS - Different metals (gold, platinum, silver)
2. GEMSTONE DIFFERENCES - Different gemstones or diamond grades
3. SIZE VARIATIONS - Different sizes of the same piece
4. COLLECTION DIFFERENCES - Different collections from the same brand
5. LIMITED EDITIONS - Special editions vs. standard pieces
6. VINTAGE/MODERN - Vintage pieces vs. modern versions`;
        } else if (item.category === 'sneakers') {
            categorySpecificInstructions = `
For sneakers specifically, focus on these key differences:
1. COLORWAY VARIATIONS - Different official colorways of the same model
2. RELEASE TYPES - General Release vs Limited Edition vs Collaborations
3. SIZING DIFFERENCES - Men's vs Women's vs Grade School/Youth sizing
4. CUT VARIATIONS - High vs Mid vs Low versions
5. SPECIAL EDITIONS - Anniversary, Player Edition, Sample, etc.
6. VINTAGE/YEAR - Different release years of the same model
7. PACKAGING DIFFERENCES - Special box editions vs standard`;
        }

        // Create Claude message with structured format using XML tags to guide response
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Use Claude 3.5 Sonnet for best balance of performance and speed
            max_tokens: 800,
            temperature: 0.2, // Lower temperature for more consistent grouping
            system: "Group similar product search results and select distinct variations with minimal explanation.",
            messages: [
                {
                    role: "user",
                    content: `
I'm searching for: ${item.brand || ''} ${item.model || ''} (${item.category || ''})
Details: ${itemDescription}

I've received multiple search results that might represent the same product with different listings.
I need you to find the MOST DIVERSE variations possible, focusing specifically on:

${categorySpecificInstructions || 'Focus on identifying genuinely different versions of the product.'}

For each distinct variation, provide:
1. A SHORT, CLEAR name highlighting the key distinctive feature
2. 2-3 bullet points explaining what makes this version unique
3. Choose only the BEST representative from each genuinely different variation

Return 2-4 TRULY DIFFERENT options that would give the user meaningful choices.

Please format your response as structured JSON wrapped in <json></json> tags with this format:
<json>
{
  "groups": [
    {
      "groupName": "Clear distinctive feature of this variant",
      "bestMatchIndex": (index of the best representative in the results array),
      "distinctiveFeatures": ["Feature 1", "Feature 2"]
    },
  ]
}
</json>

SEARCH RESULTS:
${JSON.stringify(simplifiedMatches, null, 2)}
`
                }
            ]
        });

        const claudeText = response.content[0].text;

        // Extract the JSON from between <json> tags
        const jsonMatch = claudeText.match(/<json>([\s\S]*?)<\/json>/);
        const jsonText = jsonMatch ? jsonMatch[1] : '{"groups":[]}';

        try {
            const parsed = JSON.parse(jsonText);

            if (parsed.groups && Array.isArray(parsed.groups) && parsed.groups.length > 0) {
                // Get the distinct matches from each group but streamline the data
                const distinctMatches = parsed.groups
                    .map(group => {
                        const match = matches[group.bestMatchIndex];
                        if (match) {
                            // Add the group description and distinctive features but streamline data
                            const streamlined = streamlineMatchData(match, item);
                            return {
                                ...streamlined,
                                groupDescription: group.groupName,
                                distinctiveFeatures: group.distinctiveFeatures || []
                            };
                        }
                        return null;
                    })
                    .filter(match => match); // Filter out null matches

                if (distinctMatches.length > 0) {
                    console.log(`🎯 Claude identified ${distinctMatches.length} distinct product variations`);
                    return distinctMatches;
                }
            }

            console.warn('⚠️ Claude grouping returned invalid structure');
            // Return empty array rather than fallback
            return [];
        } catch (e) {
            console.error('⚠️ Claude output parse failed:', e);
            // Return empty array rather than fallback
            return [];
        }
    });
}

/**
 * Helper function to build a description of the item for Claude
 */
function buildItemDescription(item) {
    if (!item) return "";

    const parts = [];
    const keyFields = ['brand', 'model', 'material', 'color', 'size', 'condition'];

    for (const field of keyFields) {
        if (item[field]) {
            parts.push(`${field}: ${item[field]}`);
        }
    }

    // Include dynamic fields if available
    if (item.dynamicFields) {
        for (const [key, value] of Object.entries(item.dynamicFields)) {
            if (value && !keyFields.includes(key)) {
                parts.push(`${key}: ${value}`);
            }
        }
    }

    return parts.join(', ');
}

/**
 * Builds a search query based on item properties and parameter weights
 * Works with any category structure without hardcoding
 *
 * @param {Object} item - The item to build a query for
 * @param {Array} parameterWeights - Weighted parameters from the category config
 * @returns {string} - The search query
 */
function buildLooseQuery(item, parameterWeights = []) {
    // Start with empty array for query parts
    const parts = [];

    // Use parameter weights if available (recommended approach)
    if (parameterWeights && parameterWeights.length > 0) {
        // Sort parameter weights to prioritize higher-weighted parameters
        const sortedWeights = [...parameterWeights].sort((a, b) => b.weight - a.weight);

        for (const { fieldId, weight } of sortedWeights) {
            // First check if the field exists directly on the item
            let value = item[fieldId];

            // If not found directly, check in dynamicFields
            if (value === undefined && item.dynamicFields) {
                value = item.dynamicFields[fieldId];
            }

            // If value exists and is a string, add it to query parts
            if (value && typeof value === 'string') {
                parts.push(value);
            }
        }
    }

    // Ensure we have at least something in the query
    // If no parts were added from parameterWeights, use basic item properties
    if (parts.length === 0) {
        // Add category, brand, and model if available (common across most items)
        if (item.category) parts.push(item.category);
        if (item.brand) parts.push(item.brand);
        if (item.model) parts.push(item.model);

        // Add anything from dynamicFields as a last resort
        if (item.dynamicFields) {
            Object.values(item.dynamicFields).forEach(value => {
                if (value && typeof value === 'string') parts.push(value);
            });
        }
    }

    const query = parts.join(' ').trim();
    console.log(`Generated query: ${query}`);

    return query;
}

/**
 * This function ensures we only return truly distinct products
 * It can be configured to limit how many similar variations to show
 *
 * @param {Array} matches - Array of matches found
 * @param {number} maxResults - Maximum number of results to return (default: 8)
 * @returns {Array} - Filtered array with only truly distinct items
 */
function ensureDistinctResults(matches, maxResults = 8) {
    // If we have fewer matches than our target, just return them all
    if (!matches || matches.length <= 1) {
        return matches;
    }

    // If we only have one group, don't show duplicates
    const allFromSameGroup = matches.every(match =>
        match.groupDescription === matches[0].groupDescription
    );

    if (allFromSameGroup) {
        console.log("All matches appear to be the same product - showing best options");

        // Instead of returning just the top match, return a few of the best ones
        // Sort by matchScore and take the top ones
        const sortedMatches = [...matches].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        return sortedMatches.slice(0, Math.min(3, matches.length));
    }

    // Use a Map to track unique titles for deduplication
    const uniqueMatches = new Map();

    // Process matches to find unique ones based on normalized titles
    for (const match of matches) {
        if (!match.title) continue;

        // Normalize title for comparison (lowercase, remove extra spaces)
        const normalizedTitle = match.title.toLowerCase().replace(/\s+/g, ' ').trim();

        // If we haven't seen this title or the current match has a better score
        if (!uniqueMatches.has(normalizedTitle) ||
            (match.matchScore > uniqueMatches.get(normalizedTitle).matchScore)) {
            uniqueMatches.set(normalizedTitle, match);
        }
    }

    // Convert back to array and sort by matchScore
    let distinctMatches = Array.from(uniqueMatches.values());
    distinctMatches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Return up to maxResults items
    return distinctMatches.slice(0, Math.min(maxResults, distinctMatches.length));
}

/**
 * Simplified function to handle precious metals category
 * Gets a basic stock image based only on metal type and form
 * 
 * @param {Object} item - The precious metal item
 * @returns {Promise<Array>} - Single match with display information
 */
async function handlePreciousMetals(item) {
    try {
        // Extract only the most basic information needed for an image
        const metalType = item.dynamicFields?.metalType || '';
        const form = item.dynamicFields?.form || '';
        
        // Build a simple query focusing just on the metal type and form
        let query = '';
        
        if (metalType && form) {
            query = `${metalType} ${form}`;
        } else if (metalType) {
            query = `${metalType} bullion`;
        } else if (form) {
            query = `precious metal ${form}`;
        } else {
            query = 'precious metal bullion';
        }
        
        // Just search for the plain item without adding extra terms
        console.log(`Fetching precious metal image for: ${query}`);
        
        // Get one result from SerpAPI just for the image
        const response = await fetchSerpApiPage(query);
        let image = null;
        
        // Extract image from the first result if available
        if (response.data.shopping_results && response.data.shopping_results.length > 0) {
            const firstResult = response.data.shopping_results[0];
            image = firstResult.thumbnail || firstResult.image;
        }
        
        // Capitalize metal type and form for display
        const capitalizedMetal = metalType 
            ? metalType.charAt(0).toUpperCase() + metalType.slice(1) 
            : '';
        
        const capitalizedForm = form 
            ? form.charAt(0).toUpperCase() + form.slice(1) 
            : '';
        
        // Create a clean title that only shows metal type and form
        const cleanTitle = `${capitalizedMetal} ${capitalizedForm}`.trim();
        
        // Create a simplified display-only match with ONLY type and form
        const match = {
            title: cleanTitle || 'Precious Metal', 
            image: image,
            link: null,
            source: 'Representative Image',
            matchScore: 1.0,
            queryUsed: query,
            isPreciousMetalDisplay: true,
            // IMPORTANT: Only include the essential attributes, nothing else
            originalItem: {
                category: 'preciousMetals'
            },
            structuredAttributes: {
                // ONLY include metal type and form, nothing else
                metalType: item.dynamicFields?.metalType,
                form: item.dynamicFields?.form
            },
            groupDescription: 'Precious Metal Asset',
            // Use the clean title for display
            displayTitle: cleanTitle || 'Precious Metal Asset',
        };

        // Remove any connection to the original item's details
        if (match.originalItem) {
            match.originalItem = {
                category: 'preciousMetals'
            };
        }

        return [match];
    } catch (error) {
        console.error('Error handling precious metals:', error);
        
        // Return a fallback display-only match in case of error with minimal data
        const capitalizedMetal = item.dynamicFields?.metalType 
            ? item.dynamicFields.metalType.charAt(0).toUpperCase() + item.dynamicFields.metalType.slice(1) 
            : '';
        
        const capitalizedForm = item.dynamicFields?.form 
            ? item.dynamicFields.form.charAt(0).toUpperCase() + item.dynamicFields.form.slice(1) 
            : '';
        
        const cleanTitle = `${capitalizedMetal} ${capitalizedForm}`.trim();
        
        return [{
            title: cleanTitle || 'Precious Metal Asset',
            image: null,
            link: null,
            source: 'Representative Image',
            matchScore: 1.0,
            queryUsed: '',
            isPreciousMetalDisplay: true,
            originalItem: {
                category: 'preciousMetals'
            },
            structuredAttributes: {
                metalType: item.dynamicFields?.metalType,
                form: item.dynamicFields?.form
            }, 
            groupDescription: 'Precious Metal Asset',
            displayTitle: cleanTitle || 'Precious Metal Asset',
            distinctiveFeatures: ['Representative image only']
        }];
    }
}

/**
 * Creates a simplified title for precious metal items - ONLY metal type and form
 */
function createSimplePreciousMetalTitle(item) {
    if (!item || !item.dynamicFields) return 'Precious Metal Asset';
    
    const df = item.dynamicFields;
    
    // Capitalize metal type and form
    const capitalizedMetal = df.metalType 
        ? df.metalType.charAt(0).toUpperCase() + df.metalType.slice(1) 
        : '';
    
    const capitalizedForm = df.form 
        ? df.form.charAt(0).toUpperCase() + df.form.slice(1) 
        : '';
    
    // Format: [Metal Type] [Form] ONLY
    // Example: "Gold Bar"
    const cleanTitle = `${capitalizedMetal} ${capitalizedForm}`.trim();
    
    return cleanTitle || 'Precious Metal Asset';
}

// Export all functions
module.exports = {
    buildLooseQuery,
    fetchInitialMatches,
    enhanceMatchesWithClaude,
    ensureDistinctResults,
    retryWithBackoff,
    handlePreciousMetals  // Export the new function
};