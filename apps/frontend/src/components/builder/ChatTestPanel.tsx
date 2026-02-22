'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, Bot, User, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Array<{ title: string; content: string }>;
}

interface ChatTestPanelProps {
  messages: Message[];
  isTesting: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
}

export function ChatTestPanel({ messages, isTesting, onSendMessage, onClose }: ChatTestPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTesting) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="absolute bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border flex flex-col z-20 overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-indigo-50">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-900">Test du Flow</span>
          {isTesting && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-indigo-100 rounded-lg transition">
          <X className="h-4 w-4 text-indigo-600" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-8">
            <Bot className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>Envoyez un message pour tester votre agent</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : msg.role === 'system'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <div className="flex items-start gap-1.5">
                {msg.role === 'assistant' && <Bot className="h-3.5 w-3.5 mt-0.5 text-indigo-500 flex-shrink-0" />}
                {msg.role === 'system' && <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                {msg.role === 'user' && <User className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 opacity-70" />}
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/50">
                  <p className="text-[10px] text-gray-500 mb-1">Sources :</p>
                  {msg.sources.map((s, j) => (
                    <p key={j} className="text-[10px] text-gray-400 truncate">
                      • {s.title}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTesting && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Testez votre agent..."
          className="flex-1 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          disabled={isTesting}
        />
        <button
          type="submit"
          disabled={isTesting || !input.trim()}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
