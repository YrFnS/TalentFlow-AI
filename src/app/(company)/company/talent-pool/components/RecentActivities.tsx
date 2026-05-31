// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Mail, Briefcase, Users, Clock } from 'lucide-react';
import type { RecentActivity } from './types';

interface RecentActivitiesProps {
  activities: RecentActivity[];
  t: Record<string, string>;
}

export default function RecentActivities({ activities, t }: RecentActivitiesProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        Recent Nurture Activities
      </h2>
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {activities.map(activity => (
              <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-muted/10 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  {activity.type === 'interview' ? <Phone className="h-3.5 w-3.5" /> :
                   activity.type === 'email' ? <Mail className="h-3.5 w-3.5" /> :
                   activity.type === 'offer' ? <Briefcase className="h-3.5 w-3.5" /> :
                   <Users className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{activity.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
