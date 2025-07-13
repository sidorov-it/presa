import { Box, Text, Table, DataList } from '@chakra-ui/react';
import { LLMHistoryService } from '@/services/llm/history/llmHistoryService';

export default async function TechLlmAnalyticsPage() {
    const [history, stats] = await Promise.all([
        LLMHistoryService.getAllHistory({ limit: 50 }),
        LLMHistoryService.getGlobalStats(),
    ]);

    return (
        <Box maxW="1200px" mx="auto" mt={10} p={6}>
            <Text fontSize="2xl" fontWeight="bold" mb={6}>
                LLM Request History
            </Text>
            <Box mb={6}>
                <Text>Total requests: {stats.totalRequests}</Text>
                <Text>Error rate: {(stats.errorRate * 100).toFixed(2)}%</Text>
                <Text mt={2}>Requests per provider:</Text>

                <DataList.Root>
                    {stats.byProvider.map(p => (
                        <DataList.Item key={p.provider}>
                            <DataList.ItemLabel>{p.provider}</DataList.ItemLabel>
                            <DataList.ItemValue>{p.count}</DataList.ItemValue>
                        </DataList.Item>
                    ))}
                </DataList.Root>
                <Text mt={2}>Requests per type:</Text>
                <DataList.Root>
                    {stats.byType.map(t => (
                        <DataList.Item key={t.type}>
                            <DataList.ItemLabel>{t.type}</DataList.ItemLabel>
                            <DataList.ItemValue>{t.count}</DataList.ItemValue>
                        </DataList.Item>
                    ))}
                </DataList.Root>
            </Box>
            <Table.Root variant="outline" size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Timestamp</Table.ColumnHeader>
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
                    {history.map(req => (
                        <Table.Row key={req.id}>
                            <Table.Cell>{req.timestamp.toISOString()}</Table.Cell>
                            <Table.Cell>{req.userId}</Table.Cell>
                            <Table.Cell>{req.provider}</Table.Cell>
                            <Table.Cell>{req.requestType}</Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap">{req.prompt}</Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap">{req.responseContent}</Table.Cell>
                            <Table.Cell>{req.success ? 'ok' : 'fail'}</Table.Cell>
                            <Table.Cell whiteSpace="pre-wrap">{req.errorMessage}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
