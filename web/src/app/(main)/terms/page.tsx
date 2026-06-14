import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";

export const metadata: Metadata = {
  title: "利用規約 | みらい議会＠草津市",
  description: "みらい議会＠草津市の利用規約",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="利用規約"
      description="みらい議会＠草津市をご利用いただく際の基本的なルールを定めています。"
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-10">
        <LegalParagraph className="text-right">
          制定日・最終更新日：2026年6月14日
        </LegalParagraph>

        <LegalParagraph>
          この利用規約（以下「本規約」といいます。）は、みらいと維新の風（以下「運営者」といいます。）が運営する「みらい議会＠草津市」（以下「本サイト」といいます。）の利用条件を定めるものです。本サイトを利用した場合、本規約に同意したものとみなします。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>第1条（本サイトの目的）</LegalSectionTitle>
          <LegalParagraph>
            本サイトは、草津市議会に提出された議案や審議状況などを、市民にわかりやすく伝えることを目的とする情報提供サイトです。
          </LegalParagraph>
          <LegalParagraph>
            本サイトは、草津市または草津市議会が運営する公式サイトではありません。また、チームみらいが公式に運営するサイトではなく、公開されているオープンソースを活用して独自に運営しています。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第2条（掲載情報について）</LegalSectionTitle>
          <LegalList
            items={[
              "本サイトでは、草津市および草津市議会が公開する議案書、議案概要、予算資料、採決結果その他の資料を参照し、議案情報や独自の要約・解説を掲載します。",
              "わかりやすい説明や要約は、原資料の内容を簡潔に整理したものであり、原文のすべてを記載するものではありません。",
              "正式な内容、最新の審議状況および採決結果は、草津市または草津市議会が公開する公式資料で確認してください。",
              "掲載内容に誤りが判明した場合、運営者は確認のうえ、必要に応じて修正します。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第3条（禁止事項）</LegalSectionTitle>
          <LegalParagraph>
            利用者は、本サイトの利用にあたり、次の行為を行ってはなりません。
          </LegalParagraph>
          <LegalList
            items={[
              "法令または公序良俗に反する行為",
              "運営者または第三者の著作権、商標権、プライバシー、名誉その他の権利または利益を侵害する行為",
              "本サイトの掲載情報を改ざんし、運営者、草津市、草津市議会その他の団体による公式情報であるかのように表示する行為",
              "本サイトまたは第三者になりすます行為",
              "本サイトのサーバーやシステムに過度な負荷をかける行為、不正アクセス、セキュリティ機能の回避、解析その他運営を妨害する行為",
              "有害なプログラムを送信または配布する行為",
              "その他、運営者が本サイトの運営上不適切と合理的に判断する行為",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第4条（知的財産権・引用）</LegalSectionTitle>
          <LegalParagraph>
            本サイトに掲載する文章、要約、画像、デザインその他のコンテンツに関する権利は、運営者または正当な権利者に帰属します。草津市、草津市議会その他の機関が作成した資料の権利は、それぞれの権利者に帰属します。
          </LegalParagraph>
          <LegalParagraph>
            著作権法で認められる引用や、出典を明示した本サイトへのリンクを妨げるものではありません。本サイトで使用しているオープンソース・ソフトウェアについては、それぞれに付されたライセンス条件が優先して適用されます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第5条（免責事項）</LegalSectionTitle>
          <LegalList
            items={[
              "運営者は、掲載情報の正確性、完全性、最新性、有用性を高めるよう努めますが、これらを保証するものではありません。",
              "本サイトの情報は、法的助言、行政上の公式見解、投票または政治的判断の強制を目的とするものではありません。",
              "利用者は、本サイトの情報のみを根拠に重要な判断を行わず、必要に応じて公式資料や関係機関に確認するものとします。",
              "本サイトの利用または利用できなかったことにより生じた損害について、運営者は、運営者の故意または重大な過失がある場合を除き、法令上認められる範囲で責任を負いません。",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第6条（外部サイトへのリンク）</LegalSectionTitle>
          <LegalParagraph>
            本サイトには、草津市、草津市議会その他の外部サイトへのリンクが含まれる場合があります。外部サイトの内容、提供状況および個人情報の取り扱いについては、各サイトの運営者が責任を負うものとします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            第7条（本サイトの変更・中断・終了）
          </LegalSectionTitle>
          <LegalParagraph>
            運営者は、保守、障害、災害その他の事情により、事前の通知なく本サイトの内容を変更し、または提供を一時中断・終了することがあります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第8条（本規約の変更）</LegalSectionTitle>
          <LegalParagraph>
            運営者は、必要に応じて本規約を変更することがあります。変更後の規約は、本サイトに掲載した時点から効力を生じます。重要な変更がある場合は、本サイト上でわかりやすくお知らせします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第9条（準拠法・管轄）</LegalSectionTitle>
          <LegalParagraph>
            本規約は日本法に準拠します。本サイトに関して紛争が生じた場合は、大津地方裁判所を第一審の専属的合意管轄裁判所とします。
          </LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
