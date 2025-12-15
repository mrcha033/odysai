import { Member, PlanFitScore, PlanPackage, ConflictReport, PreferenceProfile, ConsensusBand, ConflictItem } from './types';

const MINUTES_IN_DAY = 24 * 60;

const emotionTags: Record<string, string[]> = {
  healing: ['힐링', 'healing', 'relax', 'spa', 'wellness', 'calm'],
  excitement: ['설렘', 'excite', 'festival', 'show', 'nightlife'],
  adventure: ['모험', 'adventure', 'hike', 'surf', 'rafting', 'activity'],
  culture: ['문화', 'museum', 'gallery', 'heritage', 'tour'],
  foodie: ['food', '맛집', 'restaurant', 'cafe', 'market', 'foodie'],
};

const instagramTags = ['photo', 'view', '뷰', '야경', 'sunset', 'instagram', '카페', 'scenic'];

function budgetToScore(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    default:
      return 2;
  }
}

function scoreToBudget(score: number): 'low' | 'medium' | 'high' {
  if (score <= 1) return 'low';
  if (score >= 3) return 'high';
  return 'medium';
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return (h % 24) * 60 + (m % 60);
}

function minutesToTime(total: number) {
  const minutes = Math.max(0, Math.min(total, MINUTES_IN_DAY - 1));
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function buildPreferenceProfiles(members: Member[]): PreferenceProfile[] {
  return members
    .filter(m => m.survey)
    .map(m => ({
      memberId: m.id,
      nickname: m.nickname,
      budgetScore: budgetToScore(m.survey!.budgetLevel),
      wakeMinutes: timeToMinutes(m.survey!.wakeUpTime || '08:00'),
      emotions: m.survey!.emotions || [],
      dislikes: m.survey!.dislikes || [],
      constraints: m.survey!.constraints || [],
      instagramImportance: m.survey!.instagramImportance ?? 3,
    }));
}

function deriveConsensus(profiles: PreferenceProfile[]): ConsensusBand {
  if (!profiles.length) {
    return {
      budget: 'medium',
      wakeWindow: { start: '08:00', end: '09:00' },
      dominantEmotions: [],
      sharedConstraints: [],
    };
  }

  const avgBudget = profiles.reduce((acc, p) => acc + p.budgetScore, 0) / profiles.length;
  const wakeTimes = profiles.map(p => p.wakeMinutes).sort((a, b) => a - b);
  const wakeStart = minutesToTime(Math.max(0, wakeTimes[0] - 30));
  const wakeEnd = minutesToTime(Math.min(MINUTES_IN_DAY - 1, wakeTimes[wakeTimes.length - 1] + 60));

  const emotionCounts: Record<string, number> = {};
  profiles.forEach(p => p.emotions.forEach(e => {
    const key = e.toLowerCase();
    emotionCounts[key] = (emotionCounts[key] || 0) + 1;
  }));
  const dominantEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([e]) => e);

  const constraintCounts: Record<string, number> = {};
  profiles.forEach(p => p.constraints.forEach(c => {
    const key = c.toLowerCase();
    constraintCounts[key] = (constraintCounts[key] || 0) + 1;
  }));
  const sharedConstraints = Object.entries(constraintCounts)
    .filter(([, count]) => count > 1)
    .map(([c]) => c);

  return {
    budget: scoreToBudget(Math.round(avgBudget)),
    wakeWindow: { start: wakeStart, end: wakeEnd },
    dominantEmotions,
    sharedConstraints,
  };
}

function detectConflicts(profiles: PreferenceProfile[]): ConflictItem[] {
  if (!profiles.length) return [];

  const conflicts: ConflictItem[] = [];

  const budgetScores = profiles.map(p => p.budgetScore);
  const budgetSpread = Math.max(...budgetScores) - Math.min(...budgetScores);
  if (budgetSpread >= 2) {
    conflicts.push({
      type: 'budget',
      severity: 'high',
      description: 'Wide budget gap between travelers',
      membersInvolved: profiles.map(p => p.memberId),
    });
  } else if (budgetSpread === 1) {
    conflicts.push({
      type: 'budget',
      severity: 'medium',
      description: 'Moderate budget differences',
      membersInvolved: profiles.map(p => p.memberId),
    });
  }

  const wakeTimes = profiles.map(p => p.wakeMinutes);
  const wakeSpread = Math.max(...wakeTimes) - Math.min(...wakeTimes);
  if (wakeSpread > 120) {
    conflicts.push({
      type: 'wake',
      severity: 'high',
      description: 'Large wake-up time gap',
      membersInvolved: profiles.map(p => p.memberId),
    });
  } else if (wakeSpread > 60) {
    conflicts.push({
      type: 'wake',
      severity: 'medium',
      description: 'Different preferred wake-up times',
      membersInvolved: profiles.map(p => p.memberId),
    });
  }

  const instaScores = profiles.map(p => p.instagramImportance);
  const instaSpread = Math.max(...instaScores) - Math.min(...instaScores);
  if (instaSpread >= 3) {
    conflicts.push({
      type: 'instagram',
      severity: 'medium',
      description: 'Some travelers care much more about photogenic spots',
      membersInvolved: profiles.map(p => p.memberId),
    });
  }

  const dislikeCounts: Record<string, string[]> = {};
  profiles.forEach(p => p.dislikes.forEach(d => {
    const key = d.toLowerCase();
    dislikeCounts[key] = [...(dislikeCounts[key] || []), p.memberId];
  }));
  Object.entries(dislikeCounts).forEach(([d, memberIds]) => {
    if (memberIds.length > 1) {
      conflicts.push({
        type: 'dislike',
        severity: 'low',
        description: `Multiple travelers want to avoid ${d}`,
        membersInvolved: memberIds,
      });
    }
  });

  const constraintCounts: Record<string, string[]> = {};
  profiles.forEach(p => p.constraints.forEach(c => {
    const key = c.toLowerCase();
    constraintCounts[key] = [...(constraintCounts[key] || []), p.memberId];
  }));
  Object.entries(constraintCounts).forEach(([c, memberIds]) => {
    if (memberIds.length > 1) {
      conflicts.push({
        type: 'constraint',
        severity: 'medium',
        description: `Shared constraint: ${c}`,
        membersInvolved: memberIds,
      });
    }
  });

  return conflicts;
}

