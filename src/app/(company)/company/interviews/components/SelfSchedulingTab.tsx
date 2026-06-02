// @ts-nocheck
"use client";

import type React from "react";
import {
	Calendar,
	Clock,
	Settings2,
	CalendarClock,
	Plus,
	X,
	Zap,
	CheckCircle2,
	Copy,
	CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import type { AvailabilityConfig, SchedulingSlot } from "./types";
import { dayNames, timezones } from "./types";

interface SelfSchedulingTabProps {
	availability: AvailabilityConfig;
	setAvailability: React.Dispatch<React.SetStateAction<AvailabilityConfig>>;
	schedulingSlots: SchedulingSlot[];
	slotsLoading: boolean;
	savingAvailability: boolean;
	generatingSlots: boolean;
	daysToGenerate: string;
	onDaysToGenerateChange: (v: string) => void;
	copiedLink: string | null;
	onSaveAvailability: () => void;
	onGenerateSlots: () => void;
	onCopyLink: (token: string) => void;
	addAvailabilitySlot: () => void;
	removeAvailabilitySlot: (index: number) => void;
	updateAvailabilitySlot: (
		index: number,
		field: string,
		value: string | number,
	) => void;
	formatTime: (d: string) => string;
	t: Record<string, any>;
}

export default function SelfSchedulingTab({
	availability,
	setAvailability,
	schedulingSlots,
	slotsLoading,
	savingAvailability,
	generatingSlots,
	daysToGenerate,
	onDaysToGenerateChange,
	copiedLink,
	onSaveAvailability,
	onGenerateSlots,
	onCopyLink,
	addAvailabilitySlot,
	removeAvailabilitySlot,
	updateAvailabilitySlot,
	formatTime,
	t,
}: SelfSchedulingTabProps) {
	const ssStats = {
		total: schedulingSlots.length,
		available: schedulingSlots.filter((s) => s.status === "available").length,
		booked: schedulingSlots.filter((s) => s.status === "booked").length,
	};

	const groupedSlots = schedulingSlots.reduce(
		(groups, slot) => {
			const date = new Date(slot.startTime).toLocaleDateString(undefined, {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
			if (!groups[date]) groups[date] = [];
			groups[date].push(slot);
			return groups;
		},
		{} as Record<string, SchedulingSlot[]>,
	);

	return (
		<div className="space-y-6">
			{/* Stats */}
			<div className="grid grid-cols-3 gap-3">
				<Card className="border border-slate-200/30 card-">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-teal-100">
								<CalendarClock className="w-4 h-4 text-blue-700" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{t.selfScheduling.totalSlots}
								</p>
								<p className="text-xl font-bold">{ssStats.total}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border border-emerald-200 dark:border-emerald-800/30 card-">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
								<CheckCircle2 className="w-4 h-4 text-emerald-700" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{t.selfScheduling.availableSlots}
								</p>
								<p className="text-xl font-bold text-emerald-600">
									{ssStats.available}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border border-amber-200 dark:border-amber-800/30 card-">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
								<Calendar className="w-4 h-4 text-amber-700" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">
									{t.selfScheduling.bookedSlots}
								</p>
								<p className="text-xl font-bold text-amber-600">
									{ssStats.booked}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Sub-tabs */}
			<Tabs defaultValue="availability" className="space-y-6">
				<TabsList className="bg-muted/50">
					<TabsTrigger value="availability" className="gap-2">
						<Settings2 className="w-4 h-4" />
						{t.selfScheduling.availabilityTab}
					</TabsTrigger>
					<TabsTrigger value="slots" className="gap-2">
						<CalendarClock className="w-4 h-4" />
						{t.selfScheduling.slotsTab}
					</TabsTrigger>
				</TabsList>

				{/* Availability Settings */}
				<TabsContent
					value="availability"
					className="space-y-6 animate-fade-in-up"
				>
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								{t.selfScheduling.availabilitySettings}
							</CardTitle>
							<CardDescription>{t.selfScheduling.subtitle}</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										{t.selfScheduling.slotDuration}
									</Label>
									<Select
										value={String(availability.slotDuration)}
										onValueChange={(v) =>
											setAvailability((p) => ({
												...p,
												slotDuration: parseInt(v),
											}))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="15">
												15 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="30">
												30 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="45">
												45 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="60">
												60 {t.selfScheduling.minutes}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										{t.selfScheduling.bufferBetween}
									</Label>
									<Select
										value={String(availability.bufferBetween)}
										onValueChange={(v) =>
											setAvailability((p) => ({
												...p,
												bufferBetween: parseInt(v),
											}))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="0">
												0 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="5">
												5 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="10">
												10 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="15">
												15 {t.selfScheduling.minutes}
											</SelectItem>
											<SelectItem value="30">
												30 {t.selfScheduling.minutes}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										{t.selfScheduling.timezone}
									</Label>
									<Select
										value={availability.timezone}
										onValueChange={(v) =>
											setAvailability((p) => ({ ...p, timezone: v }))
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{timezones.map((tz) => (
												<SelectItem key={tz} value={tz}>
													{tz}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<Separator />

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<h4 className="text-sm font-semibold">
										{t.selfScheduling.dayOfWeek}
									</h4>
									<Button
										size="sm"
										variant="outline"
										className="text-blue-600 border-slate-300"
										onClick={addAvailabilitySlot}
									>
										<Plus className="w-3 h-3 me-1" />
										{t.common.create}
									</Button>
								</div>
								<div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
									{availability.slots.map((slot, idx) => (
										<div
											key={idx}
											className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-slate-300 transition-colors animate-fade-in-up"
										>
											<Select
												value={String(slot.dayOfWeek)}
												onValueChange={(v) =>
													updateAvailabilitySlot(idx, "dayOfWeek", parseInt(v))
												}
											>
												<SelectTrigger className="w-[130px] h-8">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{dayNames.map((day, i) => (
														<SelectItem key={i} value={String(i)}>
															{t.selfScheduling[day]}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<div className="flex items-center gap-2">
												<Input
													type="time"
													value={slot.startTime}
													onChange={(e) =>
														updateAvailabilitySlot(
															idx,
															"startTime",
															e.target.value,
														)
													}
													className="h-8 w-[110px]"
												/>
												<span className="text-muted-foreground text-xs">→</span>
												<Input
													type="time"
													value={slot.endTime}
													onChange={(e) =>
														updateAvailabilitySlot(
															idx,
															"endTime",
															e.target.value,
														)
													}
													className="h-8 w-[110px]"
												/>
											</div>
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ms-auto"
												onClick={() => removeAvailabilitySlot(idx)}
											>
												<X className="w-4 h-4" />
											</Button>
										</div>
									))}
									{availability.slots.length === 0 && (
										<p className="text-sm text-muted-foreground text-center py-4">
											{t.selfScheduling.noSlots}
										</p>
									)}
								</div>
							</div>

							<div className="flex justify-end pt-2">
								<Button
									className="bg-blue-600 hover:bg-blue-700 text-white"
									onClick={onSaveAvailability}
									disabled={savingAvailability}
								>
									{savingAvailability ? (
										<Loader2 className="w-4 h-4 me-2 animate-spin" />
									) : (
										<CheckCircle2 className="w-4 h-4 me-2" />
									)}
									{t.selfScheduling.saveAvailability}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Generate Slots */}
					<Card className="border-slate-200/30">
						<CardContent className="p-6">
							<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
								<div className="flex items-center gap-3">
									<div className="p-3 rounded-lg bg-slate-50">
										<Zap className="w-5 h-5 text-blue-600" />
									</div>
									<div>
										<h3 className="text-sm font-semibold">
											{t.selfScheduling.generateSlots}
										</h3>
										<p className="text-xs text-muted-foreground">
											{t.selfScheduling.generateSlotsDesc}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3 ms-auto">
									<div className="flex items-center gap-2">
										<Label className="text-xs whitespace-nowrap">
											{t.selfScheduling.daysToGenerate}
										</Label>
										<Input
											type="number"
											min={1}
											max={30}
											value={daysToGenerate}
											onChange={(e) => onDaysToGenerateChange(e.target.value)}
											className="h-8 w-16"
										/>
									</div>
									<Button
										className="bg-blue-600 hover:bg-blue-700 text-white"
										onClick={onGenerateSlots}
										disabled={generatingSlots}
									>
										{generatingSlots ? (
											<Loader2 className="w-4 h-4 me-2 animate-spin" />
										) : (
											<Zap className="w-4 h-4 me-2" />
										)}
										{generatingSlots
											? t.selfScheduling.generating
											: t.selfScheduling.generateSlots}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Slots View */}
				<TabsContent value="slots" className="space-y-6 animate-fade-in-up">
					{slotsLoading ? (
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-4">
										<div className="h-20 bg-muted rounded" />
									</CardContent>
								</Card>
							))}
						</div>
					) : schedulingSlots.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<CalendarClock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
								<h3 className="text-lg font-medium">
									{t.selfScheduling.noSlots}
								</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{t.selfScheduling.noSlotsDesc}
								</p>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-6">
							{Object.entries(groupedSlots).map(([date, dateSlots]) => (
								<div key={date}>
									<div className="flex items-center gap-2 mb-3">
										<Calendar className="w-4 h-4 text-blue-600" />
										<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
											{date}
										</h3>
										<Separator className="flex-1" />
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
										{dateSlots.map((slot) => {
											const isAvailable = slot.status === "available";
											return (
												<Card
													key={slot.id}
													className={cn(
														"border transition-all duration-200 card-animate-fade-in-up",
														isAvailable
															? "border-slate-200/30 hover:border-slate-400"
															: "border-amber-200 dark:border-amber-800/30",
													)}
												>
													<CardContent className="p-4">
														<div className="flex items-start justify-between gap-2 mb-2">
															<div className="flex items-center gap-2">
																<Clock
																	className={cn(
																		"w-4 h-4",
																		isAvailable
																			? "text-blue-600"
																			: "text-amber-600",
																	)}
																/>
																<span className="text-sm font-medium">
																	{formatTime(slot.startTime)} –{" "}
																	{formatTime(slot.endTime)}
																</span>
															</div>
															<Badge
																variant="outline"
																className={cn(
																	"text-[10px] px-1.5 py-0 font-medium",
																	isAvailable
																		? "text-blue-700 bg-slate-50 border-slate-200/30"
																		: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/30",
																)}
															>
																{isAvailable
																	? t.selfScheduling.available
																	: t.selfScheduling.booked}
															</Badge>
														</div>
														<div className="flex items-center gap-2 text-xs text-muted-foreground">
															<span>
																{slot.duration} {t.selfScheduling.minutes}
															</span>
															<span>·</span>
															<span>{slot.interviewerName}</span>
														</div>
														{slot.bookedBy && (
															<div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
																<p className="text-xs font-medium text-amber-700">
																	{t.selfScheduling.bookedBy}
																</p>
																<p className="text-xs text-amber-600">
																	{slot.bookedBy.name}
																</p>
																<p className="text-[10px] text-amber-500">
																	{slot.bookedBy.email}
																</p>
															</div>
														)}
														{isAvailable && slot.token && (
															<div className="mt-2">
																<Button
																	size="sm"
																	variant="ghost"
																	className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-slate-50"
																	onClick={() => onCopyLink(slot.token)}
																>
																	{copiedLink === slot.token ? (
																		<>
																			<CheckCircle className="w-3 h-3 me-1" />
																			Copied!
																		</>
																	) : (
																		<>
																			<Copy className="w-3 h-3 me-1" />
																			Copy scheduling link
																		</>
																	)}
																</Button>
															</div>
														)}
													</CardContent>
												</Card>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
