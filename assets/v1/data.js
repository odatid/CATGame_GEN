/* =========================================================
   CATGame_GEN — データ層 v0.3.0（FB反映版）
   v0.2.0からの変更: 目的を12カテゴリ約30種に拡張（ここで作りたいゲームを決める）/
   行動に組み立て案3種+サブを追加/しばりはおすすめ4案+引き直し+自分で決める/
   候補は各カテゴリ3つまで+その他記入欄（「実観察」等のラベルは除去）/
   おすすめ案の元データ（しばりパック8種）
   ID は英小文字とアンダースコア。既存IDは壊さない。
   ========================================================= */
window.CT = window.CT || {};

/* ---------------- 猫の行動（手段の材料・10種） ----------------
   verb: そのまま操作になる動詞（代表）
   variants: 組み立て案3種（選ばせる。FIXで不安にしない）
   rates: ゲーム性チェックの素点（ユニークさ/ひねり/おかしさ/共感 = uni/twi/fun/emp 0〜2）
   ------------------------------------------------------------ */
CT.ACTIONS = [
  {id:'a_climb', label:'高い所に登る', verb:'足場を選んで跳ぶ', note:'上へ進む足場選び',
   variants:['足場を選んで跳ぶ','崩れる足場を頼りに登る','壁づたいに飛び移る'],
   rates:{uni:1,twi:2,fun:1,emp:0},
   why:'登る速さと足場選びがそのまま勝負になる'},
  {id:'a_box', label:'箱に入る', verb:'箱を動かして導く', note:'誘導・隠れ',
   variants:['箱を動かして導く','自分が箱に入って運ばれる','箱に隠れて待ち伏せする'],
   rates:{uni:2,twi:1,fun:1,emp:1},
   why:'箱は「隠れ家にも足場にもなる」二役の仕掛けになる'},
  {id:'a_squeeze', label:'狭い所に入る', verb:'すり抜けて入る', note:'ギャップ通過',
   variants:['すり抜けて入る','隙間を通って近道する','棚の隙間に隠れる'],
   rates:{uni:1,twi:1,fun:2,emp:0},
   why:'幅◯pxの数値がそのまま難度になる'},
  {id:'a_ambush', label:'獲物を狙って待つ', verb:'待って飛び出す', note:'押さない時間が価値になる',
   variants:['待って飛び出す','音を立てないように待つ','物陰でじっと耐える'],
   rates:{uni:2,twi:2,fun:1,emp:0},
   why:'待つ時間が価値になる唯一の手段'},
  {id:'a_pounce', label:'飛びつく', verb:'飛びついて捕まる', note:'つかまり移動',
   variants:['飛びついて捕まる','高く跳ねて取る','背中を足場に跳ぶ'],
   rates:{uni:0,twi:1,fun:1,emp:0},
   why:'ターゲット到達型の成功条件にしやすい'},
  {id:'a_threat', label:'威嚇する', verb:'フクレて追い払う', note:'押し戻し',
   variants:['フクレて追い払う','低い声で鳴いて脅す','毛を逆立てて見せる'],
   rates:{uni:1,twi:1,fun:2,emp:0},
   why:'敵を距離で制する守り型の操作'},
  {id:'a_night', label:'夜に動く', verb:'暗がりだけ進む', note:'視界ルール',
   variants:['暗がりだけ進む','明かりを避けて動く','夜の鳴き声で仲間を呼ぶ'],
   rates:{uni:2,twi:1,fun:0,emp:0},
   why:'見える範囲の制約（情報）と最も噛み合う'},
  {id:'a_sun', label:'日なたぼっこ', verb:'日なたで力を溜めて走る', note:'チャージ型',
   variants:['日なたで力を溜めて走る','温まって飼い主を呼ぶ','ひなたで寝て体力を回復する'],
   rates:{uni:1,twi:0,fun:1,emp:1},
   why:'溜めて放つ操作。リズムが作れる'},
  {id:'a_scratch', label:'爪とぎ', verb:'削って道を作る', note:'障害物の除去',
   variants:['削って道を作る','爪とぎで目印を残す','柱を削って高く伸びる'],
   rates:{uni:2,twi:2,fun:1,emp:0},
   why:'発想の変換が要る挑戦用の手段'},
  {id:'a_knock', label:'ものをひっくり返す', verb:'机の上をひっくり返して落とす', note:'破壊カウント',
   variants:['机の上をひっくり返して落とす','手で押して落とす','体当たりで揺らして落とす'],
   rates:{uni:1,twi:1,fun:2,emp:0},
   why:'カウント系の成功条件に直結する定番'}
];

