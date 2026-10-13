// score.js — 순수 채점 함수. DOM·백엔드 접근 없음.

/** 실제 답안만 [teamId, answer] 쌍으로 돌려준다. 제출 수·집계·체크마크는 전부 이 함수로 센다. */
export const realAnswers = doc => Object.entries(doc || {})
  .filter(([k, v]) => /^[\w-]+$/.test(k) && typeof v?.choice === 'number');

/**
 * questions: 채점에 넣을 문제들(호출하는 쪽이 공개된 문제만 골라 넘긴다)
 * answers:   { [qid]: { [teamId]: { choice, ms } } }
 * teams:     [{ id, name }]
 * 정답 수 내림차순, 같으면 맞힌 문제의 응답시간 합이 짧은 순. 동률은 같은 순위.
 */
export function rank(questions, answers, teams, tieBreak = 'speed') {
  const rows = teams.map(t => {
    let correct = 0, ms = 0;
    for (const q of questions) {
      if (typeof q.answer !== 'number') continue;
      const a = realAnswers(answers?.[q.id]).find(([k]) => k === String(t.id))?.[1];
      if (a && a.choice === q.answer) { correct++; ms += Number(a.ms) || 0; }
    }
    return { id: t.id, name: t.name, correct, ms };
  });
  const cmp = (a, b) => b.correct - a.correct || (tieBreak === 'speed' ? a.ms - b.ms : 0);
  rows.sort((a, b) => cmp(a, b) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
  rows.forEach((r, i) => { r.rank = i > 0 && cmp(rows[i - 1], r) === 0 ? rows[i - 1].rank : i + 1; });
  return rows;
}
