'use client';

import { motion } from 'framer-motion';
import { CharacterTraits, CharacterState, FaceShape, DefaultExpression } from '@/app/types/agent';
import { CHARACTER_TRAITS } from '@/app/data/characterTraits';

interface AgentCharacterProps {
    agentId: string;
    state?: CharacterState;
    size?: number;
    className?: string;
}

export default function AgentCharacter({
    agentId,
    state = 'idle',
    size = 48,
    className = '',
}: AgentCharacterProps) {
    const traits = CHARACTER_TRAITS[agentId];
    if (!traits) return null;

    const scale = size / 48;

    return (
        <motion.div
            className={className}
            style={{ width: size, height: size }}
            animate={getContainerAnimation(state)}
            transition={getContainerTransition(state)}
        >
            <svg
                viewBox="0 0 48 48"
                width={size}
                height={size}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: `scale(${Math.min(scale, 1.2)})`, transformOrigin: 'center' }}
            >
                <Body traits={traits} />
                <Head traits={traits} state={state} />
                <Hair traits={traits} />
                <Face traits={traits} state={state} />
                <Accessories traits={traits} size={size} />
            </svg>
        </motion.div>
    );
}

function getContainerAnimation(state: CharacterState) {
    switch (state) {
        case 'speaking':
            return { y: [0, -2, 0] };
        case 'agree':
            return { y: [0, 2, -1, 0] };
        case 'disagree':
            return { rotate: [0, -3, 3, -3, 0] };
        case 'running':
            return { x: [0, 1, -1, 0], y: [0, -3, 0] };
        case 'cautious':
            return { y: [0, 1, 0] };
        default:
            return { y: [0, -0.5, 0] };
    }
}

function getContainerTransition(state: CharacterState) {
    switch (state) {
        case 'speaking':
            return { duration: 0.6, repeat: Infinity, ease: 'easeInOut' as const };
        case 'agree':
            return { duration: 0.5, repeat: 2, ease: 'easeInOut' as const };
        case 'disagree':
            return { duration: 0.4, repeat: 2, ease: 'easeInOut' as const };
        case 'running':
            return { duration: 0.3, repeat: Infinity, ease: 'easeInOut' as const };
        case 'cautious':
            return { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const };
        default:
            return { duration: 3, repeat: Infinity, ease: 'easeInOut' as const };
    }
}

/* --- SVG Sub-components --- */

function Body({ traits }: { traits: CharacterTraits }) {
    return (
        <>
            {/* Torso */}
            <rect x="14" y="32" width="20" height="16" rx="4" fill={traits.bodyColor} />
            {/* Collar / shirt */}
            <path
                d="M 20 32 L 24 37 L 28 32"
                stroke={traits.accentColor}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </>
    );
}

function Head({ traits, state }: { traits: CharacterTraits; state: CharacterState }) {
    const headShape = getHeadPath(traits.faceShape);
    return (
        <motion.g
            animate={state === 'speaking' ? { scaleY: [1, 1.01, 1] } : {}}
            transition={state === 'speaking' ? { duration: 0.4, repeat: Infinity } : {}}
        >
            <path d={headShape} fill={traits.skinTone} />
            {/* Ears */}
            <ellipse cx="10" cy="22" rx="2.5" ry="3" fill={traits.skinTone} />
            <ellipse cx="38" cy="22" rx="2.5" ry="3" fill={traits.skinTone} />
            {/* Neck */}
            <rect x="21" y="29" width="6" height="4" rx="1" fill={traits.skinTone} />
        </motion.g>
    );
}

function getHeadPath(shape: FaceShape): string {
    switch (shape) {
        case 'square':
            return 'M 13 14 Q 13 10 18 8 Q 24 5 30 8 Q 35 10 35 14 L 35 26 Q 35 31 30 31 L 18 31 Q 13 31 13 26 Z';
        case 'round':
            return 'M 12 20 Q 12 8 24 8 Q 36 8 36 20 L 36 24 Q 36 32 24 32 Q 12 32 12 24 Z';
        case 'oval':
        default:
            return 'M 13 18 Q 13 9 24 8 Q 35 9 35 18 L 35 25 Q 35 32 24 32 Q 13 32 13 25 Z';
    }
}

function Hair({ traits }: { traits: CharacterTraits }) {
    const hairPaths = getHairPaths(traits.hairStyle);
    return (
        <g>
            {hairPaths.map((d, i) => (
                <path key={i} d={d} fill={traits.hairColor} />
            ))}
        </g>
    );
}