/* ---------------- 制約の型5種（数値必須） ---------------- */
CT.CONSTRAINTS = [
  {id:'c_time',  label:'時間', tpl:'◯◯秒以内に',                       unit:'秒', num:30},
  {id:'c_count', label:'回数', tpl:'中心アクションは◯◯回まで',           unit:'回', num:5},
  {id:'c_space', label:'空間', tpl:'横960pxのうち◯◯pxだけ動ける',       unit:'px', num:240},
  {id:'c_phys',  label:'物理', tpl:'◯◯を避けながら',                     unit:'種類', num:2},
  {id:'c_info',  label:'情報', tpl:'◯◯を起こさずに（音ゲージ◯◯%を維持）', unit:'%', num:60}
];

/* ---------------- 目的（12カテゴリ・網羅） ----------------
   ここで「作りたいゲーム」を決める。漠然としているグループは
   この選択肢から決めてよい（それで企画になる）。
   goal: 成功条件の文。rates: ゲーム性チェックの素点。
   ------------------------------------------------------------ */
CT.PURPOSE_GROUPS = [
  {id:'pg_run', label:'進む・逃げる', items:[
    {id:'p_run_out',   label:'家を飛び出して遠くまで走る',       goal:'家の外を駆け抜けて最後まで走る',  rates:{uni:0,twi:0,fun:1,emp:1}},
    {id:'p_run_vac',   label:'掃除機から逃げて家の中を一周する', goal:'掃除機を振り切って家の中を一周する', rates:{uni:1,twi:1,fun:2,emp:1}},
    {id:'p_run_rain',  label:'雨の中を濡れずに家まで帰る',       goal:'濡れずに家まで帰る',              rates:{uni:1,twi:1,fun:1,emp:1}}
  ]},
  {id:'pg_climb', label:'登る・高く', items:[
    {id:'p_climb_tower', label:'高いタワーを登って頂上に立つ',     goal:'一番高いところに立つ',        rates:{uni:1,twi:1,fun:1,emp:0}},
    {id:'p_climb_fridge',label:'棚を渡って冷蔵庫の上のごちそうへ', goal:'冷蔵庫の上のごちそうに届く',  rates:{uni:1,twi:2,fun:2,emp:0}},
    {id:'p_climb_crow',  label:'庭の木を登ってカラスの巣をのぞく', goal:'木の上のカラスのところまで行く', rates:{uni:1,twi:1,fun:1,emp:0}}
  ]},
  {id:'pg_jump', label:'跳ぶ・届く', items:[
    {id:'p_jump_bird',  label:'窓の外のカラスに跳んで威嚇する', goal:'窓際でカラスを追い払う',      rates:{uni:1,twi:1,fun:2,emp:0}},
    {id:'p_jump_gap',   label:'崩れそうな足場を跳んで渡る',     goal:'落ちずに向こう側へ渡る',      rates:{uni:0,twi:1,fun:1,emp:0}},
    {id:'p_jump_toy',   label:'揺れるおもちゃに飛びついて取る', goal:'揺れるおもちゃを捕まえる',    rates:{uni:0,twi:0,fun:2,emp:1}}
  ]},
  {id:'pg_hide', label:'隠れる・見つからない', items:[
    {id:'p_hide_dinner', label:'起きている飼い主に隠れて夜ごはんを食べる', goal:'見つからずに夜ごはんにありつく', rates:{uni:2,twi:2,fun:2,emp:1}},
    {id:'p_hide_rest',   label:'じゃれたい飼い主から隠れて休む',             goal:'見つからずに静かに休む',       rates:{uni:1,twi:1,fun:1,emp:2}},
    {id:'p_hide_fish',   label:'見つからないように魚をくわえて逃げる',     goal:'魚を無事に持ち帰る',           rates:{uni:1,twi:2,fun:2,emp:0}}
  ]},
  {id:'pg_collect', label:'集める・見つける', items:[
    {id:'p_collect_can',   label:'家じゅうに隠れた猫缶をぜんぶ集める', goal:'隠れた猫缶をぜんぶ集める',   rates:{uni:0,twi:1,fun:1,emp:1}},
    {id:'p_collect_yarn',  label:'転がった毛糸玉を追って集める',       goal:'毛糸玉をぜんぶ回収する',     rates:{uni:0,twi:0,fun:2,emp:1}},
    {id:'p_collect_fish',  label:'冷蔵庫から魚を運び出して隠す',       goal:'魚を隠し場所まで運ぶ',       rates:{uni:1,twi:1,fun:1,emp:0}},
    {id:'p_collect_friend',label:'町を歩いて仲間のニャンコを見つける', goal:'仲間ニャンコを3ぴき集める',  rates:{uni:1,twi:1,fun:1,emp:2}}
  ]},
  {id:'pg_ambush', label:'狙う・待つ', items:[
    {id:'p_amb_mouse', label:'ネズミを待ち伏せして一瞬で捕まえる', goal:'待ち伏せてネズミを捕まえる',   rates:{uni:1,twi:2,fun:1,emp:0}},
    {id:'p_amb_owner', label:'廊下の角で飼い主を待ち伏せする',     goal:'飼い主を驚かす',              rates:{uni:1,twi:0,fun:2,emp:2}},
    {id:'p_amb_fish',  label:'水槽の前で動かず、えさを狙う',       goal:'えさを落として捕まえる',      rates:{uni:1,twi:1,fun:1,emp:0}}
  ]},
  {id:'pg_chaos', label:'壊す・ひっくり返す', items:[
    {id:'p_chaos_desk',  label:'机の上をひっくり返してカオスにする', goal:'机の上を全部落とす',           rates:{uni:1,twi:0,fun:2,emp:0}},
    {id:'p_chaos_tree',  label:'クリスマスツリーに登って飾りを落とす', goal:'ツリーの飾りを全部落とす',   rates:{uni:2,twi:1,fun:2,emp:0}},
    {id:'p_chaos_door',  label:'閉まったトイレのドアを開けて入る',   goal:'しかけを解いてドアを開ける',   rates:{uni:1,twi:2,fun:1,emp:1}}
  ]},
  {id:'pg_care', label:'癒す・かまう', items:[
    {id:'p_care_lap',    label:'膝の上に乗って飼い主を癒す',   goal:'飼い主を癒して寝かせる',        rates:{uni:0,twi:0,fun:1,emp:2}},
    {id:'p_care_morning',label:'朝、飼い主を時間どおりに起こす', goal:'決まった時間に飼い主を起こす', rates:{uni:1,twi:1,fun:2,emp:1}},
    {id:'p_care_sick',   label:'元気のない飼い主に寄り添う',   goal:'元気のない人に寄り添う',       rates:{uni:1,twi:0,fun:0,emp:2}}
  ]},
  {id:'pg_battle', label:'戦う・撃退する', items:[
    {id:'p_bat_dog',    label:'庭に入ってきた犬をフクレて撃退する', goal:'犬を家に入れさせない',       rates:{uni:1,twi:1,fun:2,emp:0}},
    {id:'p_bat_vacuum', label:'動き出した掃除機と戦って追い出す',   goal:'掃除機を部屋から追い出す',   rates:{uni:1,twi:1,fun:2,emp:0}}
  ]},
  {id:'pg_puzzle', label:'解く・開く', items:[
    {id:'p_pz_fridge', label:'しかけのある扉を解いて冷蔵庫へ',   goal:'しかけを解いて冷蔵庫を開ける', rates:{uni:1,twi:2,fun:1,emp:0}},
    {id:'p_pz_kitten', label:'段ボールの山をどけて子猫を助ける', goal:'段ボールをどけて子猫を助ける', rates:{uni:1,twi:1,fun:1,emp:2}}
  ]},
  {id:'pg_balance', label:'運ぶ・バランス', items:[
    {id:'p_bal_wall',  label:'塀の上をバランスよく歩いて帰る', goal:'落ちずに塀の上を渡る',        rates:{uni:0,twi:1,fun:1,emp:0}},
    {id:'p_bal_carry', label:'口にくわえた猫缶を落とさずに運ぶ', goal:'落とさずに猫缶を運ぶ',     rates:{uni:0,twi:1,fun:1,emp:0}}
  ]},
  {id:'pg_water', label:'水から逃げる', items:[
    {id:'p_wat_bath',  label:'お風呂から逃げて高い所へ上がる', goal:'お風呂から逃げて高い所へ逃げる', rates:{uni:1,twi:1,fun:2,emp:0}},
    {id:'p_wat_puddle',label:'水たまりを避けて近道を行く',       goal:'濡れずに近道を行く',            rates:{uni:0,twi:0,fun:1,emp:0}}
  ]}
];
CT.PURPOSES = CT.PURPOSE_GROUPS.reduce(function(a,g){ return a.concat(g.items); }, []);

