import { NextResponse } from 'next/server';
import { ChatMessage, EmployeeAgent, AgentStance } from '@/app/types/agent';

interface DiscussRequestBody {
    topic: string;
    agent: EmployeeAgent;
    previousSpeakers: Array<{
        name: string;
        rank: string;
        content: string;
        stance: AgentStance;
    }>;
}

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaStreamChunk {
    message?: { content?: string };
    done?: boolean;
}

const STANCE_LABELS: Record<AgentStance, string> = {
    agree: '찬성',
    disagree: '반대',
    neutral: '중립',
    cautious: '신중/유보',
};

function buildDiscussionSystemPrompt(
    agent: EmployeeAgent,
    topic: string,
    previousSpeakers: DiscussRequestBody['previousSpeakers']
): string {
    const now = new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    let previousContext = '';
    if (previousSpeakers.length > 0) {
        const speakerSummaries = previousSpeakers.map(
            (s) => `- ${s.name}(${s.rank}): [${STANCE_LABELS[s.stance]}] "${s.content}"`
        ).join('\n');
        previousContext = `
[PREVIOUS_SPEAKERS]
아래는 이전 발언자들의 의견입니다. 반드시 참조하여 동의/반박/보충하십시오:
${speakerSummaries}`;
    }

    return `${agent.systemPrompt}

[DISCUSSION_MODE]
- 현재 회장(User)이 주재하는 임원 회의에서 안건 토론이 진행 중입니다.
- 토론 안건: "${topic}"
- 현재 시각: ${now}
${previousContext}

[RESPONSE_FORMAT]
반드시 아래 형식으로 응답하십시오:
[STANCE:찬성|반대|중립|신중] (첫 줄에 반드시 입장 태그를 표기)

그 다음 줄부터 본문을 작성하십시오.

[META_INSTRUCTIONS]
- 반드시 한국어(Korean)로만 응답하십시오.
- 캐릭터 일관성: [TONE_RULES]와 [CONSTRAINTS]를 절대 벗어나지 마십시오.
- 이전 발언자가 있다면, 반드시 이름을 언급하며 동의/반박/보충하십시오. 예: "김부회장님 말씀에 동의합니다만..."
- 응답 길이: 3-5문장으로 본인의 입장을 분명히 밝히십시오.
- 자신의 전문 분야(KNOWLEDGE_DOMAIN) 관점에서 의견을 제시하십시오.`;
}

function parseStance(content: string): { stance: AgentStance; cleanContent: string } {
    const stanceMap: Record<string, AgentStance> = {
        '찬성': 'agree',
        '반대': 'disagree',
        '중립': 'neutral',
        '신중': 'cautious',
    };

    const match = content.match(/\[STANCE:(찬성|반대|중립|신중)\]/);
    if (match) {
        const stance = stanceMap[match[1]] ?? 'neutral';
        const cleanContent = content.replace(/\[STANCE:(찬성|반대|중립|신중)\]\s*/g, '').trim();
        return { stance, cleanContent };
    }

    return { stance: 'neutral', cleanContent: content.trim() };
}

export async function POST(req: Request) {
    try {
        const { topic, agent, previousSpeakers }: DiscussRequestBody = await req.json();

        const systemMessage: OllamaMessage = {
            role: 'system',
            content: buildDiscussionSystemPrompt(agent, topic, previousSpeakers),
        };

        const userMessage: OllamaMessage = {
            role: 'user',
            content: `안건: ${topic}\n\n위 안건에 대해 ${agent.name} ${agent.rank}으로서 의견을 말씀해주십시오.`,
        };

        const payload = {
            model: 'llama3:latest',
            messages: [systemMessage, userMessage],
            stream: true,
        };

        console.log(
            `[DISCUSS] Streaming for agent: ${agent.name} (${agent.rank}) | topic: "${topic}" | prev speakers: ${previousSpeakers.length}`
        );

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 90000);

        try {
            const ollamaResponse = await fetch('http://127.0.0.1:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: abortController.signal,
            });

            if (!ollamaResponse.ok) {
                clearTimeout(timeoutId);
                const errorData = await ollamaResponse.text();
                console.error('[DISCUSS] Ollama API error:', errorData);
                return NextResponse.json(
                    { error: `Failed to fetch from Ollama: ${ollamaResponse.statusText}` },
                    { status: 500 }
                );
            }

            if (!ollamaResponse.body) {
                clearTimeout(timeoutId);
                return NextResponse.json(
                    { error: 'Ollama returned no response body' },
                    { status: 500 }
                );
            }

            let lineBuffer = '';

            const transformStream = new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                    const text = new TextDecoder().decode(chunk);
                    lineBuffer += text;

                    const lines = lineBuffer.split('\n');
                    lineBuffer = lines.pop() ?? '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        try {
                            const parsed: OllamaStreamChunk = JSON.parse(trimmed);
                            if (parsed.message?.content) {
                                controller.enqueue(
                                    new TextEncoder().encode(parsed.message.content)
                                );
                            }
                        } catch {
                            console.warn('[DISCUSS] Failed to parse chunk:', trimmed);
                        }
                    }
                },
                flush(controller) {
                    clearTimeout(timeoutId);
                    if (lineBuffer.trim()) {
                        try {
                            const parsed: OllamaStreamChunk = JSON.parse(lineBuffer.trim());
                            if (parsed.message?.content) {
                                controller.enqueue(
                                    new TextEncoder().encode(parsed.message.content)
                                );
                            }
                        } catch {
                            console.warn('[DISCUSS] Failed to parse final chunk:', lineBuffer);
                        }
                    }
                },
            });

            const stream = ollamaResponse.body.pipeThrough(transformStream);

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    'Transfer-Encoding': 'chunked',
                },
            });

        } catch (error: unknown) {
            clearTimeout(timeoutId);
            console.error('[DISCUSS] Error:', error);

            const err = error instanceof Error ? error : new Error('Unknown error');

            if (err.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Ollama request timed out (90s).' },
                    { status: 504 }
                );
            }

            const cause = err.cause as Record<string, unknown> | undefined;
            if (cause && cause.code === 'ECONNREFUSED') {
                return NextResponse.json(
                    { error: 'Ollama is not running (Connection Refused).' },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                { error: `Internal Server Error: ${err.message}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('[DISCUSS] Handler error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export { parseStance };
