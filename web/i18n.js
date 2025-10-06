// Internationalization (i18n) support
// Supports English and Korean

export const translations = {
  en: {
    // Header
    title: '🚢 RoRo Fleet Dashboard',
    totalVessels: 'Total Vessels:',
    active: 'Active:',
    lastUpdate: 'Last Update:',
    themeToLight: 'Switch to light mode',
    themeToDark: 'Switch to dark mode',
    switchLanguageToKorean: 'Switch to Korean',
    switchLanguageToEnglish: 'Switch to English',
    systemInfoButton: 'System Info',

    // Sidebar
    fleet: 'Fleet',
    myFleet: 'My Fleet',
    allTracked: 'All Tracked',
    competitors: 'Competitors',
    searchPlaceholder: 'Search vessels...',
    loading: 'Loading vessels...',
    noVesselsYet: 'No vessels in database yet. Waiting for AIS data...',
    checkBack: 'The ingestor is collecting data. Check back in 5-10 minutes.',
    errorLoading: 'Error loading vessels. Check browser console.',
    noVessels: 'No vessels found',

    // Warnings
    staleDataWarning: '⚠️ Data may be outdated. Last AIS update received more than 5 minutes ago.',
    selectVessel: 'Select a vessel to view details',

    // Vessel status
    unknown: 'Unknown',
    unknownVessel: 'Unknown Vessel',
    na: 'N/A',
    never: 'Never',
    noData: 'No Data',
    activeStatus: 'Active',
    lastSeen: 'Last seen > 1h',

    // Units
    knotsAbbr: 'kn',
    meters: 'm',
    degrees: '°',

    // Vessel details
    vesselDetails: 'Vessel Details',
    vesselInformation: 'Vessel Information',
    name: 'Name',
    mmsi: 'MMSI',
    imo: 'IMO',
    callSign: 'Call Sign',
    type: 'Type',
    flag: 'Flag',
    operator: 'Operator',
    operatorGroup: 'Operator Group',
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
    lastUpdateLabel: 'Last Update',
    lastMessage: 'Last Message',
    voyage: 'Voyage',
    destination: 'Destination',
    eta: 'ETA',
    notes: 'Notes',
    etaInHours: 'ETA {hours}h',
    etaInDays: 'ETA {days}d',

    // System info modal
    systemInfo: 'System Information',
    dataCollection: '📡 Data Collection',
    rateLimit: 'Rate Limit:',
    rateLimitValue: '100m or 180s (smart filtering)',
    updates: 'Updates:',
    updatesValue: '~10,000 positions/day',
    accuracy: 'Accuracy:',
    accuracyValue: '1 football field (100m)',
    dataRetention: '🗄️ Data Retention',
    keep: 'Keep:',
    keepValue: 'Last 90 days of positions',
    cleanup: 'Cleanup:',
    cleanupValue: 'Runs daily at 2am',
    storage: 'Storage:',
    performance: '⚡ Performance',
    viewRefresh: 'View Refresh:',
    viewRefreshValue: 'Every 5 minutes',
    realtime: 'Real-time:',
    realtimeValue: 'Instant position updates',
    trailLength: 'Trail Length:',
    trailLengthValue: 'Last 50 positions'
  },

  ko: {
    // Header
    title: '🚢 RoRo 선단 대시보드',
    totalVessels: '총 선박:',
    active: '활성:',
    lastUpdate: '마지막 업데이트:',
    themeToLight: '라이트 모드로 전환',
    themeToDark: '다크 모드로 전환',
    switchLanguageToKorean: '한국어로 전환',
    switchLanguageToEnglish: '영어로 전환',
    systemInfoButton: '시스템 정보',

    // Sidebar
    fleet: '선단',
    myFleet: '내 선단',
    allTracked: '전체 추적',
    competitors: '경쟁사',
    searchPlaceholder: '선박 검색...',
    loading: '선박 로딩 중...',
    noVesselsYet: '아직 데이터베이스에 선박이 없습니다. AIS 데이터를 기다리는 중...',
    checkBack: '인제스터가 데이터를 수집하고 있습니다. 5-10분 후에 다시 확인하세요.',
    errorLoading: '선박을 불러오는 중 오류가 발생했습니다. 브라우저 콘솔을 확인하세요.',
    noVessels: '선박을 찾을 수 없습니다',

    // Warnings
    staleDataWarning: '⚠️ 데이터가 오래되었을 수 있습니다. 마지막 AIS 업데이트가 5분 이상 지났습니다.',
    selectVessel: '상세 정보를 보려면 선박을 선택하세요',

    // Vessel status
    unknown: '알 수 없음',
    unknownVessel: '알 수 없는 선박',
    na: '해당 없음',
    never: '없음',
    noData: '데이터 없음',
    activeStatus: '활성',
    lastSeen: '1시간 이상 전',

    // Units
    knotsAbbr: '노트',
    meters: 'm',
    degrees: '°',

    // Vessel details
    vesselDetails: '선박 상세정보',
    vesselInformation: '선박 정보',
    name: '선명',
    mmsi: 'MMSI',
    imo: 'IMO',
    callSign: '호출 부호',
    type: '선종',
    flag: '국적',
    operator: '운항사',
    operatorGroup: '운항 그룹',
    dimensions: '제원',
    length: '전장',
    beam: '선폭',
    draught: '흘수',
    currentPosition: '현재 위치',
    latitude: '위도',
    longitude: '경도',
    speed: '속력',
    course: '침로',
    heading: '선수방향',
    status: '상태',
    lastUpdateLabel: '마지막 업데이트',
    lastMessage: '마지막 수신',
    voyage: '항해',
    destination: '목적지',
    eta: '도착 예정',
    notes: '메모',
    etaInHours: 'ETA {hours}시간',
    etaInDays: 'ETA {days}일',

    // System info modal
    systemInfo: '시스템 정보',
    dataCollection: '📡 데이터 수집',
    rateLimit: '수집 제한:',
    rateLimitValue: '100m 또는 180초 (스마트 필터링)',
    updates: '업데이트:',
    updatesValue: '하루 약 10,000 위치',
    accuracy: '정확도:',
    accuracyValue: '축구장 1개 크기 (100m)',
    dataRetention: '🗄️ 데이터 보관',
    keep: '보관 기간:',
    keepValue: '최근 90일간 위치 정보',
    cleanup: '정리:',
    cleanupValue: '매일 새벽 2시 실행',
    storage: '저장 공간:',
    performance: '⚡ 성능',
    viewRefresh: '뷰 새로고침:',
    viewRefreshValue: '5분마다',
    realtime: '실시간:',
    realtimeValue: '즉시 위치 업데이트',
    trailLength: '항적 길이:',
    trailLengthValue: '최근 50개 위치'
  }
};

export const SUPPORTED_LANGUAGES = Object.keys(translations);

// Get browser language preference
export function getBrowserLanguage() {
  const lang = navigator.language || navigator.userLanguage || 'en';
  // If Korean, return 'ko', otherwise default to 'en'
  return lang.startsWith('ko') ? 'ko' : 'en';
}

// Get translation
export function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// Get current language from localStorage or browser
export function getCurrentLanguage() {
  const stored = localStorage.getItem('language');
  if (stored && translations[stored]) {
    return stored;
  }
  return getBrowserLanguage();
}

// Set language
export function setLanguage(lang) {
  if (translations[lang]) {
    localStorage.setItem('language', lang);
  }
}
