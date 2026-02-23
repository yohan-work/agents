'use client';

import { motion } from 'framer-motion';
import { AnimalType } from '@/app/types/agent';

interface RaceAnimalProps {
    animal: AnimalType;
    color: string;
    isRunning: boolean;
    size?: number;
}

export default function RaceAnimal({ animal, color, isRunning, size = 40 }: RaceAnimalProps) {
    const scale = size / 40;

    return (
        <motion.div
            style={{ width: size, height: size * 0.7 }}
            animate={isRunning ? { y: [0, -2, 0] } : {}}
            transition={isRunning ? { duration: 0.3, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
            <svg
                viewBox="0 0 40 28"
                width={size}
                height={size * 0.7}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
            >
                {isRunning && <DustParticles />}
                <AnimalBody animal={animal} color={color} isRunning={isRunning} />
            </svg>
        </motion.div>
    );
}

function DustParticles() {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.circle
                    key={i}
                    cx={4 - i * 2}
                    cy={24 + i}
                    r={1.2 - i * 0.3}
                    fill="#D4C5A9"
                    initial={{ opacity: 0.6, x: 0 }}
                    animate={{ opacity: 0, x: -6 - i * 3, y: -(i * 2) }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </g>
    );
}

function AnimalBody({ animal, color, isRunning }: { animal: AnimalType; color: string; isRunning: boolean }) {
    switch (animal) {
        case 'horse': return <Horse color={color} isRunning={isRunning} />;
        case 'hawk': return <Hawk color={color} isRunning={isRunning} />;
        case 'bull': return <Bull color={color} isRunning={isRunning} />;
        case 'bear': return <Bear color={color} isRunning={isRunning} />;
        case 'owl': return <Owl color={color} isRunning={isRunning} />;
        case 'wolf': return <Wolf color={color} isRunning={isRunning} />;
        case 'fox': return <Fox color={color} isRunning={isRunning} />;
        case 'rabbit': return <Rabbit color={color} isRunning={isRunning} />;
        case 'cat': return <Cat color={color} isRunning={isRunning} />;
        default: return <Horse color={color} isRunning={isRunning} />;
    }
}

const legAnim = (isRunning: boolean, phase: number) =>
    isRunning
        ? { rotate: [phase, -phase, phase] }
        : { rotate: 0 };

const REPEAT_FOREVER = Infinity;

const legTransition = (delay: number) => ({
    duration: 0.25,
    repeat: REPEAT_FOREVER,
    ease: 'easeInOut' as const,
    delay,
});

/* ────── Horse ────── */
function Horse({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            {/* Body */}
            <ellipse cx="20" cy="14" rx="10" ry="6" fill={color} />
            {/* Neck */}
            <path d="M 28 10 Q 32 5 34 3" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Head */}
            <ellipse cx="35" cy="4" rx="4" ry="2.8" fill={color} />
            <circle cx="36.5" cy="3.2" r="0.8" fill="#1a1a1a" />
            {/* Ear */}
            <path d="M 34 1.5 L 33.5 -0.5 L 35 1" fill={darker} />
            {/* Mane */}
            <motion.path
                d="M 30 4 Q 28 2 29 7 Q 27 5 28 9"
                stroke={darker}
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                animate={isRunning ? { d: ["M 30 4 Q 28 2 29 7 Q 27 5 28 9", "M 30 4 Q 26 1 29 7 Q 25 4 28 9", "M 30 4 Q 28 2 29 7 Q 27 5 28 9"] } : {}}
                transition={isRunning ? { duration: 0.3, repeat: Infinity } : {}}
            />
            {/* Tail */}
            <motion.path
                d="M 10 12 Q 6 10 5 14"
                stroke={darker}
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={isRunning ? { d: ["M 10 12 Q 6 10 5 14", "M 10 12 Q 4 8 3 12", "M 10 12 Q 6 10 5 14"] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}}
            />
            {/* Front legs */}
            <motion.line x1="25" y1="19" x2="26" y2="27" stroke={darker} strokeWidth="2" strokeLinecap="round"
                animate={legAnim(isRunning, 25)} transition={legTransition(0)}
                style={{ transformOrigin: '25px 19px' }} />
            <motion.line x1="22" y1="19" x2="23" y2="27" stroke={darker} strokeWidth="2" strokeLinecap="round"
                animate={legAnim(isRunning, -25)} transition={legTransition(0)}
                style={{ transformOrigin: '22px 19px' }} />
            {/* Back legs */}
            <motion.line x1="17" y1="19" x2="16" y2="27" stroke={darker} strokeWidth="2" strokeLinecap="round"
                animate={legAnim(isRunning, -25)} transition={legTransition(0.12)}
                style={{ transformOrigin: '17px 19px' }} />
            <motion.line x1="14" y1="19" x2="13" y2="27" stroke={darker} strokeWidth="2" strokeLinecap="round"
                animate={legAnim(isRunning, 25)} transition={legTransition(0.12)}
                style={{ transformOrigin: '14px 19px' }} />
        </g>
    );
}

/* ────── Hawk ────── */
function Hawk({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            {/* Body */}
            <ellipse cx="20" cy="14" rx="8" ry="4.5" fill={color} />
            {/* Head */}
            <circle cx="30" cy="11" r="3.5" fill={color} />
            <circle cx="31.5" cy="10.2" r="0.8" fill="#1a1a1a" />
            {/* Beak */}
            <path d="M 33 11 L 37 11.5 L 33 12.5" fill="#E8A317" />
            {/* Wings */}
            <motion.path
                d="M 16 10 Q 10 4 6 6 Q 10 8 14 12"
                fill={darker}
                animate={isRunning ? { d: ["M 16 10 Q 10 4 6 6 Q 10 8 14 12", "M 16 10 Q 10 0 4 2 Q 10 6 14 12", "M 16 10 Q 10 4 6 6 Q 10 8 14 12"] } : {}}
                transition={isRunning ? { duration: 0.35, repeat: Infinity } : {}}
            />
            <motion.path
                d="M 22 10 Q 18 3 14 5 Q 18 7 20 12"
                fill={darken(color, 10)}
                animate={isRunning ? { d: ["M 22 10 Q 18 3 14 5 Q 18 7 20 12", "M 22 10 Q 18 -1 12 1 Q 18 5 20 12", "M 22 10 Q 18 3 14 5 Q 18 7 20 12"] } : {}}
                transition={isRunning ? { duration: 0.35, repeat: Infinity, delay: 0.05 } : {}}
            />
            {/* Tail feathers */}
            <path d="M 12 14 Q 7 12 5 15 Q 8 14 12 16" fill={darker} />
            {/* Feet (talons) */}
            <motion.g animate={isRunning ? { y: [0, -1, 0] } : {}} transition={isRunning ? { duration: 0.35, repeat: Infinity } : {}}>
                <line x1="18" y1="18" x2="17" y2="22" stroke={darker} strokeWidth="1" strokeLinecap="round" />
                <line x1="22" y1="18" x2="23" y2="22" stroke={darker} strokeWidth="1" strokeLinecap="round" />
                <path d="M 15 22 L 17 22 L 19 22" stroke="#E8A317" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                <path d="M 21 22 L 23 22 L 25 22" stroke="#E8A317" strokeWidth="0.8" fill="none" strokeLinecap="round" />
            </motion.g>
        </g>
    );
}

/* ────── Bull ────── */
function Bull({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            {/* Body - big & sturdy */}
            <ellipse cx="19" cy="14" rx="11" ry="7" fill={color} />
            {/* Head */}
            <circle cx="31" cy="11" r="4.5" fill={color} />
            {/* Horns */}
            <path d="M 29 7 Q 27 3 25 2" stroke="#E8D5B7" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 33 7 Q 35 3 37 2" stroke="#E8D5B7" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="33" cy="10" r="0.9" fill="#1a1a1a" />
            {/* Nose ring */}
            <circle cx="34" cy="13.5" r="1.2" stroke="#C0C0C0" strokeWidth="0.6" fill="none" />
            {/* Snout */}
            <ellipse cx="34" cy="13" rx="2" ry="1.5" fill={darken(color, 10)} />
            {/* Tail */}
            <motion.path
                d="M 8 12 Q 4 10 3 13 L 2 14"
                stroke={darker}
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
                animate={isRunning ? { d: ["M 8 12 Q 4 10 3 13 L 2 14", "M 8 12 Q 3 8 2 11 L 1 13", "M 8 12 Q 4 10 3 13 L 2 14"] } : {}}
                transition={isRunning ? { duration: 0.5, repeat: Infinity } : {}}
            />
            {/* Legs - thick */}
            <motion.line x1="25" y1="20" x2="26" y2="27" stroke={darker} strokeWidth="2.5" strokeLinecap="round"
                animate={legAnim(isRunning, 18)} transition={legTransition(0)}
                style={{ transformOrigin: '25px 20px' }} />
            <motion.line x1="22" y1="20" x2="22" y2="27" stroke={darker} strokeWidth="2.5" strokeLinecap="round"
                animate={legAnim(isRunning, -18)} transition={legTransition(0)}
                style={{ transformOrigin: '22px 20px' }} />
            <motion.line x1="16" y1="20" x2="15" y2="27" stroke={darker} strokeWidth="2.5" strokeLinecap="round"
                animate={legAnim(isRunning, -18)} transition={legTransition(0.15)}
                style={{ transformOrigin: '16px 20px' }} />
            <motion.line x1="13" y1="20" x2="12" y2="27" stroke={darker} strokeWidth="2.5" strokeLinecap="round"
                animate={legAnim(isRunning, 18)} transition={legTransition(0.15)}
                style={{ transformOrigin: '13px 20px' }} />
        </g>
    );
}

/* ────── Bear ────── */
function Bear({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            <ellipse cx="19" cy="14" rx="11" ry="7.5" fill={color} />
            {/* Head */}
            <circle cx="30" cy="9" r="5" fill={color} />
            <circle cx="27" cy="5.5" r="2" fill={darker} />
            <circle cx="33" cy="5.5" r="2" fill={darker} />
            <circle cx="32" cy="8.5" r="0.8" fill="#1a1a1a" />
            <ellipse cx="31.5" cy="11" rx="2" ry="1.2" fill={darker} />
            <circle cx="31.5" cy="10.8" r="0.5" fill="#1a1a1a" />
            {/* Tail - small round */}
            <circle cx="8" cy="11" r="1.5" fill={darker} />
            {/* Legs */}
            <motion.rect x="24" y="20" width="3" height="7" rx="1.2" fill={darker}
                animate={isRunning ? { rotate: [12, -12, 12] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.35, repeat: Infinity } : {}}
                style={{ transformOrigin: '25.5px 20px' }} />
            <motion.rect x="20" y="20" width="3" height="7" rx="1.2" fill={darker}
                animate={isRunning ? { rotate: [-12, 12, -12] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.35, repeat: Infinity } : {}}
                style={{ transformOrigin: '21.5px 20px' }} />
            <motion.rect x="14" y="20" width="3" height="7" rx="1.2" fill={darker}
                animate={isRunning ? { rotate: [-12, 12, -12] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.35, repeat: Infinity, delay: 0.12 } : {}}
                style={{ transformOrigin: '15.5px 20px' }} />
            <motion.rect x="10" y="20" width="3" height="7" rx="1.2" fill={darker}
                animate={isRunning ? { rotate: [12, -12, 12] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.35, repeat: Infinity, delay: 0.12 } : {}}
                style={{ transformOrigin: '11.5px 20px' }} />
        </g>
    );
}

/* ────── Owl ────── */
function Owl({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            {/* Body */}
            <ellipse cx="20" cy="16" rx="7" ry="8" fill={color} />
            {/* Belly */}
            <ellipse cx="20" cy="18" rx="4.5" ry="5" fill={darken(color, -30)} />
            {/* Head */}
            <circle cx="20" cy="7" r="6" fill={color} />
            {/* Ear tufts */}
            <path d="M 15 2 L 14 -2 L 17 2" fill={darker} />
            <path d="M 25 2 L 26 -2 L 23 2" fill={darker} />
            {/* Eyes - big round */}
            <circle cx="17.5" cy="6.5" r="2.5" fill="white" />
            <circle cx="22.5" cy="6.5" r="2.5" fill="white" />
            <motion.circle cx="17.5" cy="6.5" r="1.5" fill="#1a1a1a"
                animate={isRunning ? { cy: [6.5, 6, 6.5] } : {}}
                transition={isRunning ? { duration: 0.5, repeat: Infinity } : {}} />
            <motion.circle cx="22.5" cy="6.5" r="1.5" fill="#1a1a1a"
                animate={isRunning ? { cy: [6.5, 6, 6.5] } : {}}
                transition={isRunning ? { duration: 0.5, repeat: Infinity } : {}} />
            {/* Beak */}
            <path d="M 19 9 L 20 11 L 21 9" fill="#E8A317" />
            {/* Wings */}
            <motion.path
                d="M 13 12 Q 6 10 5 16 Q 8 14 13 18"
                fill={darker}
                animate={isRunning ? { d: ["M 13 12 Q 6 10 5 16 Q 8 14 13 18", "M 13 12 Q 4 6 3 12 Q 6 10 13 14", "M 13 12 Q 6 10 5 16 Q 8 14 13 18"] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}}
            />
            <motion.path
                d="M 27 12 Q 34 10 35 16 Q 32 14 27 18"
                fill={darker}
                animate={isRunning ? { d: ["M 27 12 Q 34 10 35 16 Q 32 14 27 18", "M 27 12 Q 36 6 37 12 Q 34 10 27 14", "M 27 12 Q 34 10 35 16 Q 32 14 27 18"] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}}
            />
            {/* Feet */}
            <line x1="18" y1="24" x2="17" y2="27" stroke="#E8A317" strokeWidth="1" strokeLinecap="round" />
            <line x1="22" y1="24" x2="23" y2="27" stroke="#E8A317" strokeWidth="1" strokeLinecap="round" />
        </g>
    );
}

/* ────── Wolf ────── */
function Wolf({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            <ellipse cx="19" cy="13" rx="9" ry="5.5" fill={color} />
            {/* Neck */}
            <path d="M 26 9 Q 30 5 33 4" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Head - pointy */}
            <path d="M 30 2 Q 34 1 38 4 Q 36 6 32 7 Q 30 5 30 2" fill={color} />
            {/* Ears */}
            <path d="M 31 1 L 30 -2 L 33 1" fill={darker} />
            <path d="M 35 1 L 36 -2 L 37 2" fill={darker} />
            {/* Eye */}
            <circle cx="34.5" cy="3.5" r="0.8" fill="#E8A317" />
            <circle cx="34.5" cy="3.5" r="0.4" fill="#1a1a1a" />
            {/* Snout */}
            <path d="M 36 4 L 39 4.5 L 36 5.5" fill={darker} />
            <circle cx="38.5" cy="4.5" r="0.5" fill="#1a1a1a" />
            {/* Tail - bushy */}
            <motion.path
                d="M 10 11 Q 5 7 3 10 Q 5 12 4 14"
                fill={darker}
                animate={isRunning ? { d: ["M 10 11 Q 5 7 3 10 Q 5 12 4 14", "M 10 11 Q 3 5 1 8 Q 3 10 2 13", "M 10 11 Q 5 7 3 10 Q 5 12 4 14"] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}}
            />
            {/* Legs */}
            <motion.line x1="24" y1="17" x2="25" y2="27" stroke={darker} strokeWidth="1.8" strokeLinecap="round"
                animate={legAnim(isRunning, 28)} transition={legTransition(0)}
                style={{ transformOrigin: '24px 17px' }} />
            <motion.line x1="21" y1="17" x2="22" y2="27" stroke={darker} strokeWidth="1.8" strokeLinecap="round"
                animate={legAnim(isRunning, -28)} transition={legTransition(0)}
                style={{ transformOrigin: '21px 17px' }} />
            <motion.line x1="16" y1="17" x2="15" y2="27" stroke={darker} strokeWidth="1.8" strokeLinecap="round"
                animate={legAnim(isRunning, -28)} transition={legTransition(0.1)}
                style={{ transformOrigin: '16px 17px' }} />
            <motion.line x1="13" y1="17" x2="12" y2="27" stroke={darker} strokeWidth="1.8" strokeLinecap="round"
                animate={legAnim(isRunning, 28)} transition={legTransition(0.1)}
                style={{ transformOrigin: '13px 17px' }} />
        </g>
    );
}

