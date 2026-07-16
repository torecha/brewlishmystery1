(async function () {
  'use strict';

  const main = document.getElementById('phone-main');
  const dock = document.getElementById('phone-dock');
  const modal = document.getElementById('phone-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const banner = document.getElementById('emergency-banner');

  let apps = [];
  let codes = [];
  let items = [];
  let emergencyEvents = [];
  let investigationPlans = [];
  let currentRoute = 'home';
  let modalKind = '';
  let lastFocused = null;

  const escapeHTML = (value) => {
    const node = document.createElement('div');
    node.textContent = String(value ?? '');
    return node.innerHTML;
  };
  const dayKey = (day) => `day${String(day).padStart(2, '0')}`;
  const state = () => BP.readState();

  updateClock();
  window.setInterval(updateClock, 30000);
  document.querySelectorAll('.dock button').forEach((button) => {
    button.addEventListener('click', () => render(button.dataset.route));
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });

  try {
    const [appData, codeData, contentData, eventData, planData] = await Promise.all([
      fetchJSON('data/apps.json'),
      fetchJSON('data/access-codes.json'),
      fetchJSON('data/content.json'),
      fetchJSON('data/emergency-events.json'),
      fetchJSON('data/investigation-plans.json')
    ]);
    apps = appData.apps.sort((a, b) => a.order - b.order);
    codes = codeData.codes;
    items = contentData.items;
    emergencyEvents = eventData.events || [];
    investigationPlans = planData.plans || [];
    const requestedDay = Number(new URLSearchParams(location.search).get('day'));
    if (requestedDay >= 1 && requestedDay <= 10) localStorage.setItem('brewphone_active_day', String(requestedDay));
    render('home');
    handleEmergencyEvent();
  } catch (error) {
    main.innerHTML = `<section class="no-data" role="alert"><strong>端末を起動できませんでした</strong><br>${escapeHTML(error.message)}<br><br><button class="button" type="button" onclick="location.reload()">再読み込み</button></section>`;
  }

  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} の読み込みに失敗しました`);
    return response.json();
  }

  function updateClock() {
    const clock = document.getElementById('phone-time');
    if (clock) clock.textContent = new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  }

  function visibleItems() {
    const unlocked = state().unlocked;
    return items.filter((item) => (
      unlocked.includes(dayKey(item.day)) ||
      (item.eventId && BMStorage.get(`event_${item.eventId}`, false))
    ));
  }

  function unreadCount(appId) {
    const read = state().read;
    return visibleItems().filter((item) => item.app === appId && !read.includes(item.id)).length;
  }

  function render(nextRoute) {
    currentRoute = nextRoute;
    const hasAccess = state().unlocked.length > 0;
    dock.classList.toggle('is-locked', !hasAccess);

    if (!hasAccess) {
      document.querySelectorAll('.dock button').forEach((button) => button.classList.remove('active'));
      renderAccessLock();
      return;
    }

    document.querySelectorAll('.dock button').forEach((button) => {
      button.classList.toggle('active', button.dataset.route === nextRoute);
    });

    const staticRoutes = {
      home: renderHome,
      search: renderSearch,
      evidence: renderEvidence,
      'investigation-notes': renderNotes,
      mission: renderMission,
      settings: renderSettings
    };
    if (staticRoutes[nextRoute]) staticRoutes[nextRoute]();
    else renderApp(nextRoute);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function renderAccessLock() {
    const pending = localStorage.getItem('brewphone_pending_code') || '';
    main.innerHTML = `
      <section class="access-lock">
        <div class="access-lock-card">
          <span class="lock-logo" aria-hidden="true">B</span>
          <p class="eyebrow">PRIVATE INVESTIGATION DEVICE</p>
          <h1>BrewPhone</h1>
          <p>捜査資料はロックされています。Dayサイトで入手した Today's Brew Code を入力してください。</p>
          <form class="code-row" id="lock-code-form">
            <label class="sr-only" for="lock-code-input">Access Code</label>
            <input id="lock-code-input" value="${escapeHTML(pending)}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ACCESS CODE">
            <button class="button" type="submit">解除</button>
          </form>
          <p class="code-message" id="lock-code-message" aria-live="polite"></p>
          <a class="entry-link" href="../day01/">Day 1「閉じた映写室」へ</a>
        </div>
      </section>`;
    bindCodeForm('lock-code-form', 'lock-code-input', 'lock-code-message');
    if (pending) document.getElementById('lock-code-input').focus();
  }

  function renderHome() {
    const current = state();
    const grid = apps.map((app) => {
      const count = unreadCount(app.id);
      return `
        <button class="app-icon" data-app="${escapeHTML(app.id)}" type="button">
          <span class="app-glyph" aria-hidden="true">${app.icon}</span>
          <span class="app-label">${escapeHTML(app.label)}</span>
          ${count ? `<span class="badge" aria-label="未読${count}件">${count > 99 ? '99+' : count}</span>` : ''}
        </button>`;
    }).join('');
    const pending = localStorage.getItem('brewphone_pending_code') || '';
    const percent = Math.round(current.unlocked.length / 10 * 100);

    main.innerHTML = `
      <section class="phone-hero">
        <p class="eyebrow">CASE FILE / SHIOSAI-KAN</p>
        <h1>潮騒館事件</h1>
        <p class="hero-sub">記録の順序を疑え。音声、時刻、写真、鍵をひとつの時系列へ。</p>
        <div class="unlock-summary"><span>捜査資料の解放</span><strong>${current.unlocked.length}<small>/10</small></strong></div>
        <div class="unlock-progress" aria-label="${percent}%完了"><i style="width:${percent}%"></i></div>
      </section>
      <div class="app-section-label"><span>Applications</span><span>${visibleItems().length} files available</span></div>
      <section class="app-grid" aria-label="BrewPhoneアプリ">${grid}</section>
      <section class="code-panel">
        <div class="code-panel-head"><strong>Access Code</strong><span>DAY UNLOCK</span></div>
        <p class="muted">Dayサイトで取得したコードを入力すると、新しい資料が追加されます。</p>
        <form class="code-row" id="home-code-form">
          <label class="sr-only" for="home-code-input">Access Code</label>
          <input id="home-code-input" value="${escapeHTML(pending)}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="CODE">
          <button class="button primary" type="submit">解放</button>
        </form>
        <p class="code-message" id="home-code-message" aria-live="polite"></p>
        <div class="day-status" aria-label="Day解放状況">${codes.map((code) => `<span class="day-pill ${current.unlocked.includes(code.key) ? 'open' : ''}" title="${escapeHTML(code.label)}">D${code.day}</span>`).join('')}</div>
      </section>`;

    document.querySelectorAll('[data-app]').forEach((button) => {
      button.addEventListener('click', () => render(button.dataset.app));
    });
    bindCodeForm('home-code-form', 'home-code-input', 'home-code-message');
  }

  function bindCodeForm(formId, inputId, messageId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById(inputId);
      const message = document.getElementById(messageId);
      const result = BP.unlockCode(input.value, codes);
      message.textContent = result.message;
      message.classList.toggle('is-error', !result.ok);
      if (!result.ok) {
        input.select();
        return;
      }
      localStorage.removeItem('brewphone_pending_code');
      if (result.already) {
        localStorage.setItem('brewphone_active_day', String(result.entry.day));
        toast(result.message);
        renderMission(result.entry.day);
        return;
      }
      dock.classList.remove('is-locked');
      showUnlockResult(result.entry);
    });
  }

  function showUnlockResult(entry) {
    localStorage.setItem('brewphone_active_day', String(entry.day));
    modalKind = 'unlock';
    openModal(`
      <section class="unlock-result">
        <span class="unlock-ring" aria-hidden="true">✓</span>
        <p class="eyebrow">ACCESS GRANTED / DAY ${entry.day}</p>
        <h2 id="modal-title">${escapeHTML(entry.label)}</h2>
        <p>新しい捜査資料がBrewPhoneへ追加されました。未読バッジの付いたアプリから確認できます。</p>
        <button class="button primary" id="unlock-continue" type="button">Day ${entry.day}の調査ミッションを開く</button>
      </section>`);
    document.getElementById('unlock-continue').addEventListener('click', () => {
      modalKind = '';
      closeModal();
      renderMission(entry.day);
    });
  }

  function phoneHeader(title, back = true) {
    return `<header class="phone-header">${back ? '<button class="back-button" id="phone-back" type="button" aria-label="ホームへ戻る">←</button>' : '<span></span>'}<h1>${escapeHTML(title)}</h1><span></span></header>`;
  }

  function bindBack() {
    const back = document.getElementById('phone-back');
    if (back) back.addEventListener('click', () => render('home'));
  }

  function renderApp(appId) {
    let filter = 'all';
    const app = apps.find((candidate) => candidate.id === appId);
    if (!app) {
      renderHome();
      return;
    }
    const list = visibleItems().filter((item) => item.app === appId);
    const availableDays = [...new Set(list.map((item) => item.day))].sort((a, b) => a - b);

    main.innerHTML = `${phoneHeader(`${app.icon} ${app.label}`)}
      <div class="filter-row" aria-label="Day絞り込み">
        <button data-filter="all" class="active" type="button">すべて</button>
        ${availableDays.map((day) => `<button data-filter="${day}" type="button">Day ${day}</button>`).join('')}
      </div>
      <div class="item-list" id="item-list"></div>`;
    bindBack();

    const paint = () => {
      const read = state().read;
      const filtered = filter === 'all' ? list : list.filter((item) => String(item.day) === filter);
      document.getElementById('item-list').innerHTML = filtered.length
        ? filtered.map((item) => itemRow(item, read)).join('')
        : '<div class="no-data">このアプリには、まだ解放済みの資料がありません。<br>次のBrew Codeで追加されることがあります。</div>';
      bindItemButtons();
    };
    paint();
    document.querySelectorAll('[data-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        filter = button.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((candidate) => candidate.classList.toggle('active', candidate === button));
        paint();
      });
    });
  }

  function itemRow(item, read) {
    const preview = item.subtitle || item.body.replace(/\n/g, ' ').slice(0, 62);
    return `
      <button class="data-item ${read.includes(item.id) ? '' : 'unread'}" data-item-id="${escapeHTML(item.id)}" type="button">
        <span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(preview)}</p></span>
        <span class="item-day">D${item.day}</span>
      </button>`;
  }

  function bindItemButtons(root = document) {
    root.querySelectorAll('[data-item-id]').forEach((button) => {
      button.addEventListener('click', () => openItem(button.dataset.itemId));
    });
  }

  function openItem(id) {
    const item = items.find((candidate) => candidate.id === id);
    if (!item || !visibleItems().some((candidate) => candidate.id === id)) return;
    const read = state().read;
    if (!read.includes(id)) {
      read.push(id);
      BMStorage.set('read_items', read);
    }

    const tags = [item.evidenceId, ...(item.tags || [])].filter(Boolean);
    const media = item.image ? `<figure class="detail-media"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}"><button class="media-zoom" type="button" data-detail-zoom>画像を拡大</button></figure>` : '';
    const meta = (item.meta || []).length ? `<dl class="record-meta">${item.meta.map((entry) => `<div><dt>${escapeHTML(entry.label)}</dt><dd>${escapeHTML(entry.value)}</dd></div>`).join('')}</dl>` : '';
    const transcript = (item.transcript || []).length ? `<section class="record-transcript"><h3>${escapeHTML(item.transcriptTitle || '記録全文')}</h3>${item.transcript.map((line) => `<div class="transcript-line"><strong>${escapeHTML(line.speaker || '記録')}</strong><p>${escapeHTML(line.text).replace(/\n/g, '<br>')}</p></div>`).join('')}</section>` : '';
    const sections = (item.sections || []).length ? `<div class="record-sections">${item.sections.map((section) => `<section><h3>${escapeHTML(section.heading)}</h3><p>${escapeHTML(section.body).replace(/\n/g, '<br>')}</p></section>`).join('')}</div>` : '';
    const annotations = (item.annotations || []).length ? `<aside class="record-annotations"><h3>捜査上の注記</h3><ul>${item.annotations.map((note) => `<li>${escapeHTML(note)}</li>`).join('')}</ul></aside>` : '';
    const audio = item.audio ? renderAudioPlayer(item) : '';
    const video = item.video ? `<section class="evidence-video"><p class="eyebrow">EVIDENCE VIDEO</p><video controls playsinline preload="metadata" ${item.video.poster ? `poster="${escapeHTML(item.video.poster)}"` : ''}><source src="${escapeHTML(item.video.src)}" type="video/mp4">このブラウザでは映像を再生できません。</video><p>${escapeHTML(item.video.caption || '')}</p></section>` : '';
    const discoveries = (item.discoveries || []).length ? `<section class="visual-discoveries"><p class="eyebrow">VISUAL SEARCH</p><h3>画像・資料内の文字を調べる</h3><p>気になった固有名詞や表示を入力してください。正しい検索語なら関連サイトが見つかります。</p>${item.discoveries.map((clue, index) => `<form class="discovery-search" data-discovery data-answer="${escapeHTML(clue.answer)}" data-link="${escapeHTML(clue.link || '')}"><label>${escapeHTML(clue.prompt)}</label><div><input autocomplete="off" placeholder="検索語"><button class="button" type="submit">検索</button></div><p class="discovery-result" aria-live="polite"></p></form>`).join('')}</section>` : '';
    modalKind = 'item';
    openModal(`
      <article class="item-detail format-${escapeHTML(item.format || item.app)}">
        <p class="eyebrow">DAY ${item.day} / ${escapeHTML(item.app)} / ${escapeHTML(item.id)}</p>
        <h2 id="modal-title">${escapeHTML(item.title)}</h2>
        ${item.subtitle ? `<p class="detail-subtitle">${escapeHTML(item.subtitle)}</p>` : ''}
        ${meta}
        ${media}
        ${audio}
        ${video}
        <div class="detail-body">${escapeHTML(item.body || '').replace(/\n/g, '<br>')}</div>
        ${sections}
        ${transcript}
        ${annotations}
        ${discoveries}
        <div class="detail-tags">${tags.map((tag, index) => `<span class="tag ${index === 0 && item.evidenceId ? 'evidence-id' : ''}">${escapeHTML(tag)}</span>`).join('')}</div>
        ${item.link ? `<a class="button primary site-link" href="${escapeHTML(item.link)}">関連する公開Web資料を開く ↗</a>` : ''}
      </article>`);
    bindRichItemControls(item);
    maybeTriggerItemEmergency(item);
    if (window.BMImageFallback) window.BMImageFallback.bind(modalBody);
  }

  function renderAudioPlayer(item) {
    const audio = item.audio;
    if (audio.src) {
      return `<section class="recorder-player"><div class="waveform" aria-hidden="true">${Array.from({ length: 38 }, (_, index) => `<i style="--h:${22 + ((index * 17) % 66)}%"></i>`).join('')}</div><audio controls preload="metadata" src="${escapeHTML(audio.src)}"></audio><div class="recorder-meta"><span>${escapeHTML(audio.duration || '')}</span><span>${escapeHTML(audio.quality || '館内記録音声')}</span></div></section>`;
    }
    return `<section class="recorder-player" data-speech-player><div class="waveform" aria-hidden="true">${Array.from({ length: 38 }, (_, index) => `<i style="--h:${22 + ((index * 17) % 66)}%"></i>`).join('')}</div><button class="recorder-play" type="button" data-speech-play><span>▶</span><strong>音声を再生</strong></button><div class="recorder-meta"><span>${escapeHTML(audio.duration || '')}</span><span>${escapeHTML(audio.quality || '館内記録音声')}</span></div><p class="speech-note">端末の日本語音声機能で記録を再現します。再生には音量を上げてください。</p></section>`;
  }

  function bindRichItemControls(item) {
    const zoom = modalBody.querySelector('[data-detail-zoom]');
    if (zoom) zoom.addEventListener('click', () => modalBody.querySelector('.detail-media')?.classList.toggle('is-zoomed'));

    const play = modalBody.querySelector('[data-speech-play]');
    if (play && item.audio) {
      let speaking = false;
      const finish = () => {
        speaking = false;
        play.closest('[data-speech-player]')?.classList.remove('is-playing');
        if (document.contains(play)) play.innerHTML = '<span>▶</span><strong>音声を再生</strong>';
      };
      play.addEventListener('click', () => {
        if (!('speechSynthesis' in window)) {
          toast('このブラウザでは音声再現を利用できません');
          return;
        }
        if (speaking) {
          window.speechSynthesis.cancel();
          finish();
          return;
        }
        window.speechSynthesis.cancel();
        speaking = true;
        play.closest('[data-speech-player]').classList.add('is-playing');
        play.innerHTML = '<span>■</span><strong>再生を停止</strong>';
        const text = item.audio.speech || (item.transcript || []).map((line) => line.text).join('。') || item.body;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = item.audio.rate || 0.88;
        utterance.pitch = item.audio.pitch || 0.82;
        utterance.volume = 0.9;
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      });
    }

    modalBody.querySelectorAll('[data-discovery]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = form.querySelector('input');
        const result = form.querySelector('.discovery-result');
        const expected = normalizeSearch(form.dataset.answer);
        const actual = normalizeSearch(input.value);
        if (actual && (actual.includes(expected) || expected.includes(actual))) {
          result.className = 'discovery-result is-found';
          result.innerHTML = form.dataset.link ? `一致する記録を発見しました。<br><a class="button primary" href="${escapeHTML(form.dataset.link)}">関連サイトを開く ↗</a>` : '一致する記録を発見しました。';
        } else {
          result.className = 'discovery-result is-miss';
          result.textContent = '一致する記録はありません。画像に実際に写っている表記を短く入力してください。';
        }
      });
    });
  }

  function normalizeSearch(value) {
    return String(value || '').normalize('NFKC').toLowerCase().replace(/[\s　._\-・:：/]/g, '');
  }

  function renderSearch() {
    main.innerHTML = `${phoneHeader('Search')}
      <label class="sr-only" for="search-input">捜査資料を検索</label>
      <input class="search-box" id="search-input" type="search" autocomplete="off" placeholder="人物、時刻、証拠ID、言葉を検索">
      <div class="item-list" id="search-results"><div class="no-data">検索対象は解放済みの資料だけです。<br>例：20:46、真綾、EV-003</div></div>`;
    bindBack();
    const input = document.getElementById('search-input');
    input.focus();
    input.addEventListener('input', () => {
      const query = input.value.normalize('NFKC').toLowerCase().trim();
      const result = query ? visibleItems().filter((item) => JSON.stringify(item).normalize('NFKC').toLowerCase().includes(query)) : [];
      document.getElementById('search-results').innerHTML = result.length
        ? result.map((item) => itemRow(item, state().read)).join('')
        : `<div class="no-data">${query ? '一致する解放済み資料はありません。' : '検索語を入力してください。'}</div>`;
      bindItemButtons(document.getElementById('search-results'));
    });
  }

  function renderEvidence() {
    const evidence = visibleItems().filter((item) => item.app === 'evidence' || item.evidenceId);
    const selected = state().selectedEvidence;
    const selectedItems = selected.map((id) => items.find((item) => item.id === id)).filter(Boolean);

    main.innerHTML = `${phoneHeader('Evidence Board')}
      <section class="board-card">
        <h2>比較ボード <span class="tag">${selectedItems.length}件</span></h2>
        <p class="muted">気になる証拠を固定し、別の資料と照合してください。</p>
        <div class="board-summary">${selectedItems.length ? selectedItems.map((item) => `<span class="tag evidence-id">${escapeHTML(item.evidenceId || item.title)}</span>`).join('') : '<span class="muted">まだ証拠は選択されていません。</span>'}</div>
      </section>
      <div class="item-list">${evidence.length ? evidence.map((item) => `
        <div class="data-item evidence-check">
          <input type="checkbox" id="select-${escapeHTML(item.id)}" data-evidence-select="${escapeHTML(item.id)}" ${selected.includes(item.id) ? 'checked' : ''}>
          <label for="select-${escapeHTML(item.id)}"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.evidenceId || `Day ${item.day}`)}</p></label>
          <button type="button" class="button" data-open-evidence="${escapeHTML(item.id)}">開く</button>
        </div>`).join('') : '<div class="no-data">解放済みの証拠はありません。</div>'}</div>`;
    bindBack();
    document.querySelectorAll('[data-evidence-select]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        let ids = BMStorage.get('selected_evidence', []);
        if (checkbox.checked && !ids.includes(checkbox.dataset.evidenceSelect)) ids.push(checkbox.dataset.evidenceSelect);
        if (!checkbox.checked) ids = ids.filter((id) => id !== checkbox.dataset.evidenceSelect);
        BMStorage.set('selected_evidence', ids.slice(0, 8));
        renderEvidence();
      });
    });
    document.querySelectorAll('[data-open-evidence]').forEach((button) => {
      button.addEventListener('click', () => openItem(button.dataset.openEvidence));
    });
  }

  function renderNotes(editId = '') {
    const notes = BP.notes.load();
    const editing = notes.find((note) => note.id === editId);
    main.innerHTML = `${phoneHeader('Investigation Notes')}
      <form class="note-form" id="note-form">
        <input type="hidden" id="note-id" value="${escapeHTML(editing?.id || '')}">
        <label class="sr-only" for="note-title">メモのタイトル</label>
        <input id="note-title" value="${escapeHTML(editing?.title || '')}" placeholder="メモのタイトル" required>
        <label class="sr-only" for="note-body">メモ本文</label>
        <textarea id="note-body" placeholder="気づいたこと、仮説、時系列">${escapeHTML(editing?.body || '')}</textarea>
        <div class="note-fields">
          <input id="note-person" value="${escapeHTML(editing?.person || '')}" placeholder="人物別分類">
          <input id="note-day" value="${escapeHTML(editing?.day || '')}" placeholder="Day別分類">
        </div>
        <input id="note-evidence" value="${escapeHTML(editing?.evidence || '')}" placeholder="証拠ID（例：EV-003）">
        <div class="note-submit-row">
          <button class="button primary" type="submit">${editing ? '変更を保存' : 'ノートへ追加'}</button>
          ${editing ? '<button class="button" id="cancel-note-edit" type="button">取消</button>' : ''}
        </div>
      </form>
      <div class="export-row">
        <button class="button" id="copy-notes" type="button">テキストをコピー</button>
        <button class="button" id="download-notes-text" type="button">TXT書き出し</button>
        <button class="button" id="download-notes-json" type="button">JSON書き出し</button>
      </div>
      <div class="item-list" id="notes-list">${notes.length ? notes.map(noteCard).join('') : '<div class="no-data">まだ捜査メモはありません。<br>違和感、人物の嘘、時刻を自由に記録できます。</div>'}</div>`;
    bindBack();

    document.getElementById('note-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const id = valueOf('note-id');
      const note = {
        title: valueOf('note-title'), body: valueOf('note-body'),
        person: valueOf('note-person'), day: valueOf('note-day'), evidence: valueOf('note-evidence')
      };
      if (id) BP.notes.update(id, note);
      else BP.notes.add(note);
      renderNotes();
    });
    const cancel = document.getElementById('cancel-note-edit');
    if (cancel) cancel.addEventListener('click', () => renderNotes());

    document.querySelectorAll('[data-note]').forEach((card) => {
      card.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => handleNoteAction(card.dataset.note, button.dataset.action));
      });
    });
    document.getElementById('copy-notes').addEventListener('click', async () => {
      await copyText(BP.notes.exportText());
      toast('捜査ノートをコピーしました');
    });
    document.getElementById('download-notes-text').addEventListener('click', () => download('brewlish-investigation-notes.txt', BP.notes.exportText(), 'text/plain'));
    document.getElementById('download-notes-json').addEventListener('click', () => download('brewlish-investigation-notes.json', JSON.stringify(BP.notes.load(), null, 2), 'application/json'));
  }

  function noteCard(note) {
    return `<article class="note-card ${note.done ? 'done' : ''}" data-note="${escapeHTML(note.id)}">
      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.body).replace(/\n/g, '<br>') || '本文なし'}</p>
      <div class="note-meta"><span>Day ${escapeHTML(note.day || '—')}</span><span>${escapeHTML(note.person || '人物未分類')}</span><span>${escapeHTML(note.evidence || '証拠IDなし')}</span></div>
      <div class="note-actions">
        <button data-action="toggle" type="button">${note.done ? '未完了へ' : '確認済み'}</button>
        <button data-action="up" type="button" aria-label="上へ移動">↑</button>
        <button data-action="down" type="button" aria-label="下へ移動">↓</button>
        <button data-action="edit" type="button">編集</button>
        <button data-action="delete" type="button">削除</button>
      </div>
    </article>`;
  }

  function handleNoteAction(id, action) {
    const note = BP.notes.load().find((candidate) => candidate.id === id);
    if (!note) return;
    if (action === 'edit') {
      renderNotes(id);
      return;
    }
    if (action === 'delete') {
      if (!window.confirm('この捜査メモを削除しますか？')) return;
      BP.notes.remove(id);
    }
    if (action === 'toggle') BP.notes.update(id, { done: !note.done });
    if (action === 'up') BP.notes.move(id, -1);
    if (action === 'down') BP.notes.move(id, 1);
    renderNotes();
  }

  function renderMission(dayOverride) {
    currentRoute = 'mission';
    document.querySelectorAll('.dock button').forEach((button) => button.classList.toggle('active', button.dataset.route === 'mission'));
    const unlockedDays = state().unlocked.map((key) => Number(key.replace('day', ''))).filter(Boolean);
    const storedDay = Number(localStorage.getItem('brewphone_active_day'));
    const requestedDay = Number(dayOverride);
    const activeDay = unlockedDays.includes(requestedDay)
      ? requestedDay
      : (unlockedDays.includes(storedDay) ? storedDay : Math.max(...unlockedDays, 1));
    localStorage.setItem('brewphone_active_day', String(activeDay));
    const plan = investigationPlans.find((candidate) => candidate.day === activeDay);
    if (!plan) {
      main.innerHTML = `${phoneHeader('Mission')}<div class="no-data">Day ${activeDay}の調査計画を読み込めませんでした。</div>`;
      bindBack();
      return;
    }

    const read = new Set(state().read);
    const requiredItems = plan.required.map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const recommendedItems = plan.recommended.map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const completedRequired = requiredItems.filter((item) => read.has(item.id));
    const remaining = requiredItems.filter((item) => !read.has(item.id));
    const percent = Math.round(completedRequired.length / Math.max(requiredItems.length, 1) * 100);
    const phoneComplete = BMStorage.get(`${dayKey(activeDay)}_phone_complete`, false);

    const missionItem = (item, required) => `<button class="mission-file ${read.has(item.id) ? 'is-read' : ''}" data-item-id="${escapeHTML(item.id)}" type="button"><span class="mission-check">${read.has(item.id) ? '✓' : '○'}</span><span><small>${required ? '必読' : '参考'} / ${escapeHTML(item.app)}</small><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.subtitle || item.body.slice(0, 72))}</p></span><span class="mission-open">開く</span></button>`;

    main.innerHTML = `${phoneHeader(`Day ${activeDay} Mission`)}
      <nav class="mission-day-tabs" aria-label="解放済みDayの調査ミッション">${unlockedDays.sort((a, b) => a - b).map((day) => `<button type="button" data-mission-day="${day}" class="${day === activeDay ? 'active' : ''}">D${day}</button>`).join('')}</nav>
      <section class="mission-dashboard">
        <p class="eyebrow">INVESTIGATION ${String(activeDay).padStart(2, '0')} / 10</p>
        <h1>${escapeHTML(plan.title)}</h1>
        <p>${escapeHTML(plan.briefing)}</p>
        <div class="mission-progress-head"><strong>${completedRequired.length}<small> / ${requiredItems.length}</small></strong><span>必読資料を確認</span></div>
        <div class="mission-progress"><i style="width:${percent}%"></i></div>
      </section>
      <section class="mission-files">
        <div class="mission-section-title"><h2>必読資料</h2><span>${remaining.length ? `残り${remaining.length}件` : '確認完了'}</span></div>
        ${requiredItems.map((item) => missionItem(item, true)).join('')}
      </section>
      ${recommendedItems.length ? `<section class="mission-files optional"><div class="mission-section-title"><h2>参考資料・寄り道</h2><span>推理の背景</span></div>${recommendedItems.map((item) => missionItem(item, false)).join('')}</section>` : ''}
      <section class="mission-finish ${remaining.length ? 'is-locked' : ''}">
        <p class="eyebrow">FINAL STEP</p>
        <h2>${remaining.length ? '今日の問いはまだロックされています' : (phoneComplete ? 'BrewPhone調査は完了済みです' : 'BrewPhone調査を完了できます')}</h2>
        <p>${remaining.length ? `必読資料をあと${remaining.length}件開いて確認してください。任意資料は未読でも進めます。` : '必読資料を確認しました。Dayサイトへ戻ると、今日の問いが表示されます。'}</p>
        <button class="button primary" id="complete-phone-mission" type="button" ${remaining.length ? 'disabled' : ''}>${escapeHTML(plan.returnLabel)}</button>
      </section>`;
    bindBack();
    bindItemButtons(main);
    document.querySelectorAll('[data-mission-day]').forEach((button) => button.addEventListener('click', () => renderMission(Number(button.dataset.missionDay))));
    document.getElementById('complete-phone-mission').addEventListener('click', () => {
      if (remaining.length) return;
      BMStorage.set(`${dayKey(activeDay)}_phone_complete`, true);
      localStorage.setItem('brewphone_active_day', String(activeDay));
      location.href = `../day${String(activeDay).padStart(2, '0')}/?stage=question#question-card`;
    });

    if (!remaining.length && plan.emergency?.triggerComplete) {
      window.setTimeout(() => triggerEmergency(plan.emergency.id), 220);
    }
  }

  function renderSettings() {
    const current = state();
    main.innerHTML = `${phoneHeader('Settings')}
      <section class="settings-card">
        <div class="settings-row"><span>緊急イベントの振動</span><input type="checkbox" id="vibration-toggle" ${current.vibration ? 'checked' : ''}></div>
        <div class="settings-row"><span>解放済みDay</span><strong>${current.unlocked.length} / 10</strong></div>
        <div class="settings-row"><span>既読資料</span><strong>${current.read.length} / ${visibleItems().length}</strong></div>
        <div class="settings-row"><span>保存方式</span><strong>この端末内のみ</strong></div>
      </section>
      <section class="settings-card">
        <p class="muted">リセットするとAccess Code、既読、イベント、捜査ノートがこのブラウザから削除されます。</p>
        <button class="button danger" id="reset-progress" type="button">すべての進行状況をリセット</button>
      </section>`;
    bindBack();
    document.getElementById('vibration-toggle').addEventListener('change', (event) => BMStorage.set('vibration_enabled', event.target.checked));
    document.getElementById('reset-progress').addEventListener('click', () => {
      if (!window.confirm('すべての進行状況と捜査ノートを削除しますか？この操作は元に戻せません。')) return;
      Object.keys(localStorage).filter((key) => key.startsWith(BMStorage.prefix) || key === 'brewphone_pending_code' || key === 'brewphone_active_day').forEach((key) => localStorage.removeItem(key));
      location.reload();
    });
  }

  function openModal(html) {
    lastFocused = document.activeElement;
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    if (modal.classList.contains('hidden')) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    const kind = modalKind;
    modalKind = '';
    if (kind === 'unlock') render('home');
    else if (currentRoute === 'home') renderHome();
    else render(currentRoute);
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }

  function handleEmergencyEvent() {
    const url = new URL(location.href);
    const queryEvent = url.searchParams.get('event');
    const pendingEvent = emergencyEvents.find((event) => BMStorage.get(`event_pending_${event.id}`, false));
    const eventId = queryEvent || pendingEvent?.id;
    if (eventId) triggerEmergency(eventId, false);
    if (queryEvent) {
      url.searchParams.delete('event');
      history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function maybeTriggerItemEmergency(item) {
    const plan = investigationPlans.find((candidate) => candidate.day === item.day);
    if (plan?.emergency?.triggerItem === item.id) triggerEmergency(plan.emergency.id, true);
  }

  function triggerEmergency(eventId, userActivated = false) {
    const emergency = emergencyEvents.find((candidate) => candidate.id === eventId);
    if (!emergency || BMStorage.get(`event_${eventId}`, false)) return;
    BMStorage.set(`event_${eventId}`, true);
    BMStorage.remove(`event_pending_${eventId}`);
    banner.innerHTML = `<div><strong>EMERGENCY UPDATE</strong><br>${escapeHTML(emergency.message)}</div><button type="button" data-emergency-ack>通知を確認</button>`;
    banner.classList.remove('hidden');
    banner.querySelector('[data-emergency-ack]').addEventListener('click', () => {
      activateEmergencyEffects(emergency, true);
      banner.classList.add('is-acknowledged');
      window.setTimeout(() => banner.classList.add('hidden'), 4200);
    });
    activateEmergencyEffects(emergency, userActivated);
    toast('緊急更新を受信しました');
  }

  function activateEmergencyEffects(emergency, userActivated) {
    const shell = document.querySelector('.phone-shell');
    shell.classList.remove('phone-shake');
    void shell.offsetWidth;
    shell.classList.add('phone-shake');
    window.setTimeout(() => shell.classList.remove('phone-shake'), 520);
    if (state().vibration && navigator.vibrate) {
      try { navigator.vibrate(emergency.vibration || [180, 100, 180]); } catch (_) {}
    }
    if (userActivated) playEmergencyTone();
  }

  function playEmergencyTone() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.56);
      gain.connect(context.destination);
      [0, 0.22].forEach((offset) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 720;
        oscillator.connect(gain);
        oscillator.start(context.currentTime + offset);
        oscillator.stop(context.currentTime + offset + 0.14);
      });
      window.setTimeout(() => context.close(), 900);
    } catch (_) {}
  }

  function toast(text) {
    const region = document.getElementById('phone-toast-region');
    region.innerHTML = '';
    const toastNode = document.createElement('div');
    toastNode.className = 'phone-toast';
    toastNode.textContent = text;
    region.appendChild(toastNode);
    window.setTimeout(() => toastNode.remove(), 3400);
  }

  function valueOf(id) {
    return document.getElementById(id).value.trim();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  function download(name, text, type) {
    const anchor = document.createElement('a');
    const url = URL.createObjectURL(new Blob([text], { type }));
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
})();
