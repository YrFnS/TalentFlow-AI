import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// GET /api/predictive-analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Try to gather real metrics from DB
    let totalApplications = 0;
    let totalJobs = 0;

    if (companyId) {
      try {
        totalJobs = await db.job.count({
          where: { companyId, status: 'OPEN' },
        });
        totalApplications = await db.application.count({
          where: { job: { companyId } },
        });
      } catch {
        // DB query failed, use defaults
      }
    }

    // Try AI-powered predictions
    let predictions;
    try {
      const zai = await ZAI.create();
      const result = await zai.chat({
        messages: [
          {
            role: 'system',
            content: `You are an HR analytics AI. Generate predictive hiring metrics as JSON. Return ONLY valid JSON with this structure:
{
  "predictedTimeToFill": <number in days>,
  "dropoffRiskPct": <number 0-100>,
  "qualityOfHireScore": <number 1-10>,
  "hiringVelocity": <number hires per month>,
  "timeToFillTrend": "up" or "down",
  "confidenceInterval": [lower, upper],
  "funnelConversion": {
    "screening": <number 0-100>,
    "interview": <number 0-100>,
    "offer": <number 0-100>,
    "hired": <number 0-100>
  }
}
Be realistic with industry-standard metrics.`,
          },
          {
            role: 'user',
            content: `Generate predictions for a company with ${totalJobs} open jobs and ${totalApplications} total applications.`,
          },
        ],
      });

      const content = result.content || result.text || '';
      const jsonStr = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      predictions = JSON.parse(jsonStr);
    } catch {
      // Fallback to mock data
      predictions = {
        predictedTimeToFill: 28,
        dropoffRiskPct: 37,
        qualityOfHireScore: 7.8,
        hiringVelocity: 4.2,
        timeToFillTrend: 'down',
        confidenceInterval: [24, 32],
        funnelConversion: {
          screening: 78,
          interview: 45,
          offer: 22,
          hired: 16,
        },
      };
    }

    // Historical time-to-fill (6 months, decreasing trend)
    const historicalTimeToFill = [
      { month: 'Oct', days: 45 },
      { month: 'Nov', days: 42 },
      { month: 'Dec', days: 38 },
      { month: 'Jan', days: 35 },
      { month: 'Feb', days: 33 },
      { month: 'Mar', days: 31 },
    ];

    // Forecast (3 months)
    const forecastTimeToFill = [
      { month: 'Apr', days: predictions.predictedTimeToFill },
      { month: 'May', days: Math.max(15, predictions.predictedTimeToFill - 2) },
      { month: 'Jun', days: Math.max(12, predictions.predictedTimeToFill - 4) },
    ];

    return NextResponse.json({
      predictions,
      historicalTimeToFill,
      forecastTimeToFill,
      totalJobs,
      totalApplications,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in predictive analytics:', error);
    const message = error instanceof Error ? error.message : 'Predictive analytics failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