/* ---------------- 誰を操作するか（実観察: 約2割のグループは「人がネコに何かする」案を出す） ----------------
   sub_cat  = ネコを操作する（従来どおり）
   sub_human= 人（飼い主）が操作キャラで、ネコに何かする
   EMSの背骨（目的・手段・制約）は同じ。操作の主体が変わるだけ。
   ------------------------------------------------------------ */
CT.SUBJECTS = [
  {id:'sub_cat',   label:'ネコを操作する',                 word:'ネコが'},
  {id:'sub_human', label:'人が操作して、ネコに何かする',   word:'飼い主が'}
];

/* ---------------- 人操作の目的（7カテゴリ18種） ---------------- */
CT.PURPOSE_GROUPS_HUMAN = [
  {id:'hg_find', label:'探す・見つける', items:[
    {id:'h_runaway', label:'脱走したネコを探す',               goal:'脱走したネコを見つけて連れ帰る', rates:{uni:1,twi:2,fun:1,emp:1}},
    {id:'h_hidden',  label:'隠れているネコを見つける',         goal:'隠れたネコを見つける',           rates:{uni:1,twi:1,fun:1,emp:1}},
    {id:'h_spot',    label:'家の中のネコの隠れ家を全部見つける', goal:'隠れ家をぜんぶ見つける',       rates:{uni:1,twi:1,fun:2,emp:0}}
  ]},
  {id:'hg_catch', label:'捕まえる・連れて行く', items:[
    {id:'h_cage',  label:'ネコを抱いてケージに戻す',   goal:'ネコをケージまで連れて帰る', rates:{uni:0,twi:1,fun:2,emp:1}},
    {id:'h_clinic',label:'病院の日、ネコを捕まえる',   goal:'病院の日、ネコを無事に捕まえる', rates:{uni:1,twi:1,fun:2,emp:1}}
  ]},
  {id:'hg_care', label:'お世話をする', items:[
    {id:'h_nail',  label:'爪切りをする',               goal:'爪切りをやり遂げる',       rates:{uni:1,twi:1,fun:2,emp:1}},
    {id:'h_bath',  label:'お風呂に入れる',             goal:'お風呂に入れて乾かす',     rates:{uni:0,twi:1,fun:2,emp:0}},
    {id:'h_feed',  label:'好き嫌いするネコにごはんをあげる', goal:'ごはんを食べてもらう', rates:{uni:1,twi:1,fun:2,emp:1}},
    {id:'h_med',   label:'薬を飲ませる',               goal:'薬を飲ませて治す',         rates:{uni:1,twi:2,fun:1,emp:0}}
  ]},
  {id:'hg_shoot', label:'記録する', items:[
    {id:'h_photo',  label:'かわいい瞬間を写真に収める',   goal:'かわいい瞬間を撮る',     rates:{uni:2,twi:1,fun:1,emp:1}},
    {id:'h_best',   label:'ベストショットを1枚撮る',       goal:'ベストショットを撮る',   rates:{uni:1,twi:2,fun:1,emp:0}}
  ]},
  {id:'hg_play', label:'遊ぶ', items:[
    {id:'h_tease', label:'猫じゃらしで遊ばせる',         goal:'ネコを夢中にさせて遊ばせる', rates:{uni:0,twi:1,fun:2,emp:1}},
    {id:'h_play',  label:'おもちゃで一緒に遊ぶ',         goal:'おもちゃで一緒に遊ぶ',       rates:{uni:0,twi:0,fun:2,emp:1}}
  ]},
  {id:'hg_guard', label:'守る・防ぐ', items:[
    {id:'h_guard', label:'ネコを危険物から守る',         goal:'危険物からネコを守る',     rates:{uni:1,twi:1,fun:1,emp:1}},
    {id:'h_door',  label:'脱走を防いで戸締りする',       goal:'脱走せずに戸締りを済ませる', rates:{uni:1,twi:2,fun:1,emp:0}}
  ]},
  {id:'hg_live', label:'邪魔と付き合う', items:[
    {id:'h_work',  label:'ネコの邪魔に入られながら仕事を終わらせる', goal:'邪魔をやり過ごして仕事を終える', rates:{uni:2,twi:2,fun:2,emp:2}},
    {id:'h_sleep', label:'ネコに乗られたまま、動かずに眠る',         goal:'ネコを起こさずに眠る',           rates:{uni:2,twi:1,fun:1,emp:2}}
  ]}
];
CT.PURPOSES_HUMAN = CT.PURPOSE_GROUPS_HUMAN.reduce(function(a,g){ return a.concat(g.items); }, []);

