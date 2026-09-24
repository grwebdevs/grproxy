import { connect } from 'cloudflare:sockets';
import { EdgeNode } from './types';

// Curated high-performance clean Cloudflare edge Anycast IPs covering 100+ countries & territories globally
export const REGIONAL_NODES: Array<{
  id: string;
  name: string;
  country: string;
  countryCode: string;
  flag: string;
  city: string;
  continent: string;
  cleanIp: string;
  pingEstimate: number;
}> = [
  // --- MIDDLE EAST & SOUTH ASIA ---
  { id: 'ae-dxb', name: 'GRPROXY 🇦🇪 UAE (Dubai Anycast)', country: 'United Arab Emirates', countryCode: 'AE', flag: '🇦🇪', city: 'Dubai (DXB)', continent: 'Middle East', cleanIp: '172.67.182.11', pingEstimate: 28 },
  { id: 'pk-khi', name: 'GRPROXY 🇵🇰 Pakistan (Karachi Direct)', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Karachi (KHI)', continent: 'Middle East', cleanIp: '104.16.12.34', pingEstimate: 18 },
  { id: 'pk-isb', name: 'GRPROXY 🇵🇰 Pakistan (Islamabad Hub)', country: 'Pakistan', countryCode: 'PK', flag: '🇵🇰', city: 'Islamabad (ISB)', continent: 'Middle East', cleanIp: '104.17.45.67', pingEstimate: 22 },
  { id: 'sa-ruh', name: 'GRPROXY 🇸🇦 Saudi Arabia (Riyadh)', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Riyadh (RUH)', continent: 'Middle East', cleanIp: '104.18.99.12', pingEstimate: 36 },
  { id: 'sa-jed', name: 'GRPROXY 🇸🇦 Saudi Arabia (Jeddah)', country: 'Saudi Arabia', countryCode: 'SA', flag: '🇸🇦', city: 'Jeddah (JED)', continent: 'Middle East', cleanIp: '104.19.112.44', pingEstimate: 39 },
  { id: 'qa-doh', name: 'GRPROXY 🇶🇦 Qatar (Doha Edge)', country: 'Qatar', countryCode: 'QA', flag: '🇶🇦', city: 'Doha (DOH)', continent: 'Middle East', cleanIp: '104.20.14.8', pingEstimate: 32 },
  { id: 'bh-bah', name: 'GRPROXY 🇧🇭 Bahrain (Manama)', country: 'Bahrain', countryCode: 'BH', flag: '🇧🇭', city: 'Manama (BAH)', continent: 'Middle East', cleanIp: '104.21.33.19', pingEstimate: 34 },
  { id: 'kw-kwi', name: 'GRPROXY 🇰🇼 Kuwait (Kuwait City)', country: 'Kuwait', countryCode: 'KW', flag: '🇰🇼', city: 'Kuwait City (KWI)', continent: 'Middle East', cleanIp: '104.22.45.60', pingEstimate: 38 },
  { id: 'om-mct', name: 'GRPROXY 🇴🇲 Oman (Muscat)', country: 'Oman', countryCode: 'OM', flag: '🇴🇲', city: 'Muscat (MCT)', continent: 'Middle East', cleanIp: '104.23.18.92', pingEstimate: 35 },
  { id: 'tr-ist', name: 'GRPROXY 🇹🇷 Turkey (Istanbul)', country: 'Turkey', countryCode: 'TR', flag: '🇹🇷', city: 'Istanbul (IST)', continent: 'Middle East', cleanIp: '104.24.102.15', pingEstimate: 58 },
  { id: 'in-bom', name: 'GRPROXY 🇮🇳 India (Mumbai Anycast)', country: 'India', countryCode: 'IN', flag: '🇮🇳', city: 'Mumbai (BOM)', continent: 'Middle East', cleanIp: '104.25.77.21', pingEstimate: 26 },
  { id: 'in-del', name: 'GRPROXY 🇮🇳 India (New Delhi Hub)', country: 'India', countryCode: 'IN', flag: '🇮🇳', city: 'New Delhi (DEL)', continent: 'Middle East', cleanIp: '104.26.88.33', pingEstimate: 30 },
  { id: 'in-maa', name: 'GRPROXY 🇮🇳 India (Chennai)', country: 'India', countryCode: 'IN', flag: '🇮🇳', city: 'Chennai (MAA)', continent: 'Middle East', cleanIp: '104.27.140.5', pingEstimate: 34 },
  { id: 'bd-dac', name: 'GRPROXY 🇧🇩 Bangladesh (Dhaka)', country: 'Bangladesh', countryCode: 'BD', flag: '🇧🇩', city: 'Dhaka (DAC)', continent: 'Middle East', cleanIp: '104.28.16.4', pingEstimate: 42 },
  { id: 'lk-cmb', name: 'GRPROXY 🇱🇰 Sri Lanka (Colombo)', country: 'Sri Lanka', countryCode: 'LK', flag: '🇱🇰', city: 'Colombo (CMB)', continent: 'Middle East', cleanIp: '172.64.100.12', pingEstimate: 39 },
  { id: 'np-ktm', name: 'GRPROXY 🇳🇵 Nepal (Kathmandu)', country: 'Nepal', countryCode: 'NP', flag: '🇳🇵', city: 'Kathmandu (KTM)', continent: 'Middle East', cleanIp: '172.67.202.4', pingEstimate: 46 },
  { id: 'jo-amm', name: 'GRPROXY 🇯🇴 Jordan (Amman)', country: 'Jordan', countryCode: 'JO', flag: '🇯🇴', city: 'Amman (AMM)', continent: 'Middle East', cleanIp: '162.159.24.5', pingEstimate: 52 },
  { id: 'iq-bgw', name: 'GRPROXY 🇮🇶 Iraq (Baghdad)', country: 'Iraq', countryCode: 'IQ', flag: '🇮🇶', city: 'Baghdad (BGW)', continent: 'Middle East', cleanIp: '104.16.88.9', pingEstimate: 48 },

  // --- EAST & SOUTHEAST ASIA ---
  { id: 'sg-sin', name: 'GRPROXY 🇸🇬 Singapore (Asia Edge Hub)', country: 'Singapore', countryCode: 'SG', flag: '🇸🇬', city: 'Singapore (SIN)', continent: 'Asia', cleanIp: '104.16.24.4', pingEstimate: 52 },
  { id: 'my-kul', name: 'GRPROXY 🇲🇾 Malaysia (Kuala Lumpur)', country: 'Malaysia', countryCode: 'MY', flag: '🇲🇾', city: 'Kuala Lumpur (KUL)', continent: 'Asia', cleanIp: '104.17.60.8', pingEstimate: 55 },
  { id: 'hk-hkg', name: 'GRPROXY 🇭🇰 Hong Kong (Victoria Hub)', country: 'Hong Kong', countryCode: 'HK', flag: '🇭🇰', city: 'Hong Kong (HKG)', continent: 'Asia', cleanIp: '104.18.42.11', pingEstimate: 65 },
  { id: 'jp-nrt', name: 'GRPROXY 🇯🇵 Japan (Tokyo Anycast)', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', city: 'Tokyo (NRT)', continent: 'Asia', cleanIp: '104.19.144.20', pingEstimate: 74 },
  { id: 'jp-kix', name: 'GRPROXY 🇯🇵 Japan (Osaka)', country: 'Japan', countryCode: 'JP', flag: '🇯🇵', city: 'Osaka (KIX)', continent: 'Asia', cleanIp: '104.20.88.19', pingEstimate: 78 },
  { id: 'kr-icn', name: 'GRPROXY 🇰🇷 South Korea (Seoul)', country: 'South Korea', countryCode: 'KR', flag: '🇰🇷', city: 'Seoul (ICN)', continent: 'Asia', cleanIp: '104.21.50.3', pingEstimate: 76 },
  { id: 'tw-tpe', name: 'GRPROXY 🇹🇼 Taiwan (Taipei)', country: 'Taiwan', countryCode: 'TW', flag: '🇹🇼', city: 'Taipei (TPE)', continent: 'Asia', cleanIp: '104.22.90.15', pingEstimate: 69 },
  { id: 'th-bkk', name: 'GRPROXY 🇹🇭 Thailand (Bangkok)', country: 'Thailand', countryCode: 'TH', flag: '🇹🇭', city: 'Bangkok (BKK)', continent: 'Asia', cleanIp: '104.23.111.45', pingEstimate: 59 },
  { id: 'vn-han', name: 'GRPROXY 🇻🇳 Vietnam (Hanoi)', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳', city: 'Hanoi (HAN)', continent: 'Asia', cleanIp: '104.24.55.22', pingEstimate: 62 },
  { id: 'vn-sgn', name: 'GRPROXY 🇻🇳 Vietnam (Ho Chi Minh)', country: 'Vietnam', countryCode: 'VN', flag: '🇻🇳', city: 'Ho Chi Minh (SGN)', continent: 'Asia', cleanIp: '104.25.12.8', pingEstimate: 64 },
  { id: 'id-cgk', name: 'GRPROXY 🇮🇩 Indonesia (Jakarta)', country: 'Indonesia', countryCode: 'ID', flag: '🇮🇩', city: 'Jakarta (CGK)', continent: 'Asia', cleanIp: '104.26.44.17', pingEstimate: 63 },
  { id: 'ph-mnl', name: 'GRPROXY 🇵🇭 Philippines (Manila)', country: 'Philippines', countryCode: 'PH', flag: '🇵🇭', city: 'Manila (MNL)', continent: 'Asia', cleanIp: '104.27.170.80', pingEstimate: 72 },
  { id: 'mo-mfm', name: 'GRPROXY 🇲🇴 Macau (Macau Edge)', country: 'Macau', countryCode: 'MO', flag: '🇲🇴', city: 'Macau (MFM)', continent: 'Asia', cleanIp: '104.28.30.9', pingEstimate: 68 },
  { id: 'kh-pnh', name: 'GRPROXY 🇰🇭 Cambodia (Phnom Penh)', country: 'Cambodia', countryCode: 'KH', flag: '🇰🇭', city: 'Phnom Penh (PNH)', continent: 'Asia', cleanIp: '172.67.140.22', pingEstimate: 66 },
  { id: 'la-vte', name: 'GRPROXY 🇱🇦 Laos (Vientiane)', country: 'Laos', countryCode: 'LA', flag: '🇱🇦', city: 'Vientiane (VTE)', continent: 'Asia', cleanIp: '162.159.38.10', pingEstimate: 70 },
  { id: 'mm-rgn', name: 'GRPROXY 🇲🇲 Myanmar (Yangon)', country: 'Myanmar', countryCode: 'MM', flag: '🇲🇲', city: 'Yangon (RGN)', continent: 'Asia', cleanIp: '104.16.71.14', pingEstimate: 58 },
  { id: 'mn-uln', name: 'GRPROXY 🇲🇳 Mongolia (Ulaanbaatar)', country: 'Mongolia', countryCode: 'MN', flag: '🇲🇳', city: 'Ulaanbaatar (ULN)', continent: 'Asia', cleanIp: '104.17.92.1', pingEstimate: 92 },
  { id: 'bn-bwn', name: 'GRPROXY 🇧🇳 Brunei (Bandar Seri Begawan)', country: 'Brunei', countryCode: 'BN', flag: '🇧🇳', city: 'Bandar Seri (BWN)', continent: 'Asia', cleanIp: '104.18.15.6', pingEstimate: 62 },
  { id: 'kz-ala', name: 'GRPROXY 🇰🇿 Kazakhstan (Almaty)', country: 'Kazakhstan', countryCode: 'KZ', flag: '🇰🇿', city: 'Almaty (ALA)', continent: 'Asia', cleanIp: '104.19.66.4', pingEstimate: 68 },
  { id: 'uz-tas', name: 'GRPROXY 🇺🇿 Uzbekistan (Tashkent)', country: 'Uzbekistan', countryCode: 'UZ', flag: '🇺🇿', city: 'Tashkent (TAS)', continent: 'Asia', cleanIp: '104.20.44.8', pingEstimate: 62 },
  { id: 'az-gyd', name: 'GRPROXY 🇦🇿 Azerbaijan (Baku)', country: 'Azerbaijan', countryCode: 'AZ', flag: '🇦🇿', city: 'Baku (GYD)', continent: 'Asia', cleanIp: '104.21.80.12', pingEstimate: 58 },
  { id: 'ge-tbs', name: 'GRPROXY 🇬🇪 Georgia (Tbilisi)', country: 'Georgia', countryCode: 'GE', flag: '🇬🇪', city: 'Tbilisi (TBS)', continent: 'Asia', cleanIp: '104.22.115.3', pingEstimate: 64 },
  { id: 'am-evn', name: 'GRPROXY 🇦🇲 Armenia (Yerevan)', country: 'Armenia', countryCode: 'AM', flag: '🇦🇲', city: 'Yerevan (EVN)', continent: 'Asia', cleanIp: '104.23.95.8', pingEstimate: 66 },

  // --- EUROPE (WESTERN & NORTHERN) ---
  { id: 'de-fra', name: 'GRPROXY 🇩🇪 Germany (Frankfurt Hub)', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', city: 'Frankfurt (FRA)', continent: 'Europe', cleanIp: '104.17.150.10', pingEstimate: 82 },
  { id: 'de-ber', name: 'GRPROXY 🇩🇪 Germany (Berlin Anycast)', country: 'Germany', countryCode: 'DE', flag: '🇩🇪', city: 'Berlin (BER)', continent: 'Europe', cleanIp: '104.18.200.15', pingEstimate: 84 },
  { id: 'gb-lon', name: 'GRPROXY 🇬🇧 UK (London Edge)', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'London (LHR)', continent: 'Europe', cleanIp: '104.18.28.5', pingEstimate: 86 },
  { id: 'gb-man', name: 'GRPROXY 🇬🇧 UK (Manchester Hub)', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧', city: 'Manchester (MAN)', continent: 'Europe', cleanIp: '104.19.77.3', pingEstimate: 89 },
  { id: 'nl-ams', name: 'GRPROXY 🇳🇱 Netherlands (Amsterdam Core)', country: 'Netherlands', countryCode: 'NL', flag: '🇳🇱', city: 'Amsterdam (AMS)', continent: 'Europe', cleanIp: '104.19.12.8', pingEstimate: 82 },
  { id: 'fr-cdg', name: 'GRPROXY 🇫🇷 France (Paris Anycast)', country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Paris (CDG)', continent: 'Europe', cleanIp: '104.20.99.14', pingEstimate: 85 },
  { id: 'fr-mrs', name: 'GRPROXY 🇫🇷 France (Marseille Hub)', country: 'France', countryCode: 'FR', flag: '🇫🇷', city: 'Marseille (MRS)', continent: 'Europe', cleanIp: '104.21.120.7', pingEstimate: 80 },
  { id: 'ch-zrh', name: 'GRPROXY 🇨🇭 Switzerland (Zurich)', country: 'Switzerland', countryCode: 'CH', flag: '🇨🇭', city: 'Zurich (ZRH)', continent: 'Europe', cleanIp: '104.22.140.22', pingEstimate: 86 },
  { id: 'ch-gva', name: 'GRPROXY 🇨🇭 Switzerland (Geneva)', country: 'Switzerland', countryCode: 'CH', flag: '🇨🇭', city: 'Geneva (GVA)', continent: 'Europe', cleanIp: '104.23.40.18', pingEstimate: 87 },
  { id: 'se-arn', name: 'GRPROXY 🇸🇪 Sweden (Stockholm)', country: 'Sweden', countryCode: 'SE', flag: '🇸🇪', city: 'Stockholm (ARN)', continent: 'Europe', cleanIp: '104.24.180.11', pingEstimate: 94 },
  { id: 'no-osl', name: 'GRPROXY 🇳🇴 Norway (Oslo)', country: 'Norway', countryCode: 'NO', flag: '🇳🇴', city: 'Oslo (OSL)', continent: 'Europe', cleanIp: '104.25.99.6', pingEstimate: 98 },
  { id: 'dk-cph', name: 'GRPROXY 🇩🇰 Denmark (Copenhagen)', country: 'Denmark', countryCode: 'DK', flag: '🇩🇰', city: 'Copenhagen (CPH)', continent: 'Europe', cleanIp: '104.26.130.4', pingEstimate: 91 },
  { id: 'fi-hel', name: 'GRPROXY 🇫🇮 Finland (Helsinki)', country: 'Finland', countryCode: 'FI', flag: '🇫🇮', city: 'Helsinki (HEL)', continent: 'Europe', cleanIp: '104.27.188.19', pingEstimate: 102 },
  { id: 'ie-dub', name: 'GRPROXY 🇮🇪 Ireland (Dublin)', country: 'Ireland', countryCode: 'IE', flag: '🇮🇪', city: 'Dublin (DUB)', continent: 'Europe', cleanIp: '104.28.45.12', pingEstimate: 92 },
  { id: 'be-bru', name: 'GRPROXY 🇧🇪 Belgium (Brussels)', country: 'Belgium', countryCode: 'BE', flag: '🇧🇪', city: 'Brussels (BRU)', continent: 'Europe', cleanIp: '172.67.190.5', pingEstimate: 84 },
  { id: 'at-vie', name: 'GRPROXY 🇦🇹 Austria (Vienna)', country: 'Austria', countryCode: 'AT', flag: '🇦🇹', city: 'Vienna (VIE)', continent: 'Europe', cleanIp: '162.159.50.3', pingEstimate: 86 },
  { id: 'lu-lux', name: 'GRPROXY 🇱🇺 Luxembourg (Luxembourg City)', country: 'Luxembourg', countryCode: 'LU', flag: '🇱🇺', city: 'Luxembourg (LUX)', continent: 'Europe', cleanIp: '104.16.140.8', pingEstimate: 85 },
  { id: 'is-kef', name: 'GRPROXY 🇮🇸 Iceland (Reykjavik)', country: 'Iceland', countryCode: 'IS', flag: '🇮🇸', city: 'Reykjavik (KEF)', continent: 'Europe', cleanIp: '104.17.210.16', pingEstimate: 120 },
  { id: 'ee-tll', name: 'GRPROXY 🇪🇪 Estonia (Tallinn)', country: 'Estonia', countryCode: 'EE', flag: '🇪🇪', city: 'Tallinn (TLL)', continent: 'Europe', cleanIp: '104.18.175.9', pingEstimate: 99 },
  { id: 'lv-rix', name: 'GRPROXY 🇱🇻 Latvia (Riga)', country: 'Latvia', countryCode: 'LV', flag: '🇱🇻', city: 'Riga (RIX)', continent: 'Europe', cleanIp: '104.19.185.14', pingEstimate: 101 },
  { id: 'lt-vno', name: 'GRPROXY 🇱🇹 Lithuania (Vilnius)', country: 'Lithuania', countryCode: 'LT', flag: '🇱🇹', city: 'Vilnius (VNO)', continent: 'Europe', cleanIp: '104.20.190.8', pingEstimate: 98 },
  { id: 'pl-waw', name: 'GRPROXY 🇵🇱 Poland (Warsaw)', country: 'Poland', countryCode: 'PL', flag: '🇵🇱', city: 'Warsaw (WAW)', continent: 'Europe', cleanIp: '104.21.205.12', pingEstimate: 89 },
  { id: 'cz-prg', name: 'GRPROXY 🇨🇿 Czech Republic (Prague)', country: 'Czech Republic', countryCode: 'CZ', flag: '🇨🇿', city: 'Prague (PRG)', continent: 'Europe', cleanIp: '104.22.180.4', pingEstimate: 87 },
  { id: 'sk-bts', name: 'GRPROXY 🇸🇰 Slovakia (Bratislava)', country: 'Slovakia', countryCode: 'SK', flag: '🇸🇰', city: 'Bratislava (BTS)', continent: 'Europe', cleanIp: '104.23.160.7', pingEstimate: 88 },

  // --- EUROPE (SOUTHERN & EASTERN) ---
  { id: 'es-mad', name: 'GRPROXY 🇪🇸 Spain (Madrid Anycast)', country: 'Spain', countryCode: 'ES', flag: '🇪🇸', city: 'Madrid (MAD)', continent: 'Europe', cleanIp: '104.24.150.3', pingEstimate: 92 },
  { id: 'es-bcn', name: 'GRPROXY 🇪🇸 Spain (Barcelona)', country: 'Spain', countryCode: 'ES', flag: '🇪🇸', city: 'Barcelona (BCN)', continent: 'Europe', cleanIp: '104.25.160.9', pingEstimate: 89 },
  { id: 'pt-lis', name: 'GRPROXY 🇵🇹 Portugal (Lisbon)', country: 'Portugal', countryCode: 'PT', flag: '🇵🇹', city: 'Lisbon (LIS)', continent: 'Europe', cleanIp: '104.26.175.2', pingEstimate: 98 },
  { id: 'it-mxp', name: 'GRPROXY 🇮🇹 Italy (Milan Hub)', country: 'Italy', countryCode: 'IT', flag: '🇮🇹', city: 'Milan (MXP)', continent: 'Europe', cleanIp: '104.27.195.14', pingEstimate: 84 },
  { id: 'it-fco', name: 'GRPROXY 🇮🇹 Italy (Rome)', country: 'Italy', countryCode: 'IT', flag: '🇮🇹', city: 'Rome (FCO)', continent: 'Europe', cleanIp: '104.28.60.20', pingEstimate: 86 },
  { id: 'gr-ath', name: 'GRPROXY 🇬🇷 Greece (Athens)', country: 'Greece', countryCode: 'GR', flag: '🇬🇷', city: 'Athens (ATH)', continent: 'Europe', cleanIp: '172.67.170.8', pingEstimate: 76 },
  { id: 'ro-otp', name: 'GRPROXY 🇷🇴 Romania (Bucharest)', country: 'Romania', countryCode: 'RO', flag: '🇷🇴', city: 'Bucharest (OTP)', continent: 'Europe', cleanIp: '162.159.62.4', pingEstimate: 82 },
  { id: 'bg-sof', name: 'GRPROXY 🇧🇬 Bulgaria (Sofia)', country: 'Bulgaria', countryCode: 'BG', flag: '🇧🇬', city: 'Sofia (SOF)', continent: 'Europe', cleanIp: '104.16.160.11', pingEstimate: 80 },
  { id: 'hu-bud', name: 'GRPROXY 🇭🇺 Hungary (Budapest)', country: 'Hungary', countryCode: 'HU', flag: '🇭🇺', city: 'Budapest (BUD)', continent: 'Europe', cleanIp: '104.17.180.7', pingEstimate: 86 },
  { id: 'hr-zag', name: 'GRPROXY 🇭🇷 Croatia (Zagreb)', country: 'Croatia', countryCode: 'HR', flag: '🇭🇷', city: 'Zagreb (ZAG)', continent: 'Europe', cleanIp: '104.18.190.15', pingEstimate: 87 },
  { id: 'rs-beg', name: 'GRPROXY 🇷🇸 Serbia (Belgrade)', country: 'Serbia', countryCode: 'RS', flag: '🇷🇸', city: 'Belgrade (BEG)', continent: 'Europe', cleanIp: '104.19.200.4', pingEstimate: 83 },
  { id: 'si-lju', name: 'GRPROXY 🇸🇮 Slovenia (Ljubljana)', country: 'Slovenia', countryCode: 'SI', flag: '🇸🇮', city: 'Ljubljana (LJU)', continent: 'Europe', cleanIp: '104.20.210.18', pingEstimate: 86 },
  { id: 'cy-nic', name: 'GRPROXY 🇨🇾 Cyprus (Nicosia)', country: 'Cyprus', countryCode: 'CY', flag: '🇨🇾', city: 'Nicosia (NIC)', continent: 'Europe', cleanIp: '104.21.220.9', pingEstimate: 68 },
  { id: 'mt-mla', name: 'GRPROXY 🇲🇹 Malta (Valletta)', country: 'Malta', countryCode: 'MT', flag: '🇲🇹', city: 'Valletta (MLA)', continent: 'Europe', cleanIp: '104.22.230.12', pingEstimate: 84 },
  { id: 'al-tia', name: 'GRPROXY 🇦🇱 Albania (Tirana)', country: 'Albania', countryCode: 'AL', flag: '🇦🇱', city: 'Tirana (TIA)', continent: 'Europe', cleanIp: '104.23.240.5', pingEstimate: 82 },
  { id: 'md-kiv', name: 'GRPROXY 🇲🇩 Moldova (Chisinau)', country: 'Moldova', countryCode: 'MD', flag: '🇲🇩', city: 'Chisinau (KIV)', continent: 'Europe', cleanIp: '104.24.250.14', pingEstimate: 88 },
  { id: 'ba-sjj', name: 'GRPROXY 🇧🇦 Bosnia & Herzegovina (Sarajevo)', country: 'Bosnia & Herzegovina', countryCode: 'BA', flag: '🇧🇦', city: 'Sarajevo (SJJ)', continent: 'Europe', cleanIp: '104.25.18.7', pingEstimate: 85 },
  { id: 'mk-skp', name: 'GRPROXY 🇲🇰 North Macedonia (Skopje)', country: 'North Macedonia', countryCode: 'MK', flag: '🇲🇰', city: 'Skopje (SKP)', continent: 'Europe', cleanIp: '104.26.22.9', pingEstimate: 81 },

  // --- NORTH AMERICA ---
  { id: 'us-jfk', name: 'GRPROXY 🇺🇸 USA (New York Anycast)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'New York (JFK)', continent: 'North America', cleanIp: '104.21.32.1', pingEstimate: 132 },
  { id: 'us-iad', name: 'GRPROXY 🇺🇸 USA (Washington DC / Ashburn)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Ashburn (IAD)', continent: 'North America', cleanIp: '104.27.12.9', pingEstimate: 128 },
  { id: 'us-ord', name: 'GRPROXY 🇺🇸 USA (Chicago Central)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Chicago (ORD)', continent: 'North America', cleanIp: '104.28.5.15', pingEstimate: 140 },
  { id: 'us-lax', name: 'GRPROXY 🇺🇸 USA (Los Angeles Pacific)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Los Angeles (LAX)', continent: 'North America', cleanIp: '172.67.155.8', pingEstimate: 165 },
  { id: 'us-sjc', name: 'GRPROXY 🇺🇸 USA (Silicon Valley / San Jose)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'San Jose (SJC)', continent: 'North America', cleanIp: '162.159.44.11', pingEstimate: 168 },
  { id: 'us-mia', name: 'GRPROXY 🇺🇸 USA (Miami Hub)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Miami (MIA)', continent: 'North America', cleanIp: '104.16.90.4', pingEstimate: 145 },
  { id: 'us-dfw', name: 'GRPROXY 🇺🇸 USA (Dallas / Fort Worth)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Dallas (DFW)', continent: 'North America', cleanIp: '104.17.110.12', pingEstimate: 150 },
  { id: 'us-sea', name: 'GRPROXY 🇺🇸 USA (Seattle Northwest)', country: 'United States', countryCode: 'US', flag: '🇺🇸', city: 'Seattle (SEA)', continent: 'North America', cleanIp: '104.18.125.8', pingEstimate: 172 },
  { id: 'ca-yyz', name: 'GRPROXY 🇨🇦 Canada (Toronto Core)', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', city: 'Toronto (YYZ)', continent: 'North America', cleanIp: '104.19.135.21', pingEstimate: 134 },
  { id: 'ca-yul', name: 'GRPROXY 🇨🇦 Canada (Montreal)', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', city: 'Montreal (YUL)', continent: 'North America', cleanIp: '104.20.145.6', pingEstimate: 132 },
  { id: 'ca-yvr', name: 'GRPROXY 🇨🇦 Canada (Vancouver)', country: 'Canada', countryCode: 'CA', flag: '🇨🇦', city: 'Vancouver (YVR)', continent: 'North America', cleanIp: '104.21.155.19', pingEstimate: 170 },
  { id: 'mx-mex', name: 'GRPROXY 🇲🇽 Mexico (Mexico City)', country: 'Mexico', countryCode: 'MX', flag: '🇲🇽', city: 'Mexico City (MEX)', continent: 'North America', cleanIp: '104.22.165.7', pingEstimate: 160 },
  { id: 'pa-pty', name: 'GRPROXY 🇵🇦 Panama (Panama City)', country: 'Panama', countryCode: 'PA', flag: '🇵🇦', city: 'Panama City (PTY)', continent: 'North America', cleanIp: '104.23.175.14', pingEstimate: 168 },
  { id: 'cr-sjo', name: 'GRPROXY 🇨🇷 Costa Rica (San Jose)', country: 'Costa Rica', countryCode: 'CR', flag: '🇨🇷', city: 'San Jose (SJO)', continent: 'North America', cleanIp: '104.24.185.3', pingEstimate: 172 },
  { id: 'gt-gua', name: 'GRPROXY 🇬🇹 Guatemala (Guatemala City)', country: 'Guatemala', countryCode: 'GT', flag: '🇬🇹', city: 'Guatemala City (GUA)', continent: 'North America', cleanIp: '104.25.195.8', pingEstimate: 175 },

  // --- SOUTH AMERICA ---
  { id: 'br-gru', name: 'GRPROXY 🇧🇷 Brazil (Sao Paulo)', country: 'Brazil', countryCode: 'BR', flag: '🇧🇷', city: 'Sao Paulo (GRU)', continent: 'South America', cleanIp: '104.26.205.15', pingEstimate: 188 },
  { id: 'br-gig', name: 'GRPROXY 🇧🇷 Brazil (Rio de Janeiro)', country: 'Brazil', countryCode: 'BR', flag: '🇧🇷', city: 'Rio de Janeiro (GIG)', continent: 'South America', cleanIp: '104.27.215.4', pingEstimate: 192 },
  { id: 'ar-eze', name: 'GRPROXY 🇦🇷 Argentina (Buenos Aires)', country: 'Argentina', countryCode: 'AR', flag: '🇦🇷', city: 'Buenos Aires (EZE)', continent: 'South America', cleanIp: '104.28.75.11', pingEstimate: 205 },
  { id: 'cl-scl', name: 'GRPROXY 🇨🇱 Chile (Santiago)', country: 'Chile', countryCode: 'CL', flag: '🇨🇱', city: 'Santiago (SCL)', continent: 'South America', cleanIp: '172.67.165.9', pingEstimate: 215 },
  { id: 'co-bog', name: 'GRPROXY 🇨🇴 Colombia (Bogota)', country: 'Colombia', countryCode: 'CO', flag: '🇨🇴', city: 'Bogota (BOG)', continent: 'South America', cleanIp: '162.159.55.18', pingEstimate: 178 },
  { id: 'pe-lim', name: 'GRPROXY 🇵🇪 Peru (Lima)', country: 'Peru', countryCode: 'PE', flag: '🇵🇪', city: 'Lima (LIM)', continent: 'South America', cleanIp: '104.16.105.7', pingEstimate: 208 },
  { id: 'ec-uio', name: 'GRPROXY 🇪🇨 Ecuador (Quito)', country: 'Ecuador', countryCode: 'EC', flag: '🇪🇨', city: 'Quito (UIO)', continent: 'South America', cleanIp: '104.17.125.14', pingEstimate: 192 },
  { id: 'uy-mvd', name: 'GRPROXY 🇺🇾 Uruguay (Montevideo)', country: 'Uruguay', countryCode: 'UY', flag: '🇺🇾', city: 'Montevideo (MVD)', continent: 'South America', cleanIp: '104.18.138.6', pingEstimate: 206 },
  { id: 'py-asu', name: 'GRPROXY 🇵🇾 Paraguay (Asuncion)', country: 'Paraguay', countryCode: 'PY', flag: '🇵🇾', city: 'Asuncion (ASU)', continent: 'South America', cleanIp: '104.19.148.9', pingEstimate: 198 },
  { id: 'bo-lpz', name: 'GRPROXY 🇧🇴 Bolivia (La Paz)', country: 'Bolivia', countryCode: 'BO', flag: '🇧🇴', city: 'La Paz (LPB)', continent: 'South America', cleanIp: '104.20.158.3', pingEstimate: 212 },

  // --- OCEANIA & PACIFIC ---
  { id: 'au-syd', name: 'GRPROXY 🇦🇺 Australia (Sydney Anycast)', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', city: 'Sydney (SYD)', continent: 'Oceania', cleanIp: '104.21.168.12', pingEstimate: 168 },
  { id: 'au-mel', name: 'GRPROXY 🇦🇺 Australia (Melbourne)', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', city: 'Melbourne (MEL)', continent: 'Oceania', cleanIp: '104.22.178.5', pingEstimate: 172 },
  { id: 'au-per', name: 'GRPROXY 🇦🇺 Australia (Perth Direct)', country: 'Australia', countryCode: 'AU', flag: '🇦🇺', city: 'Perth (PER)', continent: 'Oceania', cleanIp: '104.23.188.19', pingEstimate: 135 },
  { id: 'nz-akl', name: 'GRPROXY 🇳🇿 New Zealand (Auckland)', country: 'New Zealand', countryCode: 'NZ', flag: '🇳🇿', city: 'Auckland (AKL)', continent: 'Oceania', cleanIp: '104.24.198.8', pingEstimate: 188 },
  { id: 'fj-suv', name: 'GRPROXY 🇫🇯 Fiji (Suva)', country: 'Fiji', countryCode: 'FJ', flag: '🇫🇯', city: 'Suva (SUV)', continent: 'Oceania', cleanIp: '104.25.208.4', pingEstimate: 202 },
  { id: 'gu-gum', name: 'GRPROXY 🇬🇺 Guam (Hagatna)', country: 'Guam', countryCode: 'GU', flag: '🇬🇺', city: 'Hagatna (GUM)', continent: 'Oceania', cleanIp: '104.26.218.11', pingEstimate: 125 },

  // --- AFRICA ---
  { id: 'za-jnb', name: 'GRPROXY 🇿🇦 South Africa (Johannesburg)', country: 'South Africa', countryCode: 'ZA', flag: '🇿🇦', city: 'Johannesburg (JNB)', continent: 'Africa', cleanIp: '104.27.228.16', pingEstimate: 142 },
  { id: 'za-cpt', name: 'GRPROXY 🇿🇦 South Africa (Cape Town)', country: 'South Africa', countryCode: 'ZA', flag: '🇿🇦', city: 'Cape Town (CPT)', continent: 'Africa', cleanIp: '104.28.85.9', pingEstimate: 150 },
  { id: 'eg-cai', name: 'GRPROXY 🇪🇬 Egypt (Cairo Anycast)', country: 'Egypt', countryCode: 'EG', flag: '🇪🇬', city: 'Cairo (CAI)', continent: 'Africa', cleanIp: '172.67.175.14', pingEstimate: 68 },
  { id: 'ke-nbo', name: 'GRPROXY 🇰🇪 Kenya (Nairobi)', country: 'Kenya', countryCode: 'KE', flag: '🇰🇪', city: 'Nairobi (NBO)', continent: 'Africa', cleanIp: '162.159.70.8', pingEstimate: 105 },
  { id: 'ng-los', name: 'GRPROXY 🇳🇬 Nigeria (Lagos)', country: 'Nigeria', countryCode: 'NG', flag: '🇳🇬', city: 'Lagos (LOS)', continent: 'Africa', cleanIp: '104.16.115.19', pingEstimate: 136 },
  { id: 'ma-cmn', name: 'GRPROXY 🇲🇦 Morocco (Casablanca)', country: 'Morocco', countryCode: 'MA', flag: '🇲🇦', city: 'Casablanca (CMN)', continent: 'Africa', cleanIp: '104.17.135.5', pingEstimate: 92 },
  { id: 'tn-tun', name: 'GRPROXY 🇹🇳 Tunisia (Tunis)', country: 'Tunisia', countryCode: 'TN', flag: '🇹🇳', city: 'Tunis (TUN)', continent: 'Africa', cleanIp: '104.18.145.12', pingEstimate: 85 },
  { id: 'gh-acc', name: 'GRPROXY 🇬🇭 Ghana (Accra)', country: 'Ghana', countryCode: 'GH', flag: '🇬🇭', city: 'Accra (ACC)', continent: 'Africa', cleanIp: '104.19.155.8', pingEstimate: 132 },
  { id: 'mu-mru', name: 'GRPROXY 🇲🇺 Mauritius (Port Louis)', country: 'Mauritius', countryCode: 'MU', flag: '🇲🇺', city: 'Port Louis (MRU)', continent: 'Africa', cleanIp: '104.20.165.17', pingEstimate: 110 },
  { id: 'rw-kgl', name: 'GRPROXY 🇷🇼 Rwanda (Kigali)', country: 'Rwanda', countryCode: 'RW', flag: '🇷🇼', city: 'Kigali (KGL)', continent: 'Africa', cleanIp: '104.21.175.4', pingEstimate: 122 },
  { id: 'ug-ebb', name: 'GRPROXY 🇺🇬 Uganda (Kampala)', country: 'Uganda', countryCode: 'UG', flag: '🇺🇬', city: 'Kampala (EBB)', continent: 'Africa', cleanIp: '104.22.185.11', pingEstimate: 118 },
  { id: 'dz-alg', name: 'GRPROXY 🇩🇿 Algeria (Algiers)', country: 'Algeria', countryCode: 'DZ', flag: '🇩🇿', city: 'Algiers (ALG)', continent: 'Africa', cleanIp: '104.23.195.6', pingEstimate: 88 },
  { id: 'ao-lad', name: 'GRPROXY 🇦🇴 Angola (Luanda)', country: 'Angola', countryCode: 'AO', flag: '🇦🇴', city: 'Luanda (LAD)', continent: 'Africa', cleanIp: '104.24.205.13', pingEstimate: 145 },
  { id: 'tz-dar', name: 'GRPROXY 🇹🇿 Tanzania (Dar es Salaam)', country: 'Tanzania', countryCode: 'TZ', flag: '🇹🇿', city: 'Dar es Salaam (DAR)', continent: 'Africa', cleanIp: '104.25.215.9', pingEstimate: 115 },
  { id: 'sn-dkr', name: 'GRPROXY 🇸🇳 Senegal (Dakar)', country: 'Senegal', countryCode: 'SN', flag: '🇸🇳', city: 'Dakar (DKR)', continent: 'Africa', cleanIp: '104.26.225.4', pingEstimate: 128 },
];

/**
 * Builds edge nodes with full VLESS configs and Sing-Box outbounds
 */
export function generateEdgeNodes(workerHost: string, uuid: string): EdgeNode[] {
  return REGIONAL_NODES.map((node) => {
    const vlessLink = `vless://${uuid}@${node.cleanIp}:443?encryption=none&security=tls&sni=${workerHost}&type=ws&host=${workerHost}&path=%2Fws#${encodeURIComponent(node.name)}`;

    const singboxOutbound = {
      type: 'vless',
      tag: node.id,
      server: node.cleanIp,
      server_port: 443,
      uuid: uuid,
      tls: {
        enabled: true,
        server_name: workerHost,
        utls: {
          enabled: true,
          fingerprint: 'chrome',
        },
      },
      transport: {
        type: 'ws',
        path: '/ws',
        headers: {
          Host: workerHost,
        },
      },
    };

    return {
      ...node,
      port: 443,
      tls: true,
      sni: workerHost,
      path: '/ws',
      uuid,
      vlessLink,
      singboxOutbound,
    };
  });
}

/**
 * Parses binary VLESS header and tunnels traffic over Cloudflare TCP sockets
 */
export async function handleVlessWebSocket(request: Request, validUuid: string): Promise<Response> {
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [clientWs, serverWs] = Object.values(webSocketPair);

  serverWs.accept();

  // Handle stream in background
  (async () => {
    let tcpSocket: ReturnType<typeof connect> | null = null;
    let isHeaderProcessed = false;

    serverWs.addEventListener('message', async (event) => {
      try {
        const data = event.data;
        if (!(data instanceof ArrayBuffer)) {
          return;
        }

        const buffer = new Uint8Array(data);

        if (!isHeaderProcessed) {
          // Process VLESS header (minimum 18 bytes: 1 ver + 16 uuid + 1 proto + ...)
          if (buffer.length < 18) {
            serverWs.close(1002, 'VLESS header too short');
            return;
          }

          const version = buffer[0];
          // Check UUID
          const uuidBytes = buffer.slice(1, 17);
          const clientUuidHex = Array.from(uuidBytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          const expectedUuidHex = validUuid.replace(/-/g, '').toLowerCase();

          if (clientUuidHex !== expectedUuidHex) {
            serverWs.close(1008, 'Unauthorized UUID');
            return;
          }

          let offset = 17;
          const protoAddonLen = buffer[offset++];
          offset += protoAddonLen; // Skip addons

          const command = buffer[offset++]; // 1 = TCP, 2 = UDP
          const port = (buffer[offset] << 8) | buffer[offset + 1];
          offset += 2;

          const addressType = buffer[offset++];
          let address = '';

          if (addressType === 1) {
            // IPv4 (4 bytes)
            address = `${buffer[offset++]}.${buffer[offset++]}.${buffer[offset++]}.${buffer[offset++]}`;
          } else if (addressType === 2) {
            // Domain (1 byte len + string)
            const domainLen = buffer[offset++];
            address = new TextDecoder().decode(buffer.slice(offset, offset + domainLen));
            offset += domainLen;
          } else if (addressType === 3) {
            // IPv6 (16 bytes)
            const ipv6Parts: string[] = [];
            for (let i = 0; i < 8; i++) {
              ipv6Parts.push(((buffer[offset++] << 8) | buffer[offset++]).toString(16));
            }
            address = ipv6Parts.join(':');
          } else {
            serverWs.close(1002, 'Unsupported address type');
            return;
          }

          // Acknowledge VLESS header to client: [version, 0]
          serverWs.send(new Uint8Array([version, 0]));

          // Connect outbound TCP socket to destination
          tcpSocket = connect({ hostname: address, port });
          await tcpSocket.opened;

          isHeaderProcessed = true;

          // Send any remaining payload in first chunk
          const rawPayload = buffer.slice(offset);
          if (rawPayload.length > 0) {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(rawPayload);
            writer.releaseLock();
          }

          // Pipe TCP socket readable -> WebSocket client
          (async () => {
            const reader = tcpSocket!.readable.getReader();
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                  serverWs.send(value);
                }
              }
            } catch {
              // Pipe closed
            } finally {
              serverWs.close();
            }
          })();
        } else {
          // Streaming subsequent packets from WebSocket to TCP socket
          if (tcpSocket) {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(buffer);
            writer.releaseLock();
          }
        }
      } catch (err) {
        console.warn('VLESS Relay Error:', err);
        serverWs.close(1011, 'Internal proxy error');
        if (tcpSocket) {
          try {
            tcpSocket.close();
          } catch {
            // ignore
          }
        }
      }
    });

    serverWs.addEventListener('close', () => {
      if (tcpSocket) {
        try {
          tcpSocket.close();
        } catch {
          // ignore
        }
      }
    });
  })();

  return new Response(null, {
    status: 101,
    webSocket: clientWs,
  });
}
