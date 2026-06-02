// @ts-nocheck
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Star,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { ReferenceCheckItem } from './types';
import StarRating from './StarRating';
import StatusTimeline from './StatusTimeline';

interface ReferenceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCheck: ReferenceCheckItem | null;
  rt: Record<string, string>;
  commonT: Record<string, string>;
  onResendRequest: (rc: ReferenceCheckItem) => void;
  onMarkExpired: (rc: ReferenceCheckItem) => void;
}

export default function ReferenceDetailDialog({
  open,
  onOpenChange,
  selectedCheck,
  rt,
  commonT,
  onResendRequest,
  onMarkExpired,
}: ReferenceDetailDialogProps) {
  const getRelationshipLabel = (rel: string): string => {
    const keyMap: Record<string, string> = {
      Manager: rt.relationshipManager,
      Colleague: rt.relationshipColleague,
      'Direct Report': rt.relationshipDirectReport,
      Other: rt.relationshipOther,
    };
    return keyMap[rel] || rel;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            {rt.viewDetails}
          </DialogTitle>
        </DialogHeader>
        {selectedCheck && (
          <div className="space-y-6 py-2">
            {/* Status Timeline */}
            <div className="flex justify-center py-2">
              <StatusTimeline status={selectedCheck.status} t={rt} />
            </div>

            {/* Candidate Info Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {rt.candidateName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(selectedCheck.candidateName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="font-semibold">{selectedCheck.candidateName}</p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedCheck.candidateEmail}
                    </div>
                    {selectedCheck.candidateCurrentTitle && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {selectedCheck.candidateCurrentTitle}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reference Info Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  {rt.referenceName}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.referenceName}</p>
                      <p className="font-medium">{selectedCheck.referenceName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.referenceEmail}</p>
                      <p className="font-medium">{selectedCheck.referenceEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.referencePhone}</p>
                      <p className="font-medium">{selectedCheck.referencePhone || '\u2014'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.referenceTitle}</p>
                      <p className="font-medium">{selectedCheck.referenceTitle || '\u2014'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.company}</p>
                      <p className="font-medium">{selectedCheck.referenceCompany || '\u2014'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{rt.relationship}</p>
                      <p className="font-medium">{getRelationshipLabel(selectedCheck.relationship)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rating Display */}
            {selectedCheck.rating !== null && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    {rt.rating}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-3">
                    <StarRating rating={selectedCheck.rating} size="lg" />
                    <span className="text-2xl font-bold text-blue-600">{selectedCheck.rating}/5</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions & Responses */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                {rt.questions} & {rt.responses}
              </h3>
              <div className="space-y-3">
                {(selectedCheck.responses || selectedCheck.questions).map((item, i) => (
                  <Card key={item.id} className="border-border/50">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        {i + 1}. {item.question}
                      </p>
                      {item.response ? (
                        <p className="text-sm text-muted-foreground">{item.response}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {rt.noResponse || 'No response yet'}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              {(selectedCheck.status === 'Pending' || selectedCheck.status === 'Sent' || selectedCheck.status === 'Expired') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-slate-200 text-blue-700 hover:bg-slate-50 dark:hover:bg-teal-950"
                  onClick={() => onResendRequest(selectedCheck)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {rt.resendRequest}
                </Button>
              )}
              {(selectedCheck.status === 'Pending' || selectedCheck.status === 'Sent') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  onClick={() => onMarkExpired(selectedCheck)}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {rt.markExpired}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
