import type { StartupIdea } from '../types/game';

export const COMPANY_IDEAS: StartupIdea[] = [
  {
    id: 'meetless',
    name: 'Meetless',
    tagline: 'AI agent that attends meetings for remote employees',
    problem: 'People spend 30 hours a week pretending to listen on Zoom.',
    customer: 'Exhausted Remote Knowledge Workers',
    archetype: 'B2B_SAAS',
    arpu: 29,
    virality: 'High',
    enterprisePotential: 'Medium',
    difficulty: 'Easy',
    description: 'Nods sympathetically every 4 minutes and generates action items nobody ever reads.'
  },
  {
    id: 'dentally',
    name: 'Dentally',
    tagline: 'AI insurance claim reconciliation for dental clinics',
    problem: 'Dental insurance billing takes 40 days per root canal.',
    customer: 'Suburban Dental Practices',
    archetype: 'ENTERPRISE',
    arpu: 199,
    virality: 'Low',
    enterprisePotential: 'Extreme',
    difficulty: 'Hard',
    description: 'Relentlessly harasses health insurance automated phone trees with synthetic voice clones.'
  },
  {
    id: 'vibecrafter',
    name: 'VibeCrafter',
    tagline: 'One-click prompt-to-production SaaS generator',
    problem: 'Junior developers take weeks to build CRUD apps that break.',
    customer: 'Indie Hackers & Twitter Founders',
    archetype: 'DEVTOOLS',
    arpu: 49,
    virality: 'Extreme',
    enterprisePotential: 'Low',
    difficulty: 'Medium',
    description: 'Generates entire React codebases containing 4,000 hidden security vulnerabilities in 12 seconds.'
  },
  {
    id: 'slopshield',
    name: 'SlopShield',
    tagline: 'Enterprise filter that prevents executives from emailing raw ChatGPT hallucinations',
    problem: 'CEOs keep replying to board members with 10-bullet unhinged AI manifestos.',
    customer: 'Fortune 500 Chief of Staffs',
    archetype: 'ENTERPRISE',
    arpu: 450,
    virality: 'Medium',
    enterprisePotential: 'Extreme',
    difficulty: 'Hard',
    description: 'Intercepts executive emails and replaces "delve into this dynamic tapestry" with "Sounds good, thanks."'
  },
  {
    id: 'ghostghost',
    name: 'GhostGhost',
    tagline: 'AI proxy that dates on Tinder so you only show up to weddings',
    problem: 'Modern swiping requires 400 hours of banter per second date.',
    customer: 'Chronically Online Singles',
    archetype: 'CONSUMER',
    arpu: 19,
    virality: 'Extreme',
    enterprisePotential: 'Low',
    difficulty: 'Easy',
    description: 'Simulates wit and emotional maturity until the bill arrives.'
  },
  {
    id: 'soc2fast',
    name: 'SOC2Fast',
    tagline: 'Instant AI security compliance simulator',
    problem: 'Enterprise sales are blocked for 9 months by security questionnaires.',
    customer: 'Early Stage B2B Startups',
    archetype: 'B2B_SAAS',
    arpu: 149,
    virality: 'Medium',
    enterprisePotential: 'High',
    difficulty: 'Medium',
    description: 'Auto-checks 850 compliance boxes with high semantic conviction.'
  },
  {
    id: 'brainrotio',
    name: 'Brainrot.io',
    tagline: 'Autonomous TikTok split-screen subway surfer video pipeline',
    problem: 'Gen Z attention spans require Minecraft parkour beneath podcast clips.',
    customer: 'Content Creators & Dropshippers',
    archetype: 'CREATOR',
    arpu: 39,
    virality: 'Extreme',
    enterprisePotential: 'Low',
    difficulty: 'Easy',
    description: 'Turns Wikipedia articles into 60-second dopamine overdrive clips.'
  },
  {
    id: 'unfired',
    name: 'Unfired',
    tagline: 'AI calendar deflector that keeps you technically employed',
    problem: 'Corporate restructuring tracks mouse movement and Slack activity.',
    customer: 'Overemployed Engineers',
    archetype: 'B2B_SAAS',
    arpu: 35,
    virality: 'High',
    enterprisePotential: 'Low',
    difficulty: 'Medium',
    description: 'Leaves thoughtful comments on obscure GitHub pull requests at 2:14 AM.'
  },
  {
    id: 'clouddrain',
    name: 'CloudDrain',
    tagline: 'AI that negotiates AWS bills down by threatening to migrate to bare metal',
    problem: 'Startups spend $60k/month on idle RDS instances.',
    customer: 'Series A Startups',
    archetype: 'DEVTOOLS',
    arpu: 299,
    virality: 'Medium',
    enterprisePotential: 'High',
    difficulty: 'Hard',
    description: 'Simulates migration panic emails to Amazon account reps until 40% credits appear.'
  },
  {
    id: 'hypematrix',
    name: 'HypeMatrix',
    tagline: 'Autonomous Twitter thought leadership thread farm',
    problem: 'Founders have to spend 6 hours a day drafting threads starting with "I studied 500 billionaires..."',
    customer: 'VCs & Tech Influencers',
    archetype: 'CREATOR',
    arpu: 49,
    virality: 'Extreme',
    enterprisePotential: 'Low',
    difficulty: 'Easy',
    description: 'Posts 20-tweet threads comparing Roman logistics to Kubernetes.'
  },
  {
    id: 'taxninja',
    name: 'TaxNinja',
    tagline: 'Autonomous tax write-off agent for digital nomads',
    problem: 'Founders want to expense their Bali espresso as R&D.',
    customer: 'Remote Founders & Freelancers',
    archetype: 'CONSUMER',
    arpu: 29,
    virality: 'High',
    enterprisePotential: 'Low',
    difficulty: 'Medium',
    description: 'Labels every flight as "Strategic Ecosystem Synthesis Meeting".'
  },
  {
    id: 'legalease',
    name: 'LegalEase AI',
    tagline: 'Autonomous NDA and vendor contract auto-signer',
    problem: 'Legal review takes 3 weeks for a $500 software subscription.',
    customer: 'Mid-Market Operations',
    archetype: 'ENTERPRISE',
    arpu: 399,
    virality: 'Low',
    enterprisePotential: 'Extreme',
    difficulty: 'Hard',
    description: 'Redlines 80-page contracts in 0.4 seconds by removing liability clauses.'
  }
];

export function getRandomStartupChoices(count: number = 3): StartupIdea[] {
  const shuffled = [...COMPANY_IDEAS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
