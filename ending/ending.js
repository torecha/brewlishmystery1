(function () {
  'use strict';
  const S = window.BMStorage;
  const locked = document.getElementById('ending-locked');
  const content = document.getElementById('ending-content');
  if (!S || !S.get('day10_answered', false)) return;

  locked.classList.add('hidden');
  content.classList.remove('hidden');

  const completedDays = Array.from({ length: 10 }, (_, index) => index + 1)
    .filter((day) => S.get(`day${String(day).padStart(2, '0')}_answered`, false)).length;
  const hints = Array.from({ length: 10 }, (_, index) => index + 1)
    .reduce((total, day) => total + Number(S.get(`day${String(day).padStart(2, '0')}_hint_level`, 0)), 0);
  const notes = S.get('investigation_notes', []);
  const evidence = S.get('selected_evidence', []);

  document.getElementById('stat-days').textContent = completedDays;
  document.getElementById('stat-hints').textContent = hints;
  document.getElementById('stat-notes').textContent = Array.isArray(notes) ? notes.length : 0;
  document.getElementById('stat-evidence').textContent = Array.isArray(evidence) ? evidence.length : 0;

  const film = document.getElementById('ending-film');
  film.addEventListener('ended', () => {
    S.set('ending_watched', true);
    document.body.classList.add('ending-watched');
  });
  if (S.get('ending_watched', false)) document.body.classList.add('ending-watched');
})();
