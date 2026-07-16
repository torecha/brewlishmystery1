import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitesPath = path.join(root, 'shared/config/sites.json');
const contentPath = path.join(root, 'shared/config/site-content.json');
const sitesDatabase = JSON.parse(fs.readFileSync(sitesPath, 'utf8'));
const contentDatabase = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

const newSites = [
  {
    id: 'SITE-13', slug: 'minagi-city-data', name: '海凪市オープンデータ', unlock: 2, type: 'open-data',
    role: '施設台帳、調達記録、安全会議録、端末資産票を公開する市のデータポータル。',
    pages: ['index.html', 'facility-ledger.html', 'procurement-2004.html', 'safety-minutes.html', 'file-arc-t04.html'],
    entry: '館内図の管理番号、端末資産ラベル',
    clues: ['映写室Bの二系統錠', '2004年展示壁の調達番号', 'ARC-T04の設置場所'],
    noise: ['AED設置一覧', '公共施設電力使用量', '備品更新計画'], quiz: null,
    visual: '自治体の公開データサイト。青、白、表組み中心。', image: '../../day01/images/projection-door-dual-lock.jpg'
  },
  {
    id: 'SITE-14', slug: 'harbor-photo-club', name: '海辺写真クラブ記録庫', unlock: 3, type: 'photo-community',
    role: '市民が撮影した2004年の御影座周辺写真と、後年の撮影者コメントを保存する。',
    pages: ['index.html', 'gallery-2004.html', 'photo-058.html', 'comments.html', 'digitization-log.html'],
    entry: '御影座記憶アーカイブの写真提供者欄',
    clues: ['非常口前展示壁の別角度', '写真袋の管理ラベル', '撮影者の時刻訂正'],
    noise: ['港祭り', '夕景コンテスト', 'カメラ機種談義'], quiz: null,
    visual: '市民写真会の温かいアーカイブ。生成り、焦茶、古写真。', image: '../../day05/images/exit-wall-archive-photo-clue.png'
  },
  {
    id: 'SITE-15', slug: 'sound-restoration-lab', name: '音響修復ラボ・公開ノート', unlock: 6, type: 'audio-lab',
    role: '音声予約再生、キャッシュ、波形照合、編集履歴の読み方を技術者が公開する。',
    pages: ['index.html', 'scheduling-audio.html', 'cache-metadata.html', 'waveform-guide.html', 'case-note.html'],
    entry: 'Recorderの機器仕様と音声ルーティング資料',
    clues: ['録音と再生の区別', '予約時刻と作成時刻', '背景雑音まで一致する意味'],
    noise: ['レコード修復', 'マイク試聴', '会員勉強会'], quiz: null,
    visual: '暗色の技術ノート。波形色のミント、細かな仕様表。', image: '../../brewphone/images/evidence/audio-waveform-compare.png'
  },
  {
    id: 'SITE-16', slug: 'seaside-library', name: '海凪市立図書館デジタル分館', unlock: 5, type: 'library',
    role: '新聞縮刷版、匿名ブログ目録、聞き書き、閲覧請求履歴を横断検索できる地域資料室。',
    pages: ['index.html', 'catalog-frame13.html', 'oral-history.html', 'newspapers.html', 'request-log.html'],
    entry: 'FRAME 13のプロフィール、消防資料の出典欄',
    clues: ['匿名資料の同一人物断定を避ける注意', '2004年新聞訂正欄', '複数人による13頁閲覧請求'],
    noise: ['郷土料理目録', '映画パンフレット', '寄贈者一覧'], quiz: null,
    visual: '公立図書館の地域資料検索。象牙、焦茶、落ち着いた金。', image: '../../day05/images/yui-diary-page.jpg'
  }
];

