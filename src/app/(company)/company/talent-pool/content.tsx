// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { useI18n } from "@/store/i18n-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Users,
	Plus,
	Mail,
	Star,
	Clock,
	Grid3X3,
	List,
	Eye,
	UserPlus,
	Search,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { toast } from "sonner";

import {
	mockPools,
	mockCandidates,
	recentActivities,
	categoryColors,
} from "./components/mock-data";
import type { Pool, Candidate, PoolCategory } from "./components/types";
import TalentPoolList from "./components/TalentPoolList";
import TalentPoolFilters from "./components/TalentPoolFilters";
import CandidateCard from "./components/CandidateCard";
import RecentActivities from "./components/RecentActivities";
import CreatePoolDialog from "./components/CreatePoolDialog";
import AddToPoolDialog from "./components/AddToPoolDialog";
import EngageDialog from "./components/EngageDialog";
import ProfileDialog from "./components/ProfileDialog";

export default function TalentPoolContent() {
	const { t } = useI18n();
	const tp = t.talentPool as Record<string, string>;

	const [searchQuery, setSearchQuery] = useState("");
	const [filterPool, setFilterPool] = useState<string>("all");
	const [filterCategory, setFilterCategory] = useState<string>("all");
	const [filterSkills, setFilterSkills] = useState<string>("");
	const [filterAvailability, setFilterAvailability] = useState<string>("all");
	const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

	const [createPoolOpen, setCreatePoolOpen] = useState(false);
	const [newPoolName, setNewPoolName] = useState("");
	const [newPoolDescription, setNewPoolDescription] = useState("");
	const [newPoolCategory, setNewPoolCategory] =
		useState<PoolCategory>("General");

	const [addToPoolOpen, setAddToPoolOpen] = useState(false);
	const [selectedCandidateForPool, setSelectedCandidateForPool] =
		useState<Candidate | null>(null);
	const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);
	const [addToPoolNotes, setAddToPoolNotes] = useState("");
	const [addToPoolTags, setAddToPoolTags] = useState("");

	const [engageOpen, setEngageOpen] = useState(false);
	const [engageCandidate, setEngageCandidate] = useState<Candidate | null>(
		null,
	);
	const [engageAction, setEngageAction] = useState<
		"email" | "call" | "note" | "job" | null
	>(null);
	const [emailTemplate, setEmailTemplate] = useState("");
	const [emailBody, setEmailBody] = useState("");
	const [callNotes, setCallNotes] = useState("");
	const [noteText, setNoteText] = useState("");
	const [reassignJob, setReassignJob] = useState("");

	const [profileOpen, setProfileOpen] = useState(false);
	const [profileCandidate, setProfileCandidate] = useState<Candidate | null>(
		null,
	);

	const [pools, setPools] = useState<Pool[]>(mockPools);
	const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);

	const stats = useMemo(
		() => ({
			totalCandidates: candidates.length,
			activePools: pools.length,
			engagedThisMonth: candidates.filter(
				(c) =>
					c.lastContacted.includes("day") || c.lastContacted.includes("hour"),
			).length,
			avgTimeInPool: "47 days",
		}),
		[candidates, pools],
	);

	const filteredCandidates = useMemo(() => {
		return candidates.filter((c) => {
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				const matchesName = c.name.toLowerCase().includes(q);
				const matchesTitle = c.currentTitle.toLowerCase().includes(q);
				const matchesSkills = c.skills.some((s) => s.toLowerCase().includes(q));
				if (!matchesName && !matchesTitle && !matchesSkills) return false;
			}
			if (filterPool !== "all" && !c.poolIds.includes(filterPool)) return false;
			if (filterCategory !== "all") {
				const poolsInCategory = pools
					.filter((p) => p.category === filterCategory)
					.map((p) => p.id);
				if (!c.poolIds.some((pid) => poolsInCategory.includes(pid)))
					return false;
			}
			if (filterSkills) {
				const skillQ = filterSkills.toLowerCase();
				if (!c.skills.some((s) => s.toLowerCase().includes(skillQ)))
					return false;
			}
			if (filterAvailability !== "all" && c.availability !== filterAvailability)
				return false;
			return true;
		});
	}, [
		candidates,
		searchQuery,
		filterPool,
		filterCategory,
		filterSkills,
		filterAvailability,
		pools,
	]);

	const handleCreatePool = () => {
		if (!newPoolName.trim()) return;
		const newPool: Pool = {
			id: `pool-${Date.now()}`,
			name: newPoolName,
			description: newPoolDescription,
			category: newPoolCategory,
			memberCount: 0,
			lastActivity: "Just now",
			memberIds: [],
		};
		setPools((prev) => [...prev, newPool]);
		setCreatePoolOpen(false);
		setNewPoolName("");
		setNewPoolDescription("");
		setNewPoolCategory("General");
		toast.success(tp.createPool + " ✓");
	};

	const handleAddToPool = () => {
		if (!selectedCandidateForPool || selectedPoolIds.length === 0) return;
		setCandidates((prev) =>
			prev.map((c) => {
				if (c.id === selectedCandidateForPool.id) {
					return {
						...c,
						poolIds: [...new Set([...c.poolIds, ...selectedPoolIds])],
					};
				}
				return c;
			}),
		);
		setPools((prev) =>
			prev.map((p) => {
				if (selectedPoolIds.includes(p.id)) {
					return {
						...p,
						memberCount: p.memberCount + 1,
						lastActivity: "Just now",
					};
				}
				return p;
			}),
		);
		setAddToPoolOpen(false);
		setSelectedPoolIds([]);
		setAddToPoolNotes("");
		setAddToPoolTags("");
		toast.success(tp.addToPool + " ✓");
	};

	const handleRemoveFromPool = (candidateId: string, poolId: string) => {
		setCandidates((prev) =>
			prev.map((c) => {
				if (c.id === candidateId) {
					return { ...c, poolIds: c.poolIds.filter((id) => id !== poolId) };
				}
				return c;
			}),
		);
		setPools((prev) =>
			prev.map((p) => {
				if (p.id === poolId) {
					return { ...p, memberCount: Math.max(0, p.memberCount - 1) };
				}
				return p;
			}),
		);
		toast.success(tp.removeFromPool + " ✓");
	};

	const handleEngage = () => {
		if (!engageCandidate || !engageAction) return;
		const actionLabels: Record<string, string> = {
			email: tp.sendEmail,
			call: tp.scheduleCall,
			note: tp.addNote,
			job: tp.reassignJob,
		};
		toast.success(`${actionLabels[engageAction]} ✓`);
		setEngageOpen(false);
		setEngageAction(null);
		setEmailBody("");
		setCallNotes("");
		setNoteText("");
		setReassignJob("");
	};

	const openEngage = (candidate: Candidate) => {
		setEngageCandidate(candidate);
		setEngageOpen(true);
		setEngageAction(null);
	};

	const openAddToPool = (candidate: Candidate) => {
		setSelectedCandidateForPool(candidate);
		setSelectedPoolIds(candidate.poolIds);
		setAddToPoolNotes("");
		setAddToPoolTags("");
		setAddToPoolOpen(true);
	};

	const openProfile = (candidate: Candidate) => {
		setProfileCandidate(candidate);
		setProfileOpen(true);
	};

	const handleSelectPool = (poolId: string) => {
		setFilterPool(poolId === filterPool ? "all" : poolId);
	};

	const handleClearFilters = () => {
		setFilterPool("all");
		setFilterCategory("all");
		setFilterAvailability("all");
		setFilterSkills("");
		setSearchQuery("");
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
						<Users className="h-5 w-5" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{tp.title}</h1>
						<p className="text-sm text-muted-foreground">{tp.subtitle}</p>
					</div>
				</div>
				<Button
					className="bg-blue-600 hover:bg-blue-700 text-white"
					onClick={() => setCreatePoolOpen(true)}
				>
					<Plus className="h-4 w-4 me-2" />
					{tp.createPool}
				</Button>
			</div>

			{/* Stats Row */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-teal-950 text-blue-600">
								<Users className="h-4 w-4" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{tp.totalCandidates}
								</p>
								<p className="text-xl font-bold">{stats.totalCandidates}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600">
								<Star className="h-4 w-4" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{tp.activePools}
								</p>
								<p className="text-xl font-bold">{stats.activePools}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
								<Mail className="h-4 w-4" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{tp.engagedMonth}
								</p>
								<p className="text-xl font-bold">{stats.engagedThisMonth}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-teal-950 text-slate-600">
								<Clock className="h-4 w-4" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{tp.avgTimeInPool}
								</p>
								<p className="text-xl font-bold">{stats.avgTimeInPool}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Pools Section */}
			<TalentPoolList
				pools={pools}
				filterPool={filterPool}
				onSelectPool={handleSelectPool}
				t={tp}
			/>

			{/* Candidate List Section */}
			<div>
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
					<h2 className="text-lg font-semibold flex items-center gap-2">
						<Users className="h-4 w-4 text-blue-600" />
						{tp.totalCandidates} ({filteredCandidates.length})
					</h2>
					<div className="flex items-center gap-2">
						<Tabs
							value={viewMode}
							onValueChange={(v) => setViewMode(v as "grid" | "table")}
						>
							<TabsList className="h-8">
								<TabsTrigger value="grid" className="text-xs px-2 h-6">
									<Grid3X3 className="h-3 w-3" />
								</TabsTrigger>
								<TabsTrigger value="table" className="text-xs px-2 h-6">
									<List className="h-3 w-3" />
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</div>

				{/* Filters */}
				<TalentPoolFilters
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					filterPool={filterPool}
					onFilterPoolChange={setFilterPool}
					filterCategory={filterCategory}
					onFilterCategoryChange={setFilterCategory}
					filterAvailability={filterAvailability}
					onFilterAvailabilityChange={setFilterAvailability}
					filterSkills={filterSkills}
					onFilterSkillsChange={setFilterSkills}
					onClearFilters={handleClearFilters}
					pools={pools}
					t={tp}
				/>

				{/* Candidate Grid */}
				{viewMode === "grid" ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
						{filteredCandidates.map((candidate) => (
							<CandidateCard
								key={candidate.id}
								candidate={candidate}
								pools={pools}
								onAddToPool={openAddToPool}
								onEngage={openEngage}
								onViewProfile={openProfile}
								t={tp}
							/>
						))}
						{filteredCandidates.length === 0 && (
							<div className="col-span-full">
								<Card className="border-border/50">
									<CardContent className="p-8 text-center">
										<Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
										<p className="text-sm text-muted-foreground">
											{tp.noCandidates}
										</p>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				) : (
					/* Table View */
					<Card className="border-border/50">
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-border/50">
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												{tp.title}
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												Skills
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												Match
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												{tp.lastContacted}
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												Pools
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												{tp.category}
											</th>
											<th className="text-start text-xs font-medium text-muted-foreground p-3">
												{t.common.actions}
											</th>
										</tr>
									</thead>
									<tbody>
										{filteredCandidates.map((candidate) => (
											<tr
												key={candidate.id}
												className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
												onClick={() => openProfile(candidate)}
											>
												<td className="p-3">
													<div className="flex items-center gap-2">
														<Avatar className="h-7 w-7">
															<AvatarFallback className="bg-blue-600 text-white text-[9px]">
																{getInitials(candidate.name)}
															</AvatarFallback>
														</Avatar>
														<div>
															<span className="text-sm font-medium block">
																{candidate.name}
															</span>
															<span className="text-[10px] text-muted-foreground">
																{candidate.currentTitle}
															</span>
														</div>
													</div>
												</td>
												<td className="p-3">
													<div className="flex flex-wrap gap-1">
														{candidate.skills.slice(0, 3).map((s) => (
															<Badge
																key={s}
																variant="outline"
																className="text-[9px] px-1 py-0 border-slate-200 text-blue-700"
															>
																{s}
															</Badge>
														))}
													</div>
												</td>
												<td className="p-3">
													<Badge className="text-[10px] bg-slate-50 text-blue-700 dark:bg-teal-950 border-0">
														{candidate.matchScore}%
													</Badge>
												</td>
												<td className="p-3">
													<span className="text-xs text-muted-foreground">
														{candidate.lastContacted}
													</span>
												</td>
												<td className="p-3">
													<div className="flex flex-wrap gap-1">
														{candidate.poolIds.slice(0, 2).map((pid) => {
															const pool = pools.find((p) => p.id === pid);
															return pool ? (
																<Badge
																	key={pid}
																	className={cn(
																		"text-[9px]",
																		categoryColors[pool.category],
																	)}
																>
																	{pool.name}
																</Badge>
															) : null;
														})}
														{candidate.poolIds.length > 2 && (
															<Badge
																variant="outline"
																className="text-[9px] px-1 py-0"
															>
																+{candidate.poolIds.length - 2}
															</Badge>
														)}
													</div>
												</td>
												<td className="p-3">
													<Badge
														variant="outline"
														className="text-[9px] px-1 py-0"
													>
														{candidate.availability}
													</Badge>
												</td>
												<td className="p-3">
													<div
														className="flex items-center gap-1"
														onClick={(e) => e.stopPropagation()}
													>
														<Button
															variant="ghost"
															size="sm"
															className="h-7 px-2 text-xs"
															onClick={() => openAddToPool(candidate)}
														>
															<UserPlus className="h-3 w-3" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="h-7 px-2 text-xs text-blue-600"
															onClick={() => openEngage(candidate)}
														>
															<Mail className="h-3 w-3" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="h-7 px-2 text-xs"
															onClick={() => openProfile(candidate)}
														>
															<Eye className="h-3 w-3" />
														</Button>
													</div>
												</td>
											</tr>
										))}
										{filteredCandidates.length === 0 && (
											<tr>
												<td colSpan={7} className="p-8 text-center">
													<Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
													<p className="text-sm text-muted-foreground">
														{tp.noCandidates}
													</p>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Recent Nurture Activities */}
			<RecentActivities activities={recentActivities} t={tp} />

			{/* =================== DIALOGS =================== */}

			<CreatePoolDialog
				open={createPoolOpen}
				onOpenChange={setCreatePoolOpen}
				poolName={newPoolName}
				onPoolNameChange={setNewPoolName}
				poolDescription={newPoolDescription}
				onPoolDescriptionChange={setNewPoolDescription}
				poolCategory={newPoolCategory}
				onPoolCategoryChange={setNewPoolCategory}
				onConfirm={handleCreatePool}
				t={tp}
			/>

			<AddToPoolDialog
				open={addToPoolOpen}
				onOpenChange={setAddToPoolOpen}
				candidate={selectedCandidateForPool}
				pools={pools}
				selectedPoolIds={selectedPoolIds}
				onSelectedPoolIdsChange={setSelectedPoolIds}
				notes={addToPoolNotes}
				onNotesChange={setAddToPoolNotes}
				tags={addToPoolTags}
				onTagsChange={setAddToPoolTags}
				onConfirm={handleAddToPool}
				t={tp}
			/>

			<EngageDialog
				open={engageOpen}
				onOpenChange={setEngageOpen}
				candidate={engageCandidate}
				engageAction={engageAction}
				onEngageActionChange={setEngageAction}
				emailTemplate={emailTemplate}
				onEmailTemplateChange={setEmailTemplate}
				emailBody={emailBody}
				onEmailBodyChange={setEmailBody}
				callNotes={callNotes}
				onCallNotesChange={setCallNotes}
				noteText={noteText}
				onNoteTextChange={setNoteText}
				reassignJob={reassignJob}
				onReassignJobChange={setReassignJob}
				onConfirm={handleEngage}
				t={tp}
			/>

			<ProfileDialog
				open={profileOpen}
				onOpenChange={setProfileOpen}
				candidate={profileCandidate}
				pools={pools}
				onRemoveFromPool={handleRemoveFromPool}
				onAddToPool={(candidate) => {
					setProfileOpen(false);
					openAddToPool(candidate);
				}}
				onEngage={(candidate) => {
					setProfileOpen(false);
					openEngage(candidate);
				}}
				t={tp}
			/>
		</div>
	);
}
