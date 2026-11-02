/* =========================================================
   CATGame_GEN — 型ライブラリ（作り方の型・EMS確定前でも選べる）
   猫の目的グループ15型（pg_*）＋Unityキット5型（pt_*）を収録する。
   目的グループと同じidの型を必ず用意し、型が無い目的を作らない。
   detail(P) は plan（EMS確定後の案）から【システム詳細】を決定的に組み立てる。
   乱数なし・同じ入力なら同じ出力。
   ------------------------------------------------------------ */
window.CT = window.CT || {};

CT.PATTERNS = {
  pg_run: {
    id: 'pg_run',
    label: '逃げ切り型',
    brief: '水面上昇型：下から迫る水から、足場を選んで高所へ逃げ切る',
    lever: 'TUNING.waterSpeed = 1.0（0.8で易しく・1.2で難しく。水位の上昇速度につなげる）',
    dur: 45,
    detail: function(P){
      const c = (P && P.cons) || [];
      const dur = (P && P.dur) || 45;
      const rise = 1100;
      const speed = (rise / dur).toFixed(1);
      const L = [];
      L.push('▼ レベル構造: 水面上昇型（逃げ切り）');
      L.push('・マップ: 横960px×高さ約1,600pxの縦長。最下層の安全高台から開始する（開始直後の水没・被弾の理不尽をなくす）。');
      L.push('・水位: 下端から' + dur + '秒かけて約' + rise + 'px上昇（約' + speed + 'px/秒）。水位に浸かったらミス。水位は常に見える（水面は光る帯＋波の動き）。');
      L.push('・足場: ベランダ風の横足場をジグザグに配置（右→左上→右上）。崩れる足場を2〜3割混ぜて、足場選びに緊張を作る。');
      if(P.centerVerb){
        L.push('・中心アクション「' + P.centerVerb + '」: ' + ((P.action && P.action.id==='a_climb') ? '壁に面した足場から、壁接触中にもう1回だけ跳べる（壁ジャンプ）。これで折り返し登坂が成立する。' : '水から逃げる移動の中心に置く。'));
      }
      if(P.subVerb){
        L.push('・サブ「' + P.subVerb + '」: 近づく障害（カラス等）を押し戻せる。使った後は2秒のクールダウン。押し戻しは得点にしない（逃げ切りの道具）。');
      }
      if(c.some(x=>x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・障害: ' + obs.join('・') + '。水は水位そのもので表現し、音は「音波リング」が水平に飛来する（避けて進む。伏せ回避はこの型では足さない）。');
      }
      L.push('・調整レバー: ' + this.lever);
      L.push('・カメラ: 縦長マップなので camY をプレイヤーに追従させ、0〜MAP_H-H にクランプする。HUDはカメラの外に描く。');
      L.push('・速度倍率 speedMul はキャラ・障害・BGMに共通。水位の速さだけは waterSpeed を掛ける（展開表の加速とは別のつまみにする）。');
      return L.join('\n');
    }
  }
  ,pg_puzzle: {
    id:'pg_puzzle', label:'手番パズル型',
    brief:'手番制パズル型：時間が止まっている。置く場所を考える',
    lever:'TUNING.hintCount = 2（ヒントの回数。0で無し）',
    dur: 30,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 手番制パズル型（パズル）');
      L.push('・時間は手番の間だけ止まる。落ちてくる物・動く敵は出さない（考えることに集中させる）。');
      L.push('・盤面: 960×540の中に、置ける場所とゴール（ネコの行き先）を用意する。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 手番ごとに1つ置く。置いた物は動かせない（置き直しはリセット）。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。置き切ったら自動でネコが動いて結果が見える演出を入れる。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_actpuzzle: {
    id:'pg_actpuzzle', label:'落ち配置型',
    brief:'落ち配置型（アクションパズル）：落ちてくる物を置きながら解く',
    lever:'TUNING.dropSpeed = 1.0（0.7で易しく・1.3で難しく）',
    dur: 45,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 落ち配置型（アクションパズル）');
      L.push('・物が一定間隔で上から落ちてくる。落とす場所を左右で選んで、積む・はめる・埋める。');
      L.push('・積んだ物は消えない（スイカゲーム型）。崩れは物理風の揺れで表現（完全物理エンジンは不要）。');
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。高さのラインを超えたら失敗（水位ではなく高さ制限）。'); }
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 落とす場所の選択そのもの。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_puzzact: {
    id:'pg_puzzact', label:'しかけ移動型',
    brief:'しかけ移動型（パズルアクション）：床が動く中で解きながら進む',
    lever:'TUNING.floorSpeed = 1.0（床の動く速さ。0.7で易しく）',
    dur: 45,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: しかけ移動型（パズルアクション）');
      L.push('・マップ: 横960px×高さ約1,200px。床・ブロック・スイッチが動く。');
      L.push('・「解く」→「道が開く」→「進む」の3拍子を1セットにし、3回繰り返す。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 動く床への乗り移りのタイミングに使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pg_rogue: {
    id:'pg_rogue', label:'変化挑戦型',
    brief:'変化挑戦型（ローグライク・ローグライト）：挑戦のたびに仕かけが変わる',
    lever:'TUNING.shuffleStep = 1（挑戦ごとの変化の強さ）',
    dur: 30,
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: 変化挑戦型（ローグライク・ローグライト）');
      L.push('・塔の仕かけ（足場の位置・障害の種類）はパターン4種を配列で用意し、挑戦ごとに順番に切り替える（ランダムでなく巡回・決定的。毎回変わる感覚は出る）。');
      L.push('・失敗したら最初から。ただし「ローグライト」の案では、2回目以降は楽になる道が開く（安全な足場が1つ増える）。');
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 塔を登る操作として使う。'); }
      L.push('・調整レバー: '+this.lever);
      L.push('・難度: 10回挑戦して1回登れる強さが狙い。しばりは1つまで（EMS判定の「むり」になりやすい）。');
      return L.join('\n');
    }
  }

  ,pt_moveplat: {
    id:'pt_moveplat', label:'うごく床型',
    brief:'うごく床型：動く足場を渡って進む（Moving Platform・Elevator・Falling・Spring）',
    lever:'GameSettings → Move Speed / Enemy Speed（Slow・Normal・Fast）',
    dur: 45,
    unity:{scene:'SC_Base_Side', kit:['Moving Platform','Elevator Platform','Falling Platform','Spring Platform','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: うごく床型（Unity: Moving Platform 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Moving Platform / Elevator Platform / Falling Platform / Spring Platform / Goal');
      L.push('・シーン: SC_Base_Side');
      L.push('・シーンは SC_Base_Side（横）を想定。動く床が3〜5枚あり、それぞれ動き方が違う（左右・上下・乗ると落ちる・乗ると高く跳ぶ）。');
      L.push('・床の動きは往復（行って戻る）。プレイヤーは「いつ乗るか」をはかる。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 動く床への乗り移りのタイミングに使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'（Goal Prefab を終点に置く）。'); }
      L.push('・調整レバー: '+this.lever+'（ゲーム性チェックの点検後に最初に動かす場所）');
      return L.join('\n');
    }
  },
  pt_collect: {
    id:'pt_collect', label:'あつめる型',
    brief:'あつめる型：散らばった物をぜんぶ集めてゴールへ（Collectible・Goal）',
    lever:'GameSettings → Required Item Count / Game Time',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Collectible','Goal','Timer','Patrol Enemy']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: あつめる型（Unity: Collectible 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Collectible / Goal / Timer / Required Item Count');
      L.push('・シーン: SC_Base_Top');
      L.push('・シーンは SC_Base_Top（俯瞰）を想定。集める物（猫缶・魚・毛糸）を部屋の隅と袋小路に配置する。');
      L.push('・全部集むと Goal が開く（Required Item Count と連動）。遠い場所の物ほど価値が高い（得点を上乗せ）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 移動しながら取る操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_hide: {
    id:'pt_hide', label:'かくれる型',
    brief:'かくれる型：隠れながら目的を遂げる（Hide Object・Patrol Enemy・音ゲージ）',
    lever:'GameSettings → Enemy Speed / Game Time',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Hide Object','Patrol Enemy','Collectible','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: かくれる型（Unity: Hide Object 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Hide Object / Patrol Enemy / Goal');
      L.push('・シーン: SC_Base_Top');
      L.push('・巡回する敵（Patrol Enemy）の視線を抜けて、隠れ場所（Hide Object）に中継しながら進む。');
      L.push('・音ゲージ制約と組み合わせる: 走ると音が上がり、隠れると下がる。敵に見つかるとミス。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 隠れ場所から次へ移る判断に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_switch: {
    id:'pt_switch', label:'しかけ解き型',
    brief:'しかけ解き型：スイッチと押し箱で道を開ける（Switch・Push Box・Switch Gate）',
    lever:'GameSettings → Game Time（解く時間）/ Move Speed',
    dur: 45,
    unity:{scene:'SC_Base_Top', kit:['Switch','Switch Gate','Push Box','Pressure Switch','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: しかけ解き型（Unity: Switch 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Switch / Switch Gate / Push Box / Pressure Switch / Goal');
      L.push('・シーン: SC_Base_Top');
      L.push('・「解く→道が開く→進む」を1セットにして3回繰り返す。押し箱は重し（Pressure Switch）にも足場にもなる。');
      L.push('・スイッチを押す順番に正解がある（看板 Sign Board にヒントを出してよい）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 箱を押す・乗る操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'（Switch Gate の向こう）。'); }
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  },
  pt_escape: {
    id:'pt_escape', label:'だっしゅつ型',
    brief:'だっしゅつ型：迫る危険から高所・出口へ（Timer・Hazard Area）',
    lever:'GameSettings → Game Time / Enemy Speed',
    dur: 45,
    unity:{scene:'SC_Base_Vertical', kit:['Hazard Area','Timer','Moving Platform','Goal']},
    detail: function(P){
      const L=[];
      L.push('▼ レベル構造: だっしゅつ型（Unity: Hazard Area + Timer 系）');
      L.push('・この日に使う仕かけ（Unityキット）: Hazard Area / Timer / Moving Platform / Goal');
      L.push('・シーン: SC_Base_Vertical');
      L.push('・危険エリア（Hazard Area＝水・煙など）が下からじわじわ迫る（Timer と連動して一定速度で上昇）。触れるとミス。');
      L.push('・縦長マップ（SC_Base_Vertical 想定）。最下層の安全高台から開始する（開始直後の被弾の理不尽をなくす）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 高く登る・逃げる操作に使う。'); }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。'); }
      L.push('・調整レバー: '+this.lever+'（危険の迫る速さ）');
      return L.join('\n');
    }
  }

  ,pg_climb: {
    id:'pg_climb', label:'のぼり型',
    brief:'縦登り型：足場を選んで高い所へ登り切る',
    lever:'TUNING.climbGap = 1.0（0.85で易しく・1.15で難しく。足場の間隔に掛ける）',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 縦登り型（クライム）');
      L.push('・マップ: 横960px×高さ約1,600pxの縦長。下の安全な床から開始し、上へ登る。');
      L.push('・足場: 左右に振りながら上へ続く足場を配置する。1段の高さはジャンプ1回で届く範囲（約120〜180px）にそろえ、届かない段を作らない。');
      L.push('・落下: 下の安全な床へ戻す（即ミスにしない）。落ちた回数はHUDに出す。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 次に乗る足場を選ぶ操作に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 行き止まりから1回だけ立て直す。使った後は2秒のクールダウン。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間はスタートから計測する。時間切れはその場で終了し、登り切れなかった扱いにする。');
      }
      if(c.some(x=>x.def && x.def.id==='c_count')){
        L.push('・回数: ジャンプ回数をHUDに出す。使い切ったら登れない（足場に立って考える時間は残す）。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。最上段に旗を置き、触れたら成功。'); }
      L.push('・カメラ: 縦長マップなので camY をプレイヤーに追従させ、0〜MAP_H-H にクランプする。HUDはカメラの外に描く。');
      L.push('・難度: 10回挑戦して2〜3回登れる強さが狙い。足場の間隔だけで調整し、敵を増やさない。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_jump: {
    id:'pg_jump', label:'ジャンプ移動型',
    brief:'ジャンプ移動型：切れ目の向こうへ跳んで渡る',
    lever:'TUNING.jumpPower = 1.0（0.85で易しく・1.15で難しく。跳ぶ距離に掛ける）',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: ジャンプ移動型（横移動＋跳躍）');
      L.push('・マップ: 横960px×高さ540pxの横画面。左端から右端へ、切れ目のある床を渡る。');
      L.push('・切れ目: 1段目は助走なしで届く幅（約120px）、2段目は助走あり（約180px）。3段目以降で2段ジャンプを要求する。');
      L.push('・足場: 動く足場と崩れる足場を2〜3枚混ぜる。動きは往復で、止まる位置を必ず見せる。');
      L.push('・落下: 画面下に落ちたら直前のチェックポイントへ戻す。ライフは減らさない（跳ぶ練習を止めない）。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 切れ目を渡る主操作にする。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 届かないときの保険として1回だけ使える。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: スタートから計測し、時間切れは失敗。チェックポイントへ戻った時間も戻さない。');
      }
      if(c.some(x=>x.def && x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・障害: '+obs.join('・')+'。足場の上に置き、跳ぶ前に見える位置へ固定する。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。右端のゴール台に触れたら成功。'); }
      L.push('・難度: 10回中2〜3回渡れる幅にする。落ちた場所が分かるように、直前の足場を点滅させる。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_hide: {
    id:'pg_hide', label:'しのびこむ型',
    brief:'隠密型：見張りの視線をよけて、隠れ場所から隠れ場所へ進む',
    lever:'TUNING.guardSpeed = 1.0（0.8で易しく・1.2で難しく）／TUNING.visionRange = 160（視線の長さpx）',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 隠密型（ステルス）');
      L.push('・マップ: 横960px×高さ540pxの部屋。隠れ場所（箱・ソファの陰・カーテン）を4〜6か所置く。');
      L.push('・見張り: 巡回する敵を1〜2体置く。経路はウェイポイントの配列で決め、乱数は使わない。視線は進行方向の扇形で表示する。');
      L.push('・見つかった: 視線に入ると音ゲージが増える。100%で失敗。隠れ場所に入るとゲージは減る。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 隠れ場所から次の隠れ場所へ移る判断に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 敵の注意を1回だけそらす。使うと10秒間は再使用できない。'); }
      if(c.some(x=>x.def && x.def.id==='c_info')){
        L.push('・情報: 音ゲージを常に表示する。走る・物に当たるで上がり、止まる・隠れるで下がる。');
      }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内に目的の場所へ着く。時間切れは「見つかった」と同じ失敗扱い。');
      }
      if(c.some(x=>x.def && x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・じゃま: '+obs.join('・')+'。音を立てる物として配置し、当たると音ゲージが大きく上がる。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。最後の隠れ場所からゴールへ触れたら成功。'); }
      L.push('・難度: 敵の視線は「見えている」ことを最優先する。暗くして見えなくする演出は使わない。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_collect: {
    id:'pg_collect', label:'あつめて運ぶ型',
    brief:'回収型：散らばった猫缶を集めてゴールへ運ぶ',
    lever:'TUNING.requiredCount = 5（集める数。3で易しく・7で難しく）',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 回収型（コレクト）');
      L.push('・マップ: 横960px×高さ540pxの部屋。集める物を8〜12個置き、そのうち必要な数だけ集める。');
      L.push('・配置: 遠い場所・袋小路・敵の巡回路上に分けて置く。全部同じ距離に並べない。');
      L.push('・回収: 触れたら取得。取得音と数字ポップを出し、残り数をHUDに表示する。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 移動しながら取る操作に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 遠回りを減らす近道として1回だけ使える。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内に必要数を集める。取得した物は時間切れでも消さない。');
      }
      if(c.some(x=>x.def && x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・じゃま: '+obs.join('・')+'が巡回する。触れると1ライフ減り、外向きにノックバックする。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。必要数を集めたらゴールが開き、触れたら成功。'); }
      L.push('・難度: 必要数は全体の6割前後。全部集めなくても成功できるようにし、取りこぼしの悔しさを残す。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_ambush: {
    id:'pg_ambush', label:'まちぶせ型',
    brief:'待ち伏せ型：獲物が来るまで待ち、一瞬の窓で飛び出す',
    lever:'TUNING.windowSec = 0.6（飛び出せる時間。0.8で易しく・0.4で難しく）／TUNING.cycleSec = 3.0',
    dur:30,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 待ち伏せ型（タイミング）');
      L.push('・マップ: 横960px×高さ540pxの部屋。隠れ場所の陰から、獲物が通るのを待つ。');
      L.push('・獲物: 決まった周期で通り過ぎる。周期と経路は配列で固定し、乱数は使わない。');
      L.push('・窓: 獲物が正面を横切る0.6秒だけ成功する。早すぎても遅すぎても空振りし、挑戦回数を1つ消費する。');
      L.push('・待ち: 待っている間は移動しない。我慢できずに動くと音ゲージが上がり、獲物が逃げる。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 窓に合わせて飛び出す操作に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 空振りした後に1回だけ体勢を立て直す。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間そのものを短くしすぎない。待つ型なので、移動系より5〜10秒長く取る。');
      }
      if(c.some(x=>x.def && x.def.id==='c_count')){
        L.push('・回数: 飛び出せる回数をHUDに出す。残り0で失敗。回数は「待つ価値」を作るつまみになる。');
      }
      if(c.some(x=>x.def && x.def.id==='c_info')){
        L.push('・情報: 獲物の足音と影だけを手がかりにする。姿を常に全部見せない（見せすぎると待つ意味が消える）。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。成功したら獲物を捕まえた演出を1回だけ出す。'); }
      L.push('・難度: 10回中2〜3回成功する窓の広さ。窓を0.2秒以下にしない（理不尽になる）。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_chaos: {
    id:'pg_chaos', label:'ひっくり返す型',
    brief:'破壊カウント型：机の上の物をぜんぶ落としてカオスにする',
    lever:'TUNING.knockPower = 1.0（0.8で易しく・1.2で難しく）／TUNING.objectCount = 10',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 破壊カウント型（カオス）');
      L.push('・マップ: 横960px×高さ540pxの部屋。机を3〜4台置き、上に落とせる物を10個前後載せる。');
      L.push('・操作: 机に飛び乗り、体当たりで物を落とす。落ちた物は床で止まり、消えない。');
      L.push('・カウント: 落とした数をHUDに出す。目標数に届いたら成功。');
      L.push('・じゃま: 飼い主か掃除機が巡回する。触れると1ライフ減り、外向きにノックバックする。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 物を落とす主操作にする。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 机から机へ移る移動として使う。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内に目標数へ届かせる。時間切れは失敗だが、落とした数は結果画面に残す。');
      }
      if(c.some(x=>x.def && x.def.id==='c_count')){
        L.push('・回数: 体当たりできる回数をHUDに出す。外した空振りも1回に数える。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。目標数に達した瞬間に成功演出を出す。'); }
      L.push('・難度: 目標数は置いた物の7割前後。全部落とさなくても成功できるようにする。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_care: {
    id:'pg_care', label:'いやす型',
    brief:'癒し型：飼い主のそばでくつろぎ、ストレスゲージを下げる',
    lever:'TUNING.calmRate = 1.0（0.8で易しく・1.2で難しく）／TUNING.decayRate = 0.5',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 癒し型（ケア）');
      L.push('・マップ: 横960px×高さ540pxの部屋。飼い主がソファ・机・窓際を決まった順に移動する。');
      L.push('・ゲージ: 飼い主のストレスを0〜100で表示する。そばにいる・膝に乗る・のどを鳴らすで下がる。');
      L.push('・かまいすぎ: 同じ場所に長くいると「かまいすぎ」でゲージが上がる。離れて待つ時間も作る。');
      L.push('・じゃま: 掃除機・水・大きな音が定期的に発生する。当たるとゲージが上がる。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 飼い主に近づいて癒す操作に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 離れた場所から1回だけ呼びかけて引き寄せる。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内にストレスを0にする。時間切れは「まだ癒し足りない」失敗にする。');
      }
      if(c.some(x=>x.def && x.def.id==='c_info')){
        L.push('・情報: 音ゲージを「起こしそう度」として使う。大きな音を出すとストレスが上がる。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。ストレス0で飼い主が眠り、成功。'); }
      L.push('・難度: 10回中2〜3回成功する減り方にする。何もしない時間も価値があるように、減衰を入れる。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_battle: {
    id:'pg_battle', label:'おいはらう型',
    brief:'撃退型：近づく敵を威嚇で押し戻し、部屋を守る',
    lever:'TUNING.enemySpeed = 1.0（0.8で易しく・1.2で難しく）／TUNING.waveInterval = 6',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 撃退型（バトル）');
      L.push('・マップ: 横960px×高さ540pxの部屋。左右の端から敵（犬・掃除機など）が決まった順番で来る。');
      L.push('・敵: 一直線に近づく。触れると1ライフ減り、無敵時間1.2秒。');
      L.push('・威嚇: 正面に立ってフクレると、敵を外向きに押し戻す。押し戻しは得点にしない。');
      L.push('・クールダウン: 威嚇の後は2秒使えない。連打では勝てない。');
      L.push('・ウェーブ: 6秒ごとに敵が1体増える。出現順は配列で固定し、乱数は使わない。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 敵を押し戻す主操作にする。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 敵を飛び越えて反対側へ回り込む。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間を生き延びる、または時間内に決めた数の敵を追い払う。');
      }
      if(c.some(x=>x.def && x.def.id==='c_count')){
        L.push('・回数: 威嚇できる回数をHUDに出す。外した威嚇も1回に数える。');
      }
      if(c.some(x=>x.def && x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・障害: '+obs.join('・')+'。敵とは別に、避ける物として配置する。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。最後の敵を押し戻したら成功。'); }
      L.push('・難度: 10回中2〜3回守れる強さ。敵の速度より、出現間隔で難度を作る。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_balance: {
    id:'pg_balance', label:'はこぶ型',
    brief:'運搬バランス型：落とさないように運び、揺れを抑える',
    lever:'TUNING.swayRate = 1.0（0.8で易しく・1.2で難しく）／TUNING.windStrength = 0.5',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 運搬バランス型（キャリー）');
      L.push('・マップ: 横960px×高さ540px。細い塀・梁・棚の上を、口にくわえた物を運ぶ。');
      L.push('・揺れ: 画面下の「ゆれゲージ」が、走る・跳ぶ・風で上がる。100%で物を落として失敗。');
      L.push('・立て直し: 立ち止まるとゲージが下がる。急ぐほど危ない。');
      L.push('・風: 一定周期で左右に風が吹く。風の向きはHUDの矢印で予告する。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 物を運びながら進む操作に使う。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 落下しそうな物を1回だけくわえ直す。'); }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内に運び切る。急ぐと揺れが増えるので、時間と安全の綱引きになる。');
      }
      if(c.some(x=>x.def && x.def.id==='c_space')){
        L.push('・空間: 通れる幅を狭くし、落ちる場所と安全な場所を分ける。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。物をゴール地点まで運び、置いたら成功。'); }
      L.push('・難度: 10回中2〜3回運べる揺れ方。走り続けても成功できないように、減衰より増加を少し強くする。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

  ,pg_water: {
    id:'pg_water', label:'みずをよける型',
    brief:'水回避型：水たまり・雨・しぶきを避けて進む（上昇する水ではない）',
    lever:'TUNING.wetRate = 1.0（0.8で易しく・1.2で難しく）／TUNING.dryRate = 0.6',
    dur:45,
    detail:function(P){
      const c = (P && P.cons) || [];
      const L = [];
      L.push('▼ レベル構造: 水回避型（ウェットゲージ）');
      L.push('・マップ: 横960px×高さ540pxの家。床に水たまり、天井から雨、風呂場からしぶきが定期的に来る。');
      L.push('・水: 触れると「ぬれゲージ」が増える。100%で失敗。水から離れると少しずつ下がる。');
      L.push('・予告: 雨としぶきは落ちる1秒前に影を出す。水たまりは常に見える。');
      L.push('・避け方: 飛び越える・台の上に上がる・乾いた道を選ぶ。水を消す操作は入れない。');
      if(P && P.centerVerb){ L.push('・中心アクション「'+P.centerVerb+'」: 水を避けて進む主操作にする。'); }
      if(P && P.subVerb){ L.push('・サブ「'+P.subVerb+'」: 水たまりの上を1回だけ跳び越える。'); }
      if(c.some(x=>x.def && x.def.id==='c_phys')){
        const obs = (P.obstacles || []).slice(0,3);
        L.push('・障害: '+obs.join('・')+'。水そのものと、水を運んでくる物を分けて配置する。');
      }
      if(c.some(x=>x.def && x.def.id==='c_info')){
        L.push('・情報: ぬれゲージを常に表示する。ゲージが増えると足元が光り、危険が近いことを伝える。');
      }
      if(c.some(x=>x.def && x.def.id==='c_time')){
        L.push('・時間: 制限時間内に渡り切る。水に触れた回数は結果画面に出す。');
      }
      if(P && P.purpose){ L.push('・ゴール: '+P.purpose.goal+'。乾いたゴール地点に触れたら成功。'); }
      L.push('・難度: 10回中2〜3回渡れる水量。水たまりを全部塞がず、必ず乾いた道を1本残す。');
      L.push('・調整レバー: '+this.lever);
      return L.join('\n');
    }
  }

};

CT.patternOf = function(id){
  return (CT.PATTERNS && CT.PATTERNS[id]) ? CT.PATTERNS[id] : null;
};
