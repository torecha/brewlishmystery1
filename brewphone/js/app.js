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
    const [appData, codeData, contentData, eventData] = await Promise.all([
      fetchJSON('data/apps.json'),
      fetchJSON('data/access-codes.json'),
      fetchJSON('data/content.json'),
      fetchJSON('data/emergency-events.json')
    ]);
    apps = appData.apps.sort((a, b) => a.order - b.order);
    codes = codeData.codes;
    items = contentData.items;
    emergencyEvents = eventData.events || [];
    handleEmergencyEvent();
    render('home');
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
        toast(result.message);
        return;
      }
      dock.classList.remove('is-locked');
      showUnlockResult(result.entry);
    });
  }

  function showUnlockResult(entry) {
    modalKind = 'unlock';
    openModal(`
      <section class="unlock-result">
        <span class="unlock-ring" aria-hidden="true">✓</span>
        <p class="eyebrow">ACCESS GRANTED / DAY ${entry.day}</p>
        <h2 id="modal-title">${escapeHTML(entry.label)}</h2>
        <p>新しい捜査資料がBrewPhoneへ追加されました。未読バッジの付いたアプリから確認できます。</p>
        <button class="button primary" id="unlock-continue" type="button">追加された資料を見る</button>
      </section>`);
    document.getElementById('unlock-continue').addEventListener('click', closeModal);
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
    const media = item.image ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">` : '';
    modalKind = 'item';
    openModal(`
      <article class="item-detail">
        <p class="eyebrow">DAY ${item.day} / ${escapeHTML(item.app)} / ${escapeHTML(item.id)}</p>
        <h2 id="modal-title">${escapeHTML(item.title)}</h2>
        ${item.subtitle ? `<p class="detail-subtitle">${escapeHTML(item.subtitle)}</p>` : ''}
        ${media}
        <div class="detail-body">${escapeHTML(item.body).replace(/\n/g, '<br>')}</div>
        <div class="detail-tags">${tags.map((tag, index) => `<span class="tag ${index === 0 && item.evidenceId ? 'evidence-id' : ''}">${escapeHTML(tag)}</span>`).join('')}</div>
        ${item.link ? `<a class="button primary site-link" href="${escapeHTML(item.link)}">関連する公開Web資料を開く ↗</a>` : ''}
      </article>`);
    if (window.BMImageFallback) window.BMImageFallback.bind(modalBody);
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
      Object.keys(localStorage).filter((key) => key.startsWith(BMStorage.prefix) || key === 'brewphone_pending_code').forEach((key) => localStorage.removeItem(key));
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
    const eventId = new URLSearchParams(location.search).get('event');
    if (!eventId) return;
    const emergency = emergencyEvents.find((candidate) => candidate.id === eventId);
    if (!emergency) return;

    BMStorage.set(`event_${eventId}`, true);
    const arrivalKey = `event_arrival_${eventId}`;
    if (!BMStorage.get(arrivalKey, false)) {
      BMStorage.set(arrivalKey, true);
      banner.innerHTML = `<strong>EMERGENCY UPDATE</strong><br>${escapeHTML(emergency.message)}`;
      banner.classList.remove('hidden');
      document.querySelector('.phone-shell').classList.add('phone-shake');
      window.setTimeout(() => document.querySelector('.phone-shell').classList.remove('phone-shake'), 400);

      if (state().vibration && navigator.vibrate && !BMStorage.get(`vibrated_${eventId}`, false)) {
        navigator.vibrate(emergency.vibration || [180, 100, 180]);
        BMStorage.set(`vibrated_${eventId}`, true);
      }
    }
    history.replaceState(null, '', location.pathname + location.hash);
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
