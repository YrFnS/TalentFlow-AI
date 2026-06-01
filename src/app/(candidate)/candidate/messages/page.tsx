// @ts-nocheck
'use client'

import React, { useState } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  Plus,
  Star,
  StarOff,
  ArrowLeft,
  Send,
  Search,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: string;
  senderCompany: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  unread: boolean;
  starred: boolean;
  avatar: string;
}

const avatarGradients = [
  'from-teal-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-cyan-400 to-emerald-500',
  'bg-blue-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-teal-600',
];

type FilterTab = 'all' | 'unread' | 'starred';

export default function MessagesPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === 'unread') return msg.unread && matchesSearch;
    if (filterTab === 'starred') return msg.starred && matchesSearch;
    return matchesSearch;
  });

  const unreadCount = messages.filter(m => m.unread).length;

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: !m.starred } : m));
  };

  const selectMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (msg.unread) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, unread: false } : m));
    }
  };

  const handleCompose = () => {
    setComposeOpen(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.messages.title}</h1>
            <p className="text-sm text-muted-foreground">{t.messages.subtitle}</p>
          </div>
        </div>
        <Button className="bg-gradient-to-r bg-blue-600 hover:from-teal-600 hover:to-emerald-700 text-white" onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          {t.messages.compose}
        </Button>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[60vh]">
        {/* Message List */}
        <div className={cn(
          'lg:col-span-2 space-y-3',
          selectedMessage && 'hidden lg:block'
        )}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.messages.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-9"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['all', 'unread', 'starred'] as FilterTab[]).map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                size="sm"
                className={cn(
                  'flex-1 h-8 text-xs',
                  filterTab === tab && 'bg-gradient-to-r bg-blue-600 text-white'
                )}
                onClick={() => setFilterTab(tab)}
              >
                {tab === 'all' && t.messages.all}
                {tab === 'unread' && (
                  <span className="flex items-center gap-1">
                    {t.messages.unread}
                    {unreadCount > 0 && <Badge className="bg-white/20 text-white border-0 text-[9px] px-1 py-0">{unreadCount}</Badge>}
                  </span>
                )}
                {tab === 'starred' && t.messages.starred}
              </Button>
            ))}
          </div>

          {/* Messages */}
          <div className="space-y-1.5 max-h-[65vh] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">{t.messages.noMessages}</p>
              </div>
            ) : (
              filteredMessages.map((msg, i) => (
                <Card
                  key={msg.id}
                  className={cn(
                    'cursor-pointer border-border/50 transition-colors hover:bg-accent/50',
                    selectedMessage?.id === msg.id && 'border-slate-300 bg-slate-50'
                  )}
                  onClick={() => selectMessage(msg)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-xs font-bold',
                        avatarGradients[i % avatarGradients.length]
                      )}>
                        {msg.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('text-sm truncate', msg.unread ? 'font-bold' : 'font-medium')}>{msg.sender}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{msg.date}</span>
                        </div>
                        <p className={cn('text-xs truncate', msg.unread ? 'font-semibold' : 'text-muted-foreground')}>{msg.subject}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        {msg.unread && <div className="w-2 h-2 rounded-full bg-slate-500" />}
                        <button onClick={(e) => toggleStar(msg.id, e)} className="text-muted-foreground hover:text-amber-500 transition-colors">
                          {msg.starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className={cn(
          'lg:col-span-3',
          !selectedMessage && 'hidden lg:block'
        )}>
          {selectedMessage ? (
            <Card className="h-full border-border/50">
              <CardContent className="p-6">
                {/* Mobile back button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mb-3"
                  onClick={() => setSelectedMessage(null)}
                >
                  <ArrowLeft className="h-4 w-4 me-1" />
                  {t.messages.back}
                </Button>

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold',
                      avatarGradients[(messages.findIndex(m => m.id === selectedMessage.id)) % avatarGradients.length]
                    )}>
                      {selectedMessage.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{selectedMessage.sender}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedMessage.senderCompany}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedMessage.date}</span>
                    <button onClick={(e) => toggleStar(selectedMessage.id, e)} className="text-muted-foreground hover:text-amber-500 transition-colors">
                      {selectedMessage.starred ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <StarOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold mb-4">{selectedMessage.subject}</h2>

                <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line border-t border-border/50 pt-4">
                  {selectedMessage.body}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    {t.messages.reply}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    {t.messages.forward}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border-border/50 flex items-center justify-center">
              <CardContent className="p-6 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">{t.messages.selectMessage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              {t.messages.compose}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t.messages.to}</Label>
              <Input
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder={t.messages.toPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.messages.subjectLabel}</Label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder={t.messages.subjectPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.messages.messageLabel}</Label>
              <Textarea
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder={t.messages.messagePlaceholder}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>{t.common.cancel}</Button>
            <Button className="bg-gradient-to-r bg-blue-600 text-white" onClick={handleCompose}>
              <Send className="h-4 w-4 me-2" />
              {t.messages.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