/* ---------------- 人（飼い主）の行動8種（手段の材料・人操作のとき） ---------------- */
CT.HUMAN_ACTIONS = [
  {id:'h_find',  label:'さがす',           verb:'部屋じゅうをさがす',           note:'探索',
   variants:['部屋じゅうをさがす','足あとをたどる','ごはんの音で呼ぶ'],
   rates:{uni:1,twi:2,fun:1,emp:1}, why:'見つける楽しさは、隠れ場所の数と見える範囲の制約で作る'},
  {id:'h_call',  label:'呼ぶ',             verb:'ネコを呼んで誘い出す',         note:'誘い出し',
   variants:['ネコを呼んで誘い出す','音でおびき寄せる','おもちゃで誘う'],
   rates:{uni:1,twi:1,fun:2,emp:2}, why:'呼んでも応じるかどうかの緊張が面白さになる'},
  {id:'h_lure',  label:'誘う',             verb:'おやつとおもちゃで誘う',       note:'誘導',
   variants:['おやつとおもちゃで誘う','物で道を作って誘う','高い場所に誘って導く'],
   rates:{uni:1,twi:1,fun:2,emp:1}, why:'人の作戦とネコの気まぐれの綱引きになる'},
  {id:'h_catch', label:'捕まえる',         verb:'すきをうかがって抱き上げる',   note:'タイミング',
   variants:['すきをうかがって抱き上げる','逃げたら待って捕まえる','箱で誘って捕まえる'],
   rates:{uni:0,twi:1,fun:2,emp:1}, why:'体力とタイミングの勝負。時間・回数の制約と噛む'},
  {id:'h_care',  label:'お世話をする',     verb:'ネコのお世話をやり遂げる',     note:'お手入れ',
   variants:['ネコのお世話をやり遂げる','暴れるネコをなだめながら進める','逃げられる前に済ませる'],
   rates:{uni:1,twi:1,fun:2,emp:1}, why:'ネコが嫌がる行動なので、音ゲージ制約と最も噛み合う'},
  {id:'h_shoot', label:'撮る',             verb:'シャッターを切る',             note:'記録',
   variants:['シャッターを切る','ベストショットを狙って待つ','動画に収める'],
   rates:{uni:2,twi:2,fun:1,emp:1}, why:'良い瞬間を待つ構図。時間制約と自然に噛む'},
  {id:'h_guard', label:'守る',             verb:'危険物を片付けて守る',         note:'同時管理',
   variants:['危険物を片付けて守る','脱走のすきを防ぐ','物を守りきる'],
   rates:{uni:1,twi:1,fun:1,emp:1}, why:'同時にいくつも見る管理が、そのまま難度になる'},
  {id:'h_endure',label:'我慢する',         verb:'動かずに耐える',               note:'じっとする',
   variants:['動かずに耐える','邪魔をやり過ごす','寝息を立てずに眠る'],
   rates:{uni:2,twi:2,fun:2,emp:2}, why:'邪魔してくるネコが愛おしい、共感の塊の操作'}
];

