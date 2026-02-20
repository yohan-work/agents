'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { EmployeeAgent, DebateArenaState, DebateRound } from '@/app/types/agent';
import { cn } from '@/app/lib/utils';
import { X, Zap, Trophy, ChevronRight, Swords } from 'lucide-react';

interface DebateArenaProps {
    arena: DebateArenaState;
    onClose: () => void;
    onSelectAgent: (agent: EmployeeAgent) => void;
    onDeselectAgent: (agentId: string) => void;
    onConfirmAgents: () => void;
    onSetRounds: (rounds: number) => void;
    onStartDebate: (topic: string) => void;
    onCancel: () => void;
}

export default function DebateArena({
    arena,
    onClose,
    onSelectAgent,
    onDeselectAgent,
    onConfirmAgents,
    onSetRounds,
    onStartDebate,
    onCancel,
}: DebateArenaProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center"
        >
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
            <div className="relative w-full h-full flex flex-col">
                {arena.phase === 'select_agents' && (
                    <AgentSelectPhase
                        arena={arena}
                        onSelect={onSelectAgent}
                        onDeselect={onDeselectAgent}
                        onConfirm={onConfirmAgents}
                        onClose={onClose}
                    />
                )}
                {arena.phase === 'select_options' && (
                    <OptionsPhase
                        arena={arena}
                        onSetRounds={onSetRounds}
                        onStart={onStartDebate}
                        onClose={onClose}
                    />
                )}
                {arena.phase === 'in_progress' && (
                    <BattlePhase
                        arena={arena}
                        onCancel={onCancel}
                    />
                )}
                {arena.phase === 'judging' && (
                    <JudgingPhase arena={arena} />
                )}
                {arena.phase === 'result' && (
                    <ResultPhase
                        arena={arena}
                        onClose={onClose}
                    />
                )}
            </div>
        </motion.div>
    );
}

/* ─── Agent Selection Phase ─────────────────────────────────── */

