'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Brain, Send, Star, TrendingDown, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  delay: number;
}

const CHAT_SCRIPT: ChatMessage[] = [
  { role: 'user', text: 'Bonjour, quel est le statut de ma commande #12847 ?', delay: 1000 },
  {
    role: 'agent',
    text: 'Bonjour ! Votre commande #12847 est en cours de livraison. Elle devrait arriver demain avant 18h. Souhaitez-vous le lien de suivi ?',
    delay: 3000,
  },
  { role: 'user', text: 'Oui, merci !', delay: 6000 },
  {
    role: 'agent',
    text: "Voici votre lien de suivi : track.luneo.app/12847. N'hésitez pas si vous avez d'autres questions !",
    delay: 8000,
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
        <Brain className="w-3.5 h-3.5 text-cyan-400" />
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 bg-white/40 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCounter({
  target,
  suffix = '',
  prefix = '',
  decimals = 0,
  inView,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  inView: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span>
      {prefix}
      {decimals > 0 ? value.toFixed(decimals) : Math.floor(value)}
      {suffix}
    </span>
  );
}

function SparklineSVG() {
  return (
    <svg viewBox="0 0 60 24" className="w-14 h-6" fill="none">
      <motion.path
        d="M2 18 L10 14 L18 16 L26 10 L34 12 L42 6 L50 8 L58 3"
        stroke="url(#sparkGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AgentDemoShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInView) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    CHAT_SCRIPT.forEach((msg, index) => {
      if (msg.role === 'agent') {
        timers.push(
          setTimeout(() => setShowTyping(true), msg.delay - 1200),
          setTimeout(() => {
            setShowTyping(false);
            setVisibleMessages((prev) => [...prev, index]);
          }, msg.delay),
        );
      } else {
        timers.push(
          setTimeout(() => {
            setVisibleMessages((prev) => [...prev, index]);
          }, msg.delay),
        );
      }
    });

    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, showTyping]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mt-20 relative max-w-5xl mx-auto"
    >
      {/* Glow border */}
      <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 blur-xl" />

      {/* Browser frame */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0a0a18]/90 backdrop-blur-sm overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs text-white/30 bg-white/[0.05] rounded-md px-3 py-1">
              app.luneo.app/dashboard
            </span>
          </div>
        </div>

        {/* Panels */}
        <div className="flex flex-col md:flex-row min-h-[420px]">
          {/* Left: Chat */}
          <div className="w-full md:w-[60%] border-b md:border-b-0 md:border-r border-white/[0.06] flex flex-col bg-white/[0.02]">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <span className="text-sm font-medium text-white">Agent Luneo</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white/40">En ligne</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[320px] scrollbar-thin">
              {visibleMessages.map((msgIndex) => {
                const msg = CHAT_SCRIPT[msgIndex];
                const isUser = msg.role === 'user';
                return (
                  <motion.div
                    key={msgIndex}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${isUser ? 'justify-end' : 'items-start gap-2'}`}
                  >
                    {!isUser && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mt-0.5">
                        <Brain className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-500/80 to-cyan-500/80 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white/[0.05] border border-white/[0.08] text-white/80 rounded-2xl rounded-tl-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                );
              })}
              {showTyping && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5">
                <span className="flex-1 text-sm text-white/25">Écrivez votre message...</span>
                <Send className="w-4 h-4 text-white/20" />
              </div>
            </div>
          </div>

          {/* Right: Metrics */}
          <div className="w-full md:w-[40%] p-5 flex flex-col gap-3 bg-white/[0.01]">
            <h3 className="text-sm font-semibold text-white/70 mb-1">Performance temps réel</h3>

            <div className="grid grid-cols-1 gap-2.5 flex-1">
              {/* Conversations actives */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Conversations actives</p>
                  <p className="text-xl font-bold text-white">
                    <MetricCounter target={24} inView={isInView} />
                  </p>
                </div>
                <SparklineSVG />
              </div>

              {/* Temps de reponse */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Temps de réponse</p>
                  <p className="text-xl font-bold text-white">
                    <MetricCounter target={1.2} suffix="s" decimals={1} inView={isInView} />
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs font-medium">-18%</span>
                </div>
              </div>

              {/* Taux de resolution */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40">Taux de résolution</p>
                  <p className="text-lg font-bold text-white">
                    <MetricCounter target={94} suffix="%" inView={isInView} />
                  </p>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '94%' } : {}}
                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Satisfaction */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 mb-0.5">Satisfaction</p>
                  <p className="text-xl font-bold text-white">
                    <MetricCounter target={4.8} suffix="/5" decimals={1} inView={isInView} />
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-yellow-400/40 fill-yellow-400/40'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 border border-white/[0.06]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-white/50 font-medium">IA alimentée par vos données</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
