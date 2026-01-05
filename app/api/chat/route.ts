import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, agent } = await req.json();

        const lastUserMessage = messages.filter((m: any) => m.senderId === 'user').pop();
        const userContent = lastUserMessage ? lastUserMessage.content : '';

        if (!userContent) {
            return NextResponse.json({ error: 'No user message found' }, { status: 400 });
        }

        const payload = {
            model: 'llama3:latest',
            messages: [
                {
                    role: 'system',
                    content: `You are a Korean employee in a company simulation. 
Name: ${agent.name}
Rank: ${agent.rank}
Personality: ${agent.personality}

CORE INSTRUCTIONS:
1. **SPEAK KOREAN ONLY.** (절대로 영어를 쓰지 마시오. 무조건 한국어로만 답하시오.)
2. Your response must be in Korean language (Hangul).
3. Act according to your system prompt: ${agent.systemPrompt}
4. Keep it brief (under 3 sentences).`
                },
                {
                    role: 'user',
                    content: `${userContent} (반드시 한국어로 대답해)`
                }
            ],
            stream: false
        };

        console.log(`[API] Sending request to Ollama for agent: ${agent.name} (${agent.rank})`);

        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            const response = await fetch('http://127.0.0.1:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('[API] Ollama API error:', errorData);
                return NextResponse.json({ error: `Failed to fetch from Ollama: ${response.statusText}` }, { status: 500 });
            }

            const data = await response.json();
            const agentResponse = data.message?.content || '...';
            console.log(`[API] Received response from Ollama for ${agent.name}`);

            return NextResponse.json({ content: agentResponse });

        } catch (error: any) {
            clearTimeout(timeoutId);
            console.error('[API] Error in chat API:', error);

            if (error.name === 'AbortError') {
                return NextResponse.json({ error: 'Ollama request timed out (60s). Model might be loading.' }, { status: 504 });
            }

            // Handle fetch connection errors (e.g., Ollama not running)
            if (error.cause && (error.cause as any).code === 'ECONNREFUSED') {
                return NextResponse.json({ error: 'Ollama is not running (Connection Refused).' }, { status: 503 });
            }

            return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
        }

    } catch (error) {
        console.error('Error in chat API handler:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