/* ---------------- ワークの候補（各カテゴリ3つまで+その他記入） ----------------
   ラベルには出所のコメントを書かない（生徒の選択にバイアスが出るため）。
   ------------------------------------------------------------ */
CT.CANDS = {
  good: [
    {id:'good_jump',   label:'ジャンプ'},
    {id:'good_climb',  label:'高い所に登る'},
    {id:'good_run',    label:'素早く走る'},
    {id:'good_squeeze',label:'狭い所に入る'},
    {id:'good_hide',   label:'隠れる'},
    {id:'good_hunt',   label:'獲物を追う'},
    {id:'good_balance',label:'バランスを取る'},
    {id:'good_eye',    label:'夜目が効く'},
    {id:'good_land',   label:'着地が上手い'},
    {id:'good_silent', label:'音を立てない'},
    {id:'good_heal',   label:'そばにいるだけで癒す'},
    {id:'good_amai',   label:'甘え上手（すり寄る・膝に乗る）'}
  ],
  bad: [
    {id:'bad_water',   label:'水',               kind:'static'},
    {id:'bad_vacuum',  label:'掃除機',           kind:'move'},
    {id:'bad_dog',     label:'犬',               kind:'move'},
    {id:'bad_noise',   label:'大きな音',         kind:'sound'},
    {id:'bad_car',     label:'車',               kind:'move'},
    {id:'bad_bath',    label:'お風呂',           kind:'static'},
    {id:'bad_fall',    label:'落下',             kind:'static'},
    {id:'bad_trapped', label:'閉じ込められる',   kind:'static'},
    {id:'bad_crow',    label:'カラス',           kind:'move'},
    {id:'bad_thunder', label:'雷',               kind:'sound'},
    {id:'bad_citrus',  label:'柑橘の匂い',       kind:'static'},
    {id:'bad_cold',    label:'急な冷たい感触',   kind:'static'},
    {id:'bad_leek',    label:'ネギ',             kind:'static'}
  ],
  feat: [
    {id:'feat_box',    label:'段ボール好き'},
    {id:'feat_whisker',label:'ひげで幅を測る'},
    {id:'feat_paw',    label:'肉球は静か'},
    {id:'feat_tail',   label:'しっぽでバランス'},
    {id:'feat_night',  label:'夜行性'},
    {id:'feat_ear',    label:'音に敏感'},
    {id:'feat_groom',  label:'毛づくろいが日課'},
    {id:'feat_lap',    label:'膝の上に乗る'},
    {id:'feat_scratch',label:'爪とぎで磨く'},
    {id:'feat_arch',   label:'背を丸めて威嚇'},
    {id:'feat_heal',   label:'そばにいるだけで癒す'},
    {id:'feat_amai',   label:'甘え上手'},
    {id:'feat_voice',  label:'猫なで声（表記は「にゃー」だけ）'}
  ],
  target: [
    {id:'tg_cute',    label:'かわいいネコ好き'},
    {id:'tg_aruaru',  label:'ネコあるある好き'},
    {id:'tg_action',  label:'アクション好き'},
    {id:'tg_comical', label:'コミカル好き'},
    {id:'tg_short',   label:'短時間で遊べるもの好き'},
    {id:'tg_stress',  label:'仕事や勉強でストレスを受けた人'},
    {id:'tg_tired',   label:'疲れて家に帰ってきた人'},
    {id:'tg_heal',    label:'癒しを求める大人'},
    {id:'tg_lunch',   label:'お昼休みに少し遊ぶ人'},
    {id:'tg_nocat',   label:'ネコを飼いたくても飼えない人'}
  ]
};
CT.PICK_LIMIT = 3;

