# ジャンル(型)×Unityキット対応表 — クラス版の「やんわり誘導」設計

依拠: 和洋九段×TIDミニゲームジャム Unity準備依頼書(講師のテンプレプロジェクト)
方針: 生徒のアイデア出しが **テンプレで実現できる仕かけ** に収束するよう、
ツールのジャンルカードを「この中から選んでね」の形で提示する(押さなくても自由記述も可)。

## クラス版のジャンルカード(5枚・押すとEMS入り口へ飛ぶ)

| カード | でるゲームの型 | 使うUnityギミック(正式名) | シーン | GameSettings調整レバー |
|---|---|---|---|---|
| **うごく床で進む** | 登塔・渡る系 | Moving Platform / Elevator Platform / Falling Platform / Spring Platform / Goal | SC_Base_Side | Move Speed / Enemy Speed |
| **あつめて届ける** | 回収系 | Collectible / Goal / Timer / Required Item Count | SC_Base_Top | Required Item Count / Game Time |
| **みつからずにやる** | 隠密系 | Hide Object / Patrol Enemy / Goal(音ゲージ) | SC_Base_Top | Enemy Speed / Game Time |
| **しかけを解く** | しかけ解き系 | Switch / Switch Gate / Push Box / Pressure Switch / Goal | SC_Base_Top | Game Time / Move Speed |
| **だっしゅつする** | 逃げ切り系 | Hazard Area / Timer / Moving Platform / Goal | SC_Base_Vertical | Game Time / Enemy Speed |

生成プロンプトの【システム詳細】には「この日に使う仕かけ(Unityキット)」と「シーン」が
必ず明記され、後日のUnity移植(優先度Aギミック)と齟齬が出ない。

## 対応の作り方(EMSとの接続)

| EMS | ツール側の動き |
|---|---|
| 目的(E) | カードごとに絞られた候補を提示(例: うごく床→「高いタワーを登って頂上に立つ」) |
| 手段(M) | ネコの行動11種から選ばせる(カメラ・画面の変更なし) |
| 制約(S) | **GameSettings にそのまま対応**(Game Time / Required Item Count / Move Speed / Enemy Speed / 音ゲージ) |
| 点検 | EMS3色+ゲーム性チェック4軸(既存どおり) |

## 生徒にはこう見える(ファシリテーションの言葉)

1. ねらい画面の冒頭に「**こんなジャンルも考えられます**」と出る(強制ではない)
2. カードを押すと「この日に使える仕かけ」がEMSの形で決まり、てだて(手段)へ進む
3. 手段・制約は自由に選べるが、**全部テンプレのギミックで実現できるものだけ**が候補に残る
4. 出力の「Unity依頼」プロトコルは、そのまま講師テンプレの **GameSettings** に流れ込む

## 導線の流れ(授業本番)

1. EMS講義(軸)
2. CATGame_GEN_class を開く → 役割4名の名前入力
3. ジャンルカード5枚から選ぶ(**この中から**でやんわり収束)
4. EMSを埋める(目的→手段→制約・数値必須)
5. 点検(ゲーム性チェック+EMS3色)
6. Webプロト出力 → Codexに貼って動く形に
7. (後日) Unity依頼プロトコル → 講師テンプレで移植
