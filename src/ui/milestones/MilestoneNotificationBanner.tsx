import React, { useEffect } from 'react';
import { useV1Store } from '../../state/v1Store';
import { Trophy, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MilestoneNotificationBanner: React.FC = () => {
  const activeMilestone = useV1Store((s) => s.activeMilestone);
  const dismissMilestone = useV1Store((s) => s.dismissMilestone);

  useEffect(() => {
    if (activeMilestone) {
      const timer = setTimeout(() => {
        dismissMilestone();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeMilestone, dismissMilestone]);

  return (
    <AnimatePresence>
      {activeMilestone && (
        <motion.aside
          aria-label="Milestone notification"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg"
        >
          <div className="relative bg-[#0d0d12]/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_35px_rgba(245,158,11,0.2)] text-white overflow-hidden flex items-start gap-3">
            {/* Ambient indicator stripe */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

            {/* Tactile Icon Hub */}
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-amber-400 uppercase">
                <Sparkles className="w-3 h-3" />
                <span>MILESTONE UNLOCKED</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold font-mono text-white tracking-tight truncate mt-0.5">
                {activeMilestone.bannerTitle}
              </h4>
              <p className="text-[11px] font-mono text-white/70 italic mt-0.5 leading-snug">
                {activeMilestone.flavorQuote}
              </p>
              <p className="text-[10px] font-mono text-emerald-400/90 mt-1">
                ⚡ {activeMilestone.rewardFlavor}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={dismissMilestone}
              className="p-1 text-white/40 hover:text-white rounded-lg hover:bg-white/[0.08] transition shrink-0"
              title="Dismiss milestone"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