function getHairPaths(style: string): string[] {
    switch (style) {
        case 'slickedBack':
            return [
                'M 12 18 Q 11 8 24 5 Q 37 8 36 18 L 36 14 Q 36 7 24 4 Q 12 7 12 14 Z',
                'M 12 14 Q 12 10 15 8 L 12 12 Z',
                'M 36 14 Q 36 10 33 8 L 36 12 Z',
            ];
        case 'shortSharp':
            return [
                'M 13 18 Q 12 9 24 6 Q 36 9 35 18 L 35 13 Q 35 7 24 5 Q 13 7 13 13 Z',
                'M 16 8 L 14 5 L 18 7 Z',
                'M 32 8 L 34 5 L 30 7 Z',
            ];
        case 'sidePart':
            return [
                'M 13 18 Q 12 8 24 6 Q 36 8 35 16 L 35 12 Q 35 7 24 5 Q 13 7 13 12 Z',
                'M 14 12 L 11 9 Q 13 8 15 9 Z',
            ];
        case 'messyShort':
            return [
                'M 13 17 Q 12 8 24 6 Q 36 8 35 17 L 35 12 Q 35 7 24 5 Q 13 7 13 12 Z',
                'M 16 7 L 14 3 L 19 6 Z',
                'M 28 6 L 30 3 L 32 7 Z',
                'M 22 5 L 23 2 L 25 5 Z',
            ];
        case 'cleanCut':
            return [
                'M 13 17 Q 12 8 24 6 Q 36 8 35 17 L 35 12 Q 35 7 24 5 Q 13 7 13 12 Z',
            ];
        case 'crewCut':
            return [
                'M 14 16 Q 13 9 24 7 Q 35 9 34 16 L 34 12 Q 34 8 24 6 Q 14 8 14 12 Z',
            ];
        case 'twoBlock':
            return [
                'M 13 18 Q 12 8 24 5 Q 36 8 35 18 L 35 12 Q 35 6 24 4 Q 13 6 13 12 Z',
                'M 14 15 Q 13 13 13 10 L 11 14 Q 12 16 14 16 Z',
                'M 34 15 Q 35 13 35 10 L 37 14 Q 36 16 34 16 Z',
                'M 18 6 Q 20 3 26 3 Q 30 3 32 6 L 30 5 Q 26 3.5 20 5 Z',
            ];
        case 'neatShort':
            return [
                'M 13 17 Q 12 9 24 6 Q 36 9 35 17 L 35 12 Q 35 7 24 5 Q 13 7 13 12 Z',
            ];
        case 'trendy':
            return [
                'M 13 18 Q 12 8 24 5 Q 36 8 35 18 L 35 12 Q 35 6 24 4 Q 13 6 13 12 Z',
                'M 16 8 L 12 5 Q 14 4 17 6 Z',
                'M 20 5 Q 22 2 26 2 Q 28 2 29 5 L 27 4 Q 24 3 21 4 Z',
            ];
        default:
            return [
                'M 13 17 Q 12 9 24 6 Q 36 9 35 17 L 35 12 Q 35 7 24 5 Q 13 7 13 12 Z',
            ];
    }
}

function Face({ traits, state }: { traits: CharacterTraits; state: CharacterState }) {
    const { eyes, eyebrows, mouth } = getFaceFeatures(traits.expression, state);

    return (
        <g>
            {/* Eyebrows */}
            {eyebrows}
            {/* Eyes */}
            {eyes}
            {/* Mouth */}
            <motion.g
                animate={state === 'speaking' ? { scaleY: [1, 0.7, 1.2, 1] } : {}}
                transition={state === 'speaking' ? { duration: 0.5, repeat: Infinity } : {}}
                style={{ transformOrigin: '24px 27px' }}
            >
                {mouth}
            </motion.g>
        </g>
    );
}

