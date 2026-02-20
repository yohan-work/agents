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