/* ---------------- しばりのおすすめ案（8パック・4案ずつ出す） ----------------
   聞き方: 「どんなルールなら頑張りたくなる?」→ 選んで数値を編集。
   {obstacle} は、グループが選んだ「苦手」で置き換わる（例: 掃除機）。
   ------------------------------------------------------------ */
CT.PACKS = [
  {id:'pk_time',   label:'じかんしばり',  items:[{id:'c_time',num:30}],
   text:'決めた時間までに達成できなくする（30秒）'},
  {id:'pk_obst',   label:'おじゃまもの',  items:[{id:'c_phys',num:1}],
   text:'{obstacle}が動き回っていて、当たるとミスになる'},
  {id:'pk_narrow', label:'せましばり',    items:[{id:'c_space',num:240}],
   text:'動ける範囲を横240pxに狭める（自由に動けない）'},
  {id:'pk_sleep',  label:'こえゲージ',    items:[{id:'c_info',num:60}],
   text:'{obstacle}を起こさずに進む（音ゲージ60%を維持）'},
  {id:'pk_count',  label:'かいすうしばり', items:[{id:'c_count',num:5}],
   text:'中心アクションは5回まで（失敗したやり直しも含む）'},
  {id:'pk_timeob', label:'じかん+おじゃまもの', items:[{id:'c_time',num:45},{id:'c_phys',num:2}],
   text:'45秒以内に、{obstacle}を避けながら達成する'},
  {id:'pk_narcount', label:'せま+かいすう', items:[{id:'c_space',num:160},{id:'c_count',num:3}],
   text:'動けるのは横160pxだけ。中心アクションは3回まで'},
  {id:'pk_hard',   label:'むずかしめ（2つ）', items:[{id:'c_time',num:20},{id:'c_info',num:40}],
   text:'20秒以内に、音ゲージ40%を維持しながら達成する'}
];
CT.PACKS_PAGE = 4;

/* ---------------- 要素シート（EMS講義継承・選択式+その他） ---------------- */
CT.SHEET = [
  {id:'s_challenge', label:'挑戦',    chips:['制限時間','敵・障害物','落ちる足場','音を立てる敵','起こってしまう相手']},
  {id:'s_reward',    label:'報酬',    chips:['点数','時間の延長','ネコの見た目グッズ','仲間ニャンコの追加']},
  {id:'s_choice',    label:'プレイヤーの選択', chips:['ルート選び','タイミングをはかる','強さの加減','順番を決める']},
  {id:'s_random',    label:'ランダム性（揺らぎ）', chips:['出現位置が変わる','動き方が変わる','出てくる物が変わる']},
  {id:'s_visual',    label:'ビジュアルイメージ', chips:['かわいい','コミカル','レトロ（ファミコン風）','オシャレ']}
];
CT.PERSONA_LABEL = '猫のゲームを買う人の課題';
CT.PERSONA_EX = '例: 仕事で疲れて癒されたいのに、帰る家にネコがいない';

