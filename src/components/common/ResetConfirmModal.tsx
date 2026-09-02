import React from 'react';
import { useGameStore } from '../../state/gameStore';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose }) => {
  const { resetGame } = useGameStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    resetGame();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111422] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)] text-left">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-black text-white uppercase tracking-wider">
              Reset Game & Start Over?
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5">
          This will wipe all active company data, autonomous agents, revenue, technical debt, and milestones, returning you to the founder startup selection screen.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
