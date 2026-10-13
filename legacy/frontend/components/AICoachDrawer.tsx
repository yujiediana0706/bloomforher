import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { UserProfile, EvidenceItem, ChatMessage } from '../types';
import { streamCoachChat } from '../services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  evidences: EvidenceItem[];
  prefilledPrompt?: string;
}

export const AICoachDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  evidences,
  prefilledPrompt
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      sender: 'coach',
      text: `Hello ${user.name}! I've reviewed your profile and ${evidences.length} evidence artifacts — which step would you like to talk about today?`,
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState(prefilledPrompt || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledPrompt) {
      setInputText(prefilledPrompt);
    }
  }, [prefilledPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming) return;
    const userMsg = inputText.trim();
    setInputText('');

    const userMessageObj: ChatMessage = {
      id: `m-u-${Date.now()}`,
      sender: 'user',
      text: userMsg,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMessageObj]);
    setIsStreaming(true);

    const coachMsgId = `m-c-${Date.now()}`;
    const initialCoachMessage: ChatMessage = {
      id: coachMsgId,
      sender: 'coach',
      text: '',
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, initialCoachMessage]);

    // Format history
    const history = messages.map(m => ({
      role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.text }]
    }));

    try {
      const { fullText, microAction } = await streamCoachChat(
        user,
        evidences,
        userMsg,
        history,
        (chunk) => {
          setMessages(prev => prev.map(m => {
            if (m.id === coachMsgId) {
              return { ...m, text: m.text + chunk };
            }
            return m;
          }));
        }
      );

      setMessages(prev => prev.map(m => {
        if (m.id === coachMsgId) {
          return { ...m, text: fullText, microAction };
        }
        return m;
      }));
    } catch (err) {
      console.error('Coach chat error', err);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slateblue-900/30 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-silver-300 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-silver-200 flex items-center justify-between bg-silver-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral-500 text-white flex items-center justify-center shadow-md shadow-coral-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-slateblue-900">AI Coach · Her Path</span>
                <span className="w-2 h-2 rounded-full bg-warmgreen" />
              </div>
              <span className="text-[11px] text-silver-600 block">
                Evidence-Reframing Method · "Why me" → "Why not me"
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-silver-500 hover:text-slateblue-900 rounded-lg hover:bg-silver-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 bg-silver-100 border-b border-silver-200 flex gap-2 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setInputText("I don't think I'm cut out for AI.")}
            className="px-2.5 py-1 bg-white rounded-lg border border-silver-300 text-slateblue-800 font-semibold whitespace-nowrap hover:border-coral-500"
          >
            "I don't think I'm cut out for AI"
          </button>
          <button
            type="button"
            onClick={() => setInputText("How do I explain my 18-month maternity gap?")}
            className="px-2.5 py-1 bg-white rounded-lg border border-silver-300 text-slateblue-800 font-semibold whitespace-nowrap hover:border-coral-500"
          >
            "How do I explain my career gap?"
          </button>
        </div>

        {/* Messages scroll area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-coral-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser 
                    ? 'bg-slateblue-900 text-white font-medium' 
                    : 'bg-silver-100 text-slateblue-900 border border-silver-300'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text || (isStreaming ? 'Thinking...' : '')}</p>

                  {/* Micro action prompt if provided */}
                  {msg.microAction && (
                    <div className="mt-3 pt-2 border-t border-silver-300 bg-white/70 p-2.5 rounded-xl text-coral-600 font-bold flex items-start gap-2">
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase text-silver-600 block">Suggested Micro-Action (≤ 10 mins):</span>
                        <span>{msg.microAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input footer */}
        <div className="p-4 border-t border-silver-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your coach anything about confidence, tasks, or interviews..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-silver-400 focus:outline-none focus:ring-2 focus:ring-coral-500 text-xs font-medium"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isStreaming || !inputText.trim()}
              className="p-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white rounded-xl shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-silver-500 mt-1 block text-center">
            Pausing is not elimination · Grounded in your verified evidence bank
          </span>
        </div>
      </div>
    </div>
  );
};