/* ---------------- 判定の文言 ---------------- */
CT.JUDGE_WORDS = {
  green: {word:'ちょうどよい', note:'もう一回を押したくなる域です'},
  yellow:{word:'あまい',       note:'制約が弱く、すぐ飽きるかもしれません'},
  red:   {word:'むり',         note:'理不尽です。笑いではなく怒りになります'},
  empty: {word:'まだ決まっていない', note:'わからないままで大丈夫。どの画面で決めるかを下に書きます'}
};
CT.CHECK_AXES = ['uni','twi','fun','emp'];
CT.CHECK_NAMES = {uni:'ユニークさ', twi:'ひねり', fun:'おかしさ', emp:'共感'};
CT.CHECK_COMMENTS = {
  uni: ['定番の組み合わせ。しばりの数で上げられる','どこかひとつ、変わったところがある','中心アクションもゴールも「あるある」を外している'],
  twi: ['ひねりが弱い。物理・情報しばりを足すと変わる','制約が1つ、ひねりを加えている','ひねりが2重（アクション×制約）で効いている'],
  fun: ['シンプル。おかしさはキャラの動きで足せる','コミカルな要素が入っている','やっていて笑いが起きる構成'],
  emp: ['共感は「買う人」の選び方で上がる','癒しや身につまされる要素がある','遊ぶ人の気持ちに直接応えている']
};

