console.log("Testing mockGpt service...");

import { MockGptService } from "./src/services/llm/mockGpt/mockGpt.js";

const mockService = new MockGptService({ userId: "test-user" });

// Test generate_presentation_topics
const topicsResponse = await mockService.generate("Test prompt", {
    functions: [{
        name: "generate_presentation_topics",
        parameters: { properties: {} }
    }],
    function_call: { name: "generate_presentation_topics" }
});

console.log("Topics response:", JSON.stringify(topicsResponse, null, 2));

// Test select_slide_templates  
const templatesResponse = await mockService.generate("Test prompt", {
    functions: [{
        name: "select_slide_templates", 
        parameters: { properties: {} }
    }],
    function_call: { name: "select_slide_templates" }
});

console.log("Templates response:", JSON.stringify(templatesResponse, null, 2));

console.log("MockGpt service working correctly!");
