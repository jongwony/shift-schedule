import { BUSINESS_INFO } from '@/config/business';
import { Footer } from '@/components/Footer';
import { buttonVariants } from '@/components/ui/buttonVariants';

export function ProductHeader() {
  return <header className="border-b bg-white"><nav aria-label="서비스 메뉴" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
    <a href="/about" className="text-lg font-semibold text-blue-700">Shift Schedule</a>
    <div className="flex flex-wrap gap-4 text-sm"><a href="/demo">샘플 체험</a><a href="/pricing">요금제</a><a href="/">근무표 편집기</a></div>
  </nav></header>;
}

export function ProductView() {
  return <div className="min-h-screen bg-white text-gray-900">
    <ProductHeader />
    <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <section className="max-w-3xl space-y-6">
        <p className="text-sm font-semibold text-blue-700">교대근무 팀을 위한 웹 베타</p>
        <h1 className="text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight">근무표를 바꿀 때마다,<br />놓친 근무 조건을 확인하세요.</h1>
        <p className="text-lg leading-relaxed text-gray-600">주간·저녁·야간 근무를 운영하는 팀의 담당자를 위한 28일 근무표 도구입니다. 필요한 인원, 연속 야간, 휴무 조건을 함께 검토하고 조정합니다.</p>
        <div className="flex flex-wrap gap-3"><a className={buttonVariants()} href="/demo">로그인 없이 샘플 체험</a><a className={buttonVariants({ variant: 'outline' })} href="/">내 근무표 만들기</a></div>
      </section>
      <section aria-label="근무표 작성 과정" className="mt-16 grid gap-8 border-y py-10 md:grid-cols-3">
        {[
          ['01 · 조건 설정', '직원과 필요한 인원 등록', '근무 가능한 유형, 주차별 필요 인원과 휴무 조건을 설정합니다.'],
          ['02 · 작성과 검토', '바꾸는 즉시 위반 확인', '수동으로 편집하거나 로그인 후 자동 생성을 요청하세요. 필수 조건 위반과 선호 조건 경고를 구분해 보여줍니다.'],
          ['03 · 현장 적용', '확정할 배정을 고정하고 복사', '고정할 근무를 지정해 다시 생성하거나, 표를 복사해 스프레드시트에 붙여 넣습니다.'],
        ].map(([step, title, description]) => <article key={step}><p className="text-sm text-blue-700">{step}</p><h2 className="mt-3 text-xl font-semibold">{title}</h2><p className="mt-3 leading-relaxed text-gray-600">{description}</p></article>)}
      </section>
      <section className="mt-12 grid gap-10 md:grid-cols-2">
        <div><h2 className="text-2xl font-semibold">도입 전에 직접 확인하세요</h2><p className="mt-4 leading-relaxed text-gray-600">샘플은 가상 직원 8명의 근무표입니다. 배정을 바꾸며 검증 결과를 확인할 수 있고, 기존에 작성한 근무표에는 영향을 주지 않습니다.</p><p className="mt-4 leading-relaxed text-gray-600">수동 편집과 로컬 검증은 무료입니다. 자동 생성은 Google 로그인 후 월 3회 제공하며, 유료 데이 패스는 준비 중입니다.</p><a className="mt-4 inline-block text-blue-700 underline" href="/pricing">제공 범위와 예정 요금 보기</a></div>
        <div><h2 className="text-2xl font-semibold">우리 팀에 맞는지 이야기해요</h2><p className="mt-4 leading-relaxed text-gray-600">교대 인원, 현재 작성 방식, 가장 자주 충돌하는 조건을 알려주세요. 실명이나 실제 근무표를 보내지 않아도 됩니다.</p><a className="mt-4 inline-block text-blue-700 underline" href={`mailto:${BUSINESS_INFO.email}?subject=${encodeURIComponent('Shift Schedule 베타 도입 문의')}`}>이메일로 도입 문의</a><p className="mt-4 text-sm text-gray-600">운영: {BUSINESS_INFO.companyName} · <a className="underline" href="https://rootproto.com" target="_blank" rel="noreferrer">회사 홈페이지</a> · <a className="underline" href="https://github.com/jongwony/shift-schedule">공개 개발 저장소</a></p></div>
      </section>
      <aside className="mt-12 rounded-lg bg-blue-50 p-6 leading-relaxed text-gray-700">근무표는 이 브라우저에 저장됩니다. 자동 생성 요청 시 배정과 설정 정보가 서버로 전송됩니다. 검증 결과는 설정한 조건에 대한 판단이며, 최종 근무표는 담당자가 현장 기준에 맞게 확인해 주세요.</aside>
    </main><Footer />
  </div>;
}
