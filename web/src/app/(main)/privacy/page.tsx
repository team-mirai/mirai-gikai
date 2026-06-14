import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import {
  LegalList,
  LegalPageLayout,
  LegalParagraph,
  LegalSectionTitle,
} from "@/components/layouts/legal-page-layout";

export const metadata: Metadata = {
  title: "プライバシーポリシー | みらい議会＠草津市",
  description: "みらい議会＠草津市のプライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      className="bg-transparent pt-24 md:pt-12"
      title="プライバシーポリシー"
      description="みらいと維新の風が運営する「みらい議会＠草津市」における、個人情報等の取り扱いについてご説明します。"
    >
      <Container className="space-y-8">
        <LegalParagraph className="text-right">
          制定日・最終更新日：2026年6月14日
        </LegalParagraph>

        <LegalParagraph>
          みらいと維新の風（以下「運営者」といいます。）は、「みらい議会＠草津市」（以下「本サイト」といいます。）の運営にあたり、個人情報の保護に関する法律その他の関係法令を遵守し、取得した情報を適切に取り扱います。
        </LegalParagraph>

        <section className="space-y-4">
          <LegalSectionTitle>1. 取得する情報</LegalSectionTitle>
          <LegalParagraph>
            運営者は、本サイトの運営にあたり、次の情報を取得する場合があります。
          </LegalParagraph>
          <LegalList
            items={[
              "お問い合わせの際に提供される氏名、メールアドレス、電話番号、所属、相談内容その他の情報",
              "IPアドレス、ブラウザーや端末の種類、閲覧したページ、閲覧日時、参照元などのアクセス情報",
              "Cookie（クッキー）その他の識別子を利用して取得される、本サイトの利用状況に関する情報",
            ]}
          />
          <LegalParagraph>
            本サイトは、議案情報を閲覧するために、氏名や住所などの入力を求めるものではありません。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>2. 利用目的</LegalSectionTitle>
          <LegalParagraph>
            取得した情報は、次の目的のために利用します。
          </LegalParagraph>
          <LegalList
            items={[
              "お問い合わせへの回答および必要な連絡",
              "掲載内容の確認、訂正およびご意見への対応",
              "本サイトの利用状況の把握、品質向上および内容の改善",
              "不正アクセス、迷惑行為その他の不正利用の防止と安全な運営",
              "法令に基づく対応および本サイトに関する紛争への対応",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>
            3. Cookieおよびアクセス解析について
          </LegalSectionTitle>
          <LegalParagraph>
            本サイトでは、利便性の向上や利用状況の把握のため、Cookieを使用する場合があります。また、Google
            AnalyticsおよびVercel Speed
            Insights等のサービスを利用し、閲覧状況や表示性能に関する情報を収集する場合があります。
          </LegalParagraph>
          <LegalParagraph>
            これらのサービスにより収集される情報には、通常、氏名やメールアドレスなど、運営者が利用者を直接特定するための情報は含まれません。収集される情報の取り扱いについては、各サービス提供者の規約およびプライバシーポリシーも適用されます。
          </LegalParagraph>
          <LegalParagraph>
            利用者は、ブラウザーの設定によりCookieを無効にできます。ただし、その場合、本サイトの一部の表示や機能に影響が生じることがあります。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>4. 第三者への提供</LegalSectionTitle>
          <LegalParagraph>
            運営者は、次の場合を除き、本人の同意なく個人情報を第三者に提供しません。
          </LegalParagraph>
          <LegalList
            items={[
              "法令に基づく場合",
              "人の生命、身体または財産の保護のために必要で、本人の同意を得ることが困難な場合",
              "公衆衛生の向上または児童の健全な育成のために特に必要で、本人の同意を得ることが困難な場合",
              "国や地方公共団体等が法令に定める事務を行うことに協力する必要があり、本人の同意によりその事務の遂行に支障を及ぼすおそれがある場合",
            ]}
          />
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>5. 取り扱いの委託</LegalSectionTitle>
          <LegalParagraph>
            運営者は、本サイトの配信、データの保管、アクセス解析その他の運営に必要な範囲で、外部サービス提供者に情報の取り扱いを委託する場合があります。この場合、適切な委託先を選定し、必要かつ適切な監督を行います。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>6. 安全管理措置</LegalSectionTitle>
          <LegalParagraph>
            運営者は、取得した情報への不正アクセス、漏えい、滅失、毀損、改ざん等を防止するため、アクセス制限、認証情報の管理、通信の保護その他の必要かつ適切な安全管理措置に努めます。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>7. 保管期間と削除</LegalSectionTitle>
          <LegalParagraph>
            運営者は、取得した情報を利用目的の達成に必要な期間、または法令上保存が必要な期間に限って保管し、保管の必要がなくなった情報は適切な方法で削除または匿名化します。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>8. 個人情報の開示・訂正・削除等</LegalSectionTitle>
          <LegalParagraph>
            本人から、個人情報の利用目的の通知、開示、訂正、追加、削除、利用停止または第三者提供の停止等の請求があった場合、本人確認を行ったうえで、法令に従い適切に対応します。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>9. 外部サイトについて</LegalSectionTitle>
          <LegalParagraph>
            本サイトには外部サイトへのリンクが含まれます。リンク先で提供した情報については、リンク先サイトのプライバシーポリシーが適用されます。お問い合わせページも外部サイトに移動しますので、移動先の表示内容をご確認ください。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>10. 本ポリシーの変更</LegalSectionTitle>
          <LegalParagraph>
            運営者は、法令や本サイトの運営内容の変更等に応じて、本ポリシーを改定することがあります。改定後の内容は、本サイトに掲載した時点から効力を生じます。重要な変更がある場合は、本サイト上でわかりやすくお知らせします。
          </LegalParagraph>
        </section>

        <section className="space-y-4">
          <LegalSectionTitle>11. お問い合わせ窓口</LegalSectionTitle>
          <LegalParagraph>
            個人情報の取り扱い、本サイトの掲載内容その他のお問い合わせは、次の窓口までご連絡ください。
          </LegalParagraph>
          <div className="space-y-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            <p>
              運営者：
              <span className="font-medium text-slate-800">
                みらいと維新の風
              </span>
            </p>
            <p>
              メール：
              <a
                href="mailto:info@mirainokaze.info"
                className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900"
              >
                info@mirainokaze.info
              </a>
            </p>
            <p>
              お問い合わせページ：
              <a
                href="https://mirainokaze.info/contact/#"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900"
              >
                https://mirainokaze.info/contact/
              </a>
            </p>
          </div>
        </section>
      </Container>
    </LegalPageLayout>
  );
}
