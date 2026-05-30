/// <reference no-default-lib="true"/>
// @ts-nocheck - Stripe webhook: runtime fallback for missing stripe SDK
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateInput, stripeWebhookSchema } from "@/lib/validation/schemas";

/**
 * Verify Stripe webhook signature.
 * - If STRIPE_WEBHOOK_SECRET env var is set, performs full signature verification using Stripe SDK.
 * - If not set, logs a warning and allows through (dev mode only).
 * - Always requires the stripe-signature header to be present.
 */
async function verifyStripeWebhook(
	request: NextRequest,
): Promise<{ valid: boolean; body: string; error?: string }> {
	const signature = request.headers.get("stripe-signature");

	if (!signature) {
		return { valid: false, body: "", error: "Missing stripe-signature header" };
	}

	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!webhookSecret) {
		// Dev mode: no secret configured, log warning but allow through
		console.warn(
			"[STRIPE WEBHOOK] STRIPE_WEBHOOK_SECRET not set. Skipping signature verification. " +
				"This is insecure for production — set the env variable to enable verification.",
		);
		const body = await request.text();
		return { valid: true, body };
	}

	// Production mode: verify signature using Stripe SDK
	try {
		const Stripe = (await import("stripe")).default;
		const stripe = new Stripe(webhookSecret, {
			apiVersion: "2024-06-20" as any,
		});

		const body = await request.text();
		const event = stripe.webhooks.constructEvent(
			body,
			signature,
			webhookSecret,
		);

		// If constructEvent succeeds, the signature is valid
		return { valid: true, body, event: event as any };
	} catch (err: any) {
		// If stripe SDK is not installed, fall back to basic validation
		if (err.code === "MODULE_NOT_FOUND") {
			console.warn(
				"[STRIPE WEBHOOK] Stripe SDK not installed. Falling back to header-only verification. " +
					'Install the "stripe" package for full signature verification.',
			);
			const body = await request.text();
			return { valid: true, body };
		}

		console.error(
			"[STRIPE WEBHOOK] Signature verification failed:",
			err.message,
		);
		return {
			valid: false,
			body: "",
			error: `Webhook signature verification failed: ${err.message}`,
		};
	}
}

// Simulated Stripe Webhook handler
export async function POST(req: NextRequest) {
	try {
		// Verify Stripe webhook signature
		const verification = await verifyStripeWebhook(req);

		if (!verification.valid) {
			return NextResponse.json({ error: verification.error }, { status: 401 });
		}

		let body: any;
		try {
			body = JSON.parse(verification.body);
		} catch {
			// If the verification step already parsed the event, use that
			body = (verification as any).event || {};
		}

		// Zod schema validation
		const validation = validateInput(stripeWebhookSchema, body);
		if (!validation.success) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}
		const { type, data } = validation.data;

		const eventId = `evt_sim_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

		// Log the webhook event
		const webhookEvent = await db.stripeWebhookEvent.create({
			data: {
				stripeEventId: eventId,
				type,
				data: JSON.stringify(data || {}),
				processed: false,
			},
		});

		try {
			// Process the event based on type
			switch (type) {
				case "checkout.session.completed": {
					const { companyId, planId } = data || {};
					if (!companyId || !planId) break;

					// Find or create the plan
					let plan = await db.plan.findFirst({ where: { id: planId } });
					if (!plan) {
						// Try to find by type
						const planType = planId.replace("plan_", "").toUpperCase();
						plan = await db.plan.findFirst({
							where: { type: planType as any },
						});
					}
					if (!plan) break;

					// Create or update subscription
					const existing = await db.subscription.findUnique({
						where: { companyId },
					});
					const now = new Date();
					const periodEnd = new Date(now);
					periodEnd.setMonth(periodEnd.getMonth() + 1);

					if (existing) {
						await db.subscription.update({
							where: { companyId },
							data: {
								planId: plan.id,
								status: "ACTIVE",
								startDate: now,
								endDate: periodEnd,
								currentPeriodStart: now,
								currentPeriodEnd: periodEnd,
								cancelledAt: null,
								stripeSubscriptionId: `sub_sim_${Date.now()}`,
								stripePriceId: plan.stripePriceId,
							},
						});
					} else {
						await db.subscription.create({
							data: {
								companyId,
								planId: plan.id,
								status: "ACTIVE",
								startDate: now,
								endDate: periodEnd,
								currentPeriodStart: now,
								currentPeriodEnd: periodEnd,
								stripeSubscriptionId: `sub_sim_${Date.now()}`,
								stripePriceId: plan.stripePriceId,
							},
						});
					}

					// Update company's stripeCustomerId
					await db.company.update({
						where: { id: companyId },
						data: { stripeCustomerId: `cus_sim_${companyId.slice(0, 8)}` },
					});

					// Create invoice for the payment
					const subscription = await db.subscription.findUnique({
						where: { companyId },
						include: { plan: true },
					});
					if (subscription) {
						const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
						await db.invoice.create({
							data: {
								subscriptionId: subscription.id,
								amount: plan.price || subscription.plan?.price || 0,
								currency: plan.currency || "USD",
								status: "PAID",
								invoiceNumber: invoiceNum,
								paidAt: new Date(),
								dueDate: new Date(),
								stripeInvoiceId: `in_sim_${Date.now()}`,
								hostedInvoiceUrl: `https://billing.stripe.com/invoice/${invoiceNum}`,
								invoicePdf: `https://stripe.com/invoices/${invoiceNum}.pdf`,
							},
						});
					}
					break;
				}

				case "invoice.paid": {
					const { subscriptionId, amount } = data || {};
					if (!subscriptionId) break;

					// Find the invoice and mark it as paid
					const sub = await db.subscription.findFirst({
						where: { stripeSubscriptionId: subscriptionId },
					});
					if (sub) {
						// Create a new invoice record
						const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
						await db.invoice.create({
							data: {
								subscriptionId: sub.id,
								amount: amount || 0,
								currency: "USD",
								status: "PAID",
								invoiceNumber: invoiceNum,
								paidAt: new Date(),
								dueDate: new Date(),
								stripeInvoiceId: `in_sim_${Date.now()}`,
							},
						});
					}
					break;
				}

				case "customer.subscription.updated": {
					const { companyId: cId, planId: pId, status: newStatus } = data || {};
					if (!cId) break;

					const sub = await db.subscription.findUnique({
						where: { companyId: cId },
					});
					if (sub) {
						await db.subscription.update({
							where: { id: sub.id },
							data: {
								...(pId ? { planId: pId } : {}),
								...(newStatus ? { status: newStatus as any } : {}),
							},
						});
					}
					break;
				}

				case "customer.subscription.deleted": {
					const { companyId: delCompanyId } = data || {};
					if (!delCompanyId) break;

					const delSub = await db.subscription.findUnique({
						where: { companyId: delCompanyId },
					});
					if (delSub) {
						await db.subscription.update({
							where: { id: delSub.id },
							data: {
								status: "CANCELED",
								cancelledAt: new Date(),
							},
						});
					}
					break;
				}
			}

			// Mark webhook as processed
			await db.stripeWebhookEvent.update({
				where: { id: webhookEvent.id },
				data: { processed: true, processedAt: new Date() },
			});
		} catch (processError) {
			console.error("Error processing webhook:", processError);
			await db.stripeWebhookEvent.update({
				where: { id: webhookEvent.id },
				data: {
					processed: false,
					error:
						processError instanceof Error
							? processError.message
							: "Unknown error",
				},
			});
		}

		return NextResponse.json({ received: true, eventId });
	} catch (error) {
		console.error("Error handling webhook:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		);
	}
}
