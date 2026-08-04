import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";

export const metadata: Metadata = {
  title: "みらい議会AIインタビューデータ利用規約 | みらい議会",
  description:
    "みらい議会のAIインタビューデータをオープンデータとして利用するにあたっての条件を定めています。",
};

const CC_BY_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/deed.ja";

export default function InterviewDataTermsPage() {
  return (
    <LegalPageLayout
      title="みらい議会AIインタビューデータ利用規約"
      enLabel="Data Terms"
      className="pt-24 md:pt-12"
    >
      <Container className="space-y-10">
        <LegalParagraph className="text-right">
          最終更新日：2026年7月29日
        </LegalParagraph>

        <LegalParagraph>
          本規約は、政治団体「チームみらい」（以下「当組織」といいます。）が運営する「みらい議会」のAIインタビュー機能（以下「みらい議会AIインタビュー機能」といいます。）を通じて取得した回答内容に基づき、当組織がオープンデータとして公開するデータセット（以下「本データ」といいます。）を、第三者（以下「利用者」といいます。）が利用するにあたっての条件を定めるものです。利用者は、本データをダウンロードまたは利用することにより、本規約に同意したものとみなされます。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>第1条（本データの内容）</LegalSectionTitle>
          <LegalParagraph>
            利用者が利用することのできる本データは、みらい議会AIインタビュー機能を通じて取得した回答ログおよびサマリーのうち、回答者本人が公開に同意したものから、氏名、住所、連絡先その他特定の個人を識別できる情報を除去したものに限られます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第2条（利用条件）</LegalSectionTitle>
          <LegalParagraph>
            本データは、クリエイティブ・コモンズ 表示 4.0 国際ライセンス（CC BY
            4.0）の下で提供されます（
            <a
              href={CC_BY_LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-accent underline"
            >
              {CC_BY_LICENSE_URL}
            </a>
            ）。利用者は、同ライセンスが定める条件（第4条に定める出典表示を含みます。）に従う限り、営利・非営利を問わず、本データを複製、頒布、公衆送信、改変し、または二次的著作物を作成することができます。
          </LegalParagraph>
          <LegalParagraph>
            CC BY
            4.0による許諾は、著作権および著作隣接権を対象とするものであり、回答者のプライバシーに関する権利その他ライセンスの対象外の権利について許諾するものではありません。本データの利用にあたっては、次条に定める事項を遵守しなければなりません。
          </LegalParagraph>
          <LegalParagraph>
            本データを継続的に利用する利用者は、同ライセンスの適用の対象から除外されたデータの利用を継続してはならないものとします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第3条（禁止行為）</LegalSectionTitle>
          <LegalParagraph>
            利用者は、本データの利用にあたり、以下の各号の行為を行ってはなりません。以下の第2号から第6号に定める行為は、CC
            BY
            4.0による著作権の許諾とは別に、個人情報の保護に関する法律その他の法令および本規約に基づき禁止されるものです。
          </LegalParagraph>
          <LegalList
            items={[
              "(1) CC BY 4.0に定められる条件を遵守しない行為",
              "(2) 本データを利用して、回答者またはその関係者を識別または推測する行為（以下「再識別行為」といいます。）",
              "(3) 再識別行為を目的として、本データを他の情報と照合し、または照合可能な形で保持する行為",
              "(4) 本データを利用した誹謗中傷、差別、ヘイトスピーチ、その他公序良俗に反する行為",
              "(5) 本データを利用して、特定の個人または団体に不利益を与える行為",
              "(6) 法令その他社会通念上不適切と判断される行為",
            ]}
            className="list-none pl-0"
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第4条（出典表示）</LegalSectionTitle>
          <LegalParagraph>
            利用者は、本データを利用した成果物において、以下の事項を明示するものとします。
          </LegalParagraph>
          <LegalList
            items={[
              "データ出典：「みらい議会AIインタビュー（チームみらい）」",
              "データ提供元URL：https://gikai.team-mir.ai/",
              "本規約のURL：https://gikai.team-mir.ai/developers/interview-data-terms",
              {
                id: "license",
                content: (
                  <>
                    ライセンス：
                    <a
                      href={CC_BY_LICENSE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-accent underline"
                    >
                      CC BY 4.0
                    </a>
                  </>
                ),
              },
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第5条（利用停止）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、利用者が本規約に違反したと判断した場合、事前に通知することなく、本データの利用停止、ダウンロードの制限、当該成果物の公開停止の要請、その他当組織が必要と判断する措置を講じることができるものとします。本条の措置は、損害賠償その他の請求を妨げるものではありません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第6条（本データに関する権利）</LegalSectionTitle>
          <LegalParagraph>
            本データに関する一切の権利は、当組織または正当な権利者に帰属します。本規約は、第2条に定める範囲を超えて、利用者にいかなる権利の譲渡またはライセンスを行うものではありません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第7条（無保証および免責）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、本データの正確性、完全性、最新性、有用性、特定目的への適合性等について、いかなる保証も行いません。本データは、AIによる対話を通じて取得された回答内容を基にしたものであり、誤った情報、偏った見解、不適切な表現等を含む可能性があることを利用者は理解した上で利用するものとします。
          </LegalParagraph>
          <LegalParagraph>
            当組織は、本データの利用または利用不能に起因または関連して利用者または第三者に生じた一切の損害について、責任を負わないものとします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第8条（本データの提供停止）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、利用者への事前通知なく、本データの提供内容の変更、提供範囲の縮小、または提供の停止を行うことができるものとし、それにより生じた損害について一切の責任を負いません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第9条（規約の変更）</LegalSectionTitle>
          <LegalParagraph>
            当組織は、必要に応じて本規約を変更することができ、変更後に利用者が本データを利用した場合、当該変更に同意したものとみなします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第10条（準拠法・管轄）</LegalSectionTitle>
          <LegalParagraph>
            本規約は日本法に準拠し、本データの利用に関連して生じる一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>第11条（お問い合わせ）</LegalSectionTitle>
          <LegalParagraph>
            本規約および本データに関するお問い合わせは、下記までご連絡ください。
          </LegalParagraph>
          <LegalParagraph>support@team-mir.ai</LegalParagraph>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
