'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { EmployeeAgent, AgentStance } from '@/app/types/agent';
import AgentCharacter from './AgentCharacter';

const STANCE_LABEL: Record<AgentStance, { text: string; color: string }> = {
    agree: { text: '찬성', color: 'text-emerald-600' },
    disagree: { text: '반대', color: 'text-rose-600' },
    neutral: { text: '중립', color: 'text-slate-500' },
    cautious: { text: '신중', color: 'text-amber-600' },
};

interface AgentProfileCardProps {
    agent: EmployeeAgent;
    position: 'top' | 'left' | 'right';
    stance?: AgentStance;
    latestMessage?: string;
}

export default function AgentProfileCard({ agent, position, stance, latestMessage }: AgentProfileCardProps) {
    const positionClass = position === 'top'
        ? 'bottom-full mb-3 left-1/2 -translate-x-1/2'
        : position === 'left'
            ? 'left-full ml-4 top-1/2 -translate-y-1/2'
            : 'right-full mr-4 top-1/2 -translate-y-1/2';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: position === 'top' ? 8 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
                "absolute z-40 w-56 md:w-64 pointer-events-none",
                positionClass
            )}
        >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                <div className={cn("h-1.5 w-full", agent.avatarColor)} />

                <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <AgentCharacter
                            agentId={agent.id}
                            size={32}
                            state={stance === 'agree' ? 'agree' : stance === 'disagree' ? 'disagree' : 'idle'}
                        />
                        <div>
                            <div className="text-sm font-bold text-slate-800">{agent.name}</div>
                            <div className="text-[10px] text-slate-400">{agent.rank}</div>
                        </div>
                        {stance && (
                            <div className={cn(
                                "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                stance === 'agree' && 'bg-emerald-50 border-emerald-200 text-emerald-600',
                                stance === 'disagree' && 'bg-rose-50 border-rose-200 text-rose-600',
                                stance === 'neutral' && 'bg-slate-50 border-slate-200 text-slate-500',
                                stance === 'cautious' && 'bg-amber-50 border-amber-200 text-amber-600',
                            )}>
                                {STANCE_LABEL[stance].text}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                        <div className="flex gap-2">
                            <span className="text-slate-400 shrink-0 w-10">역할</span>
                            <span className="text-slate-600">{agent.role}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-slate-400 shrink-0 w-10">성격</span>
                            <span className="text-slate-600">{agent.personality}</span>
                        </div>
                    </div>

                    {latestMessage && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                            <div className="text-[10px] text-slate-400 mb-0.5">최근 발언</div>
                            <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {latestMessage}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
