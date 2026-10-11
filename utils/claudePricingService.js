/**
 * Optimized pricing service with Claude integration
 * Enhanced with performance optimizations, timeout handling, and hang prevention
 */

const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const { VERIFIED_RESALE_SOURCES} = require('./verifiedSources');

// Global configuration
const CONFIG = {
    // API timeouts
    CLAUDE_API_TIMEOUT: 20000,      // 20 seconds for Claude API calls
    SERPAPI_TIMEOUT: 10000,         // 10 seconds for SerpAPI calls
    PRICING_OVERALL_TIMEOUT: 45000, // 45 seconds for entire pricing operation

    // Retry settings
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY: 1000,
    MAX_RETRY_DELAY: 8000,

    // Circuit breaker
    CIRCUIT_BREAKER_THRESHOLD: 2,
    CIRCUIT_BREAKER_RESET: 60000    // 1 minute
};

/**
 * Simple circuit breaker implementation to prevent cascading failures
 */
class CircuitBreaker {
    constructor(service, options = {}) {
        this.service = service;
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.resetTimeout = options.resetTimeout || 30000;
        this.failureThreshold = options.failureThreshold || 3;
        this.lastFailureTime = null;
    }

    async call(params) {
        if (this.state === 'OPEN') {
            // Check if circuit should be reset
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                console.log('🔄 Circuit breaker state changed to HALF_OPEN');
            } else {
                throw new Error('Circuit is OPEN');
            }
        }

        try {
            const result = await this.service(params);
            if (this.state === 'HALF_OPEN') {
                this.state = 'CLOSED';
                this.failureCount = 0;
                console.log('✅ Circuit breaker state changed to CLOSED');
            }
            return result;
        } catch (error) {
            this.failureCount++;
            this.lastFailureTime = Date.now();

            if (this.failureCount >= this.failureThreshold) {
                this.state = 'OPEN';
                console.warn(`⚠️ Circuit breaker state changed to OPEN after ${this.failureCount} failures`);
            }
            throw error;
        }
    }
}

// Initialize Anthropic client
let anthropic;
let claudeCircuitBreaker;
try {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Initialize circuit breaker for Claude API
    claudeCircuitBreaker = new CircuitBreaker(
        async (params) => anthropic.messages.create(params),
        {
            failureThreshold: CONFIG.CIRCUIT_BREAKER_THRESHOLD,
            resetTimeout: CONFIG.CIRCUIT_BREAKER_RESET
        }
    );
} catch (err) {
    console.error('❌ Anthropic initialization error:', err);
}

/**
 * Timing utility to track execution time and detect potential hangs
 */
class OperationTimer {
    constructor(name, warnTimeMs = 15000) {
        this.name = name;
        this.startTime = Date.now();
        console.time(name);
        console.log(`⏱️ Starting ${name}`);

        // Set a timeout to detect potential hangs
        this.timeoutId = setTimeout(() => {
            console.warn(`⚠️ POTENTIAL HANG: ${name} running for over ${warnTimeMs/1000}s`);
        }, warnTimeMs);
    }

    end() {
        clearTimeout(this.timeoutId);
        const duration = Date.now() - this.startTime;
        console.log(`✅ Completed ${this.name} in ${duration}ms`);
        console.timeEnd(this.name);
        return duration;
    }
}

/**
 * Call a function with a timeout and retry capability
 * @param {Function} fn - The function to call
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} retryDelayMs - Delay between retries in milliseconds
 * @returns {Promise<any>} - The result of the function call
 */
async function callWithTimeout(fn, timeoutMs, maxRetries = 1, retryDelayMs = 1000) {
    let lastError;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Create a timeout promise that rejects after timeoutMs
            const timeoutPromise = new Promise((_, reject) => {
                const id = setTimeout(() => {
                    clearTimeout(id);
                    reject(new Error(`Operation timed out after ${timeoutMs}ms`));
                }, timeoutMs);
            });

            // Race the function call against the timeout
            return await Promise.race([fn(), timeoutPromise]);
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);

            // If this was the last attempt, throw the error
            if (attempt === maxRetries - 1) {
                throw lastError;
            }

            // Otherwise, wait before the next retry
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    }

    // This should never be reached due to the throw in the loop
    throw lastError || new Error('Operation failed after all retries');
}

/**
 * Retry helper with exponential backoff for Anthropic 529 errors
 */
async function retryWithBackoff(fn, retries = CONFIG.MAX_RETRIES,
                                delayMs = CONFIG.INITIAL_RETRY_DELAY,
                                maxDelay = CONFIG.MAX_RETRY_DELAY) {
    let delay = delayMs;
    for (let i = 1; i <= retries; i++) {
        try {
            return await fn();
        } catch (err) {
            const isRetryable = err.status === 529 ||
                err.response?.status === 529 ||
                /overloaded|rate limit|timeout/i.test(err.message);

            if (!isRetryable || i === retries) throw err;

            console.log(`⏱️ Retry ${i}/${retries} after ${delay}ms delay...`);
            await new Promise(r => setTimeout(r, delay));
            delay = Math.min(delay * 1.5, maxDelay);
        }
    }
}

/**
 * Normalize any URL-like fields into `item.link`
 */
function normalizeLinks(results) {
    return results.map(item => {
        const link = item.link
            || item.product_link
            || item.serpapi_product_api
            || item.immersive_product_page_token
            || '';
        return { ...item, link };
    });
}

/**
 * Generic, hostname‑and‑label‑based filter for trusted sources
 */
