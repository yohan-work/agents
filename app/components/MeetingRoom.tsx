'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { EmployeeAgent, ChatMessage, AgentStance, DiscussionState } from '@/app/types/agent';
import { useDiscussion } from '@/app/hooks/useDiscussion';
import { cn } from '@/app/lib/utils';
import SpeechBubble from './SpeechBubble';
import AgentProfileCard from './AgentProfileCard';
import ConnectionLines from './ConnectionLine';
import DiscussionSummary from './DiscussionSummary';
import {
    Send,
    User,
    X,
    Users,
    MessageSquare,
    AlertTriangle,
    Swords,
    Square,
} from 'lucide-react';

interface LatestMessageInfo {
    content: string;
    stance?: AgentStance;
    isStreaming: boolean;
}

const STANCE_CONFIG: Record<AgentStance, { label: string; color: string; bg: string; border: string }> = {
    agree: { label: '찬성', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    disagree: { label: '반대', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    neutral: { label: '중립', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    cautious: { label: '신중', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
};

export default function MeetingRoom() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatSpeakingAgentId, setChatSpeakingAgentId] = useState<string | null>(null);
    const [targetAgent, setTargetAgent] = useState<EmployeeAgent | null>(null);
    const [mobileView, setMobileView] = useState<'chat' | 'boardroom'>('chat');
    const [isDiscussMode, setIsDiscussMode] = useState(false);
    const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
    const [showSummary, setShowSummary] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const onDiscussionMessageAdd = useCallback((msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

    const onDiscussionMessageUpdate = useCallback((id: string, content: string, stance?: AgentStance) => {
        setMessages((prev) =>
            prev.map((m) =>
                m.id === id ? { ...m, content, ...(stance !== undefined ? { stance } : {}) } : m
            )
        );
    }, []);

    const {
        discussion,
        startDiscussion,
        cancelDiscussion,
        speakingAgentId: discussSpeakingAgentId,
    } = useDiscussion(onDiscussionMessageAdd, onDiscussionMessageUpdate);

    const speakingAgentId = isDiscussMode ? discussSpeakingAgentId : chatSpeakingAgentId;
    const isBusy = isProcessing || discussion.status === 'in_progress';

    const lastAgentMsgIndex = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].senderId !== 'user' && messages[i].senderId !== 'system') return i;
        }
        return -1;
    }, [messages]);

    const latestAgentMessages = useMemo(() => {
        const result: Record<string, LatestMessageInfo> = {};
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.senderId === 'user' || msg.senderId === 'system') continue;
            if (result[msg.senderId]) continue;
            const isActiveMessage = i === lastAgentMsgIndex && isBusy && msg.content.length > 0 && !msg.stance;
            result[msg.senderId] = {
                content: msg.content,
                stance: msg.stance,
                isStreaming: isActiveMessage,
            };
        }
        return result;
    }, [messages, lastAgentMsgIndex, isBusy]);

    const scrollToBottom = useCallback(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleAgentClick = (agent: EmployeeAgent) => {
        if (isBusy || isDiscussMode) return;
        setTargetAgent((prev) => (prev?.id === agent.id ? null : agent));
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isBusy) return;

        const currentInput = input;
        setInput('');
        setMobileView('chat');

        if (isDiscussMode) {
            setShowSummary(true);
            const topicMsg: ChatMessage = {
                id: `topic-${Date.now()}`,
                senderId: 'user',
                content: currentInput,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, topicMsg]);
            await startDiscussion(currentInput);
        } else {
            const userMsg: ChatMessage = {
                id: Date.now().toString(),
                senderId: 'user',
                content: currentInput,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, userMsg]);
            setIsProcessing(true);
            await generateChatResponses(currentInput, userMsg);
        }
    };

    const generateChatResponses = async (userInput: string, userMsg: ChatMessage) => {
        let speakers: EmployeeAgent[];
        if (targetAgent) {
            speakers = [targetAgent];
            setTargetAgent(null);
        } else {
            const shuffled = [...agents].sort(() => 0.5 - Math.random());
            speakers = shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
        }

        let accumulatedMessages: ChatMessage[] = [...messages, userMsg];

        for (let i = 0; i < speakers.length; i++) {
            const agent = speakers[i];
            setChatSpeakingAgentId(agent.id);
            await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: accumulatedMessages, agent }),
                });

                if (!response.ok) {
                    const errorData: Record<string, string> = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'API request failed');
                }

                const msgId = `${Date.now()}-${i}`;
                const msgTimestamp = Date.now();

                setMessages((prev) => [...prev, {
                    id: msgId, senderId: agent.id, content: '', timestamp: msgTimestamp,
                }]);
                setChatSpeakingAgentId(null);

                const reader = response.body?.getReader();
                if (!reader) throw new Error('No response stream available');

                const decoder = new TextDecoder();
                let fullContent = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    fullContent += decoder.decode(value, { stream: true });
                    const currentContent = fullContent;
                    setMessages((prev) =>
                        prev.map((m) => m.id === msgId ? { ...m, content: currentContent } : m)
                    );
                }

                accumulatedMessages = [...accumulatedMessages, {
                    id: msgId, senderId: agent.id, content: fullContent, timestamp: msgTimestamp,
                }];

            } catch (error: unknown) {
                const err = error instanceof Error ? error : new Error('Unknown error');
                console.error('Failed to get response for agent', agent.name, err);
                const errorMsg: ChatMessage = {
                    id: `${Date.now()}-err-${i}`, senderId: 'system',
                    content: `${agent.name}: ${err.message || '응답 실패'}`, timestamp: Date.now(),
                };
                accumulatedMessages = [...accumulatedMessages, errorMsg];
                setMessages((prev) => [...prev, errorMsg]);
            }
        }

        setChatSpeakingAgentId(null);
        setIsProcessing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleCancelDiscussion = () => {
        cancelDiscussion();
    };

    const inputPlaceholder = isDiscussMode
        ? '전원 토론할 안건을 제시하세요...'
        : targetAgent
            ? `${targetAgent.name} ${targetAgent.rank}에게 질문...`
            : '안건을 제시하거나 의견을 물어보세요...';

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
            <header className="px-4 md:px-6 py-3 md:py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Boardroom AI</h1>
                <div className="flex items-center gap-3">
                    <div className="flex md:hidden gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setMobileView('boardroom')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                mobileView === 'boardroom' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                            )}
                            aria-label="보드룸 보기"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setMobileView('chat')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                mobileView === 'chat' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                            )}
                            aria-label="채팅 보기"
                        >
                            <MessageSquare className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-xs md:text-sm text-slate-500">2026 Strategic Meeting</div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Panel: Boardroom */}
                <div className={cn(
                    "bg-slate-100 p-4 md:p-8 flex-col items-center justify-center relative overflow-hidden",
                    "hidden md:flex md:w-2/3",
                    mobileView === 'boardroom' ? "flex w-full" : ""
                )}>
                    {/* Discussion progress / summary overlay */}
                    <AnimatePresence>
                        {discussion.status === 'in_progress' && (
                            <DiscussionProgress discussion={discussion} />
                        )}
                        {discussion.status === 'completed' && showSummary && (
                            <DiscussionSummary
                                discussion={discussion}
                                messages={messages}
                                onClose={() => setShowSummary(false)}
                            />
                        )}
                    </AnimatePresence>

                    <div className="w-[90%] md:w-[80%] h-[55%] md:h-[60%] bg-white rounded-[30px] md:rounded-[40px] shadow-xl border border-slate-200 relative flex items-center justify-center">
                        <ConnectionLines messages={messages} isActive={isBusy || discussion.status === 'completed'} />

                        <div className="text-slate-300 font-bold text-2xl md:text-4xl opacity-20 tracking-widest uppercase">
                            Company
                        </div>

                        <div className="absolute -bottom-14 md:-bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-900 border-4 border-white shadow-lg flex items-center justify-center z-10">
                                <User className="text-white w-7 h-7 md:w-10 md:h-10" />
                            </div>
                            <div className="mt-1.5 md:mt-2 bg-slate-900 text-white px-3 md:px-4 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold shadow-md">
                                회장 (나)
                            </div>
                        </div>

                        <div className="absolute -top-10 md:-top-12 left-0 w-full flex justify-center gap-8 md:gap-16">
                            {agents.slice(0, 3).map((agent) => (
                                <AgentAvatar
                                    key={agent.id}
                                    agent={agent}
                                    position="top"
                                    isSpeaking={speakingAgentId === agent.id}
                                    isSelected={targetAgent?.id === agent.id}
                                    onClick={() => handleAgentClick(agent)}
                                    discussion={discussion}
                                    latestMessage={latestAgentMessages[agent.id]}
                                    isHovered={hoveredAgentId === agent.id}
                                    onHover={setHoveredAgentId}
                                />
                            ))}
                        </div>

                        <div className="absolute top-1/2 -left-10 md:-left-12 transform -translate-y-1/2 flex flex-col gap-8 md:gap-12">
                            {agents.slice(3, 6).map((agent) => (
                                <AgentAvatar
                                    key={agent.id}
                                    agent={agent}
                                    position="left"
                                    isSpeaking={speakingAgentId === agent.id}
                                    isSelected={targetAgent?.id === agent.id}
                                    onClick={() => handleAgentClick(agent)}
                                    discussion={discussion}
                                    latestMessage={latestAgentMessages[agent.id]}
                                    isHovered={hoveredAgentId === agent.id}
                                    onHover={setHoveredAgentId}
                                />
                            ))}
                        </div>

                        <div className="absolute top-1/2 -right-10 md:-right-12 transform -translate-y-1/2 flex flex-col gap-8 md:gap-12">
                            {agents.slice(6, 9).map((agent) => (
                                <AgentAvatar
                                    key={agent.id}
                                    agent={agent}
                                    position="right"
                                    isSpeaking={speakingAgentId === agent.id}
                                    isSelected={targetAgent?.id === agent.id}
                                    onClick={() => handleAgentClick(agent)}
                                    discussion={discussion}
                                    latestMessage={latestAgentMessages[agent.id]}
                                    isHovered={hoveredAgentId === agent.id}
                                    onHover={setHoveredAgentId}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Chat Log */}
                <div className={cn(
                    "bg-white border-l border-slate-200 flex flex-col shadow-lg z-20",
                    "hidden md:flex md:w-1/3",
                    mobileView === 'chat' ? "flex w-full" : ""
                )}>
                    <div className="p-3 md:p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex items-center gap-2 text-sm md:text-base">
                        <span>Meeting Log</span>
                        {isBusy && (
                            <span className="text-xs text-blue-500 font-normal animate-pulse">
                                {discussion.status === 'in_progress'
                                    ? `토론 진행 중 (${discussion.currentSpeakerIndex + 1}/${discussion.speakerOrder.length})`
                                    : '진행 중...'}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-slate-50/50">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10 text-sm px-4">
                                회의를 시작하려면 안건을 말씀해주세요.<br />
                                에이전트를 클릭하면 지정 질문할 수 있습니다.<br />
                                <span className="text-slate-500 font-medium">토론 모드</span>를 켜면 전원이 안건에 대해 발언합니다.
                            </div>
                        )}
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => {
                                const agent = agents.find((a) => a.id === msg.senderId);
                                const isUser = msg.senderId === 'user';
                                const isSystem = msg.senderId === 'system';

                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={cn(
                                            "flex flex-col max-w-[90%]",
                                            isUser ? "self-end items-end" :
                                                isSystem ? "self-center items-center" :
                                                    "self-start items-start"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-0.5 rounded",
                                                isUser
                                                    ? "bg-slate-800 text-white"
                                                    : isSystem
                                                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                                                        : "bg-white border border-slate-200 text-slate-600"
                                            )}>
                                                {isUser ? '회장' :
                                                    isSystem ? 'System' :
                                                        `${agent?.name} ${agent?.rank}`}
                                            </span>
                                            {msg.stance && (
                                                <StanceBadge stance={msg.stance} />
                                            )}
                                        </div>

                                        <div className={cn(
                                            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            isUser
                                                ? "bg-slate-800 text-white rounded-tr-none"
                                                : isSystem
                                                    ? "bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-start gap-2"
                                                    : msg.stance
                                                        ? cn("border rounded-tl-none", STANCE_CONFIG[msg.stance].bg, STANCE_CONFIG[msg.stance].border, STANCE_CONFIG[msg.stance].color)
                                                        : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                                        )}>
                                            {isSystem && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                                            <span>{msg.content}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        <AnimatePresence>
                            {speakingAgentId && (
                                <TypingIndicator
                                    agentName={agents.find((a) => a.id === speakingAgentId)?.name}
                                />
                            )}
                        </AnimatePresence>

                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 md:p-4 bg-white border-t border-slate-200">
                        <AnimatePresence>
                            {targetAgent && !isDiscussMode && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-2"
                                >
                                    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                        <div className={cn("w-4 h-4 rounded-full", targetAgent.avatarColor)} />
                                        <span>{targetAgent.name} {targetAgent.rank}에게 질문</span>
                                        <button
                                            onClick={() => setTargetAgent(null)}
                                            className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                                            aria-label="에이전트 선택 해제"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => {
                                    if (!isBusy) {
                                        setIsDiscussMode((prev) => !prev);
                                        setTargetAgent(null);
                                    }
                                }}
                                disabled={isBusy}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                    isDiscussMode
                                        ? "bg-violet-100 border-violet-300 text-violet-700"
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100",
                                    isBusy && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Swords className="w-3.5 h-3.5" />
                                <span>토론 모드</span>
                            </button>

                            {discussion.status === 'in_progress' && (
                                <button
                                    onClick={handleCancelDiscussion}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors"
                                >
                                    <Square className="w-3 h-3" />
                                    <span>중단</span>
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={inputPlaceholder}
                                disabled={isBusy}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none h-20 md:h-24 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isBusy}
                                className={cn(
                                    "absolute right-3 bottom-3 p-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                                    isDiscussMode
                                        ? "bg-violet-600 hover:bg-violet-500"
                                        : "bg-slate-900 hover:bg-slate-800"
                                )}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-1.5 md:mt-2 text-center">
                            Shift + Enter: 줄바꿈
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ─── Sub-Components ──────────────────────────────────────────── */

function StanceBadge({ stance }: { stance: AgentStance }) {
    const config = STANCE_CONFIG[stance];
    return (
        <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded border",
            config.bg, config.border, config.color
        )}>
            {config.label}
        </span>
    );
}

interface AgentAvatarProps {
    agent: EmployeeAgent;
    position: 'top' | 'left' | 'right';
    isSpeaking: boolean;
    isSelected: boolean;
    onClick: () => void;
    discussion: DiscussionState;
    latestMessage?: LatestMessageInfo;
    isHovered: boolean;
    onHover: (agentId: string | null) => void;
}

function AgentAvatar({
    agent, position, isSpeaking, isSelected, onClick,
    discussion, latestMessage, isHovered, onHover,
}: AgentAvatarProps) {
    const labelClass = position === 'top'
        ? 'top-full mt-2'
        : position === 'left'
            ? 'left-full ml-3'
            : 'right-full mr-3';

    const agentStance = discussion.stances[agent.id];
    const isInDiscussion = discussion.status !== 'idle';
    const hasSpoken = agentStance !== undefined;
    const isWaiting = isInDiscussion && !hasSpoken && !isSpeaking;

    const showSpeechBubble = latestMessage?.isStreaming && latestMessage.content.length > 0;

    return (
        <div
            className="relative group flex flex-col items-center justify-center"
            onClick={onClick}
            onMouseEnter={() => onHover(agent.id)}
            onMouseLeave={() => onHover(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            aria-label={`${agent.name} ${agent.rank} 선택`}
        >
            <motion.div
                animate={
                    isSpeaking
                        ? { scale: [1, 1.08, 1] }
                        : isWaiting
                            ? { opacity: [1, 0.5, 1] }
                            : { scale: 1 }
                }
                transition={
                    isSpeaking
                        ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                        : isWaiting
                            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                            : { duration: 0.2 }
                }
                className={cn(
                    "w-14 h-14 md:w-20 md:h-20 rounded-full border-4 shadow-md flex items-center justify-center transition-all cursor-pointer bg-white",
                    isSpeaking
                        ? "border-blue-400 ring-4 ring-blue-400/30"
                        : isSelected
                            ? "border-emerald-400 ring-4 ring-emerald-400/30"
                            : agentStance === 'agree'
                                ? "border-emerald-300 ring-2 ring-emerald-200/40"
                                : agentStance === 'disagree'
                                    ? "border-rose-300 ring-2 ring-rose-200/40"
                                    : agentStance === 'cautious'
                                        ? "border-amber-300 ring-2 ring-amber-200/40"
                                        : agentStance === 'neutral'
                                            ? "border-slate-300 ring-2 ring-slate-200/40"
                                            : agent.rank.includes('Chairman') || agent.rank.includes('Managing')
                                                ? 'border-slate-300 hover:border-slate-400'
                                                : 'border-slate-100 hover:border-slate-300'
                )}
            >
                <div className={cn(
                    "w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg opacity-90",
                    agent.avatarColor
                )}>
                    {agent.name.slice(0, 1)}
                </div>
            </motion.div>

            {/* Name Tag */}
            <div className={cn(
                "absolute whitespace-nowrap bg-white px-2 md:px-3 py-0.5 md:py-1 rounded-md shadow-sm border border-slate-100 flex flex-col items-center z-10",
                position === 'left' || position === 'right' ? 'top-1/2 -translate-y-1/2' : '',
                labelClass
            )}>
                <span className="text-[10px] md:text-xs font-bold text-slate-800">
                    {agent.name} {agent.rank.split(' ').pop()}
                </span>
                <span className="text-[9px] md:text-[10px] text-slate-400">{agent.role}</span>
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white z-20 shadow-md"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </motion.div>
            )}

            {/* Stance indicator */}
            <AnimatePresence>
                {agentStance && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-20 shadow-md border-2 border-white",
                            agentStance === 'agree' && "bg-emerald-500 text-white",
                            agentStance === 'disagree' && "bg-rose-500 text-white",
                            agentStance === 'neutral' && "bg-slate-400 text-white",
                            agentStance === 'cautious' && "bg-amber-500 text-white",
                        )}
                    >
                        {agentStance === 'agree' && 'O'}
                        {agentStance === 'disagree' && 'X'}
                        {agentStance === 'neutral' && '-'}
                        {agentStance === 'cautious' && '!'}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Speech Bubble */}
            <AnimatePresence>
                {showSpeechBubble && latestMessage && (
                    <SpeechBubble
                        content={latestMessage.content}
                        stance={latestMessage.stance}
                        position={position}
                        isStreaming={latestMessage.isStreaming}
                    />
                )}
            </AnimatePresence>

            {/* Profile Card on hover */}
            <AnimatePresence>
                {isHovered && !isSpeaking && !showSpeechBubble && (
                    <AgentProfileCard
                        agent={agent}
                        position={position}
                        stance={agentStance}
                        latestMessage={latestMessage?.content}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function DiscussionProgress({ discussion }: { discussion: DiscussionState }) {
    const total = discussion.speakerOrder.length;
    const current = discussion.currentSpeakerIndex + 1;
    const progress = (current / total) * 100;
    const currentAgent = agents.find((a) => a.id === discussion.speakerOrder[discussion.currentSpeakerIndex]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-violet-200 px-5 py-3 max-w-md w-[90%]"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" />
                    토론 진행 중
                </span>
                <span className="text-xs text-slate-500">{current} / {total}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                <motion.div
                    className="bg-violet-500 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>
            <div className="text-[11px] text-slate-500 truncate">
                안건: {discussion.topic}
            </div>
            {currentAgent && (
                <div className="text-[11px] text-violet-600 font-medium mt-0.5">
                    발언자: {currentAgent.name} {currentAgent.rank}
                </div>
            )}
        </motion.div>
    );
}

function TypingIndicator({ agentName }: { agentName?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col self-start items-start max-w-[90%]"
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600">
                    {agentName || '에이전트'} 응답 중
                </span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-slate-400 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
