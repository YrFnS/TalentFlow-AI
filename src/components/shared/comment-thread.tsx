'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/store/i18n-store';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Reply,
  Pin,
  PinOff,
  CheckCircle2,
  RotateCcw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
  Smile,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface User {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
}

interface Reaction {
  id: string;
  emoji: string;
  user: { id: string; name: string };
}

interface CommentType {
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
  author: User;
  reactions: Reaction[];
  replies?: CommentType[];
}

interface Member {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
}

interface CommentThreadProps {
  comments: CommentType[];
  currentUserId: string;
  members: Member[];
  onAddComment: (data: { content: string; parentId?: string; mentions?: string[] }) => void;
  onEditComment: (id: string, data: { content: string }) => void;
  onDeleteComment: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onToggleResolve: (id: string, isResolved: boolean) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '🎉', '🚀', '💡'];

function MentionDropdown({
  members,
  search,
  onSelect,
  position,
}: {
  members: Member[];
  search: string;
  onSelect: (member: Member) => void;
  position: { top: number; left: number };
}) {
  const filtered = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) && search.length > 0
  );

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto w-56"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.slice(0, 8).map((member) => (
        <button
          key={member.id}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-start"
          onClick={() => onSelect(member)}
        >
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              {getInitials(member.name)}
            </AvatarFallback>
            {member.image && <AvatarImage src={member.image} />}
          </Avatar>
          <span>{member.name}</span>
        </button>
      ))}
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  members,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleResolve,
  onAddReaction,
  depth = 0,
}: {
  comment: CommentType;
  currentUserId: string;
  members: Member[];
  onReply: (parentId: string) => void;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onToggleResolve: (id: string, isResolved: boolean) => void;
  onAddReaction: (commentId: string, emoji: string) => void;
  depth?: number;
}) {
  const { t } = useI18n();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReactions, setShowReactions] = useState(false);

  const isOwn = comment.authorId === currentUserId;
  const timeAgo = getTimeAgo(comment.createdAt);

  // Group reactions by emoji
  const reactionGroups: Record<string, { emoji: string; count: number; hasOwn: boolean }> = {};
  for (const r of comment.reactions) {
    if (!reactionGroups[r.emoji]) {
      reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, hasOwn: false };
    }
    reactionGroups[r.emoji].count++;
    if (r.user.id === currentUserId) {
      reactionGroups[r.emoji].hasOwn = true;
    }
  }

  // Highlight @mentions in content
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w[\w\s]*\w|@\w)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-teal-600 dark:text-teal-400 font-medium bg-teal-50 dark:bg-teal-950/30 px-0.5 rounded">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onReply(comment.id);
    setReplyText('');
    setShowReplyInput(false);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    onEdit(comment.id, editText);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      'animate-fade-in-up',
      depth === 0 && comment.isPinned && 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-lg',
      comment.isResolved && 'opacity-70'
    )}>
      <div className={cn('flex gap-3', depth > 0 && 'ms-10 mt-3')}>
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
            {getInitials(comment.author.name)}
          </AvatarFallback>
          {comment.author.image && <AvatarImage src={comment.author.image} />}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {comment.isPinned && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                <Pin className="w-2.5 h-2.5 me-0.5" />
                {t.comments.pinned}
              </Badge>
            )}
            {comment.isResolved && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5 me-0.5" />
                {t.comments.resolved}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="mt-1 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs bg-teal-600 hover:bg-teal-700">
                  {t.common.save}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm leading-relaxed">
              {renderContent(comment.content)}
            </div>
          )}

          {/* Reactions bar */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {Object.values(reactionGroups).map((group) => (
              <button
                key={group.emoji}
                onClick={() => onAddReaction(comment.id, group.emoji)}
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
                  group.hasOwn
                    ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30'
                    : 'border-border hover:border-teal-300 dark:hover:border-teal-700'
                )}
              >
                <span>{group.emoji}</span>
                <span className="text-muted-foreground">{group.count}</span>
              </button>
            ))}

            {/* Add reaction */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground"
                onClick={() => setShowReactions(!showReactions)}
              >
                <Smile className="w-3.5 h-3.5" />
              </Button>
              {showReactions && (
                <div className="absolute bottom-6 start-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-1 flex gap-0.5">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors text-base"
                      onClick={() => {
                        onAddReaction(comment.id, emoji);
                        setShowReactions(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-teal-600"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="w-3 h-3 me-1" />
                {t.comments.reply}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {depth === 0 && (
                    <DropdownMenuItem onClick={() => onTogglePin(comment.id, !comment.isPinned)}>
                      {comment.isPinned ? (
                        <><PinOff className="w-3.5 h-3.5 me-2" />{t.comments.unpin}</>
                      ) : (
                        <><Pin className="w-3.5 h-3.5 me-2" />{t.comments.pinComment}</>
                      )}
                    </DropdownMenuItem>
                  )}
                  {depth === 0 && (
                    <DropdownMenuItem onClick={() => onToggleResolve(comment.id, !comment.isResolved)}>
                      {comment.isResolved ? (
                        <><RotateCcw className="w-3.5 h-3.5 me-2" />{t.comments.reopen}</>
                      ) : (
                        <><CheckCircle2 className="w-3.5 h-3.5 me-2" />{t.comments.resolveComment}</>
                      )}
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <DropdownMenuItem onClick={() => { setEditText(comment.content); setIsEditing(true); }}>
                      <Pencil className="w-3.5 h-3.5 me-2" />{t.comments.editComment}
                    </DropdownMenuItem>
                  )}
                  {isOwn && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(comment.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 me-2" />{t.comments.deleteComment}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t.comments.reply + '...'}
                className="min-h-[40px] text-sm"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyText.trim()}
                className="h-8 bg-teal-600 hover:bg-teal-700 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Nested replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  members={members}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                  onToggleResolve={onToggleResolve}
                  onAddReaction={onAddReaction}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function CommentThread({
  comments,
  currentUserId,
  members,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onTogglePin,
  onToggleResolve,
  onAddReaction,
  sortOrder,
  onSortChange,
}: CommentThreadProps) {
  const { t } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentions, setSelectedMentions] = useState<Member[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Handle @mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w[\w\s]*)$/);

    if (mentionMatch) {
      setMentionSearch(mentionMatch[1].trim());
      setShowMentionDropdown(true);
      const textarea = textareaRef.current;
      if (textarea) {
        const rect = textarea.getBoundingClientRect();
        setMentionPosition({
          top: -10,
          left: 10,
        });
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (member: Member) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const textAfterCursor = newComment.slice(cursorPos);

    const mentionMatch = textBeforeCursor.match(/@(\w[\w\s]*)$/);
    if (mentionMatch) {
      const beforeMention = textBeforeCursor.slice(0, textBeforeCursor.length - mentionMatch[0].length);
      const newText = beforeMention + `@${member.name} ` + textAfterCursor;
      setNewComment(newText);
      setSelectedMentions((prev) => prev.find((m) => m.id === member.id) ? prev : [...prev, member]);
    }

    setShowMentionDropdown(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment({
      content: newComment,
      mentions: selectedMentions.map((m) => m.id),
    });
    setNewComment('');
    setSelectedMentions([]);
  };

  // Separate comments into categories
  const pinnedComments = comments.filter((c) => c.isPinned && !c.parentId);
  const activeComments = comments.filter((c) => !c.isPinned && !c.isResolved && !c.parentId);
  const resolvedComments = comments.filter((c) => c.isResolved && !c.isPinned && !c.parentId);

  const sortedActive = sortOrder === 'newest'
    ? [...activeComments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [...activeComments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="space-y-4">
      {/* New comment input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={handleInputChange}
          placeholder={t.comments.addComment}
          className="min-h-[80px] text-sm resize-none"
        />
        {showMentionDropdown && (
          <MentionDropdown
            members={members}
            search={mentionSearch}
            onSelect={handleMentionSelect}
            position={mentionPosition}
          />
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t.comments.mentionUser}: @</span>
            {selectedMentions.map((m) => (
              <Badge key={m.id} variant="outline" className="text-[10px] h-5 border-teal-300 text-teal-700 dark:border-teal-700 dark:text-teal-400">
                @{m.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              {sortOrder === 'newest' ? t.comments.newestFirst : t.comments.oldestFirst}
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="h-7 text-xs bg-teal-600 hover:bg-teal-700"
            >
              <MessageSquare className="w-3 h-3 me-1" />
              {t.common.submit}
            </Button>
          </div>
        </div>
      </div>

      {/* Pinned comments */}
      {pinnedComments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <Pin className="w-3.5 h-3.5" />
            {t.comments.pinned} ({pinnedComments.length})
          </div>
          {pinnedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              members={members}
              onReply={(parentId) => onAddComment({ content: '', parentId })}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onTogglePin={onTogglePin}
              onToggleResolve={onToggleResolve}
              onAddReaction={onAddReaction}
            />
          ))}
        </div>
      )}

      {/* Active comments */}
      {sortedActive.length > 0 ? (
        <div className="space-y-4">
          {sortedActive.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              members={members}
              onReply={(parentId) => onAddComment({ content: '', parentId })}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onTogglePin={onTogglePin}
              onToggleResolve={onToggleResolve}
              onAddReaction={onAddReaction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t.comments.noComments}</p>
        </div>
      )}

      {/* Resolved comments (collapsed) */}
      {resolvedComments.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? <ChevronUp className="w-3.5 h-3.5 me-1" /> : <ChevronDown className="w-3.5 h-3.5 me-1" />}
            {t.comments.resolved} ({resolvedComments.length})
          </Button>
          {showResolved && (
            <div className="space-y-4 mt-2">
              {resolvedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  members={members}
                  onReply={(parentId) => onAddComment({ content: '', parentId })}
                  onEdit={onEditComment}
                  onDelete={onDeleteComment}
                  onTogglePin={onTogglePin}
                  onToggleResolve={onToggleResolve}
                  onAddReaction={onAddReaction}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
