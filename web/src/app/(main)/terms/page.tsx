import type { Metadata } from "next";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
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
        <LegalParagraph>
          みらい議会（以下「本サービス」といいます。）をご利用いただく場合、以下の規約に同意いただいたものとみなします。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>第1条（禁止事項）</LegalSectionTitle>
          <LegalParagraph>
            本サービスのユーザー（以下「ユーザー」といいます。）は以下の行為を行ってはなりません。
          </LegalParagraph>
          <LegalList
            items={[
              "法令または公序良俗に反する行為",
              "本サービスの運営を妨げる行為",
              "本サービスの情報を改ざん・加工し、誤解を招く形で利用する行為",
              "チームみらい（以下「当団体」といいます。）または第三者の権利・利益を侵害する行為",
              "サーバへの過剰な負荷、システムへの妨害・改ざん・侵入行為",
              "自動化ツール、ボット等による操作",
              "本サービスの提供するAIチャット機能に個人情報を入力する行為",
              "その他、当団体が不適切と判断する一切の行為",
            ]}
          />

          <div className="space-y-3">
            <LegalParagraph>
              特に、ユーザーは、本サービスの提供するAIチャット機能を不正に利用してはならず、以下の行為を行ってはなりません。
            </LegalParagraph>
            <LegalList
              items={[
                "システムプロンプトその他の内部設定を改変、削除、またはこれを推測しようとする行為",
                "AIに対して「みらい議会」や国会提出法案等の関連テーマ以外の応答を生成させようとする行為",
                "プロンプトインジェクション等、AIモデルを意図的に誤動作させる行為",
                "当団体が設けた利用制限、レートリミット、安全制御、規制回避ポリシー、フィルタリング機能、ログ取得・監視機構を不正に回避または無効化しようとする行為",
                "出力させた応答を、あたかもユーザー自身が執筆したかのように偽装して表明する行為",
                "出力内容を利用して、法令違反、詐欺、誹謗中傷、わいせつ、差別、暴力助長等の有害行為を行うこと",
              ]}
            />
          </div>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第2条（知的財産権）</LegalSectionTitle>
          <LegalParagraph>
            本サービスの提供のために用いられるプログラム及びその他データ等のコンテンツ、及び本サービスに掲載されるテキスト、画像、データ等の権利は、当団体または当団体が利用許諾を受けた正当な権利者に帰属します。ユーザーは私的利用の範囲を超えて使用してはなりません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第3条（情報に係る不保証）</LegalSectionTitle>
          <LegalParagraph>
            当団体は、本サービスによって提供される情報について、正確性、最新性、完全性、有用性、目的適合性、安全性、合法性、真実性等いかなる事項についても保証しません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第4条（サービスの変更・停止）</LegalSectionTitle>
          <LegalParagraph>
            当団体は、ユーザーへの事前通知なく本サービスの内容を変更・停止できるものとし、それにより生じた損害について一切の責任を負いません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第5条（規約の変更）</LegalSectionTitle>
          <LegalParagraph>
            当団体は必要に応じて本規約を変更することができ、変更後にユーザーが本サービスを利用した場合、当該変更に同意したものとみなします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第6条（準拠法・管轄）</LegalSectionTitle>
          <LegalParagraph>
            本規約は日本法に準拠し、本サービスに関連して生じる一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