/* ────── Fox ────── */
function Fox({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            <ellipse cx="20" cy="14" rx="8" ry="5" fill={color} />
            {/* Neck */}
            <path d="M 26 10 Q 30 6 32 4" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            {/* White chest */}
            <ellipse cx="25" cy="16" rx="3" ry="3.5" fill="#FFF5E6" />
            {/* Head */}
            <path d="M 29 2 Q 33 1 37 4 Q 35 6 31 6 Q 29 4 29 2" fill={color} />
            {/* Ears - big */}
            <path d="M 30 1 L 29 -2 L 32 1" fill={color} />
            <path d="M 30 0.5 L 29.5 -1 L 31.5 0.5" fill="#FFB088" />
            <path d="M 34 1 L 35 -2 L 36 2" fill={color} />
            <path d="M 34 0.5 L 34.5 -1 L 35.5 1" fill="#FFB088" />
            {/* Eye */}
            <circle cx="33" cy="3.2" r="0.7" fill="#1a1a1a" />
            {/* Nose */}
            <circle cx="36.5" cy="4" r="0.6" fill="#1a1a1a" />
            {/* Big fluffy tail */}
            <motion.path
                d="M 12 12 Q 6 6 3 9 Q 4 13 6 15 Q 8 14 12 16"
                fill={color}
                animate={isRunning ? { d: ["M 12 12 Q 6 6 3 9 Q 4 13 6 15 Q 8 14 12 16", "M 12 12 Q 4 4 1 7 Q 2 11 4 14 Q 6 13 12 15", "M 12 12 Q 6 6 3 9 Q 4 13 6 15 Q 8 14 12 16"] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}}
            />
            {/* White tail tip */}
            <motion.circle cx="4" cy="10" r="2" fill="#FFF5E6"
                animate={isRunning ? { cx: [4, 2, 4], cy: [10, 8, 10] } : {}}
                transition={isRunning ? { duration: 0.4, repeat: Infinity } : {}} />
            {/* Legs - thin */}
            <motion.line x1="24" y1="18" x2="25" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, 30)} transition={legTransition(0)}
                style={{ transformOrigin: '24px 18px' }} />
            <motion.line x1="21" y1="18" x2="22" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, -30)} transition={legTransition(0)}
                style={{ transformOrigin: '21px 18px' }} />
            <motion.line x1="16" y1="18" x2="15" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, -30)} transition={legTransition(0.1)}
                style={{ transformOrigin: '16px 18px' }} />
            <motion.line x1="13" y1="18" x2="12" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, 30)} transition={legTransition(0.1)}
                style={{ transformOrigin: '13px 18px' }} />
        </g>
    );
}

