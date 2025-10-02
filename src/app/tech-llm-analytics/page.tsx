import { Box, Text, Table, DataList, Input, Button, HStack, VStack } from '@chakra-ui/react';
import { LLMHistoryService } from '@/services/llm/history/llmHistoryService';
import LinkButton from '@/components/LinkButton';

interface SearchParams {
    requestId?: string;
    userId?: string;
    provider?: string;
}

interface PageProps {
    searchParams: SearchParams;
}

export default async function TechLlmAnalyticsPage({ searchParams }: PageProps) {
    const { requestId, userId, provider } = searchParams;

    const [history, stats, requestIds] = await Promise.all([
        LLMHistoryService.getAllHistory({
            limit: 50,
            requestId,
            userId,
            provider,
        }),
        LLMHistoryService.getGlobalStats(),
        LLMHistoryService.getRequestIds({ limit: 50 }),
    ]);

    return (
        <Box maxW="1200px" mx="auto" mt={10} p={6}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
                LLM Request History
            </Text>

            {/* Filters */}
            <Box mb={6} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                <Text fontSize="lg" fontWeight="semibold" mb={4}>
                    Filters
                </Text>
                <form method="GET">
                    <VStack align="start" gap={4}>
                        <HStack gap={4} wrap="wrap">
                            <Box>
                                <Text fontSize="sm" mb={1}>
                                    Request ID:
                                </Text>
                                <Input
                                    name="requestId"
                                    placeholder="Filter by request ID"
                                    defaultValue={requestId}
                                    size="sm"
                                    width="200px"
                                />
                            </Box>
                            <Box>
                                <Text fontSize="sm" mb={1}>
                                    User ID:
                                </Text>
                                <Input
                                    name="userId"
                                    placeholder="Filter by user ID"
                                    defaultValue={userId}
                                    size="sm"
                                    width="200px"
                                />
                            </Box>
                            <Box>
                                <Text fontSize="sm" mb={1}>
                                    Provider:
                                </Text>
                                <Input
                                    name="provider"
                                    placeholder="Filter by provider"
                                    defaultValue={provider}
                                    size="sm"
                                    width="150px"
                                />
                            </Box>
                        </HStack>
                        <HStack>
                            <Button type="submit" colorScheme="blue" size="sm">
                                Apply Filters
                            </Button>
                            <LinkButton href="/tech-llm-analytics" variant="outline" size="sm">
                                Clear Filters
                            </LinkButton>
                        </HStack>
                    </VStack>
                </form>
            </Box>

            {/* Recent Request IDs */}
            {requestIds.length > 0 && (
                <Box mb={6} p={4} border="1px solid" borderColor="gray.100" borderRadius="md">
                    <Text fontSize="lg" fontWeight="semibold" mb={3}>
                        Recent Request IDs
                    </Text>
                    <Box maxH="200px" overflowY="auto">
                        <VStack align="start" gap={1}>
                            {requestIds.map(
                                (req: {
                                    requestId: string;
                                    _count: { id: number };
                                    _min: { timestamp: Date | null };
                                }) => (
                                    <Box key={req.requestId} fontSize="sm">
                                        <LinkButton
                                            href={`/tech-llm-analytics/${req.requestId}`}
                                            variant="plain"
                                            size="sm"
                                            color="blue.500"
                                        >
                                            {req.requestId?.substring(0, 8)}...
                                        </LinkButton>
                                        <Text as="span" color="gray.600" ml={2}>
                                            ({req._count.id} requests, {req._min.timestamp?.toLocaleString()})
                                        </Text>
                                    </Box>
                                )
                            )}
                        </VStack>
                    </Box>
                </Box>
            )}

            {/* Stats */}
            <Box mb={6}>
                <Text>Total requests: {stats.totalRequests}</Text>
                <Text>Error rate: {(stats.errorRate * 100).toFixed(2)}%</Text>
                <Text mt={2}>Requests per provider:</Text>

                <DataList.Root>
                    {stats.byProvider.map((p: { provider: string; count: number }) => (
                        <DataList.Item key={p.provider}>
                            <DataList.ItemLabel>{p.provider}</DataList.ItemLabel>
                            <DataList.ItemValue>{p.count}</DataList.ItemValue>
                        </DataList.Item>
                    ))}
                </DataList.Root>
                <Text mt={2}>Requests per type:</Text>
                <DataList.Root>
                    {stats.byType.map((t: { type: string; count: number }) => (
                        <DataList.Item key={t.type}>
                            <DataList.ItemLabel>{t.type}</DataList.ItemLabel>
                            <DataList.ItemValue>{t.count}</DataList.ItemValue>
                        </DataList.Item>
                    ))}
                </DataList.Root>
            </Box>

            {/* Current filters display */}
            {(requestId || userId || provider) && (
                <Box mb={4} p={3} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>
                        Active Filters:
                    </Text>
                    <HStack gap={4} wrap="wrap">
                        {requestId && (
                            <Text fontSize="sm">
                                <strong>Request ID:</strong> {requestId}
                            </Text>
                        )}
                        {userId && (
                            <Text fontSize="sm">
                                <strong>User ID:</strong> {userId}
                            </Text>
                        )}
                        {provider && (
                            <Text fontSize="sm">
                                <strong>Provider:</strong> {provider}
                            </Text>
                        )}
                    </HStack>
                </Box>
            )}

            {/* Results */}
            <Table.Root variant="outline" size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
                        <Table.ColumnHeader>Request ID</Table.ColumnHeader>
                        <Table.ColumnHeader>User</Table.ColumnHeader>
                        <Table.ColumnHeader>Provider</Table.ColumnHeader>
                        <Table.ColumnHeader>Type</Table.ColumnHeader>
                        <Table.ColumnHeader>Prompt</Table.ColumnHeader>
                        <Table.ColumnHeader>Response</Table.ColumnHeader>
                        <Table.ColumnHeader>Status</Table.ColumnHeader>
                        <Table.ColumnHeader>Error</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {history.map((req: any) => (
                        <Table.Row key={req.id}>
                            <Table.Cell>{req.timestamp.toISOString()}</Table.Cell>
                            <Table.Cell>
                                {req.requestId ? (
                                    <LinkButton
                                        href={`/tech-llm-analytics/${req.requestId}`}
                                        variant="plain"
                                        size="xs"
                                        color="blue.500"
                                        title={req.requestId}
                                    >
                                        {req.requestId.substring(0, 8)}...
                                    </LinkButton>
                                ) : (
                                    <Text color="gray.400">-</Text>
                                )}
                            </Table.Cell>
                            <Table.Cell>{req.userId}</Table.Cell>
                            <Table.Cell>{req.provider}</Table.Cell>
                            <Table.Cell>{req.requestType}</Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap" maxW="300px" overflow="hidden" textOverflow="ellipsis">
                                {req.prompt.length > 100 ? `${req.prompt.substring(0, 100)}...` : req.prompt}
                            </Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap" maxW="300px" overflow="hidden" textOverflow="ellipsis">
                                {req.responseContent && req.responseContent.length > 100
                                    ? `${req.responseContent.substring(0, 100)}...`
                                    : req.responseContent || '-'}
                            </Table.Cell>
                            <Table.Cell>{req.success ? 'ok' : 'fail'}</Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap" maxW="200px" overflow="hidden" textOverflow="ellipsis">
                                {req.errorMessage || '-'}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>

            {history.length === 0 && (
                <Box textAlign="center" py={8}>
                    <Text color="gray.500">No requests found matching the current filters.</Text>
                </Box>
            )}
        </Box>
    );
}
