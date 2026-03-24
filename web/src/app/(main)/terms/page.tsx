import type { Metadata } from "next";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
  LegalSubSectionTitle,
} from "@/components/layouts/legal-page-layout";
import { Container } from "@/components/layouts/container";

export const metadata: Metadata = {
  title: "利用規約 | みらい議会",
  description: "みらい議会の利用規約",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="利用規約"
      description="みらい議会をご利用いただくにあたっての基本的なルールを定めています。"
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-10">
        <LegalParagraph className="text-right">
          最終更新日：2026年3月24日
        </LegalParagraph>

        <LegalParagraph>
          みらい議会（以下「本サービス」といいます。）をご利用いただく場合、以下の規約に同意いただいたものとみなします。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>第1条（禁止事項）</LegalSectionTitle>
          <LegalParagraph>
            ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
          </LegalParagraph>

          <div className="space-y-3">
            <LegalSubSectionTitle>不適切な投稿・入力行為</LegalSubSectionTitle>
            <LegalParagraph>
              以下の内容を含む投稿、AIへの入力、または対話を行うことを禁止します。
            </LegalParagraph>
            <LegalList
              items={[
                "個人情報の掲載：氏名、住所、電話番号、メールアドレス、SNS ID、口座番号、所属組織等、本人・他人を問わず特定の個人を識別できる情報の入力（当組織が別途入力を依頼した場合を除きます。）。",
                "法令違反：犯罪予告、薬物・武器の製造情報の流布、公職選挙法違反、その他法令に抵触する、または助長する行為。",
                "権利侵害：第三者の著作権、肖像権、プライバシー権、名誉、信用を毀損・侵害する行為。",
                "危害の予告：自殺・自傷行為の示唆、他人への攻撃的な脅迫、犯罪の予告。",
                "公序良俗違反：わいせつ、暴力的、猟奇的な表現、差別的発言、動物虐待に関連する不快な内容、ヘイトスピーチ、および一般人が不快と感じる内容。",
                "誹謗中傷・過度な批判：特定の個人や団体に対する人格否定、侮辱、嫌がらせ。",
                "不謹慎・配慮欠如：事件事故の被害者や遺族の感情を逆なでするような投稿。",
                "関連性のない内容：本サービスの趣旨や内容と全く無関係な投稿、私的な交流。",
                "虚偽情報の拡散：明らかな偽情報、誤情報により社会的な混乱や健康被害を招くおそれのある行為。",
                "宣伝・営業活動：商業目的の広告、布教活動、特定のサイトへの誘導、またはこれらに準ずる行為。",
                "その他：当組織が社会通念上不適切と判断する一切の投稿。",
              ]}
            />
          </div>

          <div className="space-y-3">
            <LegalSubSectionTitle>
              システムの不正利用および運営妨害
            </LegalSubSectionTitle>
            <LegalList
              items={[
                "本サービスの運営を妨げる行為、または同一内容を執拗に繰り返すなどの荒らし行為。",
                "本サービスの情報を改ざん・加工し、誤解を招く形で利用する行為。",
                "サーバへの過剰な負荷、システムへの妨害・侵入・解析（リバースエンジニアリング等）行為。",
                "自動化ツール、ボット等による不正操作。",
                "AIモデルの悪用：システムプロンプト等の内部設定の推測、プロンプトインジェクション等による意図的な誤動作の誘発。",
                "目的外利用：「みらい議会」の趣旨（国会提出法案等の関連テーマ）を著しく逸脱した応答を生成させる行為。",
                "なりすまし：他の人物や組織になりすまして本サービスを利用する行為。",
              ]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第2条（違反行為への対応）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、ユーザーが前条の禁止事項に該当すると判断した場合、事前に通知することなく以下の措置を講じることができるものとします。
          </LegalParagraph>
          <LegalList
            items={[
              "当該対話ログ、投稿、または回答内容の削除",
              "本サービスの利用停止、制限、またはアカウントの凍結",
              "その他、当組織が必要と判断する適切な措置",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            第3条（AIインタビューの回答およびログの取り扱い）
          </LegalSectionTitle>
          <LegalList
            items={[
              {
                id: "publish-consent",
                content: (
                  <>
                    <span className="font-semibold text-slate-800">
                      公開と同意：
                    </span>
                    AIインタビューを通じて取得した回答ログおよびサマリーは、ユーザー本人が公開に同意した場合、当組織の運営するサービス上で公開されることがあります。
                  </>
                ),
              },
              {
                id: "internal-analysis",
                content: (
                  <>
                    <span className="font-semibold text-slate-800">
                      内部分析利用：
                    </span>
                    本人が公開に同意しなかったデータについても、当組織内においてサービス向上や政策検討の目的で共有・活用されるものとし、ユーザーはこれに同意するものとします。
                  </>
                ),
              },
              {
                id: "rights-attribution",
                content: (
                  <>
                    <span className="font-semibold text-slate-800">
                      権利の帰属：
                    </span>
                    本サービスを通じて生成された応答や対話ログに関する権利（著作権法第27条および第28条の権利を含みます。）は、当組織に帰属するか、または無償で利用（複製、加工、公表等）することを許諾したものとみなします。なお、公表については、当組織は、第1項のとおりユーザー本人が公表に同意した場合のみ実施するものとします。
                  </>
                ),
              },
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第4条（知的財産権）</LegalSectionTitle>
          <LegalParagraph>
            本サービスの提供に用いられるプログラム、コンテンツ、テキスト、画像等に関する一切の権利は、当組織または正当な権利者に帰属します。ユーザーは私的利用の範囲を超えてこれらを使用してはなりません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第5条（情報に係る不保証）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、本サービス（AIによる回答を含む）が提供する情報の正確性、完全性、最新性、有用性、真実性等について、いかなる保証も行いません。
          </LegalParagraph>
          <LegalParagraph>
            AIによる応答は、その性質上、誤った情報を生成する可能性があることを理解した上で利用するものとします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第6条（サービスの変更・停止）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、ユーザーへの事前通知なく本サービスの内容を変更・停止できるものとし、それにより生じた損害について一切の責任を負いません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第7条（規約の変更）</LegalSectionTitle>
          <LegalParagraph>
            当組織は必要に応じて本規約を変更することができ、変更後にユーザーが本サービスを利用した場合、当該変更に同意したものとみなします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第8条（準拠法・管轄）</LegalSectionTitle>
          <LegalParagraph>
            本規約は日本法に準拠し、本サービスに関連して生じる一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
