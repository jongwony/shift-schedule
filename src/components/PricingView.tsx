import { BUSINESS_INFO, SERVICE_INFO } from '@/config/business';
import { Footer } from '@/components/Footer';

export function PricingView() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">요금제</h1>
          <p className="mt-2 text-sm text-gray-600">
            수동 편집과 검증은 무료, 로그인 후 자동 생성은 월 3회입니다. 유료 결제는 준비 중입니다.
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
            period="예정 요금 / 출시 후 첫 사용부터 24시간"
            features={[
              '결제 후 첫 자동 생성 시점부터 24시간 무제한',
              '활성화 전까지는 환불 가능',
              '자동결제 없음',
              '단발성 사용에 적합',
            ]}
            cta="결제 준비 중"
            disabled
            highlight
          />
          <PlanCard
            name="평생 사용"
            price="문의"
            period="개별 안내"
            features={[
              '평생 자동 생성 무제한',
              '준비 중인 상품입니다',
              '관심 있으시면 운영자에게 문의',
            ]}
            cta="평생 사용 문의"
            disabled
            highlight={false}
          />
        </div>

        <section className="mt-12 rounded-md border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold">유료 기능 출시 준비 중</h2>
          <p className="mt-3 leading-relaxed text-gray-600">현재 결제를 받지 않습니다. 데이 패스의 가격과 제공 범위는 출시 전 변경될 수 있으며, 결제·환불 조건은 출시 시 안내합니다.</p>
          <a className="mt-3 inline-block text-blue-700 underline" href={`mailto:${BUSINESS_INFO.email}`}>도입 및 요금 문의</a>
        </section>

        <p className="mt-10 text-center text-xs text-gray-500">
          예정 가격은 부가세(VAT) 포함, 원화(KRW) 기준입니다.
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
  ctaHref?: string;
  disabled?: boolean;
  highlight: boolean;
}

function PlanCard({ name, price, period, features, cta, ctaHref, disabled = false, highlight }: PlanCardProps) {
  const containerClass = disabled
    ? 'border-gray-200 bg-gray-50'
    : highlight
      ? 'border-blue-500 ring-2 ring-blue-100'
      : 'border-gray-200';
  const buttonClass = disabled
    ? 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
    : highlight
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'border border-gray-300 text-gray-800 hover:bg-gray-50';

  return (
    <div className={`flex flex-col rounded-lg border p-6 ${containerClass}`}>
      {highlight && !disabled && (
        <span className="mb-2 self-start rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          추천
        </span>
      )}
      {disabled && (
        <span className="mb-2 self-start rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          준비 중
        </span>
      )}
      <h3 className={`text-lg font-semibold ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{name}</h3>
      <div className={`mt-3 text-3xl font-semibold ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>{price}</div>
      <div className="mt-1 text-xs text-gray-500">{period}</div>
      <ul className={`mt-5 flex-1 space-y-1.5 text-sm ${disabled ? 'text-gray-500' : 'text-gray-700'}`}>
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className={`mt-0.5 ${disabled ? 'text-gray-400' : 'text-blue-500'}`}>•</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {disabled ? (
        <span
          aria-disabled="true"
          className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium ${buttonClass}`}
        >
          {cta}
        </span>
      ) : (
        <a
          href={ctaHref}
          className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${buttonClass}`}
        >
          {cta}
        </a>
      )}
    </div>
  );
}
