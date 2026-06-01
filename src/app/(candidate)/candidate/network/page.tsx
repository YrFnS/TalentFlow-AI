// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  Eye,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type TabKey = 'all' | 'suggestions' | 'pending' | 'connected';

interface SuggestedConnection {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  mutualConnections: number;
}

interface PendingRequest {
  id: string;
  name: string;
  avatar: string;
  title: string;
}

interface RecentConnection {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  connectedDate: string;
}



export default function NetworkPage() {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState<SuggestedConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [recentConnections, setRecentConnections] = useState<RecentConnection[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchNetworkData() {
      try {
        const res = await fetch('/api/candidate/network');
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setPendingRequests(data.pendingRequests || []);
          setRecentConnections(data.recentConnections || []);
        }
      } catch {
        // Error handled silently
      }
    }
    fetchNetworkData();
  }, []);

  // Stats
  const totalConnections = recentConnections.length;
  const pendingCount = pendingRequests.length;
  const suggestionsCount = suggestions.length;
  const profileViews = 0;

  const filteredSuggestions = suggestions.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPending = pendingRequests.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecent = recentConnections.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.network.title}</h1>
            <p className="text-sm text-muted-foreground">{t.network.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.network.totalConnections}</p>
                <p className="text-xl font-bold">{totalConnections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.network.pendingRequests}</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.network.suggestions}</p>
                <p className="text-xl font-bold">{suggestionsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 ">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.network.profileViews}</p>
                <p className="text-xl font-bold">{profileViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Tabs */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.network.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">{t.network.all}</TabsTrigger>
            <TabsTrigger value="suggestions">{t.network.suggestions}</TabsTrigger>
            <TabsTrigger value="pending">{t.network.pending}</TabsTrigger>
            <TabsTrigger value="connected">{t.network.connected}</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-6 mt-4">
            {/* Suggested Connections */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                {t.network.suggestedForYou}
              </h3>
              {filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No suggestions found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Connect with more people to get personalized suggestions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuggestions.map((person) => (
                  <Card key={person.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.company}</p>
                          <p className="text-[10px] text-blue-600 mt-1">
                            {person.mutualConnections} {t.network.mutualConnections}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3 border-slate-300 text-blue-700 hover:bg-slate-50"
                      >
                        <UserPlus className="h-3.5 w-3.5 me-1.5" />
                        {t.network.connect}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>

            {/* Pending Requests */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-amber-500" />
                {t.network.pendingRequests}
              </h3>
              {filteredPending.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">No pending requests</p>
                </div>
              ) : (
              <div className="space-y-2">
                {filteredPending.map((person) => (
                  <Card key={person.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.title}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950/30">
                            <CheckCircle2 className="h-3 w-3 me-1" />
                            {t.network.accept}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30">
                            <XCircle className="h-3 w-3 me-1" />
                            {t.network.decline}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </div>

            {/* Recent Connections */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                {t.network.recentConnections}
              </h3>
              {filteredRecent.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">No connections yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Start connecting with professionals in your field</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRecent.map((person) => (
                  <Card key={person.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {person.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.company}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{person.connectedDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </div>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-4">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No suggestions found</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuggestions.map((person) => (
                <Card key={person.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {person.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.company}</p>
                        <p className="text-[10px] text-blue-600 mt-1">
                          {person.mutualConnections} {t.network.mutualConnections}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 border-slate-300 text-blue-700 hover:bg-slate-50"
                    >
                      <UserPlus className="h-3.5 w-3.5 me-1.5" />
                      {t.network.connect}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-4">
            {filteredPending.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No pending requests</p>
              </div>
            ) : (
            <div className="space-y-2">
              {filteredPending.map((person) => (
                <Card key={person.id} className="border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {person.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{person.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950/30">
                          <CheckCircle2 className="h-3 w-3 me-1" />
                          {t.network.accept}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30">
                          <XCircle className="h-3 w-3 me-1" />
                          {t.network.decline}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Connected Tab */}
          <TabsContent value="connected" className="mt-4">
            {filteredRecent.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No connections yet</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRecent.map((person) => (
                <Card key={person.id} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {person.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.company}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{person.connectedDate}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