function getFaceFeatures(expression: DefaultExpression, state: CharacterState) {
    const isHappy = state === 'agree';
    const isSad = state === 'disagree';

    let eyes: React.ReactNode;
    let eyebrows: React.ReactNode;
    let mouth: React.ReactNode;

    switch (expression) {
        case 'stern':
            eyes = (
                <>
                    <ellipse cx="19" cy="21" rx="2" ry="2.2" fill="#1F2937" />
                    <ellipse cx="29" cy="21" rx="2" ry="2.2" fill="#1F2937" />
                    <circle cx="19.5" cy="20.5" r="0.7" fill="white" />
                    <circle cx="29.5" cy="20.5" r="0.7" fill="white" />
                </>
            );
            eyebrows = (
                <>
                    <line x1="16" y1="16.5" x2="22" y2="17" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" />
                    <line x1="26" y1="17" x2="32" y2="16.5" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" />
                </>
            );
            mouth = isHappy
                ? <path d="M 20 27 Q 24 29 28 27" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                : <line x1="20" y1="27.5" x2="28" y2="27.5" stroke="#9E4244" strokeWidth="1" strokeLinecap="round" />;
            break;

        case 'sharp':
            eyes = (
                <>
                    <path d="M 16 21 Q 19 19 22 21" stroke="#1F2937" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                    <path d="M 26 21 Q 29 19 32 21" stroke="#1F2937" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                </>
            );
            eyebrows = (
                <>
                    <line x1="15" y1="17" x2="22" y2="16" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="26" y1="16" x2="33" y2="17" stroke="#1F2937" strokeWidth="1.4" strokeLinecap="round" />
                </>
            );
            mouth = isSad
                ? <path d="M 21 28 Q 24 26 27 28" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                : <path d="M 21 27 L 27 27" stroke="#9E4244" strokeWidth="1" strokeLinecap="round" />;
            break;

        case 'tired':
            eyes = (
                <>
                    <path d="M 16 21.5 Q 19 20 22 21.5" stroke="#6B7280" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M 26 21.5 Q 29 20 32 21.5" stroke="#6B7280" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </>
            );
            eyebrows = (
                <>
                    <line x1="16" y1="17.5" x2="22" y2="17" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
                    <line x1="26" y1="17" x2="32" y2="17.5" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round" />
                </>
            );
            mouth = isHappy
                ? <path d="M 20 27 Q 24 29 28 27" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                : <path d="M 21 27.5 Q 24 27 27 27.5" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />;
            break;

        case 'bright':
            eyes = (
                <>
                    <ellipse cx="19" cy="21" rx="2.5" ry="2.8" fill="#1F2937" />
                    <ellipse cx="29" cy="21" rx="2.5" ry="2.8" fill="#1F2937" />
                    <circle cx="20" cy="20" r="1" fill="white" />
                    <circle cx="30" cy="20" r="1" fill="white" />
                    <circle cx="18.5" cy="21.5" r="0.5" fill="white" />
                    <circle cx="28.5" cy="21.5" r="0.5" fill="white" />
                </>
            );
            eyebrows = (
                <>
                    <path d="M 15 16 Q 19 14.5 22 16" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" />
                    <path d="M 26 16 Q 29 14.5 33 16" stroke="#374151" strokeWidth="1" fill="none" strokeLinecap="round" />
                </>
            );
            mouth = isSad
                ? <path d="M 21 28 Q 24 26.5 27 28" stroke="#E87461" strokeWidth="1" fill="none" strokeLinecap="round" />
                : <path d="M 20 26 Q 24 30 28 26" stroke="#E87461" strokeWidth="1.2" fill="#FECACA" strokeLinecap="round" />;
            break;

        case 'calm':
            eyes = (
                <>
                    <ellipse cx="19" cy="21" rx="2" ry="2" fill="#374151" />
                    <ellipse cx="29" cy="21" rx="2" ry="2" fill="#374151" />
                    <circle cx="19.5" cy="20.5" r="0.8" fill="white" />
                    <circle cx="29.5" cy="20.5" r="0.8" fill="white" />
                </>
            );
            eyebrows = (
                <>
                    <line x1="16" y1="17" x2="22" y2="16.5" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
                    <line x1="26" y1="16.5" x2="32" y2="17" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
                </>
            );
            mouth = isHappy
                ? <path d="M 21 26.5 Q 24 29 27 26.5" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                : <path d="M 22 27 Q 24 27.5 26 27" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />;
            break;

        case 'neutral':
        default:
            eyes = (
                <>
                    <ellipse cx="19" cy="21" rx="2" ry="2.2" fill="#374151" />
                    <ellipse cx="29" cy="21" rx="2" ry="2.2" fill="#374151" />
                    <circle cx="19.5" cy="20.3" r="0.7" fill="white" />
                    <circle cx="29.5" cy="20.3" r="0.7" fill="white" />
                </>
            );
            eyebrows = (
                <>
                    <line x1="16" y1="17" x2="22" y2="16.5" stroke="#4B5563" strokeWidth="1.1" strokeLinecap="round" />
                    <line x1="26" y1="16.5" x2="32" y2="17" stroke="#4B5563" strokeWidth="1.1" strokeLinecap="round" />
                </>
            );
            mouth = isHappy
                ? <path d="M 21 26.5 Q 24 29 27 26.5" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                : isSad
                    ? <path d="M 21 28 Q 24 26 27 28" stroke="#9E4244" strokeWidth="1" fill="none" strokeLinecap="round" />
                    : <line x1="21" y1="27" x2="27" y2="27" stroke="#9E4244" strokeWidth="1" strokeLinecap="round" />;
            break;
    }

    return { eyes, eyebrows, mouth };
}

