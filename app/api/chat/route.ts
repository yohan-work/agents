import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { messages, agent } = await req.json();

        const history = messages.map((m: any) => ({
            role: m.senderId === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const systemMessage = {
            role: 'system',
            content: `${agent.systemPrompt}

IMPORTANT INSTRUCTIONS:
1. **Language**: You must speak ONLY in **Korean (한국어)**.
2. **Length**: Keep your response concise (under 2-3 sentences), unless a detailed report is requested.
3. **Context**: You are currently in a meeting with the Chairman (User). React to the previous messages naturally.
4. **Consistency**: Never break character. Maintain your specific tone defined in the prompts above.`
        };

        const payload = {
            model: 'llama3:latest',
            messages: [systemMessage, ...history],
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
