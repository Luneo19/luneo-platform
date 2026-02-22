'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { api, endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Bot,
  Settings,
  Eye,
  Loader2,
} from 'lucide-react';

const TONE_OPTIONS = [
  { value: 'PROFESSIONAL', label: 'Professionnel' },
  { value: 'FRIENDLY', label: 'Amical' },
  { value: 'FORMAL', label: 'Formel' },
  { value: 'CASUAL', label: 'Décontracté' },
  { value: 'EMPATHETIC', label: 'Empathique' },
  { value: 'ENTHUSIASTIC', label: 'Enthousiaste' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'de', label: 'Allemand' },
  { value: 'it', label: 'Italien' },
] as const;

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B' },
] as const;

interface AgentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  systemPrompt?: string;
  defaultModel?: string;
  defaultTemperature?: number;
  maxTokensPerReply?: number;
}

interface FormData {
  name: string;
  description: string;
  tone: string;
  languages: string[];
  model: string;
  temperature: number;
  maxTokensPerReply: number;
  systemPrompt: string;
  customInstructions: string;
}

const DEFAULT_FORM: FormData = {
  name: '',
  description: '',
  tone: 'PROFESSIONAL',
  languages: ['fr'],
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokensPerReply: 1000,
  systemPrompt: '',
  customInstructions: '',
};

