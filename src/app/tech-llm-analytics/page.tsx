'use client';
import {
    Box,
    Text,
    Code,
    Accordion,
    Stack,
} from '@chakra-ui/react';
import testData from '../../../test/recordings/test.json';

// Типизация для данных (адаптируйте под структуру test.json при необходимости)
type LlmRequest = {
    user: string;
    requestId: string;
    tokens: number;
    cost: number;
    request: any;
    response: any;
    functionCalls?: any;
    prompt?: string;
    timestamp?: number;
};

const COST_PER_1K_TOKENS = 0.2; // ₽
const IMAGE_GENERATION_COST = 2.2; // ₽

function parseLlmRequests(data: any[]): LlmRequest[] {
    if (!Array.isArray(data)) return [];
    return data.map((item: any) => {
        const user = item.user || item.options?.user || 'unknown';
        const requestId =
            item.requestId ||
            item.options?.requestId ||
            item.options?.function_call?.requestId ||
            item.response?.requestId ||
            item.id ||
            'unknown';
        const tokens =
            (item.inputTokens || 0) + (item.outputTokens || 0) || item.tokens || item.usage?.total_tokens || 0;

        let cost;
        
        if (item.response.type === 'image') {
            cost = IMAGE_GENERATION_COST;
        } else {
            cost = (tokens / 1000) * COST_PER_1K_TOKENS;
        }

        const prompt = item.prompt || item.options?.prompt || '';
        const response = item.response || item.result || item;
        let functionCalls = undefined;
        if (item.options?.functions) functionCalls = item.options.functions;
        else if (item.options?.function_call) functionCalls = item.options.function_call;
        else if (item.response?.function_call) functionCalls = item.response.function_call;
        const timestamp = item.timestamp;
        return {
            user,
            requestId,
            tokens,
            cost,
            request: prompt,
            response,
            functionCalls,
            prompt,
            timestamp,
        };
    });
}

const llmRequests = parseLlmRequests(testData.recordings);

// Группировка по requestId
function groupByRequestId(requests: LlmRequest[]) {
    const map = new Map<string, { items: LlmRequest[]; tokens: number; cost: number }>();
    for (const req of requests) {
        if (!map.has(req.requestId)) {
            map.set(req.requestId, { items: [], tokens: 0, cost: 0 });
        }
        const group = map.get(req.requestId)!;
        group.items.push(req);
        group.tokens += req.tokens;
        group.cost += req.cost;
    }
    return Array.from(map.entries()).map(([requestId, { items, tokens, cost }]) => ({
        requestId,
        items,
        tokens,
        cost,
    }));
}

const grouped = groupByRequestId(llmRequests);

const TechLlmAnalyticsPage = () => {
    return (
        <Box maxW="1200px" mx="auto" mt={10} p={6}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
                LLM Запросы: аналитика по requestId
            </Text>
            <Accordion.Root multiple>
                {grouped.map(group => (
                    <Accordion.Item key={group.requestId} value={group.requestId}>
                        <Accordion.ItemTrigger>
                            <Box flex="1" textAlign="left">
                                <Text as="span" fontWeight="bold">
                                    {group.requestId}
                                </Text>
                                <Text as="span" ml={4}>
                                    Токенов: <b>{group.tokens}</b>
                                </Text>
                                <Text as="span" ml={4}>
                                    Запросов: <b>{group.items.length}</b>
                                </Text>
                                <Text as="span" ml={4}>
                                    Стоимость: <b>{group.cost}</b>
                                </Text>
                            </Box>
                            <Accordion.ItemIndicator />
                        </Accordion.ItemTrigger>
                        <Accordion.ItemContent>
                            <Accordion.ItemBody>
                                <Stack spacing={8}>
                                    {group.items.map((req, idx) => (
                                        <Box key={idx} p={2} borderWidth={1} borderRadius={8}>
                                            <Text fontWeight="bold" mb={1}>
                                                User: {req.user}
                                            </Text>
                                            {req.timestamp && (
                                                <Text fontSize="sm" color="gray.500" mb={1}>
                                                    {new Date(req.timestamp).toLocaleString()}
                                                </Text>
                                            )}
                                            <Text fontWeight="semibold" mb={1}>
                                                Prompt:
                                            </Text>
                                            <Code width="100%" whiteSpace="pre-wrap" display="block" mb={2} p={2}>
                                                {typeof req.request === 'string'
                                                    ? req.request
                                                    : JSON.stringify(req.request, null, 2)}
                                            </Code>
                                            <Text fontWeight="semibold" mb={1}>
                                                Response:
                                            </Text>
                                            <Code width="100%" whiteSpace="pre-wrap" display="block" mb={2} p={2}>
                                                {JSON.stringify(req.response, null, 2)}
                                            </Code>
                                            {req.functionCalls && (
                                                <>
                                                    <Text fontWeight="semibold" mb={1}>
                                                        Function Calls:
                                                    </Text>
                                                    <Code width="100%" whiteSpace="pre-wrap" display="block" mb={2} p={2}>
                                                        {JSON.stringify(req.functionCalls, null, 2)}
                                                    </Code>
                                                </>
                                            )}
                                            <Text fontSize="sm" color="gray.600">
                                                Токенов: {req.tokens} | Стоимость: {req.cost}
                                            </Text>
                                        </Box>
                                    ))}
                                </Stack>
                            </Accordion.ItemBody>
                        </Accordion.ItemContent>
                    </Accordion.Item>
                ))}
            </Accordion.Root>
        </Box>
    );
};

export default TechLlmAnalyticsPage;