function filterByTrustedSources(rawResults) {
    if (!rawResults || !Array.isArray(rawResults)) {
        console.warn('⚠️ Invalid results passed to filterByTrustedSources');
        return [];
    }

    const timer = new OperationTimer('FilterTrustedSources');
    try {
        const results = normalizeLinks(rawResults);
        const marketplaceRoots = VERIFIED_RESALE_SOURCES.map(d => d.split('.')[0].toLowerCase());

        const filteredResults = results.filter(item => {
            if (!item.source || !item.extracted_price) return false;
            const srcLabel = (item.source || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            let hostname = null;
            if (item.link) {
                try { hostname = new URL(item.link).hostname.toLowerCase(); }
                catch {}
            }

            // 1) match marketplace by hostname
            if (hostname && VERIFIED_RESALE_SOURCES.includes(hostname)) return true;
            // 2) match marketplace by root label
            if (marketplaceRoots.includes(srcLabel)) return true;
            if (marketplaceRoots.some(root => srcLabel.includes(root))) return true;

            // nothing matched → filter out
            console.log(`⚠️ Filtered out: ${item.title} (source="${item.source}", host="${hostname}")`);
            return false;
        });

        return filteredResults;
    } finally {
        timer.end();
    }
}

/**
 * Fetch raw pricing data from SerpAPI with timeout
 */
async function fetchSerpApiResults(query) {
    const timer = new OperationTimer('SerpAPI');

    try {
        const params = new URLSearchParams({
            q: query.trim().replace(/\s+/g, ' '),
            api_key: process.env.SERPAPI_KEY || '',
            engine: 'google_shopping',
            google_domain: 'google.com',
            gl: 'us',
            hl: 'en',
            num: '100',
            device: 'desktop',
            tbm: 'shop'
        });

        console.log(`🌐 Fetching from SerpAPI: ${params.get('q')}`);

        // Use AbortController for better timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.SERPAPI_TIMEOUT);

        try {
            const res = await axios.get(`https://serpapi.com/search?${params}`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Combine all available results
            const results = [
                ...(res.data.shopping_results || []),
                ...(res.data.inline_shopping_results || []),
                ...(res.data.related_shopping_results || [])
            ];

            console.log(`📦 Retrieved ${results.length} results from SerpAPI`);
            return results;
        } catch (err) {
            if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
                console.error('⏱️ SerpAPI request timed out');
            } else {
                console.error('❌ Error fetching from SerpAPI:', err.message);
            }
            return [];
        }
    } finally {
        timer.end();
    }
}

/**
 * Main entry: fetch + filter + analyze with Claude
 * @param {Object} match - The matched item data
 * @param {Object} originalItem - The original item data
 * @param {Object} categoryData - The category metadata
 * @param {Function} stageCallback - Optional callback for stage updates (stage, percentage)
 * @returns {Object} Pricing data
 */
async function fetchAndAnalyzePricingWithClaude(match, originalItem, categoryData, stageCallback) {
    const mainTimer = new OperationTimer('PricingTotal');
  
    try {
      // Initialize at "initializing" stage with 0% progress
      if (stageCallback) await stageCallback('initializing', 0);
      
      // Add a small delay to show initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      if (stageCallback) await stageCallback('initializing', 10);
  
      // 1) Build optimized query
      const queryTimer = new OperationTimer('BuildQuery');
      let optimized;
      try {
        // Update to "searching" stage with early progress
        if (stageCallback) await stageCallback('searching', 15);
  
        const query = match?.title || '';
        optimized = await buildOptimizedQueryWithClaude(match, originalItem, categoryData);
        console.log(`🔎 Optimized query: "${optimized}"`);
        
        if (stageCallback) await stageCallback('searching', 25);
      } catch (err) {
        console.error('❌ Query optimization failed:', err.message);
        optimized = match?.title || '';
        console.log(`⚠️ Falling back to original query: "${optimized}"`);
      } finally {
        queryTimer.end();
      }
  
      // 2) Fetch from SerpAPI  
      // Continue with searching stage
      if (stageCallback) await stageCallback('searching', 35);
  
      const raw = await fetchSerpApiResults(optimized);
      console.log(`📦 Raw results count: ${raw.length}`);
      
      if (stageCallback) await stageCallback('searching', 50);
      
      if (!raw.length) {
        console.warn('⚠️ No pricing data returned');
        if (stageCallback) await stageCallback('complete', 100);
        return {
          marketValue: 0,
          disbursedAmount: 0,
          confidence: 'None',
          dataPoints: 0,
          error: 'No pricing data available'
        };
      }
  
      // 3) Filter by trusted sources
      if (stageCallback) await stageCallback('analyzing', 60);
      
      const trusted = filterByTrustedSources(raw);
      console.log(`🧼 Trusted results count: ${trusted.length}`);
      
      if (stageCallback) await stageCallback('analyzing', 70);
  
      // 4) Choose which set to analyze
      const toAnalyze = trusted.length >= 3 ? trusted : raw;
      console.log(`🔄 Analyzing ${toAnalyze.length} items with Claude`);
  
      // 5) Perform condition analysis
      let conditionAnalysisResult = null;
      try {
        if (stageCallback) await stageCallback('evaluating', 75);
        conditionAnalysisResult = await analyzeConditionImpact(originalItem, match, categoryData);
        if (stageCallback) await stageCallback('evaluating', 80);
      } catch (err) {
        console.error('❌ Condition analysis failed, using static fallback:', err.message);
        conditionAnalysisResult = getStaticConditionMultiplier(originalItem, categoryData);
      }
  
      // 6) Final Claude price analysis
      try {
        const analysisTimer = new OperationTimer('LLMAnalysis', 30000);
        let pricing;
  
        if (stageCallback) await stageCallback('calculating', 85);
  
        try {
          pricing = await callWithTimeout(
            () => analyzeWithClaude(toAnalyze, match, originalItem, categoryData, conditionAnalysisResult),
            CONFIG.PRICING_OVERALL_TIMEOUT
          );
  
          if (stageCallback) await stageCallback('calculating', 95);
        } catch (err) {
          console.error('❌ Claude analysis timed out or failed:', err.message);
          pricing = calculatePricingSummary(toAnalyze, originalItem, categoryData, conditionAnalysisResult);
          pricing.source = 'fallback';
          pricing.error = err.message;
        } finally {
          analysisTimer.end();
        }
  
        // Final completion
        if (stageCallback) await stageCallback('finalizing', 98);
        await new Promise(resolve => setTimeout(resolve, 500));
        if (stageCallback) await stageCallback('complete', 100);
  
        return pricing;
      } catch (err) {
        console.error('❌ Pricing analysis failed with error:', err.message);
        if (stageCallback) await stageCallback('error', 0);
        return calculatePricingSummary(toAnalyze, originalItem, categoryData, conditionAnalysisResult);
      }
    } catch (err) {
      console.error('❌ Overall pricing process failed:', err.message);
      if (stageCallback) await stageCallback('error', 0);
      return {
        marketValue: 0,
        disbursedAmount: 0,
        confidence: 'None',
        dataPoints: 0,
        error: err.message || 'Unknown error in pricing analysis'
      };
    } finally {
      mainTimer.end();
    }
  }
  

/**
 * Use Claude to build an optimized search query for pricing
 */
async function buildOptimizedQueryWithClaude(match, originalItem, categoryData) {
    // Start with a basic query from the match title
    const baseQuery = match?.title || '';

    // If no Claude available, return the basic query
    if (!anthropic || !claudeCircuitBreaker) {
        console.log('⚠️ Anthropic client not available, using basic query');
        return baseQuery;
    }

    try {
        console.log('🧠 Using Claude to optimize search query');

        // Build a detailed context for Claude
        const categorySpecifics = categoryData?.specificTerms || '';
        const condition = originalItem?.condition || originalItem?.dynamicFields?.condition || '';
        const category = originalItem?.category || '';

        // Extract important attributes - keeping only essential ones for cleaner query
        const brand = originalItem?.brand || originalItem?.dynamicFields?.brand ||
            (match?.title?.includes(' ') ? match.title.split(' ')[0] : '');

        const modelInfo = originalItem?.model || originalItem?.dynamicFields?.model || '';

        // Category-specific query guidance
        let categoryQueryGuidance = '';

        if (category.toLowerCase().includes('sneaker') || category.toLowerCase().includes('shoe')) {
            categoryQueryGuidance = `
For sneakers, focus on these key elements:
- Include only the exact model name (e.g., "Jordan 1 Travis Scott")
- Specify colorway if needed (e.g., "Mocha" or "Fragment")
- DO NOT include size information as this limits results
- DO NOT include condition terms like "DS" as this can skew results
- Avoid retail platform names (StockX, GOAT) to get a wider range of results
- Use common searching terms that actual buyers would use
`;
        } else if (category.toLowerCase().includes('watch')) {
            categoryQueryGuidance = `
For watches, focus on these key elements:
- Include exact model name and reference number if available
- Specify case size only if relevant for distinguishing models
- DO NOT include trusted marketplace names - this can bias results
- Focus on the specific model identifiers only
`;
        } else if (category.toLowerCase().includes('bag') || category.toLowerCase().includes('handbag')) {
            categoryQueryGuidance = `
For handbags, focus on these key elements:
- Include exact model name and size designation if part of the model name
- Specify material and color only if needed to distinguish the exact model
- DO NOT include condition terms or marketplace names
- Keep the query focused on the core product identifiers
`;
        } else if (category.toLowerCase().includes('jewelry') || category.toLowerCase().includes('jewel')) {
            categoryQueryGuidance = `
For jewelry, focus on these key elements:
- Include material specifications only if needed to identify the exact piece
- Include collection name and model number
- DO NOT include marketplace names or condition terms
- Focus only on the core product identifiers
`;
        }

        // Create dynamic fields string safely
        let dynamicFieldsStr = '';
        if (originalItem?.dynamicFields && typeof originalItem.dynamicFields === 'object') {
            dynamicFieldsStr = Object.entries(originalItem.dynamicFields)
                .filter(([_, value]) => value !== undefined && value !== null)
                .map(([key, value]) => `- ${key}: ${value}`)
                .join('\n');
        }

        // Wrap the Claude API call in the retry function and add timeout
        return await retryWithBackoff(async () => {
            try {
                const params = {
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 150,
                    temperature: 0.2,
                    system: "You are an expert in luxury item search queries that optimize for accurate pricing data. Your goal is to create search queries that will find ACTUAL market prices, not aspirational listing prices.",
                    messages: [
                        {
                            role: "user",
                            content: `
I need to search for accurate and CONSERVATIVE pricing for this luxury item:

Original Item Details:
- Category: ${originalItem?.category || 'Not specified'}
- Brand: ${brand}
- Model: ${modelInfo}
- Condition: ${condition}
${dynamicFieldsStr}

The best match title is: "${match?.title || ''}"

${categoryQueryGuidance}

Please create the optimal Google Shopping search query to find accurate pricing for this exact item. The query should:
1. Include ONLY the core identifying information (specific brand, exact model, key identifiers)
2. Include distinguishing features ONLY if needed to identify the exact model
3. Be extremely concise (5-7 words maximum)
4. DO NOT include marketplace names like StockX or GOAT
5. DO NOT include size information unless it's part of the model name
6. DO NOT include condition terms like "new" or "deadstock"
7. Focus ONLY on terms that will help identify the EXACT product

Return ONLY the optimized search query text without any explanation, quotation marks, or other formatting.
`
                        }
                    ]
                };

                // Use circuit breaker pattern with timeout
                return await callWithTimeout(async () => {
                    const response = await claudeCircuitBreaker.call(params);
                    const optimizedQuery = response.content[0].text.trim();
                    return optimizedQuery;
                }, CONFIG.CLAUDE_API_TIMEOUT);
            } catch (error) {
                if (error.message.includes('Circuit is OPEN')) {
                    console.warn('⚠️ Claude circuit breaker is open, using original query');
                    return baseQuery;
                }
                console.error('❌ Error in query optimization:', error.message);
                throw error;
            }
        });
    } catch (error) {
        console.error('❌ Failed to optimize query with Claude:', error.message);
        return baseQuery; // Fallback to basic query
    }
}

/**
 * Function to analyze the condition impact on a specific item's value
 * Uses Claude to dynamically determine the condition impact factor
 */
async function analyzeConditionImpact(item, match, categoryData) {
    const timer = new OperationTimer('ConditionAnalysis');

    try {
        // If no Claude available, fall back to traditional method
        if (!anthropic || !claudeCircuitBreaker) {
            console.log('⚠️ Anthropic client not available, using static condition adjustments');
            return getStaticConditionMultiplier(item, categoryData);
        }

        // Get condition from the item
        const condition = item?.condition ||
            item?.dynamicFields?.condition ||
            'not specified';

        const category = item?.category || '';
        const title = match?.title || '';
        const brand = item?.brand || item?.dynamicFields?.brand || '';
        const model = item?.model || item?.dynamicFields?.model || '';

        // Extract specific attributes that might affect condition impact
        const material = item?.material || item?.dynamicFields?.material || '';
        const age = item?.age || item?.dynamicFields?.age || '';
        const colorway = item?.colorway || item?.dynamicFields?.colorway || '';

        // Create additional context based on category
        let categoryContext = '';
        let categoryConditionPrompt = '';

        if (category.toLowerCase().includes('sneaker') || category.toLowerCase().includes('shoe')) {
            // Extract sneaker-specific details
            const box = item?.dynamicFields?.originalBox || '';
            const release = item?.dynamicFields?.releaseYear || '';

            categoryContext = `
This is a collectible sneaker. Additional context:
- Original Box: ${box}
- Release Year: ${release}
- Colorway: ${colorway}
`;

            categoryConditionPrompt = `
For sneakers, be particularly attentive to:
- Original box condition is critical for collector pieces
- Even minor signs of wear can significantly impact value
- Deadstock (DS) condition commands premium pricing
- Specific parts like air bubbles, midsole oxidation, and toe box creasing have outsized impact
- Limited editions and collaboration pieces are particularly condition-sensitive
`;
        }
        else if (category.toLowerCase().includes('watch')) {
            // Extract watch-specific details
            const movement = item?.dynamicFields?.movement || '';
            const complication = item?.dynamicFields?.complications || '';
            const boxPapers = item?.dynamicFields?.boxPapers || '';

            categoryContext = `
This is a luxury watch. Additional context:
- Movement type: ${movement}
- Complications: ${complication}
- Original box/papers: ${boxPapers}
- Age/Year: ${age}
`;

            categoryConditionPrompt = `
For watches, be particularly attentive to:
- Box and papers status significantly impacts value (often 20-30%)
- Service history is crucial for mechanical timepieces
- Original parts vs service replacements affect collector value
- Dial condition is more important than case condition for many models
- Water damage has severe impacts even when not visibly apparent
`;
        }
        else if (category.toLowerCase().includes('bag') || category.toLowerCase().includes('handbag')) {
            // Extract handbag-specific details
            const size = item?.dynamicFields?.size || '';
            const hardware = item?.dynamicFields?.hardware || '';
            const limited = item?.dynamicFields?.limitedEdition || '';

            categoryContext = `
This is a luxury handbag. Additional context:
- Size: ${size}
- Hardware: ${hardware}
- Limited Edition: ${limited}
- Material: ${material}
`;

            categoryConditionPrompt = `
For handbags, be particularly attentive to:
- Corner wear is one of the most value-reducing factors
- Hardware scratches and tarnishing have significant impact
- Interior condition is less important than exterior for most buyers
- Material-specific issues (e.g. verdigris on hardware, glazing issues)
- Limited edition pieces are more condition-sensitive
`;
        }
        else if (category.toLowerCase().includes('jewelry') || category.toLowerCase().includes('jewel')) {
            // Extract jewelry-specific details
            const gemstone = item?.dynamicFields?.gemstone || '';
            const metalType = item?.dynamicFields?.metalType || '';
            const carats = item?.dynamicFields?.carats || '';

            categoryContext = `
This is a luxury jewelry item. Additional context:
- Gemstone: ${gemstone}
- Metal type: ${metalType}
- Carats: ${carats}
- Age/Era: ${age}
`;

            categoryConditionPrompt = `
For jewelry, be particularly attentive to:
- Stone security in settings is critical to value
- Any chip or inclusion in stones dramatically reduces value
- Metal wear (especially at prongs, clasps, and high-contact areas)
- Original documentation and authenticity certificates impact value
- Signed pieces by known designers are more condition-sensitive
`;
        }

        // Use circuit breaker pattern with retries and timeout
        return await retryWithBackoff(async () => {
            try {
                return await callWithTimeout(async () => {
                    // Create Claude prompt
                    const params = {
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 250,
                        temperature: 0.1,
                        system: "You are an expert in luxury goods valuation with deep knowledge of how condition affects market value across different categories. You provide thoughtful, balanced, and DATA-DRIVEN condition impact assessments.",
                        messages: [
                            {
                                role: "user",
                                content: `
I need you to analyze how the condition of this specific luxury item affects its market value.

Item Details:
- Category: ${category}
- Brand: ${brand}
- Model/Title: ${title || model}
- Condition: ${condition}
${categoryContext}

${categoryConditionPrompt}

Be thorough but CONSERVATIVE in your assessment. Consider the specific impacts this condition would have on real buyer behavior and market liquidity, not just theoretical value.

Please determine:
1. The percentage of value this item would retain compared to a mint condition equivalent
2. The key condition factors that impact this specific item's value
3. How condition impacts value differently for this specific type of item

Respond with structured JSON within <json></json> tags with these fields:
- conditionMultiplier: Number between 0 and 1 representing what fraction of mint value this item retains (e.g., 0.85 means 85% of mint value)
- conditionImpactDescription: Brief explanation of how condition affects this specific item
- keySensitivityFactors: Array of specific aspects of this item most affected by condition
- confidenceLevel: "High", "Medium", or "Low" based on the information available

Do not include any text outside the JSON.
`
                            }
                        ]
                    };

                    const response = await claudeCircuitBreaker.call(params);

                    // Extract the JSON from Claude's response
                    const claudeText = response.content[0].text;
                    const jsonMatch = claudeText.match(/<json>([\s\S]*?)<\/json>/);

                    if (!jsonMatch) {
                        console.warn('⚠️ Claude response did not contain properly formatted JSON for condition analysis');
                        return getStaticConditionMultiplier(item, categoryData);
                    }

                    // Parse Claude's analysis
                    const analysis = JSON.parse(jsonMatch[1]);

                    // Log the condition analysis
                    console.log('📊 Claude Condition Analysis:');
                    console.log(`• Item Condition: ${condition}`);
                    console.log(`• Value Retention: ${Math.round(analysis.conditionMultiplier * 100)}%`);
                    console.log(`• Key Factors: ${analysis.keySensitivityFactors.join(', ')}`);
                    console.log(`• Confidence: ${analysis.confidenceLevel}`);

                    return {
                        conditionMultiplier: analysis.conditionMultiplier,
                        conditionImpactPercentage: Math.round(analysis.conditionMultiplier * 100),
                        description: analysis.conditionImpactDescription,
                        sensitivityFactors: analysis.keySensitivityFactors,
                        confidence: analysis.confidenceLevel
                    };
                }, CONFIG.CLAUDE_API_TIMEOUT);
            } catch (error) {
                if (error.message.includes('Circuit is OPEN')) {
                    console.warn('⚠️ Claude circuit breaker is open, using static condition multiplier');
                    return getStaticConditionMultiplier(item, categoryData);
                }
                if (error.message.includes('timed out')) {
                    console.warn('⚠️ Condition analysis timed out, using static condition multiplier');
                    return getStaticConditionMultiplier(item, categoryData);
                }

                console.error('❌ Error in condition analysis:', error.message);
                throw error;
            }
        });
    } catch (error) {
        console.error('❌ Error in Claude condition analysis:', error.message);
        // Fall back to static method
        return getStaticConditionMultiplier(item, categoryData);
    } finally {
        timer.end();
    }
}

/**
 * Fallback function to get static condition multiplier when Claude is unavailable
 */
function getStaticConditionMultiplier(item, categoryData = {}) {
    const timer = new OperationTimer('StaticConditionMultiplier');

    try {
        // Get condition from item
        const condition = item?.condition ||
            item?.dynamicFields?.condition ||
            'excellent'; // Default to excellent if not specified

        const category = item?.category || '';

        // Apply condition adjustments based on category and condition
        let conditionMultiplier = 1.0; // Default - no adjustment
        let sensitivityFactors = [];

        // Determine condition impact based on category and condition
        if (condition) {
            const conditionLower = condition.toLowerCase();

            if (category === 'watches') {
                if (conditionLower.includes('mint')) conditionMultiplier = 1.0;
                else if (conditionLower.includes('excellent')) conditionMultiplier = 0.92;
                else if (conditionLower.includes('very good')) conditionMultiplier = 0.82;
                else if (conditionLower.includes('good')) conditionMultiplier = 0.70;
                else if (conditionLower.includes('fair')) conditionMultiplier = 0.50;

                sensitivityFactors = ['Box & Papers', 'Scratches', 'Movement Functionality', 'Water Resistance'];
            }
            else if (category === 'handbags') {
                if (conditionLower.includes('mint')) conditionMultiplier = 1.0;
                else if (conditionLower.includes('excellent')) conditionMultiplier = 0.85;
                else if (conditionLower.includes('very good')) conditionMultiplier = 0.75;
                else if (conditionLower.includes('good')) conditionMultiplier = 0.60;
                else if (conditionLower.includes('fair')) conditionMultiplier = 0.40;

                sensitivityFactors = ['Corner Wear', 'Handle Patina', 'Interior Condition', 'Hardware Scratches'];
            }
            else if (category === 'jewelry') {
                if (conditionLower.includes('mint')) conditionMultiplier = 1.0;
                else if (conditionLower.includes('excellent')) conditionMultiplier = 0.92;
                else if (conditionLower.includes('very good')) conditionMultiplier = 0.85;
                else if (conditionLower.includes('good')) conditionMultiplier = 0.75;
                else if (conditionLower.includes('fair')) conditionMultiplier = 0.60;

                sensitivityFactors = ['Stone Clarity', 'Metal Scratches', 'Clasp Functionality', 'Setting Security'];
            }
            else if (category === 'sneakers') {
                if (conditionLower.includes('mint') || conditionLower.includes('deadstock')) conditionMultiplier = 1.0;
                else if (conditionLower.includes('excellent')) conditionMultiplier = 0.85;
                else if (conditionLower.includes('very good')) conditionMultiplier = 0.65;
                else if (conditionLower.includes('good')) conditionMultiplier = 0.50;
                else if (conditionLower.includes('fair')) conditionMultiplier = 0.30;

                sensitivityFactors = ['Sole Yellowing', 'Toe Creasing', 'Original Box', 'Overall Cleanliness'];
            }
            else {
                // Generic condition adjustments for other categories
                if (conditionLower.includes('mint')) conditionMultiplier = 1.0;
                else if (conditionLower.includes('excellent')) conditionMultiplier = 0.90;
                else if (conditionLower.includes('very good')) conditionMultiplier = 0.80;
                else if (conditionLower.includes('good')) conditionMultiplier = 0.65;
                else if (conditionLower.includes('fair')) conditionMultiplier = 0.50;

                sensitivityFactors = ['Overall Wear', 'Functionality', 'Aesthetic Condition', 'Age-Related Deterioration'];
            }
        }

        // Log the static condition analysis
        console.log('📊 Static Condition Analysis:');
        console.log(`• Item Condition: ${condition}`);
        console.log(`• Value Retention: ${Math.round(conditionMultiplier * 100)}%`);
        console.log(`• Category: ${category}`);

        return {
            conditionMultiplier: conditionMultiplier,
            conditionImpactPercentage: Math.round(conditionMultiplier * 100),
            description: `${condition} condition ${category} typically retains ${Math.round(conditionMultiplier * 100)}% of mint value`,
            sensitivityFactors: sensitivityFactors,
            confidence: 'Medium'
        };
    } finally {
        timer.end();
    }
}

/**
 * Use Claude to analyze pricing data with dynamic condition adjustment
 * Enhanced with category-specific prompts to get more conservative valuations
 * @param {Array} results - The pricing data results to analyze
 * @param {Object} match - The matched item data
 * @param {Object} originalItem - The original item data
 * @param {Object} categoryData - The category metadata
 * @param {Object} cachedConditionAnalysis - Already calculated condition analysis (to avoid duplicate work)
 * @returns {Object} Pricing data
 */
async function analyzeWithClaude(results, match, originalItem, categoryData, cachedConditionAnalysis = null) {
    const timer = new OperationTimer('ClaudePricingAnalysis');

    try {
        // If no results, return empty pricing
        if (!results || results.length === 0) {
            return {
                marketValue: 0,
                disbursedAmount: 0,
                confidence: 'None',
                dataPoints: 0,
                priceRange: null
            };
        }

        // If no Claude available, fall back to traditional calculation
        if (!anthropic || !claudeCircuitBreaker) {
            console.log('⚠️ Anthropic client not available, using traditional pricing calculation');
            return calculatePricingSummary(results, originalItem, categoryData, cachedConditionAnalysis);
        }

        // Use cached condition analysis if provided, otherwise calculate it (which should be rare)
        let conditionAnalysis = cachedConditionAnalysis;
        if (!conditionAnalysis) {
            try {
                console.log('⚠️ No cached condition analysis provided, calculating now (this should be rare)');
                conditionAnalysis = await analyzeConditionImpact(originalItem, match, categoryData);
            } catch (err) {
                console.error('❌ Condition analysis failed, using default:', err.message);
                conditionAnalysis = {
                    conditionImpactPercentage: 85,
                    description: 'Using default condition impact assessment',
                    sensitivityFactors: ['General condition'],
                    confidence: 'Low'
                };
            }
        }

        // Prepare results for Claude in a simplified format
        // Use a random sample if there are too many results to prevent token limit issues
        let simplifiedResults;
        if (results.length > 50) {
            console.log(`⚠️ Too many results (${results.length}), sampling 20 random items`);
            // Fisher-Yates shuffle algorithm to get random sample
            const shuffled = [...results];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            simplifiedResults = shuffled.slice(0, 20).map((result, index) => ({
                index,
                title: result.title || '',
                price: result.extracted_price || 0,
                source: result.source || '',
                position: result.position || 0,
                link: result.link || ''
            }));
        } else {
            simplifiedResults = results.map((result, index) => ({
                index,
                title: result.title || '',
                price: result.extracted_price || 0,
                source: result.source || '',
                position: result.position || 0,
                link: result.link || ''
            }));
        }

        // Get condition information and category
        const condition = originalItem?.condition ||
            originalItem?.dynamicFields?.condition ||
            '';
        const category = originalItem?.category || '';

        // Category-specific pricing analysis prompts
        let categorySpecificPrompt = '';

        if (category.toLowerCase().includes('sneaker') || category.toLowerCase().includes('shoe')) {
            categorySpecificPrompt += `
EXTREMELY IMPORTANT: Pay careful attention to exact model matching! Many similar models exist:
- ONLY include the exact Travis Scott collaboration specified
- For Jordan 1s, verify if it's a High, Mid, or Low model - these are different products
- Check if it's the exact colorway (e.g., "Mocha" vs "Reverse Mocha" vs "Fragment")
- Verify it's not a GS (Grade School) or PS (Preschool) size
- Verify it's not a different Jordan line (like Jordan 3, 4, 6, etc.)
- Be extremely cautious of generic listings that only say "Jordan 1 Retro High" without specific collaborator names - these are usually different models

Listings like "Jordan 1 Retro High" without "Travis Scott" in the title are almost certainly NOT the correct product and should be excluded.
`;
        } else if (category.toLowerCase().includes('watch')) {
            categorySpecificPrompt = `
As a luxury watch valuation expert, maintain a CONSERVATIVE approach to pricing. The watch market requires special considerations:

1. Value high-confidence data sources (Chrono24, WatchBox, Watchfinder) over general marketplaces
2. Pay close attention to reference numbers and exact specifications - even small variations impact value
3. Be wary of listings that don't clearly specify box/papers status - these typically command premium prices
4. Consider market liquidity - popular models have tighter price ranges while rarer pieces have wider spreads
5. Remember that watches listed across multiple platforms are often priced aspirationally
6. Focus on the price points where transactions are actually occurring, not just listing prices
7. Be skeptical of significant outliers on the high end (>25% above median)

MOST IMPORTANTLY, focus on a realistic immediate-sale price point (40-45th percentile), not the highest potential value.
`;
        } else if (category.toLowerCase().includes('bag') || category.toLowerCase().includes('handbag')) {
            categorySpecificPrompt = `
As a luxury handbag valuation expert, take a CONSERVATIVE approach to pricing. When analyzing handbag values:

1. Give preference to established resale platforms like Rebag, Fashionphile, and The RealReal over general marketplaces
2. Be highly skeptical of prices that seem too high relative to retail (except for rare/limited edition models)
3. Consider seasonal fluctuations and current demand patterns
4. Pay special attention to color and size, as these significantly impact resale value
5. Look for consistency in pricing across multiple platforms before establishing value
6. Consider the difference between listed prices and actual selling prices (typically 10-15% lower)
7. Factor in rapid depreciation curves for non-classic styles

MOST IMPORTANTLY, err on the side of a LOWER but defensible valuation - aim for the 40th percentile of valid data points.
`;
        } else if (category.toLowerCase().includes('jewelry') || category.toLowerCase().includes('jewel')) {
            categorySpecificPrompt = `
As a fine jewelry valuation expert, maintain a CONSERVATIVE and precise approach. When pricing jewelry:

1. CRITICALLY IMPORTANT: For NEW items with verified retail listings, prefer the official retail price as the primary reference
2. For pre-owned items, expect 30-50% below retail for standard pieces
3. Distinguish between current production items and vintage/discontinued pieces which may command premiums
4. Be skeptical of extreme markups on resale platforms, especially for current production pieces
5. Recognize that certain branded items (VCA, Cartier, etc.) hold value better than unbranded jewelry
6. Pay special attention to authenticity markers - extremely low prices may indicate replicas
7. For signed designer pieces, distinguish between current production and vintage/collectible pieces

MOST IMPORTANTLY: If you identify official retail listings from the brand itself, these should be weighted HEAVILY in your analysis for new condition items.
`;
        } else {
            // Default prompt for other categories
            categorySpecificPrompt = `
Be CONSERVATIVE in your pricing analysis. Err on the side of a LOWER but defensible valuation.
Focus on prices where transactions actually occur, not just listing prices.
Be skeptical of high-end outliers and aspirational pricing.
Aim for a valuation around the 35th percentile of valid data points.
`;
        }

        // Use circuit breaker pattern with retries and timeout
        return await retryWithBackoff(async () => {
            try {
                return await callWithTimeout(async () => {
                    // Create Claude prompt with condition impact information and enhanced confidence evaluation
                    const params = {
                        model: "claude-3-5-sonnet-20241022",
                        max_tokens: 1500,
                        temperature: 0.2,
                        system: "You are a luxury item pricing expert who analyzes market data to determine fair market values with special attention to data quality and confidence assessment. You prioritize CONSERVATIVE valuation approaches that favor the lower end of defensible market values.",
                        messages: [
                            {
                                role: "user",
                                content: `
I need you to analyze pricing data for this luxury item and provide a comprehensive confidence assessment:

Item Details:
- Title: ${match?.title || ''}
- Category: ${category}
- Condition: ${condition}

Condition Analysis:
- This item's condition would reduce its value to ${conditionAnalysis.conditionImpactPercentage}% of mint condition value
- Key factors: ${conditionAnalysis.sensitivityFactors.join(', ')}
- ${conditionAnalysis.description}

${categorySpecificPrompt}

Please analyze the following ${simplifiedResults.length} pricing data points. Identify outliers, determine the fair market value, and apply the condition adjustment.

When analyzing, consider:
1. The reliability of each source (some sources are more authoritative for certain categories)
2. Identify potential fakes/replicas based on prices that are too low
3. Identify outliers that should be excluded, being ESPECIALLY cautious with high-price outliers
4. Apply the condition adjustment of ${conditionAnalysis.conditionImpactPercentage}% to your fair market value
5. Current market trends for this type of item
6. Focus on ACTUAL TRANSACTION VALUES, not aspirational listing prices

MOST IMPORTANTLY, provide a detailed confidence assessment based on:
- Number of reliable data points (after filtering outliers)
- Variance/consistency in pricing across listings
- Quality and reliability of data sources
- How well the item matches standard classifications
- Any unusual factors affecting pricing reliability

Return your analysis as structured JSON within <json></json> tags with these fields:
- outliers: Array of objects with "index" (number) and "reason" (string) properties
- fairMarketValue: Your assessment of the true market value in USD for a MINT condition version
- conditionAdjustedValue: The fair market value AFTER applying the ${conditionAnalysis.conditionImpactPercentage}% condition adjustment
- disbursedValue: 65% of the condition-adjusted value (rounded to nearest dollar)
- confidence: "High", "Medium", or "Low" based on your detailed assessment
- confidenceReasons: Array of strings explaining why you assigned this confidence level
- priceRange: Object with "low" and "high" values representing reasonable range after condition adjustment
- insights: Array of strings with key insights about the pricing
- recommendedListings: Array of numbers representing indices of the most reliable listings
- priceVariance: Object with "percentage" (number) and "explanation" (string) properties

Pricing Data:
${JSON.stringify(simplifiedResults, null, 2)}
`
                            }
                        ]
                    };

                    const response = await claudeCircuitBreaker.call(params);

                    // Extract the JSON from Claude's response
                    const claudeText = response.content[0].text;
                    const jsonMatch = claudeText.match(/<json>([\s\S]*?)<\/json>/);

                    if (!jsonMatch) {
                        console.warn('⚠️ Claude response did not contain properly formatted JSON for pricing analysis');
                        return calculatePricingSummary(results, originalItem, categoryData, conditionAnalysis);
                    }

                    // Parse Claude's analysis
                    const analysis = JSON.parse(jsonMatch[1]);

                    // Filter out outliers identified by Claude
                    const outliersIndices = analysis.outliers?.map(o => o.index) || [];
                    const filteredResults = results.filter((_, index) => !outliersIndices.includes(index));

                    console.log(`🔍 Claude outlier filtering: ${results.length} → ${filteredResults.length} items`);

                    // Format the outlier reasons for logging
                    if (analysis.outliers && analysis.outliers.length > 0) {
                        console.log('📋 Outliers identified by Claude:');
                        analysis.outliers.forEach(outlier => {
                            const item = simplifiedResults.find(i => i.index === outlier.index);
                            if (item) {
                                console.log(`⚠️ Excluded: ${item.title} ($${item.price}) - ${outlier.reason}`);
                            }
                        });
                    }

                    // Log confidence assessment from Claude
                    console.log(`📊 Claude Confidence Assessment: ${analysis.confidence}`);
                    if (analysis.confidenceReasons && analysis.confidenceReasons.length > 0) {
                        console.log('📊 Confidence Reasons:');
                        analysis.confidenceReasons.forEach((reason, index) => {
                            console.log(`  ${index + 1}. ${reason}`);
                        });
                    }

                    // Log condition impact and pricing
                    console.log(`📊 Condition-Adjusted Pricing Analysis:`);
                    console.log(`• Original Condition: ${condition}`);
                    console.log(`• Mint Condition Value: $${analysis.fairMarketValue || 0}`);
                    console.log(`• Condition Impact: ${conditionAnalysis.conditionImpactPercentage}%`);
                    console.log(`• Condition-Adjusted Value: $${analysis.conditionAdjustedValue || 0}`);
                    console.log(`• Disbursed Amount (65%): $${analysis.disbursedValue || 0}`);
                    console.log(`• Price Variance: ${JSON.stringify(analysis.priceVariance || {})}`);

                    // Use the condition-adjusted value as the market value
                    const marketValue = analysis.conditionAdjustedValue || 0;

                    // Use Claude's analysis to build the final pricing summary
                    const pricingData = {
                        marketValue: marketValue,
                        baseMarketValue: analysis.fairMarketValue || 0,
                        conditionImpact: conditionAnalysis.conditionImpactPercentage,
                        conditionAnalysis: {
                            description: conditionAnalysis.description,
                            sensitivityFactors: conditionAnalysis.sensitivityFactors,
                            confidence: conditionAnalysis.confidence
                        },
                        disbursedAmount: analysis.disbursedValue || Math.round(marketValue * 0.65),
                        confidence: analysis.confidence || 'Low',
                        confidenceReasons: analysis.confidenceReasons || [],
                        dataPoints: filteredResults.length,
                        priceRange: `$${analysis.priceRange?.low || 0} - $${analysis.priceRange?.high || 0}`,
                        marketValueRange: {
                            low: analysis.priceRange?.low || 0,
                            high: analysis.priceRange?.high || 0
                        },
                        priceVariance: analysis.priceVariance || null,
                        rawPrices: filteredResults.map(r => r.extracted_price).filter(p => p !== undefined),
                        insights: analysis.insights || [],
                        condition: condition,
                        executionTimeMs: timer.end(),
                        recommendedListings: (analysis.recommendedListings || []).map(index => {
                            if (index >= simplifiedResults.length) return null;
                            const item = simplifiedResults[index];
                            if (!item) return null;
                            return {
                                title: item.title || '',
                                price: item.price || 0,
                                source: item.source || '',
                                link: item.link || ''
                            };
                        }).filter(Boolean) // Remove any null items
                    };

                    // Apply category-specific adjustment factors
                    return applyCategorySpecificAdjustments(
                        pricingData,
                        originalItem,
                        pricingData.recommendedListings || []
                    );
                }, CONFIG.PRICING_OVERALL_TIMEOUT);
            } catch (error) {
                if (error.message.includes('Circuit is OPEN')) {
                    console.warn('⚠️ Claude circuit breaker is open, using traditional pricing calculation');
                } else if (error.message.includes('timed out')) {
                    console.warn('⚠️ Claude pricing analysis timed out, using traditional pricing calculation');
                } else {
                    console.error('❌ Error in Claude pricing analysis:', error.message);
                }

                // Fall back to traditional calculation
                return calculatePricingSummary(results, originalItem, categoryData, conditionAnalysis);
            }
        });
    } catch (error) {
        console.error('❌ Overall pricing analysis error:', error.message);
        // Fall back to traditional calculation
        return calculatePricingSummary(results, originalItem, categoryData, cachedConditionAnalysis);
    }
}

/**
 * Apply category-specific adjustment factors to better align with market prices
 * Particularly focused on StockX pricing adjustments for sneakers
 */
function applyCategorySpecificAdjustments(pricingData, originalItem, recommendedListings) {
    const timer = new OperationTimer('ApplyCategoryAdjustments');

    try {
        // Get the category and ensure it exists
        const category = originalItem?.category || '';
        let adjustmentApplied = false;
        let adjustmentFactor = 1.0;
        let adjustmentReason = '';

        // Original values for comparison
        const originalMarketValue = pricingData.marketValue || 0;

        // Check if this is a sneaker/shoe
        if (category.toLowerCase().includes('sneaker') || category.toLowerCase().includes('shoe')) {
            // Find if we have a StockX listing among the recommended listings
            const stockXListing = recommendedListings.find(listing =>
                listing.source && listing.source.toLowerCase().includes('stockx')
            );

            if (stockXListing) {
                // Use the confidence level and price variance as indicators for hyped items
                const confidence = pricingData.confidence || 'Medium';
                const priceVariance = pricingData.priceVariance?.percentage || 0;
                const priceRange = pricingData.marketValueRange?.high - pricingData.marketValueRange?.low || 0;

                // Items with high price variance and high price range are likely hyped collaborations
                const isLikelyHyped =
                    (priceVariance > 15 || priceRange > 200) &&
                    originalMarketValue > 500; // Higher priced items tend to be more collectible

                // Determine if the price is in a typical "hype" range
                const isHighValueItem = originalMarketValue > 800;

                // Look for collaboration indicators in the insights
                const insightsText = (pricingData.insights || []).join(' ').toLowerCase();
                const hasCollabMentionInInsights =
                    insightsText.includes('collab') ||
                    insightsText.includes('limited edition') ||
                    insightsText.includes('rare') ||
                    insightsText.includes('sought-after');

                // If multiple factors suggest this is a hyped item, apply stronger adjustment
                if ((isLikelyHyped && isHighValueItem) ||
                    (hasCollabMentionInInsights && isHighValueItem) ||
                    (confidence === 'Medium' && isHighValueItem)) {
                    adjustmentFactor = 0.85; // 85% of StockX price for likely hyped items
                    adjustmentReason = 'High-value/limited edition sneaker - StockX price adjustment';
                } else {
                    adjustmentFactor = 0.9; // 90% of StockX price for regular sneakers
                    adjustmentReason = 'Standard sneaker StockX price adjustment';
                }

                adjustmentApplied = true;
                console.log(`📊 StockX Adjustment: Applying ${Math.round(adjustmentFactor * 100)}% factor to sneaker price`);
            }
        }
        // Add more category-specific adjustments here as needed
        // For example, watches, handbags, etc.

        // If no adjustment needed, return the original data
        if (!adjustmentApplied || adjustmentFactor === 1.0) {
            return pricingData;
        }

        // Apply the adjustment factor to the market value
        const adjustedMarketValue = Math.round(originalMarketValue * adjustmentFactor);

        // Calculate the new disbursed amount based on the adjusted market value
        const adjustedDisbursedAmount = Math.round(adjustedMarketValue * 0.65);

        // Apply adjustment to price range
        const adjustedLow = Math.round((pricingData.marketValueRange?.low || 0) * adjustmentFactor);
        const adjustedHigh = Math.round((pricingData.marketValueRange?.high || 0) * adjustmentFactor);

        // Log the adjustment
        console.log(`📊 Market Value Adjustment:`);
        console.log(`• Original Value: $${originalMarketValue}`);
        console.log(`• Adjusted Value (${Math.round(adjustmentFactor * 100)}%): $${adjustedMarketValue}`);
        console.log(`• Adjustment Reason: ${adjustmentReason}`);

        // Return the adjusted pricing data
        return {
            ...pricingData,
            marketValue: adjustedMarketValue,
            disbursedAmount: adjustedDisbursedAmount,
            marketValueRange: {
                low: adjustedLow,
                high: adjustedHigh
            },
            priceRange: `$${adjustedLow} - $${adjustedHigh}`,
            adjustmentApplied: true,
            adjustmentFactor: `${Math.round(adjustmentFactor * 100)}%`,
            adjustmentReason: adjustmentReason,
            // Add the adjustment info to the insights
            insights: [
                `Price adjusted to ${Math.round(adjustmentFactor * 100)}% of StockX value for realistic market pricing`,
                ...(pricingData.insights || [])
            ]
        };
    } finally {
        timer.end();
    }
}

/**
 * Enhanced traditional calculation of pricing summary (fallback when Claude is unavailable)
 * Modified to accept cached condition analysis
 */
function calculatePricingSummary(results, originalItem, categoryData, cachedConditionAnalysis = null) {
    const timer = new OperationTimer('TraditionalPricingCalculation');

    try {
        // Default values if we don't have enough data
        if (!results || results.length === 0) {
            console.warn('⚠️ No pricing data points available');
            return {
                marketValue: 0,
                disbursedAmount: 0,
                confidence: 'None',
                dataPoints: 0,
                priceRange: null,
                marketValueRange: {
                    low: 0,
                    high: 0
                },
                rawPrices: [],
                insights: ['No valid pricing data available'],
                source: 'fallback'
            };
        }

        // Extract prices and sort them
        const prices = results
            .map(item => item.extracted_price)
            .filter(price => typeof price === 'number' && price > 0)
            .sort((a, b) => a - b);

        if (prices.length === 0) {
            console.warn('⚠️ No valid price points found');
            return {
                marketValue: 0,
                disbursedAmount: 0,
                confidence: 'None',
                dataPoints: 0,
                priceRange: null,
                marketValueRange: {
                    low: 0,
                    high: 0
                },
                rawPrices: [],
                insights: ['No valid price points found in results'],
                source: 'fallback'
            };
        }

        // Calculate statistics
        const count = prices.length;
        const min = prices[0];
        const max = prices[prices.length - 1];

        // Use a lower percentile (25th) for conservative pricing
        const conservativeIndex = Math.floor(count * 0.25);
        const conservativeValue = prices[conservativeIndex];

        // Calculate median for reference
        const middle = Math.floor(count / 2);
        const median = count % 2 === 0
            ? Math.round((prices[middle - 1] + prices[middle]) / 2)
            : prices[middle];

        // Calculate average for reference
        const sum = prices.reduce((acc, price) => acc + price, 0);
        const avg = Math.round(sum / count);

        // Use the 25th percentile as the market value for conservative pricing
        let marketValue = conservativeValue;

        // Initial values - will be potentially modified below
        let conditionAdjustedValue = marketValue;
        let conditionMultiplier = 1.0;

        // Set confidence level based on data points
        let confidence = 'Low';
        if (count >= 5) {
            confidence = 'High';
        } else if (count >= 3) {
            confidence = 'Medium';
        }

        // Calculate a reasonable price range (from 25th percentile to median)
        const lowerRange = marketValue;
        const upperRange = median;

        // Log the price analysis
        console.log('📊 Conservative Price Analysis:');
        console.log(`• Raw data points: [${prices.join(', ')}]`);
        console.log(`• 25th percentile price: $${conservativeValue}`);
        console.log(`• Median price: $${median}`);
        console.log(`• Average price: $${avg}`);
        console.log(`• Range: $${min} - $${max}`);
        console.log(`• Selected market value (25th percentile): $${marketValue}`);

        // Use cached condition analysis if provided, otherwise calculate it
        let conditionImpact = cachedConditionAnalysis;
        if (!conditionImpact && originalItem) {
            conditionImpact = getStaticConditionMultiplier(originalItem, categoryData);
        }

        // Apply condition multiplier if we have condition impact data
        if (conditionImpact) {
            conditionMultiplier = conditionImpact.conditionMultiplier;
            
            // Apply condition adjustment
            conditionAdjustedValue = Math.round(marketValue * conditionMultiplier);
            console.log(`• Condition adjustment: ${Math.round(conditionMultiplier * 100)}% → $${conditionAdjustedValue}`);
        }

        // Calculate disbursed amount based on final condition-adjusted value
        const disbursedAmount = Math.round(conditionAdjustedValue * 0.65);
        console.log(`• Final calculated value: $${disbursedAmount}`);
        console.log(`• Confidence: ${confidence} (${count} data points)`);

        return {
            marketValue: conditionAdjustedValue,
            baseMarketValue: marketValue,
            disbursedAmount: disbursedAmount,
            confidence: confidence,
            dataPoints: count,
            priceRange: `$${Math.round(lowerRange * conditionMultiplier)} - $${Math.round(upperRange * conditionMultiplier)}`,
            marketValueRange: {
                low: Math.round(lowerRange * conditionMultiplier),
                high: Math.round(upperRange * conditionMultiplier)
            },
            rawPrices: prices,
            conditionMultiplier: conditionMultiplier,
            insights: [
                "Value based on conservative 25th percentile pricing",
                "Price represents immediate liquidation value, not average listing price",
                "Conservative pricing strategy ensures competitive valuation"
            ],
            source: 'traditional'
        };
    } finally {
        timer.end();
    }
}

// Export the main function and helpers
module.exports = {
    fetchAndAnalyzePricingWithClaude,
    retryWithBackoff,
    callWithTimeout,
    // Also export existing functions to maintain compatibility
    filterByTrustedSources,
    calculatePricingSummary
};
