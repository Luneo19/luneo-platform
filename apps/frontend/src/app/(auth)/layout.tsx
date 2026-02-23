'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  MessageSquare,
  Heart,
  Shield,
  Lock,
  Server,
} from 'lucide-react';

const STATS = [
  { value: '2,450+', label: 'Agents déployés', icon: Brain },
  { value: '1M+', label: 'Conversations traitées', icon: MessageSquare },
  { value: '98%', label: 'Satisfaction client', icon: Heart },
];

const CHAT_MESSAGES = [
  { role: 'user' as const, text: 'Comment suivre ma commande ?' },
  { role: 'agent' as const, text: 'Votre commande #4521 est en cours de livraison...' },
];

const BADGES = [
  { icon: Shield, label: 'RGPD Conforme' },
  { icon: Lock, label: 'Chiffrement AES-256' },
  { icon: Server, label: 'Heberge en Europe' },
];

function StatCard({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex items-center gap-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm px-5 py-4"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/15 to-indigo-500/15">
        <Icon className="h-5 w-5 text-cyan-400" />
        <div className="absolute inset-0 rounded-lg bg-cyan-400/10 animate-pulse" />
      </div>
      <div className="relative">
        <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
          {value}
        </div>
        <div className="text-xs text-white/40 tracking-wide">{label}</div>
      </div>
    </motion.div>
  );
}

function ChatDemo() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setVisibleMessages(1), 800));
    timers.push(setTimeout(() => setVisibleMessages(2), 2200));
    timers.push(setTimeout(() => setShowBadge(true), 3200));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-medium text-white/50">Agent en ligne</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleMessages >= 1 && (
            <motion.div
              key="user-msg"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-indigo-500/20 border border-indigo-400/20 px-4 py-2.5">
                <p className="text-sm text-white/80">{CHAT_MESSAGES[0].text}</p>
              </div>
            </motion.div>
          )}

          {visibleMessages >= 2 && (
            <motion.div
              key="agent-msg"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/[0.05] border border-white/[0.08] px-4 py-2.5">
                <p className="text-sm text-white/80">{CHAT_MESSAGES[1].text}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {visibleMessages >= 2 && visibleMessages < 2 && (
          <div className="flex justify-start">
            <div className="flex gap-1 px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/30"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-400/15 py-2 px-3"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span className="text-xs text-cyan-300/80 font-medium">
              Reponse en 1.2s — Resolution automatique
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14"
        style={{ background: 'linear-gradient(to bottom right, #030014, #0a0a2a)' }}
      >
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Luneo
          </span>
        </Link>

        {/* Stats + chat */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10 max-w-md space-y-4">
          {STATS.map((stat, i) => (
            <StatCard key={i} {...stat} delay={i * 0.15} />
          ))}

          <div className="pt-2">
            <ChatDemo />
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 flex items-center gap-4">
          {BADGES.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-white/40" />
                <span className="text-xs text-white/40">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div
        className="flex-1 flex items-center justify-center px-5 py-10 lg:py-8"
        style={{ background: 'linear-gradient(to bottom, #030014, #0a0a2a)' }}
      >
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}
