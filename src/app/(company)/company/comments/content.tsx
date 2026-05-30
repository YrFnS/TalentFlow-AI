'use client';

import React, { useState, useMemo } from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  AtSign,
  AlertCircle,
  Pin,
  CheckCircle2,
  Users,
  FileText,
  Briefcase,
  Video,
  Search,
} from 'lucide-react';
import CommentThread from '@/components/shared/comment-thread';

// Types
interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface MockReaction {
  id: string;
  emoji: string;
  user: { id: string; name: string };
}

interface MockComment {
  id: string;
  entityType: string;
  entityId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  mentions: string | null;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: MockUser;
  reactions: MockReaction[];
  replies: MockComment[];
}

// Mock data
const MOCK_MEMBERS: MockUser[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah@techvision.com', image: null },
  { id: 'u2', name: 'Marcus Brown', email: 'marcus@techvision.com', image: null },
  { id: 'u3', name: 'Priya Sharma', email: 'priya@techvision.com', image: null },
  { id: 'u4', name: 'David Kim', email: 'david@techvision.com', image: null },
  { id: 'u5', name: 'Lisa Park', email: 'lisa@techvision.com', image: null },
  { id: 'u6', name: 'Tom Anderson', email: 'tom@techvision.com', image: null },
  { id: 'u7', name: 'Emily Zhang', email: 'emily@techvision.com', image: null },
  { id: 'u8', name: 'Ryan Cooper', email: 'ryan@techvision.com', image: null },
];

const ENTITY_OPTIONS = {
  APPLICATION: [
    { id: 'app1', label: 'APP-001: Sarah Chen → Sr. Frontend Eng' },
    { id: 'app2', label: 'APP-002: Marcus Brown → Product Designer' },
    { id: 'app3', label: 'APP-003: Priya Sharma → Backend Dev' },
    { id: 'app4', label: 'APP-004: David Kim → DevOps Engineer' },
  ],
  CANDIDATE: [
    { id: 'cand1', label: 'Sarah Chen' },
    { id: 'cand2', label: 'Marcus Brown' },
    { id: 'cand3', label: 'Priya Sharma' },
  ],
  JOB: [
    { id: 'job1', label: 'Senior Frontend Engineer' },
    { id: 'job2', label: 'Product Designer' },
    { id: 'job3', label: 'Backend Developer' },
  ],
  INTERVIEW: [
    { id: 'int1', label: 'INT-001: Sarah Chen - Technical' },
    { id: 'int2', label: 'INT-002: Marcus Brown - Cultural' },
  ],
};

