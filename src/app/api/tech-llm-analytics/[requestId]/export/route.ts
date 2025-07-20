import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LLMHistoryService } from '@/services/llm/history/llmHistoryService';
import { exportToMockGPTScenario, generateScenarioFile, generateScenarioFilename } from '@/utils/exportScenario';
import { isValidRequestId } from '@/utils/requestId';

interface RouteParams {
    params: {
        requestId: string;
    };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId } = params;

        // Validate requestId format
        if (!isValidRequestId(requestId)) {
            return NextResponse.json({ error: 'Invalid request ID format' }, { status: 400 });
        }

        // Get all requests for this requestId
        const requests = await LLMHistoryService.getRequestsByRequestId(requestId);

        if (requests.length === 0) {
            return NextResponse.json({ error: 'No requests found for this request ID' }, { status: 404 });
        }

        // Get query parameters for customization
        const url = new URL(request.url);
        const scenarioName = url.searchParams.get('name') || `Exported Scenario ${requestId.substring(0, 8)}`;
        const scenarioDescription =
            url.searchParams.get('description') ||
            `Exported from ${requests.length} LLM requests on ${new Date().toLocaleDateString()}`;

        // Convert requests to MockGPT scenario format
        const scenario = exportToMockGPTScenario(requests, scenarioName, scenarioDescription);

        // Generate file content
        const fileContent = generateScenarioFile(scenario);
        const filename = generateScenarioFilename(scenarioName);

        // Return as downloadable file
        return new NextResponse(fileContent, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileContent.length.toString(),
            },
        });
    } catch (error) {
        console.error('Error exporting scenario:', error);
        return NextResponse.json({ error: 'Failed to export scenario' }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { requestId } = params;

        // Validate requestId format
        if (!isValidRequestId(requestId)) {
            return NextResponse.json({ error: 'Invalid request ID format' }, { status: 400 });
        }

        const body = await request.json();
        const { name, description, saveToFile = false } = body;

        // Get all requests for this requestId
        const requests = await LLMHistoryService.getRequestsByRequestId(requestId);

        if (requests.length === 0) {
            return NextResponse.json({ error: 'No requests found for this request ID' }, { status: 404 });
        }

        // Convert requests to MockGPT scenario format
        const scenario = exportToMockGPTScenario(
            requests,
            name || `Exported Scenario ${requestId.substring(0, 8)}`,
            description
        );

        if (saveToFile) {
            // Save to scenarios directory (for development/testing)
            const fs = require('fs');
            const path = require('path');

            const scenariosDir = path.join(process.cwd(), 'src/services/llm/mockGpt/scenarios');
            const filename = generateScenarioFilename(scenario.name).replace('.json', '');
            const filepath = path.join(scenariosDir, `${filename}.json`);

            // Check if file already exists
            if (fs.existsSync(filepath)) {
                return NextResponse.json({ error: 'Scenario file already exists' }, { status: 409 });
            }

            fs.writeFileSync(filepath, generateScenarioFile(scenario));

            return NextResponse.json({
                message: 'Scenario saved successfully',
                filename: `${filename}.json`,
                path: filepath,
                scenario,
            });
        }

        // Return scenario data
        return NextResponse.json({ scenario });
    } catch (error) {
        console.error('Error creating scenario:', error);
        return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
    }
}
