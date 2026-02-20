'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { ChatMessage, AgentStance, DiscussionState } from '@/app/types/agent';
import { cn } from '@/app/lib/utils';
import { X, Swords } from 'lucide-react';

const STANCE_CONFIG: Record<AgentStance, { label: string; color: string; bg: string; border: string; barColor: string; dotColor: string }> = {
    agree: { label: '찬성', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', barColor: 'bg-emerald-500', dotColor: 'bg-emerald-500' },
    disagree: { label: '반대', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', barColor: 'bg-rose-500', dotColor: 'bg-rose-500' },
    neutral: { label: '중립', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', barColor: 'bg-slate-400', dotColor: 'bg-slate-400' },
    cautious: { label: '신중', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', barColor: 'bg-amber-500', dotColor: 'bg-amber-500' },
};

const STANCE_ORDER: AgentStance[] = ['agree', 'disagree', 'cautious', 'neutral'];

interface DiscussionSummaryProps {
    discussion: DiscussionState;
    messages: ChatMessage[];
    onClose: () => void;
}

function extractKeyPoints(messages: ChatMessage[]): Array<{ agentId: string; point: string }> {
    const discussionMsgs = messages.filter(
        (m) => m.senderId !== 'user' && m.senderId !== 'system' && m.stance && m.content.length > 0
    );

    return discussionMsgs.map((msg) => {
        const sentences = msg.content.split(/[.!?。]\s*/).filter(Boolean);
        const firstMeaningful = sentences.find((s) => s.length > 10) ?? sentences[0] ?? msg.content;
        return {
            agentId: msg.senderId,
            point: firstMeaningful.length > 80 ? firstMeaningful.slice(0, 80) + '...' : firstMeaningful,
        };
    });
}

export default function DiscussionSummary({ discussion, messages, onClose }: DiscussionSummaryProps) {
    const stanceEntries = Object.entries(discussion.stances) as [string, AgentStance][];
    const total = stanceEntries.length;

    const counts = useMemo(() => {
        const c: Record<AgentStance, number> = { agree: 0, disagree: 0, neutral: 0, cautious: 0 };
        stanceEntries.forEach(([, stance]) => { c[stance]++; });
        return c;
    }, [stanceEntries]);

    const keyPoints = useMemo(
        () => extractKeyPoints(messages),
        [messages]
    );

    const majorityStance = useMemo(() => {
        let max: AgentStance = 'neutral';
        let maxCount = 0;
        for (const [stance, count] of Object.entries(counts) as [AgentStance, number][]) {
            if (count > maxCount) { max = stance; maxCount = count; }
        }
        return max;
    }, [counts]);

    const stanceSegments = useMemo(() => {
        const segments: Array<{ stance: AgentStance; width: number }> = [];
        for (const stance of STANCE_ORDER) {
            if (counts[stance] > 0) {
                segments.push({ stance, width: (counts[stance] / total) * 100 });
            }
        }
        return segments;
    }, [counts, total]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute inset-x-4 top-4 bottom-4 z-30 flex items-start justify-center pointer-events-none"
        >
            <div className="bg-white/97 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-full overflow-y-auto pointer-events-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-5 py-3 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-bold text-slate-800">토론 결과</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="닫기"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-5">
                    {/* Topic */}
                    <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2.5">
                        <div className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">안건</div>
                        <div className="text-sm text-violet-800 font-medium">{discussion.topic}</div>
                    </div>

                    {/* Verdict */}
                    <div className="text-center">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold",
                            STANCE_CONFIG[majorityStance].bg,
                            STANCE_CONFIG[majorityStance].border,
                            STANCE_CONFIG[majorityStance].color
                        )}>
                            <span>다수 의견:</span>
                            <span>{STANCE_CONFIG[majorityStance].label} ({counts[majorityStance]}/{total})</span>
                        </div>
                    </div>

                    {/* Stance Distribution Bar */}
                    <div>
                        <div className="text-xs font-bold text-slate-600 mb-2">의견 분포</div>
                        <div className="flex rounded-full overflow-hidden h-3 bg-slate-100">
                            {stanceSegments.map((seg, idx) => (
                                <motion.div
                                    key={seg.stance}
                                    className={cn("h-full", STANCE_CONFIG[seg.stance].barColor)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${seg.width}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-3 mt-2 flex-wrap">
                            {STANCE_ORDER.filter((s) => counts[s] > 0).map((stance) => (
                                <div key={stance} className="flex items-center gap-1.5 text-[11px]">
                                    <div className={cn("w-2.5 h-2.5 rounded-full", STANCE_CONFIG[stance].dotColor)} />
                                    <span className={cn("font-medium", STANCE_CONFIG[stance].color)}>
                                        {STANCE_CONFIG[stance].label} {counts[stance]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Agent Grid */}
                    <div>
                        <div className="text-xs font-bold text-slate-600 mb-2">참석자별 입장</div>
                        <div className="grid grid-cols-3 gap-2">
                            {stanceEntries.map(([agentId, stance], idx) => {
                                const agent = agents.find((a) => a.id === agentId);
                                if (!agent) return null;
                                const config = STANCE_CONFIG[stance];
                                return (
                                    <motion.div
                                        key={agentId}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn(
                                            "rounded-lg border p-2 flex flex-col items-center gap-1",
                                            config.bg, config.border
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                            agent.avatarColor
                                        )}>
                                            {agent.name.slice(0, 1)}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-700 text-center leading-tight">
                                            {agent.name}
                                        </div>
                                        <div className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                            config.color
                                        )}>
                                            {config.label}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Key Points */}
                    {keyPoints.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-slate-600 mb-2">핵심 발언</div>
                            <div className="space-y-2">
                                {keyPoints.map((kp, idx) => {
                                    const agent = agents.find((a) => a.id === kp.agentId);
                                    if (!agent) return null;
                                    const stance = discussion.stances[kp.agentId];
                                    const config = stance ? STANCE_CONFIG[stance] : STANCE_CONFIG.neutral;
                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + idx * 0.06 }}
                                            className="flex gap-2 items-start"
                                        >
                                            <div className={cn(
                                                "w-1 h-full min-h-[20px] rounded-full shrink-0 mt-0.5",
                                                config.barColor
                                            )} />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-bold text-slate-600">
                                                        {agent.name}
                                                    </span>
                                                    <span className={cn("text-[9px] font-bold", config.color)}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 leading-relaxed">
                                                    {kp.point}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