/* ────── Rabbit ────── */
function Rabbit({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 15);
    return (
        <g>
            <motion.g
                animate={isRunning ? { y: [0, -4, 0] } : {}}
                transition={isRunning ? { duration: 0.3, repeat: Infinity, ease: 'easeOut' } : {}}
            >
                {/* Body */}
                <ellipse cx="18" cy="15" rx="8" ry="5.5" fill={color} />
                {/* Head */}
                <circle cx="28" cy="11" r="4" fill={color} />
                {/* Long ears */}
                <motion.path d="M 26 7 Q 25 -1 24 -3" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    animate={isRunning ? { d: ["M 26 7 Q 25 -1 24 -3", "M 26 7 Q 24 0 22 -2", "M 26 7 Q 25 -1 24 -3"] } : {}}
                    transition={isRunning ? { duration: 0.3, repeat: Infinity } : {}} />
                <motion.path d="M 29 7 Q 30 -1 31 -3" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"
                    animate={isRunning ? { d: ["M 29 7 Q 30 -1 31 -3", "M 29 7 Q 31 0 33 -2", "M 29 7 Q 30 -1 31 -3"] } : {}}
                    transition={isRunning ? { duration: 0.3, repeat: Infinity, delay: 0.05 } : {}} />
                {/* Inner ear */}
                <path d="M 26 6 Q 25 1 24.5 -1" stroke="#FFB5B5" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M 29 6 Q 30 1 30.5 -1" stroke="#FFB5B5" strokeWidth="1" fill="none" strokeLinecap="round" />
                {/* Eye */}
                <circle cx="30" cy="10.5" r="1.2" fill="#C0392B" />
                <circle cx="30.3" cy="10.2" r="0.4" fill="white" />
                {/* Nose */}
                <path d="M 31.5 12 L 32.5 12.5 L 31.5 13" fill="#FFB5B5" />
                {/* Fluffy tail */}
                <circle cx="10" cy="13" r="2.5" fill="white" />
            </motion.g>
            {/* Legs */}
            <motion.line x1="22" y1="19" x2="24" y2="27" stroke={darker} strokeWidth="2" strokeLinecap="round"
                animate={isRunning ? { rotate: [20, -30, 20] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.3, repeat: Infinity } : {}}
                style={{ transformOrigin: '22px 19px' }} />
            <motion.line x1="14" y1="19" x2="12" y2="27" stroke={darker} strokeWidth="2.5" strokeLinecap="round"
                animate={isRunning ? { rotate: [-20, 30, -20] } : { rotate: 0 }}
                transition={isRunning ? { duration: 0.3, repeat: Infinity } : {}}
                style={{ transformOrigin: '14px 19px' }} />
        </g>
    );
}

