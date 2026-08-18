import React from 'react';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { AIConversation } from '../../types';
interface ConversationListProps {
  conversations: AIConversation[];
  activeConvId: string | null;
  onSelect: (convId: string) => void;
  onNew: () => void;
  onDelete: (convId: string) => void;
  language: 'en' | 'ar';
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConvId,
  onSelect,
  onNew,
  onDelete,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#FF4E00] to-[#FF6B2B] text-white text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAr ? 'دردشة جديدة' : 'New Chat'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-500">
            {isAr ? 'لا توجد محادثات بعد' : 'No conversations yet'}
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-3 rounded-xl cursor-pointer transition-all group ${
                activeConvId === conv.id
                  ? 'bg-[#FF4E00]/15 border border-[#FF4E00]/30'
                  : 'bg-neutral-900/30 border border-white/5 hover:bg-neutral-900/60'
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {(isAr && conv.titleAr) ? conv.titleAr : conv.title}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {new Date(conv.lastMessageAt).toLocaleDateString(
                      isAr ? 'ar-EG' : 'en-US',
                      { month: 'short', day: 'numeric' }
                    )}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-500 hover:text-rose-400 transition-opacity"
                  aria-label={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const ChatInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  language: 'en' | 'ar';
  onSuggestedPrompt?: (prompt: string) => void;
}> = ({ value, onChange, onSend, isLoading, language, onSuggestedPrompt }) => {
  const isAr = language === 'ar';

  const suggestedPrompts = isAr
    ? ['كيف أنا اليوم؟', 'سجل وزني 69.5 كجم', 'ما باقي لي كم سعرة؟', 'إيه أتمرن اليوم؟']
    : ['How am I doing today?', 'Log my weight: 69.5 kg', 'How many calories left?', 'What should I train today?'];

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            id="input-coach-message"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isAr ? 'اسأل المدرب عن شيء...' : 'Ask your coach anything...'}
            disabled={isLoading}
            className="w-full rounded-xl px-4 py-3 text-sm glass-input placeholder:text-slate-500 disabled:opacity-60"
          />
        </div>
        <button
          id="btn-coach-send"
          type="submit"
          disabled={!value.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#FF4E00] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          aria-label={isAr ? 'إرسال' : 'Send'}
        >
          <svg
            className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSuggestedPrompt?.(p)}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-xl glass-panel-subtle text-neutral-300 hover:text-white hover:border-[#FF4E00]/40 border border-white/5 transition-all shrink-0 flex items-center gap-1.5"
          >
            <MessageCircle className="w-3 h-3 text-[#FF6B2B]" />
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
