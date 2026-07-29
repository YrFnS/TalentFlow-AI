import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && Boolean(item))
      : [];
  } catch {
    return [];
  }
}

export default async function CompanyJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { role?: string; companyId?: string | null }
    | undefined;
  if (!user?.role) notFound();

  const { id } = await params;
  const job = await db.job.findFirst({
    where: isPlatformAdmin(user.role)
      ? { id }
      : user.companyId
        ? { id, companyId: user.companyId }
        : { id: '__forbidden__' },
    include: {
      company: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  const requirements = parseList(job.requirements);
  const responsibilities = parseList(job.responsibilities);
  const benefits = parseList(job.benefits);
  const skills = parseList(job.skills);
  const salary =
    job.salaryMin || job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin?.toLocaleString() ?? '—'} – ${job.salaryMax?.toLocaleString() ?? '—'}`
      : 'Not specified';

  const details = [
    { icon: MapPin, label: job.location || 'Not specified' },
    { icon: DollarSign, label: salary },
    {
      icon: Users,
      label: `${job._count.applications} applicants · ${job.openings} opening${job.openings === 1 ? '' : 's'}`,
    },
    {
      icon: Calendar,
      label: job.deadline
        ? `Deadline ${job.deadline.toLocaleDateString()}`
        : 'No deadline',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/company/jobs" aria-label="Back to jobs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <p className="text-sm text-muted-foreground">{job.company.name}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {job.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {details.map(({ icon: Icon, label }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm text-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap leading-7 text-muted-foreground">
            {job.description}
          </p>
        </CardContent>
      </Card>

      {[
        ['Responsibilities', responsibilities],
        ['Requirements', requirements],
        ['Benefits', benefits],
        ['Skills', skills],
      ]
        .filter(([, items]) => (items as string[]).length > 0)
        .map(([title, items]) => (
          <Card key={title as string}>
            <CardHeader>
              <CardTitle>{title as string}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 ps-5 text-muted-foreground">
                {(items as string[]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

      <p className="text-xs text-muted-foreground">
        Created by {job.createdBy.name} on {job.createdAt.toLocaleDateString()}
      </p>
    </div>
  );
}
