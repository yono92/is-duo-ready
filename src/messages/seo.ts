import type { Locale } from '@/lib/directory/types';

type PageCopy = { title: string; description: string };
type SeoCopy = {
  home: PageCopy;
  updates: PageCopy;
  methodology: PageCopy;
  submit: PageCopy;
  fixtureDescription: string;
  appTitle: string;
  appDescription: string;
  image: { headline: string; description: string; alt: string; features: string[] };
};

// Edit SEO copy here. Domain/indexing safety switches stay in deployment environment variables.
// See docs/seo.md. All strings are plain text; {name} is the app-name placeholder.
export const seoConfig = {
  siteName: 'Is Duo Ready?',
  productionOrigin: 'https://is-duo-ready.vercel.app',
  imageVersion: '2', // Increment after changing image copy/design to refresh its URL.
  verification: { google: '', naver: '', bing: '' },
  locales: {
    ko: {
      home: {
        title: 'Is Duo Ready? — 아이폰 듀오 앱 지원 현황',
        description:
          '한국 앱스토어의 아이폰 듀오 앱 지원 여부를 찾아보세요. 앱별 지원 상태와 공식 자료, 지원 확인 버전, 최근 변경 내용을 확인할 수 있습니다.',
      },
      updates: {
        title: '최근 지원 업데이트',
        description: '아이폰 듀오 앱 지원 상태의 변경 내역과 공개된 근거를 확인하세요.',
      },
      methodology: {
        title: '지원 안내',
        description:
          '아이폰 듀오 앱의 지원 상태를 어떻게 구분하는지, 어떤 공식 자료와 한국 앱스토어 정보를 확인하는지 안내합니다.',
      },
      submit: {
        title: '앱 추가·정보 수정 제보',
        description:
          '아이폰 듀오 앱 목록에 추가할 앱이나 수정할 정보를 공식 출처와 함께 알려주세요.',
      },
      fixtureDescription:
        '아이폰 듀오 앱 지원 현황의 개발용 미리보기입니다. 표시된 앱과 지원 상태는 가상 예시입니다.',
      appTitle: '{name} — 아이폰 듀오 지원 현황',
      appDescription: '{name}의 아이폰 듀오 지원 상태와 공식 자료, 지원 확인 버전을 확인하세요.',
      image: {
        headline: '아이폰 듀오\n앱 지원 현황',
        description: '앱별 지원 상태와 공식 근거를 한곳에서.',
        features: ['지원 상태', '공식 출처', '변경 이력'],
        alt: 'Is Duo Ready? — 아이폰 듀오 앱 지원 현황. 두 패널과 체크 표시로 구성한 파란 브랜드 심볼.',
      },
    },
    en: {
      home: {
        title: 'Is Duo Ready? — iPhone Duo app support',
        description:
          'Find iPhone Duo app support in the South Korea App Store. Check each app’s support status, official sources, supported version and recent changes.',
      },
      updates: {
        title: 'Recent support updates',
        description:
          'Follow changes to iPhone Duo app support and the published sources behind each update.',
      },
      methodology: {
        title: 'About support status',
        description:
          'Learn how iPhone Duo app support is classified and which official sources and South Korea App Store information we check.',
      },
      submit: {
        title: 'Suggest an app or correction',
        description:
          'Suggest an app for the iPhone Duo directory or a correction, with an official source.',
      },
      fixtureDescription:
        'A development preview of iPhone Duo app support. The apps and support labels shown are fictional examples.',
      appTitle: '{name} — iPhone Duo support',
      appDescription:
        'Check {name}’s iPhone Duo support status, official sources and supported version.',
      image: {
        headline: 'iPhone Duo\napp support',
        description: 'App support and official sources, in one place.',
        features: ['Support status', 'Official sources', 'Recent updates'],
        alt: 'Is Duo Ready? — iPhone Duo app support. Original blue brand symbol with two panels and a check mark.',
      },
    },
  } satisfies Record<Locale, SeoCopy>,
};