const INITIAL_COMMENTS: MockComment[] = [
  {
    id: 'cm1', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u1',
    parentId: null, content: '@Marcus Brown This candidate looks very promising! The frontend skills are strong and the portfolio is impressive. Let\'s schedule a technical interview.', mentions: '["u2"]',
    isPinned: true, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    author: MOCK_MEMBERS[0], reactions: [
      { id: 'r1', emoji: '👍', user: { id: 'u2', name: 'Marcus Brown' } },
      { id: 'r2', emoji: '🚀', user: { id: 'u3', name: 'Priya Sharma' } },
    ],
    replies: [
      {
        id: 'cm1r1', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u2',
        parentId: 'cm1', content: 'Agreed! I\'ll set up the interview for this week. @Priya Sharma can you prepare the technical assessment?', mentions: '["u3"]',
        isPinned: false, isResolved: false,
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        author: MOCK_MEMBERS[1], reactions: [
          { id: 'r3', emoji: '💡', user: { id: 'u1', name: 'Sarah Chen' } },
        ], replies: [],
      },
      {
        id: 'cm1r2', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u3',
        parentId: 'cm1', content: 'Sure! I\'ll have it ready by tomorrow morning.', mentions: null,
        isPinned: false, isResolved: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 3600000).toISOString(),
        author: MOCK_MEMBERS[2], reactions: [], replies: [],
      },
    ],
  },
  {
    id: 'cm2', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u4',
    parentId: null, content: 'I reviewed the resume and there are some concerns about the gap in employment from 2021-2022. @Lisa Park can you verify the references?', mentions: '["u5"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    author: MOCK_MEMBERS[3], reactions: [
      { id: 'r4', emoji: '❤️', user: { id: 'u5', name: 'Lisa Park' } },
    ],
    replies: [
      {
        id: 'cm2r1', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u5',
        parentId: 'cm2', content: 'On it! I\'ll reach out to the references today.', mentions: null,
        isPinned: false, isResolved: false,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        author: MOCK_MEMBERS[4], reactions: [], replies: [],
      },
    ],
  },
  {
    id: 'cm3', entityType: 'APPLICATION', entityId: 'app2', authorId: 'u1',
    parentId: null, content: 'The portfolio is excellent but salary expectations are above our budget. Let\'s discuss in the next hiring sync.', mentions: null,
    isPinned: false, isResolved: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
    author: MOCK_MEMBERS[0], reactions: [], replies: [],
  },
  {
    id: 'cm4', entityType: 'APPLICATION', entityId: 'app3', authorId: 'u2',
    parentId: null, content: '@Tom Anderson Great referral! The backend experience is solid. Moving to next stage.', mentions: '["u6"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    author: MOCK_MEMBERS[1], reactions: [
      { id: 'r5', emoji: '🎉', user: { id: 'u6', name: 'Tom Anderson' } },
      { id: 'r6', emoji: '👍', user: { id: 'u1', name: 'Sarah Chen' } },
    ],
    replies: [],
  },
  {
    id: 'cm5', entityType: 'JOB', entityId: 'job1', authorId: 'u3',
    parentId: null, content: 'We need to update the job description to include TypeScript experience as a requirement. The market has shifted.', mentions: null,
    isPinned: true, isResolved: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    author: MOCK_MEMBERS[2], reactions: [
      { id: 'r7', emoji: '💡', user: { id: 'u1', name: 'Sarah Chen' } },
      { id: 'r8', emoji: '👍', user: { id: 'u4', name: 'David Kim' } },
    ],
    replies: [
      {
        id: 'cm5r1', entityType: 'JOB', entityId: 'job1', authorId: 'u1',
        parentId: 'cm5', content: 'Good point. @David Kim can you update the JD?', mentions: '["u4"]',
        isPinned: false, isResolved: false,
        createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 2.5).toISOString(),
        author: MOCK_MEMBERS[0], reactions: [], replies: [],
      },
    ],
  },
  {
    id: 'cm6', entityType: 'INTERVIEW', entityId: 'int1', authorId: 'u4',
    parentId: null, content: 'The candidate scored 85/100 on the technical assessment. Strong on algorithms, needs improvement on system design.', mentions: null,
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    author: MOCK_MEMBERS[3], reactions: [
      { id: 'r9', emoji: '🚀', user: { id: 'u2', name: 'Marcus Brown' } },
    ],
    replies: [],
  },
  {
    id: 'cm7', entityType: 'APPLICATION', entityId: 'app4', authorId: 'u5',
    parentId: null, content: '@Ryan Cooper Can you review the DevOps application? The Kubernetes experience looks relevant.', mentions: '["u8"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    author: MOCK_MEMBERS[4], reactions: [], replies: [],
  },
  {
    id: 'cm8', entityType: 'CANDIDATE', entityId: 'cand1', authorId: 'u6',
    parentId: null, content: 'I referred Sarah through the employee referral program. She\'s a former colleague and exceptional frontend dev.', mentions: null,
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString(),
    author: MOCK_MEMBERS[5], reactions: [
      { id: 'r10', emoji: '❤️', user: { id: 'u1', name: 'Sarah Chen' } },
    ],
    replies: [],
  },
  {
    id: 'cm9', entityType: 'APPLICATION', entityId: 'app1', authorId: 'u7',
    parentId: null, content: 'The background check came back clean. We can proceed with the offer. @Sarah Chen', mentions: '["u1"]',
    isPinned: false, isResolved: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    author: MOCK_MEMBERS[6], reactions: [
      { id: 'r11', emoji: '🎉', user: { id: 'u1', name: 'Sarah Chen' } },
    ],
    replies: [],
  },
  {
    id: 'cm10', entityType: 'JOB', entityId: 'job2', authorId: 'u8',
    parentId: null, content: 'We\'ve received 45 applications for the Product Designer role. Quality is mixed. @Marcus Brown can you help screen?', mentions: '["u2"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    author: MOCK_MEMBERS[7], reactions: [], replies: [],
  },
  {
    id: 'cm11', entityType: 'APPLICATION', entityId: 'app3', authorId: 'u1',
    parentId: null, content: 'Let\'s move Priya to the final round. The technical interview went very well.', mentions: null,
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    author: MOCK_MEMBERS[0], reactions: [
      { id: 'r12', emoji: '👍', user: { id: 'u3', name: 'Priya Sharma' } },
      { id: 'r13', emoji: '🎉', user: { id: 'u2', name: 'Marcus Brown' } },
    ],
    replies: [],
  },
  {
    id: 'cm12', entityType: 'INTERVIEW', entityId: 'int2', authorId: 'u2',
    parentId: null, content: 'Cultural fit assessment for Marcus Brown - very collaborative, great communication skills. Recommending hire.', mentions: null,
    isPinned: false, isResolved: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    author: MOCK_MEMBERS[1], reactions: [], replies: [],
  },
  {
    id: 'cm13', entityType: 'APPLICATION', entityId: 'app2', authorId: 'u3',
    parentId: null, content: '@Emily Zhang Can you prepare the offer letter for Marcus? We got budget approval.', mentions: '["u7"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    author: MOCK_MEMBERS[2], reactions: [
      { id: 'r14', emoji: '🚀', user: { id: 'u7', name: 'Emily Zhang' } },
    ],
    replies: [],
  },
  {
    id: 'cm14', entityType: 'JOB', entityId: 'job3', authorId: 'u4',
    parentId: null, content: 'Backend Developer position closing this Friday. Please submit all final evaluations by Thursday EOD.', mentions: null,
    isPinned: true, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    author: MOCK_MEMBERS[3], reactions: [
      { id: 'r15', emoji: '💡', user: { id: 'u8', name: 'Ryan Cooper' } },
    ],
    replies: [],
  },
  {
    id: 'cm15', entityType: 'APPLICATION', entityId: 'app4', authorId: 'u8',
    parentId: null, content: 'DevOps application looks strong. 5 years of Kubernetes experience. @David Kim want to pair interview?', mentions: '["u4"]',
    isPinned: false, isResolved: false,
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(), updatedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    author: MOCK_MEMBERS[7], reactions: [], replies: [],
  },
];

