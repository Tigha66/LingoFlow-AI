export enum Sender {
  USER = 'user',
  AI = 'ai'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  audioUrl?: string; // Blob URL for playback
  correction?: string; // HTML or markdown string for grammar correction
  translation?: string;
}

export interface UserStats {
  streak: number;
  xp: number;
  level: number;
  gems: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  completed: boolean;
  locked: boolean;
}

export enum AppView {
  HOME = 'home',
  CHAT = 'chat',
  PROFILE = 'profile',
  PREMIUM = 'premium'
}

export interface ChatContext {
  language: string;
  level: string;
  topic: string;
}