/**
 * Workflow Engine — Executes agentic AI recruiting workflows
 *
 * Each workflow has steps defined as JSON: [{ order, action, config, delay }]
 * The engine executes steps sequentially and records results.
 */

import { db } from "@/lib/db";
import { sendEmail, BUILTIN_EMAIL_TEMPLATES } from "@/lib/email-service";

// Types matching Prisma enums
export type WorkflowTrigger =
	| "APPLICATION_RECEIVED"
	| "STAGE_CHANGED"
	| "INTERVIEW_COMPLETED"
	| "OFFER_ACCEPTED"
	| "OFFER_DECLINED"
	| "CANDIDATE_NO_RESPONSE"
	| "SCHEDULED_TIME"
	| "MANUAL_TRIGGER";

export type WorkflowActionType =
	| "SEND_EMAIL"
	| "MOVE_STAGE"
	| "SCHEDULE_INTERVIEW"
	| "SEND_SCREENING"
	| "AI_SCREEN_RESUME"
	| "AI_GENERATE_QUESTIONS"
	| "ADD_TAG"
	| "ASSIGN_RECRUITER"
	| "SEND_NOTIFICATION"
	| "WEBHOOK"
	| "WAIT"
	| "CONDITION_CHECK";

export type WorkflowStatus = "ACTIVE" | "PAUSED" | "DRAFT" | "ARCHIVED";

export interface WorkflowStep {
	order: number;
	action: WorkflowActionType;
	config: Record<string, unknown>;
	delay?: number; // delay in seconds before executing this step
}

export interface WorkflowWithId {
	id: string;
	companyId: string;
	name: string;
	description?: string | null;
	trigger: WorkflowTrigger;
	triggerConfig?: string | null;
	steps: string; // JSON string of WorkflowStep[]
	status: WorkflowStatus;
}

export interface ExecutionWithId {
	id: string;
	workflowId: string;
	applicationId?: string | null;
	candidateId?: string | null;
	status: string;
	currentStep: number;
	stepResults: string; // JSON
	triggeredBy: string;
	error?: string | null;
	startedAt: Date;
	completedAt?: Date | null;
}

export interface StepResult {
	stepIndex: number;
	action: WorkflowActionType;
	status: "SUCCESS" | "FAILED" | "SKIPPED";
	result?: Record<string, unknown>;
	error?: string;
	executedAt: string;
}

export interface TriggerData {
	applicationId?: string;
	candidateId?: string;
	jobId?: string;
	companyId?: string;
	userId?: string;
	[key: string]: unknown;
}

/**
 * Parse workflow steps from JSON string
 */
export function parseSteps(stepsJson: string): WorkflowStep[] {
	try {
		return JSON.parse(stepsJson) as WorkflowStep[];
	} catch {
		return [];
	}
}

/**
 * Parse step results from JSON string
 */
export function parseStepResults(resultsJson: string): StepResult[] {
	try {
		return JSON.parse(resultsJson) as StepResult[];
	} catch {
		return [];
	}
}

/**
 * Execute a single workflow step
 */