const ENTITY_TYPE_ICONS: Record<string, React.ElementType> = {
  APPLICATION: FileText,
  CANDIDATE: Users,
  JOB: Briefcase,
  INTERVIEW: Video,
};

export default function CommentsContent() {
  const { t } = useI18n();
  const [comments, setComments] = useState<MockComment[]>(INITIAL_COMMENTS);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('APPLICATION');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('app1');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<string>('comments');

  const currentUserId = 'u1';

  // Filter comments for selected entity
  const entityComments = useMemo(
    () => comments.filter((c) => c.entityType === selectedEntityType && c.entityId === selectedEntityId && !c.parentId),
    [comments, selectedEntityType, selectedEntityId]
  );

  // Get my mentions
  const myMentions = useMemo(
    () => comments.filter((c) => {
      try {
        const mentionedIds = c.mentions ? JSON.parse(c.mentions) : [];
        return Array.isArray(mentionedIds) && mentionedIds.includes(currentUserId);
      } catch {
        return false;
      }
    }),
    [comments]
  );

  // Stats
  const totalComments = comments.filter((c) => !c.parentId).length;
  const unresolvedThreads = comments.filter((c) => !c.isResolved && !c.parentId).length;
  const myMentionsCount = myMentions.length;

  const handleAddComment = (data: { content: string; parentId?: string; mentions?: string[] }) => {
    const newComment: MockComment = {
      id: `cm_${Date.now()}`,
      entityType: selectedEntityType,
      entityId: selectedEntityId,
      authorId: currentUserId,
      parentId: data.parentId || null,
      content: data.content,
      mentions: data.mentions ? JSON.stringify(data.mentions) : null,
      isPinned: false,
      isResolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: MOCK_MEMBERS[0],
      reactions: [],
      replies: [],
    };

    if (data.parentId) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === data.parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          // Check replies
          if (c.replies) {
            return { ...c, replies: c.replies.map((r) => r.id === data.parentId ? { ...r, replies: [...(r.replies || []), newComment] } : r) };
          }
          return c;
        })
      );
      toast.success(t.comments.replyAdded);
    } else {
      setComments((prev) => [newComment, ...prev]);
      toast.success(t.comments.commentAdded);
    }
  };

  const handleEditComment = (id: string, content: string) => {
    setComments((prev) =>
      prev.map((c) => c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c)
    );
    toast.success(t.comments.commentUpdated);
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id).map((c) => ({
      ...c,
      replies: c.replies?.filter((r) => r.id !== id) || [],
    })));
    toast.success(t.comments.commentDeleted);
  };

  const handleTogglePin = (id: string, isPinned: boolean) => {
    setComments((prev) =>
      prev.map((c) => c.id === id ? { ...c, isPinned } : c)
    );
    toast.success(isPinned ? t.comments.commentPinned : t.comments.commentUnpinned);
  };

  const handleToggleResolve = (id: string, isResolved: boolean) => {
    setComments((prev) =>
      prev.map((c) => c.id === id ? { ...c, isResolved } : c)
    );
    toast.success(isResolved ? t.comments.threadResolved : t.comments.threadReopened);
  };

  const handleAddReaction = (commentId: string, emoji: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const existing = c.reactions.find((r) => r.emoji === emoji && r.user.id === currentUserId);
          if (existing) {
            return { ...c, reactions: c.reactions.filter((r) => r.id !== existing.id) };
          }
          return {
            ...c,
            reactions: [
              ...c.reactions,
              { id: `r_${Date.now()}`, emoji, user: { id: currentUserId, name: 'Sarah Chen' } },
            ],
          };
        }
        // Check replies
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const existing = r.reactions.find((rx) => rx.emoji === emoji && rx.user.id === currentUserId);
                if (existing) {
                  return { ...r, reactions: r.reactions.filter((rx) => rx.id !== existing.id) };
                }
                return {
                  ...r,
                  reactions: [
                    ...r.reactions,
                    { id: `r_${Date.now()}`, emoji, user: { id: currentUserId, name: 'Sarah Chen' } },
                  ],
                };
              }
              return r;
            }),
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t.comments.title}</h1>
        <p className="text-muted-foreground mt-1">{t.comments.subtitle}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalComments}</p>
              <p className="text-xs text-muted-foreground">{t.comments.totalComments}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unresolvedThreads}</p>
              <p className="text-xs text-muted-foreground">{t.comments.unresolvedThreads}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover-lift">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <AtSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{myMentionsCount}</p>
              <p className="text-xs text-muted-foreground">{t.comments.myMentions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="comments">{t.comments.title}</TabsTrigger>
          <TabsTrigger value="mentions">
            {t.comments.myMentions}
            {myMentionsCount > 0 && (
              <Badge className="ms-2 h-5 px-1.5 text-[10px] bg-teal-500 text-white">{myMentionsCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4 space-y-4">
          {/* Entity Type Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">{t.comments.entityType}</label>
                  <Select value={selectedEntityType} onValueChange={(val) => { setSelectedEntityType(val); setSelectedEntityId(''); }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPLICATION">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5" />
                          {t.comments.typeApplication}
                        </div>
                      </SelectItem>
                      <SelectItem value="CANDIDATE">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          {t.comments.typeCandidate}
                        </div>
                      </SelectItem>
                      <SelectItem value="JOB">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" />
                          {t.comments.typeJob}
                        </div>
                      </SelectItem>
                      <SelectItem value="INTERVIEW">
                        <div className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5" />
                          {t.comments.typeInterview}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">{t.comments.selectEntity}</label>
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.comments.selectEntity} />
                    </SelectTrigger>
                    <SelectContent>
                      {(ENTITY_OPTIONS[selectedEntityType as keyof typeof ENTITY_OPTIONS] || []).map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          <div className="flex items-center gap-2">
                            {React.createElement(ENTITY_TYPE_ICONS[selectedEntityType] || FileText, { className: 'w-3.5 h-3.5' })}
                            {entity.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment Thread */}
          {selectedEntityId ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {React.createElement(ENTITY_TYPE_ICONS[selectedEntityType] || FileText, { className: 'w-4 h-4 text-teal-600 dark:text-teal-400' })}
                  {selectedEntityType === 'APPLICATION' && 'Application'}
                  {selectedEntityType === 'CANDIDATE' && 'Candidate'}
                  {selectedEntityType === 'JOB' && 'Job'}
                  {selectedEntityType === 'INTERVIEW' && 'Interview'}
                  {' '}Comments
                </CardTitle>
                <CardDescription>
                  {entityComments.length} comment{entityComments.length !== 1 ? 's' : ''} • {entityComments.filter(c => !c.isResolved).length} unresolved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommentThread
                  comments={entityComments}
                  currentUserId={currentUserId}
                  members={MOCK_MEMBERS}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  onTogglePin={handleTogglePin}
                  onToggleResolve={handleToggleResolve}
                  onAddReaction={handleAddReaction}
                  sortOrder={sortOrder}
                  onSortChange={setSortOrder}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>{t.comments.selectEntity}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mentions" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AtSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {t.comments.myMentions}
              </CardTitle>
              <CardDescription>
                Comments where you are @mentioned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myMentions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {myMentions.map((mention) => {
                    const Icon = ENTITY_TYPE_ICONS[mention.entityType] || FileText;
                    return (
                      <div key={mention.id} className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <Avatar className="w-8 h-8 shrink-0">
                          <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
                            {getInitials(mention.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{mention.author.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              <Icon className="w-2.5 h-2.5 me-0.5" />
                              {mention.entityType}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(mention.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5 text-muted-foreground line-clamp-2">{mention.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AtSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t.comments.noMentions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
