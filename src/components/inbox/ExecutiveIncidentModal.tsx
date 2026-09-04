import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import {
  Inbox,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface ExecutiveIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveIncidentModal: React.FC<ExecutiveIncidentModalProps> = ({
  isOpen,
  onClose
}) => {
  const { activeEvents, resolveEvent, setActiveTab } = useGameStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen) return null;

  const currentEvent = activeEvents[currentIndex] || activeEvents[0];

  const handleResolve = (choiceId: string) => {
    if (!currentEvent) return;
    soundEngine.playDecision();
    resolveEvent(currentEvent.id, choiceId);
    
    // Adjust index if needed
    if (currentIndex >= activeEvents.length - 1) {
      setCurrentIndex(Math.max(0, activeEvents.length - 2));
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Crisis':
        return 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30';
      case 'Legal':
      case 'Market':
      case 'Infrastructure':
        return 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
      case 'Growth':
        return 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30';
      case 'Customer':
        return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      default:
        return 'bg-white/[0.06] text-white/70 border-white/[0.08]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="apple-card border border-white/[0.14] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-left animate-in zoom-in-95 duration-200">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-36 bg-radial from-[#ff453a]/10 to-transparent pointer-events-none blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff453a]/15 text-[#ff453a] flex items-center justify-center border border-[#ff453a]/25">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Executive Incident Review
                </h2>
                {activeEvents.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff453a] text-white font-bold">
                    {currentIndex + 1} of {activeEvents.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Immediate decision required to protect company valuation and customer trust.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Incident Content */}
        {!currentEvent ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#30d158] mx-auto" />
            <h3 className="text-sm font-semibold text-white">Inbox Zero Achieved</h3>
            <p className="text-xs text-white/40 max-w-xs mx-auto">
              All active operational incidents and strategic dilemmas have been successfully resolved.
            </p>
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold transition-all"
            >
              Return to Cockpit
            </button>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {/* Metadata Badges */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${getCategoryBadgeClass(currentEvent.category)}`}>
                  {currentEvent.category}
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  {new Date((currentEvent as any).timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Navigation between multiple incidents */}
              {activeEvents.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setCurrentIndex(prev => Math.max(0, prev - 1));
                    }}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-lg text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono text-white/40">
                    {currentIndex + 1}/{activeEvents.length}
                  </span>
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setCurrentIndex(prev => Math.min(activeEvents.length - 1, prev + 1));
                    }}
                    disabled={currentIndex === activeEvents.length - 1}
                    className="p-1 rounded-lg text-white/50 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Title & Body */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {currentEvent.title}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed mt-2 p-3.5 apple-inset rounded-xl border border-white/[0.06]">
                {currentEvent.body || (currentEvent as any).description || 'An urgent operational decision is required.'}
              </p>
            </div>

            {/* Strategic Response Options */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f0a]" />
                <span>Select Executive Action</span>
              </span>

              <div className="space-y-2">
                {currentEvent.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleResolve(choice.id)}
                    className="w-full text-left p-3.5 rounded-xl apple-inset hover:border-white/[0.2] hover:bg-white/[0.04] transition-all group border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-[#0a84ff] transition-colors">
                        {choice.label || (choice as any).text || 'Execute Strategic Response'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                      {choice.summary || (choice as any).flavorOutcome || (choice as any).description || ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer: Link to Full Inbox Screen */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
              setActiveTab('inbox');
            }}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
          >
            <span>Open Dedicated Inbox Screen</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <span className="text-[10px] font-mono text-white/30">
            Hotkey: 9
          </span>
        </div>
      </div>
    </div>
  );
};
