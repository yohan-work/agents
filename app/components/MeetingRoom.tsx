'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { agents } from '@/app/data/agents';
import { EmployeeAgent, ChatMessage } from '@/app/types/agent';
import { cn } from '@/app/lib/utils';
import { Send, User } from 'lucide-react';

export default function MeetingRoom() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);

        // Simulate AI responses
        // In a real app, this would call an API with the full context
        setTimeout(() => {
            generateMockResponses(input);
        }, 1500);
    };

    const generateMockResponses = async (userParams: string) => {
        // Select 2-3 random agents to respond
        const shuffled = [...agents].sort(() => 0.5 - Math.random());
        const speakers = shuffled.slice(0, 3);

        // We will process them sequentially or with staggered delays, 
        // but we need to fetch their responses from the API.

        for (let i = 0; i < speakers.length; i++) {
            const agent = speakers[i];

            // Wait for a bit of natural delay between speakers
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [...messages, { senderId: 'user', content: userParams }],
                        agent: agent
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'API request failed');
                }

                const data = await response.json();

                const agentMsg: ChatMessage = {
                    id: Date.now() + i.toString(),
                    senderId: agent.id,
                    content: data.content,
                    timestamp: Date.now(),
                };

                setMessages((prev) => [...prev, agentMsg]);
            } catch (error: any) {
                console.error('Failed to get response for agent', agent.name, error);

                // Show error in chat for debugging
                const errorMsg: ChatMessage = {
                    id: Date.now() + i.toString(),
                    senderId: 'system', // Use a special ID for errors
                    content: `[System Error] ${agent.name}: ${error.message || '응답 실패'}`,
                    timestamp: Date.now(),
                };
                setMessages((prev) => [...prev, errorMsg]);
            }
        }
        setIsProcessing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
            {/* Header */}
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Boardroom AI</h1>
                <div className="text-sm text-slate-500">2026 Strategic Meeting</div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Left Panel: Participants (Visual Board) */}
                <div className="w-2/3 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">

                    {/* Table */}
                    <div className="w-[80%] h-[60%] bg-white rounded-[40px] shadow-xl border border-slate-200 relative flex items-center justify-center">
                        <div className="text-slate-300 font-bold text-4xl opacity-20 tracking-widest uppercase">
                            Company
                        </div>

                        {/* Chairman (User) Position - Bottom */}
                        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white shadow-lg flex items-center justify-center z-10">
                                <User className="text-white w-10 h-10" />
                            </div>
                            <div className="mt-2 bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                회장 (나)
                            </div>
                        </div>

                        {/* Agents Layout
                We place them around the top and sides.
                Total 9 agents.
                Top: 3
                Left: 3
                Right: 3
            */}

                        {/* Top Row (Executives) */}
                        <div className="absolute -top-12 left-0 w-full flex justify-center gap-16">
                            {agents.slice(0, 3).map((agent) => (
                                <AgentAvatar key={agent.id} agent={agent} position="top" />
                            ))}
                        </div>

                        {/* Left Column (Middle Management) */}
                        <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 flex flex-col gap-12">
                            {agents.slice(3, 6).map((agent) => (
                                <AgentAvatar key={agent.id} agent={agent} position="left" />
                            ))}
                        </div>

                        {/* Right Column (Juniors) */}
                        <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 flex flex-col gap-12">
                            {agents.slice(6, 9).map((agent) => (
                                <AgentAvatar key={agent.id} agent={agent} position="right" />
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Panel: Minutes / Chat Log */}
                <div className="w-1/3 bg-white border-l border-slate-200 flex flex-col shadow-lg z-20">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 flex items-center gap-2">
                        <span>📝 Meeting Log</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {messages.length === 0 && (
                            <div className="text-center text-slate-400 mt-10 text-sm">
                                회의를 시작하려면 안건을 말씀해주세요.<br />
                                "자, 회의 시작합시다."
                            </div>
                        )}
                        {messages.map((msg) => {
                            const agent = agents.find(a => a.id === msg.senderId);
                            const isUser = msg.senderId === 'user';

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex flex-col max-w-[90%]",
                                        isUser ? "self-end items-end" : "self-start items-start"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            "text-xs font-bold px-2 py-0.5 rounded",
                                            isUser ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600"
                                        )}>
                                            {isUser ? '회장' : `${agent?.name} ${agent?.rank}`}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                        isUser
                                            ? "bg-slate-800 text-white rounded-tr-none"
                                            : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="relative">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="안건을 제시하거나 의견을 물어보세요..."
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none h-24 text-sm"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!input.trim() || isProcessing}
                                className="absolute right-3 bottom-3 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-2 text-center">
                            Shift + Enter for new line
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function AgentAvatar({ agent, position }: { agent: EmployeeAgent, position: 'top' | 'left' | 'right' }) {
    // Determine tooltip/name tag position based on seat
    const labelClass = position === 'top'
        ? 'top-full mt-2'
        : position === 'left'
            ? 'left-full ml-3'
            : 'right-full mr-3';

    return (
        <div className="relative group flex flex-col items-center justify-center">
            <div className={cn(
                "w-20 h-20 rounded-full border-4 shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer bg-white",
                agent.rank.includes('Chairman') || agent.rank.includes('Managing') ? 'border-slate-300' : 'border-slate-100'
            )}>
                {/* Simple colored circle as avatar placeholder with Initials */}
                <div className={cn("w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg opacity-90", agent.avatarColor)}>
                    {agent.name.slice(0, 1)}
                </div>
            </div>

            {/* Name Tag */}
            <div className={cn(
                "absolute whitespace-nowrap bg-white px-3 py-1 rounded-md shadow-sm border border-slate-100 flex flex-col items-center z-10",
                position === 'left' || position === 'right' ? 'top-1/2 -translate-y-1/2' : '',
                labelClass
            )}>
                <span className="text-xs font-bold text-slate-800">{agent.name} {agent.rank.split(' ').pop()}</span>
                <span className="text-[10px] text-slate-400">{agent.role}</span>
            </div>
        </div>
    );
}
