import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, DollarSign, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseList(value: string | null) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
	} catch {
		return [];
	}
}

export default async function CompanyJobDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const job = await db.job.findUnique({
		where: { id },
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
			? `${job.salaryCurrency} ${job.salaryMin?.toLocaleString() ?? "—"} – ${job.salaryMax?.toLocaleString() ?? "—"}`
			: "Not specified";

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="outline" size="icon">
						<Link href="/company/jobs" aria-label="Back to jobs"><ArrowLeft className="h-4 w-4" /></Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
						<p className="text-sm text-slate-500">{job.company.name}</p>
					</div>
				</div>
				<Badge variant="outline" className="text-sm">{job.status}</Badge>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{[
					[MapPin, job.location || "Not specified"],
					[DollarSign, salary],
					[Users, `${job._count.applications} applicants · ${job.openings} opening${job.openings === 1 ? "" : "s"}`],
					[Calendar, job.deadline ? `Deadline ${job.deadline.toLocaleDateString()}` : "No deadline"],
				].map(([Icon, label]) => (
					<Card key={String(label)}><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-indigo-600" /><span className="text-sm text-slate-700">{String(label)}</span></CardContent></Card>
				))}
			</div>

			<Card>
				<CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Job description</CardTitle></CardHeader>
				<CardContent><p className="whitespace-pre-wrap text-slate-700">{job.description}</p></CardContent>
			</Card>

			{[
				["Responsibilities", responsibilities],
				["Requirements", requirements],
				["Benefits", benefits],
				["Skills", skills],
			].filter(([, items]) => (items as unknown[]).length > 0).map(([title, items]) => (
				<Card key={String(title)}>
					<CardHeader><CardTitle>{String(title)}</CardTitle></CardHeader>
					<CardContent><ul className="list-disc space-y-2 ps-5 text-slate-700">{(items as string[]).map((item) => <li key={item}>{item}</li>)}</ul></CardContent>
				</Card>
			))}

			<p className="text-xs text-slate-500">Created by {job.createdBy.name} on {job.createdAt.toLocaleDateString()}</p>
		</div>
	);
}
