export type Rank = 
  | 'Chairman' // User
  | 'Vice Chairman' 
  | 'Executive Managing Director' 
  | 'Managing Director'
  | 'Department Head' 
  | 'Deputy General Manager' 
  | 'Manager'
  | 'Assistant Manager'
  | 'Junior Staff';

export interface EmployeeAgent {
  id: string;
  name: string;
  rank: Rank;
  role: string;
  personality: string;
  avatarColor: string; // Tailwind color class e.g. "bg-blue-500"
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}
