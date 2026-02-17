import { NextResponse } from 'next/server';
import { ChatMessage, EmployeeAgent } from '@/app/types/agent';

interface ChatRequestBody {
    messages: ChatMessage[];
    agent: EmployeeAgent;
}

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const MAX_HISTORY_MESSAGES = 20;

function toOllamaMessage(msg: ChatMessage): OllamaMessage {
    return {
        role: msg.senderId === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
    };
}

function buildHistory(messages: ChatMessage[], maxMessages: number): OllamaMessage[] {
    const filtered = messages.filter((m) => m.senderId !== 'system');

    if (filtered.length <= maxMessages) {
        return filtered.map(toOllamaMessage);
    }

    const firstUserMsg = filtered.find((m) => m.senderId === 'user');
    const recentMessages = filtered.slice(-(maxMessages - 1));

    const firstUserAlreadyIncluded = firstUserMsg
        ? recentMessages.some((m) => m.id === firstUserMsg.id)
        : true;

    if (firstUserAlreadyIncluded || !firstUserMsg) {
        return recentMessages.map(toOllamaMessage);
    }

    return [
        toOllamaMessage(firstUserMsg),
        ...recentMessages.map(toOllamaMessage),
    ];
}

function buildSystemPrompt(agent: EmployeeAgent): string {
    const now = new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${agent.systemPrompt}

[META_INSTRUCTIONS]
- 반드시 한국어(Korean)로만 응답하십시오. 영어 사용 금지.
- 현재 상황: 회장(User)이 주재하는 임원 회의 중입니다.
- 현재 시각: ${now}
- 응답 길이: 상세 보고 요청이 아닌 한, 2-3문장으로 간결하게 답변하십시오.
- 캐릭터 일관성: 위에 정의된 [TONE_RULES]와 [CONSTRAINTS]를 절대 벗어나지 마십시오.
- 이전 대화 내용을 참조하여 자연스럽게 대화를 이어가십시오. 대화 맥락을 무시하지 마십시오.
- 다른 에이전트가 이전에 말한 내용이 있다면, 그에 대해 동의/반박/보충하며 자연스러운 회의 대화를 만드십시오.`;
}

interface OllamaStreamChunk {
    message?: { content?: string };
    done?: boolean;
}

export async function POST(req: Request) {
    try {
        const { messages, agent }: ChatRequestBody = await req.json();

        const history = buildHistory(messages, MAX_HISTORY_MESSAGES);

        const systemMessage: OllamaMessage = {
            role: 'system',
            content: buildSystemPrompt(agent),
        };

        const payload = {
            model: 'llama3:latest',
            messages: [systemMessage, ...history],
            stream: true,
        };

        console.log(
            `[API] Streaming request to Ollama for agent: ${agent.name} (${agent.rank}) | history: ${history.length} msgs`
        );

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 60000);

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
                console.error('[API] Ollama API error:', errorData);
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
                            console.warn('[API] Failed to parse Ollama chunk:', trimmed);
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
                            console.warn('[API] Failed to parse final Ollama chunk:', lineBuffer);
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
            console.error('[API] Error in chat API:', error);

            const err = error instanceof Error ? error : new Error('Unknown error');

            if (err.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Ollama request timed out (60s). Model might be loading.' },
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
        console.error('Error in chat API handler:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
