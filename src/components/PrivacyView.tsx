import { BUSINESS_INFO, SERVICE_INFO } from '@/config/business';
import { Footer } from '@/components/Footer';

export function PrivacyView() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <article className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-gray-800">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">개인정보처리방침</h1>
        <p className="mb-8 text-xs text-gray-500">시행일: {SERVICE_INFO.effectiveDate}</p>

        <p className="mb-6">
          {BUSINESS_INFO.companyName}(이하 "회사")는 「개인정보 보호법」 등 관련 법령에 따라 이용자의 개인정보를
          보호하고 권익을 보장하기 위해 다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section title="제1조 (수집하는 개인정보 항목)">
          <p className="mb-2">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-gray-300 bg-gray-50">
                <th className="px-2 py-2 text-left font-medium">구분</th>
                <th className="px-2 py-2 text-left font-medium">수집 항목</th>
                <th className="px-2 py-2 text-left font-medium">수집 시점</th>
              </tr>
            </thead>
            <tbody>
              <Row label="회원가입 (Google OAuth)" items="이메일, 이름, 프로필 이미지, Google 계정 식별자" timing="회원가입 시" />
              <Row label="유료 결제" items="결제수단 식별자(billing key), 결제 이력 (실제 카드번호는 (주)토스페이먼츠가 보관, 회사는 미보관)" timing="유료 상품 결제 시" />
              <Row label="서비스 이용" items="자동 생성 횟수, 마지막 이용 일시, 접속 IP, 브라우저 정보" timing="서비스 이용 시 자동 수집" />
            </tbody>
          </table>
        </Section>

        <Section title="제2조 (개인정보의 수집 및 이용 목적)">
          <ol className="list-decimal space-y-1 pl-5">
            <li><strong>회원 식별 및 인증</strong>: 본인 확인, 부정 이용 방지</li>
            <li><strong>서비스 제공</strong>: 자동 스케줄 생성 한도 관리, 유료 상품 이용 권한 부여</li>
            <li><strong>결제 처리</strong>: 결제대행을 통한 유료 상품 결제 및 정산</li>
            <li><strong>고객 응대</strong>: 문의 응답, 환불 처리, 결제 실패 안내 이메일 발송</li>
            <li><strong>서비스 개선</strong>: 이용 통계 분석 (개인 식별 정보 제외)</li>
          </ol>
        </Section>

        <Section title="제3조 (개인정보의 보유 및 이용 기간)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>회원 정보: 회원 탈퇴 시까지</li>
            <li>결제 기록: 「전자상거래법」에 따라 5년간 보관</li>
            <li>접속 기록: 「통신비밀보호법」에 따라 3개월간 보관</li>
            <li>탈퇴 회원의 정보는 즉시 파기되며, 위 법정 보관 기간이 적용되는 결제·접속 기록은 별도 분리하여 보관됩니다.</li>
          </ol>
        </Section>

        <Section title="제4조 (개인정보의 제3자 제공)">
          <p className="mb-2">회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.</p>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 의거하거나 수사기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="제5조 (개인정보 처리의 위탁)">
          <p className="mb-2">회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-y border-gray-300 bg-gray-50">
                <th className="px-2 py-2 text-left font-medium">수탁자</th>
                <th className="px-2 py-2 text-left font-medium">위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <SimpleRow vendor="(주)토스페이먼츠" task="결제 대행, 카드정보 보관, 빌링키 관리" />
              <SimpleRow vendor="Amazon Web Services, Inc." task="서버 인프라, 데이터베이스, 이메일 발송" />
              <SimpleRow vendor="Google LLC" task="OAuth 2.0 인증" />
              <SimpleRow vendor="Microsoft (GitHub Pages)" task="정적 콘텐츠 호스팅" />
            </tbody>
          </table>
        </Section>

        <Section title="제6조 (정보주체의 권리·의무 및 행사방법)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>이용자는 언제든지 자신의 개인정보를 조회·수정·삭제·처리정지를 요청할 수 있습니다.</li>
            <li>권리 행사는 회사에 대해 서면, 이메일, 모사전송(FAX) 등을 통해 하실 수 있으며 회사는 이에 대해
              지체 없이 조치하겠습니다.</li>
            <li>이용자가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우, 회사는 정정 또는 삭제를 완료할
              때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</li>
          </ol>
        </Section>

        <Section title="제7조 (개인정보의 안전성 확보 조치)">
          <ol className="list-decimal space-y-1 pl-5">
            <li>관리적 조치: 개인정보 취급자 최소화 및 정기 교육</li>
            <li>기술적 조치: 접근권한 관리, 암호화 전송 (HTTPS/TLS), 결제수단 토큰화</li>
            <li>물리적 조치: 데이터센터 물리 접근 제한 (AWS 표준)</li>
          </ol>
        </Section>

        <Section title="제8조 (개인정보 자동 수집 장치의 설치·운영 및 거부)">
          <p>회사는 서비스 이용 편의 제공을 위해 쿠키 또는 로컬 스토리지(localStorage)를 사용할 수 있습니다.
            이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 기능 이용에 제한이 있을 수 있습니다.</p>
        </Section>

        <Section title="제9조 (개인정보 보호책임자)">
          <ul className="list-disc space-y-0.5 pl-5">
            <li>이름: {BUSINESS_INFO.privacyOfficer.name}</li>
            <li>이메일: <a href={`mailto:${BUSINESS_INFO.privacyOfficer.email}`} className="underline">{BUSINESS_INFO.privacyOfficer.email}</a></li>
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 다음 기관에 문의하실 수 있습니다.
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
            <li>개인정보분쟁조정위원회: 1833-6972 (privacy.go.kr)</li>
            <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
            <li>대검찰청 사이버범죄수사단: 02-3480-3573</li>
            <li>경찰청 사이버수사국: 182 (ecrm.cyber.go.kr)</li>
          </ul>
        </Section>

        <Section title="제10조 (개인정보처리방침의 변경)">
          본 방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
          변경사항의 시행 7일 전부터 공지합니다.
        </Section>

        <p className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500">
          부칙: 본 방침은 {SERVICE_INFO.effectiveDate}부터 시행됩니다.
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
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-semibold text-gray-900">{title}</h2>
      <div className="text-sm text-gray-700">{children}</div>
    </section>
  );
}

interface RowProps {
  label: string;
  items: string;
  timing: string;
}

function Row({ label, items, timing }: RowProps) {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-2 py-2 align-top font-medium">{label}</td>
      <td className="px-2 py-2 align-top">{items}</td>
      <td className="px-2 py-2 align-top text-gray-600">{timing}</td>
    </tr>
  );
}

interface SimpleRowProps {
  vendor: string;
  task: string;
}

function SimpleRow({ vendor, task }: SimpleRowProps) {
  return (
    <tr className="border-b border-gray-200">
      <td className="px-2 py-2 align-top font-medium">{vendor}</td>
      <td className="px-2 py-2 align-top">{task}</td>
    </tr>
  );
}