function Accessories({ traits, size }: { traits: CharacterTraits; size: number }) {
    return (
        <g>
            {traits.accessories.map((accessory) => {
                switch (accessory) {
                    case 'glasses-square':
                        return (
                            <g key={accessory}>
                                <rect x="15" y="18.5" width="8" height="6" rx="1" stroke="#4B5563" strokeWidth="0.8" fill="none" />
                                <rect x="25" y="18.5" width="8" height="6" rx="1" stroke="#4B5563" strokeWidth="0.8" fill="none" />
                                <line x1="23" y1="21" x2="25" y2="21" stroke="#4B5563" strokeWidth="0.8" />
                            </g>
                        );
                    case 'glasses-angular':
                        return (
                            <g key={accessory}>
                                <path d="M 15 19 L 22 18.5 L 23 24 L 15 24.5 Z" stroke="#374151" strokeWidth="0.8" fill="none" />
                                <path d="M 25 18.5 L 33 19 L 33 24.5 L 25 24 Z" stroke="#374151" strokeWidth="0.8" fill="none" />
                                <line x1="23" y1="21" x2="25" y2="21" stroke="#374151" strokeWidth="0.8" />
                            </g>
                        );
                    case 'glasses-round':
                        return (
                            <g key={accessory}>
                                <circle cx="19" cy="21" r="4.5" stroke="#6B7280" strokeWidth="0.8" fill="none" />
                                <circle cx="29" cy="21" r="4.5" stroke="#6B7280" strokeWidth="0.8" fill="none" />
                                <line x1="23.5" y1="21" x2="24.5" y2="21" stroke="#6B7280" strokeWidth="0.8" />
                            </g>
                        );
                    case 'tie-formal':
                        return (
                            <g key={accessory}>
                                <path d="M 23 34 L 24 40 L 25 34" fill={traits.accentColor} />
                                <rect x="22.5" y="32.5" width="3" height="2" rx="0.5" fill={traits.accentColor} />
                            </g>
                        );
                    case 'tie-conservative':
                        return (
                            <g key={accessory}>
                                <path d="M 23 34 L 24 39 L 25 34" fill={traits.accentColor} />
                                <rect x="22.8" y="32.5" width="2.4" height="1.8" rx="0.5" fill={traits.accentColor} />
                            </g>
                        );
                    case 'tie-loose':
                        return (
                            <g key={accessory}>
                                <path d="M 22.5 34 L 24 38 L 25.5 34" fill={traits.accentColor} opacity="0.8" />
                                <rect x="22" y="32.5" width="3.5" height="1.8" rx="0.5" fill={traits.accentColor} opacity="0.8" transform="rotate(3 24 33)" />
                            </g>
                        );
                    case 'tie-neat':
                        return (
                            <g key={accessory}>
                                <path d="M 23 34 L 24 39 L 25 34" fill={traits.accentColor} />
                                <rect x="22.8" y="32.5" width="2.4" height="1.8" rx="0.5" fill={traits.accentColor} />
                            </g>
                        );
                    case 'collar-open':
                        return (
                            <g key={accessory}>
                                <path d="M 19 32 L 22 33 L 20 36" stroke={traits.accentColor} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                                <path d="M 29 32 L 26 33 L 28 36" stroke={traits.accentColor} strokeWidth="0.8" fill="none" strokeLinecap="round" />
                            </g>
                        );
                    case 'earbuds':
                        return (
                            <g key={accessory}>
                                <circle cx="10" cy="22" r="1.8" fill="#374151" />
                                <circle cx="10" cy="22" r="1" fill="#6B7280" />
                            </g>
                        );
                    case 'wireless-earbuds':
                        return (
                            <g key={accessory}>
                                <circle cx="38" cy="22" r="1.8" fill="#E5E7EB" />
                                <circle cx="38" cy="22" r="0.8" fill="#D1D5DB" />
                            </g>
                        );
                    default:
                        return null;
                }
            })}
        </g>
    );
}

export function AgentCharacterMini({
    agentId,
    state = 'idle',
    size = 28,
    className = '',
}: AgentCharacterProps) {
    const traits = CHARACTER_TRAITS[agentId];
    if (!traits) return null;

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${traits.bodyColor}, ${traits.accentColor})`,
            }}
        >
            <svg
                viewBox="6 4 36 32"
                width={size}
                height={size}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <Head traits={traits} state={state} />
                <Hair traits={traits} />
                <Face traits={traits} state={state} />
                <Accessories traits={traits} size={size} />
            </svg>
        </div>
    );
}
