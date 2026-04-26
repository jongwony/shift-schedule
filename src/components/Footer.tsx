import { BUSINESS_INFO, SERVICE_INFO } from '@/config/business';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-600">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
          <div className="space-y-1">
            <div className="font-medium text-gray-800">{SERVICE_INFO.serviceName}</div>
            <div>상호: {BUSINESS_INFO.companyName}</div>
            <div>대표: {BUSINESS_INFO.representative}</div>
            <div>사업자등록번호: {BUSINESS_INFO.businessRegistrationNumber}</div>
            <div>통신판매업 신고번호: {BUSINESS_INFO.mailOrderRegistrationNumber}</div>
          </div>
          <div className="space-y-1">
            <div>주소: {BUSINESS_INFO.address}</div>
            <div>전화: {BUSINESS_INFO.phone}</div>
            <div>
              이메일: <a href={`mailto:${BUSINESS_INFO.email}`} className="underline hover:text-gray-900">{BUSINESS_INFO.email}</a>
            </div>
            <div>호스팅: {BUSINESS_INFO.hosting}</div>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-200 pt-4">
          <a href="/pricing" className="hover:text-gray-900 hover:underline">요금제</a>
          <a href="/terms" className="hover:text-gray-900 hover:underline">이용약관</a>
          <a href="/privacy" className="hover:text-gray-900 hover:underline">개인정보처리방침</a>
          <a href="/terms#refund" className="hover:text-gray-900 hover:underline">환불정책</a>
          <span className="ml-auto text-gray-400">© 2026 {BUSINESS_INFO.companyName}. All rights reserved.</span>
        </nav>
      </div>
    </footer>
  );
}