export default function AgentCreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const templateIdOrSlug = searchParams.get('templateId');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(!!templateIdOrSlug);
  const [createLoading, setCreateLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    if (!templateIdOrSlug) return;
    setTemplateLoading(true);
    try {
      const data = await api.get<AgentTemplate>(
        `/api/v1/agent-templates/${templateIdOrSlug}`
      );
      const tpl = (data as { data?: AgentTemplate })?.data ?? (data as AgentTemplate);
      setTemplate(tpl);
      setForm((prev) => ({
        ...prev,
        description: tpl.description || prev.description,
        systemPrompt: tpl.systemPrompt || prev.systemPrompt,
        model: tpl.defaultModel || prev.model,
        temperature: tpl.defaultTemperature ?? prev.temperature,
        maxTokensPerReply: tpl.maxTokensPerReply ?? prev.maxTokensPerReply,
      }));
    } catch {
      setTemplate(null);
    } finally {
      setTemplateLoading(false);
    }
  }, [templateIdOrSlug]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    if ('name' in updates) setNameError(null);
  };

  const toggleLanguage = (lang: string) => {
    setForm((prev) => {
      const next = prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang];
      return { ...prev, languages: next.length ? next : ['fr'] };
    });
  };

  const validateStep1 = () => {
    const trimmed = form.name.trim();
    if (!trimmed || trimmed.length < 1) {
      setNameError('Le nom est requis (min. 1 caractère)');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleCreate = async () => {
    if (!validateStep1()) return;
    setCreateLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        templateId: template?.id ?? undefined,
        model: form.model,
        temperature: form.temperature,
        maxTokensPerReply: form.maxTokensPerReply,
        tone: form.tone,
        languages: form.languages,
        systemPrompt: form.systemPrompt.trim() || undefined,
        customInstructions: form.customInstructions.trim() || undefined,
      };
      const res = await endpoints.agents.create(payload);
      const agent = res as { id?: string; data?: { id?: string } };
      const newId = agent?.id ?? agent?.data?.id;
      if (!newId) throw new Error('ID agent manquant');
      toast({
        title: 'Agent créé',
        description: 'Votre agent a été créé avec succès.',
      });
      router.push(`/agents/${newId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
      toast({
        title: 'Erreur',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/agents/new"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <h1 className="text-3xl font-bold text-white">Créer un agent</h1>
        <p className="mt-1 text-sm text-white/50">
          Étape {step} sur 3
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/50">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white/60">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Informations de base</span>
            </div>

            {templateLoading && (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement du template...
              </div>
            )}
            {template && !templateLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 px-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-lg">
                  {template.icon || '📋'}
                </div>
                <div>
                  <p className="text-xs text-white/40">Basé sur</p>
                  <p className="font-medium text-white">{template.name}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">
                Nom <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="Ex: Assistant Support Client"
                className="border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30"
              />
              {nameError && (
                <p className="text-sm text-red-400">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/80">
                Description
              </Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                placeholder="Décrivez le rôle et les objectifs de votre agent..."
                rows={4}
                className="border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Ton</Label>
              <Select
                value={form.tone}
                onValueChange={(v) => updateForm({ tone: v })}
              >
                <SelectTrigger className="border-white/[0.06] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.06] bg-gray-900">
                  {TONE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-white focus:bg-white/[0.1]"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-white/80">Langues</Label>
              <div className="flex flex-wrap gap-3">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <Checkbox
                      checked={form.languages.includes(opt.value)}
                      onCheckedChange={() => toggleLanguage(opt.value)}
                      className="border-white/30 data-[state=checked]:bg-purple-500"
                    />
                    <span className="text-sm text-white">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white/60">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Configuration IA</span>
            </div>

            <div className="space-y-2">
              <Label className="text-white/80">Modèle</Label>
              <Select
                value={form.model}
                onValueChange={(v) => updateForm({ model: v })}
              >
                <SelectTrigger className="border-white/[0.06] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.06] bg-gray-900">
                  {MODEL_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-white focus:bg-white/[0.1]"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="text-white/80">Température</Label>
                <span className="text-sm text-white/50">{form.temperature}</span>
              </div>
              <Slider
                value={[form.temperature]}
                onValueChange={([v]) => updateForm({ temperature: v ?? 0.3 })}
                min={0}
                max={1}
                step={0.1}
                className="[&_[data-orientation=horizontal]]:bg-white/[0.06]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens" className="text-white/80">
                Tokens max par réponse
              </Label>
              <Input
                id="maxTokens"
                type="number"
                min={100}
                max={4000}
                value={form.maxTokensPerReply}
                onChange={(e) =>
                  updateForm({
                    maxTokensPerReply: Math.min(
                      4000,
                      Math.max(100, parseInt(e.target.value, 10) || 1000)
                    ),
                  })
                }
                className="border-white/[0.06] bg-white/[0.03] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt" className="text-white/80">
                Prompt système
              </Label>
              <Textarea
                id="systemPrompt"
                value={form.systemPrompt}
                onChange={(e) => updateForm({ systemPrompt: e.target.value })}
                placeholder="Ex: Tu es un assistant support client expert..."
                rows={8}
                className="border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30 min-h-[180px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customInstructions" className="text-white/80">
                Instructions personnalisées (optionnel)
              </Label>
              <Textarea
                id="customInstructions"
                value={form.customInstructions}
                onChange={(e) =>
                  updateForm({ customInstructions: e.target.value })
                }
                placeholder="Instructions supplémentaires..."
                rows={3}
                className="border-white/[0.06] bg-white/[0.03] text-white placeholder:text-white/30"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-white/60">
              <Eye className="h-5 w-5" />
              <span className="font-medium">Récapitulatif</span>
            </div>

            <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div>
                <p className="text-xs text-white/40">Nom</p>
                <p className="font-medium text-white">{form.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Description</p>
                <p className="text-sm text-white/70">
                  {form.description || '—'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-xs text-white/40">Ton</p>
                <Badge variant="secondary" className="bg-white/[0.06] text-white/80">
                  {TONE_OPTIONS.find((t) => t.value === form.tone)?.label ?? form.tone}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-white/40">Langues</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {form.languages.map((l) => (
                    <Badge
                      key={l}
                      variant="secondary"
                      className="bg-white/[0.06] text-white/80"
                    >
                      {LANGUAGE_OPTIONS.find((o) => o.value === l)?.label ?? l}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40">Modèle</p>
                <p className="text-sm text-white/70">{form.model}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Température</p>
                <p className="text-sm text-white/70">{form.temperature}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Tokens max</p>
                <p className="text-sm text-white/70">{form.maxTokensPerReply}</p>
              </div>
              {form.systemPrompt && (
                <div>
                  <p className="text-xs text-white/40">Prompt système</p>
                  <p className="mt-1 max-h-24 overflow-y-auto text-sm text-white/60 line-clamp-4">
                    {form.systemPrompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 1}
          className="text-white/70 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        {step < 3 ? (
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={createLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
          >
            {createLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Créer l&apos;agent
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
