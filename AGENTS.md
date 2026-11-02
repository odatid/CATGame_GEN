# AGENTS.md — CATGame_GEN での作業ルール(コーディングエージェントへ)

このリポジトリは、大学のオープンキャンパス演習ツール「CATGame_GEN」です。
EMS(Ends and Means Structure／手段目的構造)を高校生が自分の手で埋め、
ネコテーマのゲーム案を1本にまとめる。ツールは案を作って配らない。生徒が書いた
目的・手段・制約を点検して返す。

## 最初に読むこと(この順で)

1. `docs/CATGAME_GEN_引継ぎプロンプト.md` — 設計思想の原本(鉄則はここ)
2. `docs/STEP2_診断表.md` — 行動・制約・候補・判定の設計経緯
3. `README.md` — 確定事項の要約

## 設計思想(絶対に守る)

1. **生成AIのAPIをツール内で使わない。** プロンプトは「DBの文章＋ID参照」から決定的に組み立てる
2. **乱数を使わない。** Math.random を書かない。同じ入力なら必ず同じ出力
3. **数値でない制約は未記入として扱い、緑にしない**
4. **出力には「HTML1ファイル拘束」を必ず入れる**(1行目DOCTYPE・最終行</html>・file://で動く・外部参照0)
5. **1回の変更は1テーマだけ。データ → 判定 → 画面 → 出力 の順。画面から作らない**
6. **目視で「できた」と言わない。** tools/ の検証ページと node で実測して数値を報告する
7. **版名は HTML に直接書く**(JSで書き換えない)。変更時は title・verチップ・CT.VERSION の**3点一致**を必ず確認
8. **push は先生がやる。エージェントは push しない**(ローカルコミットまで)

## 現在の状態(2026-11-02 時点)

- 版: **本番制限版 v1.1.0**(assets/v1/: data.js/judge.js/engine_code.js/catart.js/patterns.js/prompts.js/app.js/style.css)
- 画面: 9ステップ+常設役割バー。ネコ操作/人操作の2モード(目的40+17種・行動11+8種)
- 判定: EMS3色(あまい/むり/ちょうどよい)+ゲーム性チェック4軸(ユニークさ/ひねり/おかしさ/共感)+EMS推測確認(「あってる?」→[合っている]/[違う→未決画面へ])
- 型ライブラリ(patterns.js): 猫の目的グループ15型(pg_*)＋Unityキット5型(pt_*)を実装。本番制限版は CT.LIMITED でUnityキット5型だけをジャンルカードに出す。検証は tools/pattern_check.html
- しばりおすすめ: 32案(8ページ巡回)・文言は選んだ苦手から自動生成
- 本番リハーサル: tools/rehearsal_check.html で制限版5仕かけを目的→出力まで通し、5/5 PASS。Unity依頼は型ごとのシーン/キットを明記(pt_escape は SC_Base_Vertical)
- 生成テスト2往復目: 水位は3段グラデーション＋水面線＋sin波、被弾は赤フラッシュ＋無敵点滅。tools/generation_check.html 20/20、tools/engine_check.html 12/12
- 本番前チェック: tools/final_check.html 21/21(5仕かけ通し・出力6種・途中保存と再読込・戻る・グループ・制限外型の無視・リセット・5画面サイズ)。tools/audio_check.html 9/9(初期化・SE/BGM要求・例外なし。聴感は未検証)
- 検証: tools/(judge_check.html・cat_draw_check.html・pattern_check.html・rehearsal_check.html・generation_check.html・engine_check.html・final_check.html・audio_check.html)。変更後は必ず回す

## 次のタスク候補(2026-11-02 更新)

- 完了: 型ライブラリの拡張(猫の目的グループ15型＋Unityキット5型、ジャンルカード16枚、tools/pattern_check.html)
- 完了: `limited` ブランチの本番制限版(CT.LIMITED でUnityキット5型に制限。コードは main と共通)
- 完了: 本番リハーサル(制限版の5仕かけで目的→出力まで通し、tools/rehearsal_check.html で5/5 PASS)
- 完了: 生成テスト2往復目(水位の3段グラデーション＋水面線＋sin波、被弾の赤フラッシュ＋無敵点滅。tools/generation_check.html 20/20、tools/engine_check.html 12/12)
- 完了: 本番前チェック(tools/final_check.html 21/21、tools/audio_check.html 9/9。画面は1920×1080/1280×720/1024×768/800×600/390×844)
1. 先生のpush後、公開URLで同じチェックを再実行
2. 教室PC・プロジェクター・音声の実機確認(この環境では聴感・投影・端末音量が未検証)

## ブランチ

- `main` — 進化版(開発はここ)
- `limited` — 本番用に作れるゲームを制限した版

## やり取りのルール

- 日本語で報告する。専門用語は生徒にも分かる言葉に置き換える
- 推測で「できました」と言わない。実行して確認した結果だけを報告する
- 件数は必ず数えて報告する
- 更新したファイルは名前を全部挙げる(「丸ごと」と言わない)
