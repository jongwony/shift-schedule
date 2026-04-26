import { useEffect } from 'react';
import { BUSINESS_INFO, SERVICE_INFO } from '@/config/business';
import { Footer } from '@/components/Footer';

export function TermsView() {
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <article className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-gray-800">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">이용약관</h1>
        <p className="mb-8 text-xs text-gray-500">시행일: {SERVICE_INFO.effectiveDate}</p>

        <Section title="제1조 (목적)">
          이 약관은 {BUSINESS_INFO.companyName}(이하 "회사")가 제공하는 {SERVICE_INFO.serviceName}(이하 "서비스")의
          이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (정의)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>"서비스"란 회사가 제공하는 자동 근무표 생성 및 검증 도구를 의미합니다.</li>
            <li>"이용자"란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
            <li>"회원"이란 Google 계정을 통해 가입한 이용자를 말합니다.</li>
            <li>"유료 상품"이란 데이 패스(Day Pass) 및 연간 구독(Annual)을 말합니다.</li>
            <li>"자동결제"란 회원이 사전에 등록한 결제수단으로 정기적으로 청구되는 결제 방식을 말합니다.</li>
          </ol>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 적용일자 7일 전부터
              공지합니다. 다만 회원에게 불리한 변경은 30일 전부터 공지합니다.</li>
            <li>회원이 변경된 약관에 동의하지 않는 경우 이용계약을 해지할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (서비스의 제공 및 이용)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>회사는 회원에게 다음 각 호의 서비스를 제공합니다.
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>무료 회원: 매월 자동 스케줄 생성 3회</li>
                <li>데이 패스: 결제 후 24시간 동안 자동 스케줄 무제한 생성</li>
                <li>연간 구독: 월 단위 자동결제, 1년 단위 갱신, 자동 스케줄 무제한 생성</li>
              </ul>
            </li>
            <li>서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간을 원칙으로 합니다.</li>
            <li>회사는 정기점검, 시스템 업그레이드, 장애 등 부득이한 경우 서비스의 전부 또는 일부를 일시 중단할 수 있습니다.</li>
          </ol>
        </Section>

        <Section title="제5조 (요금 및 결제)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>유료 상품의 요금은 다음과 같습니다.
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>데이 패스: 3,000원 (1회 결제, 24시간 사용)</li>
                <li>연간 구독: 월 3,000원 (자동결제, 1년 단위 갱신, 최대 12개월)</li>
              </ul>
            </li>
            <li>결제수단은 신용카드, 계좌이체, 간편결제로 한정합니다. 가상계좌는 지원하지 않습니다.</li>
            <li>결제는 (주)토스페이먼츠가 제공하는 결제대행 서비스를 통해 처리됩니다.</li>
            <li>회사는 회원의 결제정보를 직접 저장하지 않으며, 결제대행사가 안전하게 보관·관리합니다.</li>
          </ol>
        </Section>

        <Section title="제6조 (자동결제)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>연간 구독은 자동결제 방식으로 운영되며, 회원의 명시적 동의 후 등록됩니다.</li>
            <li>자동결제는 매월 같은 일자에 등록된 결제수단으로 청구됩니다.</li>
            <li>회원은 언제든지 마이페이지에서 자동결제를 해지할 수 있으며, 해지 시점부터 다음 결제일이 도래하지 않습니다.</li>
            <li>결제 실패 시 회사는 이메일로 안내하며, 일정 기간 내 재시도합니다. 재시도 후에도 결제가 이루어지지 않는 경우 구독은 자동 만료됩니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (청약철회 및 환불)" id="refund">
          <ol className="list-decimal space-y-1 pl-5">
            <li><strong>디지털 콘텐츠 특례</strong>: 본 서비스는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항 제5호에 따른
              디지털 콘텐츠로, 이용 시작 시점부터 청약철회가 제한됩니다.</li>
            <li><strong>무료 시험 사용</strong>: 회사는 매월 3회의 무료 자동 생성을 제공하여 이용자가 결제 전 서비스를 충분히
              체험할 수 있도록 합니다.</li>
            <li>데이 패스: 결제 후 단 한 번도 이용하지 않은 경우에 한해 결제일로부터 7일 이내 환불 요청 가능합니다.</li>
            <li>연간 구독: 다음 결제일 전 해지 시 추가 청구가 이루어지지 않으며, 이미 결제된 월분은 환불되지 않습니다.</li>
            <li>환불 요청은 이메일({BUSINESS_INFO.email})로 접수하며, 적법한 사유가 인정되는 경우 영업일 기준 3일 이내 처리됩니다.</li>
            <li>회사의 귀책사유로 서비스 이용이 불가한 경우 잔여 기간을 일할 계산하여 환불합니다.</li>
          </ol>
        </Section>

        <Section title="제8조 (회원의 의무)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>회원은 본 약관 및 관련 법령을 준수해야 합니다.</li>
            <li>회원은 자신의 계정을 제3자에게 양도, 대여할 수 없습니다.</li>
            <li>회원은 서비스를 이용하여 다음 행위를 해서는 안 됩니다.
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                <li>타인의 정보 도용</li>
                <li>서비스의 운영을 방해하는 행위</li>
                <li>서비스를 무단으로 복제, 재판매하는 행위</li>
                <li>관련 법령에 위배되는 행위</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="제9조 (책임 제한)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우
              책임이 면제됩니다.</li>
            <li>본 서비스가 생성하는 근무표는 입력된 제약조건을 만족하는 후보안이며, 최종 결정과 운영 책임은 이용자에게 있습니다.</li>
            <li>회사는 회원이 서비스를 이용하여 얻은 정보로 인한 손해에 대하여 책임을 지지 않습니다.</li>
          </ol>
        </Section>

        <Section title="제10조 (분쟁해결)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>본 약관은 대한민국 법령에 따라 규율됩니다.</li>
            <li>서비스 이용으로 발생한 분쟁은 회사 본점 소재지 관할 법원을 제1심 관할 법원으로 합니다.</li>
          </ol>
        </Section>

        <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500">
          부칙: 본 약관은 {SERVICE_INFO.effectiveDate}부터 시행됩니다.
        </p>
      </article>
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
      </div>
    </header>
  );
}

interface SectionProps {
  title: string;
  id?: string;
  children: React.ReactNode;
}

function Section({ title, id, children }: SectionProps) {
  return (
    <section id={id} className="mb-6 scroll-mt-16">
      <h2 className="mb-2 text-base font-semibold text-gray-900">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </section>
  );
}
