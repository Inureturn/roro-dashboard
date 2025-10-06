// Internationalization (i18n) support
// Supports English and Korean

export const translations = {
  en: {
    // Header
    title: 'RoRo Fleet Dashboard',
    totalVessels: 'Total Vessels:',
    active: 'Active:',
    lastUpdate: 'Last Update:',

    // Sidebar
    fleet: 'Fleet',
    allVessels: 'All Vessels',
    myFleet: 'My Fleet',
    competitors: 'Competitors',
    searchPlaceholder: 'Search vessels...',

    // Vessel status
    noData: 'No Data',
    activeStatus: 'Active',
    lastSeen: 'Last seen > 1h',

    // Vessel details
    vesselDetails: 'Vessel Details',
    vesselInformation: 'Vessel Information',
    name: 'Name',
    mmsi: 'MMSI',
    imo: 'IMO',
    callSign: 'Call Sign',
    type: 'Type',
    dimensions: 'Dimensions',
    length: 'Length',
    beam: 'Beam',
    draught: 'Draught',
    currentPosition: 'Current Position',
    latitude: 'Latitude',
    longitude: 'Longitude',
    speed: 'Speed',
    course: 'Course',
    heading: 'Heading',
    status: 'Status',
    voyage: 'Voyage',
    destination: 'Destination',
    operator: 'Operator',

    // System info modal
    systemInfo: 'System Information',
    dataCollection: 'Data Collection',
    rateLimit: 'Rate Limit:',
    rateLimitValue: '100m or 180s (smart filtering)',
    updates: 'Updates:',
    updatesValue: '~10,000 positions/day',
    accuracy: 'Accuracy:',
    accuracyValue: '1 football field (100m)',
    dataRetention: 'Data Retention',
    keep: 'Keep:',
    keepValue: 'Last 90 days of positions',
    cleanup: 'Cleanup:',
    cleanupValue: 'Runs daily at 2am',
    storage: 'Storage:',
    performance: 'Performance',
    viewRefresh: 'View Refresh:',
    viewRefreshValue: 'Every 5 minutes',
    realtime: 'Real-time:',
    realtimeValue: 'Instant position updates',
    trailLength: 'Trail Length:',
    trailLengthValue: 'Last 50 positions',

    // Warnings
    staleDataWarning: 'Data may be outdated. Last AIS update received more than 5 minutes ago.',
    noVessels: 'No vessels found',
    loading: 'Loading vessels...',
    noVesselsYet: 'No vessels in database yet. Waiting for AIS data...',
    checkBack: 'The ingestor is collecting data. Check back in 5-10 minutes.',
    errorLoading: 'Error loading vessels. Check browser console.',

    // Units
    knots: 'knots',
    meters: 'm',
    degrees: '°',

    // Common
    unknown: 'Unknown',
    na: 'N/A',
    never: 'Never'
  },

  ko: {
    // Header
    title: 'RoRo 선단 대시보드',
    totalVessels: '총 선박:',
    active: '활성:',
    lastUpdate: '마지막 업데이트:',

    // Sidebar
    fleet: '선단',
    allVessels: '모든 선박',
    myFleet: '내 선단',
    competitors: '경쟁사',
    searchPlaceholder: '선박 검색...',

    // Vessel status
    noData: '데이터 없음',
    activeStatus: '활성',
    lastSeen: '1시간 이상 전',

    // Vessel details
    vesselDetails: '선박 상세정보',
    vesselInformation: '선박 정보',
    name: '선명',
    mmsi: 'MMSI',
    imo: 'IMO',
    callSign: '호출 부호',
    type: '선종',
    dimensions: '제원',
    length: '전장',
    beam: '선폭',
    draught: '흘수',
    currentPosition: '현재 위치',
    latitude: '위도',
    longitude: '경도',
    speed: '속력',
    course: '침로',
    heading: '선수 방향',
    status: '상태',
    voyage: '항해',
    destination: '목적지',
    operator: '운항사',

    // System info modal
    systemInfo: '시스템 정보',
    dataCollection: '데이터 수집',
    rateLimit: '수집 제한:',
    rateLimitValue: '100m 또는 180초 (스마트 필터링)',
    updates: '업데이트:',
    updatesValue: '하루 약 10,000 위치',
    accuracy: '정확도:',
    accuracyValue: '축구장 1개 크기 (100m)',
    dataRetention: '데이터 보관',
    keep: '보관 기간:',
    keepValue: '최근 90일간 위치 정보',
    cleanup: '정리:',
    cleanupValue: '매일 새벽 2시 실행',
    storage: '저장 공간:',
    performance: '성능',
    viewRefresh: '뷰 새로고침:',
    viewRefreshValue: '5분마다',
    realtime: '실시간:',
    realtimeValue: '즉시 위치 업데이트',
    trailLength: '항적 길이:',
    trailLengthValue: '최근 50개 위치',

    // Warnings
    staleDataWarning: '데이터가 오래되었을 수 있습니다. 마지막 AIS 업데이트가 5분 이상 전입니다.',
    noVessels: '선박을 찾을 수 없습니다',
    loading: '선박 로딩 중...',
    noVesselsYet: '아직 데이터베이스에 선박이 없습니다. AIS 데이터를 기다리는 중...',
    checkBack: '인제스터가 데이터를 수집하고 있습니다. 5-10분 후에 다시 확인하세요.',
    errorLoading: '선박 로딩 오류. 브라우저 콘솔을 확인하세요.',

    // Units
    knots: '노트',
    meters: 'm',
    degrees: '°',

    // Common
    unknown: '알 수 없음',
    na: '해당 없음',
    never: '없음'
  }
};

// Get browser language preference
export function getBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage;
  // If Korean, return 'ko', otherwise default to 'en'
  return lang.startsWith('ko') ? 'ko' : 'en';
}

// Get translation
export function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Get current language from localStorage or browser
export function getCurrentLanguage() {
  return localStorage.getItem('language') || getBrowserLanguage();
}

// Set language
export function setLanguage(lang) {
  localStorage.setItem('language', lang);
  window.location.reload(); // Reload to apply changes
}
