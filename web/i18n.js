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
    manualDataTitle: 'My Fleet: Position Data Manually Fetched',
    manualDataMessage: 'Your fleet positions were scraped from VesselFinder and may be outdated. Real-time tracking coming with satellite view. (Competitor vessels are tracked in real-time)',
    manualDataShort: 'My fleet manually fetched - satellite tracking coming soon',

    // Vessel status
    unknown: 'Unknown',
    unknownVessel: 'Unknown Vessel',
    na: 'N/A',
    never: 'Never',
    noData: 'No Data',
    activeStatus: 'Active now',
    lastSeen: 'Last seen',
  neverSeen: 'Never recorded',
  neverTracked: 'NEVER TRACKED',
  seeDetails: 'See details',

    // Time units
    justNow: 'just now',
    minuteAgo: 'min ago',
    minutesAgo: 'mins ago',
    hourAgo: 'hour ago',
    hoursAgo: 'hours ago',
    dayAgo: 'day ago',
    daysAgo: 'days ago',
    monthAgo: 'month ago',
    monthsAgo: 'months ago',
    yearAgo: 'year ago',
    yearsAgo: 'years ago',

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
    currentStatus: '📊 Current Status',
    fleetTracking: 'My Fleet Tracking:',
    fleetTrackingValue: 'Manual (VesselFinder)',
    competitorTracking: 'Competitor Tracking:',
    competitorTrackingValue: 'Real-time AIS',
    dataSource: 'Data Source:',
    dataSourceValue: 'Terrestrial AIS + Manual Fetch',
    updateFrequency: 'Update Frequency:',
    updateFrequencyValue: '30 seconds (live)',
    knownLimitations: '⚠️ Known Limitations',
    myFleetPositions: 'My Fleet Positions:',
    myFleetPositionsValue: 'Manually scraped, may be outdated',
    aisGaps: 'AIS Coverage:',
    aisGapsValue: 'Some vessels don\'t transmit AIS',
    positionAge: 'Position Age:',
    positionAgeValue: 'Check "Last seen" timestamps',
    upcomingFeatures: '🚀 Roadmap',
    satelliteView: 'Satellite AIS:',
    satelliteViewValue: 'Global coverage with satellite AIS',
    routePrediction: 'Route Prediction:',
    routePredictionValue: 'AI-powered ETA calculations',
    weatherOverlay: 'Weather Integration:',
    weatherOverlayValue: 'Live weather overlays on map',
    alerts: 'Custom Alerts:',
    alertsValue: 'Notifications for arrival/departure',
    technicalDetails: '🔧 Technical Details',
    mapProvider: 'Map Provider:',
    mapProviderValue: 'MapTiler (100K loads/month free)',
    database: 'Database:',
    databaseValue: 'Supabase PostgreSQL',
    dataRetention: 'Data Retention:',
    dataRetentionValue: '90 days of position history',
    refreshRate: 'Auto Refresh:',
    refreshRateValue: 'Every 30 seconds'
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
    manualDataTitle: '내 선단: 위치 데이터 수동 수집됨',
    manualDataMessage: '귀하의 선단 위치는 VesselFinder에서 스크랩되었으며 오래되었을 수 있습니다. 위성 뷰로 실시간 추적이 곧 제공됩니다. (경쟁사 선박은 실시간 추적됨)',
    manualDataShort: '내 선단 수동 수집 - 위성 추적 곧 제공',

    // Vessel status
    unknown: '알 수 없음',
    unknownVessel: '알 수 없는 선박',
    na: '해당 없음',
    never: '없음',
    noData: '데이터 없음',
    activeStatus: '활성 중',
    lastSeen: '마지막 확인',
  neverSeen: '기록 없음',
  neverTracked: '기록 없음',
  seeDetails: '상세 보기',

    // Time units
    justNow: '방금',
    minuteAgo: '분 전',
    minutesAgo: '분 전',
    hourAgo: '시간 전',
    hoursAgo: '시간 전',
    dayAgo: '일 전',
    daysAgo: '일 전',
    monthAgo: '개월 전',
    monthsAgo: '개월 전',
    yearAgo: '년 전',
    yearsAgo: '년 전',

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
    currentStatus: '📊 현재 상태',
    fleetTracking: '내 선단 추적:',
    fleetTrackingValue: '수동 (VesselFinder)',
    competitorTracking: '경쟁사 추적:',
    competitorTrackingValue: '실시간 AIS',
    dataSource: '데이터 소스:',
    dataSourceValue: '지상 AIS + 수동 수집',
    updateFrequency: '업데이트 빈도:',
    updateFrequencyValue: '30초 (실시간)',
    knownLimitations: '⚠️ 알려진 제한사항',
    myFleetPositions: '내 선단 위치:',
    myFleetPositionsValue: '수동 스크랩, 오래되었을 수 있음',
    aisGaps: 'AIS 범위:',
    aisGapsValue: '일부 선박은 AIS 송신 안 함',
    positionAge: '위치 갱신 시간:',
    positionAgeValue: '"마지막 확인" 시간 확인 필요',
    upcomingFeatures: '🚀 로드맵',
    satelliteView: '위성 AIS:',
    satelliteViewValue: '위성 AIS로 전 세계 커버리지',
    routePrediction: '경로 예측:',
    routePredictionValue: 'AI 기반 도착 예정 시간 계산',
    weatherOverlay: '날씨 통합:',
    weatherOverlayValue: '지도에 실시간 날씨 오버레이',
    alerts: '맞춤 알림:',
    alertsValue: '도착/출발 알림',
    technicalDetails: '🔧 기술 세부사항',
    mapProvider: '지도 제공:',
    mapProviderValue: 'MapTiler (월 10만회 무료)',
    database: '데이터베이스:',
    databaseValue: 'Supabase PostgreSQL',
    dataRetention: '데이터 보관:',
    dataRetentionValue: '90일간 위치 기록',
    refreshRate: '자동 새로고침:',
    refreshRateValue: '30초마다'
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
  // Default to Korean when no stored preference
  return 'ko';
}

// Set language
export function setLanguage(lang) {
  if (translations[lang]) {
    localStorage.setItem('language', lang);
  }
}
