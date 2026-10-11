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

        // Extract attributes using Claude endpoint
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

            // For remaining matches, do minimal processing
            let attributes = {};

            try {
                attributes = await extractAttributesWithClaude(match, fields, categoryData);
            } catch (err) {
                console.error('Attribute extraction error:', err);
                // Create empty attributes object for fallback
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


/**
 * Generate a display title from attributes and category
 * Note: Condition is intentionally excluded as it will be adjusted at pricing stage
 */
function generateDisplayTitle(match, attributes, categoryData) {
    // If we have a brand and model, use those as the primary title
    if (attributes.brand && attributes.modelName) {
        let title = `${attributes.brand} ${attributes.modelName}`;

        // Add category-specific important attributes (excluding condition)
        if (categoryData) {
            switch(categoryData.id) {
                case 'watches':
                    if (attributes.caseMaterial) {
                        title += ` ${attributes.caseMaterial}`;
                    }
                    if (attributes.yearManufacture) {
                        title += ` (${attributes.yearManufacture})`;
                    }
                    break;

                case 'handbags':
                    if (attributes.material && attributes.size) {
                        title += ` ${attributes.size} ${attributes.material}`;
                    } else if (attributes.material) {
                        title += ` ${attributes.material}`;
                    } else if (attributes.size) {
                        title += ` ${attributes.size}`;
                    }
                    if (attributes.color) {
                        title += ` in ${attributes.color}`;
                    }
                    break;

                case 'jewelry':
                    if (attributes.material && attributes.gemstoneType) {
                        title += ` ${attributes.material} with ${attributes.gemstoneType}`;
                    } else if (attributes.material) {
                        title += ` ${attributes.material}`;
                    } else if (attributes.gemstoneType) {
                        title += ` with ${attributes.gemstoneType}`;
                    }
                    break;

                case 'sneakers':
                    if (attributes.colorway) {
                        title += ` "${attributes.colorway}"`;
                    }
                    if (attributes.size) {
                        title += ` Size ${attributes.size}`;
                    }
                    break;
            }
        }

        return title;
    }

    // Handle collaborations specially
    if (match.title && match.title.includes(' x ')) {
        return match.title;
    }

    // Fallback to the match title if available
    if (match.title) {
        return match.title
            .replace(/^Men's\s+/, '')
            .replace(/^Women's\s+/, '')
            .replace(/\s+\d+\.?\d*\s*US$/, '') // Remove size from the end
            .trim();
    }

    // Last resort fallback
    return "Unknown Item";
}

/**
 * Extract structured attributes using server-side GPT-powered NLP
 * @param {Object} match - The matched item
 * @param {Array} categoryFields - Fields specific to the category
 * @param {Object} categoryData - Category-specific metadata
 * @returns {Object} Extracted and normalized attributes
 */
async function extractAttributesWithClaude(match, categoryFields, categoryData) {
    try {
        // Make a direct API call to a custom Claude endpoint
        const response = await fetch('/api/extract-attributes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                match,
                categoryFields,
                categoryData
            })
        });

        if (!response.ok) {
            console.warn('Attribute extraction failed', await response.text());
            // Return empty object with field IDs
            return categoryFields.reduce((acc, field) => {
                acc[field.id] = '';
                return acc;
            }, {});
        }

        return await response.json();
    } catch (error) {
        console.error('Attribute extraction error:', error);
        // Return empty object with field IDs
        return categoryFields.reduce((acc, field) => {
            acc[field.id] = '';
            return acc;
        }, {});
    }
}

export { extractAttributesWithClaude };