export async function executeWorkflowStep(
	workflow: WorkflowWithId,
	execution: ExecutionWithId,
	stepIndex: number,
	data: TriggerData,
): Promise<StepResult> {
	const steps = parseSteps(workflow.steps);
	if (stepIndex >= steps.length) {
		return {
			stepIndex,
			action: "WAIT",
			status: "SKIPPED",
			error: "Step index out of bounds",
			executedAt: new Date().toISOString(),
		};
	}

	const step = steps[stepIndex];

	try {
		let result: Record<string, unknown> = {};

		switch (step.action) {
			case "SEND_EMAIL": {
				const emailConfig = step.config || {};
				const to = (emailConfig.to as string) || "";
				const subject =
					(emailConfig.subject as string) || "Notification from TalentFlow AI";
				const body = (emailConfig.body as string) || "";
				const templateKey = emailConfig.templateKey as string | undefined;

				let finalBody = body;
				if (
					templateKey &&
					BUILTIN_EMAIL_TEMPLATES[
						templateKey as keyof typeof BUILTIN_EMAIL_TEMPLATES
					]
				) {
					// Use a built-in template - substitute with trigger data
					const tpl =
						BUILTIN_EMAIL_TEMPLATES[
							templateKey as keyof typeof BUILTIN_EMAIL_TEMPLATES
						];
					if (typeof tpl === "function") {
						const tplFn = tpl as (...args: string[]) => string;
						const args = [
							(data.candidateName as string) || "Candidate",
							(data.jobTitle as string) || "Position",
							(data.companyName as string) || "Company",
							(data.interviewDate as string) || "",
							(data.interviewTime as string) || "",
						];
						finalBody = tplFn(...args.slice(0, tplFn.length));
					}
				}

				// Replace {{variable}} placeholders in body
				finalBody = finalBody.replace(/\{\{(\w+)\}\}/g, (_, key) =>
					String(data[key] ?? ""),
				);

				if (to) {
					const emailResult = await sendEmail({
						to,
						subject,
						body: finalBody,
						companyId: workflow.companyId,
						userId: data.userId,
					});
					result = { emailSent: emailResult.success, logId: emailResult.logId };
				} else {
					result = { emailSent: false, reason: "No recipient specified" };
				}
				break;
			}

			case "MOVE_STAGE": {
				const moveConfig = step.config || {};
				const targetStageId = moveConfig.targetStageId as string;
				const appId = data.applicationId || execution.applicationId;

				if (appId && targetStageId) {
					await db.application.update({
						where: { id: appId },
						data: { currentStageId: targetStageId },
					});
					result = { movedToStage: targetStageId };
				} else {
					result = {
						movedToStage: null,
						reason: "Missing applicationId or targetStageId",
					};
				}
				break;
			}

			case "SCHEDULE_INTERVIEW": {
				const interviewConfig = step.config || {};
				const appId = data.applicationId || execution.applicationId;
				const type = (interviewConfig.interviewType as string) || "VIDEO";
				const duration = (interviewConfig.durationMinutes as number) || 30;

				if (appId) {
					const interview = await db.interview.create({
						data: {
							applicationId: appId,
							type: type as "PHONE" | "VIDEO" | "ON_SITE" | "ASYNC_VIDEO",
							status: "SCHEDULED",
							durationMinutes: duration,
							scheduledAt: interviewConfig.scheduledAt
								? new Date(interviewConfig.scheduledAt as string)
								: new Date(),
							location: (interviewConfig.location as string) || null,
							meetingLink: (interviewConfig.meetingLink as string) || null,
						},
					});
					result = { interviewId: interview.id, scheduled: true };
				} else {
					result = { scheduled: false, reason: "No applicationId" };
				}
				break;
			}

			case "SEND_SCREENING": {
				const screeningConfig = step.config || {};
				const jobId = data.jobId || (screeningConfig.jobId as string);
				const questions =
					(screeningConfig.questions as Array<{
						question: string;
						type: string;
					}>) || [];

				if (jobId && questions.length > 0) {
					const created: string[] = [];
					for (let i = 0; i < questions.length; i++) {
						const q = questions[i];
						const sq = await db.screeningQuestion.create({
							data: {
								jobId,
								question: q.question,
								questionType:
									(q.type as
										| "YES_NO"
										| "MULTIPLE_CHOICE"
										| "TEXT"
										| "NUMBER"
										| "DATE") || "TEXT",
								isRequired: true,
								isKnockout: false,
								order: i,
							},
						});
						created.push(sq.id);
					}
					result = {
						screeningQuestionsCreated: created.length,
						questionIds: created,
					};
				} else {
					result = { created: false, reason: "Missing jobId or questions" };
				}
				break;
			}

			case "AI_SCREEN_RESUME": {
				const screenConfig = step.config || {};
				const appId = data.applicationId || execution.applicationId;
				const threshold = (screenConfig.threshold as number) || 70;

				if (appId) {
					const application = await db.application.findUnique({
						where: { id: appId },
						include: {
							candidate: { include: { user: true } },
							job: true,
						},
					});

					if (application?.candidate?.resumeText && application.job) {
						try {
							const ZAI = (await import("z-ai-web-dev-sdk")).default;
							const sdk = await ZAI.create();
							const jobRequirements = application.job.requirements
								? JSON.parse(application.job.requirements || "[]")
								: [];

							const aiResponse = await (sdk as any).chat?.completions?.create?.(
								{
									model: "default",
									messages: [
										{
											role: "system",
											content:
												"You are a resume screening AI. Analyze the resume against the job requirements and return a JSON with: score (0-100), strengths (array), weaknesses (array), recommendation (string).",
										},
										{
											role: "user",
											content: `Resume: ${application.candidate.resumeText.substring(0, 2000)}\n\nJob: ${application.job.title}\nRequirements: ${JSON.stringify(jobRequirements)}`,
										},
									],
								},
							);

							const content = aiResponse.choices?.[0]?.message?.content || "";
							let score = 50;
							try {
								const parsed = JSON.parse(content);
								score = parsed.score || 50;
							} catch {
								/* use default score */
							}

							await db.application.update({
								where: { id: appId },
								data: { aiAnalysis: content, matchScore: score },
							});

							result = {
								screened: true,
								score,
								threshold,
								passed: score >= threshold,
							};
						} catch (aiError: unknown) {
							const errMsg =
								aiError instanceof Error
									? aiError.message
									: "AI screening failed";
							result = { screened: false, error: errMsg };
						}
					} else {
						result = { screened: false, reason: "No resume text or job found" };
					}
				} else {
					result = { screened: false, reason: "No applicationId" };
				}
				break;
			}

			case "AI_GENERATE_QUESTIONS": {
				const qConfig = step.config || {};
				const role = (qConfig.role as string) || "Software Engineer";
				const level = (qConfig.level as string) || "mid";
				const count = (qConfig.count as number) || 5;

				try {
					const ZAI = (await import("z-ai-web-dev-sdk")).default;
					const sdk = await ZAI.create();
					const aiResponse = await (sdk as any).chat?.completions?.create?.({
						model: "default",
						messages: [
							{
								role: "system",
								content:
									"You are an interview question generator. Return a JSON array of objects with: question, category, difficulty.",
							},
							{
								role: "user",
								content: `Generate ${count} interview questions for a ${level} ${role}.`,
							},
						],
					});

					const content = aiResponse.choices?.[0]?.message?.content || "[]";
					result = { questionsGenerated: true, questions: content };
				} catch (aiError: unknown) {
					const errMsg =
						aiError instanceof Error
							? aiError.message
							: "AI question generation failed";
					result = { questionsGenerated: false, error: errMsg };
				}
				break;
			}

			case "ADD_TAG": {
				const tagConfig = step.config || {};
				const tag = (tagConfig.tag as string) || "";
				const appId = data.applicationId || execution.applicationId;

				if (appId && tag) {
					const application = await db.application.findUnique({
						where: { id: appId },
					});
					if (application) {
						const existingNotes = application.notes || "";
						const tagLine = `[TAG: ${tag}]`;
						await db.application.update({
							where: { id: appId },
							data: {
								notes: existingNotes ? `${existingNotes}\n${tagLine}` : tagLine,
							},
						});
						result = { tagAdded: tag };
					} else {
						result = { tagAdded: false, reason: "Application not found" };
					}
				} else {
					result = { tagAdded: false, reason: "Missing tag or applicationId" };
				}
				break;
			}

			case "ASSIGN_RECRUITER": {
				const assignConfig = step.config || {};
				const recruiterId = (assignConfig.recruiterId as string) || "";
				const appId = data.applicationId || execution.applicationId;

				if (appId && recruiterId) {
					// Add a note about assignment since Application doesn't have a direct recruiter field
					const application = await db.application.findUnique({
						where: { id: appId },
					});
					if (application) {
						const existingNotes = application.notes || "";
						const assignNote = `[ASSIGNED: ${recruiterId}]`;
						await db.application.update({
							where: { id: appId },
							data: {
								notes: existingNotes
									? `${existingNotes}\n${assignNote}`
									: assignNote,
							},
						});
						result = { assignedRecruiter: recruiterId };
					} else {
						result = { assigned: false, reason: "Application not found" };
					}
				} else {
					result = {
						assigned: false,
						reason: "Missing recruiterId or applicationId",
					};
				}
				break;
			}

			case "SEND_NOTIFICATION": {
				const notifConfig = step.config || {};
				const userId = (notifConfig.userId as string) || data.userId || "";
				const title = (notifConfig.title as string) || "Workflow Notification";
				const message =
					(notifConfig.message as string) ||
					"A workflow step has been executed.";

				if (userId) {
					const notification = await db.notification.create({
						data: {
							userId,
							title,
							message,
							type: (notifConfig.type as string) || "info",
							link: (notifConfig.link as string) || null,
						},
					});
					result = { notificationId: notification.id, sent: true };
				} else {
					result = { sent: false, reason: "No userId for notification" };
				}
				break;
			}

			case "WEBHOOK": {
				const webhookConfig = step.config || {};
				const url = (webhookConfig.url as string) || "";
				const method = (webhookConfig.method as string) || "POST";

				if (url) {
					try {
						const response = await fetch(url, {
							method,
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								workflowId: workflow.id,
								executionId: execution.id,
								data,
							}),
						});
						result = { webhookSent: true, statusCode: response.status };
					} catch (fetchError: unknown) {
						const errMsg =
							fetchError instanceof Error
								? fetchError.message
								: "Webhook failed";
						result = { webhookSent: false, error: errMsg };
					}
				} else {
					result = { webhookSent: false, reason: "No URL configured" };
				}
				break;
			}

			case "WAIT": {
				// WAIT is a no-op — the delay is handled before the step is executed
				const waitSeconds = step.delay || (step.config.delay as number) || 0;
				result = { waited: true, delaySeconds: waitSeconds };
				break;
			}

			case "CONDITION_CHECK": {
				const condConfig = step.config || {};
				const field = (condConfig.field as string) || "";
				const operator = (condConfig.operator as string) || "equals";
				const value = condConfig.value;

				let conditionMet = false;
				const dataValue = data[field];

				switch (operator) {
					case "equals":
						conditionMet = dataValue === value;
						break;
					case "not_equals":
						conditionMet = dataValue !== value;
						break;
					case "greater_than":
						conditionMet = Number(dataValue) > Number(value);
						break;
					case "less_than":
						conditionMet = Number(dataValue) < Number(value);
						break;
					case "contains":
						conditionMet = String(dataValue || "").includes(String(value));
						break;
					default:
						conditionMet = dataValue === value;
				}

				result = { conditionMet, field, operator, value, dataValue };

				// If condition not met and skipOnFail is true, skip remaining steps
				if (!conditionMet && condConfig.skipOnFail) {
					result.skipRemaining = true;
				}
				break;
			}

			default:
				result = { error: `Unknown action type: ${step.action}` };
		}

		return {
			stepIndex,
			action: step.action,
			status: "SUCCESS",
			result,
			executedAt: new Date().toISOString(),
		};
	} catch (error: unknown) {
		const errMsg = error instanceof Error ? error.message : "Unknown error";
		return {
			stepIndex,
			action: step.action,
			status: "FAILED",
			error: errMsg,
			executedAt: new Date().toISOString(),
		};
	}
}