/* ---------------- 展開6段階（PK//PROTO 継承） ---------------- */
CT.PHASES = [
  {id:'start', at:'0〜5秒',   name:'START（ふつう）',   speed:'×1.00', note:'操作を覚える5秒。不条理は出さない'},
  {id:'sign',  at:'5秒',      name:'予告（気配だけ）',  speed:'×1.00', note:'音を1回とラベルを1回。「何か来る」とだけ分からせる'},
  {id:'odd',   at:'5〜18秒',  name:'不条理が出る',      speed:'×1.05', note:'案の仕掛けが入る。ここで「そういうことか」と笑う'},
  {id:'ramp',  at:'残り12秒', name:'加速（1段目）',     speed:'×1.12', note:'速度と数だけ上げる。操作の種類は増やさない'},
  {id:'rush',  at:'残り7秒',  name:'ラッシュ（2段目）', speed:'×1.28', note:'画面の縁を赤い帯に。BGMに1音足す'},
  {id:'last',  at:'残り3秒',  name:'最後（3段目）',     speed:'×1.42', note:'明滅。ここで誰でも声が出る'}
];
/* ---------------- 舞台（背景）と BGMの型（ゲーム内容から決定的に選ぶ） ---------------- */
CT.STAGES = [
  {id:'st_home_morn', label:'家の中（朝）',   sky:'#F7E7C6', items:'窓2つ・棚とテーブルとソファのシルエット・電気の光・床の木目（横線）'},
  {id:'st_home_eve',  label:'家の中（夕方）', sky:'#E8B77D', items:'窓（夕日）・家具のシルエット・ランプの光・床の木目'},
  {id:'st_home_night',label:'家の中（夜）',   sky:'#2E2A3E', items:'窓1つ（月）・ランプのあかり・家具のシルエット・床の木目'},
  {id:'st_town_day',  label:'街の中（昼）',   sky:'#A8D8E8', items:'奥にビルのシルエット（四角の重なり）・電柱と電線・道路（帯）・看板（四角）'},
  {id:'st_town_eve',  label:'街の中（夕方）', sky:'#D88A5A', items:'ビルのシルエット・電柱と電線・道路・窓のあかり（四角）'},
  {id:'st_garden',    label:'庭',             sky:'#BFE0B0', items:'塀（上に細い通路）・植木鉢・洗濯物（線と四角）'},
  {id:'st_bath',      label:'お風呂場・水回り', sky:'#C7E0E8', items:'タイル（縦線）・洗濯機・バケツ・床の水たまり'},
  {id:'st_clinic',    label:'病院',           sky:'#E8EFE8', items:'待合席・受付カウンター・ポスター（四角）'}
];
CT.BGM_STYLES = [
  {id:'bgm_bright',  label:'あかるい朝（標準）', spec:'明るいメジャーコード・跳ねるようなリズム。朝のホームドラマのテーマのような、歌える明るさ'},
  {id:'bgm_relax',   label:'のんびり（癒し）',   spec:'ゆったりした3/4拍子・柔らかい音色（三角波中心）'},
  {id:'bgm_playful', label:'おちゃめ（いたずら）', spec:'スタッカートで跳ねる・ユーモラス（2拍目にアクセント）'},
  {id:'bgm_tense',   label:'こっそり（ひそひそ）', spec:'静かめ・シンプルなベースに時々高い音。緊張は作るが暗すぎない'},
  {id:'bgm_hurry',   label:'あわてる（かけっこ）', spec:'テンポ速め・推進力のある8分ノリ'}
];
/* 目的グループごとに舞台とBGMを決める（例外は上書き） */
CT.STAGE_MAP = {
  pg_run:'st_town_day',   p_run_vac:'st_home_morn', p_run_rain:'st_town_eve',
  pg_climb:'st_town_day', p_climb_fridge:'st_home_morn', p_climb_crow:'st_garden',
  pg_jump:'st_garden',    p_jump_bird:'st_home_morn',
  pg_hide:'st_home_night',
  pg_collect:'st_home_morn', p_collect_friend:'st_town_day',
  pg_ambush:'st_home_night', p_amb_fish:'st_home_morn',
  pg_chaos:'st_home_morn',
  pg_care:'st_home_eve',  p_care_morning:'st_home_morn',
  pg_battle:'st_garden',  p_bat_vacuum:'st_home_morn',
  pg_puzzle:'st_home_morn', p_pz_kitten:'st_home_night',
  pg_balance:'st_garden', p_bal_carry:'st_home_morn',
  pg_water:'st_bath',     p_wat_puddle:'st_town_day',
  hg_find:'st_home_night', h_runaway:'st_town_eve',
  hg_catch:'st_clinic',   hg_care:'st_home_morn', h_bath:'st_bath',
  hg_shoot:'st_home_morn', hg_play:'st_home_morn',
  hg_guard:'st_home_morn', hg_live:'st_home_morn', h_sleep:'st_home_night'
};
CT.BGM_MAP = {
  pg_run:'bgm_hurry',  pg_climb:'bgm_bright',  pg_jump:'bgm_bright',
  pg_hide:'bgm_tense', pg_collect:'bgm_bright', pg_ambush:'bgm_tense',
  pg_chaos:'bgm_playful', pg_care:'bgm_relax', pg_battle:'bgm_hurry',
  pg_puzzle:'bgm_bright', pg_balance:'bgm_bright', pg_water:'bgm_hurry',
  hg_find:'bgm_tense', hg_catch:'bgm_hurry', hg_care:'bgm_relax',
  hg_shoot:'bgm_bright', hg_play:'bgm_playful', hg_guard:'bgm_tense', hg_live:'bgm_relax'
};
function stageOf(purposeId){
  if(!purposeId) return CT.STAGES[0];
  if(CT.STAGE_MAP[purposeId]) return CT.STAGES.find(s=>s.id===CT.STAGE_MAP[purposeId]) || CT.STAGES[0];
  const grp = CT.PURPOSE_GROUPS.concat(CT.PURPOSE_GROUPS_HUMAN||[]).find(g=>g.items.some(i=>i.id===purposeId));
  if(grp && CT.STAGE_MAP[grp.id]) return CT.STAGES.find(s=>s.id===CT.STAGE_MAP[grp.id]) || CT.STAGES[0];
  return CT.STAGES[0];
}
function bgmOf(purposeId){
  if(!purposeId) return CT.BGM_STYLES[0];
  if(CT.BGM_MAP[purposeId]) return CT.BGM_STYLES.find(s=>s.id===CT.BGM_MAP[purposeId]) || CT.BGM_STYLES[0];
  const grp = CT.PURPOSE_GROUPS.concat(CT.PURPOSE_GROUPS_HUMAN||[]).find(g=>g.items.some(i=>i.id===purposeId));
  if(grp && CT.BGM_MAP[grp.id]) return CT.BGM_STYLES.find(s=>s.id===CT.BGM_MAP[grp.id]) || CT.BGM_STYLES[0];
  return CT.BGM_STYLES[0];
}
CT.stageOf = stageOf;
CT.bgmOf = bgmOf;

CT.VERSION = {tag:'カメラ版 v0.7.0', date:'2026-11-02'};
