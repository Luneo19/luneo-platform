/**
 * Filtres pour la page Team
 */

'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/useI18n';

interface TeamFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
}

export function TeamFilters({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: TeamFiltersProps) {
  const { t } = useI18n();
  return (
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <Input
              placeholder={t('dashboard.team.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-white border-gray-200 text-gray-900 pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="bg-white border-gray-200 text-gray-900">
              <SelectValue placeholder={t('dashboard.team.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.team.allRoles')}</SelectItem>
              <SelectItem value="OWNER">{t('dashboard.team.roles.owner')}</SelectItem>
              <SelectItem value="ADMIN">{t('dashboard.team.roles.admin')}</SelectItem>
              <SelectItem value="MEMBER">{t('dashboard.team.roles.member')}</SelectItem>
              <SelectItem value="VIEWER">{t('dashboard.team.roles.viewer')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}

