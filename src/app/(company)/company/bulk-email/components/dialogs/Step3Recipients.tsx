// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import { Search } from 'lucide-react';
import type { Recipient } from '../types';

interface Step3Props {
  formSelectedRecipients: Set<string>;
  formSearchRecipients: string; setFormSearchRecipients: (v: string) => void;
  formFilterJob: string; setFormFilterJob: (v: string) => void;
  formFilterStatus: string; setFormFilterStatus: (v: string) => void;
  formFilterStage: string; setFormFilterStage: (v: string) => void;
  uniqueJobs: string[]; uniqueStages: string[];
  filteredRecipients: Recipient[];
  toggleRecipient: (id: string) => void;
  selectAllVisible: () => void; deselectAllVisible: () => void;
  t: { bulkEmail: Record<string, string> };
}

export default function Step3({ formSelectedRecipients, formSearchRecipients, setFormSearchRecipients,
  formFilterJob, setFormFilterJob, formFilterStatus, setFormFilterStatus, formFilterStage, setFormFilterStage,
  uniqueJobs, uniqueStages, filteredRecipients, toggleRecipient, selectAllVisible, deselectAllVisible, t }: Step3Props) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{formSelectedRecipients.size} {t.bulkEmail.selectedRecipients}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600" onClick={selectAllVisible}>{t.bulkEmail.selectAll}</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAllVisible}>{t.bulkEmail.deselectAll}</Button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t.bulkEmail.searchRecipients} value={formSearchRecipients} onChange={(e) => setFormSearchRecipients(e.target.value)} className="ps-9 h-8 text-sm" />
        </div>
        <Select value={formFilterJob} onValueChange={setFormFilterJob}>
          <SelectTrigger className="w-full sm:w-40 h-8 text-xs"><SelectValue placeholder={t.bulkEmail.filterByJob} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.bulkEmail.filterByJob}</SelectItem>
            {uniqueJobs.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={formFilterStatus} onValueChange={setFormFilterStatus}>
          <SelectTrigger className="w-full sm:w-36 h-8 text-xs"><SelectValue placeholder={t.bulkEmail.filterByStatus} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.bulkEmail.filterByStatus}</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formFilterStage} onValueChange={setFormFilterStage}>
          <SelectTrigger className="w-full sm:w-36 h-8 text-xs"><SelectValue placeholder={t.bulkEmail.filterByStage} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.bulkEmail.filterByStage}</SelectItem>
            {uniqueStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="max-h-[300px]">
        <div className="space-y-1">
          {filteredRecipients.map(r => (
            <label key={r.id} className={cn('flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50', formSelectedRecipients.has(r.id) && 'bg-slate-50')}>
              <Checkbox checked={formSelectedRecipients.has(r.id)} onCheckedChange={() => toggleRecipient(r.id)} />
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-blue-600 text-white">{getInitials(r.name)}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{r.email}</p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-[10px] text-muted-foreground">{r.job}</p>
                <Badge className="text-[9px] bg-slate-50 text-slate-600 dark:bg-slate-950 dark:text-slate-400 border-0">{r.stage}</Badge>
              </div>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
