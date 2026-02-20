import { NextResponse } from 'next/server';
import { EmployeeAgent, DebateRound, JudgeVerdict, DebateTurn } from '@/app/types/agent';

interface JudgeRequestBody {
    topic: string;
    attacker: EmployeeAgent;
    defender: EmployeeAgent;
    rounds: DebateRound[];
    judges: EmployeeAgent[];
}

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaResponse {
    message?: { content?: string };
    done?: boolean;
}

function buildJudgePrompt(body: JudgeRequestBody): string {
    const { topic, attacker, defender, rounds, judges } = body;

    const roundsText = rounds.map((r) =>
        `[라운드 ${r.roundNumber}]\n공격(${attacker.name}): "${r.attackerContent}"\n반박(${defender.name}): "${r.defenderContent}"`
    ).join('\n\n');

    const judgeList = judges.map((j) =>
        `- ${j.name} (${j.rank}, ${j.role}, 성격: ${j.personality})`
    ).join('\n');

    return `당신은 토론 대결의 심판 7명의 역할을 동시에 수행합니다.
각 심판은 고유한 직급, 성격, 전문 분야를 가지고 있으며, 그에 맞게 판정해야 합니다.

[토론 안건]
"${topic}"

[대결자]
- 공격 측: ${attacker.name} (${attacker.rank}, ${attacker.role})
- 반박 측: ${defender.name} (${defender.rank}, ${defender.role})

[전체 라운드 내용]
${roundsText}

[심판단]
${judgeList}

[판정 지시]
각 심판의 성격과 전문 분야에 맞게 승자를 판정하십시오.
- 논리적인 심판은 논리의 완성도를 중시합니다.
- 수치 중심 심판은 구체적 근거를 중시합니다.
- 현장 중심 심판은 실현 가능성을 중시합니다.
- 원칙주의 심판은 규정과 절차를 중시합니다.

반드시 아래 형식으로 7명 전원의 판정을 출력하십시오. 다른 형식은 절대 사용하지 마십시오:

[JUDGE:심판이름:attacker 또는 defender:한줄 판정 이유]

예시:
[JUDGE:김부회장:attacker:장기적 전략 관점에서 더 설득력 있는 논거를 제시했습니다]
[JUDGE:이전무:defender:구체적 수치와 ROI 근거가 더 탄탄했습니다]

반드시 7명 전원의 판정을 빠짐없이 출력하십시오.
반드시 한국어로 작성하십시오.`;
}

function parseVerdicts(content: string, judges: EmployeeAgent[]): JudgeVerdict[] {
    const verdicts: JudgeVerdict[] = [];
    const regex = /\[JUDGE:([^:]+):(attacker|defender):([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        const judgeName = match[1].trim();
        const winner = match[2].trim() as DebateTurn;
        const reason = match[3].trim();

        const judge = judges.find((j) => j.name === judgeName);
        if (judge) {
            verdicts.push({ agentId: judge.id, winner, reason });
        }
    }

    if (verdicts.length < judges.length) {
        for (const judge of judges) {
            if (!verdicts.find((v) => v.agentId === judge.id)) {
                verdicts.push({
                    agentId: judge.id,
                    winner: Math.random() > 0.5 ? 'attacker' : 'defender',
                    reason: '판정을 내리기 어려운 접전이었습니다.',
                });
            }
        }
    }

    return verdicts;
}

export async function POST(req: Request) {
    try {
        const body: JudgeRequestBody = await req.json();

        const systemMessage: OllamaMessage = {
            role: 'system',
            content: buildJudgePrompt(body),
        };

        const userMessage: OllamaMessage = {
            role: 'user',
            content: `위 토론 대결에 대해 7명의 심판이 각각 판정을 내려주십시오. 반드시 [JUDGE:이름:attacker|defender:이유] 형식을 사용하십시오.`,
        };

        const payload = {
            model: 'llama3:latest',
            messages: [systemMessage, userMessage],
            stream: false,
        };

        console.log(`[JUDGE] Requesting judgement for: ${body.attacker.name} vs ${body.defender.name}`);

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 120000);

        try {
            const ollamaResponse = await fetch('http://127.0.0.1:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: abortController.signal,
            });

            clearTimeout(timeoutId);

            if (!ollamaResponse.ok) {
                const errorData = await ollamaResponse.text();
                console.error('[JUDGE] Ollama API error:', errorData);
                return NextResponse.json(
                    { error: `Failed to fetch from Ollama: ${ollamaResponse.statusText}` },
                    { status: 500 }
                );
            }

            const data: OllamaResponse = await ollamaResponse.json();
            const content = data.message?.content ?? '';

            console.log('[JUDGE] Raw response:', content);

            const verdicts = parseVerdicts(content, body.judges);

            const attackerVotes = verdicts.filter((v) => v.winner === 'attacker').length;
            const defenderVotes = verdicts.filter((v) => v.winner === 'defender').length;
            const winnerId = attackerVotes >= defenderVotes
                ? body.attacker.id
                : body.defender.id;

            return NextResponse.json({
                verdicts,
                winnerId,
                attackerVotes,
                defenderVotes,
            });

        } catch (error: unknown) {
            clearTimeout(timeoutId);
            const err = error instanceof Error ? error : new Error('Unknown error');

            if (err.name === 'AbortError') {
                return NextResponse.json({ error: 'Judge request timed out (120s).' }, { status: 504 });
            }

            const cause = err.cause as Record<string, unknown> | undefined;
            if (cause && cause.code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Ollama is not running (Connection Refused).' }, { status: 503 });
            }

            return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
        }

    } catch (error) {
        console.error('[JUDGE] Handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
