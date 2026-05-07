const KEY = 'sharktype_user';

export const DEFAULT_USER = {
  username: '',
  level: 'Beginner',
  lessonsCompleted: [],
  badges: [],
  bestWpm: 0,
  bestAccuracy: 0,
  sessionsPlayed: 0,
  chunkSessions: 0,
  chaseSessions: 0,
  chaseNoDeath: 0,
};

export function loadUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return { ...DEFAULT_USER, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}

export const ALL_BADGES = [
  { id: 'lesson_1', name: 'Home Row Master', desc: 'Complete the Home Row lesson', icon: '⌨️' },
  { id: 'lesson_2', name: 'Top Row Tamer', desc: 'Complete the Top Row lesson', icon: '🔝' },
  { id: 'lesson_3', name: 'Bottom Feeder', desc: 'Complete the Bottom Row lesson', icon: '⬇️' },
  { id: 'lesson_4', name: 'Number Cruncher', desc: 'Complete the Numbers lesson', icon: '🔢' },
  { id: 'lesson_5', name: 'Symbol Sage', desc: 'Complete the Symbols lesson', icon: '💫' },
  { id: 'wpm_60', name: 'Speed Demon', desc: 'Hit 60 WPM', icon: '⚡' },
  { id: 'wpm_80', name: 'Lightning Fingers', desc: 'Hit 80 WPM', icon: '🌩️' },
  { id: 'accuracy_98', name: 'Precision Expert', desc: '98%+ accuracy in a session', icon: '🎯' },
  { id: 'chase_no_death', name: 'Perfect Chase', desc: 'Finish Shark Chase without losing a life', icon: '🦈' },
  { id: 'chunk_5', name: 'Chunk Master', desc: 'Complete 5 Chunk Reading sessions', icon: '📖' },
  { id: 'sessions_20', name: 'Dedicated Typist', desc: 'Play 20 total sessions', icon: '🏆' },
  { id: 'all_lessons', name: 'Complete Scholar', desc: 'Complete all 5 lessons', icon: '🎓' },
];

export function awardBadge(user, badgeId) {
  if (user.badges.includes(badgeId)) return user;
  return { ...user, badges: [...user.badges, badgeId] };
}

export function checkAndAwardBadges(user) {
  let updated = { ...user };

  if (updated.bestWpm >= 60) updated = awardBadge(updated, 'wpm_60');
  if (updated.bestWpm >= 80) updated = awardBadge(updated, 'wpm_80');
  if (updated.bestAccuracy >= 98) updated = awardBadge(updated, 'accuracy_98');
  if (updated.chunkSessions >= 5) updated = awardBadge(updated, 'chunk_5');
  if (updated.sessionsPlayed >= 20) updated = awardBadge(updated, 'sessions_20');
  if (updated.lessonsCompleted.length === 5) updated = awardBadge(updated, 'all_lessons');

  return updated;
}
