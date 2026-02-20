'use client';

import { useState, useCallback, useRef } from 'react';
import { agents } from '@/app/data/agents';
import {
    ChatMessage,
    EmployeeAgent,
    AgentStance,
    DiscussionState,
    RANK_ORDER,
} from '@/app/types/agent';

function parseStanceFromContent(content: string): { stance: AgentStance; cleanContent: string } {
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

function getSortedAgents(): EmployeeAgent[] {
    return [...agents].sort((a, b) => {
        const aIndex = RANK_ORDER.indexOf(a.rank);
        const bIndex = RANK_ORDER.indexOf(b.rank);
        return aIndex - bIndex;
    });
}

interface PreviousSpeaker {
    name: string;
    rank: string;
    content: string;
    stance: AgentStance;
}

interface UseDiscussionReturn {
    discussion: DiscussionState;
    startDiscussion: (topic: string) => Promise<void>;
    cancelDiscussion: () => void;
    discussionMessages: ChatMessage[];
    speakingAgentId: string | null;
}

export function useDiscussion(
    onMessageAdd: (msg: ChatMessage) => void,
    onMessageUpdate: (id: string, content: string, stance?: AgentStance) => void
): UseDiscussionReturn {
    const [discussion, setDiscussion] = useState<DiscussionState>({
        status: 'idle',
        topic: '',
        currentSpeakerIndex: -1,
        speakerOrder: [],
        stances: {},
    });

    const [discussionMessages, setDiscussionMessages] = useState<ChatMessage[]>([]);
    const [speakingAgentId, setSpeakingAgentId] = useState<string | null>(null);
    const cancelledRef = useRef(false);

    const cancelDiscussion = useCallback(() => {
        cancelledRef.current = true;
        setSpeakingAgentId(null);
        setDiscussion((prev) => ({ ...prev, status: 'idle', currentSpeakerIndex: -1 }));
    }, []);

    const startDiscussion = useCallback(async (topic: string) => {
        cancelledRef.current = false;
        const sortedAgents = getSortedAgents();
        const speakerOrder = sortedAgents.map((a) => a.id);

        setDiscussion({
            status: 'in_progress',
            topic,
            currentSpeakerIndex: 0,
            speakerOrder,
            stances: {},
        });
        setDiscussionMessages([]);

        const previousSpeakers: PreviousSpeaker[] = [];

        for (let i = 0; i < sortedAgents.length; i++) {
            if (cancelledRef.current) break;

            const agent = sortedAgents[i];

            setDiscussion((prev) => ({ ...prev, currentSpeakerIndex: i }));
            setSpeakingAgentId(agent.id);

            await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 800));

            if (cancelledRef.current) break;

            try {
                const response = await fetch('/api/discuss', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic,
                        agent,
                        previousSpeakers,
                    }),
                });

                if (!response.ok) {
                    const errorData: Record<string, string> = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'API request failed');
                }

                const msgId = `discuss-${Date.now()}-${i}`;
                const msgTimestamp = Date.now();

                const placeholderMsg: ChatMessage = {
                    id: msgId,
                    senderId: agent.id,
                    content: '',
                    timestamp: msgTimestamp,
                };

                setDiscussionMessages((prev) => [...prev, placeholderMsg]);
                onMessageAdd(placeholderMsg);
                setSpeakingAgentId(null);

                const reader = response.body?.getReader();
                if (!reader) throw new Error('No response stream available');

                const decoder = new TextDecoder();
                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    fullContent += decoder.decode(value, { stream: true });
                    const { cleanContent } = parseStanceFromContent(fullContent);
                    onMessageUpdate(msgId, cleanContent);
                }

                const { stance, cleanContent } = parseStanceFromContent(fullContent);

                onMessageUpdate(msgId, cleanContent, stance);

                setDiscussionMessages((prev) =>
                    prev.map((m) =>
                        m.id === msgId ? { ...m, content: cleanContent, stance } : m
                    )
                );

                setDiscussion((prev) => ({
                    ...prev,
                    stances: { ...prev.stances, [agent.id]: stance },
                }));

                previousSpeakers.push({
                    name: agent.name,
                    rank: agent.rank,
                    content: cleanContent.slice(0, 200),
                    stance,
                });

            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error('Unknown error');
                console.error(`[Discussion] Failed for ${agent.name}:`, err);

                const errorMsg: ChatMessage = {
                    id: `discuss-err-${Date.now()}-${i}`,
                    senderId: 'system',
                    content: `${agent.name}: ${err.message || '응답 실패'}`,
                    timestamp: Date.now(),
                };
                setDiscussionMessages((prev) => [...prev, errorMsg]);
                onMessageAdd(errorMsg);
                setSpeakingAgentId(null);
            }
        }

        setSpeakingAgentId(null);
        if (!cancelledRef.current) {
            setDiscussion((prev) => ({ ...prev, status: 'completed' }));
        }
    }, [onMessageAdd, onMessageUpdate]);

    return {
        discussion,
        startDiscussion,
        cancelDiscussion,
        discussionMessages,
        speakingAgentId,
    };
}
