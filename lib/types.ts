export type Mode = 'roast' | 'confess' | 'birthday' | 'ama'

export const MODE_CONFIG: Record<Mode, {
  emoji: string
  label: string
  description: string
  color: string
  borderColor: string
  glowColor: string
  prompts: string[]
  starters: string[]
}> = {
  roast: {
    emoji: '🔥',
    label: 'Roast me',
    description: 'Say what you really think',
    color: 'text-orange-400',
    borderColor: 'border-orange-500',
    glowColor: 'shadow-orange-500/25',
    prompts: [
      'Say something they need to hear...',
      "What's the one thing you'd never say to their face?",
      'Be brutally honest...',
      'Tell them their worst habit...',
      "What do you actually think of them?",
    ],
    starters: [
      'Your fashion sense needs help 😬',
      'You talk too much honestly',
      'You\'re not as funny as you think',
      'Your taste in music is terrible 💀',
    ],
  },
  confess: {
    emoji: '💌',
    label: 'Confess to me',
    description: "Something you've never said out loud",
    color: 'text-pink-400',
    borderColor: 'border-pink-500',
    glowColor: 'shadow-pink-500/25',
    prompts: [
      "Confess something you've kept to yourself...",
      'Tell them what you really think...',
      'Say what you always wanted to say...',
      'What do you wish they knew?',
      'Be honest. No one will know it was you.',
    ],
    starters: [
      'I\'ve always had a crush on you 💌',
      'I\'m lowkey jealous of you',
      'You inspire me more than you know',
      'I miss you and never say it',
    ],
  },
  birthday: {
    emoji: '🎂',
    label: 'Birthday vibes',
    description: 'Send them love on their special day',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/25',
    prompts: [
      'Send them a birthday wish!',
      "What's your favourite memory with them?",
      'Wish them something special...',
      'Tell them how much they mean to you...',
      'Drop some birthday love...',
    ],
    starters: [
      'Happy birthday! You deserve everything 🎂',
      'My favourite memory of us is...',
      'You mean so much more than you know',
      'Wishing you the best year yet 🥳',
    ],
  },
  ama: {
    emoji: '❓',
    label: 'Ask me anything',
    description: 'No question is off limits',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    glowColor: 'shadow-cyan-500/25',
    prompts: [
      'Ask them anything...',
      "What have you always wanted to know?",
      'Ask your burning question...',
      'What are you curious about?',
      "No filter. Ask away.",
    ],
    starters: [
      'What\'s your biggest regret?',
      'Rate your own vibe honestly 👀',
      'What do people misunderstand about you?',
      'What\'s a secret you\'ve never told anyone?',
    ],
  },
}

export const REACTION_EMOJIS = ['🔥', '😂', '💀', '😭', '👀']

export interface Page {
  id: string
  name: string
  slug: string
  mode: Mode
  created_at: string
}

export interface Message {
  id: string
  page_id: string
  content: string
  created_at: string
  reactions: { emoji: string; count: number }[]
  replies: Reply[]
  total_reactions: number
}

export interface Reply {
  id: string
  message_id: string
  content: string
  created_at: string
  is_owner: boolean
}