/* ────── Cat ────── */
function Cat({ color, isRunning }: { color: string; isRunning: boolean }) {
    const darker = darken(color, 20);
    return (
        <g>
            <ellipse cx="19" cy="14" rx="8" ry="5" fill={color} />
            {/* Neck */}
            <path d="M 26 10 Q 29 7 31 5" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Head */}
            <circle cx="32" cy="5" r="4" fill={color} />
            {/* Ears - triangular */}
            <path d="M 29 2 L 28 -2 L 31 1" fill={color} />
            <path d="M 29.5 1.5 L 29 -0.5 L 30.5 1" fill="#FFB088" />
            <path d="M 35 2 L 36 -2 L 33 1" fill={color} />
            <path d="M 34.5 1.5 L 35 -0.5 L 33.5 1" fill="#FFB088" />
            {/* Eyes */}
            <ellipse cx="30.5" cy="4.5" rx="1" ry="1.2" fill="#4ADE80" />
            <ellipse cx="30.5" cy="4.5" rx="0.4" ry="1" fill="#1a1a1a" />
            <ellipse cx="33.5" cy="4.5" rx="1" ry="1.2" fill="#4ADE80" />
            <ellipse cx="33.5" cy="4.5" rx="0.4" ry="1" fill="#1a1a1a" />
            {/* Nose */}
            <path d="M 31.5 6.2 L 32 6.8 L 32.5 6.2" fill="#FFB5B5" />
            {/* Whiskers */}
            <line x1="28" y1="6.5" x2="24" y2="5.5" stroke="#9CA3AF" strokeWidth="0.3" />
            <line x1="28" y1="7" x2="24" y2="7" stroke="#9CA3AF" strokeWidth="0.3" />
            <line x1="36" y1="6.5" x2="39" y2="5.5" stroke="#9CA3AF" strokeWidth="0.3" />
            <line x1="36" y1="7" x2="39" y2="7" stroke="#9CA3AF" strokeWidth="0.3" />
            {/* Long tail */}
            <motion.path
                d="M 11 12 Q 5 8 3 5 Q 2 3 4 2"
                stroke={color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                animate={isRunning ? { d: ["M 11 12 Q 5 8 3 5 Q 2 3 4 2", "M 11 12 Q 4 6 2 4 Q 1 1 3 0", "M 11 12 Q 5 8 3 5 Q 2 3 4 2"] } : {}}
                transition={isRunning ? { duration: 0.5, repeat: Infinity } : {}}
            />
            {/* Legs - elegant */}
            <motion.line x1="23" y1="18" x2="24" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, 28)} transition={legTransition(0)}
                style={{ transformOrigin: '23px 18px' }} />
            <motion.line x1="20" y1="18" x2="21" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, -28)} transition={legTransition(0)}
                style={{ transformOrigin: '20px 18px' }} />
            <motion.line x1="16" y1="18" x2="15" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, -28)} transition={legTransition(0.1)}
                style={{ transformOrigin: '16px 18px' }} />
            <motion.line x1="13" y1="18" x2="12" y2="27" stroke={darker} strokeWidth="1.5" strokeLinecap="round"
                animate={legAnim(isRunning, 28)} transition={legTransition(0.1)}
                style={{ transformOrigin: '13px 18px' }} />
        </g>
    );
}

/* ────── Utils ────── */
function darken(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) - amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) - amount));
    const b = Math.max(0, Math.min(255, (num & 0xFF) - amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