const pageData = {
  'minagi-city-data/index.html': ['公開データ検索', '海凪市が保有する施設・契約・会議記録を、資料番号と更新履歴つきで公開しています。', ['施設台帳は改修前の設備も収録', '文書ごとに基準日と訂正履歴を表示', '個人情報欄は非公開'], '../../day01/images/projection-door-dual-lock.jpg'],
  'minagi-city-data/facility-ledger.html': ['旧御影座・施設台帳', '潮騒館への改修時に作成された設備台帳。三階映写室Bの扉にはIC制御と保存対象の機械錠が併存すると記録されています。', ['扉番号3F-B-07', '機械錠の館内呼称M-02', '退出時は自動ラッチ'], '../../day01/images/projection-door-dual-lock.jpg'],
  'minagi-city-data/procurement-2004.html': ['2004年度・文化事業調達記録', '御影座地域文化イベントの設営契約一覧。舞台装飾、照明、案内板、移動展示壁は別々の発注として処理されています。', ['展示壁管理番号TD-CIVIC/04-17', '設置位置変更は開催前日に承認', '消防協議欄は添付別紙'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'minagi-city-data/safety-minutes.html': ['安全対策会議録・抄録', '開催一週間前の会議では北側非常口の有効幅が議題になりました。展示壁を置く場合は扉前1.2メートルを確保する条件が付いています。', ['条件付き承認', '現地再確認欄は未署名', '火元に関する議論はなし'], '../../day05/images/fire-report-missing-page.jpg'],
  'minagi-city-data/file-arc-t04.html': ['資産票 ARC-T04', '二階アーカイブ室の音声修復端末。個人認証、ローカル編集履歴、USB接続、放送サーバー書出しのログを別々に保存します。', ['設置場所2F-ARCHIVE-04', '既定利用者maya.k', '時計ずれ+1.4秒'], '../../day09/images/archive-terminal-log.png'],

  'harbor-photo-club/index.html': ['海辺写真クラブ記録庫', '会員アルバムと未整理ネガを市民の手でデジタル化しています。撮影年や場所は、複数人の記憶を照合して後から訂正されることがあります。', ['2004年御影座アルバム54点', '撮影者コメントを原文保存', '不確かな日付は推定表示'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'harbor-photo-club/gallery-2004.html': ['2004年・港と御影座', '港祭り、御影座イベント、商店街の夜景を同じフィルム袋から収録。事件と関係のない写真も撮影順の確認に残されています。', ['フィルム袋HPC-04-08B', '写真番号041〜063', '現像日2004年8月24日'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'harbor-photo-club/photo-058.html': ['写真058・北側ロビー', '火災当日の開場前、北側非常口方向を斜めに撮影した一枚。展示壁裏面の白い管理ラベルと、誘導灯との位置関係が写っています。', ['ラベルTD-CIVIC/04-17', '撮影推定18時37分', '非常口扉は壁の奥'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'harbor-photo-club/comments.html': ['撮影者コメント', '撮影者は当初「終演後」と記憶していましたが、同じコマに写る売店時計と開場列から、火災前の18時台へ訂正しました。', ['記憶と写真時刻を分ける', '訂正前の文章も保存', '人物名は本人希望で匿名'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'harbor-photo-club/digitization-log.html': ['デジタル化作業記録', 'ネガのスキャン条件、色補正、トリミング範囲を記録。管理ラベル部分は原版端まで残り、後から合成されたものではありません。', ['2400dpi原版保存', '自動文字補正なし', 'チェックサム一致'], '../../day05/images/exit-wall-archive-photo-clue.png'],

  'sound-restoration-lab/index.html': ['音響修復ラボ・公開ノート', '録音、再生、編集、予約送出を混同しないための技術ノート。古い劇場音源の修復事例も公開しています。', ['音声の出所を層に分ける', '波形一致は内容だけで判断しない', '時計ずれを先に補正'], '../../brewphone/images/evidence/audio-waveform-compare.png'],
  'sound-restoration-lab/scheduling-audio.html': ['予約音声は「その時の声」か', '20時46分にスピーカーから声が聞こえても、話者が20時46分に生きていたとは限りません。作成、登録、再生の三時刻を分けます。', ['音源作成時刻', '送出予約登録時刻', '実際の再生時刻'], '../../brewphone/images/evidence/scheduled-broadcast-log.png'],
  'sound-restoration-lab/cache-metadata.html': ['キャッシュと削除時刻', '一時音声は送出後に自動削除されても、編集端末・配信サーバー・監視ログへ別の痕跡が残る場合があります。', ['削除設定だけでは犯罪性なし', '参照元ハッシュを確認', '端末証明書を照合'], '../../day09/images/archive-terminal-log.png'],
  'sound-restoration-lab/waveform-guide.html': ['背景雑音を比較する', '同じ発話でも新しく録れば、咳、椅子の摩擦音、空調の周期は一致しません。背景を含むサンプル単位の一致は再利用を強く示します。', ['発話の間隔', '咳の開始位置', '椅子音の高周波成分'], '../../brewphone/images/evidence/audio-waveform-compare.png'],
  'sound-restoration-lab/case-note.html': ['匿名化された検証事例 SRL-218', '施設放送で過去のリハーサル音源が予約再生された事例。固有名詞を伏せ、技術的な検証手順だけを掲載しています。', ['原音と送出音の照合', '再エンコード差を分離', '利用者IDだけで断定しない'], '../../brewphone/images/evidence/audio-waveform-compare.png'],

  'seaside-library/index.html': ['地域資料横断検索', '郷土新聞、個人寄贈資料、聞き書き、Web保存目録を横断検索します。検索結果は事実認定ではなく、原資料へ辿るための索引です。', ['旧姓と現姓は別権限で管理', '匿名資料は本人同意なく統合しない', '訂正履歴も検索対象'], '../../day05/images/yui-diary-page.jpg'],
  'seaside-library/catalog-frame13.html': ['目録 WEB-PER-013', '個人ブログ「FRAME 13」の保存目録。運営者名は非公開で、記事中のO.Y.表記だけから実在人物を断定しないよう注意が付されています。', ['保存開始2008年', '最終更新2026年10月', '本人特定情報は閲覧制限'], '../../day05/images/yui-diary-page.jpg'],
  'seaside-library/oral-history.html': ['聞き書き・御影座の夜', '火災当時の観客六名による聞き書き。証言は一致せず、煙の方向や少女の服の色にも違いがあります。共通するのは出口前で人流が折れた点です。', ['2010〜2022年に採録', '記憶違いを削除しない', '録音原本は館内閲覧のみ'], '../../day05/images/exit-wall-archive-photo-clue.png'],
  'seaside-library/newspapers.html': ['海凪新聞・縮刷版索引', '2004年8月22日朝刊と後日の訂正欄を同じ検索結果へ束ねています。初報だけを読むと、少女と出火を誤って結びつける余地があります。', ['初報ARTICLE-13', '訂正欄2004年9月4日', '写真説明の差替え'], '../../sites/minagi-news/images/minagi-news-front.jpg'],
  'seaside-library/request-log.html': ['地域資料・閲覧請求履歴', '消防報告13頁と御影座設営図は、久世や星野以外にも新聞社、市民団体、研究者が閲覧請求しています。知識の保有者を一人に限定できません。', ['2012年市民団体', '2019年新聞社', '2026年複数請求'], '../../day05/images/fire-report-missing-page.jpg']
};

const critical = {
  'shiosai-museum/floor-map.html': {
    sections: [
      { heading: '三階の移動経路', body: '二階アーカイブ室から映写室Bまでは、中央階段で通常2分18秒。西側非常階段なら最短1分58秒ですが、三階扉前は固定カメラの画角外です。フィルム缶を運ぶ台車は西側階段を通れません。' },
      { heading: '扉の二系統', body: 'ICカードは解錠者と時刻を残します。保存建築の機械錠M-02はラッチだけを動かし、制御盤へ通知しません。室内から退出して扉を閉めると、どちらで入ったかに関係なく自動ラッチが掛かります。' },
      { heading: '図面にない場所', body: '映写機2号のサービスパネル奥は「予備ベルト収納」とだけ記載され、一般館内図には現れません。保守図面との奥行き差が後日の再調査につながりました。' }
    ],
    records: [
      { label: '3F-B-07', value: '旧映写室B扉', note: 'IC制御＋機械錠／自動ラッチ' },
      { label: 'ROUTE-W', value: '西側非常階段', note: '三階側カメラなし' },
      { label: 'PRJ-02', value: '16mm映写機2号', note: '背面保守空間あり' }
    ],
    related: [
      { href: '../minagi-city-data/facility-ledger.html', label: '市の施設台帳', description: '扉番号3F-B-07と機械錠M-02の行政記録' },
      { href: 'staff.html', label: '担当スタッフ', description: '設備・映像・館運営の担当範囲' }
    ]
  },
  'minagi-news/article-20040822-13.html': {
    sections: [
      { heading: '初報の構成', body: '記事は「キャンドルを持った少女」「火災」「二人を避難させた」の三事実を近い段落へ置きました。出火を目撃したという記述はありませんが、紙面の並びによって少女が原因だと読める構成でした。' },
      { heading: '写真説明の問題', body: '掲載写真は火災より約二時間前のイベント展示です。撮影時刻を省いたため、炎の直前に少女が火を持っていたような印象を与えました。後日の訂正では、出火元が舞台袖であることだけが小さく追記されています。' },
      { heading: '記事に出なかったもの', body: '非常口前展示壁、設営企業名、映写技師の避難誘導は初報から外れました。取材メモには残っていますが、締切時点で確認が取れないとして本文へ入りませんでした。' }
    ],
    records: [
      { label: 'ARTICLE-13', value: '2004年8月22日朝刊・地域面', note: '初版' },
      { label: 'PHOTO-13B', value: 'キャンドル展示の少女', note: '撮影時刻18:51' },
      { label: 'CORR-0904', value: '9月4日訂正欄', note: '出火地点を舞台袖へ訂正' }
    ]
  },
  'mikage-archive/item-13.html': {
    sections: [
      { heading: '欠けた座席札', body: '寄贈された座席札は9から15まで揃うはずでしたが、13だけが別封筒に入っていました。封筒には「O.Y. 預かり」と鉛筆書きがあり、寄贈者は本人名を公開しないよう求めています。' },
      { heading: '数字が示さないこと', body: '13という番号は新聞記事、消防資料、匿名ブログにも現れます。しかし、同じ数字だけで資料の作成者や人物を同一と決めることはできません。日付、写真、旧姓、本人の同意を別に確認する必要があります。' }
    ],
    records: [
      { label: 'MIK-SEAT-013', value: '御影座一階13番席・真鍮札', note: '2008年寄贈' },
      { label: 'ENV-OY', value: 'O.Y.預かり封筒', note: '氏名非公開条件' },
      { label: 'HPC-04-058', value: '海辺写真クラブ写真058', note: '北側ロビーを別角度から撮影' }
    ],
    related: [{ href: '../harbor-photo-club/photo-058.html', label: '写真058を確認', description: '非常口前展示壁の別角度と管理ラベル' }]
  },
  'tohama-development/history-2004.html': {
    sections: [
      { heading: '現在の沿革から消えた事業', body: '2004年の「御影座地域文化支援事業」は2019年のサイト改修で固有名を外されました。現行ページは地域文化支援という総称だけを残しています。削除理由はブランド統一とされています。' },
      { heading: '設営変更の承認', body: '保存版の事業報告には、来場導線を確保するため展示壁を北側へ移動したとあります。しかし市の安全会議録では、非常口前1.2メートルを空ける条件が付いていました。最終配置の確認署名は空欄です。' },
      { heading: '企業責任と現在事件', body: '火災時の設営責任は東浜開発に関係しますが、2026年20時31分の殺人機会とは別問題です。現在の交渉や隠蔽願望だけで犯人を決めないでください。' }
    ],
    records: [
      { label: 'TD-CIVIC/04-17', value: '移動展示壁', note: '前日位置変更' },
      { label: 'WEB-REV-2019', value: '沿革ページ改修', note: '写真2点・PDF1点削除' },
      { label: 'LEGAL-R4', value: '2026年制作支援案', note: '署名なし' }
    ]
  },
  'fire-report-archive/document-viewer.html': {
    sections: [
      { heading: '12頁から14頁へ', body: '電子複製は12頁の避難状況から14頁の損害一覧へ直接続きます。ページ番号13の画像データ、OCR、スキャン失敗ログはありません。単なる閲覧画面の欠番ではなく、複製元の時点で原頁がなかった可能性があります。' },
      { heading: '残る参照記号', body: '14頁脚注には「北側導線変更は別紙13参照」とあります。市の調達台帳にある展示壁番号TD-CIVIC/04-17と照合すると、欠落頁が設営と避難経路を扱っていたことが推測できますが、原文そのものは復元されていません。' }
    ],
    records: [
      { label: 'FR-2004-13 p.12', value: '避難・救護状況', note: '公開済み' },
      { label: 'p.13', value: '原本欠落', note: '電子複製なし' },
      { label: 'p.14 note-4', value: '北側導線変更', note: '別紙13参照' }
    ],
    related: [
      { href: '../seaside-library/request-log.html', label: '図書館の閲覧請求記録', description: '欠落13頁を知っていた人物は一人ではない' },
      { href: 'disclosure-policy.html', label: '公開・欠落資料の扱い', description: '原本欠落時の開示手順' }
    ]
  },
  'cinema-tech-forum/door-lock-m02.html': {
    sections: [
      { heading: 'M-02は製品名ではない', body: 'M-02は潮騒館内の管理呼称です。錠前そのものは1980年代の保存建築用シリンダーで、合鍵作成を防止する特殊品ではありません。鍵肩部の刻印と摩耗を個体比較に使います。' },
      { heading: '電子ログへ残らない理由', body: '機械鍵はラッチへ直接作用し、IC制御盤へ電気信号を送りません。入室後に扉を閉じれば自動で施錠状態へ戻るため、発見時に閉まっていたことは密室を意味しません。' },
      { heading: '真鍮粉の扱い', body: '長期使用した鍵とシリンダーは、研磨粉・油・摩耗片の比率に個体差があります。同型鍵が複数ある場合でも比較材料になりますが、粉末単独で接触時刻までは決められません。' }
    ],
    records: [
      { label: 'LOCK-M02', value: '保存錠・館内呼称', note: '機械式' },
      { label: 'KEY-M02', value: '鍵棚2段目', note: '重量センサー対象' },
      { label: 'LATCH-CLOSE', value: '退出後自動ラッチ', note: 'IC操作不要' }
    ]
  },
  'wayback-mock/snapshot-20040815-tohama.html': {
    sections: [
      { heading: '保存ページの由来', body: '2004年8月15日19時04分に自動収集された企業広報ページです。火災前の保存なので、後から事件に合わせて作られた説明ではありません。画像ファイルとHTML本文の取得時刻は2秒差です。' },
      { heading: '写真内の表示', body: '完成前の展示壁写真に管理番号TD-CIVIC/04-17が見えます。説明文は「北側ロビーの回遊導線を演出」とし、非常口について触れていません。現在の企業サイトではこのページへのリンクが削除されています。' }
    ],
    records: [
      { label: 'SNAP-20040815-1904', value: '/csr/event/2004-mikage', note: '取得成功' },
      { label: 'IMG-04-17', value: '展示壁完成写真', note: '管理番号可読' },
      { label: 'ROBOTS', value: '収集拒否設定なし', note: '当時公開ページ' }
    ]
  },
  'sound-restoration-lab/scheduling-audio.html': {
    sections: [
      { heading: '作成・登録・再生', body: '音声ファイルを作った時刻、放送サーバーへ登録した時刻、スピーカーから再生した時刻は別々です。再生時刻だけを聞き手の生存時刻へ置き換えると、予約音声による偽装を見落とします。' },
      { heading: '端末側に残るもの', body: '編集ソフトは切出し元ファイル、範囲、利用者ID、書出し時刻をプロジェクトへ保存します。サーバー側の音源が削除されても、キャッシュやチェックサムから同じ音源か確認できます。' },
      { heading: '音が鳴った事実の限界', body: '20時46分に久世の声が鳴ったことは事実です。それが通話か録音か、誰が設定したか、元音源がいつ録られたかは別資料で証明しなければなりません。' }
    ],
    records: [
      { label: 'SOURCE', value: '19:10リハーサル原音', note: '咳・椅子音を含む' },
      { label: 'REGISTER', value: '19:42:18', note: '放送予約登録' },
      { label: 'PLAY', value: '20:46:02', note: '館内スピーカー送出' }
    ]
  }
};

for (const site of newSites) {
  const index = sitesDatabase.sites.findIndex((entry) => entry.slug === site.slug);
  if (index >= 0) sitesDatabase.sites[index] = site;
  else sitesDatabase.sites.push(site);
}

const contextByType = {
  museum: '公式案内は設備の存在を確認する入口です。事件当日の運用は、ログと供述で別に確認してください。',
  'local-news': '初報、後日の訂正、写真説明は作成時刻が異なります。一つの記事だけを最終記録として扱わないでください。',
  archive: '寄贈者の記憶と原資料の記載が食い違う場合、両方を残したまま整理しています。',
  corporate: '企業広報は当時の対外説明です。契約書・行政資料とは目的が異なります。',
  production: '公開用の制作日誌と端末内の編集履歴は別の記録です。削除された箇所も確認対象です。',
  'personal-blog': '個人の記憶を事実認定へ使う際は、公開時期と後年の追記を区別してください。',
  transit: '時刻表は予定であり、当日のGPS・IC・車内映像が実績を示します。',
  'public-record': '欠落や黒塗りは内容を自動的に証明しません。残る脚注と別台帳から範囲を絞ります。',
  technical: '仕様上可能であることと、事件当日に実行されたことを区別してください。',
  'web-archive': '保存日時点の公開状態を示します。現在の運営者による説明とは一致しない場合があります。',
  magazine: '娯楽記事や読者投稿も含まれます。手掛かりと偶然の一致を分けて読んでください。',
  'weather-record': '観測値は時刻検証を補助しますが、人物の行動を直接示すものではありません。',
  'open-data': '台帳の項目は行政上の分類です。現物の状態と使用履歴を別に照合してください。',
  'photo-community': '写真の内容は強い資料ですが、撮影時刻と撮影者の記憶は別々に検証します。',
  'audio-lab': '音声が再生された時刻と、音声が録音・編集された時刻を分けてください。',
  library: '索引は資料同士を結びつけますが、同一人物の断定や公開範囲の判断は行いません。'
};

const buildRelated = (page) => {
  const options = page.pages.filter((filename) => filename !== page.page);
  const start = Math.max(0, page.pages.indexOf(page.page));
  return [0, 1].map((offset) => options[(start + offset) % options.length]).filter(Boolean).map((href) => ({
    href, label: href.replace('.html', '').replaceAll('-', ' '), description: '同じ公開元に残る関連資料'
  }));
};

for (const page of Object.values(contentDatabase.pages)) {
  const site = sitesDatabase.sites.find((entry) => entry.slug === page.slug);
  if (!site) continue;
  if (!page.sections) {
    page.sections = [
      { heading: '記録の背景', body: `${page.body}\n\n${site.role}` },
      { heading: 'このページで照合できること', body: (page.bullets || []).map((item, index) => `${index + 1}. ${item}`).join('\n') },
      { heading: '読むときの注意', body: `${contextByType[page.type] || contextByType.archive}\n周辺には「${(site.noise || []).join('」「')}」など事件と直接関係しない記録も保存されています。` }
    ];
  }
  if (!page.records) page.records = (page.bullets || []).map((item, index) => ({ label: `項目 ${String(index + 1).padStart(2, '0')}`, value: item, note: index < (site.clues || []).length ? '別資料と照合可能' : '周辺情報' }));
  if (!page.related) page.related = buildRelated(page);
}

for (const site of newSites) {
  for (const filename of site.pages) {
    const key = `${site.slug}/${filename}`;
    const [title, body, bullets, image] = pageData[key];
    const page = {
      siteId: site.id, siteName: site.name, slug: site.slug, page: filename, unlockDay: site.unlock, type: site.type,
      title, body, bullets, image, visual: site.visual, quiz: null, pages: site.pages,
      sections: [
        { heading: '資料の内容', body },
        { heading: '照合できる項目', body: bullets.map((item, index) => `${index + 1}. ${item}`).join('\n') },
        { heading: '利用上の注意', body: `${contextByType[site.type]}\nこの公開元には事件と直接関係しない日常資料も含まれます。` }
      ],
      records: bullets.map((item, index) => ({ label: `${site.id}-${String(index + 1).padStart(2, '0')}`, value: item, note: index === 0 ? '主要照合項目' : '関連項目' }))
    };
    page.related = buildRelated(page);
    contentDatabase.pages[key] = page;
  }
}

for (const [key, override] of Object.entries(critical)) {
  if (contentDatabase.pages[key]) Object.assign(contentDatabase.pages[key], override);
}

const shell = (slug, filename) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#17283d"><title>Loading...</title><link rel="stylesheet" href="../../shared/css/base.css"><link rel="stylesheet" href="../../shared/css/site.css"></head><body class="site-page" data-site="${slug}" data-page="${filename}"><div id="site-root"><div class="locked-site">読み込み中...</div></div><script src="../../shared/js/storage.js"></script><script src="../../shared/js/image-fallback.js"></script><script src="../../shared/js/site-engine.js"></script></body></html>\n`;
for (const site of newSites) {
  const directory = path.join(root, 'sites', site.slug);
  fs.mkdirSync(directory, { recursive: true });
  for (const filename of site.pages) fs.writeFileSync(path.join(directory, filename), shell(site.slug, filename));
}

sitesDatabase.version = '2.0.0';
contentDatabase.version = '2.0.0';
fs.writeFileSync(sitesPath, `${JSON.stringify(sitesDatabase, null, 2)}\n`);
fs.writeFileSync(contentPath, `${JSON.stringify(contentDatabase, null, 2)}\n`);
console.log(`${sitesDatabase.sites.length} sites / ${Object.keys(contentDatabase.pages).length} pages`);
