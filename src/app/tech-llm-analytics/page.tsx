import { Box, Text, Table, Thead, Tbody, Tr, Th, Td, List, ListItem } from '@chakra-ui/react';
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
                <List styleType="disc" pl={4}>
                    {stats.byProvider.map(p => (
                        <ListItem key={p.provider}>
                            {p.provider}: {p.count}
                        </ListItem>
                    ))}
                </List>
                <Text mt={2}>Requests per type:</Text>
                <List styleType="disc" pl={4}>
                    {stats.byType.map(t => (
                        <ListItem key={t.type}>
                            {t.type}: {t.count}
                        </ListItem>
                    ))}
                </List>
            </Box>
            <Table variant="simple" size="sm">
                <Thead>
                    <Tr>
                        <Th>Timestamp</Th>
                        <Th>User</Th>
                        <Th>Provider</Th>
                        <Th>Type</Th>
                        <Th>Prompt</Th>
                        <Th>Response</Th>
                        <Th>Status</Th>
                        <Th>Error</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {history.map(req => (
                        <Tr key={req.id}>
                            <Td>{req.timestamp.toISOString()}</Td>
                            <Td>{req.userId}</Td>
                            <Td>{req.provider}</Td>
                            <Td>{req.requestType}</Td>
                            <Td whiteSpace="pre-wrap">{req.prompt}</Td>
                            <Td whiteSpace="pre-wrap">{req.responseContent}</Td>
                            <Td>{req.success ? 'ok' : 'fail'}</Td>
                            <Td whiteSpace="pre-wrap">{req.errorMessage}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
}
