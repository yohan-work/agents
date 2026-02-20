import { NextResponse } from 'next/server';
import { EmployeeAgent, DebateRound, DebateTurn } from '@/app/types/agent';

interface DebateRequestBody {
    topic: string;
    agent: EmployeeAgent;
    opponent: EmployeeAgent;
    turn: DebateTurn;
    roundNumber: number;
    totalRounds: number;
    previousRounds: DebateRound[];
    opponentLastContent: string;
}

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaStreamChunk {
    message?: { content?: string };
    done?: boolean;
}

function buildDebateSystemPrompt(body: DebateRequestBody): string {
    const { agent, opponent, topic, turn, roundNumber, totalRounds, previousRounds, opponentLastContent } = body;

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
    if (previousRounds.length > 0) {
        const roundSummaries = previousRounds.map((r) =>
            `[라운드 ${r.roundNumber}]\n- 공격(${body.turn === 'attacker' ? agent.name : opponent.name}): "${r.attackerContent.slice(0, 150)}"\n- 반박(${body.turn === 'attacker' ? opponent.name : agent.name}): "${r.defenderContent.slice(0, 150)}"`
        ).join('\n\n');
        previousContext = `\n[PREVIOUS_ROUNDS]\n이전 라운드 내용:\n${roundSummaries}`;
    }

    let currentContext = '';
    if (turn === 'defender' && opponentLastContent) {
        currentContext = `\n[OPPONENT_ARGUMENT]\n상대방(${opponent.name})의 이번 라운드 주장:\n"${opponentLastContent}"

반드시 상대방의 주장을 직접 언급하며 반박하십시오. 상대의 논리적 허점을 지적하고 더 강한 근거를 제시하십시오.`;
    }

    const roleDescription = turn === 'attacker'
        ? '당신은 공격 측입니다. 자신의 입장을 강하게 주장하고, 상대방이 반박하기 어려운 논리를 전개하십시오.'
        : '당신은 반박 측입니다. 상대방의 주장을 정면으로 반박하고, 상대 논리의 약점을 파고드십시오.';

    return `${agent.systemPrompt}

[DEBATE_ARENA_MODE]
- 현재 회장(User)이 주관하는 1:1 토론 대결이 진행 중입니다.
- 안건: "${topic}"
- 라운드: ${roundNumber} / ${totalRounds}
- 상대: ${opponent.name} (${opponent.rank}, ${opponent.role})
- 현재 시각: ${now}

[YOUR_ROLE]
${roleDescription}

${previousContext}${currentContext}

[RESPONSE_FORMAT]
- 반드시 한국어(Korean)로만 응답하십시오.
- 캐릭터 일관성: [TONE_RULES]와 [CONSTRAINTS]를 절대 벗어나지 마십시오.
- 3-5문장으로 강한 논거를 펼치십시오.
- 상대방의 이름을 반드시 한 번 이상 언급하십시오.
- 자신의 전문 분야(KNOWLEDGE_DOMAIN) 관점에서 설득력 있게 발언하십시오.
- 이것은 토론 대결입니다. 평소보다 강한 어조로 자신의 입장을 관철하십시오.`;
}

export async function POST(req: Request) {
    try {
        const body: DebateRequestBody = await req.json();

        const systemMessage: OllamaMessage = {
            role: 'system',
            content: buildDebateSystemPrompt(body),
        };

        const userPrompt = body.turn === 'attacker'
            ? `안건: ${body.topic}\n\n${body.agent.name} ${body.agent.rank}으로서 라운드 ${body.roundNumber} 공격 발언을 해주십시오. 상대는 ${body.opponent.name}입니다.`
            : `안건: ${body.topic}\n\n${body.agent.name} ${body.agent.rank}으로서 ${body.opponent.name}의 주장에 대해 반박해주십시오.`;

        const userMessage: OllamaMessage = {
            role: 'user',
            content: userPrompt,
        };

        const payload = {
            model: 'llama3:latest',
            messages: [systemMessage, userMessage],
            stream: true,
        };

        console.log(
            `[DEBATE] Streaming for: ${body.agent.name} (${body.turn}) | Round ${body.roundNumber}/${body.totalRounds} | topic: "${body.topic}"`
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
                console.error('[DEBATE] Ollama API error:', errorData);
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
                                controller.enqueue(new TextEncoder().encode(parsed.message.content));
                            }
                        } catch {
                            console.warn('[DEBATE] Failed to parse chunk:', trimmed);
                        }
                    }
                },
                flush(controller) {
                    clearTimeout(timeoutId);
                    if (lineBuffer.trim()) {
                        try {
                            const parsed: OllamaStreamChunk = JSON.parse(lineBuffer.trim());
                            if (parsed.message?.content) {
                                controller.enqueue(new TextEncoder().encode(parsed.message.content));
                            }
                        } catch {
                            console.warn('[DEBATE] Failed to parse final chunk:', lineBuffer);
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
            const err = error instanceof Error ? error : new Error('Unknown error');

            if (err.name === 'AbortError') {
                return NextResponse.json({ error: 'Debate request timed out (90s).' }, { status: 504 });
            }

            const cause = err.cause as Record<string, unknown> | undefined;
            if (cause && cause.code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Ollama is not running (Connection Refused).' }, { status: 503 });
            }

            return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
        }

    } catch (error) {
        console.error('[DEBATE] Handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
