/* eslint-disable prettier/prettier */
/* eslint-disable no-nested-ternary */
import { Box, Text, Table, HStack, VStack, Badge } from '@chakra-ui/react';
import { LLMHistoryService } from '@/services/llm/history/llmHistoryService';
import { isValidRequestId } from '@/utils/requestId';
import { notFound } from 'next/navigation';
import ExportScenarioButton from './ExportScenarioButton';
import LinkButton from '@/components/LinkButton';

interface PageProps {
    params: {
        requestId: string;
    };
}

export async function generateMetadata({ params }: PageProps) {
    const shortId = params.requestId.substring(0, 8);
    return {
        title: `Request Details: ${shortId}...`,
        description: `Detailed view of all LLM requests for request ID ${shortId}...`,
    };
}

export default async function RequestDetailsPage({ params }: PageProps) {
    const { requestId } = params;

    // Validate requestId format
    if (!isValidRequestId(requestId)) {
        notFound();
    }

    const requests = await LLMHistoryService.getRequestsByRequestId(requestId);

    if (requests.length === 0) {
        notFound();
    }

    // Group requests by type for better organization
    const requestsByType = requests.reduce(
        (acc, req) => {
            const type = req.requestType;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(req);
            return acc;
        },
        {} as Record<string, typeof requests>
    );

    const shortId = requestId.substring(0, 8);

    return (
        <Box maxW="1200px" mx="auto" mt={10} p={6}>
            <HStack justify="space-between" align="center" mb={6}>
                <VStack align="start" gap={1}>
                    <Text fontSize="2xl" fontWeight="bold">
                        Request Details: {shortId}...
                    </Text>
                    <Text color="gray.600" fontSize="sm" fontFamily="mono">
                        Full ID: {requestId}
                    </Text>
                </VStack>
                <HStack>
                    <ExportScenarioButton requestId={requestId} requestCount={requests.length} />
                    <LinkButton href="/tech-llm-analytics" variant="outline" size="sm">
                        ← Back to Analytics
                    </LinkButton>
                </HStack>
            </HStack>

            {/* Summary */}
            <Box mb={6} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                <Text fontSize="lg" fontWeight="semibold" mb={3}>
                    Summary
                </Text>
                <HStack gap={6} wrap="wrap">
                    <Text>
                        <strong>Total Requests:</strong> {requests.length}
                    </Text>
                    <Text>
                        <strong>Duration:</strong> {requests[0]?.timestamp.toLocaleString()} -{' '}
                        {requests[requests.length - 1]?.timestamp.toLocaleString()}
                    </Text>
                    <Text>
                        <strong>User:</strong> {requests[0]?.userId || 'Unknown'}
                    </Text>
                    <Text>
                        <strong>Success Rate:</strong>{' '}
                        {Math.round((requests.filter(r => r.success).length / requests.length) * 100)}%
                    </Text>
                </HStack>
            </Box>

            {/* Requests by Type */}
            {Object.entries(requestsByType).map(([type, typeRequests]) => (
                <Box key={type} mb={8}>
                    <HStack mb={4}>
                        <Text fontSize="lg" fontWeight="semibold">
                            {type}
                        </Text>
                        <Badge colorScheme="blue" variant="subtle">
                            {typeRequests.length} requests
                        </Badge>
                    </HStack>

                    <Table.Root variant="outline" size="sm">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Time</Table.ColumnHeader>
                                <Table.ColumnHeader>Provider</Table.ColumnHeader>
                                <Table.ColumnHeader>Prompt</Table.ColumnHeader>
                                <Table.ColumnHeader>Response</Table.ColumnHeader>
                                <Table.ColumnHeader>Tokens</Table.ColumnHeader>
                                <Table.ColumnHeader>Duration</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {typeRequests.map(req => (
                                <Table.Row key={req.id}>
                                    <Table.Cell>
                                        <Text fontSize="xs" color="gray.600">
                                            {req.timestamp.toLocaleTimeString()}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorScheme={
                                                req.provider === 'mock'
                                                    ? 'orange'
                                                    : req.provider === 'yagpt'
                                                        ? 'green'
                                                        : 'blue'
                                            }
                                            variant="subtle"
                                        >
                                            {req.provider}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell maxW="300px">
                                        <Text
                                            fontSize="xs"
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            whiteSpace="nowrap"
                                            title={req.prompt}
                                        >
                                            {req.prompt.length > 50 ? `${req.prompt.substring(0, 50)}...` : req.prompt}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell maxW="300px">
                                        <Text
                                            fontSize="xs"
                                            overflow="hidden"
                                            textOverflow="ellipsis"
                                            whiteSpace="nowrap"
                                            title={req.responseContent || ''}
                                        >
                                            {req.responseContent
                                                ? req.responseContent.length > 50
                                                    ? `${req.responseContent.substring(0, 50)}...`
                                                    : req.responseContent
                                                : '-'}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="xs">In: {req.inputTokens}</Text>
                                            <Text fontSize="xs">Out: {req.outputTokens}</Text>
                                            <Text fontSize="xs" fontWeight="semibold">
                                                Total: {req.totalTokens}
                                            </Text>
                                        </VStack>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Text fontSize="xs">{req.duration}ms</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge colorScheme={req.success ? 'green' : 'red'} variant="subtle">
                                            {req.success ? 'Success' : 'Failed'}
                                        </Badge>
                                        {req.errorMessage && (
                                            <Text fontSize="xs" color="red.600" mt={1} title={req.errorMessage}>
                                                {req.errorMessage.length > 30
                                                    ? `${req.errorMessage.substring(0, 30)}...`
                                                    : req.errorMessage}
                                            </Text>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            ))}

            {/* Raw Data (collapsible) */}
            <details>
                <summary style={{ cursor: 'pointer', padding: '8px 0' }}>
                    <Text as="span" fontWeight="semibold">
                        Show Raw Data
                    </Text>
                </summary>
                <Box mt={4} p={4} bg="gray.50" borderRadius="md" maxH="400px" overflowY="auto">
                    <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(requests, null, 2)}</pre>
                </Box>
            </details>
        </Box>
    );
}
