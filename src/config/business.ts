/**
 * Business information for legal compliance and TossPayments review.
 *
 * 배포 전 모든 PLACEHOLDER 값을 실제 사업자 정보로 교체할 것.
 * 누락 시 TossPayments 카드사 심사([3]-2)에서 제외될 수 있음.
 */

export const BUSINESS_INFO = {
  // 상호명 (Business Name)
  companyName: '루트프로토',

  // 대표자명 (Representative)
  representative: '최종원',

  // 사업자등록번호 (Business Registration Number, 10 digits with hyphens)
  businessRegistrationNumber: '790-53-01184',

  // 통신판매업 신고번호 (Mail-Order Sales Registration Number)
  // TODO: 통신판매업 신고 후 신고번호 기재 (예: 제2026-부산기장-0000호)
  mailOrderRegistrationNumber: 'PLACEHOLDER_통신판매업_신고번호',

  // 사업장 주소 (Business Address)
  address: '부산광역시 기장군 기장읍 읍내로 56, 3층 (두원인테리어)',

  // 연락처 (대표 번호 — 유선·휴대 통일)
  phone: '010-8514-0289',

  // 대표 이메일 (Customer Service + Privacy Officer 겸용)
  email: 'choi@rootproto.com',

  // 개인정보 보호책임자 (Privacy Officer)
  privacyOfficer: {
    name: '최종원',
    email: 'choi@rootproto.com',
  },

  // 호스팅 (Hosting Provider)
  hosting: 'GitHub Pages (Microsoft) / Amazon Web Services',
} as const;

export const SERVICE_INFO = {
  serviceName: '교대근무 자동 스케줄러',
  serviceUrl: 'https://shift-schedule.connects.im',
  effectiveDate: '2026-04-26',
} as const;
