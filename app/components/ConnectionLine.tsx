'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { ChatMessage, AgentStance } from '@/app/types/agent';

interface AgentPosition {
    x: number;
    y: number;
}

const AGENT_POSITIONS: Record<string, AgentPosition> = {
    'agent-1': { x: 30, y: 5 },
    'agent-2': { x: 50, y: 5 },
    'agent-3': { x: 70, y: 5 },
    'agent-4': { x: 5, y: 30 },
    'agent-5': { x: 5, y: 50 },
    'agent-6': { x: 5, y: 70 },
    'agent-7': { x: 95, y: 30 },
    'agent-8': { x: 95, y: 50 },
    'agent-9': { x: 95, y: 70 },
    'user': { x: 50, y: 95 },
};

interface Connection {
    from: string;
    to: string;
    stance: AgentStance;
    id: string;
}

function detectMentions(senderId: string, content: string): Array<{ targetId: string }> {
    const mentions: Array<{ targetId: string }> = [];

    for (const agent of agents) {
        if (agent.id === senderId) continue;

        const namePatterns = [
            agent.name,
            agent.name.slice(0, 1) + agent.rank.split(' ').pop(),
        ];

        for (const pattern of namePatterns) {
            if (content.includes(pattern)) {
                mentions.push({ targetId: agent.id });
                break;
            }
        }
    }

    return mentions;
}

export function parseConnections(messages: ChatMessage[]): Connection[] {
    const connections: Connection[] = [];
    const seen = new Set<string>();

    const recentMessages = messages.slice(-9);

    for (const msg of recentMessages) {
        if (msg.senderId === 'user' || msg.senderId === 'system') continue;
        if (!msg.content) continue;

        const mentions = detectMentions(msg.senderId, msg.content);
        const stance = msg.stance ?? 'neutral';

        for (const mention of mentions) {
            const pairKey = [msg.senderId, mention.targetId].sort().join('-');
            if (seen.has(pairKey)) continue;
            seen.add(pairKey);

            connections.push({
                from: msg.senderId,
                to: mention.targetId,
                stance,
                id: `${msg.senderId}-${mention.targetId}`,
            });
        }
    }

    return connections;
}

const STANCE_COLORS: Record<AgentStance, string> = {
    agree: '#10b981',
    disagree: '#f43f5e',
    neutral: '#94a3b8',
    cautious: '#f59e0b',
};

interface ConnectionLinesProps {
    messages: ChatMessage[];
    isActive: boolean;
}

export default function ConnectionLines({ messages, isActive }: ConnectionLinesProps) {
    const [connections, setConnections] = useState<Connection[]>([]);

    useEffect(() => {
        if (!isActive) {
            setConnections([]);
            return;
        }
        setConnections(parseConnections(messages));
    }, [messages, isActive]);

    if (connections.length === 0) return null;

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
        >
            <defs>
                {Object.entries(STANCE_COLORS).map(([stance, color]) => (
                    <marker
                        key={stance}
                        id={`arrow-${stance}`}
                        viewBox="0 0 10 10"
                        refX="8"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} opacity="0.7" />
                    </marker>
                ))}
            </defs>

            <AnimatePresence>
                {connections.map((conn) => {
                    const fromPos = AGENT_POSITIONS[conn.from];
                    const toPos = AGENT_POSITIONS[conn.to];
                    if (!fromPos || !toPos) return null;

                    const color = STANCE_COLORS[conn.stance];
                    const midX = (fromPos.x + toPos.x) / 2;
                    const midY = (fromPos.y + toPos.y) / 2;
                    const dx = toPos.x - fromPos.x;
                    const dy = toPos.y - fromPos.y;
                    const offsetX = -dy * 0.15;
                    const offsetY = dx * 0.15;

                    const pathD = `M ${fromPos.x} ${fromPos.y} Q ${midX + offsetX} ${midY + offsetY} ${toPos.x} ${toPos.y}`;

                    return (
                        <motion.path
                            key={conn.id}
                            d={pathD}
                            fill="none"
                            stroke={color}
                            strokeWidth="0.4"
                            strokeDasharray="1.5 1"
                            opacity={0.6}
                            markerEnd={`url(#arrow-${conn.stance})`}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    );
                })}
            </AnimatePresence>
        </svg>
    );
}