/**
 * Execute all steps of a workflow sequentially
 */
export async function executeWorkflow(
	workflow: WorkflowWithId,
	execution: ExecutionWithId,
	data: TriggerData,
): Promise<void> {
	const steps = parseSteps(workflow.steps);
	const stepResults = parseStepResults(execution.stepResults);

	for (let i = execution.currentStep; i < steps.length; i++) {
		const step = steps[i];

		// Handle WAIT delay
		if (step.action === "WAIT" && step.delay && step.delay > 0) {
			// In production, this would use a job queue.
			// For now, we update the execution state and continue.
			// Short delays are processed immediately; long delays would need a scheduler.
			if (step.delay > 60) {
				// Update execution to point to this step and return
				// A scheduler would resume it later
				await db.workflowExecution.update({
					where: { id: execution.id },
					data: {
						currentStep: i,
						status: "PAUSED",
						stepResults: JSON.stringify(stepResults),
					},
				});
				return;
			}
		}

		// Execute the step
		const stepResult = await executeWorkflowStep(workflow, execution, i, data);
		stepResults.push(stepResult);

		// Check if condition check says to skip remaining
		if (stepResult.result?.skipRemaining) {
			break;
		}

		// Update execution progress
		const isLastStep = i === steps.length - 1;
		await db.workflowExecution.update({
			where: { id: execution.id },
			data: {
				currentStep: i + 1,
				stepResults: JSON.stringify(stepResults),
				status:
					stepResult.status === "FAILED"
						? "FAILED"
						: isLastStep
							? "COMPLETED"
							: "RUNNING",
				error: stepResult.status === "FAILED" ? stepResult.error : null,
				completedAt:
					isLastStep || stepResult.status === "FAILED" ? new Date() : null,
			},
		});

		if (stepResult.status === "FAILED") {
			break;
		}
	}
}

