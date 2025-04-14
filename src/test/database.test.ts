import { prisma } from '@/lib/prisma';
import { expect, test, describe, beforeAll, afterAll } from '@jest/globals';

// Mock data
const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword123',
    role: 'user',
};

const testPresentation = {
    title: 'Test Presentation',
    description: 'A test presentation',
    slides: [
        {
            id: 'slide-1',
            layouts: [
                {
                    id: 'layout-1',
                    type: 'single-column',
                    elements: [
                        {
                            id: 'element-1',
                            type: 'text',
                            content: 'Hello world',
                            cellId: 'cell-1',
                        },
                    ],
                    gridStructure: {
                        rows: [
                            {
                                id: 'row-1',
                                cells: [
                                    {
                                        id: 'cell-1',
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: ['100%'],
                    },
                    style: {},
                },
            ],
        },
    ],
};

describe('Database Operations', () => {
    let userId: string;
    let presentationId: string;

    // Setup: Create a test user
    beforeAll(async () => {
        // Clean up any existing test data
        await prisma.presentation.deleteMany({
            where: {
                title: testPresentation.title,
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: testUser.email,
            },
        });

        // Create test user
        const user = await prisma.user.create({
            data: testUser,
        });

        userId = user.id;
    });

    // Cleanup after tests
    afterAll(async () => {
        // Clean up test data
        if (presentationId) {
            await prisma.presentation.delete({
                where: {
                    id: presentationId,
                },
            });
        }

        await prisma.user.delete({
            where: {
                id: userId,
            },
        });

        await prisma.$disconnect();
    });

    test('can create a presentation with slides as JSON', async () => {
        // Create a presentation with slides as JSON string
        const presentation = await prisma.presentation.create({
            data: {
                title: testPresentation.title,
                description: testPresentation.description,
                userId,
                slides: JSON.stringify(testPresentation.slides),
            },
        });

        presentationId = presentation.id;

        // Verify the presentation was created
        expect(presentation).toBeDefined();
        expect(presentation.title).toBe(testPresentation.title);

        // Verify slides were stored as JSON string
        expect(typeof presentation.slides).toBe('string');

        // Parse the slides and verify the structure
        const parsedSlides = JSON.parse(presentation.slides as string);
        expect(Array.isArray(parsedSlides)).toBe(true);
        expect(parsedSlides.length).toBe(1);
        expect(parsedSlides[0].id).toBe('slide-1');
    });

    test('can retrieve and update a presentation with parsed slides', async () => {
        // Retrieve the presentation
        const presentation = await prisma.presentation.findUnique({
            where: {
                id: presentationId,
            },
        });

        expect(presentation).toBeDefined();

        // Parse slides for manipulation
        const slides = JSON.parse(presentation!.slides as string);

        // Modify slides
        slides[0].layouts[0].elements[0].content = 'Updated content';

        // Update presentation with modified slides
        const updatedPresentation = await prisma.presentation.update({
            where: {
                id: presentationId,
            },
            data: {
                slides: JSON.stringify(slides),
            },
        });

        // Verify update
        const updatedSlides = JSON.parse(updatedPresentation.slides as string);
        expect(updatedSlides[0].layouts[0].elements[0].content).toBe('Updated content');
    });
});
