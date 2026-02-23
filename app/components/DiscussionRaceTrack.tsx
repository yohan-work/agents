'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { ChatMessage, AgentStance, DiscussionState, DiscussionStatus, RANK_ORDER } from '@/app/types/agent';
import { CHARACTER_TRAITS } from '@/app/data/characterTraits';
import { cn } from '@/app/lib/utils';
import { parseConnections } from './ConnectionLine';
import RaceAnimal from './RaceAnimal';
import { Trophy, X, Crown } from 'lucide-react';

interface RaceScore {
    agentId: string;
    agentName: string;
    score: number;
    spoke: boolean;
    mentionCount: number;
    stance: AgentStance | null;
}

const MAX_SCORE = 80;
const LANE_COUNT = 9;
const TRACK_WIDTH = 560;
const LANE_HEIGHT = 34;
const START_X = 50;
const FINISH_X = TRACK_WIDTH - 20;
const TRACK_RANGE = FINISH_X - START_X;

function computeScores(
    messages: ChatMessage[],
    stances: Record<string, AgentStance>,
    speakerOrder: string[],
    currentSpeakerIndex: number,
    status: DiscussionStatus,
): RaceScore[] {
    const mentionCounts: Record<string, number> = {};
    const connections = parseConnections(messages);
    for (const conn of connections) {
        mentionCounts[conn.to] = (mentionCounts[conn.to] ?? 0) + 1;
    }

    const majorityStance = getMajorityStance(stances);

    const sortedAgents = [...agents].sort((a, b) => {
        return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank);
    });

    return sortedAgents.map((agent) => {
        const stance = stances[agent.id] ?? null;
        const speakerIdx = speakerOrder.indexOf(agent.id);
        const spoke = speakerIdx !== -1 && speakerIdx < currentSpeakerIndex;
        const isCurrentSpeaker = speakerIdx === currentSpeakerIndex && status === 'in_progress';

        let score = 0;

        if (spoke || isCurrentSpeaker) {
            score += 30;
        }

        const mentions = mentionCounts[agent.id] ?? 0;
        score += mentions * 15;

        if (stance && majorityStance && stance === majorityStance) {
            score += 10;
        }

        const agentMsg = messages.find(
            (m) => m.senderId === agent.id && m.content.length > 0 && m.stance
        );
        if (agentMsg) {
            score += Math.min(15, Math.floor(agentMsg.content.length / 50));
        }

        return {
            agentId: agent.id,
            agentName: agent.name,
            score: Math.min(score, MAX_SCORE),
            spoke: spoke || isCurrentSpeaker,
            mentionCount: mentions,
            stance,
        };
    });
}

function getMajorityStance(stances: Record<string, AgentStance>): AgentStance | null {
    const counts: Record<AgentStance, number> = { agree: 0, disagree: 0, neutral: 0, cautious: 0 };
    for (const s of Object.values(stances)) {
        counts[s]++;
    }
    let max: AgentStance | null = null;
    let maxCount = 0;
    for (const [stance, count] of Object.entries(counts) as [AgentStance, number][]) {
        if (count > maxCount) {
            max = stance;
            maxCount = count;
        }
    }
    return max;
}

const STANCE_LABEL: Record<AgentStance, string> = {
    agree: '찬성',
    disagree: '반대',
    cautious: '신중',
    neutral: '중립',
};

const ANIMAL_LABEL: Record<string, string> = {
    horse: '말',
    hawk: '매',
    bull: '황소',
    bear: '곰',
    owl: '부엉이',
    wolf: '늑대',
    fox: '여우',
    rabbit: '토끼',
    cat: '고양이',
};

interface DiscussionRaceTrackProps {
    discussion: DiscussionState;
    messages: ChatMessage[];
    onClose?: () => void;
}

