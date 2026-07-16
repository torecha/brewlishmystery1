(async function () {
  'use strict';
  const root = document.getElementById('day-root');
  if (!root) return;

  const dayNumber = Number(document.body.dataset.day);
  const S = window.BMStorage;
  const avatars = {
    'ブリュー': { glyph: '🐻‍❄️', role: '観察' },
    'リッシュ': { glyph: '🐩', role: '行動' },
    'カプくん': { glyph: '🥤', role: '違和感' }
  };
  const norm = value => String(value || '')
    .normalize('NFKC').trim().toLowerCase()
    .replace(/[\s　_\-.,。、!?！？「」『』()（）・:：]/g, '');
  const escape = value => {
    const node = document.createElement('div');
    node.textContent = String(value ?? '');
    return node.innerHTML;
  };

  try {
    const response = await fetch('../shared/config/days.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Dayデータに接続できません');
    const payload = await response.json();
    const day = payload.days.find(item => item.day === dayNumber);
    if (!day) throw new Error('指定されたDayが見つかりません');
    document.title = `Day.${day.day}｜Brewlish Mystery`;
    render(day);
    init(day);
  } catch (error) {
    root.innerHTML = `<section class="card error-banner"><p class="eyebrow">LOAD ERROR</p><h1>Dayを読み込めませんでした</h1><p>${escape(error.message)}</p><button class="button" onclick="location.reload()">再読み込み</button></section>`;
  }

  function render(day) {
    const story = day.sections.map((section, index) => {
      if (section.type === 'dialogue') {
        const avatar = avatars[section.speaker] || { glyph: '●', role: '探偵' };
        return `<div class="dialogue reveal-item" style="--delay:${index * 35}ms">
          <div class="avatar" aria-hidden="true">${avatar.glyph}</div>
          <div class="speech"><div class="speaker"><strong>${escape(section.speaker)}</strong><small>${avatar.role}</small></div><p>${escape(section.body)}</p></div>
        </div>`;
      }
      return `<section class="story-section reveal-item" style="--delay:${index * 35}ms">
        <p class="section-index">${String(index + 1).padStart(2, '0')}</p>
        <div><h2>${escape(section.heading)}</h2><p>${escape(section.body)}</p></div>
      </section>`;
    }).join('');

    const images = (day.images || []).map((src, index) => `
      <figure class="media-card">
        <button class="image-button" type="button" data-image="${escape(src)}" aria-label="資料画像${index + 1}を拡大">
          <img src="${escape(src)}" alt="Day.${day.day} 場面資料 ${index + 1}">
          <span class="zoom-mark" aria-hidden="true">＋</span>
        </button>
        <figcaption><span>SCENE ${String(index + 1).padStart(2, '0')}</span> 場面資料</figcaption>
      </figure>`).join('');

    root.innerHTML = `
      <header class="day-top">
        <nav class="day-nav" aria-label="Day navigation">
          <a href="../"><span aria-hidden="true">←</span> Series</a>
          <a class="phone-shortcut" href="../brewphone/">BrewPhone <span aria-hidden="true">↗</span></a>
        </nav>
        <div class="day-kicker"><span>CASE FILE 01</span><i></i><span>INVESTIGATION ${String(day.day).padStart(2, '0')} / 10</span></div>
        <h1>Day.${day.day}</h1>
        <p class="day-intro">${escape(day.intro)}</p>
        <div class="day-scroll"><span></span> READ THE RECORD</div>
      </header>

      <section class="day-content">
        <aside class="mission-card">
          <p class="eyebrow">TODAY'S MISSION</p>
          <p>${escape(day.mission)}</p>
          <div class="mission-status"><span id="mission-ring">0</span><small>調査済み</small></div>
        </aside>

        <article class="story-card">${story}</article>

        ${images ? `<section class="visual-section"><div class="section-label"><p class="eyebrow">VISUAL RECORDS</p><h2>場面を確認する</h2></div><div class="media-grid">${images}</div></section>` : ''}

        <section class="investigation-card" id="exploration">
          <div class="investigation-head">
            <div><p class="eyebrow">FIELD WORK</p><h2>現場を調べる</h2></div>
            <div class="progress-copy"><strong id="explore-count">0</strong><span id="explore-total">0</span></div>
          </div>
          <div id="explore-content" class="explore-content"></div>
          <div class="progress" aria-hidden="true"><span id="explore-progress" style="width:0%"></span></div>
          <p id="explore-status" class="muted" aria-live="polite"></p>
        </section>

        <section class="phone-handoff" id="phone-handoff">
          <div class="handoff-step"><span>02</span><div><p class="eyebrow">BREWPHONE INVESTIGATION</p><h2>BrewPhoneで資料を調べる</h2></div></div>
          <p>現場確認を終えたら、その日の資料をBrewPhoneへ解放します。必読資料を読み終えるまで「今日の問い」は表示されません。</p>
          <div class="handoff-locked" id="handoff-locked">
            <strong>現場調査がまだ完了していません</strong>
            <span>上の「現場を調べる」で必要な地点を確認してください。</span>
          </div>
          <div class="handoff-ready hidden" id="handoff-ready">
            <p class="code-label">Today's Brew Code</p>
            <div class="brew-code" id="brew-code">${escape(day.code)}</div>
            <p class="muted">コードを入力するとDay.${day.day}の資料と調査ミッションが追加されます。</p>
            <div class="code-actions"><button class="button" id="copy-code" type="button">コードをコピー</button><a class="button primary" id="open-phone" href="../brewphone/?day=${day.day}">BrewPhoneを開く</a></div>
          </div>
          <div class="phone-complete hidden" id="phone-complete"><span aria-hidden="true">✓</span><div><strong>BrewPhoneの調査完了</strong><p>必読資料を確認しました。今日の問いが解放されています。</p></div></div>
        </section>

        <section class="question-card hidden" id="question-card">
          <div class="handoff-step"><span>03</span><div><p class="eyebrow">TODAY'S QUESTION</p><h2>今日の問い</h2></div></div>
          <p class="question">${escape(day.question)}</p>
          <form id="answer-form" class="answer-row">
            <label class="sr-only" for="answer-input">回答</label>
            <input id="answer-input" autocomplete="off" placeholder="回答を入力してください">
            <button class="button primary">回答する</button>
          </form>
          <p id="answer-feedback" class="answer-feedback" aria-live="polite"></p>
          <button class="hint-trigger" id="hint-button" type="button"><span>段階ヒントを開く</span><b id="hint-count">0 / 4</b></button>
          <div class="hint-list" id="hint-list"></div>
        </section>

        <section class="success-panel hidden" id="success-panel">
          <div class="success-seal" aria-hidden="true">CORRECT</div>
          <p class="eyebrow">DEDUCTION COMPLETE</p>
          <h2>${escape(day.success.answer)}</h2>
          <div class="deduction-grid">
            <div><h3>使用資料</h3><ul>${day.success.materials.map(item => `<li>${escape(item)}</li>`).join('')}</ul></div>
            <div><h3>注目した事実</h3><ul>${day.success.facts.map(item => `<li>${escape(item)}</li>`).join('')}</ul></div>
          </div>
          <div class="logic-flow"><div><small>CONNECT</small><p>${escape(day.success.connection)}</p></div><span aria-hidden="true">↓</span><div><small>CONCLUSION</small><p>${escape(day.success.conclusion)}</p></div></div>
          <div class="remaining"><strong>まだ残る疑問</strong><p>${escape(day.success.remaining)}</p></div>
          <div class="investigation-finished">
            <span aria-hidden="true">✓</span>
            <div><p class="eyebrow">INVESTIGATION CLOSED</p><h3>Day.${day.day}の調査は終了です</h3><p>${day.day === 10 ? '最終記録とエンディングが解放されました。' : '捜査記録はこの端末に保存されました。次のQRが開くまで、BrewPhoneで資料を見返せます。'}</p></div>
          </div>
          <div class="end-actions"><a class="button" href="../brewphone/?day=${day.day}">資料を見返す</a>${day.day === 10 ? '<a class="button primary" href="../ending/">エンディングを見る</a>' : '<a class="button primary" href="../">シリーズトップへ</a>'}</div>
        </section>
      </section>

      <footer class="day-footer"><span>Brewlish Mystery</span><span>Series 01 / 潮騒館の最後の編集</span></footer>
      <a class="floating-phone" href="../brewphone/" aria-label="BrewPhoneを開く"><span>BP</span><small>BrewPhone</small></a>

      <div class="modal hidden" id="image-modal" role="dialog" aria-modal="true" aria-label="資料画像の拡大表示">
        <div class="modal-card"><button class="modal-close" aria-label="閉じる">×</button><img id="modal-image" alt="拡大した資料画像"><div class="modal-evidence-copy" id="modal-evidence-copy"></div></div>
      </div>`;
  }

  function init(day) {
    const key = `day${String(day.day).padStart(2, '0')}`;
    const explored = new Set(S.get(`${key}_explored`, []));
    const host = document.getElementById('explore-content');
    const required = Number(day.exploration.required || day.exploration.required_links?.length || day.exploration.fields?.length || 1);
    let total = required;

    const finding = document.createElement('div');
    finding.id = 'finding';
    finding.className = 'finding hidden';
    const showFinding = text => {
      finding.innerHTML = `<span aria-hidden="true">◈</span><p>${escape(text)}</p>`;
      finding.classList.remove('hidden');
      finding.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const save = () => S.set(`${key}_explored`, [...explored]);

    const openEvidenceImage = (src, label, text) => {
      const modal = document.getElementById('image-modal');
      const image = document.getElementById('modal-image');
      const copy = document.getElementById('modal-evidence-copy');
      image.src = src;
      image.alt = `${label}の資料画像`;
      copy.innerHTML = `<p class="eyebrow">FIELD RECORD</p><h3>${escape(label)}</h3><p>${escape(text)}</p><small>画像はピンチ操作または拡大表示で細部まで確認できます。</small>`;
      modal.classList.remove('hidden');
    };

    const addButton = (id, label, text, meta = '', image = '') => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `explore-item${explored.has(id) ? ' done' : ''}`;
      button.dataset.id = id;
      const actionLabel = image ? (explored.has(id) ? 'もう一度見る' : '画像を調べる') : (explored.has(id) ? '確認済み' : '確認する');
      button.innerHTML = `<span class="explore-number">${String(host.querySelectorAll('.explore-item').length + 1).padStart(2, '0')}</span><span class="explore-label"><strong>${escape(label)}</strong>${meta ? `<small>${escape(meta)}</small>` : ''}</span><span class="explore-action">${actionLabel}</span>`;
      button.addEventListener('click', () => {
        explored.add(id);
        button.classList.add('done');
        button.querySelector('.explore-action').textContent = image ? 'もう一度見る' : '確認済み';
        showFinding(text);
        if (image) openEvidenceImage(image, label, text);
        save();
        update();
      });
      host.appendChild(button);
    };

    const mode = day.exploration.mode;
    if (mode === 'hotspots') {
      total = day.exploration.hotspots.length;
      day.exploration.hotspots.forEach((item, index) => addButton(item.id || `spot-${index}`, item.label, item.finding || `${item.label}を確認した。`, '資料写真を開く', item.image || ''));
    } else if (mode === 'timeline') {
      total = day.exploration.events.length;
      day.exploration.events.forEach((item, index) => addButton(`event-${index}`, item, 'タイムラインへ配置した。時刻の前後関係を照合できる。', '時系列カード'));
    } else if (mode === 'puzzle_and_search') {
      total = 2;
      host.innerHTML = `<div class="puzzle-box"><p class="eyebrow">SUNDAY PUZZLE</p><h3>消えた座席番号</h3><div class="seat-line"><span>09</span><span>10</span><span>11</span><span>12</span><span class="missing">?</span><span>14</span><span>15</span></div><div class="answer-row"><input id="puzzle-answer" inputmode="numeric" aria-label="欠けた番号" placeholder="欠けた番号"><button class="button" id="puzzle-check" type="button">確認</button></div></div><div class="archive-search"><p class="eyebrow">ARCHIVE SEARCH</p><h3>記事番号を検索</h3><div class="answer-row"><input id="archive-search" aria-label="記事番号" placeholder="ARTICLE-___"><button class="button" id="archive-check" type="button">検索</button></div></div>`;
      document.getElementById('puzzle-check').onclick = () => {
        if (norm(document.getElementById('puzzle-answer').value) === '13') { explored.add('puzzle'); showFinding('正解。欠番は13。検索語「ARTICLE-13」が表示された。'); save(); update(); }
        else showFinding('座席番号が一つずつ増えていることを確認してください。');
      };
      document.getElementById('archive-check').onclick = () => {
        if (norm(document.getElementById('archive-search').value) === 'article13') { explored.add('search'); showFinding('2004年8月の記事「ARTICLE-13」を発見した。'); save(); update(); }
        else showFinding('パズルで得た記事番号を、英字と数字のまま入力してください。');
      };
    } else if (mode === 'conditional_hotspots') {
      total = day.exploration.hotspots.length + 1;
      day.exploration.hotspots.forEach((item, index) => {
        const label = typeof item === 'string' ? item : item.label;
        addButton(`spot-${index}`, label, `${label}を調べた。通常の確認だけでは、まだ決定的な物は見つからない。`);
      });
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'button emergency-action hidden';
      action.id = 'conditional-action';
      action.textContent = day.exploration.action_label;
      action.onclick = () => {
        if (explored.has('hidden-action')) return;
        explored.add('hidden-action'); save(); update();
        showFinding('映写機2号の裏の空洞から、清拭された巻き取りハンドルを発見した。');
        queueEmergency(day);
      };
      host.appendChild(action);
    } else if (mode === 'evidence_board') {
      total = day.exploration.required_links.length;
      day.exploration.required_links.forEach((pair, index) => addButton(`link-${index}`, `${pair[0]} ↔ ${pair[1]}`, '証拠の接続を比較ボードへ固定した。', '証拠リンク'));
    } else if (mode === 'final_reconstruction') {
      total = day.exploration.fields.length;
      const box = document.createElement('div');
      box.className = 'final-fields';
      day.exploration.fields.forEach((field, index) => {
        const label = document.createElement('label');
        label.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong>${escape(field)}</strong>`;
        const input = document.createElement('input');
        input.placeholder = `${field}を記入`;
        input.value = S.get(`${key}_field_${index}`, '');
        if (input.value.trim()) explored.add(`field-${index}`);
        input.addEventListener('input', () => {
          S.set(`${key}_field_${index}`, input.value);
          if (input.value.trim()) explored.add(`field-${index}`); else explored.delete(`field-${index}`);
          save(); update();
        });
        label.appendChild(input); box.appendChild(label);
      });
      host.appendChild(box);
    } else {
      const items = day.exploration.items || day.exploration.required_links || [];
      total = Math.max(1, items.length);
      items.forEach((item, index) => {
        const label = Array.isArray(item) ? item.join(' ↔ ') : item;
        addButton(`item-${index}`, label, mode === 'edit_sequence' ? `${label}を編集順へ置いた。前後の因果は映像が作ったものかもしれない。` : `${label}を確認し、他の時刻・記録と照合した。`);
      });
      if (!items.length) addButton('read', '資料を確認する', '調査資料を確認した。');
    }

    host.appendChild(finding);

    function update() {
      const count = Math.min(explored.size, total);
      const goal = Math.min(required, total);
      const percentage = Math.min(100, Math.round(count / Math.max(1, total) * 100));
      document.getElementById('explore-progress').style.width = `${percentage}%`;
      document.getElementById('explore-count').textContent = count;
      document.getElementById('explore-total').textContent = `/ ${total}`;
      document.getElementById('explore-status').textContent = count >= goal ? '必要な現場調査を完了しました。BrewPhoneへ進めます。' : `あと${goal - count}件確認すると、必要な調査が完了します。`;
      document.getElementById('mission-ring').textContent = `${percentage}%`;
      const fieldComplete = count >= goal;
      document.getElementById('handoff-locked').classList.toggle('hidden', fieldComplete);
      document.getElementById('handoff-ready').classList.toggle('hidden', !fieldComplete || S.get(`${key}_phone_complete`, false));
      const action = document.getElementById('conditional-action');
      if (action) {
        const ready = day.exploration.hotspots.every((_, index) => explored.has(`spot-${index}`));
        action.classList.toggle('hidden', !ready);
        if (explored.has('hidden-action')) { action.classList.remove('hidden'); action.disabled = true; action.textContent = '映写機の裏を調査済み'; }
      }
    }
    update();

    if (S.get(`${key}_answered`, false) && !S.get(`${key}_phone_complete`, false)) {
      S.set(`${key}_phone_complete`, true);
    }
    const phoneComplete = S.get(`${key}_phone_complete`, false);
    if (phoneComplete) {
      document.getElementById('phone-complete').classList.remove('hidden');
      document.getElementById('handoff-ready').classList.add('hidden');
      document.getElementById('handoff-locked').classList.add('hidden');
      document.getElementById('question-card').classList.remove('hidden');
    }

    let hintLevel = S.get(`${key}_hint_level`, 0);
    const hintList = document.getElementById('hint-list');
    const renderHints = () => {
      hintList.innerHTML = day.hints.slice(0, hintLevel).map((hint, index) => `<div class="hint-panel"><span>${index === 3 ? 'FINAL' : String(index + 1).padStart(2, '0')}</span><p>${escape(hint)}</p></div>`).join('');
      document.getElementById('hint-count').textContent = `${hintLevel} / 4`;
    };
    renderHints();
    document.getElementById('hint-button').onclick = () => {
      if (hintLevel < 4) { hintLevel += 1; S.set(`${key}_hint_level`, hintLevel); renderHints(); }
      if (hintLevel >= 4) document.getElementById('hint-button').disabled = true;
    };

    const success = (scroll = true) => {
      S.set(`${key}_answered`, true);
      const panel = document.getElementById('success-panel');
      panel.classList.remove('hidden');
      document.getElementById('answer-feedback').textContent = '正解です。推理結果を確認してください。';
      document.getElementById('answer-feedback').className = 'answer-feedback correct';
      if (scroll) setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    };
    if (S.get(`${key}_answered`, false)) success(false);
    document.getElementById('answer-form').addEventListener('submit', event => {
      event.preventDefault();
      if (!S.get(`${key}_phone_complete`, false)) return;
      const value = norm(document.getElementById('answer-input').value);
      const accepted = day.answer.accepted.map(norm);
      if (accepted.includes(value)) success();
      else {
        const feedback = document.getElementById('answer-feedback');
        feedback.textContent = 'まだ一致しません。資料を見直すか、段階ヒントを開いてください。';
        feedback.className = 'answer-feedback incorrect';
      }
    });

    document.getElementById('copy-code').onclick = async () => {
      try { await navigator.clipboard.writeText(day.code); document.getElementById('copy-code').textContent = 'コピーしました'; }
      catch (_) { document.getElementById('copy-code').textContent = 'コードを選択してコピー'; }
      localStorage.setItem('brewphone_pending_code', day.code);
      localStorage.setItem('brewphone_active_day', String(day.day));
    };
    document.getElementById('open-phone').onclick = () => {
      localStorage.setItem('brewphone_pending_code', day.code);
      localStorage.setItem('brewphone_active_day', String(day.day));
    };

    document.querySelectorAll('.image-button').forEach(button => {
      button.onclick = () => {
        openEvidenceImage(button.dataset.image, button.querySelector('img').alt, '場面資料を拡大表示しています。画面端、時計、手元、背景の掲示物も確認してください。');
      };
    });
    document.querySelector('.modal-close').onclick = () => document.getElementById('image-modal').classList.add('hidden');
    document.getElementById('image-modal').onclick = event => { if (event.target.id === 'image-modal') event.currentTarget.classList.add('hidden'); };
    document.addEventListener('keydown', event => { if (event.key === 'Escape') document.getElementById('image-modal').classList.add('hidden'); });
    window.BMImageFallback && window.BMImageFallback.bind(root);
    if (phoneComplete && (new URLSearchParams(location.search).get('stage') === 'question' || location.hash === '#question-card')) {
      setTimeout(() => document.getElementById('question-card').scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
    }
  }

  function queueEmergency(day) {
    if (!day.emergency) return;
    const event = day.emergency;
    if (S.get(`event_${event.id}`, false) || S.get(`event_pending_${event.id}`, false)) return;
    S.set(`event_pending_${event.id}`, true);
    localStorage.setItem('brewphone_active_day', String(day.day));
  }
})();