export function buildConflictReport(members: Member[]): ConflictReport {
  const profiles = buildPreferenceProfiles(members);
  const consensus = deriveConsensus(profiles);
  const conflicts = detectConflicts(profiles);

  return { profiles, consensus, conflicts };
}

function slotScore(slotTitle: string, slotDesc: string, slotTags: string[], member: Member): number {
  const survey = member.survey;
  if (!survey) return 50;

  const title = `${slotTitle} ${slotDesc}`.toLowerCase();
  let score = 50;

  // Penalize dislikes
  survey.dislikes.forEach(dislike => {
    if (title.includes(dislike.toLowerCase())) {
      score -= 15;
    }
  });

  // Reward emotion alignment via tags/keywords
  Object.entries(emotionTags).forEach(([emotion, keywords]) => {
    if (survey.emotions.map(e => e.toLowerCase()).includes(emotion)) {
      const hasMatch = keywords.some(k => title.includes(k) || slotTags.some(t => t.toLowerCase().includes(k)));
      if (hasMatch) {
        score += 8;
      }
    }
  });

  // Instagram-friendly spots
  if (survey.instagramImportance >= 4) {
    const instaMatch = instagramTags.some(k => title.includes(k) || slotTags.some(t => t.toLowerCase().includes(k)));
    if (instaMatch) {
      score += 6;
    }
  }

  // Budget: light touch (no price data, so keep mild)
  if (survey.budgetLevel === 'low') {
    if (title.includes('fine dining') || title.includes('luxury')) score -= 6;
  }

  // Constraints: low stamina or mobility vs long/active slots
  if (survey.constraints.map(c => c.toLowerCase()).some(c => c.includes('low stamina') || c.includes('mobility'))) {
    if (title.includes('hike') || title.includes('trail') || title.includes('trek')) {
      score -= 10;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function scorePlan(plan: PlanPackage, members: Member[]): PlanFitScore {
  if (!members.length) {
    return { groupScore: 0, perMember: [], drivers: [], warnings: ['No members provided'] };
  }

  const perMember = members
    .filter(m => m.survey)
    .map(member => {
      const slotScores: number[] = [];
      plan.days.forEach(day => {
        day.slots.forEach(slot => {
          slotScores.push(slotScore(slot.title, slot.description, slot.tags || [], member));
        });
      });
      const base = slotScores.length ? slotScores.reduce((a, b) => a + b, 0) / slotScores.length : 50;
      const weight = member.survey?.priority === 'high' ? 1.1 : member.survey?.priority === 'low' ? 0.9 : 1;
      const finalScore = Math.min(100, Math.max(0, Math.round(base * weight)));
      const notes: string[] = [];
      if (finalScore < 50) notes.push('Below neutral fit');
      const instaImportance = member.survey?.instagramImportance ?? 3;
      if (instaImportance >= 4) notes.push('Needs photogenic spots');
      if (member.survey?.budgetLevel === 'low') notes.push('Prefer budget-friendly options');

      return { memberId: member.id, nickname: member.nickname, score: finalScore, notes };
    });

  const groupScore = perMember.length
    ? Math.round(perMember.reduce((acc, m) => acc + m.score, 0) / perMember.length)
    : 0;

  const drivers: string[] = [];
  if (groupScore >= 70) drivers.push('Good overall alignment to preferences');
  else drivers.push('Mixed alignment; review per-member scores');

  const warnings: string[] = perMember.filter(m => m.score < 50).map(m => `${m.nickname} low satisfaction`);

  return { groupScore, perMember, drivers, warnings };
}
