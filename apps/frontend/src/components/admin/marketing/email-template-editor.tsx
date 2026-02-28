/**
 * ★★★ EMAIL TEMPLATE EDITOR ★★★
 * Éditeur d'email template avec 3 modes: Visual, HTML, Code (Markdown)
 */

'use client';

import React, { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Code, FileText, Save, Send, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmailTemplateEditorProps {
  initialSubject?: string;
  initialContent?: string;
  initialMode?: 'visual' | 'html' | 'code';
  onSave?: (data: { subject: string; html: string; text?: string }) => void;
  onSendTest?: (email: string) => void;
  className?: string;
}

const AVAILABLE_VARIABLES = [
  { key: '{{name}}', label: 'Customer Name' },
  { key: '{{email}}', label: 'Customer Email' },
  { key: '{{plan}}', label: 'Plan Name' },
  { key: '{{company}}', label: 'Company Name' },
  { key: '{{trialEnds}}', label: 'Trial End Date' },
  { key: '{{loginUrl}}', label: 'Login URL' },
];

export function EmailTemplateEditor({
  initialSubject = '',
  initialContent = '',
  initialMode = 'visual',
  onSave,
  onSendTest,
  className,
}: EmailTemplateEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html' | 'code'>(initialMode);
  const [subject, setSubject] = useState(initialSubject);
  const [visualContent, setVisualContent] = useState(initialContent);
  const [htmlContent, setHtmlContent] = useState(initialContent);
  const [markdownContent, setMarkdownContent] = useState(initialContent);
  const [testEmail, setTestEmail] = useState('');

  const insertVariable = useCallback((variable: string) => {
    if (mode === 'visual') {
      setVisualContent((prev) => prev + variable);
    } else if (mode === 'html') {
      setHtmlContent((prev) => prev + variable);
    } else {
      setMarkdownContent((prev) => prev + variable);
    }
  }, [mode]);

  const markdownToHtml = useCallback((markdown: string): string => {
    // Conversion Markdown basique vers HTML
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n/gim, '<br />');
  }, []);

  const handleSave = useCallback(() => {
    let finalHtml = '';
    if (mode === 'visual') {
      finalHtml = visualContent.replace(/\n/g, '<br />');
    } else if (mode === 'html') {
      finalHtml = htmlContent;
    } else {
      finalHtml = markdownToHtml(markdownContent);
    }

    if (onSave) {
      onSave({
        subject,
        html: finalHtml,
        text: finalHtml.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });
    }
  }, [mode, subject, visualContent, htmlContent, markdownContent, markdownToHtml, onSave]);

  const handleSendTest = useCallback(() => {
    if (onSendTest && testEmail) {
      onSendTest(testEmail);
    }
  }, [onSendTest, testEmail]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Email Template Editor</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Créez votre template d'email avec 3 modes d'édition
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSendTest && (
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-48 bg-zinc-900 border-zinc-700"
              />
              <Button variant="outline" onClick={handleSendTest} disabled={!testEmail}>
                <Send className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            </div>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Subject */}
      <div>
        <Label className="text-zinc-400">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="bg-zinc-900 border-zinc-700 text-white mt-2"
        />
      </div>

      {/* Variables */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_VARIABLES.map((variable) => (
              <Button
                key={variable.key}
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable.key)}
                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
              >
                <Plus className="w-3 h-3 mr-1" />
                {variable.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editor Tabs */}
      <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="visual" className="data-[state=active]:bg-zinc-700">
            <Eye className="w-4 h-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="html" className="data-[state=active]:bg-zinc-700">
            <Code className="w-4 h-4 mr-2" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-zinc-700">
            <FileText className="w-4 h-4 mr-2" />
            Markdown
          </TabsTrigger>
        </TabsList>

        {/* Visual Mode */}
        <TabsContent value="visual" className="mt-6">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <Textarea
                value={visualContent}
                onChange={(e) => setVisualContent(e.target.value)}
                placeholder="Write your email content here..."
                className="min-h-[400px] bg-zinc-900 border-zinc-700 text-white font-mono"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Mode Visual: Écrivez votre contenu, les sauts de ligne seront convertis en HTML
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HTML Mode */}
        <TabsContent value="html" className="mt-6">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<html>...</html>"
                className="min-h-[400px] bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Mode HTML: Écrivez votre HTML directement
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markdown Mode */}
        <TabsContent value="code" className="mt-6">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <Textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="# Title\n\n**Bold** text and *italic* text..."
                className="min-h-[400px] bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Mode Markdown: Écrivez en Markdown, sera converti en HTML
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="bg-white text-black p-6 rounded-lg min-h-[200px]"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                mode === 'visual'
                  ? visualContent.replace(/\n/g, '<br />')
                  : mode === 'html'
                  ? htmlContent
                  : markdownToHtml(markdownContent),
                { ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','a','img','div','span','strong','em','b','i','u','ul','ol','li','table','tr','td','th','thead','tbody','hr','blockquote','pre','code'], ALLOWED_ATTR: ['href','src','alt','style','class','width','height','target','rel'] }
              ),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
