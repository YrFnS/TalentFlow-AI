'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Plus,
  Briefcase,
  FileCheck,
  HelpCircle,
  Mic,
  Users,
  BarChart3,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatbotProps {
  source?: 'landing' | 'candidate' | 'company';
}

function generateSessionId(): string {
  return 'chat_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export default function AIChatbot({ source = 'landing' }: AIChatbotProps) {
  const { t, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session ID
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  // Get greeting message based on source
  const getGreeting = useCallback(() => {
    const cb = t.chatbot;
    if (source === 'candidate') return cb.candidateGreeting;
    if (source === 'company') return cb.companyGreeting;
    return t.common.chatbot.greeting;
  }, [source, t]);

  // Auto-greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setMessages([{ role: 'assistant', content: getGreeting() }]);
    }
  }, [isOpen, hasGreeted, getGreeting]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Get the API endpoint based on source
  const getApiEndpoint = useCallback(() => {
    if (source === 'candidate') return '/api/chatbot/candidate';
    if (source === 'company') return '/api/chatbot/company';
    return '/api/chatbot';
  }, [source]);

  // Get the chatbot title based on source
  const getTitle = useCallback(() => {
    const cb = t.chatbot;
    if (source === 'candidate') return cb.candidateTitle;
    if (source === 'company') return cb.companyTitle;
    return t.common.chatbot.title;
  }, [source, t]);

  // Get the chatbot subtitle based on source
  const getSubtitle = useCallback(() => {
    const cb = t.chatbot;
    if (source === 'candidate') return cb.candidateSubtitle;
    if (source === 'company') return cb.companySubtitle;
    return t.common.chatbot.subtitle;
  }, [source, t]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = getApiEndpoint();
      const body: Record<string, unknown> = {
        message: messageText.trim(),
        sessionId,
        context: window.location.pathname,
        source,
      };

      if (source === 'candidate') {
        body.candidateId = 'current';
      } else if (source === 'company') {
        body.companyId = 'current';
      }

      // Include conversation history
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      body.conversationHistory = history;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(t.chatbot.errorRetry);
        }
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      const botMessage: Message = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, botMessage]);

      // Update session ID if server returned a different one
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t.chatbot.errorRetry },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, sessionId, source, messages, getApiEndpoint, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(generateSessionId());
    setHasGreeted(false);
  };

  // Quick actions based on source
  const getQuickActions = () => {
    const cb = t.chatbot;
    if (source === 'candidate') {
      return [
        { label: cb.checkAppStatus, message: cb.checkAppStatusMsg, icon: FileCheck },
        { label: cb.interviewTips, message: cb.interviewTipsMsg, icon: Mic },
        { label: cb.processQuestions, message: cb.processQuestionsMsg, icon: HelpCircle },
        { label: cb.upcomingInterviews, message: cb.upcomingInterviewsMsg, icon: Briefcase },
      ];
    }
    if (source === 'company') {
      return [
        { label: cb.searchCandidates, message: cb.searchCandidatesMsg, icon: Users },
        { label: cb.helpJobPosting, message: cb.helpJobPostingMsg, icon: FileText },
        { label: cb.hrCompliance, message: cb.hrComplianceMsg, icon: HelpCircle },
        { label: cb.hiringAnalytics, message: cb.hiringAnalyticsMsg, icon: BarChart3 },
      ];
    }
    // Landing page quick actions
    return [
      { label: t.common.chatbot.quickFindJobs, message: 'I want to find jobs. Can you help me search?', icon: Briefcase },
      { label: t.common.chatbot.quickInterviewTips, message: 'Can you give me some interview tips?', icon: Mic },
      { label: t.common.chatbot.quickResumeHelp, message: 'I need help with my resume. What should I include?', icon: FileText },
      { label: t.common.chatbot.quickAppStatus, message: 'How can I check my application status?', icon: FileCheck },
    ];
  };

  const quickActions = getQuickActions();

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 end-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${isOpen ? 'rotate-0 scale-0 opacity-0 pointer-events-none' : 'rotate-0 scale-100 opacity-100'}`}
        aria-label={isOpen ? t.common.close : getTitle()}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 end-6 z-50 transition-all duration-300 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
        }`}
        dir={dir}
      >
        <div className="w-[calc(100vw-3rem)] sm:w-[340px] h-[70vh] max-h-[520px] flex flex-col rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-teal-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">{getTitle()}</h3>
                <p className="text-[10px] text-white/70 leading-tight">{getSubtitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={handleNewChat}
                title={t.common.chatbot.newChat}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'bg-muted/80 text-foreground rounded-ss-sm'
                        : 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-se-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-2 flex-row">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-muted/80 rounded-2xl rounded-ss-sm px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="typing-dot w-2 h-2 rounded-full bg-teal-500 inline-block" style={{ animationDelay: '0ms' }} />
                      <span className="typing-dot w-2 h-2 rounded-full bg-teal-500 inline-block" style={{ animationDelay: '150ms' }} />
                      <span className="typing-dot w-2 h-2 rounded-full bg-teal-500 inline-block" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.message)}
                    className="text-xs px-3 py-1.5 rounded-full border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors flex items-center gap-1"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border/50 bg-background/50">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.common.chatbot.placeholder}
              disabled={isLoading}
              className="flex-1 h-9 text-sm rounded-full border-teal-200 dark:border-teal-800 focus-visible:ring-teal-500/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* CSS for typing animation */}
      <style jsx global>{`
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
