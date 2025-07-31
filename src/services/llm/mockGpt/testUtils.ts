/* eslint-disable indent */
/* eslint-disable no-nested-ternary */
import fs from 'fs';
import path from 'path';

export interface TestScenarioInfo {
    name: string;
    description: string;
    filename: string;
}

/**
 * Get list of available test scenarios
 */
export function getAvailableScenarios(): TestScenarioInfo[] {
    const scenariosDir = path.join(process.cwd(), 'src/services/llm/mockGpt/scenarios');

    if (!fs.existsSync(scenariosDir)) {
        return [];
    }

    const files = fs.readdirSync(scenariosDir).filter(file => file.endsWith('.json'));

    return files.map(filename => {
        try {
            const filePath = path.join(scenariosDir, filename);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return {
                name: content.name || filename.replace('.json', ''),
                description: content.description || 'No description available',
                filename: filename.replace('.json', ''),
            };
        } catch (error) {
            return {
                name: filename.replace('.json', ''),
                description: `Error loading scenario: ${error}`,
                filename: filename.replace('.json', ''),
            };
        }
    });
}

/**
 * Validate test scenario file
 */
export function validateScenario(scenarioName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        const scenarioPath = path.join(process.cwd(), 'src/services/llm/mockGpt/scenarios', `${scenarioName}.json`);

        if (!fs.existsSync(scenarioPath)) {
            errors.push(`Scenario file not found: ${scenarioPath}`);
            return { valid: false, errors };
        }

        const content = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));

        if (!content.name) {
            errors.push('Scenario must have a name');
        }

        if (!content.responses || !Array.isArray(content.responses)) {
            errors.push('Scenario must have a responses array');
        } else {
            content.responses.forEach((response: any, index: number) => {
                if (!response.id) {
                    errors.push(`Response ${index} must have an id`);
                }
                if (!response.response) {
                    errors.push(`Response ${index} must have a response object`);
                }
                if (!response.trigger) {
                    errors.push(`Response ${index} should have a trigger (optional but recommended)`);
                }
            });
        }
    } catch (error) {
        errors.push(`Error parsing scenario file: ${error}`);
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Create a test scenario from LLM logs
 */
export function createScenarioFromLogs(
    name: string,
    description: string,
    logEntries: Array<{
        prompt: string;
        response: any;
        functionCall?: string;
        templateId?: string;
    }>
): string {
    const responses = logEntries.map((entry, index) => ({
        id: `response-${index + 1}`,
        description: `Generated from log entry ${index + 1}`,
        trigger: entry.functionCall
            ? { type: 'function_name', value: entry.functionCall }
            : entry.templateId
              ? { type: 'template_id', value: entry.templateId }
              : { type: 'prompt_contains', value: entry.prompt.substring(0, 50) },
        response: entry.response,
    }));

    const scenario = {
        name,
        description,
        responses,
    };

    return JSON.stringify(scenario, null, 2);
}

/**
 * Environment variable helper for easy testing
 */
export function setTestEnvironment(scenarioName?: string) {
    process.env.LLM_PROVIDER = 'mock';
    if (scenarioName) {
        process.env.MOCK_TEST_SCENARIO = scenarioName;
    }
}

/**
 * Get test scenario from environment
 */
export function getTestScenarioFromEnv(): string | undefined {
    return process.env.MOCK_TEST_SCENARIO;
}