function AgentSelectPhase({
    arena,
    onSelect,
    onDeselect,
    onConfirm,
    onClose,
}: {
    arena: DebateArenaState;
    onSelect: (agent: EmployeeAgent) => void;
    onDeselect: (agentId: string) => void;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const selectedIds = [arena.attacker?.id, arena.defender?.id].filter(Boolean);
    const canConfirm = arena.attacker && arena.defender;

    return (
        <div className="flex flex-col items-center justify-center h-full px-4">
            <CloseButton onClick={onClose} />
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8"
            >
                <div className="flex items-center gap-2 justify-center mb-2">
                    <Swords className="w-6 h-6 text-red-400" />
                    <h2 className="text-2xl font-black text-white tracking-tight">DEBATE ARENA</h2>
                    <Swords className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-slate-400 text-sm">대결할 에이전트 2명을 선택하세요</p>
            </motion.div>

            <div className="flex items-center gap-6 mb-8">
                <SelectedSlot agent={arena.attacker} label="공격" color="red" onDeselect={onDeselect} />
                <div className="text-3xl font-black text-slate-500">VS</div>
                <SelectedSlot agent={arena.defender} label="반박" color="blue" onDeselect={onDeselect} />
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mb-8">
                {agents.map((agent, idx) => {
                    const isSelected = selectedIds.includes(agent.id);
                    return (
                        <motion.button
                            key={agent.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.04 }}
                            onClick={() => isSelected ? onDeselect(agent.id) : onSelect(agent)}
                            className={cn(
                                "relative p-3 rounded-xl border-2 transition-all",
                                isSelected
                                    ? "border-yellow-400 bg-yellow-400/10 ring-2 ring-yellow-400/30"
                                    : "border-slate-700 bg-slate-800/60 hover:border-slate-500 hover:bg-slate-800"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg",
                                agent.avatarColor
                            )}>
                                {agent.name.slice(0, 1)}
                            </div>
                            <div className="text-xs font-bold text-white text-center">{agent.name}</div>
                            <div className="text-[10px] text-slate-400 text-center">{agent.role}</div>
                            {isSelected && (
                                <motion.div
                                    layoutId={`check-${agent.id}`}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center"
                                >
                                    <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <motion.button
                onClick={onConfirm}
                disabled={!canConfirm}
                whileHover={canConfirm ? { scale: 1.05 } : {}}
                whileTap={canConfirm ? { scale: 0.95 } : {}}
                className={cn(
                    "px-8 py-3 rounded-xl font-bold text-sm transition-all",
                    canConfirm
                        ? "bg-gradient-to-r from-red-500 to-blue-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                )}
            >
                대결 설정
                <ChevronRight className="w-4 h-4 inline ml-1" />
            </motion.button>
        </div>
    );
}

function SelectedSlot({
    agent,
    label,
    color,
    onDeselect,
}: {
    agent: EmployeeAgent | null;
    label: string;
    color: 'red' | 'blue';
    onDeselect: (id: string) => void;
}) {
    const borderColor = color === 'red' ? 'border-red-500/50' : 'border-blue-500/50';
    const textColor = color === 'red' ? 'text-red-400' : 'text-blue-400';
    const glowColor = color === 'red' ? 'shadow-red-500/20' : 'shadow-blue-500/20';

    return (
        <div className={cn(
            "w-28 h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
            agent ? `${borderColor} bg-slate-800/80 shadow-lg ${glowColor} border-solid` : "border-slate-600 bg-slate-800/40"
        )}>
            {agent ? (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-1 relative"
                >
                    <button
                        onClick={() => onDeselect(agent.id)}
                        className="absolute -top-2 -right-6 w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center hover:bg-slate-500 transition-colors"
                    >
                        <X className="w-2.5 h-2.5 text-white" />
                    </button>
                    <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl",
                        agent.avatarColor
                    )}>
                        {agent.name.slice(0, 1)}
                    </div>
                    <span className="text-xs font-bold text-white">{agent.name}</span>
                    <span className={cn("text-[10px] font-bold", textColor)}>{label}</span>
                </motion.div>
            ) : (
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-600 mx-auto mb-1 flex items-center justify-center">
                        <span className="text-slate-600 text-xl">?</span>
                    </div>
                    <span className={cn("text-[10px] font-bold", textColor)}>{label}</span>
                </div>
            )}
        </div>
    );
}

/* ─── Options Phase ─────────────────────────────────────────── */

function OptionsPhase({
    arena,
    onSetRounds,
    onStart,
    onClose,
}: {
    arena: DebateArenaState;
    onSetRounds: (rounds: number) => void;
    onStart: (topic: string) => void;
    onClose: () => void;
}) {
    const [topic, setTopic] = useState('');
    const roundOptions = [2, 3, 5];

    return (
        <div className="flex flex-col items-center justify-center h-full px-4">
            <CloseButton onClick={onClose} />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-md space-y-6"
            >
                <div className="flex items-center justify-center gap-6 mb-4">
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-red-500/50",
                            arena.attacker?.avatarColor
                        )}>
                            {arena.attacker?.name.slice(0, 1)}
                        </div>
                        <span className="text-xs font-bold text-red-400 mt-1">{arena.attacker?.name}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-500">VS</div>
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-blue-500/50",
                            arena.defender?.avatarColor
                        )}>
                            {arena.defender?.name.slice(0, 1)}
                        </div>
                        <span className="text-xs font-bold text-blue-400 mt-1">{arena.defender?.name}</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 block">라운드 수</label>
                    <div className="flex gap-2">
                        {roundOptions.map((r) => (
                            <button
                                key={r}
                                onClick={() => onSetRounds(r)}
                                className={cn(
                                    "flex-1 py-2.5 rounded-lg font-bold text-sm transition-all border",
                                    arena.totalRounds === r
                                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25"
                                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                                )}
                            >
                                {r} 라운드
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 mb-2 block">토론 주제</label>
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="대결 안건을 입력하세요..."
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none h-24"
                    />
                </div>

                <motion.button
                    onClick={() => onStart(topic)}
                    disabled={!topic.trim()}
                    whileHover={topic.trim() ? { scale: 1.02 } : {}}
                    whileTap={topic.trim() ? { scale: 0.98 } : {}}
                    className={cn(
                        "w-full py-3.5 rounded-xl font-black text-base tracking-wide transition-all flex items-center justify-center gap-2",
                        topic.trim()
                            ? "bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                            : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    )}
                >
                    <Zap className="w-5 h-5" />
                    FIGHT!
                </motion.button>
            </motion.div>
        </div>
    );
}

/* ─── Battle Phase ──────────────────────────────────────────── */

function BattlePhase({
    arena,
    onCancel,
}: {
    arena: DebateArenaState;
    onCancel: () => void;
}) {
    const { attacker, defender, currentRound, totalRounds, currentTurn, streamingContent, rounds } = arena;
    if (!attacker || !defender) return null;

    const currentAgent = currentTurn === 'attacker' ? attacker : defender;

    const judgeAgents = agents.filter(
        (a) => a.id !== attacker.id && a.id !== defender.id
    );

    const lastCompletedRound = rounds[rounds.length - 1];

    return (
        <div className="flex flex-col h-full">
            {/* Top Bar: Round indicator */}
            <div className="flex items-center justify-between px-4 py-3">
                <button
                    onClick={onCancel}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500"
                >
                    중단
                </button>
                <motion.div
                    key={currentRound}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="text-xs text-slate-500 font-medium">ROUND</div>
                    <div className="text-2xl font-black text-white">
                        {currentRound} <span className="text-slate-600 text-lg">/ {totalRounds}</span>
                    </div>
                </motion.div>
                <div className="text-xs text-slate-600 px-3 py-1.5">
                    {arena.topic.length > 20 ? arena.topic.slice(0, 20) + '...' : arena.topic}
                </div>
            </div>

            {/* HP Bars + Avatars */}
            <div className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <FighterCard agent={attacker} side="left" isActive={currentTurn === 'attacker'} color="red" />
                    <div className="flex-shrink-0">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-3xl font-black text-slate-600"
                        >
                            VS
                        </motion.div>
                    </div>
                    <FighterCard agent={defender} side="right" isActive={currentTurn === 'defender'} color="blue" />
                </div>
            </div>

            {/* Current Streaming Content */}
            <div className="flex-1 px-6 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {streamingContent ? (
                        <motion.div
                            key={`${currentRound}-${currentTurn}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "rounded-2xl p-4 border-2",
                                currentTurn === 'attacker'
                                    ? "bg-red-950/30 border-red-500/30"
                                    : "bg-blue-950/30 border-blue-500/30"
                            )}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                                    currentAgent.avatarColor
                                )}>
                                    {currentAgent.name.slice(0, 1)}
                                </div>
                                <span className="text-xs font-bold text-white">{currentAgent.name}</span>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    currentTurn === 'attacker'
                                        ? "bg-red-500/20 text-red-400"
                                        : "bg-blue-500/20 text-blue-400"
                                )}>
                                    {currentTurn === 'attacker' ? 'ATTACK' : 'COUNTER'}
                                </span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {streamingContent}
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    className="inline-block w-0.5 h-4 bg-white ml-0.5 align-middle"
                                />
                            </p>
                        </motion.div>
                    ) : lastCompletedRound ? (
                        <CompletedRound
                            round={lastCompletedRound}
                            attacker={attacker}
                            defender={defender}
                        />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center h-32"
                        >
                            <WaitingDots label={`${currentAgent.name} 준비 중`} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Round History */}
            {rounds.length > 0 && (
                <div className="px-6 py-2">
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: totalRounds }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-8 h-1.5 rounded-full transition-all",
                                    i < rounds.length
                                        ? "bg-violet-500"
                                        : i === currentRound - 1
                                            ? "bg-violet-500/50 animate-pulse"
                                            : "bg-slate-700"
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Judge Panel */}
            <div className="px-6 py-3 border-t border-slate-800">
                <div className="text-[10px] text-slate-600 text-center mb-2 font-medium tracking-wider uppercase">
                    Judges
                </div>
                <div className="flex justify-center gap-2">
                    {judgeAgents.map((judge) => (
                        <div
                            key={judge.id}
                            className="flex flex-col items-center opacity-40"
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                                judge.avatarColor
                            )}>
                                {judge.name.slice(0, 1)}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-0.5">{judge.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function FighterCard({
    agent,
    side,
    isActive,
    color,
}: {
    agent: EmployeeAgent;
    side: 'left' | 'right';
    isActive: boolean;
    color: 'red' | 'blue';
}) {
    const barColor = color === 'red' ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600';
    const borderColor = color === 'red' ? 'border-red-500' : 'border-blue-500';
    const glowClass = isActive
        ? color === 'red' ? 'shadow-red-500/40 shadow-lg' : 'shadow-blue-500/40 shadow-lg'
        : '';

    return (
        <div className={cn("flex-1 flex items-center gap-3", side === 'right' && "flex-row-reverse")}>
            <motion.div
                animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
                className={cn(
                    "w-16 h-16 rounded-full border-3 flex items-center justify-center text-white font-bold text-xl shrink-0",
                    borderColor, glowClass, agent.avatarColor
                )}
            >
                {agent.name.slice(0, 1)}
            </motion.div>
            <div className={cn("flex-1 min-w-0", side === 'right' && "text-right")}>
                <div className="text-xs font-bold text-white mb-0.5">{agent.name}</div>
                <div className="text-[10px] text-slate-500 mb-1.5">{agent.rank}</div>
                <div className={cn("h-2.5 rounded-full bg-slate-800 overflow-hidden", side === 'right' && "flex justify-end")}>
                    <motion.div
                        className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                        initial={{ width: '100%' }}
                        animate={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}

function CompletedRound({
    round,
    attacker,
    defender,
}: {
    round: DebateRound;
    attacker: EmployeeAgent;
    defender: EmployeeAgent;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
        >
            <div className="text-[10px] text-center text-slate-600 font-bold tracking-wider uppercase mb-2">
                Round {round.roundNumber} Complete
            </div>
            <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", attacker.avatarColor)}>
                        {attacker.name.slice(0, 1)}
                    </div>
                    <span className="text-[10px] font-bold text-red-400">{attacker.name} - ATTACK</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{round.attackerContent}</p>
            </div>
            <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold", defender.avatarColor)}>
                        {defender.name.slice(0, 1)}
                    </div>
                    <span className="text-[10px] font-bold text-blue-400">{defender.name} - COUNTER</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{round.defenderContent}</p>
            </div>
        </motion.div>
    );
}

/* ─── Judging Phase ─────────────────────────────────────────── */

function JudgingPhase({ arena }: { arena: DebateArenaState }) {
    const judgeAgents = agents.filter(
        (a) => a.id !== arena.attacker?.id && a.id !== arena.defender?.id
    );

    return (
        <div className="flex flex-col items-center justify-center h-full px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 border-4 border-slate-700 border-t-violet-500 rounded-full"
                />
                <h3 className="text-xl font-black text-white mb-2">심판 판정 중</h3>
                <p className="text-sm text-slate-400">7명의 심판이 대결을 평가하고 있습니다...</p>

                <div className="flex justify-center gap-3 mt-6">
                    {judgeAgents.map((judge, idx) => (
                        <motion.div
                            key={judge.id}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.2 }}
                            className="flex flex-col items-center"
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                judge.avatarColor
                            )}>
                                {judge.name.slice(0, 1)}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1">{judge.name}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

/* ─── Result Phase ──────────────────────────────────────────── */

function ResultPhase({
    arena,
    onClose,
}: {
    arena: DebateArenaState;
    onClose: () => void;
}) {
    const { attacker, defender, verdicts, winnerId, rounds } = arena;

    const [revealedCount, setRevealedCount] = useState(0);
    const [showWinner, setShowWinner] = useState(false);

    const attackerVotes = verdicts.filter((v) => v.winner === 'attacker').length;
    const defenderVotes = verdicts.filter((v) => v.winner === 'defender').length;

    const judgeAgents = agents.filter(
        (a) => attacker && defender && a.id !== attacker.id && a.id !== defender.id
    );

    useEffect(() => {
        const timers: ReturnType<typeof setTimeout>[] = [];

        if (verdicts.length === 0) {
            timers.push(setTimeout(() => setShowWinner(true), 0));
        } else {
            verdicts.forEach((_, idx) => {
                timers.push(setTimeout(() => {
                    setRevealedCount(idx + 1);
                }, (idx + 1) * 400));
            });
            timers.push(setTimeout(() => {
                setShowWinner(true);
            }, (verdicts.length + 1) * 400));
        }

        return () => timers.forEach(clearTimeout);
    }, [verdicts]);

    const attackerHp = useMemo(() => {
        if (!showWinner || verdicts.length === 0) return 100;
        return Math.round((attackerVotes / verdicts.length) * 100);
    }, [showWinner, attackerVotes, verdicts.length]);

    const defenderHp = useMemo(() => {
        if (!showWinner || verdicts.length === 0) return 100;
        return Math.round((defenderVotes / verdicts.length) * 100);
    }, [showWinner, defenderVotes, verdicts.length]);

    if (!attacker || !defender) return null;

    const winner = winnerId === attacker.id ? attacker : defender;

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <CloseButton onClick={onClose} />

            {/* HP Bars with score */}
            <div className="px-6 pt-4 pb-2">
                <div className="flex items-center gap-4">
                    <ResultFighterCard
                        agent={attacker}
                        side="left"
                        color="red"
                        hp={attackerHp}
                        votes={attackerVotes}
                        isWinner={winnerId === attacker.id && showWinner}
                        showHp={showWinner}
                    />
                    <div className="flex-shrink-0 text-2xl font-black text-slate-600">VS</div>
                    <ResultFighterCard
                        agent={defender}
                        side="right"
                        color="blue"
                        hp={defenderHp}
                        votes={defenderVotes}
                        isWinner={winnerId === defender.id && showWinner}
                        showHp={showWinner}
                    />
                </div>
            </div>

            {/* Winner Banner */}
            <AnimatePresence>
                {showWinner && winnerId && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="mx-6 my-3 text-center"
                    >
                        <div className="relative inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-yellow-500/20 border border-yellow-500/40 rounded-2xl px-6 py-3">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            <div>
                                <div className="text-[10px] text-yellow-500/70 font-bold tracking-widest uppercase">Winner</div>
                                <div className="text-lg font-black text-yellow-400">{winner.name}</div>
                            </div>
                            <div className="text-2xl font-black text-yellow-500/80">
                                {attackerVotes} : {defenderVotes}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Judge Verdicts */}
            {verdicts.length > 0 && (
                <div className="px-6 py-3">
                    <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase text-center mb-3">
                        Judge Verdicts
                    </div>
                    <div className="space-y-2">
                        {verdicts.map((verdict, idx) => {
                            const judge = judgeAgents.find((a) => a.id === verdict.agentId);
                            if (!judge) return null;
                            const isRevealed = idx < revealedCount;
                            const voteFor = verdict.winner === 'attacker' ? attacker : defender;
                            const voteColor = verdict.winner === 'attacker' ? 'red' : 'blue';

                            return (
                                <motion.div
                                    key={verdict.agentId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={isRevealed ? { opacity: 1, x: 0 } : { opacity: 0.15, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all",
                                        isRevealed
                                            ? voteColor === 'red'
                                                ? "bg-red-950/30 border-red-500/30"
                                                : "bg-blue-950/30 border-blue-500/30"
                                            : "bg-slate-800/50 border-slate-700/50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                                        judge.avatarColor
                                    )}>
                                        {judge.name.slice(0, 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white">{judge.name}</span>
                                            {isRevealed && (
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                                        voteColor === 'red'
                                                            ? "bg-red-500/20 text-red-400"
                                                            : "bg-blue-500/20 text-blue-400"
                                                    )}
                                                >
                                                    {voteFor.name}
                                                </motion.span>
                                            )}
                                        </div>
                                        {isRevealed && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="text-[11px] text-slate-400 mt-0.5 truncate"
                                            >
                                                {verdict.reason}
                                            </motion.p>
                                        )}
                                    </div>
                                    {!isRevealed && (
                                        <div className="text-slate-600 text-lg">?</div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Round Replay */}
            {rounds.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-800 mt-auto">
                    <RoundReplay rounds={rounds} attacker={attacker} defender={defender} />
                </div>
            )}
        </div>
    );
}

function ResultFighterCard({
    agent,
    side,
    color,
    hp,
    votes,
    isWinner,
    showHp,
}: {
    agent: EmployeeAgent;
    side: 'left' | 'right';
    color: 'red' | 'blue';
    hp: number;
    votes: number;
    isWinner: boolean;
    showHp: boolean;
}) {
    const barColor = color === 'red' ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600';
    const borderColor = isWinner
        ? 'border-yellow-400 ring-2 ring-yellow-400/30'
        : color === 'red' ? 'border-red-500/50' : 'border-blue-500/50';

    return (
        <div className={cn("flex-1 flex items-center gap-3", side === 'right' && "flex-row-reverse")}>
            <motion.div
                animate={isWinner ? { scale: [1, 1.1, 1] } : {}}
                transition={isWinner ? { duration: 1, repeat: Infinity } : {}}
                className={cn(
                    "w-16 h-16 rounded-full border-3 flex items-center justify-center text-white font-bold text-xl shrink-0",
                    borderColor, agent.avatarColor
                )}
            >
                {agent.name.slice(0, 1)}
                {isWinner && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2"
                    >
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </motion.div>
                )}
            </motion.div>
            <div className={cn("flex-1 min-w-0", side === 'right' && "text-right")}>
                <div className="text-xs font-bold text-white mb-0.5">{agent.name}</div>
                <div className="text-[10px] text-slate-500 mb-1.5">{votes} votes</div>
                <div className={cn("h-2.5 rounded-full bg-slate-800 overflow-hidden", side === 'right' && "flex justify-end")}>
                    <motion.div
                        className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
                        initial={{ width: '100%' }}
                        animate={{ width: showHp ? `${hp}%` : '100%' }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                    />
                </div>
            </div>
        </div>
    );
}

function RoundReplay({
    rounds,
    attacker,
    defender,
}: {
    rounds: DebateRound[];
    attacker: EmployeeAgent;
    defender: EmployeeAgent;
}) {
    const [expandedRound, setExpandedRound] = useState<number | null>(null);

    return (
        <div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase text-center mb-2">
                Round Replay
            </div>
            <div className="space-y-1.5">
                {rounds.map((round) => (
                    <div key={round.roundNumber}>
                        <button
                            onClick={() => setExpandedRound(
                                expandedRound === round.roundNumber ? null : round.roundNumber
                            )}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors text-left"
                        >
                            <span className="text-xs font-bold text-slate-400">Round {round.roundNumber}</span>
                            <ChevronRight className={cn(
                                "w-3 h-3 text-slate-500 transition-transform",
                                expandedRound === round.roundNumber && "rotate-90"
                            )} />
                        </button>
                        <AnimatePresence>
                            {expandedRound === round.roundNumber && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2 space-y-2">
                                        <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-2.5">
                                            <div className="text-[10px] font-bold text-red-400 mb-1">{attacker.name} - ATTACK</div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{round.attackerContent}</p>
                                        </div>
                                        <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-2.5">
                                            <div className="text-[10px] font-bold text-blue-400 mb-1">{defender.name} - COUNTER</div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{round.defenderContent}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ─── Shared Components ─────────────────────────────────────── */

function CloseButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            aria-label="닫기"
        >
            <X className="w-4 h-4" />
        </button>
    );
}

function WaitingDots({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-slate-500"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>
            <span className="text-xs text-slate-500">{label}</span>
        </div>
    );
}
