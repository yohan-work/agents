export type Rank = 
  | 'Chairman'
  | 'Vice Chairman' 
  | 'Executive Managing Director' 
  | 'Managing Director'
  | 'Department Head' 
  | 'Deputy General Manager' 
  | 'Manager'
  | 'Assistant Manager'
  | 'Junior Staff';

export type AgentStance = 'agree' | 'disagree' | 'neutral' | 'cautious';

export interface EmployeeAgent {
  id: string;
  name: string;
  rank: Rank;
  role: string;
  personality: string;
  avatarColor: string;
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  stance?: AgentStance;
  replyTo?: string;
}

export type DiscussionStatus = 'idle' | 'in_progress' | 'completed';

export interface DiscussionState {
  status: DiscussionStatus;
  topic: string;
  currentSpeakerIndex: number;
  speakerOrder: string[];
  stances: Record<string, AgentStance>;
}

export const RANK_ORDER: Rank[] = [
  'Vice Chairman',
  'Executive Managing Director',
  'Managing Director',
  'Department Head',
  'Deputy General Manager',
  'Manager',
  'Assistant Manager',
  'Junior Staff',
];

export type DebatePhase =
  | 'idle'
  | 'select_agents'
  | 'select_options'
  | 'in_progress'
  | 'judging'
  | 'result';

export type DebateTurn = 'attacker' | 'defender';

export interface DebateRound {
  roundNumber: number;
  attackerContent: string;
  defenderContent: string;
}

export interface JudgeVerdict {
  agentId: string;
  winner: DebateTurn;
  reason: string;
}

export interface DebateArenaState {
  phase: DebatePhase;
  attacker: EmployeeAgent | null;
  defender: EmployeeAgent | null;
  topic: string;
  totalRounds: number;
  currentRound: number;
  currentTurn: DebateTurn;
  rounds: DebateRound[];
  streamingContent: string;
  verdicts: JudgeVerdict[];
  winnerId: string | null;
}
