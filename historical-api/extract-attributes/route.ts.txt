import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { retryWithBackoff } from '@/utils/queryBuilder';

// Define types for request body and related data
interface CategoryField {
    id: string;
}

interface CategoryData {
    id?: string;
}

interface Match {
    title?: string;
    description?: string;
}

interface RequestBody {
    match: Match;
    categoryFields: CategoryField[];
    categoryData?: CategoryData;
}

type Attributes = Record<string, string>;

// Define types for Anthropic response, if not provided by the SDK
interface AnthropicMessage {
    text: string;
}

interface AnthropicResponse {
    content: AnthropicMessage[];
}

export async function POST(req: NextRequest) {
    // Declare categoryFields outside try/catch so it's available in catch in case of errors
    let categoryFields: CategoryField[] = [];
    try {
        // Parse request with explicit typing
        const body = (await req.json()) as RequestBody;
        console.log('[extract-attributes] body:', body);
        const { match, categoryFields: reqCategoryFields, categoryData } = body;
        categoryFields = reqCategoryFields;

        // Use the retryWithBackoff utility to handle rate limiting
        const attributes: Attributes = await retryWithBackoff(async () => {
            const anthropic = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });

            // Build a simpler prompt focused on quick extraction
            const categoryId = categoryData?.id || 'unknown';
            const fieldIds = reqCategoryFields.map((field: CategoryField) => field.id).join(', ');

            // Build a compact text to analyze
            const textToAnalyze = [match.title || '', match.description || '']
                .filter(Boolean)
                .join(' ')
                .substring(0, 250);

            const response = await anthropic.messages.create({
                model: "claude-3-haiku-20240307", // Use faster Haiku model for this task
                max_tokens: 250,
                temperature: 0.1,
                system: "Extract product attributes into JSON. Be concise.",
                messages: [
                    {
                        role: "user",
                        content: `
Extract these attributes from this ${categoryId} listing: ${fieldIds}

"${textToAnalyze}"

Return just the JSON with no explanation:
<json>
{
  "field1": "value1",
  "field2": "value2"
}
</json>
`
                    }
                ]
            }) as AnthropicResponse;

            const claudeText = response.content[0].text;

            // Extract JSON between <json> tags
            const jsonMatch = claudeText.match(/<json>([\s\S]*?)<\/json>/);
            if (!jsonMatch) {
                throw new Error('No JSON found in Claude response');
            }

            console.log('[extract-attributes] response payload:', jsonMatch[1])

            return JSON.parse(jsonMatch[1]);
        }, 2); // Only retry once for speed

        // Map extracted attributes to ensure all fields are present
        const mappedAttributes: Attributes = {};
        reqCategoryFields.forEach((field: CategoryField) => {
            mappedAttributes[field.id] = attributes[field.id] || '';
        });

        return NextResponse.json(mappedAttributes);
    } catch (error) {
        console.error('Claude Extraction Error:', error);
        // Return empty object with the expected structure
        const emptyAttributes: Attributes = {};
        if (categoryFields && categoryFields.length > 0) {
            categoryFields.forEach((field: CategoryField) => {
                emptyAttributes[field.id] = '';
            });
        }
        return NextResponse.json(emptyAttributes);
    }
}
