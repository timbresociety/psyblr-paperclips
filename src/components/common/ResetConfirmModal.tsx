import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { soundEngine } from '../../audio/soundEffects';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose }) => {
  const { resetGame } = useGameStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundEngine.playClick();
    resetGame();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <div className="apple-card rounded-2xl max-w-md w-full p-6 shadow-2xl text-left border border-white/[0.12]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff453a]" />
            <h3 className="text-sm font-semibold text-white">
              Butlerian Jihad (Reset Progress)?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/40 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed mb-5">
          This will wipe all active venture data, autonomous agent swarms, revenue, and unlocked eras—returning you directly to <strong>Era 1: Garage Hacker</strong> with $2,000 cash, 1 human employee, and the pure Vibe Code loop.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl apple-btn-secondary text-xs font-medium text-white/80 transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff453a] hover:bg-[#e0382e] text-xs font-semibold text-white transition-all shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Butlerian Jihad (Reset)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
