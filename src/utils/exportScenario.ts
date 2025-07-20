interface LLMRequest {
    id: string;
    requestId: string;
    provider: string;
    requestType: string;
    prompt: string;
    responseContent: string | null;
    functionCall: string | null;
    functionArguments: string | null;
    timestamp: Date;
    success: boolean;
    errorMessage: string | null;
}

interface MockGPTScenario {
    name: string;
    description: string;
    responses: MockGPTResponse[];
}

interface MockGPTResponse {
    id: string;
    description: string;
    trigger: {
        type: 'prompt_contains' | 'function_name' | 'template_id';
        value: string;
    };
    response: {
        elements: any[];
        function_call?: {
            name: string;
            arguments: any;
        };
    };
}

/**
 * Extract template ID from prompt text
 */
function extractTemplateId(prompt: string): string | null {
    // Look for template mentions in the prompt
    const templateMatches = prompt.match(/шаблон[а-я\s]*:?\s*([a-z-]+)/i);
    if (templateMatches) {
        return templateMatches[1];
    }

    // Look for common template patterns
    const patterns = [
        { pattern: /двухколон|two.column/i, template: 'two-columns' },
        { pattern: /приветств|welcome/i, template: 'welcome-slide' },
        { pattern: /финальн|final|контакт/i, template: 'final-slide-contacts' },
        { pattern: /диаграмм|chart/i, template: 'chart' },
        { pattern: /умн[а-я]*\s*макет|smart.layout/i, template: 'smart-layout' },
        { pattern: /изображени[а-я]*.*текст|image.*text/i, template: 'image-text' },
        { pattern: /текст.*изображени|text.*image/i, template: 'text-image' },
    ];

    for (const { pattern, template } of patterns) {
        if (pattern.test(prompt)) {
            return template;
        }
    }

    return null;
}

/**
 * Generate trigger for a request
 */
function generateTrigger(request: LLMRequest): MockGPTResponse['trigger'] {
    // If there's a function call, use function_name trigger
    if (request.functionCall) {
        return {
            type: 'function_name',
            value: request.functionCall,
        };
    }

    // Try to extract template ID
    // const templateId = extractTemplateId(request.prompt);
    // if (templateId) {
    //     return {
    //         type: 'template_id',
    //         value: templateId,
    //     };
    // }

    // Fallback to prompt_contains with a meaningful snippet
    const promptSnippet = request.prompt
        .replace(/\n/g, ' ')
        .substring(0, 50)
        .trim();

    return {
        type: 'prompt_contains',
        value: promptSnippet,
    };
}

/**
 * Parse response content to extract function call
 */
function parseResponseContent(responseContent: string | null, functionCall: string | null, functionArguments: string | null) {
    if (!responseContent) {
        return { elements: [] };
    }

    try {
        // Try to parse as JSON first
        const parsed = JSON.parse(responseContent);
        
        // If it's already in the correct format, return it
        if (parsed.function_call || parsed.elements) {
            return parsed;
        }
    } catch {
        // If JSON parsing fails, treat as plain text
    }

    // If we have function call info, construct the response
    if (functionCall && functionArguments) {
        try {
            const args = JSON.parse(functionArguments);
            return {
                elements: [],
                function_call: {
                    name: functionCall,
                    arguments: args,
                },
            };
        } catch {
            // If function arguments parsing fails, use raw content
        }
    }

    // Fallback: treat as text response
    return {
        elements: [
            {
                type: 'text',
                content: responseContent,
                metadata: {},
            },
        ],
    };
}

/**
 * Export LLM requests to MockGPT scenario format
 */
export function exportToMockGPTScenario(
    requests: LLMRequest[],
    scenarioName: string,
    scenarioDescription?: string
): MockGPTScenario {
    // Filter only successful requests with meaningful responses
    const validRequests = requests.filter(
        req => req.success && (req.responseContent || req.functionCall)
    );

    const responses: MockGPTResponse[] = validRequests.map((request, index) => {
        const trigger = generateTrigger(request);
        const response = parseResponseContent(
            request.responseContent,
            request.functionCall,
            request.functionArguments
        );

        return {
            id: `exported-response-${index + 1}`,
            description: `Exported from ${request.provider} - ${request.requestType} (${request.timestamp.toISOString()})`,
            trigger,
            response,
        };
    });

    return {
        name: scenarioName,
        description: scenarioDescription || `Exported scenario from ${requests.length} requests`,
        responses,
    };
}

/**
 * Generate a downloadable JSON file content
 */
export function generateScenarioFile(scenario: MockGPTScenario): string {
    return JSON.stringify(scenario, null, 2);
}

/**
 * Create a filename for the scenario
 */
export function generateScenarioFilename(scenarioName: string): string {
    const sanitizedName = scenarioName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedName}-${timestamp}.json`;
} 