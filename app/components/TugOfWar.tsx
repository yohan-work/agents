'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { AgentStance } from '@/app/types/agent';
import { cn } from '@/app/lib/utils';
import { AgentCharacterMini } from './AgentCharacter';

const STANCE_WEIGHT: Record<AgentStance, number> = {
    agree: 1.0,
    disagree: -1.0,
    cautious: -0.3,
    neutral: 0,
};

interface TugOfWarProps {
    stances: Record<string, AgentStance>;
    isActive: boolean;
}

export default function TugOfWar({ stances, isActive }: TugOfWarProps) {
    const stanceEntries = Object.entries(stances) as [string, AgentStance][];

    const { position, agreeAgents, disagreeAgents, cautiousAgents, neutralAgents, agreeCount, disagreeCount } = useMemo(() => {
        const totalAgents = agents.length;
        let score = 0;
        const agree: string[] = [];
        const disagree: string[] = [];
        const cautious: string[] = [];
        const neutral: string[] = [];
        let aC = 0;
        let dC = 0;

        for (const [agentId, stance] of stanceEntries) {
            score += STANCE_WEIGHT[stance];
            if (stance === 'agree') { agree.push(agentId); aC++; }
            else if (stance === 'disagree') { disagree.push(agentId); dC++; }
            else if (stance === 'cautious') { cautious.push(agentId); }
            else { neutral.push(agentId); }
        }

        const normalized = totalAgents > 0 ? Math.max(-1, Math.min(1, score / totalAgents)) : 0;

        return {
            position: normalized,
            agreeAgents: agree,
            disagreeAgents: disagree,
            cautiousAgents: cautious,
            neutralAgents: neutral,
            agreeCount: aC,
            disagreeCount: dC,
        };
    }, [stanceEntries]);

    if (!isActive && stanceEntries.length === 0) return null;

    const markerPercent = 50 + position * 40;

    const isAgreeWinning = position > 0.05;
    const isDisagreeWinning = position < -0.05;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[85%] max-w-xl"
        >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 px-5 py-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded transition-colors",
                        isDisagreeWinning ? "bg-rose-100 text-rose-700" : "bg-rose-50 text-rose-400"
                    )}>
                        반대 {disagreeCount > 0 && `(${disagreeCount})`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Tug of War
                    </span>
                    <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded transition-colors",
                        isAgreeWinning ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-400"
                    )}>
                        찬성 {agreeCount > 0 && `(${agreeCount})`}
                    </span>
                </div>

                {/* Rope */}
                <div className="relative h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                    {/* Gradient fill based on position */}
                    <motion.div
                        className="absolute inset-y-0 rounded-full"
                        animate={{
                            left: position < 0 ? `${markerPercent}%` : '50%',
                            right: position > 0 ? `${100 - markerPercent}%` : '50%',
                        }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        style={{
                            background: position > 0
                                ? 'linear-gradient(to right, #d1fae5, #10b981)'
                                : position < 0
                                    ? 'linear-gradient(to left, #ffe4e6, #f43f5e)'
                                    : 'transparent',
                        }}
                    />

                    {/* Rope texture lines */}
                    <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-20">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} className="w-[1px] h-2 bg-slate-500 rounded-full" />
                        ))}
                    </div>

                    {/* Center line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-slate-300 z-10" />

                    {/* Marker (the knot) */}
                    <motion.div
                        className="absolute top-1/2 -translate-y-1/2 z-20"
                        animate={{ left: `${markerPercent}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    >
                        <div className={cn(
                            "w-5 h-5 -ml-2.5 rounded-full border-2 border-white shadow-lg",
                            isAgreeWinning ? "bg-emerald-500" :
                                isDisagreeWinning ? "bg-rose-500" :
                                    "bg-slate-400"
                        )} />
                    </motion.div>
                </div>

                {/* Pull indicators */}
                <div className="flex justify-between mt-1.5 px-1">
                    <div className="flex items-center gap-1">
                        {isDisagreeWinning && (
                            <motion.span
                                animate={{ x: [-2, 0, -2] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="text-rose-500 text-xs"
                            >
                                {'<<<'}
                            </motion.span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {isAgreeWinning && (
                            <motion.span
                                animate={{ x: [2, 0, 2] }}
                                transition={{ duration: 0.6, repeat: Infinity }}
                                className="text-emerald-500 text-xs"
                            >
                                {'>>>'}
                            </motion.span>
                        )}
                    </div>
                </div>

                {/* Agent avatars by side */}
                <div className="flex justify-between mt-3 gap-4">
                    {/* Disagree + Cautious side */}
                    <div className="flex-1 flex flex-col items-start gap-1.5">
                        <div className="flex flex-wrap gap-1">
                            {disagreeAgents.map((id) => (
                                <AgentMiniAvatar key={id} agentId={id} stance="disagree" />
                            ))}
                            {cautiousAgents.map((id) => (
                                <AgentMiniAvatar key={id} agentId={id} stance="cautious" />
                            ))}
                        </div>
                    </div>

                    {/* Neutral center */}
                    {neutralAgents.length > 0 && (
                        <div className="flex flex-col items-center gap-1.5">
                            <div className="flex flex-wrap justify-center gap-1">
                                {neutralAgents.map((id) => (
                                    <AgentMiniAvatar key={id} agentId={id} stance="neutral" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Agree side */}
                    <div className="flex-1 flex flex-col items-end gap-1.5">
                        <div className="flex flex-wrap justify-end gap-1">
                            {agreeAgents.map((id) => (
                                <AgentMiniAvatar key={id} agentId={id} stance="agree" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

const MINI_AVATAR_BORDER: Record<AgentStance, string> = {
    agree: 'ring-emerald-400',
    disagree: 'ring-rose-400',
    cautious: 'ring-amber-400',
    neutral: 'ring-slate-300',
};

function AgentMiniAvatar({ agentId, stance }: { agentId: string; stance: AgentStance }) {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="group relative"
        >
            <div className={cn(
                "w-7 h-7 rounded-full ring-2 overflow-hidden",
                MINI_AVATAR_BORDER[stance]
            )}>
                <AgentCharacterMini
                    agentId={agentId}
                    size={28}
                    state={stance === 'agree' ? 'agree' : stance === 'disagree' ? 'disagree' : 'idle'}
                />
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {agent.name}
            </div>
        </motion.div>
    );
}