export default function DiscussionRaceTrack({
    discussion,
    messages,
    onClose,
}: DiscussionRaceTrackProps) {
    const scores = useMemo(
        () => computeScores(
            messages,
            discussion.stances,
            discussion.speakerOrder,
            discussion.currentSpeakerIndex,
            discussion.status,
        ),
        [messages, discussion.stances, discussion.speakerOrder, discussion.currentSpeakerIndex, discussion.status]
    );

    const isCompleted = discussion.status === 'completed';
    const [showResults, setShowResults] = useState(false);

    const rankedScores = useMemo(() => {
        if (!isCompleted) return [];
        return [...scores].sort((a, b) => b.score - a.score);
    }, [scores, isCompleted]);

    const currentSpeakerId = discussion.speakerOrder[discussion.currentSpeakerIndex] ?? null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-x-3 top-3 z-30 pointer-events-auto"
        >
            <div className="bg-white/97 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
                    <div className="flex items-center gap-2">
                        <span className="text-base">🏇</span>
                        <span className="text-sm font-bold tracking-wide">
                            {isCompleted ? 'RACE FINISHED!' : 'DISCUSSION DERBY'}
                        </span>
                        {!isCompleted && (
                            <span className="text-xs opacity-70 ml-1">
                                {discussion.currentSpeakerIndex + 1} / {discussion.speakerOrder.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {isCompleted && (
                            <button
                                onClick={() => setShowResults((v) => !v)}
                                className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-md transition-colors"
                            >
                                {showResults ? '트랙 보기' : '순위 보기'}
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 rounded-md hover:bg-white/20 transition-colors"
                                aria-label="닫기"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Topic */}
                <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-100">
                    <p className="text-[11px] text-emerald-700 truncate font-medium">
                        안건: {discussion.topic}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {showResults && isCompleted ? (
                        <RaceResults key="results" rankedScores={rankedScores} />
                    ) : (
                        <RaceTrackView
                            key="track"
                            scores={scores}
                            currentSpeakerId={currentSpeakerId}
                            isCompleted={isCompleted}
                            winnerId={rankedScores[0]?.agentId ?? null}
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

/* ─── SVG Race Track ─────────────────────────── */

function RaceTrackView({
    scores,
    currentSpeakerId,
    isCompleted,
    winnerId,
}: {
    scores: RaceScore[];
    currentSpeakerId: string | null;
    isCompleted: boolean;
    winnerId: string | null;
}) {
    const svgHeight = LANE_COUNT * LANE_HEIGHT + 30;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto"
        >
            <svg
                viewBox={`0 0 ${TRACK_WIDTH} ${svgHeight}`}
                width="100%"
                height={svgHeight}
                className="min-w-[500px]"
            >
                {/* Sky */}
                <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#BFDBFE" />
                        <stop offset="100%" stopColor="#DBEAFE" />
                    </linearGradient>
                    <linearGradient id="grassDark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#16A34A" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="grassLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                <rect x="0" y="0" width={TRACK_WIDTH} height={svgHeight} fill="url(#sky)" />

                {/* Track base */}
                <rect x="0" y="18" width={TRACK_WIDTH} height={LANE_COUNT * LANE_HEIGHT + 4} rx="4" fill="#D4A76A" opacity="0.3" />

                {/* Lanes */}
                {scores.map((_, idx) => {
                    const y = 20 + idx * LANE_HEIGHT;
                    const isEven = idx % 2 === 0;
                    return (
                        <g key={idx}>
                            <rect
                                x="2"
                                y={y}
                                width={TRACK_WIDTH - 4}
                                height={LANE_HEIGHT}
                                fill={isEven ? 'url(#grassDark)' : 'url(#grassLight)'}
                                rx="2"
                            />
                            <rect
                                x="2"
                                y={y}
                                width={TRACK_WIDTH - 4}
                                height={LANE_HEIGHT}
                                fill={isEven ? '#4ADE80' : '#86EFAC'}
                                opacity={isEven ? 0.12 : 0.08}
                            />
                            {/* Lane divider */}
                            {idx < LANE_COUNT - 1 && (
                                <line
                                    x1="45"
                                    y1={y + LANE_HEIGHT}
                                    x2={TRACK_WIDTH - 10}
                                    y2={y + LANE_HEIGHT}
                                    stroke="white"
                                    strokeWidth="0.5"
                                    strokeDasharray="4 3"
                                    opacity="0.5"
                                />
                            )}
                        </g>
                    );
                })}

                {/* Start gate */}
                <rect x={START_X - 2} y="18" width="3" height={LANE_COUNT * LANE_HEIGHT + 4} fill="#8B4513" opacity="0.7" rx="1" />
                <text x={START_X - 1} y="14" textAnchor="middle" fill="#8B4513" fontSize="6" fontWeight="bold" opacity="0.7">START</text>

                {/* Finish line - checkered */}
                <g opacity="0.8">
                    {Array.from({ length: Math.ceil((LANE_COUNT * LANE_HEIGHT + 4) / 4) }).map((_, row) =>
                        [0, 1].map((col) => (
                            <rect
                                key={`${row}-${col}`}
                                x={FINISH_X + col * 4}
                                y={18 + row * 4}
                                width="4"
                                height="4"
                                fill={(row + col) % 2 === 0 ? '#1a1a1a' : 'white'}
                            />
                        ))
                    )}
                </g>
                <text x={FINISH_X + 4} y="14" textAnchor="middle" fill="#1a1a1a" fontSize="6" fontWeight="bold" opacity="0.5">FINISH</text>

                {/* Agent name labels + Animals */}
                {scores.map((entry, idx) => {
                    const y = 20 + idx * LANE_HEIGHT;
                    const traits = CHARACTER_TRAITS[entry.agentId];
                    const isCurrent = entry.agentId === currentSpeakerId;
                    const isWinner = isCompleted && entry.agentId === winnerId;
                    const progress = Math.max(0, entry.score / MAX_SCORE);
                    const animalX = START_X + progress * TRACK_RANGE;

                    return (
                        <g key={entry.agentId}>
                            {/* Name label */}
                            <text
                                x="6"
                                y={y + LANE_HEIGHT / 2 + 1}
                                fill={isCurrent ? '#7C3AED' : '#374151'}
                                fontSize="7"
                                fontWeight={isCurrent ? 'bold' : 'normal'}
                                dominantBaseline="middle"
                            >
                                {entry.agentName}
                            </text>

                            {/* Current speaker highlight */}
                            {isCurrent && (
                                <motion.rect
                                    x="2"
                                    y={y}
                                    width={TRACK_WIDTH - 4}
                                    height={LANE_HEIGHT}
                                    fill="#7C3AED"
                                    opacity={0.08}
                                    rx="2"
                                    animate={{ opacity: [0.04, 0.12, 0.04] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            )}

                            {/* Animal on the track */}
                            <motion.g
                                animate={{ x: animalX - 20 }}
                                transition={{ type: 'spring', stiffness: 40, damping: 12 }}
                            >
                                <foreignObject
                                    x={0}
                                    y={y + 2}
                                    width="40"
                                    height={LANE_HEIGHT - 4}
                                >
                                    <div style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
                                        {traits && (
                                            <RaceAnimal
                                                animal={traits.animal}
                                                color={traits.animalColor}
                                                isRunning={isCurrent}
                                                size={36}
                                            />
                                        )}
                                    </div>
                                </foreignObject>
                            </motion.g>

                            {/* Winner crown */}
                            {isWinner && (
                                <motion.g
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                >
                                    <foreignObject
                                        x={animalX - 8}
                                        y={y - 4}
                                        width="16"
                                        height="16"
                                    >
                                        <div>
                                            <Crown className="w-4 h-4 text-yellow-500" />
                                        </div>
                                    </foreignObject>
                                </motion.g>
                            )}

                            {/* Stance badge at animal position */}
                            {entry.stance && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, x: animalX + 10 }}
                                    transition={{ type: 'spring', stiffness: 40, damping: 12 }}
                                >
                                    <rect
                                        x={0}
                                        y={y + 3}
                                        width="16"
                                        height="9"
                                        rx="2"
                                        fill={
                                            entry.stance === 'agree' ? '#D1FAE5'
                                            : entry.stance === 'disagree' ? '#FFE4E6'
                                            : entry.stance === 'cautious' ? '#FEF3C7'
                                            : '#F1F5F9'
                                        }
                                        stroke={
                                            entry.stance === 'agree' ? '#6EE7B7'
                                            : entry.stance === 'disagree' ? '#FCA5A5'
                                            : entry.stance === 'cautious' ? '#FCD34D'
                                            : '#CBD5E1'
                                        }
                                        strokeWidth="0.5"
                                    />
                                    <text
                                        x={8}
                                        y={y + 9.5}
                                        textAnchor="middle"
                                        fontSize="5"
                                        fontWeight="bold"
                                        fill={
                                            entry.stance === 'agree' ? '#047857'
                                            : entry.stance === 'disagree' ? '#BE123C'
                                            : entry.stance === 'cautious' ? '#B45309'
                                            : '#475569'
                                        }
                                    >
                                        {STANCE_LABEL[entry.stance]}
                                    </text>
                                </motion.g>
                            )}
                        </g>
                    );
                })}

                {/* Bottom grass decoration */}
                <rect x="0" y={svgHeight - 8} width={TRACK_WIDTH} height="8" fill="#16A34A" opacity="0.15" rx="2" />
            </svg>
        </motion.div>
    );
}

/* ─── Results Board ──────────────────────────── */

function RaceResults({ rankedScores }: { rankedScores: RaceScore[] }) {
    const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
    const medalBg = ['bg-yellow-50 border-yellow-200', 'bg-slate-50 border-slate-200', 'bg-amber-50 border-amber-200'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3"
        >
            {/* Podium top 3 */}
            <div className="flex items-end justify-center gap-3 mb-4 pt-2">
                {[1, 0, 2].map((rank) => {
                    const entry = rankedScores[rank];
                    if (!entry) return null;
                    const traits = CHARACTER_TRAITS[entry.agentId];
                    const heights = ['h-20', 'h-24', 'h-16'];
                    const podiumH = heights[rank];

                    return (
                        <motion.div
                            key={entry.agentId}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: rank === 0 ? 0.3 : rank === 1 ? 0.1 : 0.5, type: 'spring' }}
                            className="flex flex-col items-center"
                        >
                            {rank === 0 && (
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Crown className="w-5 h-5 text-yellow-400 mb-0.5" />
                                </motion.div>
                            )}
                            <div className="mb-1">
                                {traits && (
                                    <RaceAnimal
                                        animal={traits.animal}
                                        color={traits.animalColor}
                                        isRunning={false}
                                        size={rank === 0 ? 44 : 36}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700">{entry.agentName}</span>
                            {traits && (
                                <span className="text-[8px] text-slate-400">{ANIMAL_LABEL[traits.animal]}</span>
                            )}
                            <div className={cn(
                                "w-16 rounded-t-lg flex items-center justify-center border-t border-x mt-1",
                                podiumH,
                                medalBg[rank]
                            )}>
                                <div className="text-center">
                                    <div className={cn("text-lg font-black", medalColors[rank])}>
                                        {rank + 1}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500">{entry.score}pt</div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Remaining 4~9 */}
            <div className="space-y-1">
                {rankedScores.slice(3).map((entry, idx) => {
                    const traits = CHARACTER_TRAITS[entry.agentId];
                    const rank = idx + 4;

                    return (
                        <motion.div
                            key={entry.agentId}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.06 }}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100"
                        >
                            <span className="w-5 text-center text-[10px] font-bold text-slate-400">{rank}</span>
                            <div className="w-7 h-5 shrink-0">
                                {traits && (
                                    <RaceAnimal
                                        animal={traits.animal}
                                        color={traits.animalColor}
                                        isRunning={false}
                                        size={24}
                                    />
                                )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 flex-1">{entry.agentName}</span>
                            {traits && (
                                <span className="text-[8px] text-slate-400">{ANIMAL_LABEL[traits.animal]}</span>
                            )}
                            {entry.stance && (
                                <span className={cn(
                                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                                    entry.stance === 'agree' && "bg-emerald-100 text-emerald-700",
                                    entry.stance === 'disagree' && "bg-rose-100 text-rose-700",
                                    entry.stance === 'cautious' && "bg-amber-100 text-amber-700",
                                    entry.stance === 'neutral' && "bg-slate-100 text-slate-500",
                                )}>
                                    {STANCE_LABEL[entry.stance]}
                                </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-400 w-6 text-right">{entry.score}</span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
