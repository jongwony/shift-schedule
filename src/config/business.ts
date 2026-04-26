/**
 * Business information for legal compliance and TossPayments review.
 *
 * 배포 전 모든 PLACEHOLDER 값을 실제 사업자 정보로 교체할 것.
 * 누락 시 TossPayments 카드사 심사([3]-2)에서 제외될 수 있음.
 */

export const BUSINESS_INFO = {
  // 상호명 (Business Name)
  companyName: 'PLACEHOLDER_상호명',

  // 대표자명 (Representative)
  representative: 'PLACEHOLDER_대표자명',

  // 사업자등록번호 (Business Registration Number, 10 digits with hyphens)
  businessRegistrationNumber: 'PLACEHOLDER_000-00-00000',

  // 통신판매업 신고번호 (Mail-Order Sales Registration Number)
  mailOrderRegistrationNumber: 'PLACEHOLDER_제0000-서울XX구-0000호',

  // 사업장 주소 (Business Address)
  address: 'PLACEHOLDER_서울특별시 XX구 XX로 00 (00동, 00빌딩 0층)',

  // 유선 전화번호 (Landline)
  phone: 'PLACEHOLDER_02-0000-0000',

  // 대표 이메일 (Customer Service Email)
  email: 'support@connects.im',

  // 개인정보 보호책임자 (Privacy Officer)
  privacyOfficer: {
    name: 'PLACEHOLDER_보호책임자명',
    email: 'privacy@connects.im',
  },

  // 호스팅 (Hosting Provider)
  hosting: 'GitHub Pages (Microsoft) / Amazon Web Services',
} as const;

export const SERVICE_INFO = {
  serviceName: '교대근무 자동 스케줄러',
  serviceUrl: 'https://shift-schedule.connects.im',
  effectiveDate: '2026-04-26',
} as const;
