'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { AgentStance } from '@/app/types/agent';

const STANCE_BUBBLE_STYLES: Record<AgentStance, string> = {
    agree: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    disagree: 'bg-rose-50 border-rose-200 text-rose-800',
    neutral: 'bg-slate-50 border-slate-200 text-slate-700',
    cautious: 'bg-amber-50 border-amber-200 text-amber-800',
};

interface SpeechBubbleProps {
    content: string;
    stance?: AgentStance;
    position: 'top' | 'left' | 'right';
    isStreaming: boolean;
}

export default function SpeechBubble({ content, stance, position, isStreaming }: SpeechBubbleProps) {
    if (!content) return null;

    const preview = content.length > 50 ? content.slice(0, 50) + '...' : content;

    const positionClass = position === 'top'
        ? 'top-full mt-14 md:mt-18 left-1/2 -translate-x-1/2'
        : position === 'left'
            ? 'left-full ml-20 md:ml-28 top-1/2 -translate-y-1/2'
            : 'right-full mr-20 md:mr-28 top-1/2 -translate-y-1/2';

    const tailClass = position === 'top'
        ? 'left-1/2 -translate-x-1/2 -top-1.5 border-l border-t rotate-45'
        : position === 'left'
            ? 'top-1/2 -translate-y-1/2 -left-1.5 border-b border-l rotate-45'
            : 'top-1/2 -translate-y-1/2 -right-1.5 border-t border-r rotate-45';

    const bubbleStyle = stance ? STANCE_BUBBLE_STYLES[stance] : 'bg-white border-slate-200 text-slate-700';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
                "absolute z-30 w-40 md:w-52 pointer-events-none",
                positionClass
            )}
        >
            <div className={cn(
                "relative px-3 py-2 rounded-lg border shadow-md text-[10px] md:text-xs leading-relaxed",
                bubbleStyle
            )}>
                <div className={cn(
                    "absolute w-3 h-3",
                    bubbleStyle.includes('bg-emerald') ? 'bg-emerald-50 border-emerald-200' :
                    bubbleStyle.includes('bg-rose') ? 'bg-rose-50 border-rose-200' :
                    bubbleStyle.includes('bg-amber') ? 'bg-amber-50 border-amber-200' :
                    bubbleStyle.includes('bg-slate-50') ? 'bg-slate-50 border-slate-200' :
                    'bg-white border-slate-200',
                    tailClass
                )} />
                <span>{preview}</span>
                {isStreaming && (
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="inline-block ml-0.5"
                    >
                        |
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
}
