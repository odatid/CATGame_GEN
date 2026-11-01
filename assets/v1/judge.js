/* =========================================================
   CATGame_GEN — 判定層 v0.3.0
   EMS判定: あまい／むり／ちょうどよい（赤黄緑+理由1文、決定的）
   ゲーム性チェック: ユニークさ・ひねり・おかしさ・共感 の4軸（◎○△）
   ------------------------------------------------------------ */
window.CT = window.CT || {};
(function(){
'use strict';

/* ---------------- 相性表（行動10種 × 制約型5種 = 50セル） ---------------- */
const FIT = {
  a_climb: {
    c_time:  {fit:'◎', why:'登る速さがそのまま勝負になる。制限時間と最も相性がよい'},
    c_count: {fit:'○', why:'跳べる回数を絞ると、足場選びが慎重になる'},
    c_space: {fit:'◎', why:'動ける幅を狭めると、足場を選ぶ楽しさが増す'},
    c_phys:  {fit:'○', why:'障害は「避ける」より「当たると落ちる」のほうが効く'},
    c_info:  {fit:'△', why:'見えなくすると足場選びが理不尽になる。足場は見せる'}
  },
  a_box: {
    c_time:  {fit:'○', why:'導く操作は時間で締められる。ただし短すぎると試行が足りない'},
    c_count: {fit:'◎', why:'動かせる回数を絞ると、1手1手が重くなる'},
    c_space: {fit:'○', why:'範囲を狭めると迷いが減り簡単になる。範囲は広めが効く'},
    c_phys:  {fit:'◎', why:'水・掃除機など「近づけない物」があると誘導の腕が問われる'},
    c_info:  {fit:'◎', why:'箱の中から外が見えない、というルールと噛み合う'}
  },
  a_squeeze: {
    c_time:  {fit:'△', why:'通過系に時間制約は効くが、単独ではあまくなりがち'},
    c_count: {fit:'○', why:'「入れる回数」より「幅」が主役になる。補助の制約'},
    c_space: {fit:'◎', why:'幅◯pxのギャップはこの手段の本丸。数値がそのまま難度になる'},
    c_phys:  {fit:'○', why:'通りたい隙間に危険があると、選ぶ楽しさが生まれる'},
    c_info:  {fit:'○', why:'狭い所の中は暗い、という設定と自然に組める'}
  },
  a_ambush: {
    c_time:  {fit:'✕', why:'待つ手段に短い制限時間は矛盾する（待つ暇がない）'},
    c_count: {fit:'○', why:'飛び出しは◯回まで、が「待つ価値」を作る'},
    c_space: {fit:'△', why:'狭めると隠れ場所が減り、待てなくなる'},
    c_phys:  {fit:'○', why:'覗き込む獲物の動きのパターンが危険になる'},
    c_info:  {fit:'◎', why:'音と視界の情報量が少ないほど「待つ」が緊張する'}
  },
  a_pounce: {
    c_time:  {fit:'○', why:'掛かる時間で締められる。ただし単独では普通のアクションになる'},
    c_count: {fit:'△', why:'飛びつき回数を絞りすぎると、連続失敗が理不尽になる'},
    c_space: {fit:'○', why:'届く範囲の距離指定と相性がよい'},
    c_phys:  {fit:'◎', why:'掴まる対象と危険物が同居すると、選択が生まれる'},
    c_info:  {fit:'△', why:'見えないものは掴めない。情報制約は弱めに'}
  },
  a_threat: {
    c_time:  {fit:'△', why:'追い払いは時間と競争させにくい。守り型の手段'},
    c_count: {fit:'◎', why:'フクレられる回数が難度そのものになる。最も効く制約'},
    c_space: {fit:'△', why:'狭い所での威嚇は窮屈すぎて理不尽になりがち'},
    c_phys:  {fit:'○', why:'追い払いたい物の速さで調整する'},
    c_info:  {fit:'○', why:'相手が見えているうちに、という設定と組める'}
  },
  a_night: {
    c_time:  {fit:'○', why:'「夜のうちに（残り時間）」という演出と自然に噛む'},
    c_count: {fit:'○', why:'「明かりをつけられる回数」などの補助制約と組める'},
    c_space: {fit:'○', why:'暗がりの範囲指定が、この手段の調整つまみになる'},
    c_phys:  {fit:'△', why:'視界の障害のほうが効く。物理障害2種以上は重い'},
    c_info:  {fit:'◎', why:'この手段自体が情報制約の塊。最強の組み合わせ'}
  },
  a_sun: {
    c_time:  {fit:'○', why:'チャージ時間のやりくりが、そのまま時間制約と噛む'},
    c_count: {fit:'○', why:'「溜められる回数」が難度のつまみになる'},
    c_space: {fit:'○', why:'走る距離を伸ばす制約と相性がよい'},
    c_phys:  {fit:'○', why:'走る道の危険物が、チャージの価値を上げる'},
    c_info:  {fit:'△', why:'視界制約はチャージの見通しを殺す。弱めに'}
  },
  a_scratch: {
    c_time:  {fit:'△', why:'削る時間が必要なので、短い時間制約は理不尽になりがち'},
    c_count: {fit:'○', why:'削れる回数◯回、が資源管理になる'},
    c_space: {fit:'○', why:'削る場所を選ぶ楽しさが出る'},
    c_phys:  {fit:'◎', why:'削る対象が危険物と同じ空間にあると、選択が生まれる'},
    c_info:  {fit:'△', why:'何が削れるか見えないと理不尽になる。情報制約は弱め'}
  },
  a_knock: {
    c_time:  {fit:'◎', why:'◯秒でいくつ落とせるか、のカウント勝負に直結する'},
    c_count: {fit:'◎', why:'落とせる回数・手を付けられる回数が、そのまま難度になる'},
    c_space: {fit:'○', why:'机の上の動ける幅の指定と噛み合う'},
    c_phys:  {fit:'△', why:'危険物を増やすと避けゲーになる。2種までにする'},
    c_info:  {fit:'○', why:'落ちた物の位置を覚える、という記憶ルールと組める'}
  }
};

function band(cId, n){
  if(!isFinite(n)) return 'bad';
  if(cId==='c_time'){  if(n<=0) return 'bad';  if(n<10) return 'hard'; if(n<=49) return 'just'; return 'sweet'; }
  if(cId==='c_count'){ if(n<1)  return 'bad';  if(n<2)  return 'hard'; if(n<=9)  return 'just'; return 'sweet'; }
  if(cId==='c_space'){ if(n<=0) return 'bad';  if(n<60) return 'hard'; if(n<=479)return 'just'; return 'sweet'; }
  if(cId==='c_phys'){  if(n<1)  return 'bad';  if(n>=5) return 'hard'; if(n===1) return 'sweet'; return 'just'; }
  if(cId==='c_info'){  if(n<1||n>100) return 'bad'; if(n<25) return 'hard'; if(n<=94) return 'just'; return 'sweet'; }
  return 'bad';
}

function findAction(id){
  for(var i=0;i<CT.ACTIONS.length;i++){ if(CT.ACTIONS[i].id===id) return CT.ACTIONS[i]; }
  return null;
}
function findCons(id){
  for(var i=0;i<CT.CONSTRAINTS.length;i++){ if(CT.CONSTRAINTS[i].id===id) return CT.CONSTRAINTS[i]; }
  return null;
}

/* ---------------- EMS判定本体 ---------------- */
function judge(state){
  var act = findAction(state && state.action);
  if(!act){
    return {color:'empty', verdict:'まだ決まっていない',
            reason:'「03 てだて」= このゲームで中心となるアクションが、まだ選ばれていません',
            fixes:['03 てだて の画面で選ぶ（「02 ねらい」の次の画面です）']};
  }
  var raw = (state && state.cons) || [];
  var cons = [], missing = [];
  for(var i=0;i<raw.length;i++){
    var c = findCons(raw[i].id);
    if(!c) continue;
    var num = parseFloat(raw[i].num);
    if(isFinite(num)){ cons.push({id:c.id, num:num, cons:c}); }
    else{ missing.push(c); }
  }

  /* 1) 相性✕があれば赤 */
  for(var j=0;j<cons.length;j++){
    var cell = FIT[act.id][cons[j].id];
    if(cell && cell.fit==='✕'){
      return {color:'red', verdict:'むり', reason:cell.why,
              fixes:['04 しばりの「' + cons[j].cons.label + '」を、手段に合う型に変えるか外す']};
    }
  }
  /* 2) むり域の数値は赤 */
  for(var k=0;k<cons.length;k++){
    var b = band(cons[k].id, cons[k].num);
    if(b==='hard'){
      var c2 = findCons(cons[k].id);
      return {color:'red', verdict:'むり',
              reason:'「' + c2.tpl + '」の数値（' + cons[k].num + c2.unit + '）は手段（' + act.label + '）に対して理不尽な強さです',
              fixes:['04 しばりの「' + c2.label + '」の数値を、ちょうどよい域（' + c2.just + '）へ上げる']};
    }
  }
  /* 3) 数値のない制約は未記入（緑にしない） */
  if(missing.length>0){
    return {color:'empty', verdict:'まだ決まっていない',
            reason:'「04 しばり」で選んだ制約に数値が入っていません（' + missing.length + '件）。数値が入ると点検できます',
            fixes:['04 しばり の画面で「' + missing[0].label + '」に数値を入れる']};
  }
  /* 4) 制約ゼロはあまい */
  if(cons.length===0){
    return {color:'yellow', verdict:'あまい',
            reason:'制約が0個なので、手段だけで目的に届いてしまいます',
            fixes:['04 しばりでおすすめ案を選ぶか、制約を2つ以上決める']};
  }
  /* 5) 全部あまい域なら黄 */
  var allSweet = true, hasJust = false;
  for(var m=0;m<cons.length;m++){
    var b2 = band(cons[m].id, cons[m].num);
    if(b2!=='sweet') allSweet = false;
    if(b2==='just') hasJust = true;
  }
  if(allSweet){
    var c3 = findCons(cons[0].id);
    return {color:'yellow', verdict:'あまい',
            reason:'制約がすべてあまい域（例: ' + cons[0].num + c3.unit + '）なので、すぐ飽きる可能性があります',
            fixes:['04 しばりの数値を1つ、ちょうどよい域へ下げる']};
  }
  /* 6) ちょうどよい域が2つ以上で緑 */
  var justCount = 0;
  for(var n=0;n<cons.length;n++){ if(band(cons[n].id, cons[n].num)==='just') justCount++; }
  if(justCount>=2 && hasJust){
    var first = null;
    for(var p=0;p<cons.length;p++){ if(band(cons[p].id, cons[p].num)==='just'){ first = cons[p]; break; } }
    var cell2 = FIT[act.id][first.id];
    return {color:'green', verdict:'ちょうどよい',
            reason:'「' + (first.cons.id==='c_phys' ? '障害（' + first.num + '種）を避けながら' : first.cons.id==='c_info' ? '音ゲージ' + first.num + '%を維持しながら' : first.cons.tpl.replace('◯◯', String(first.num))) + '」が効いていて、' + (cell2 ? cell2.why : '手段に合った制約です'),
            fixes:[]};
  }
  /* 7) 境目は黄 */
  var c4 = findCons(cons[0].id);
  return {color:'yellow', verdict:'あまい',
          reason:'制約が1つだけ決まっていて、残りが弱いです（あまい寄りの境目）',
          fixes:['04 しばりをもう1つ追加し、数値を入れる']};
}

/* ---------------- ゲーム性チェック（ユニークさ/ひねり/おかしさ/共感） ----------------
   素点 = 行動のrates + 目的のrates + ボーナス（0〜4）。◎=4〜3 / ○=2〜1 / △=0〜1未満。
   決定的（同じ入力なら同じ評価）。
   ------------------------------------------------------------ */
function gameCheck(state){
  var act = findAction(state && state.action);
  var pur = CT.PURPOSES.find(function(p){ return p.id === (state && state.purpose); });
  if(state && state.purposeOther && state.purposeOther.trim()){ pur = pur || {label:'その他', rates:{uni:1,twi:0,fun:1,emp:1}}; }
  var a = (act && act.rates) || {uni:0,twi:0,fun:0,emp:0};
  var p = (pur && pur.rates) || {uni:0,twi:0,fun:0,emp:0};
  var cons = (state && state.cons) || [];
  var hasPhysInfo = cons.some(function(c){ return c.id==='c_phys' || c.id==='c_info'; });
  var t = (state && state.profile && state.profile.target) || [];
  var empBonus = (t.indexOf('tg_heal')>=0 || t.indexOf('tg_cute')>=0 || t.indexOf('tg_nocat')>=0) ? 1 : 0;
  var sums = {
    uni: Math.min(4, a.uni + p.uni + (cons.length>=2 ? 1 : 0)),
    twi: Math.min(4, a.twi + p.twi + (hasPhysInfo ? 1 : 0)),
    fun: Math.min(4, a.fun + p.fun + ((act && act.rates.fun>=2) ? 1 : 0)),
    emp: Math.min(4, a.emp + p.emp + empBonus)
  };
  return CT.CHECK_AXES.map(function(ax){
    var v = sums[ax];
    var idx = (v>=3) ? 2 : (v>=1 ? 1 : 0);
    var mark = (idx===2) ? '◎' : (idx===1 ? '○' : '△');
    return {axis:ax, name:CT.CHECK_NAMES[ax], mark:mark, v:v,
            comment:CT.CHECK_COMMENTS[ax][idx]};
  });
}

CT.judge = judge;
CT.gameCheck = gameCheck;
CT.FIT = FIT;
CT.band = band;

/* ---------------- 人操作の相性表（8種 × 5型 = 40セル） ----------------
   人が操作キャラのときは、ネコが「共演者・相手役」になる。
   ------------------------------------------------------------ */
const FIT_HUMAN = {
  h_find: {
    c_time:  {fit:'◎', why:'残り時間で探せる場所が減る。探索と最も相性がよい'},
    c_count: {fit:'○', why:'呼べる回数を絞ると、探す場所の選びが慎重になる'},
    c_space: {fit:'◎', why:'探せる部屋を狭めると、隠れ場所の情報が値打つ'},
    c_phys:  {fit:'○', why:'物が動いていると探索が難しくなる。避けゲーに寄せない'},
    c_info:  {fit:'◎', why:'見える範囲が狭いほど「探す」が緊張する。最強の組み合わせ'}
  },
  h_call: {
    c_time:  {fit:'○', why:'呼んで待つ時間のやりくりになる'},
    c_count: {fit:'◎', why:'呼べる回数がそのまま難度になる。最も効く制約'},
    c_space: {fit:'○', why:'声の届く範囲の指定と噛み合う'},
    c_phys:  {fit:'△', why:'物理障害より「音」の制約が主役になる'},
    c_info:  {fit:'○', why:'音ゲージと呼ぶ音が同居して緊張を作る'}
  },
  h_lure: {
    c_time:  {fit:'○', why:'誘って到達するまでの時間で締められる'},
    c_count: {fit:'○', why:'使えるおやつの数が難度のつまみになる'},
    c_space: {fit:'○', why:'道を作る幅の指定と自然に噛む'},
    c_phys:  {fit:'◎', why:'誘いの経路に危険があると、選択が生まれる'},
    c_info:  {fit:'△', why:'誘い先が見えないと理不尽になる。弱めに'}
  },
  h_catch: {
    c_time:  {fit:'○', why:'体力勝負を時間で締められる'},
    c_count: {fit:'◎', why:'抱けるチャンスが◯回、がそのまま難度になる'},
    c_space: {fit:'△', why:'狭すぎると逃げ場がなくなり簡単になる'},
    c_phys:  {fit:'○', why:'捕まえたい瞬間に危険があると選択が生まれる'},
    c_info:  {fit:'○', why:'動かず待つ時間と音ゲージが噛み合う'}
  },
  h_care: {
    c_time:  {fit:'△', why:'お世話は時間より「ネコの機嫌」で決まる。補助の制約'},
    c_count: {fit:'○', why:'やれることが◯回まで、が資源管理になる'},
    c_space: {fit:'△', why:'狭くすると逃げ場がなくなり簡単になる'},
    c_phys:  {fit:'○', why:'暴れる・逃げる動きのパターンが危険になる'},
    c_info:  {fit:'◎', why:'音ゲージ維持はお世話ゲームの本丸。最強の組み合わせ'}
  },
  h_shoot: {
    c_time:  {fit:'◎', why:'◯秒でベストショット、の勝負に直結する'},
    c_count: {fit:'○', why:'シャッターは◯回まで、が資源管理になる'},
    c_space: {fit:'○', why:'狙える範囲の指定と噛み合う'},
    c_phys:  {fit:'△', why:'邪魔が多すぎると構図が作れない。2種まで'},
    c_info:  {fit:'○', why:'音を立てない撮影、というルールと噛む'}
  },
  h_guard: {
    c_time:  {fit:'○', why:'守る時間の長さが、そのまま勝負になる'},
    c_count: {fit:'○', why:'手の届く回数で管理の難しさを作る'},
    c_space: {fit:'◎', why:'守る範囲の指定が、この手段の本丸'},
    c_phys:  {fit:'○', why:'危険物の動きのパターンで難度を調整する'},
    c_info:  {fit:'△', why:'見えない場所を守らせるのは理不尽になりがち'}
  },
  h_endure: {
    c_time:  {fit:'◎', why:'あと◯秒耐える、の勝負そのものになる'},
    c_count: {fit:'○', why:'動いていい回数を絞ると緊張が生まれる'},
    c_space: {fit:'○', why:'動ける範囲が狭いほど「耐える」が難しくなる'},
    c_phys:  {fit:'○', why:'邪魔の種類が増えるほど耐える価値が上がる'},
    c_info:  {fit:'◎', why:'音ゲージ維持は「我慢」の操作の本丸'}
  }
};
CT.FIT_HUMAN = FIT_HUMAN;
Object.keys(FIT_HUMAN).forEach(function(k){ FIT[k] = FIT_HUMAN[k]; });

/* findAction は猫・人の両リストを見る */
var _findAction = findAction;
findAction = function(id){
  var r = _findAction(id);
  if(r) return r;
  for(var i=0;i<CT.HUMAN_ACTIONS.length;i++){ if(CT.HUMAN_ACTIONS[i].id===id) return CT.HUMAN_ACTIONS[i]; }
  return null;
};
CT.findAction = findAction;

})();
