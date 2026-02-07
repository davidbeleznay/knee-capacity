/**
 * Streak milestones – pure data.
 * Structure:
 *   - day: number (streak length required)
 *   - rewards: { badges: string[], graceTokenCap?: number, graceTokens?: number }
 *   - celebration: { title: string, subtitle: string }
 *
 * Not wired to app logic yet; use STREAK_MILESTONES and getMilestoneByDay() when ready.
 */

const STREAK_MILESTONES = [
  {
    day: 3,
    rewards: {
      badges: ['spark'],
      graceTokenCap: undefined,
      graceTokens: undefined
    },
    celebration: {
      title: 'Spark',
      subtitle: '3 days in a row – you’re building momentum.'
    }
  },
  {
    day: 7,
    rewards: {
      badges: ['anchor'],
      graceTokenCap: 1,
      graceTokens: 1
    },
    celebration: {
      title: 'One Week',
      subtitle: 'One week strong. You’ve unlocked 1 grace token.'
    }
  },
  {
    day: 10,
    rewards: {
      badges: ['double_digits'],
      graceTokenCap: undefined,
      graceTokens: undefined
    },
    celebration: {
      title: 'Double digits',
      subtitle: '10 days straight – serious consistency.'
    }
  },
  {
    day: 14,
    rewards: {
      badges: ['two_weeks'],
      graceTokenCap: undefined,
      graceTokens: undefined
    },
    celebration: {
      title: 'Two Weeks',
      subtitle: 'A full two weeks of showing up.'
    }
  },
  {
    day: 21,
    rewards: {
      badges: ['habit_groove'],
      graceTokenCap: undefined,
      graceTokens: undefined
    },
    celebration: {
      title: 'Three Weeks',
      subtitle: '21 days – you’re in the groove.'
    }
  },
  {
    day: 30,
    rewards: {
      badges: ['month_one'],
      graceTokenCap: undefined,
      graceTokens: undefined
    },
    celebration: {
      title: 'One Month',
      subtitle: 'Your first 30-day streak. Huge.'
    }
  },
  { day: 50, rewards: { badges: ['fifty'] }, celebration: { title: '50 Days', subtitle: 'Fifty days of consistency.' } },
  { day: 75, rewards: { badges: ['seventy_five'] }, celebration: { title: '75 Days', subtitle: 'Seventy-five days strong.' } },
  { day: 100, rewards: { badges: ['hundred'] }, celebration: { title: '100 Days', subtitle: 'A hundred days. Legendary.' } }
];

/**
 * Get the milestone definition for a given streak day, or undefined.
 * @param {number} day - Streak length (e.g. 7)
 * @returns {Object|undefined} Milestone object or undefined
 */
function getMilestoneByDay(day) {
  if (day == null || typeof day !== 'number') return undefined;
  return STREAK_MILESTONES.find(m => m.day === day);
}

/**
 * Get all milestones up to and including a given day (for “earned so far”).
 * @param {number} day - Streak length
 * @returns {Array}
 */
function getMilestonesEarnedByDay(day) {
  if (day == null || typeof day !== 'number') return [];
  return STREAK_MILESTONES.filter(m => m.day <= day);
}

function getNextMilestone(day) {
  if (day == null || typeof day !== 'number') return undefined;
  return STREAK_MILESTONES.find(m => m.day > day);
}

if (typeof window !== 'undefined') {
  window.STREAK_MILESTONES = STREAK_MILESTONES;
  window.getMilestoneByDay = getMilestoneByDay;
  window.getMilestonesEarnedByDay = getMilestonesEarnedByDay;
  window.getNextMilestone = getNextMilestone;
}