/**
 * Trigger workflows matching an event
 * Called when events happen (application received, stage changed, etc.)
 */
export async function triggerWorkflows(
	event: WorkflowTrigger,
	data: TriggerData,
): Promise<string[]> {
	const companyId = data.companyId;
	if (!companyId) return [];

	// Find all ACTIVE workflows matching this trigger
	const workflows = await db.hiringWorkflow.findMany({
		where: {
			companyId,
			trigger: event,
			status: "ACTIVE",
		},
	});

	const executionIds: string[] = [];

	for (const workflow of workflows) {
		// Create a WorkflowExecution
		const execution = await db.workflowExecution.create({
			data: {
				workflowId: workflow.id,
				applicationId: data.applicationId || null,
				candidateId: data.candidateId || null,
				status: "RUNNING",
				currentStep: 0,
				stepResults: "[]",
				triggeredBy: data.userId || "SYSTEM",
			},
		});

		executionIds.push(execution.id);

		// Execute steps sequentially (fire and forget for non-blocking)
		executeWorkflow(
			workflow as unknown as WorkflowWithId,
			execution as unknown as ExecutionWithId,
			data,
		).catch((err) => {
			console.error(`Workflow execution failed for ${workflow.id}:`, err);
		});
	}

	return executionIds;
}

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES = [
	{
		id: "auto-screen",
		name: "Auto-Screen New Applications",
		description:
			"Automatically screen new applications with AI and move qualified candidates to the next stage.",
		trigger: "APPLICATION_RECEIVED" as WorkflowTrigger,
		triggerConfig: JSON.stringify({}),
		steps: JSON.stringify([
			{
				order: 1,
				action: "AI_SCREEN_RESUME",
				config: { threshold: 70 },
				delay: 0,
			},
			{
				order: 2,
				action: "CONDITION_CHECK",
				config: {
					field: "score",
					operator: "greater_than",
					value: 70,
					skipOnFail: true,
				},
				delay: 0,
			},
			{
				order: 3,
				action: "MOVE_STAGE",
				config: { targetStageId: "" },
				delay: 0,
			},
			{
				order: 4,
				action: "SEND_NOTIFICATION",
				config: {
					title: "New Qualified Application",
					message: "A new application has passed AI screening.",
					type: "info",
				},
				delay: 0,
			},
		]),
		status: "DRAFT" as WorkflowStatus,
	},
	{
		id: "no-response-followup",
		name: "No Response Follow-up",
		description:
			"Send a follow-up email when a candidate does not respond after a period.",
		trigger: "CANDIDATE_NO_RESPONSE" as WorkflowTrigger,
		triggerConfig: JSON.stringify({ delayDays: 3 }),
		steps: JSON.stringify([
			{ order: 1, action: "WAIT", config: { delayDays: 3 }, delay: 259200 },
			{
				order: 2,
				action: "SEND_EMAIL",
				config: {
					subject: "Following Up on Your Application",
					body: "<p>Hi {{candidateName}}, we wanted to follow up on your application for {{jobTitle}}.</p>",
				},
				delay: 0,
			},
		]),
		status: "DRAFT" as WorkflowStatus,
	},
	{
		id: "interview-auto-schedule",
		name: "Interview Auto-Schedule",
		description:
			"Automatically schedule an interview when a candidate reaches the interview stage.",
		trigger: "STAGE_CHANGED" as WorkflowTrigger,
		triggerConfig: JSON.stringify({ targetStage: "interview" }),
		steps: JSON.stringify([
			{
				order: 1,
				action: "SCHEDULE_INTERVIEW",
				config: { interviewType: "VIDEO", durationMinutes: 30 },
				delay: 0,
			},
			{
				order: 2,
				action: "SEND_EMAIL",
				config: {
					subject: "Interview Scheduled",
					templateKey: "interviewScheduled",
				},
				delay: 0,
			},
		]),
		status: "DRAFT" as WorkflowStatus,
	},
	{
		id: "offer-onboarding",
		name: "Offer Accepted → Onboarding",
		description: "Start onboarding process when an offer is accepted.",
		trigger: "OFFER_ACCEPTED" as WorkflowTrigger,
		triggerConfig: JSON.stringify({}),
		steps: JSON.stringify([
			{
				order: 1,
				action: "SEND_EMAIL",
				config: {
					subject: "Welcome Aboard!",
					body: "<p>Congratulations! We are thrilled to have you join the team.</p>",
				},
				delay: 0,
			},
			{
				order: 2,
				action: "SEND_NOTIFICATION",
				config: {
					title: "Offer Accepted",
					message:
						"A candidate has accepted the offer. Time to start onboarding!",
					type: "success",
				},
				delay: 0,
			},
		]),
		status: "DRAFT" as WorkflowStatus,
	},
];
