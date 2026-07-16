(async function () {
  'use strict';

  const body = document.body;
  const root = document.getElementById('site-root');
  const slug = body.dataset.site;
  const pageName = body.dataset.page;
  const key = `${slug}/${pageName}`;

  const TYPE_META = {
    museum: { label: '市立文化施設', mark: '潮', utility: '開館情報　｜　収蔵資料　｜　お問い合わせ' },
    'local-news': { label: '地域報道', mark: '海凪', utility: '2026年10月　地域と記録を伝える' },
    archive: { label: '市民記憶アーカイブ', mark: 'M', utility: '保存番号順に公開・随時更新' },
    corporate: { label: '企業情報', mark: 'TD', utility: '東浜開発株式会社' },
    production: { label: 'FILM / DOCUMENTARY', mark: 'K', utility: 'KUZÉ DOCUMENTS — OFFICIAL ARCHIVE' },
    'personal-blog': { label: '個人記録', mark: '13', utility: 'ARCHIVE 2004—2026' },
    transit: { label: '運行情報', mark: 'BUS', utility: '海凪市内線　通常運行' },
    'public-record': { label: '行政公開資料', mark: '公', utility: '海凪市消防局・公開資料室' },
    technical: { label: '技術資料・会員フォーラム', mark: '16', utility: '映写技術保存会' },
    'web-archive': { label: '保存されたウェブ', mark: 'WWW', utility: 'PUBLIC WEB SNAPSHOT SERVICE' },
    magazine: { label: '街と人の月刊誌', mark: 'M+', utility: '月刊みなぎ　2026 OCT.' },
    'weather-record': { label: '観測記録', mark: 'WX', utility: '海凪地方気象観測所' },
    'open-data': { label: '海凪市オープンデータ', mark: 'OD', utility: 'MINAGI CITY / PUBLIC DATA PORTAL' },
    'photo-community': { label: '市民写真記録', mark: 'PH', utility: '海辺写真クラブ・デジタル収蔵庫' },
    'audio-lab': { label: '音響修復技術資料', mark: 'Hz', utility: 'SOUND RESTORATION LAB / TECHNICAL NOTES' },
    library: { label: '地域資料・蔵書検索', mark: 'LIB', utility: '海凪市立図書館デジタル分館' }
  };

  const PAGE_LABELS = {
    'index.html': 'トップ', 'about.html': '施設概要', 'floor-map.html': '館内案内',
    'staff.html': 'スタッフ', 'news.html': 'お知らせ', 'access.html': 'アクセス',
    'article-20261018.html': '事件記事', 'article-20040822-13.html': '2004年記事',
    'archive.html': 'アーカイブ', 'corrections.html': '訂正・検証',
    'sunday-puzzle.html': '日曜版パズル', 'gallery.html': '写真資料',
    'floorplan.html': '旧館図面', 'collection.html': '収蔵品',
    'memory-posts.html': '記憶の投稿', 'item-13.html': '収蔵品13',
    'company.html': '会社情報', 'history.html': '沿革', 'csr.html': '地域活動',
    'history-2004.html': '2004年資料', 'works.html': '作品',
    'last-projection.html': '最後の映写', 'profile.html': 'プロフィール',
    'journal.html': '制作記録', 'contact.html': '連絡先',
    'post-20040821.html': 'あの日の出口', 'post-name.html': '名前を変えた理由',
    'route.html': '路線図', 'timetable.html': '時刻表',
    'stop-minagi-central.html': '海凪中央', 'fare.html': '運賃',
    'search.html': '資料検索', 'record-fr-2004-13.html': 'FR-2004-13',
    'document-viewer.html': '文書閲覧', 'disclosure-policy.html': '公開方針',
    'articles.html': '技術記事', 'door-lock-m02.html': '旧式錠 M-02',
    'projector-16mm.html': '16mm映写機', 'forum-thread-218.html': 'スレッド218',
    'issue-202610.html': '2026年10月号', 'photo-quiz.html': '写真クイズ',
    'reader-posts.html': '読者投稿', 'fortune.html': '今月の占い',
    'snapshot-20040815-tohama.html': '2004年8月15日',
    'snapshot-info.html': '保存情報', 'daily-20261018.html': '10月18日の観測',
    'sunset.html': '日没記録', 'facility-ledger.html': '施設台帳',
    'procurement-2004.html': '2004年調達', 'safety-minutes.html': '安全会議録',
    'file-arc-t04.html': '端末仕様', 'gallery-2004.html': '2004年アルバム',
    'photo-058.html': '写真058', 'comments.html': '撮影者コメント',
    'digitization-log.html': 'デジタル化記録', 'scheduling-audio.html': '予約再生',
    'cache-metadata.html': 'キャッシュ情報', 'waveform-guide.html': '波形の読み方',
    'case-note.html': '検証ノート', 'catalog-frame13.html': 'FRAME13目録',
    'oral-history.html': '聞き書き', 'newspapers.html': '新聞縮刷版',
    'request-log.html': '閲覧請求記録'
  };

  const escapeHTML = (value) => {
    const node = document.createElement('div');
    node.textContent = String(value ?? '');
    return node.innerHTML;
  };

  try {
    const response = await fetch('../../shared/config/site-content.json');
    if (!response.ok) throw new Error('site-content.json を取得できません');
    const database = await response.json();
    const page = database.pages[key];
    if (!page) throw new Error('指定された公開資料が見つかりません');

    const unlocked = BMStorage.get('unlocked_days', []);
    const requiredDay = `day${String(page.unlockDay).padStart(2, '0')}`;
    if (!unlocked.includes(requiredDay)) {
      renderLocked(page);
      return;
    }
    render(page);
  } catch (error) {
    root.innerHTML = `<main class="site-main"><section class="site-error" role="alert"><strong>ページを表示できません</strong><p>${escapeHTML(error.message)}</p><a class="button" href="../../brewphone/">BrewPhoneへ戻る</a></section></main>`;
  }

  function renderLocked(page) {
    document.title = `未解放資料｜${page.siteName}`;
    root.innerHTML = `
      <main class="locked-site-shell">
        <section class="locked-site" aria-labelledby="locked-title">
          <span class="lock-symbol" aria-hidden="true">⌁</span>
          <p class="eyebrow">EXTERNAL ARCHIVE / LOCKED</p>
          <h1 id="locked-title">このWeb資料はまだ開けません</h1>
          <p>Day ${page.unlockDay} の「Today's Brew Code」をBrewPhoneへ入力すると、閲覧履歴またはメッセージからアクセスできます。</p>
          <a class="button primary" href="../../brewphone/">BrewPhoneを開く</a>
        </section>
      </main>`;
  }

  function render(page) {
    const meta = TYPE_META[page.type] || TYPE_META.archive;
    document.title = `${page.title}｜${page.siteName}`;
    body.classList.add(`site-${page.type}`);

    const nav = page.pages.map((filename) => {
      const current = filename === page.page ? ' aria-current="page" class="is-current"' : '';
      return `<a href="${escapeHTML(filename)}"${current}>${escapeHTML(PAGE_LABELS[filename] || filename.replace('.html', ''))}</a>`;
    }).join('');

    const image = page.image ? `
      <figure class="site-visual">
        <img src="${escapeHTML(page.image)}" alt="${escapeHTML(page.title)}の資料写真">
        <figcaption>${escapeHTML(page.siteId)} / 公開資料画像</figcaption>
      </figure>` : '';

    const facts = (page.bullets || []).map((fact, index) => `
      <section class="fact-card">
        <span class="fact-index">${String(index + 1).padStart(2, '0')}</span>
        <div><h2>${escapeHTML(fact)}</h2><p>${supportingText(page.type, index)}</p></div>
      </section>`).join('');

    const puzzle = page.page === 'sunday-puzzle.html' ? renderPuzzle() : '';
    const detailedSections = (page.sections || []).map((section, index) => `
      <section class="archive-section">
        <p class="archive-section-number">${String(index + 1).padStart(2, '0')}</p>
        <div><h2>${escapeHTML(section.heading)}</h2><p>${escapeHTML(section.body)}</p></div>
      </section>`).join('');
    const records = (page.records || []).length ? `
      <section class="record-block">
        <div class="record-heading"><p class="section-label">SOURCE RECORDS</p><h2>原資料の記載</h2></div>
        <div class="record-table" role="table" aria-label="原資料の記載">
          ${(page.records || []).map((record) => `<div class="record-row" role="row"><strong role="cell">${escapeHTML(record.label)}</strong><span role="cell">${escapeHTML(record.value)}</span><small role="cell">${escapeHTML(record.note || '')}</small></div>`).join('')}
        </div>
      </section>` : '';
    const related = (page.related || []).length ? `
      <nav class="related-records" aria-label="関連公開資料">
        <p class="section-label">RELATED RECORDS</p>
        ${(page.related || []).map((entry) => `<a href="${escapeHTML(entry.href)}"><span>${escapeHTML(entry.label)}</span><small>${escapeHTML(entry.description || '関連する公開資料を開く')}</small><b aria-hidden="true">→</b></a>`).join('')}
      </nav>` : '';
    const pageLabel = PAGE_LABELS[page.page] || page.title;
    const archiveLine = archiveMetadata(page);

    root.innerHTML = `
      <div class="site-utility"><div><span>${escapeHTML(meta.utility)}</span><span class="utility-id">${escapeHTML(page.siteId)}</span></div></div>
      <header class="site-header">
        <div class="site-header-inner">
          <a class="site-brand" href="index.html" aria-label="${escapeHTML(page.siteName)} トップ">
            <span class="brand-mark" aria-hidden="true">${escapeHTML(meta.mark)}</span>
            <span><small>${escapeHTML(meta.label)}</small>${escapeHTML(page.siteName)}</span>
          </a>
          <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">メニュー</button>
          <nav class="site-nav" id="site-nav" aria-label="サイト内メニュー">${nav}</nav>
        </div>
      </header>
      <main class="site-main">
        <div class="breadcrumbs"><a href="index.html">トップ</a><span>／</span><span>${escapeHTML(pageLabel)}</span></div>
        <article class="article">
          <header class="article-header">
            <div class="article-heading">
              <p class="section-label">${escapeHTML(meta.label)} <span>${escapeHTML(page.siteId)}</span></p>
              <h1>${escapeHTML(page.title)}</h1>
              <p class="lead">${escapeHTML(page.body)}</p>
              <div class="archive-meta">${archiveLine}</div>
            </div>
            ${image}
          </header>
          <div class="article-rule" aria-hidden="true"></div>
          <div class="article-grid">${facts}</div>
          ${detailedSections ? `<div class="archive-sections">${detailedSections}</div>` : ''}
          ${records}
          ${puzzle}
          ${related}
          <aside class="source-note"><strong>公開資料について</strong><p>このページは公開当時の表記を基に整理されています。内容の訂正・更新は各ページの記録を参照してください。</p></aside>
        </article>
        <a class="back-to-phone" href="../../brewphone/">BrewPhoneに戻る</a>
      </main>
      <footer class="site-footer"><div class="site-footer-inner"><strong>${escapeHTML(page.siteName)}</strong><span>© Fictional archive for Brewlish Mystery</span></div></footer>`;

    bindInteractions();
    if (window.BMImageFallback) window.BMImageFallback.bind(root);
  }

  function supportingText(type, index) {
    const lines = {
      'local-news': ['取材記録と公開資料に基づく記事要旨です。', '紙面掲載時の表現を保存しています。'],
      archive: ['収蔵番号と寄贈記録から整理された情報です。', '原資料の欠損箇所を含めて公開しています。'],
      corporate: ['当時の会社広報に掲載された記録です。', '公開履歴は保存版で確認できます。'],
      production: ['制作ノートに残された項目です。', '公開作品および関係資料の記録です。'],
      'personal-blog': ['投稿者自身の記憶に基づく記述です。', '投稿後の修正履歴が残っています。'],
      transit: ['運行記録・時刻表の該当項目です。', '曜日と停留所を確認してください。'],
      'public-record': ['開示対象となった行政記録です。', '黒塗り部分を除く原文要旨です。'],
      technical: ['保存技術者向けの参考情報です。', '旧設備の仕様記録に基づきます。'],
      'web-archive': ['保存日時点のWebページ記録です。', '現在のページとは内容が異なる場合があります。'],
      magazine: ['誌面企画として掲載された項目です。', '写真とキャプションをあわせてご覧ください。'],
      'weather-record': ['観測機器による確定値です。', '時刻は日本標準時で記録されています。'],
      museum: ['施設が公開している基本情報です。', '館内利用時の案内事項です。']
    };
    const list = lines[type] || lines.archive;
    return list[index % list.length];
  }

  function archiveMetadata(page) {
    const dateByType = {
      'local-news': '紙面更新 2026.10.19 07:30', archive: '最終整理 2026.09.28',
      corporate: '企業情報アーカイブ', production: 'PUBLIC RECORD / 2026',
      'personal-blog': '保存された個人投稿', transit: '2026年10月改正',
      'public-record': '情報公開条例に基づく公開', technical: '会員共有資料',
      'web-archive': 'READ-ONLY SNAPSHOT', magazine: 'ISSUE 2026.10',
      'weather-record': '確定観測値', museum: '公式公開情報'
    };
    return `<span>${escapeHTML(dateByType[page.type] || '公開記録')}</span><span>閲覧資料 ${escapeHTML(page.siteId)}</span>`;
  }

  function renderPuzzle() {
    const seats = [9, 10, 11, 12, '?', 14, 15];
    return `
      <section class="puzzle-box" aria-labelledby="puzzle-title">
        <p class="puzzle-kicker">日曜版・読者パズル</p>
        <h2 id="puzzle-title">消えた座席番号</h2>
        <p>古い御影座の座席札を順に並べました。空欄に入る番号を答えてください。</p>
        <div class="seat-grid" aria-label="9から15までの座席番号">${seats.map((seat) => `<span class="seat${seat === '?' ? ' missing' : ''}">${seat}</span>`).join('')}</div>
        <form id="site-puzzle" class="answer-row">
          <label class="sr-only" for="site-answer">空欄の番号</label>
          <input id="site-answer" inputmode="numeric" autocomplete="off" placeholder="番号を入力">
          <button class="button" type="submit">答えを確認</button>
        </form>
        <p id="site-result" class="puzzle-result" aria-live="polite"></p>
      </section>`;
  }

  function bindInteractions() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        nav.classList.toggle('is-open', !expanded);
      });
    }

    const puzzle = document.getElementById('site-puzzle');
    if (puzzle) {
      puzzle.addEventListener('submit', (event) => {
        event.preventDefault();
        const answer = document.getElementById('site-answer').value.normalize('NFKC').trim();
        const result = document.getElementById('site-result');
        if (answer === '13') {
          result.className = 'puzzle-result is-correct';
          result.innerHTML = '<strong>正解：13</strong><br>アーカイブ検索語は <code>ARTICLE-13</code> です。';
        } else {
          result.className = 'puzzle-result is-wrong';
          result.textContent = '座席番号が並ぶ順番を、左からもう一度確認してください。';
        }
      });
    }
  }
})();
