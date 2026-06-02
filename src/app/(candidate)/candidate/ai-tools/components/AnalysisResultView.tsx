// @ts-nocheck
'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) return null;
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50'
    : score >= 60 ? 'text-amber-600 bg-amber-50'
    : 'text-red-600 bg-red-50';
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${color}`}>
      <span>{label}:</span>
      <span>{score}/100</span>
    </div>
  );
}

export default function AnalysisResultView({ data }: { data: Record<string, unknown> }) {
  const a = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b">
        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
        <span className="font-medium">Powered by AI</span>
      </div>

      {(a.atsScore != null || a.overallScore != null || a.matchScore != null) && (
        <div className="flex flex-wrap gap-3">
          {a.overallScore != null && <ScoreBadge score={a.overallScore as number} label="Overall" />}
          {a.atsScore != null && <ScoreBadge score={a.atsScore as number} label="ATS" />}
          {a.matchScore != null && <ScoreBadge score={a.matchScore as number} label="Match" />}
        </div>
      )}

      {a.summary && (
        <div className="p-4 rounded-xl bg-muted border border-border/50">
          <p className="text-sm font-medium leading-relaxed">{a.summary as string}</p>
        </div>
      )}

      {Array.isArray(a.strengths) && (a.strengths as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Strengths</h4>
          <ul className="space-y-2">
            {(a.strengths as string[]).map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0">&check;</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(a.weaknesses) && (a.weaknesses as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-amber-600 mb-2">Areas for Improvement</h4>
          <ul className="space-y-2">
            {(a.weaknesses as string[]).map((item, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                <span className="text-amber-500 mt-0.5 shrink-0">!</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(a.missingKeywords) && (a.missingKeywords as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-red-600 mb-2">Missing Keywords</h4>
          <div className="flex flex-wrap gap-1.5">
            {(a.missingKeywords as string[]).map((kw, i) => (
              <Badge key={i} variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">{kw}</Badge>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(a.recommendations) && (a.recommendations as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Recommendations</h4>
          <ol className="space-y-2 list-decimal list-inside">
            {(a.recommendations as string[]).map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {Array.isArray(a.improvements) && (a.improvements as string[]).length > 0 && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Improvement Suggestions</h4>
          <ol className="space-y-2 list-decimal list-inside">
            {(a.improvements as string[]).map((item, i) => (
              <li key={i} className="text-sm leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {a.skillsMatch && typeof a.skillsMatch === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-purple-600 mb-2">Skills Match</h4>
          {((a.skillsMatch as Record<string, unknown>).matchPercentage != null) && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Match</span>
                <span>{(a.skillsMatch as Record<string, unknown>).matchPercentage as number}%</span>
              </div>
              <Progress value={(a.skillsMatch as Record<string, unknown>).matchPercentage as number} className="h-2" />
            </div>
          )}
          {Array.isArray((a.skillsMatch as Record<string, unknown>).matchedSkills) && (
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground">Matched: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {((a.skillsMatch as Record<string, unknown>).matchedSkills as string[]).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
          {Array.isArray((a.skillsMatch as Record<string, unknown>).missingSkills) && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Missing: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {((a.skillsMatch as Record<string, unknown>).missingSkills as string[]).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-red-50 text-red-700">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {a.keywordAnalysis && typeof a.keywordAnalysis === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Keyword Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            {Array.isArray((a.keywordAnalysis as Record<string, unknown>).found) && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Found Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {((a.keywordAnalysis as Record<string, unknown>).found as string[]).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray((a.keywordAnalysis as Record<string, unknown>).missing) && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Missing Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {((a.keywordAnalysis as Record<string, unknown>).missing as string[]).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {a.currentSkills && typeof a.currentSkills === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Current Skills</h4>
          {Array.isArray((a.currentSkills as Record<string, unknown>).matched) && (
            <div className="space-y-1">
              {((a.currentSkills as Record<string, unknown>).matched as Array<Record<string, string>>).map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{item.skill}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">{item.level}</span>
                  <Badge variant="secondary" className="text-xs capitalize">{item.relevance} relevance</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(a.missingSkills && typeof a.missingSkills === 'object') && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">Skills to Develop</h4>
          {Array.isArray((a.missingSkills as Record<string, unknown>).critical) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-red-600">Critical:</span>
              <ul className="space-y-1 mt-1">
                {((a.missingSkills as Record<string, unknown>).critical as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge variant="destructive" className="text-[10px] h-5 shrink-0">Critical</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray((a.missingSkills as Record<string, unknown>).important) && (
            <div className="mb-3">
              <span className="text-xs font-semibold text-amber-600">Important:</span>
              <ul className="space-y-1 mt-1">
                {((a.missingSkills as Record<string, unknown>).important as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 shrink-0">Important</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray((a.missingSkills as Record<string, unknown>).nice) && (
            <div>
              <span className="text-xs font-semibold text-blue-600">Nice to Have:</span>
              <ul className="space-y-1 mt-1">
                {((a.missingSkills as Record<string, unknown>).nice as Array<Record<string, string>>).map((item, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5 shrink-0">Nice</Badge>
                    <span><strong>{item.skill}</strong> &mdash; {item.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {Array.isArray(a.learningResources) && (a.learningResources as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Learning Resources</h4>
          <div className="space-y-2">
            {(a.learningResources as Array<Record<string, string>>).map((item, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-card text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
                    <span className="text-xs text-muted-foreground">{item.duration}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{item.resource}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {a.marketDemand && typeof a.marketDemand === 'object' && (
        <div className="p-3 rounded-lg border border-slate-200 bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">Market Demand</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Trend:</span>
              <p className="font-medium capitalize">{(a.marketDemand as Record<string, unknown>).trend as string}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Avg Salary:</span>
              <p className="font-medium">{(a.marketDemand as Record<string, unknown>).averageSalary as string}</p>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground">Outlook:</span>
              <p className="text-sm">{(a.marketDemand as Record<string, unknown>).outlook as string}</p>
            </div>
          </div>
        </div>
      )}

      {Array.isArray(a.recommendedPath) && (a.recommendedPath as Array<Record<string, unknown>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Recommended Path</h4>
          <div className="space-y-2">
            {(a.recommendedPath as Array<Record<string, unknown>>).map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {item.step as number || i + 1}
                </div>
                <div>
                  <p className="font-medium">{item.action as string}</p>
                  <p className="text-xs text-muted-foreground">{item.timeline as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(a.commonQuestions) && (a.commonQuestions as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 mb-2">Common Questions</h4>
          <div className="space-y-3">
            {(a.commonQuestions as Array<Record<string, string>>).map((q, i) => (
              <div key={i} className="p-3 rounded-lg border border-slate-200 bg-card">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">Q{i + 1}</Badge>
                  <div>
                    <p className="text-sm font-medium">{q.question}</p>
                    {q.type && <Badge variant="outline" className="text-[10px] mt-1 capitalize">{q.type}</Badge>}
                    {q.suggestedApproach && <p className="text-xs text-muted-foreground mt-1.5"><strong>Approach:</strong> {q.suggestedApproach}</p>}
                    {q.sampleAnswer && (
                      <div className="mt-2 p-2 rounded bg-muted/50">
                        <p className="text-xs"><strong>Sample:</strong> {q.sampleAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(a.behavioralQuestions) && (a.behavioralQuestions as Array<Record<string, string>>).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-purple-600 mb-2">Behavioral Questions</h4>
          <div className="space-y-2">
            {(a.behavioralQuestions as Array<Record<string, string>>).map((q, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-card text-sm">
                <p className="font-medium">{q.question}</p>
                {q.starExample && <p className="text-xs text-muted-foreground mt-1"><strong>STAR Example:</strong> {q.starExample}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {a.tips && typeof a.tips === 'object' && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Tips</h4>
          <div className="grid gap-3">
            {Array.isArray((a.tips as Record<string, unknown>).before) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Before the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((a.tips as Record<string, unknown>).before as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-blue-500 shrink-0">&bull;</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray((a.tips as Record<string, unknown>).during) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">During the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((a.tips as Record<string, unknown>).during as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-emerald-500 shrink-0">&bull;</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray((a.tips as Record<string, unknown>).after) && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">After the Interview</span>
                <ul className="space-y-1 mt-1">
                  {((a.tips as Record<string, unknown>).after as string[]).map((tip, i) => (
                    <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-purple-500 shrink-0">&bull;</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {Array.isArray(a.questionsToAsk) && (a.questionsToAsk as string[]).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-blue-600 mb-2">Questions to Ask the Interviewer</h4>
          <ul className="space-y-1">
            {(a.questionsToAsk as string[]).map((q, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-blue-500 shrink-0">?</span>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {Array.isArray(a.redFlags) && (a.redFlags as string[]).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-600 mb-2">Things to Avoid</h4>
          <ul className="space-y-1">
            {(a.redFlags as string[]).map((flag, i) => (
              <li key={i} className="text-sm flex items-start gap-1.5"><span className="text-red-500 shrink-0">&times;</span>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {a.practiceExercise && typeof a.practiceExercise === 'object' && (
        <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50">
          <h4 className="text-sm font-semibold text-purple-600 mb-1">{(a.practiceExercise as Record<string, string>).title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{(a.practiceExercise as Record<string, string>).description}</p>
          {Array.isArray((a.practiceExercise as Record<string, unknown>).steps) && (
            <ol className="space-y-1 list-decimal list-inside text-sm">
              {((a.practiceExercise as Record<string, unknown>).steps as string[]).map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
