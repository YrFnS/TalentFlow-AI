// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Users, Sparkles, Loader2, Send } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { mockPastCandidates, mockJobs } from './mock-data';
import CandidateCard from './candidate-card';
import type { PastCandidate } from './types';

interface RediscoveryTabProps {
  tr: Record<string, string>;
  formatDate: (dateStr: string) => string;
  getAvailabilityBadge: (availability: PastCandidate['availability']) => React.ReactNode;
  onReEngage: (candidate: PastCandidate) => void;
}

export default function RediscoveryTab({ tr, formatDate, getAvailabilityBadge, onReEngage }: RediscoveryTabProps) {
  const [searchSkills, setSearchSkills] = useState('');
  const [searchExpMin, setSearchExpMin] = useState('');
  const [searchExpMax, setSearchExpMax] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchJobTitle, setSearchJobTitle] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PastCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState('');
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<PastCandidate[]>([]);
  const [hasRecommended, setHasRecommended] = useState(false);

  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/talent-rediscovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: searchSkills,
          experienceMin: searchExpMin ? parseInt(searchExpMin) : undefined,
          experienceMax: searchExpMax ? parseInt(searchExpMax) : undefined,
          location: searchLocation,
          jobTitle: searchJobTitle,
          companyId: 'demo-company',
        }),
      });
      const data = await res.json();
      setSearchResults(data.candidates || mockPastCandidates);
    } catch {
      setSearchResults(mockPastCandidates);
      toast.error(tr.searching);
    } finally {
      setSearching(false);
    }
  };

  const handleRecommend = async () => {
    if (!selectedJobId) {
      toast.error(tr.noJobSelected);
      return;
    }
    setRecommending(true);
    setHasRecommended(true);
    try {
      const res = await fetch('/api/talent-rediscovery/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: selectedJobId, companyId: 'demo-company' }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || mockPastCandidates.slice(0, 4));
      toast.success(tr.recommendSuccess);
    } catch {
      setRecommendations(mockPastCandidates.slice(0, 4));
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-border/50 card-">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            {tr.searchCandidates}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">{tr.skillsLabel}</label>
              <Input
                placeholder={tr.skillsPlaceholder}
                value={searchSkills}
                onChange={(e) => setSearchSkills(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tr.experienceMinLabel}</label>
              <Input
                type="number"
                placeholder="0"
                value={searchExpMin}
                onChange={(e) => setSearchExpMin(e.target.value)}
                className="h-9 text-sm"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tr.experienceMaxLabel}</label>
              <Input
                type="number"
                placeholder="20"
                value={searchExpMax}
                onChange={(e) => setSearchExpMax(e.target.value)}
                className="h-9 text-sm"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tr.locationLabel}</label>
              <Input
                placeholder={tr.locationPlaceholder}
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tr.jobTitleLabel}</label>
              <Input
                placeholder={tr.jobTitlePlaceholder}
                value={searchJobTitle}
                onChange={(e) => setSearchJobTitle(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="w-full bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 h-9"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Search className="h-4 w-4 me-2" />}
                {searching ? tr.searching : tr.searchBtn}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            {tr.searchResults}
            <Badge variant="outline" className="text-[10px]">{searchResults.length}</Badge>
          </h3>
          {searchResults.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{tr.noResults}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((candidate, idx) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  index={idx}
                  tr={tr}
                  formatDate={formatDate}
                  getAvailabilityBadge={getAvailabilityBadge}
                  onReEngage={onReEngage}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendation Section */}
      <Card className="border-border/50 card-">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            {tr.aiRecommendation}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{tr.aiRecommendationDesc}</p>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{tr.selectJob}</label>
              <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={tr.noJobSelected} />
                </SelectTrigger>
                <SelectContent>
                  {mockJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRecommend}
              disabled={recommending}
              className="bg-gradient-to-r bg-blue-600 text-white hover:from-teal-600 hover:to-emerald-700 h-9"
            >
              {recommending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Sparkles className="h-4 w-4 me-2" />}
              {recommending ? tr.recommending : tr.recommendBtn}
            </Button>
          </div>

          {hasRecommended && recommendations.length > 0 && (
            <div className="space-y-3 pt-2">
              {recommendations.map((rec, idx) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 animate-fade-in-up" style={{ animationDelay: `${idx * 75}ms` }}>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-600 text-white text-[10px]">
                      {getInitials(rec.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{rec.name}</p>
                      <Badge className="bg-slate-50 text-blue-700 dark:bg-teal-950 border-0 text-[10px]">
                        {rec.matchScore}% {tr.matchScore}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{rec.currentTitle}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950 shrink-0"
                    onClick={() => onReEngage(rec)}
                  >
                    <Send className="h-3 w-3 me-1" />
                    {tr.reEngage}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
