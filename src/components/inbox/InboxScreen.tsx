import React, { useState } from 'react';
import { useGameStore } from '../../state/gameStore';
import { Inbox, CheckCircle2, ArrowRight, History, AlertTriangle } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

export const InboxScreen: React.FC = () => {
  const { activeEvents, eventHistory, resolveEvent } = useGameStore();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selectedEvent =
    (selectedEventId ? activeEvents.find(e => e.id === selectedEventId) : null) ||
    activeEvents[0] ||
    null;

  const handleResolve = (eventId: string, choiceId: string) => {
    soundEngine.playDecision();
    const remaining = activeEvents.filter(e => e.id !== eventId);
    setSelectedEventId(remaining[0]?.id || null);
    resolveEvent(eventId, choiceId);
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Crisis':
        return 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30';
      case 'Legal':
        return 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
      case 'Growth':
        return 'bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/30';
      case 'Founder':
      case 'Executive':
        return 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30';
      case 'Product':
        return 'bg-[#64d2ff]/15 text-[#64d2ff] border-[#64d2ff]/30';
      case 'Customer':
        return 'bg-[#30d158]/15 text-[#30d158] border-[#30d158]/30';
      case 'Investor':
        return 'bg-[#5e5ce6]/15 text-[#5e5ce6] border-[#5e5ce6]/30';
      case 'Competitor':
      case 'Infrastructure':
      case 'Market':
        return 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30';
      default:
        return 'bg-white/[0.06] text-white/70 border-white/[0.08]';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Inbox Header */}
      <div className="apple-card rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffd60a]/15 text-[#ffd60a] flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-white tracking-tight">
                  Executive Inbox &amp; Decisions
                </h1>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-medium border ${
                  activeEvents.length > 0
                    ? 'bg-[#ff453a] text-white border-transparent font-bold'
                    : 'bg-white/[0.06] text-white/80 border-white/[0.08]'
                }`}>
                  {activeEvents.length} Action Required
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                High-stakes dilemmas from customers, agents, regulators, and venture capitalists.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => { soundEngine.playClick(); setShowHistory(!showHistory); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl apple-btn-secondary text-xs transition-all font-medium"
          >
            <History className="w-3.5 h-3.5 text-white/60" />
            <span>{showHistory ? 'Hide History' : `History (${eventHistory.length})`}</span>
          </button>
        </div>
      </div>

      {/* Decision History View */}
      {showHistory && (
        <div className="apple-card rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-white/50" />
            <span>Archived Executive Decisions</span>
          </h2>
          {eventHistory.length === 0 ? (
            <p className="text-xs text-white/40 italic">No decisions archived yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {eventHistory.map((hist) => {
                const chosen = hist.choices.find(c => c.id === hist.resolvedChoiceId);
                return (
                  <div key={hist.id} className="p-3 apple-inset rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{hist.title}</span>
                      <span className="text-[10px] font-mono text-white/40">
                        {new Date(hist.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#30d158]">
                      Choice: "{chosen?.label}" &rarr; {chosen?.flavorOutcome}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2-Column: Active Events List vs Event Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event List (1 Col) */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Pending Decisions
          </h2>

          {activeEvents.length === 0 ? (
            <div className="p-8 apple-card rounded-2xl text-center">
              <CheckCircle2 className="w-7 h-7 text-[#30d158] mx-auto mb-2" />
              <h3 className="text-xs font-semibold text-white">Inbox Zero</h3>
              <p className="text-[11px] text-white/40 mt-0.5">
                No active operational emergencies.
              </p>
            </div>
          ) : (
            activeEvents.map((evt) => {
              const isSelected = (selectedEvent?.id === evt.id);

              return (
                <div
                  key={evt.id}
                  onClick={() => { soundEngine.playClick(); setSelectedEventId(evt.id); }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'apple-card border-[#0a84ff] ring-1 ring-[#0a84ff]/30 shadow-xs'
                      : 'apple-card hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-medium ${getCategoryBadgeClass(evt.category)}`}>
                      {evt.category}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white text-xs truncate">
                    {evt.title}
                  </h3>
                  <p className="text-[11px] text-white/40 truncate mt-0.5">
                    {evt.source}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Event Details & Choice Action Buttons (2 Cols) */}
        <div className="lg:col-span-2">
          {selectedEvent ? (
            <div className="apple-card rounded-2xl p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                    selectedEvent.severity === 3
                      ? 'bg-[#ff453a]/15 text-[#ff453a] border-[#ff453a]/30'
                      : selectedEvent.severity === 2
                      ? 'bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/30'
                      : 'bg-white/[0.06] text-white/80 border-white/[0.08]'
                  }`}>
                    Severity {selectedEvent.severity}
                  </span>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-medium ${getCategoryBadgeClass(selectedEvent.category)}`}>
                    {selectedEvent.category}
                  </span>
                  <span className="text-xs text-white/40 ml-auto">
                    Source: {selectedEvent.source}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mt-2">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed mt-2.5 p-3.5 apple-inset rounded-xl">
                  {selectedEvent.body}
                </p>
              </div>

              {/* Choices */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#ff9f0a]" />
                  <span>Choose Strategic Response</span>
                </span>

                <div className="space-y-2.5">
                  {selectedEvent.choices.map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleResolve(selectedEvent.id, choice.id)}
                      className="w-full text-left p-4 rounded-xl apple-inset hover:border-white/[0.18] hover:bg-white/[0.04] transition-all group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white group-hover:text-white transition-colors">
                          {choice.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                        {choice.summary}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 apple-card rounded-2xl text-white/40 text-xs">
              Select an incident from the left to review details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

