export interface CustomerMessage {
  id: string;
  author: string;
  company: string;
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'hilarious';
  text: string;
  plan: 'SMB' | 'Pro' | 'Enterprise';
}

export const CUSTOMER_QUOTES: CustomerMessage[] = [
  {
    id: 'q1',
    author: 'Braden K.',
    company: 'Fintech Stealth',
    sentiment: 'positive',
    text: 'This software saved our team 40 hours this week. We fired our intern yesterday.',
    plan: 'Pro'
  },
  {
    id: 'q2',
    author: 'Elena R.',
    company: 'DentalCorp Global',
    sentiment: 'frustrated',
    text: 'Is there a human being at your company I can speak with? Your bot keeps reciting haikus about billing.',
    plan: 'Enterprise'
  },
  {
    id: 'q3',
    author: 'Dax M.',
    company: 'Vibe Capital',
    sentiment: 'hilarious',
    text: 'Your support agent told me my refund request was "spiritually invalid". 10/10 product.',
    plan: 'SMB'
  },
  {
    id: 'q4',
    author: 'Sarah T.',
    company: 'Logistics One',
    sentiment: 'positive',
    text: 'The autonomous webhook feature just resolved 14,000 shipment delays without any human touching a keyboard.',
    plan: 'Enterprise'
  },
  {
    id: 'q5',
    author: 'Viktor P.',
    company: 'QuantLabs',
    sentiment: 'frustrated',
    text: 'The server was down for 4 minutes during market open. I lost my mind.',
    plan: 'Pro'
  },
  {
    id: 'q6',
    author: 'Chloe L.',
    company: 'CreatorStudio',
    sentiment: 'positive',
    text: 'Incredible product. Please never hire human managers or change anything.',
    plan: 'SMB'
  },
  {
    id: 'q7',
    author: 'Marcus Aurelius (fake account)',
    company: 'Stoic SaaS',
    sentiment: 'hilarious',
    text: 'Technical debt is not a bug, it is the natural decay of digital matter. Beautiful software.',
    plan: 'SMB'
  },
  {
    id: 'q8',
    author: 'Gavin B.',
    company: 'Hooli Systems',
    sentiment: 'frustrated',
    text: 'Why does your pricing page have a button labeled "Negotiate with AI" that insults my budget?',
    plan: 'Enterprise'
  },
  {
    id: 'q9',
    author: 'Maya S.',
    company: 'NextGen Health',
    sentiment: 'positive',
    text: 'Replaced 6 manual spreadsheets with one agent prompt. Our audit passed in 12 seconds.',
    plan: 'Enterprise'
  },
  {
    id: 'q10',
    author: 'Tariq N.',
    company: 'HyperScale AI',
    sentiment: 'hilarious',
    text: 'Your engineer CLAWD left a git commit message saying "may God have mercy on whoever reads this". App works though.',
    plan: 'Pro'
  },
  {
    id: 'q11',
    author: 'Samantha J.',
    company: 'CloudOps Direct',
    sentiment: 'positive',
    text: 'The dark mode OLED black background actually reduced my screen fatigue during 16-hour sprints.',
    plan: 'SMB'
  },
  {
    id: 'q12',
    author: 'Dmitri K.',
    company: 'Apex Trading Group',
    sentiment: 'frustrated',
    text: 'Where is the phone number for VIP support? Your Slack bot told me to meditate.',
    plan: 'Enterprise'
  },
  {
    id: 'q13',
    author: 'Zoe P.',
    company: 'ViralMedia NYC',
    sentiment: 'positive',
    text: 'Exported 500 video scripts in 3 minutes. Our TikTok channel reached 2 million followers.',
    plan: 'Pro'
  },
  {
    id: 'q14',
    author: 'Arthur C.',
    company: 'Pied Piper Labs',
    sentiment: 'hilarious',
    text: 'I asked your bot for an annual invoice discount and it offered to write a eulogy for our legacy database instead.',
    plan: 'SMB'
  },
  {
    id: 'q15',
    author: 'Kenji O.',
    company: 'Tokyo Logistics',
    sentiment: 'positive',
    text: '99.99% uptime validated. Sub-10ms response latency from our Asian edge nodes.',
    plan: 'Enterprise'
  },
  {
    id: 'q16',
    author: 'Rachel W.',
    company: 'BioTech Dynamics',
    sentiment: 'neutral',
    text: 'SOC2 report auto-downloaded successfully. Our compliance team was satisfied.',
    plan: 'Enterprise'
  }
];

export function getRandomCustomerQuotes(count: number = 4): CustomerMessage[] {
  const shuffled = [...CUSTOMER_QUOTES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
