import { SERVICE_INFO } from '@/config/business';
import { Footer } from '@/components/Footer';

export function PricingView() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">요금제</h1>
          <p className="mt-2 text-sm text-gray-600">
            매월 3회 무료로 시험 사용해보고, 필요할 때 부담 없이 결제하세요.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <PlanCard
            name="무료"
            price="0원"
            period="평생"
            features={[
              'Google 계정으로 가입',
              '매월 자동 생성 3회',
              '제약 검증 무제한',
              '근무표 수동 편집 무제한',
            ]}
            cta="회원가입"
            ctaHref="/?signup=1"
            highlight={false}
          />
          <PlanCard
            name="데이 패스"
            price="3,000원"
            period="1회 결제 / 24시간"
            features={[
              '24시간 자동 생성 무제한',
              '결제 후 즉시 사용 가능',
              '자동결제 없음',
              '단발성 사용에 적합',
            ]}
            cta="데이 패스 구매"
            ctaHref="/?upgrade=daypass"
            highlight={false}
          />
          <PlanCard
            name="연간 구독"
            price="월 3,000원"
            period="자동결제 / 1년 단위 갱신 / 최대 12개월"
            features={[
              '매월 자동 생성 무제한',
              '월 자동결제',
              '언제든 해지 가능',
              '월별 사용에 적합',
            ]}
            cta="연간 구독 시작"
            ctaHref="/?upgrade=annual"
            highlight
          />
        </div>

        <section className="mt-12 rounded-md border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">결제 안내</h2>
          <dl className="space-y-2 text-sm text-gray-700">
            <Row label="결제수단" value="신용카드, 계좌이체, 간편결제 (가상계좌 미지원)" />
            <Row label="결제대행" value="(주)토스페이먼츠" />
            <Row label="서비스 제공 기간" value="데이 패스 24시간 / 연간 구독 최대 12개월" />
            <Row label="자동결제 해지" value="마이페이지 또는 고객센터 이메일을 통해 언제든지 해지 가능" />
          </dl>
        </section>

        <section className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <h2 className="mb-2 text-base font-semibold">청약철회 안내 (디지털 콘텐츠 특례)</h2>
          <p>
            본 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따른
            디지털 콘텐츠로, 이용 시작 시점부터 청약철회가 제한됩니다. 결제 전 무료 3회 생성을 통해
            서비스를 충분히 시험 사용해보시기 바랍니다. 자세한 환불 정책은{' '}
            <a href="/terms#refund" className="underline hover:text-amber-700">
              이용약관 제7조
            </a>
            를 참고하세요.
          </p>
        </section>

        <p className="mt-10 text-center text-xs text-gray-500">
          모든 가격은 부가세(VAT) 포함입니다. 결제 통화: KRW
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="text-sm font-medium text-gray-800 hover:text-gray-900">
          ← {SERVICE_INFO.serviceName}
        </a>
        <nav className="flex gap-4 text-xs text-gray-600">
          <a href="/terms" className="hover:text-gray-900 hover:underline">이용약관</a>
          <a href="/privacy" className="hover:text-gray-900 hover:underline">개인정보처리방침</a>
        </nav>
      </div>
    </header>
  );
}

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight: boolean;
}

function PlanCard({ name, price, period, features, cta, ctaHref, highlight }: PlanCardProps) {
  const containerClass = highlight
    ? 'border-blue-500 ring-2 ring-blue-100'
    : 'border-gray-200';
  const buttonClass = highlight
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'border border-gray-300 text-gray-800 hover:bg-gray-50';

  return (
    <div className={`flex flex-col rounded-lg border bg-white p-6 ${containerClass}`}>
      {highlight && (
        <span className="mb-2 self-start rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          추천
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <div className="mt-3 text-3xl font-semibold text-gray-900">{price}</div>
      <div className="mt-1 text-xs text-gray-500">{period}</div>
      <ul className="mt-5 flex-1 space-y-1.5 text-sm text-gray-700">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${buttonClass}`}
      >
        {cta}
      </a>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 font-medium text-gray-600">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}
