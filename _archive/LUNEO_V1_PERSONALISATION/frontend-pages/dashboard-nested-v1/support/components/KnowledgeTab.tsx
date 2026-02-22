'use client';

import { Search, BookOpen, Star, Eye, ThumbsUp, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  views?: number;
  helpful?: number;
  isFeatured?: boolean;
}

interface KnowledgeTabProps {
  kbSearch: string;
  setKbSearch: (v: string) => void;
  filteredKB: KBArticle[];
}

export function KnowledgeTab({ kbSearch, setKbSearch, filteredKB }: KnowledgeTabProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={kbSearch}
            onChange={(e) => setKbSearch(e.target.value)}
            placeholder={t('support.searchArticles')}
            className="pl-10 bg-white border-gray-200 text-gray-900"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder={t('support.category')} />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900">
            <SelectItem value="all">{t('library.filters.all')}</SelectItem>
            <SelectItem value="getting-started">Démarrage</SelectItem>
            <SelectItem value="troubleshooting">Dépannage</SelectItem>
            <SelectItem value="features">Fonctionnalités</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredKB.length === 0 ? (
        <Card className="p-12 bg-white border-gray-200 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('support.noArticle')}</h3>
          <p className="text-gray-600">{kbSearch ? t('support.noResultsSearch') : t('support.noArticlesAvailable')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKB.map((article: KBArticle, index: number) => (
            <motion
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 bg-white border-gray-200 hover:border-gray-300 transition-all cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs border-gray-200">
                    {article.category}
                  </Badge>
                  {article.isFeatured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h3>
                {article.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{article.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {article.helpful ?? 0}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    {t('support.read')} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion>
          ))}
        </div>
      )}
    </div>
  );
}
