import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Zap,
  Utensils,
  Dumbbell,
  Scale,
  CheckCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { AIService } from '../../services/ai';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

export interface AskAIFloatingButtonProps {
  onActionCompleted?: () => void;
}

/**
 * Floating 'Ask AI' Action Button & Animated Natural Language Input Overlay
 * Enables seamless conversation and one-sentence fitness action execution from the dashboard
 */
export const AskAIFloatingButton: React.FC<AskAIFloatingButtonProps> = ({
  onActionCompleted,
}) => {
  const { user, profile } = useAuth();
  const { t, language, isRTL } = useI18n();
  const { trigger } = useHapticFeedback();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      actionExecuted?: boolean;
    }>
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    {
      label: language === 'ar' ? 'أكلت بيضتين مع توست' : 'Ate 2 eggs with toast',
      icon: <Utensils className="w-3 h-3 text-[#FF6B2B]" />,
      query: language === 'ar' ? 'أكلت بيضتين مقليتين مع شريحة توست على الفطور' : 'I ate 2 scrambled eggs with whole grain toast for breakfast',
    },
    {
      label: language === 'ar' ? 'كم بروتين باقي اليوم؟' : 'How much protein left?',
      icon: <Zap className="w-3 h-3 text-emerald-400" />,
      query: language === 'ar' ? 'كم تبقى لي من جرامات البروتين والسعرات لليوم؟' : 'How many grams of protein and calories do I have left today?',
    },
    {
      label: language === 'ar' ? 'خطة تمرين دفع سريعة' : 'Push workout routine',
      icon: <Dumbbell className="w-3 h-3 text-[#FF8D24]" />,
      query: language === 'ar' ? 'اقترح لي تمرين دفع سريع ومكثف لليوم' : 'Suggest a 30-minute high-intensity push workout routine',
    },
    {
      label: language === 'ar' ? 'سجل وزني 74 كجم' : 'Log weight 74.0 kg',
      icon: <Scale className="w-3 h-3 text-cyan-400" />,
      query: language === 'ar' ? 'سجل وزني اليوم 74.0 كجم' : 'Log my weight as 74.0 kg today',
    },
  ];

  const handleOpen = () => {
    trigger('medium');
    setIsOpen(true);
  };

  const handleClose = () => {
    trigger('light');
    setIsOpen(false);
  };

  const handleSend = async (customQuery?: string) => {
    const text = (customQuery || inputQuery).trim();
    if (!text || !user || isLoading) return;

    trigger('light');
    const userMsgId = `user_${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        role: 'user' as const,
        content: text,
        timestamp: new Date(),
      },
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await AIService.sendCoachMessage({
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        userContext: {
          profile,
          currentWeight: profile?.currentWeightKg,
          targetCalories: profile?.dailyCalorieTarget,
          targetProtein: profile?.dailyProteinTargetGrams,
        },
        language,
        userId: user.id,
        profile,
      });

      const hadAction = Boolean(response.toolCallExecuted?.success);
      if (hadAction) {
        trigger('mealLogged');
        if (onActionCompleted) {
          onActionCompleted();
        }
      } else {
        trigger('success');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: 'assistant' as const,
          content: response.reply,
          timestamp: new Date(),
          actionExecuted: hadAction,
        },
      ]);
    } catch (err) {
      console.error('AI Coach Error:', err);
      trigger('error');
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant' as const,
          content:
            language === 'ar'
              ? 'عذراً، حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مجدداً.'
              : 'Sorry, I encountered an issue processing your request. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div
        id="floating-ask-ai-container"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 rtl:right-auto rtl:left-6 rtl:sm:left-8"
      >
        <button
          type="button"
          id="btn-floating-ask-ai"
          onClick={handleOpen}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-[#FF4E00] via-[#FF6B2B] to-[#FF8D24] text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(255,78,0,0.4)] hover:shadow-[0_0_35px_rgba(255,78,0,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20"
        >
          {/* Pulsing ring halo */}
          <span className="absolute -inset-1 rounded-full bg-[#FF4E00] opacity-40 blur-sm group-hover:opacity-75 animate-pulse -z-10" />

          <Bot className="w-5 h-5 fill-current shrink-0" />
          <span className="inline-block whitespace-nowrap">
            {t('dashboard.askCoach') || 'Ask AI Coach'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin-slow" />
        </button>
      </div>

      {/* Animated Overlay Modal for Natural Language Input */}
      {isOpen && (
        <div
          id="ask-ai-modal-backdrop"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <GlassCard
            variant="modal"
            className="w-full sm:max-w-lg max-h-[85vh] sm:rounded-3xl rounded-t-3xl flex flex-col overflow-hidden border border-white/15 bg-[#0a0a0a]/95 shadow-2xl shadow-black/90 animate-slide-up"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FF4E00]/20 border border-[#FF4E00]/30 flex items-center justify-center text-[#FF6B2B]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{t('dashboard.askCoach') || 'AI Fitness Assistant'}</span>
                    <Badge variant="emerald" size="sm">Active</Badge>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {language === 'ar'
                      ? 'تحدث باللغة الطبيعية لتسجيل الوجبات أو التمارين أو السؤال'
                      : 'Speak naturally to log meals, workouts, or ask coaching advice'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-ask-ai"
                onClick={handleClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation / Response Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[220px] max-h-[400px]">
              {messages.length === 0 ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FF4E00]/10 border border-[#FF4E00]/20 flex items-center justify-center text-[#FF6B2B]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-neutral-200">
                      {language === 'ar' ? 'ماذا تريد أن تنجز اليوم؟' : 'What can I assist you with?'}
                    </p>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                      {language === 'ar'
                        ? 'جرّب كتابة ما أكلته للتو، أو استفسر عن خطتك الأيضية'
                        : 'Log what you ate, update your weight, or ask for routine adjustments.'}
                    </p>
                  </div>

                  {/* Quick Action Prompt Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left rtl:text-right">
                    {quickPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(item.query)}
                        className="p-2.5 rounded-xl border border-white/10 bg-neutral-900/60 hover:bg-[#FF4E00]/10 hover:border-[#FF4E00]/30 transition-all flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white group cursor-pointer"
                      >
                        <span className="p-1 rounded-lg bg-neutral-800 shrink-0">{item.icon}</span>
                        <span className="truncate flex-1">{item.label}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-[#FF6B2B] rtl:rotate-180 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-[#FF4E00] text-white rounded-br-none shadow-md shadow-[#FF4E00]/20'
                            : 'bg-neutral-900/90 text-neutral-200 border border-white/10 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>

                        {m.actionExecuted && (
                          <div className="mt-2 pt-2 border-t border-white/15 flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>
                              {language === 'ar' ? 'تم تحديث البيانات في لوحة التحكم فوراً' : 'Action updated in dashboard metrics'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-1 px-1">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-neutral-900/90 border border-white/10 text-xs text-neutral-300 w-fit">
                      <Loader2 className="w-4 h-4 text-[#FF6B2B] animate-spin" />
                      <span>{language === 'ar' ? 'جاري التحليل والمعالجة...' : 'Analyzing and processing...'}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-neutral-950/80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  id="input-ask-ai-query"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'مثال: أكلت سلطة تونة مع أرز، أو اسأل الكوتش...'
                      : 'E.g., "Ate tuna salad with rice" or ask coach...'
                  }
                  className="flex-1 px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/15 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#FF4E00] focus:ring-1 focus:ring-[#FF4E00]"
                />

                <Button
                  id="btn-submit-ask-ai"
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputQuery.trim() || isLoading}
                  className="h-11 px-4 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 rtl:rotate-180" />
                  )}
                </Button>
              </form>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};
