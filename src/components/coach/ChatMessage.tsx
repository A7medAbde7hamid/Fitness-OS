import React from 'react';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { AICoachToolResult } from '../../services/aiCoachService';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  toolResults?: AICoachToolResult[];
  pendingToolConfirmation?: AICoachToolResult;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  toolResults,
  pendingToolConfirmation,
}) => {
  if (role === 'user') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="p-3.5 rounded-2xl bg-[#FF4E00] text-white font-semibold rounded-tr-none max-w-[85%] text-xs sm:text-sm leading-relaxed">
          <div>{content}</div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-white/5">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 justify-start">
      <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/15 border border-[#FF4E00]/25 text-[#FF6B2B] flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="p-3.5 rounded-2xl max-w-[85%] glass-panel-card text-neutral-200 border border-white/10 rounded-tl-none text-xs sm:text-sm leading-relaxed">
        <div className="whitespace-pre-wrap">{content}</div>

        {toolResults && toolResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {toolResults.map((tr, idx) => (
              <ToolActionCard key={idx} result={tr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ToolActionCardProps {
  result: AICoachToolResult;
}

export const ToolActionCard: React.FC<ToolActionCardProps> = ({ result }) => {
  if (!result.success) return null;

  const getIcon = () => {
    switch (result.actionTaken) {
      case 'log_meal':
        return <span className="text-[#FF6B2B]">🍽️</span>;
      case 'log_weight':
        return <span className="text-purple-400">⚖️</span>;
      case 'log_activity':
        return <span className="text-amber-400">🔥</span>;
      case 'log_workout':
        return <span className="text-cyan-400">💪</span>;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center gap-2 text-xs text-neutral-300">
      <span className="p-1 rounded-md bg-white/5 border border-white/10">{getIcon()}</span>
      <span>{result.message}</span>
    </div>
  );
};

export const ConfirmationCard: React.FC<{
  result: AICoachToolResult;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}> = ({ result, onConfirm, onEdit, onCancel, isProcessing }) => {
  if (!result.data) return null;

  return (
    <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-[#FF4E00]/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#FF6B2B] uppercase tracking-wider">
          Confirm Action
        </span>
        <Badge variant="amber">Review & Confirm</Badge>
      </div>

      <div className="text-xs text-neutral-400">
        {result.message}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FF4E00] to-[#FF6B2B] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isProcessing ? 'Saving...' : 'Confirm'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-medium bg-neutral-800 text-neutral-400 hover:bg-neutral-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
