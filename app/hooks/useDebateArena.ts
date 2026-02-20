'use client';

import { useState, useCallback, useRef } from 'react';
import { agents } from '@/app/data/agents';
import {
    EmployeeAgent,
    DebateArenaState,
    DebateRound,
    JudgeVerdict,
    DebateTurn,
} from '@/app/types/agent';

const INITIAL_STATE: DebateArenaState = {
    phase: 'idle',
    attacker: null,
    defender: null,
    topic: '',
    totalRounds: 3,
    currentRound: 0,
    currentTurn: 'attacker',
    rounds: [],
    streamingContent: '',
    verdicts: [],
    winnerId: null,
};

interface JudgeApiResponse {
    verdicts: JudgeVerdict[];
    winnerId: string;
    attackerVotes: number;
    defenderVotes: number;
}

export interface UseDebateArenaReturn {
    arena: DebateArenaState;
    openArena: () => void;
    closeArena: () => void;
    selectAgent: (agent: EmployeeAgent) => void;
    deselectAgent: (agentId: string) => void;
    setTotalRounds: (rounds: number) => void;
    startDebate: (topic: string) => Promise<void>;
    cancelDebate: () => void;
    confirmAgents: () => void;
}

export function useDebateArena(): UseDebateArenaReturn {
    const [arena, setArena] = useState<DebateArenaState>(INITIAL_STATE);
    const cancelledRef = useRef(false);

    const openArena = useCallback(() => {
        setArena({ ...INITIAL_STATE, phase: 'select_agents' });
    }, []);

    const closeArena = useCallback(() => {
        cancelledRef.current = true;
        setArena(INITIAL_STATE);
    }, []);

    const selectAgent = useCallback((agent: EmployeeAgent) => {
        setArena((prev) => {
            if (prev.phase !== 'select_agents') return prev;
            if (prev.attacker?.id === agent.id || prev.defender?.id === agent.id) return prev;
            if (!prev.attacker) return { ...prev, attacker: agent };
            if (!prev.defender) return { ...prev, defender: agent };
            return prev;
        });
    }, []);

    const deselectAgent = useCallback((agentId: string) => {
        setArena((prev) => {
            if (prev.phase !== 'select_agents') return prev;
            if (prev.attacker?.id === agentId) return { ...prev, attacker: null };
            if (prev.defender?.id === agentId) return { ...prev, defender: null };
            return prev;
        });
    }, []);

    const confirmAgents = useCallback(() => {
        setArena((prev) => {
            if (!prev.attacker || !prev.defender) return prev;
            return { ...prev, phase: 'select_options' };
        });
    }, []);

    const setTotalRounds = useCallback((rounds: number) => {
        setArena((prev) => ({ ...prev, totalRounds: rounds }));
    }, []);

    const streamResponse = async (
        topic: string,
        agent: EmployeeAgent,
        opponent: EmployeeAgent,
        turn: DebateTurn,
        roundNumber: number,
        totalRounds: number,
        previousRounds: DebateRound[],
        opponentLastContent: string,
    ): Promise<string> => {
        const response = await fetch('/api/debate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic,
                agent,
                opponent,
                turn,
                roundNumber,
                totalRounds,
                previousRounds,
                opponentLastContent,
            }),
        });

        if (!response.ok) {
            const errorData: Record<string, string> = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Debate API request failed');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (cancelledRef.current) {
                reader.cancel();
                return fullContent;
            }
            fullContent += decoder.decode(value, { stream: true });
            const snapshot = fullContent;
            setArena((prev) => ({ ...prev, streamingContent: snapshot }));
        }

        return fullContent;
    };

    const startDebate = useCallback(async (topic: string) => {
        cancelledRef.current = false;

        setArena((prev) => ({
            ...prev,
            phase: 'in_progress',
            topic,
            currentRound: 1,
            currentTurn: 'attacker',
            rounds: [],
            streamingContent: '',
            verdicts: [],
            winnerId: null,
        }));

        let currentAttacker: EmployeeAgent | null = null;
        let currentDefender: EmployeeAgent | null = null;
        let totalRounds = 3;

        setArena((prev) => {
            currentAttacker = prev.attacker;
            currentDefender = prev.defender;
            totalRounds = prev.totalRounds;
            return prev;
        });

        await new Promise((r) => setTimeout(r, 50));

        setArena((prev) => {
            currentAttacker = prev.attacker;
            currentDefender = prev.defender;
            totalRounds = prev.totalRounds;
            return prev;
        });

        if (!currentAttacker || !currentDefender) return;

        const completedRounds: DebateRound[] = [];

        for (let round = 1; round <= totalRounds; round++) {
            if (cancelledRef.current) break;

            setArena((prev) => ({
                ...prev,
                currentRound: round,
                currentTurn: 'attacker',
                streamingContent: '',
            }));

            await new Promise((r) => setTimeout(r, 800));
            if (cancelledRef.current) break;

            let attackerContent = '';
            try {
                attackerContent = await streamResponse(
                    topic,
                    currentAttacker,
                    currentDefender,
                    'attacker',
                    round,
                    totalRounds,
                    completedRounds,
                    '',
                );
            } catch (error) {
                console.error('[DEBATE] Attacker error:', error);
                attackerContent = '(응답 실패)';
            }

            if (cancelledRef.current) break;

            setArena((prev) => ({
                ...prev,
                currentTurn: 'defender',
                streamingContent: '',
            }));

            await new Promise((r) => setTimeout(r, 800));
            if (cancelledRef.current) break;

            let defenderContent = '';
            try {
                defenderContent = await streamResponse(
                    topic,
                    currentDefender,
                    currentAttacker,
                    'defender',
                    round,
                    totalRounds,
                    completedRounds,
                    attackerContent,
                );
            } catch (error) {
                console.error('[DEBATE] Defender error:', error);
                defenderContent = '(응답 실패)';
            }

            if (cancelledRef.current) break;

            const newRound: DebateRound = {
                roundNumber: round,
                attackerContent,
                defenderContent,
            };
            completedRounds.push(newRound);

            setArena((prev) => ({
                ...prev,
                rounds: [...completedRounds],
                streamingContent: '',
            }));

            if (round < totalRounds) {
                await new Promise((r) => setTimeout(r, 1200));
            }
        }

        if (cancelledRef.current) return;

        setArena((prev) => ({ ...prev, phase: 'judging', streamingContent: '' }));

        try {
            const judgeAgents = agents.filter(
                (a) => a.id !== currentAttacker!.id && a.id !== currentDefender!.id
            );

            const response = await fetch('/api/debate/judge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    attacker: currentAttacker,
                    defender: currentDefender,
                    rounds: completedRounds,
                    judges: judgeAgents,
                }),
            });

            if (!response.ok) {
                throw new Error('Judge API failed');
            }

            const result: JudgeApiResponse = await response.json();

            if (cancelledRef.current) return;

            setArena((prev) => ({
                ...prev,
                phase: 'result',
                verdicts: result.verdicts,
                winnerId: result.winnerId,
            }));
        } catch (error) {
            console.error('[DEBATE] Judge error:', error);
            if (!cancelledRef.current) {
                setArena((prev) => ({
                    ...prev,
                    phase: 'result',
                    verdicts: [],
                    winnerId: null,
                }));
            }
        }
    }, []);

    const cancelDebate = useCallback(() => {
        cancelledRef.current = true;
        setArena(INITIAL_STATE);
    }, []);

    return {
        arena,
        openArena,
        closeArena,
        selectAgent,
        deselectAgent,
        setTotalRounds,
        startDebate,
        cancelDebate,
        confirmAgents,
    };
}
