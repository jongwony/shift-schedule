# Shift Schedule

28일 교대근무표 작성·검증 웹 베타. 필요한 인원과 근무 순서, 연속 야간, 휴무 조건을 검토하고, 로그인 후 서버에 자동 생성을 요청할 수 있습니다.

- 현재 서비스: https://shift-schedule.connects.im
- 제품 소개 `/about` · 로그인 없는 가상 데이터 체험 `/demo` (이 브랜치 배포 후 제공)
- 수동 편집·로컬 검증 무료, 로그인 후 자동 생성 월 3회. 유료 데이 패스 결제는 준비 중입니다.
- [Cloudflare 지원 요건·근거·신청 초안](docs/cloudflare-startup-readiness.md)
- [Cloudflare 프런트엔드 배포 및 전환 절차](docs/cloudflare-deployment.md)

샘플 체험은 고객 데이터나 자동 최적화 결과가 아닙니다. 실제 조건 검증을 재현하기 위한 가상 근무표이며 기존 저장 데이터를 수정하지 않습니다.

## Development

```bash
npm ci
npm run dev
npm test
npm run build
```

[개발 구조와 작업 지침](CLAUDE.md)을 참고하세요. 현재 자동 생성 서버는 별도 AWS API이며 이 저장소에 Python solver 구현이 포함되어 있지 않습니다.
