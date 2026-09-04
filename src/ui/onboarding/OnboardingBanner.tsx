import React from 'react';
import { useV1Store } from '../../state/v1Store';

export const OnboardingBanner: React.FC = () => {
  const { onboardingStep, company, switchRoom } = useV1Store();

  if (onboardingStep === 'completed' || company.quarter >= 5) {
    return null;
  }

  const getStepConfig = (): { text: string; targetRoom?: 'marketing' | 'product' | 'monetization' | 'retention' | 'expansion' | 'operations' } | null => {
    switch (onboardingStep) {
      case 'q1_marketing':
        return { text: '[DIRECTIVE // Q1 MARKETING] SWIPE RIGHT OR CLICK PURSUE TO QUALIFY INBOUND DEMAND', targetRoom: 'marketing' };
      case 'q1_product':
        return { text: '[DIRECTIVE // Q1 PRODUCT] DEMAND IN BACKLOG — CLICK HERE TO ASSEMBLE FEATURE', targetRoom: 'product' };
      case 'q1_monetization':
        return { text: '[DIRECTIVE // Q1 PRICING] FEATURE PACKED — CLICK HERE TO STAMP CONTRACT', targetRoom: 'monetization' };
      case 'q1_cash':
        return { text: '[DIRECTIVE // Q1 CASH CYCLE] REPEAT THE MACHINE — CASH ACCUMULATES ON MONTHLY CLOSES' };
      case 'q2_retention':
        return { text: '[DIRECTIVE // Q2 CHURN THREAT] CHURN DETECTED — CLICK HERE TO TARGET RETENTION RADAR', targetRoom: 'retention' };
      case 'q2_operations':
        return { text: '[DIRECTIVE // Q2 OPERATIONS] LEAK DETECTED — CLICK HERE TO RUN ROOT CAUSE PATCH', targetRoom: 'operations' };
      case 'q3_automation':
        return { text: '[DIRECTIVE // Q3 AUTOMATION] AGENT LICENSES AVAILABLE IN SHOP TO AUTOMATE ROOM TICKS' };
      case 'q4_capital':
        return { text: '[DIRECTIVE // Q4 EXPANSION] CLICK HERE TO PACK MODULES INTO ENTERPRISE ACCOUNTS', targetRoom: 'expansion' };
      case 'q5_open_roguelite':
        return { text: '[DIRECTIVE // Q5 SCALING] FULL ROGUELITE UNLOCKED — MAINTAIN BURN & CONQUER UNICORN STATUS' };
      default:
        return null;
    }
  };

  const config = getStepConfig();
  if (!config) return null;

  return (
    <aside
      aria-label="Tutorial Directive"
      onClick={() => config.targetRoom && switchRoom(config.targetRoom)}
      className={`bg-[#0c0c0e] border-b border-[#1e1e24] px-4 py-2 text-center transition ${
        config.targetRoom ? 'cursor-pointer hover:bg-[#131317] active:scale-[0.995]' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ffd60a] inline-block" />
        <p className="text-[11px] font-mono tracking-wider text-white font-medium">
          {config.text}
        </p>
      </div>
    </aside>
  );
};

