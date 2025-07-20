import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAvailableScenarios, validateScenario, createScenarioFromLogs } from '@/services/llm/mockGpt/testUtils';
import fs from 'fs';
import path from 'path';

// GET /api/test/scenarios - List all available scenarios
export async function GET() {
    try {
        // Check authentication (optional for testing)
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scenarios = getAvailableScenarios();
        return NextResponse.json({ scenarios });
    } catch (error) {
        console.error('Error listing scenarios:', error);
        return NextResponse.json({ error: 'Failed to list scenarios' }, { status: 500 });
    }
}

// POST /api/test/scenarios - Create new scenario or validate existing
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, scenarioName, scenarioData } = body;

        switch (action) {
            case 'validate':
                if (!scenarioName) {
                    return NextResponse.json({ error: 'scenarioName is required for validation' }, { status: 400 });
                }
                const validation = validateScenario(scenarioName);
                return NextResponse.json(validation);

            case 'create':
                if (!scenarioName || !scenarioData) {
                    return NextResponse.json(
                        { error: 'scenarioName and scenarioData are required for creation' },
                        { status: 400 }
                    );
                }

                const scenarioPath = path.join(
                    process.cwd(),
                    'src/services/llm/mockGpt/scenarios',
                    `${scenarioName}.json`
                );

                // Check if file already exists
                if (fs.existsSync(scenarioPath)) {
                    return NextResponse.json({ error: 'Scenario already exists' }, { status: 409 });
                }

                fs.writeFileSync(scenarioPath, JSON.stringify(scenarioData, null, 2));
                return NextResponse.json({
                    message: 'Scenario created successfully',
                    path: scenarioPath,
                });

            case 'createFromLogs':
                const { name, description, logEntries } = body;
                if (!name || !logEntries) {
                    return NextResponse.json({ error: 'name and logEntries are required' }, { status: 400 });
                }

                const scenarioContent = createScenarioFromLogs(name, description || '', logEntries);
                const logScenarioPath = path.join(
                    process.cwd(),
                    'src/services/llm/mockGpt/scenarios',
                    `${name.toLowerCase().replace(/\s+/g, '-')}.json`
                );

                fs.writeFileSync(logScenarioPath, scenarioContent);
                return NextResponse.json({
                    message: 'Scenario created from logs successfully',
                    path: logScenarioPath,
                    content: scenarioContent,
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use "validate", "create", or "createFromLogs"' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error handling scenario request:', error);
        return NextResponse.json({ error: 'Failed to process scenario request' }, { status: 500 });
    }
}
