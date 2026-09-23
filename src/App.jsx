import ChecklistGroup from './components/ChecklistGroup';
import EventCard from './components/EventCard';
import TemplatesPage from './components/TemplatesPage';
import { amsterdamDays, amsterdamDepartureEvents, amsterdamStay } from './data/amsterdam-itinerary';
import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
const DayRouteMap = lazy(() => import('./components/DayRouteMap'));
import { Link, Route, Routes, useLocation } from 'react-router-dom';

const bookingAccessByProvider = {
  lotus: {
    url: 'https://www.lotuscarrental.is/client/manage',
    links: [
      { label: '取车指引', url: 'https://assist.lotuscarrental.is/help/pickup' },
      { label: '上车点视频', url: 'https://shuttle.lotuscarrental.is/' },
    ],
    credentials: [
      { label: '登录邮箱', value: 'W********@gmail.com' },
      { label: '预订号', value: '155816' },
      { label: '接驳车电话（按 1）', value: '+354 787 4444' },
    ],
  },
  hertz: {
    url: 'https://www.hertz.com/rentacar/reservation/?confirmationNumber=L52108732E4#review',
    credentials: [
      { label: '姓氏拼音', value: 'C**' },
      { label: '预订号', value: 'L52108732E4' },
      { label: 'Svolvær 门店电话', value: '+47 9747 9000' },
    ],
  },
  hurtigruten: {
        url: 'https://www.hurtigruten.com/en/my-booking/login',
        credentials: [
          { label: '登录邮箱', value: 'L************@gmail.com' },
          { label: '预订号', value: '2330704' },
        ],
      },
};

const currentJourney = {
  startsOn: '2026-09-24',
  endsOn: '2026-10-07',
  itineraryEndsOn: '2026-10-06',
  destinations: ['Netherlands', 'Iceland', 'Norway'],
};

const journeySectionLabels = { '2026-09-25': '荷兰', '2026-09-28': '冰岛', '2026-10-01': '挪威' };

const infoPanels = {
  transport: {
    label: '交通',
    title: '交通信息',
  },
  stay: {
    label: '住宿',
    title: '住宿信息',
  },
};

const transportRecords = [
  {
    id: 'outbound-flight',
    kind: '航班',
    startsOn: '2026-09-24',
    endsOn: '2026-09-25',
    title: '香港 → 阿姆斯特丹',
    legs: [
      { code: '中华航空 CI916 · 托运 2×23kg / 手提 7kg', from: 'HKG', to: 'TPE', depart: '17:35', arrive: '19:25' },
      { code: '中华航空 CI073 · 托运 2×23kg / 手提 7kg', from: 'TPE', to: 'AMS', depart: '22:50', arrive: '07:40' },
    ],
    connection: '台北中转 3 小时 25 分；无需重新托运行李，无需过境签',
  },
  {
    id: 'ams-kef-flight',
    kind: '航班',
    startsOn: '2026-09-27',
    endsOn: '2026-09-27',
    title: '阿姆斯特丹 → 雷克雅未克',
    legs: [
      { code: '荷兰泛航空 HV6885 · 托运 25kg', from: 'AMS', to: 'KEF', depart: '17:00', arrive: '18:15' },
    ],
  },
  {
    id: 'kef-svj-flight',
    kind: '航班',
    startsOn: '2026-10-01',
    endsOn: '2026-10-01',
    title: '雷克雅未克 → 斯沃尔韦尔',
    legs: [
      { code: '北欧航空 SK4786 · 托运 23kg / 手提 8kg', from: 'KEF', to: 'OSL', depart: '08:40', arrive: '13:20' },
      { code: '北欧航空 SK4116 · 托运 23kg / 手提 8kg', from: 'OSL', to: 'BOO', depart: '15:40', arrive: '17:05' },
      { code: '威德罗航空 WF836 · 托运 23kg / 手提 8kg', from: 'BOO', to: 'SVJ', depart: '20:25', arrive: '20:50' },
    ],
    connections: [
      '奥斯陆中转 2 小时 20 分；行李直达博多',
      '博多中转 3 小时 20 分；需要重新托运行李',
    ],
  },
  {
    id: 'tos-osl-flight',
    kind: '航班',
    startsOn: '2026-10-05',
    endsOn: '2026-10-05',
    title: '特罗姆瑟 → 奥斯陆',
    legs: [
      { code: '挪威航空 DY385 · 托运 23kg', from: 'TOS', to: 'OSL', depart: '19:50', arrive: '21:45' },
    ],
  },
  {
    id: 'return-flight',
    kind: '航班',
    startsOn: '2026-10-06',
    endsOn: '2026-10-07',
    title: '奥斯陆 → 香港',
    legs: [
      { code: '泰国国际航空 TG955 · 托运 23kg / 手提 7kg', from: 'OSL', to: 'BKK', depart: '13:45', arrive: '06:15' },
      { code: '泰国国际航空 TG600 · 托运 23kg / 手提 7kg', from: 'BKK', to: 'HKG', depart: '08:00', arrive: '11:45' },
    ],
    connection: '曼谷中转 1 小时 45 分，时间较紧；无需重新托运行李，无需过境签',
  },
];

function getTransportEventFields(recordId) {
  const record = transportRecords.find((item) => item.id === recordId);

  if (!record) throw new Error(`Missing transport record: ${recordId}`);

  return {
    transportRecordId: record.id,
    title: record.title,
    flightLegs: record.legs,
    flightConnections: record.connections ?? (record.connection ? [record.connection] : undefined),
  };
}

const stayRecords = [
  amsterdamStay,
  {
    id: 'iceland-stay',
    startsOn: '2026-09-27',
    endsOn: '2026-09-30',
    title: '雷克雅未克住宿',
    navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
    checkIn: '09.27 15:00 后',
    checkOut: '09.30 14:00 前',
    reservation: '在 Airbnb 查看',
    note: 'Airbnb｜钥匙盒自助入住，指南与 Wi‑Fi 于入住前 48 小时显示｜楼外免费停车，车位充足',
  },
  {
    id: 'airport-stay',
    startsOn: '2026-09-30',
    endsOn: '2026-09-30',
    title: '机场住宿',
    navigation: 'Keflavík International Airport, 235 Keflavík, Iceland',
    checkIn: '09.30 22:00',
    checkOut: '退房时间待补充',
    reservation: '查看预订确认信息',
    note: '住在 Keflavík International Airport，便于次日早班机；具体住宿设施与退房方式待补充',
  },
  {
    id: 'henningsvaer-stay',
    startsOn: '2026-10-01',
    endsOn: '2026-10-03',
    title: '罗弗敦住宿',
    navigation: 'Misværveien 2, 8312 Henningsvær, Norway',
    checkIn: '10.01 15:00 后',
    checkOut: '10.03 11:00 前',
    reservation: '在 Airbnb 查看',
    note: 'Airbnb｜房东亲自迎接，需提前联系 Øystein｜提供停车位',
  },
  {
    id: 'hurtigruten-stay',
    startsOn: '2026-10-03',
    endsOn: '2026-10-04',
    title: '游轮住宿',
    navigation: 'Torget 22, 8300 Svolvær, Norway',
    addressLabel: '集合地点',
    checkIn: '10.03 22:15（至少提前 15 分钟到港）',
    checkOut: '10.04 14:15',
    reservation: '在 Hurtigruten 预订邮件中查看',
    note: 'Hurtigruten 官网｜Svolvær → Tromsø｜船上住宿',
  },
  {
    id: 'tromso-stay',
    startsOn: '2026-10-04',
    endsOn: '2026-10-05',
    title: '特罗姆瑟住宿',
    navigation: 'Scandic Ishavshotel',
    addressLabel: '酒店名称',
    checkIn: '10.04 16:00 后',
    checkOut: '10.05 12:00 前',
    reservation: '在 Agoda 查看',
    note: 'Agoda｜前台入住，订单在 Agoda 查看',
  },
  {
    id: 'oslo-stay',
    startsOn: '2026-10-05',
    endsOn: '2026-10-06',
    title: '奥斯陆住宿',
    navigation: 'Radisson Hotel & Conference Centre Oslo Airport',
    addressLabel: '酒店名称',
    checkIn: '10.05 15:00 — 18:30',
    checkOut: '10.06 06:00 — 11:30',
    reservation: '在 Booking.com 查看',
    note: 'Booking.com｜Radisson Hotel & Conference Centre Oslo Airport，Standard Room，1 人｜到店支付 1,435.50 NOK',
  },
];

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getJourneyDayCount(journey) {
  const start = dateFromKey(journey.startsOn);
  const end = dateFromKey(journey.endsOn);
  return Math.round((end - start) / 86400000) + 1;
}

function createJourneyDates(journey) {
  const start = dateFromKey(journey.startsOn);

  return Array.from({ length: getJourneyDayCount(journey) }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      label: `${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`,
    };
  });
}

const journeyDates = createJourneyDates({
  ...currentJourney,
  endsOn: currentJourney.itineraryEndsOn,
});

const placeholderEventTypes = [
  {
    type: '交通',
    title: '交通名称待补充',
    detail: '补充班次、上车地点、换乘方式，以及这一段需要特别注意的信息。',
    reservationStatus: '已预定',
    paymentStatus: '已付款',
    reservation: {
      reference: '查看预订确认信息',
      time: '使用时间待补充',
      instruction: '取票或使用方式待补充',
    },
  },
  {
    type: '住宿',
    title: '住宿名称待补充',
    detail: '用容易辨认的说明补充入住地点、入住方式和住宿相关注意事项。',
    navigation: '住宿导航地址待补充',
    reservationStatus: '已预定',
    paymentStatus: '未付款',
    reservation: {
      reference: '查看预订确认信息',
      time: '入住时间待补充',
      instruction: '入住凭证与门禁方式待补充',
    },
  },
  {
    type: '行程',
    title: '官方地点名称待补充',
    detail: '这里用熟悉的语言说明地点是什么、为什么前往，以及到达后需要做什么。',
    navigation: '地点导航地址待补充',
    reservationStatus: '未预定',
  },
  {
    type: '行程',
    title: '自由活动待补充',
    detail: '不需要预定或付款的普通行程也保留相同的信息节奏，之后可以继续补充说明。',
  },
];

const placeholderEventSchedule = [
  ['06:00', '07:00'],
  ['07:15', '08:00'],
  ['08:20', '09:10'],
  ['09:30', '10:30'],
  ['10:45', '11:30'],
  ['12:00', '13:00'],
  ['13:15', '14:00'],
  ['14:10', '15:00'],
  ['15:15', '16:00'],
  ['16:10', '17:00'],
  ['17:15', '18:00'],
  ['18:10', '19:00'],
  ['19:10', '20:00'],
  ['20:15', '21:00'],
  ['21:10', '21:45'],
  ['22:00', '22:30'],
  ['22:40', '23:10'],
  ['23:20', '23:50'],
];

const placeholderDayEvents = Array.from({ length: 18 }, (_, index) => ({
  id: `event-${index + 1}`,
  ...placeholderEventTypes[index % placeholderEventTypes.length],
  startsAt: placeholderEventSchedule[index][0],
  endsAt: placeholderEventSchedule[index][1],
}));

const journeyDayEvents = {
  '2026-09-24': [
    {
      id: 'sep24-hkg-tpe-ams',
      type: '交通',
      ...getTransportEventFields('outbound-flight'),
      startsAt: '17:35',
      endsAt: '23:59',
      displayEndsAt: '07:40 +1',
      detail: "航段：CI916 香港 → 台北；CI073 台北 → 阿姆斯特丹，09.25 07:40 抵达。\n中转：台北 3 小时 25 分；行李直挂，无需过境签。\n行李：每人托运 2×23kg，手提 7kg。",
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'CI916 / CI073',
        time: '09.24 17:35 — 07:40 +1',
      },
    },
  ],
  ...amsterdamDays,
  '2026-09-27': [
    ...amsterdamDepartureEvents,
    {
      id: 'sep27-ams-kef',
      type: '交通',
      ...getTransportEventFields('ams-kef-flight'),
      startsAt: '17:00',
      endsAt: '18:15',
      detail: "航班：HV6885，17:00 → 18:15。\n舱位：经济舱，无餐食。\n行李：每人托运 25kg。",
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'HV6885',
        time: '09.27 17:00 — 18:15',
      },
    },
    {
      id: 'sep27-lotus-car',
      type: '行程',
      title: 'Lotus Car Rental 取车',
      startsAt: '20:00',
      detail: "车型：Toyota Yaris，自动挡，不限里程。\n取还：09.27 20:00 取车；09.30 20:00 原店还车。\n方案：Silver 与 Platinum (S) + Wi‑Fi。\n到达后致电 +354 787 4444 并按 1 呼叫接驳车；上车点路线见「预定信息」。",
      navigation: 'Flugvellir 6-10, 230 Keflavík, Iceland',
      addressLabel: '取车地址',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Lotus 预订邮件中查看',
        time: '09.27 20:00 — 09.30 20:00',
        instruction: 'KEF 机场取还；总计 53,070 ISK。到达后致电 +354 787 4444 并按 1 呼叫接驳车；取车指引及步行至上车点的视频见下方链接。',
      },
      bookingAccess: bookingAccessByProvider.lotus,
    },
    {
      id: 'sep27-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '21:30',
      detail: "入住：钥匙盒自助办理；提前 48 小时在 Airbnb 查看指南与 Wi‑Fi。\n停车：楼外免费停车。",
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '09.27 15:00 — 09.30 14:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
      },
    },
  ],
  '2026-09-28': [
    {
      id: 'sep28-thingvellir',
      type: '行程',
      title: 'Þingvellir National Park（辛格维利尔国家公园）',
      startsAt: '08:30',
      endsAt: '11:15',
      detail: "板块裂谷、议会旧址；游览约 2 小时。\n08:30 出发，车程约 50 分钟。",
      navigation: 'Þingvellir Visitor Centre, Hakið P1, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-geysir-lunch',
      type: '用餐',
      title: 'Geysir Bistro（盖歇尔游客中心简餐）',
      startsAt: '12:10',
      endsAt: '12:50',
      detail: "游客中心简餐；预留 40 分钟。",
      navigation: 'Geysir Centre, Haukadalur, 806 Bláskógabyggð, Iceland',
      addressLabel: '用餐地址',
    },
    {
      id: 'sep28-geysir',
      type: '行程',
      title: 'Geysir（盖歇尔间歇泉）',
      startsAt: '12:50',
      endsAt: '13:50',
      detail: "Strokkur 间歇泉；游览约 1 小时。",
      navigation: 'Geysir Parking, 806 Bláskógabyggð, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-gullfoss',
      type: '行程',
      title: 'Gullfoss（黄金瀑布）',
      startsAt: '14:10',
      endsAt: '15:40',
      detail: "双层峡谷瀑布；游览约 1.5 小时。返程可选温泉或火山口。",
      navigation: 'Gullfoss falls Car Park, 846 Bláskógabyggð, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-secret-lagoon-optional',
      type: '行程',
      title: 'Secret Lagoon（秘密温泉，可选）',
      startsAt: '16:20',
      endsAt: '18:00',
      detail: "与 Kerið 二选一；停留约 1 小时 40 分。\n提前订票，自带泳衣、毛巾；预计 19:30 返回住宿。",
      navigation: 'Secret Lagoon, Hvammsvegur, 845 Flúðir, Iceland',
      addressLabel: '导航地址',
    },
    {
      id: 'sep28-kerid-optional',
      type: '行程',
      title: 'Kerið（凯瑞斯火山口，可选）',
      startsAt: '16:40',
      endsAt: '17:25',
      detail: "火山口湖；游览约 45 分钟，需购票。与 Secret Lagoon 二选一，时间不足可跳过。",
      navigation: 'Kerið Crater, 805 Grímsnes, Iceland',
      addressLabel: '导航地址',
    },
    {
      id: 'sep28-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '18:35',
      detail: "预计抵达：直接返程 17:30；经 Kerið 18:35；经 Secret Lagoon 19:30。",
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '09.27 15:00 — 09.30 14:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
      },
    },
  ],
  '2026-09-29': [
    {
      id: 'sep29-seljalandsfoss',
      type: '行程',
      title: 'Seljalandsfoss（塞里雅兰瀑布）',
      startsAt: '08:00',
      endsAt: '10:50',
      detail: "瀑布背后步道；游览约 1 小时。\n08:00 出发，车程约 1 小时 50 分。",
      navigation: 'Seljalandsfoss, 861 Hvolsvöllur, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-skogafoss',
      type: '行程',
      title: 'Skógafoss（斯科加瀑布）',
      startsAt: '11:20',
      endsAt: '12:20',
      detail: "瀑布底部观景 → 沿台阶登顶 → 顶部步道。当前预留 1 小时，步道往返长度按时间安排。",
      navigation: 'Skógafoss, 861 Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-solheimajokull',
      type: '行程',
      title: 'Sólheimajökull（索尔黑马冰川）',
      startsAt: '12:50',
      endsAt: '13:50',
      detail: "冰川观景步道，单程约 15–20 分钟；共留 1 小时。仅远观，不自行上冰。",
      navigation: 'Sólheimajökull glacier parking lot, 871 Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-vik-lunch',
      type: '用餐',
      title: 'Black Crust Pizzeria（维克黑披萨）',
      startsAt: '14:25',
      endsAt: '15:25',
      detail: "午餐 1 小时，含排队；用餐较晚，提前备零食。",
      navigation: 'Austurvegur 16, 870 Vík, Iceland',
      addressLabel: '用餐地址',
    },
    {
      id: 'sep29-vik-church',
      type: '行程',
      title: 'Vík í Mýrdal Church（维克红顶教堂）',
      startsAt: '15:35',
      endsAt: '15:55',
      detail: "小镇与海岸全景；停留约 20 分钟。",
      navigation: 'Vík i Myrdal Church, 870 Vík, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-reynisfjara',
      type: '行程',
      title: 'Reynisfjara Beach（雷尼斯黑沙滩）',
      startsAt: '16:15',
      endsAt: '17:05',
      detail: "黑沙滩、玄武岩柱；停留约 50 分钟。遵守封闭告示，远离水线、不背对海浪。",
      navigation: 'Reynisfjara Beach, 871 Vík, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-selfoss-shopping',
      type: '行程',
      title: 'Selfoss（塞尔福斯购物补给）',
      startsAt: '18:35',
      endsAt: '19:15',
      detail: "可选补给：晚餐食材、次日早餐；预留 40 分钟，物资齐全可跳过。",
      navigation: 'Krónan Selfoss, Austurvegur 3, 800 Selfoss, Iceland',
      addressLabel: '购物地址',
    },
    {
      id: 'sep29-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '20:15',
      detail: "Selfoss → 住宿，车程约 1 小时；预计 20:15 抵达。",
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '09.27 15:00 — 09.30 14:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
      },
    },
  ],
  '2026-09-30': [
    {
      id: 'sep30-whale-watching',
      type: '行程',
      title: '雷克雅未克 RIB 观鲸',
      startsAt: '09:00',
      endsAt: '11:00',
      detail: "集合：08:30，Elding 老码头售票处。\n票券：GetYourGuide 电子票；航程约 2 小时。\n准备：保暖衣物；出航以天气、海况为准。",
      navigation: 'Ægisgarður 5, 101 Reykjavík, Iceland',
      addressLabel: '集合地址',
      reservationStatus: '已预定',
      reservation: {
        reference: '在手机 GetYourGuide App 查看票券／二维码',
        time: '09.30 09:00 — 11:00（提前 30 分钟集合）',
        instruction: '提前 30 分钟到 Elding 老码头售票处；出示 GetYourGuide 电子票／二维码，办理登船并签署免责声明。',
      },
    },
    {
      id: 'sep30-homestay-lunch',
      type: '用餐',
      title: 'Kelduland（民宿午餐）',
      startsAt: '11:30',
      endsAt: '12:30',
      detail: '观鲸结束后回民宿吃午餐，吃完再整理行李、退房。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      addressLabel: '用餐地址',
    },
    {
      id: 'sep30-checkout',
      type: '行程',
      title: 'Kelduland（回住宿整理行李、退房）',
      startsAt: '12:30',
      endsAt: '13:30',
      detail: '午餐后整理行李，13:30 退房；最迟 14:00。之后去市区散步。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      addressLabel: '住宿地址',
    },
    {
      id: 'sep30-reykjavik-afternoon',
      type: '行程',
      title: '雷克雅未克市区',
      startsAt: '14:00',
      endsAt: '17:15',
      detail: '退房后逛雷克雅未克市区，沿街散步、喝咖啡，之后在市区吃晚餐。',
      navigation: 'Reykjavík, Iceland',
    },
    {
      id: 'sep30-reykjavik-dinner',
      type: '用餐',
      title: 'Reykjavík（雷克雅未克晚餐）',
      startsAt: '17:15',
      endsAt: '18:15',
      detail: '在雷克雅未克市区吃晚餐，留 1 小时，餐厅待选。18:30 出发前往 Keflavík，20:00 还车。',
      navigation: 'Reykjavík, Iceland',
      addressLabel: '用餐区域（餐厅待选）',
    },
    {
      id: 'sep30-lotus-return',
      bookingAccess: bookingAccessByProvider.lotus,
      type: '行程',
      title: 'Lotus Car Rental 还车',
      startsAt: '20:00',
      detail: "Toyota Yaris 原店归还。\n还车前：检查油量、车况，取走个人物品。",
      navigation: 'Flugvellir 6-10, 230 Keflavík, Iceland',
      addressLabel: '还车地址',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Lotus 预订邮件中查看',
        time: '09.30 20:00',
        instruction: '在 Lotus Car Rental 原门店还车',
      },
    },
    {
      id: 'sep30-airport-stay',
      type: '住宿',
      title: '机场住宿',
      startsAt: '22:00',
      detail: "KEF 机场过夜；住宿设施、退房方式待确认。",
      navigation: 'Keflavík International Airport, 235 Keflavík, Iceland',
    },
  ],
  '2026-10-01': [
    {
      id: 'oct01-kef-svj',
      type: '交通',
      ...getTransportEventFields('kef-svj-flight'),
      startsAt: '08:40',
      endsAt: '20:50',
      detail: "航段：SK4786 → SK4116 → WF836，20:50 抵达 SVJ。\n中转：奥斯陆 2 小时 20 分，行李直达博多；博多 3 小时 20 分，需重新托运。\n行李：每人托运 23kg，手提 8kg。",
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'SK4786 / SK4116 / WF836',
        time: '10.01 08:40 — 20:50',
      },
    },
    {
      id: 'oct01-hertz-car',
      type: '行程',
      title: 'Hertz 取车',
      startsAt: '21:00',
      detail: "车型：Toyota Yaris Cross 4×4，自动挡，不限里程。\n付款：柜台支付 3,859.62 NOK。\n取车已调整为 21:00；航班计划 20:50 抵达，仅预留 10 分钟，若延误请致电门店。",
      navigation: 'Svolvær lufthavn, Helle, 8300 Svolvær, Norway',
      addressLabel: '取车地址',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Hertz 预订邮件中查看',
        time: '10.01 21:00 — 10.03 21:00',
        instruction: 'Svolvær 机场取车、Fiskergata 23 还车；到店支付。门店电话可在下方直接复制。',
      },
      bookingAccess: bookingAccessByProvider.hertz,
    },
    {
      id: 'oct01-drive-henningsvaer',
      type: '交通',
      title: '驾车前往 Henningsvær 住宿',
      startsAt: '取车后',
      detail: "机场 → Henningsvær，沿 E10、Fv816；约 29.4 公里、36 分钟。\n取车后出发；地图终点为渔村参考点，最后一段按住宿地址导航。",
    },
    {
      id: 'oct01-henningsvaer-stay',
      type: '住宿',
      title: '罗弗敦住宿',
      startsAt: '22:00',
      detail: "入住：提前联系 Øystein，房东迎接。\n停车：房源提供车位。",
      navigation: 'Misværveien 2, 8312 Henningsvær, Norway',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '10.01 15:00 — 10.03 11:00',
        instruction: '房东亲自迎接；到达前联系 Øystein',
      },
    },
  ],
  '2026-10-02': [
    {
      id: 'oct02-haukland-beach',
      type: '行程',
      title: 'Haukland Beach（豪克兰翡翠沙滩）',
      startsAt: '09:45',
      endsAt: '10:25',
      detail: "白沙、翡翠色海水；停留 40 分钟。08:30 从住宿出发。",
      navigation: 'Hauklandstranda, 8370 Leknes, Norway',
      addressLabel: '停车导航',
    },
    {
      id: 'oct02-skagsanden',
      type: '行程',
      title: 'Skagsanden Beach（斯卡格桑登海滩 · 顺路可停）',
      startsAt: '11:15',
      endsAt: '11:30',
      detail: "沙纹、海浪与山景；顺路停留 15 分钟，可跳过。",
      navigation: 'Skagsanden Beach, Flakstad, Norway',
    },
    {
      id: 'oct02-ramberg-beach',
      type: '行程',
      title: 'Ramberg Beach（拉姆贝格白沙滩）',
      startsAt: '11:40',
      endsAt: '12:00',
      detail: "白沙滩与海湾；沿木枕步道进入，停留 20 分钟。",
      navigation: 'Rambergstranda, 8380 Ramberg, Norway',
      addressLabel: '停车导航',
    },
    {
      id: 'oct02-hamnoy-bridge',
      photoSpots: [
        { name: 'Reinefjorden Sjøhus', query: 'Reinefjorden Sjøhus, Skagen 41, Hamnøy, Norway', note: '住宿外观机位。' },
        { name: 'Fotospot Hamnoy', query: 'Fotospot Hamnoy, Norway', note: '桥上经典红屋机位。' },
        { name: 'Hamnøy Viewpoint', query: 'Hamnøy Viewpoint, Norway', note: '红屋备选角度，地图落点需比对照片。' },
      ],
      type: '行程',
      title: 'Fotospot Hamnøy（哈姆讷伊红屋观景点）',
      startsAt: '12:30',
      endsAt: '13:00',
      detail: "桥上红色渔屋机位；拍照 30 分钟，另有 2 个备选角度。",
      navigation: 'Hamnøy Bridge, E10, 8390 Reine, Norway',
      addressLabel: '拍照点',
    },
    {
      id: 'oct02-sakrisoy',
      photoSpots: [
        { name: 'Sakrisoy Viewpoint', query: 'Sakrisoy Viewpoint, Norway', note: '黄屋观景机位，地图落点待核实。' },
        { name: 'Olenilsøya kystfort', query: 'Olenilsøya kystfort, Norway', note: '可选山坡机位，需额外步行上坡。' },
        { name: 'Anita’s Seafood', query: 'Anitas Sjømat, Sakrisøy, Norway', note: '午餐店旁拍黄屋，有顾客车位。' },
      ],
      type: '行程',
      title: 'Sakrisøy（萨克里索伊黄屋岛）',
      startsAt: '13:10',
      endsAt: '13:35',
      detail: "黄色渔屋与海湾；拍照 25 分钟。Olenilsøya 高处机位可选。",
      navigation: 'Sakrisøya, 8390 Reine, Norway',
      addressLabel: '导航地址',
    },
    {
      id: 'oct02-anitas-lunch',
      type: '用餐',
      title: 'Anita’s Sjømat（安妮塔海鲜午餐）',
      startsAt: '13:35',
      endsAt: '14:35',
      detail: "海鲜午餐；预留 1 小时，可用餐厅顾客车位。",
      navigation: 'Anitas Sjømat, Sakrisøy, 8390 Reine, Norway',
      addressLabel: '用餐地址',
    },
    {
      id: 'oct02-reine',
      photoSpots: [
        { name: 'Reine utsiktspunkt', query: 'Reine utsiktspunkt, Norway', note: '村口观景搜索名，可能与 Reinehalsen 重合。' },
        { name: 'Reinehalsen', query: 'Reinehalsen, Reine, Norway', note: '村口全景机位。' },
        { name: 'Parking Reine Center', query: 'Parking Reine Center, Norway', note: '镇中心停车搜索名；优先用 Reine Ytre Havn。' },
        { name: 'Reine Photo Point', query: 'Reine Photo Point, Norway', note: '精确机位待核实，可对照地图照片选择。' },
      ],
      type: '行程',
      title: 'Reine（雷讷渔村）',
      startsAt: '14:50',
      endsAt: '16:05',
      detail: "港口、渔屋与峡湾倒影；停留 1 小时 15 分钟。",
      navigation: 'Reine Ytre Havn, 8390 Reine, Norway',
      addressLabel: '停车导航',
    },
    {
      id: 'oct02-a-village',
      type: '行程',
      title: 'Å（奥镇／E10 公路尽头）',
      startsAt: '16:30',
      endsAt: '17:45',
      detail: "老木屋、小港口与 E10 尽头；停留 1 小时 15 分钟。",
      navigation: 'Parking Å, Moskenes, Norway',
      addressLabel: '停车搜索（隧道后游客停车场）',
    },
    {
      id: 'oct02-dinner',
      type: '用餐',
      title: 'Reine（雷讷晚餐）',
      startsAt: '18:10',
      endsAt: '19:10',
      detail: "晚餐 1 小时；餐厅待选。",
      navigation: 'Reine, Norway',
      addressLabel: '用餐区域（餐厅待选）',
    },
    {
      id: 'oct02-henningsvaer-stay',
      type: '住宿',
      title: '罗弗敦住宿',
      startsAt: '21:40',
      detail: "返回 Henningsvær 住宿；次日 11:00 前退房。",
      navigation: 'Misværveien 2, 8312 Henningsvær, Norway',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '10.01 15:00 — 10.03 11:00',
        instruction: '房东亲自迎接；到达前联系 Øystein',
      },
    },
  ],
  '2026-10-03': [
    {
      id: "oct03-henningsvaer",
      type: "行程",
      title: "Henningsvær（亨宁斯韦尔渔村）",
      startsAt: "09:00",
      endsAt: "11:30",
      detail: "出发前退房。港口、彩色木屋与足球场外围；游览 2 小时 30 分钟。",
      navigation: "Henningsvær, Norway",
      addressLabel: "导航地址",
    },
    {
      id: "oct03-henningsvaer-lunch",
      type: "用餐",
      title: "Henningsvær（亨宁斯韦尔午餐）",
      startsAt: "11:30",
      endsAt: "12:30",
      detail: "午餐 1 小时；餐厅待选。",
      navigation: "Henningsvær, Norway",
      addressLabel: "用餐区域",
    },
    {
      id: "oct03-vagan-church",
      type: "行程",
      title: "Vågan Church（沃甘教堂／罗弗敦大教堂）",
      startsAt: "14:10",
      endsAt: "14:40",
      detail: "木教堂外观；停留 30 分钟。",
      navigation: "Kong Øysteins vei 6, 8310 Kabelvåg, Norway",
      addressLabel: "教堂导航",
    },
    {
      id: "oct03-svolvaer-center",
      type: "行程",
      title: "Svolvær Sentrum（斯沃尔韦尔市中心与港口）",
      startsAt: "15:00",
      endsAt: "16:00",
      detail: "Torget 广场、海滨散步与补给；停留 1 小时。",
      navigation: "Torget, 8300 Svolvær, Norway",
      addressLabel: "步行区域",
    },
    {
      id: "oct03-svinoya",
      type: "行程",
      title: "Svinøya（斯温岛渔村 · 可选）",
      startsAt: "16:20",
      endsAt: "17:10",
      detail: "红色渔屋与港湾；停留 50 分钟。",
      navigation: "Svinøya, Svolvær, Norway",
      addressLabel: "步行导航",
    },
    {
      id: "oct03-refuel",
      type: "行程",
      title: "Svolvær（加油与还车准备）",
      startsAt: "20:15",
      endsAt: "21:00",
      detail: "加油、整理行李、拍摄车况与油表；21:00 还车，之后行李随身携带。",
      navigation: "Fiskergata 23, 8300 Svolvær, Norway",
      addressLabel: "还车目的地",
    },
    {
      id: 'oct03-hertz-return',
      bookingAccess: bookingAccessByProvider.hertz,
      type: '行程',
      title: 'Hertz 还车',
      startsAt: '21:00',
      detail: "车辆：Toyota Yaris Cross。\n还车：Fiskergata 23 异地归还，办理还车及付款。",
      navigation: 'Fiskergata 23, 8300 Svolvær, Norway',
      addressLabel: '还车地址',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Hertz 预订邮件中查看',
        time: '10.03 21:00',
        instruction: '21:00 在 Hertz Fiskergata 23 门店办理异地还车并付款；门店电话可在下方直接复制。',
      },
    },
    {
      id: 'oct03-dinner',
      type: '用餐',
      title: 'Svolvær（还车后简餐与补给）',
      startsAt: '21:05',
      endsAt: '21:30',
      detail: "还车后在市中心快速用餐或购买外带，餐厅待选。\n21:30 前往码头，预计 21:45 到港。",
      navigation: 'Svolvær sentrum, Norway',
      addressLabel: '用餐区域',
    },
    {
      id: 'oct03-hurtigruten',
      type: '住宿',
      title: '游轮住宿',
      startsAt: '22:15',
      endsAt: '23:59',
      displayEndsAt: '14:15 +1',
      detail: "航线：Svolvær → Tromsø，船上过夜。\n到港：计划 21:45，最迟提前 15 分钟；凭证见 Hurtigruten 预订邮件。\n抵达：10.04 14:15。",
      navigation: 'Torget 22, 8300 Svolvær, Norway',
      addressLabel: '集合地点',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Hurtigruten 预订邮件中查看',
        time: '10.03 22:15 — 14:15 +1',
        instruction: '凭证：Hurtigruten 预订邮件；至少提前 15 分钟到港',
      },
      bookingAccess: bookingAccessByProvider.hurtigruten,
    },
  ],
  '2026-10-04': [
    {
      id: 'oct04-tromso-city',
      type: '行程',
      title: 'Tromsø Harbour（特罗姆瑟港口）',
      startsAt: '15:00',
      endsAt: '15:40',
      detail: "先到酒店寄存行李；港口散步 40 分钟。",
      navigation: 'Prostneset, 9008 Tromsø, Norway',
    },
    {
      id: 'oct04-arctic-cathedral',
      type: '行程',
      title: 'Ishavskatedralen（北极大教堂）',
      startsAt: '16:05',
      endsAt: '16:35',
      detail: "教堂外观与桥头海景，约 30 分钟。\n去程：15:45 从酒店步行到 Torgsenteret，乘 15:57 的 26 路（往 Tromsdalen / Pyramiden），15:59 在 Tromsdalen Bruvegen 下车，步行约 3 分钟到教堂。",
      navigation: 'Ishavskatedralen, Hans Nilsens veg 41, 9020 Tromsdalen, Norway',
    },
    {
      id: 'oct04-fjellheisen',
      type: '行程',
      title: 'Fjellheisen（特罗姆瑟缆车与山顶观景）',
      startsAt: '17:10',
      endsAt: '18:30',
      detail: "从北极大教堂步行约 15–20 分钟到下站；缆车往返 Storsteinen。\n返程：18:20 到山顶站排队，争取乘 18:30 下行缆车；18:40 前到 Fjellheisen 公交站。\n26 路（往 Tromsø lufthavn）：18:49 → 19:07 Torgsenteret；备选 19:19 → 19:37。修桥期间 17:00 后绕隧道，以上时刻已计入绕行。",
      reservationStatus: '未预定',
      navigation: 'Fjellheisen, Sollivegen 12, 9020 Tromsdalen, Norway',
    },
    {
      id: 'oct04-dinner',
      type: '用餐',
      title: 'McDonald’s Tromsø（麦当劳）',
      startsAt: '19:15',
      endsAt: '20:15',
      detail: "Torgsenteret 下车后步行约 8 分钟；若乘 19:19 的返程公交，晚餐顺延至约 19:45。",
      navigation: 'Storgata 70, 9008 Tromsø, Norway',
    },
    {
      id: 'oct04-tromso-stay',
      type: '住宿',
      title: '特罗姆瑟住宿',
      startsAt: '20:15',
      detail: "房型：Superior King Room。\n入住：前台办理，订单见 Agoda。",
      navigation: 'Scandic Ishavshotel',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Agoda 查看',
        time: '10.04 16:00 — 10.05 12:00',
        instruction: '在 Agoda 查看订单，前台办理入住',
      },
    },
  ],
  '2026-10-05': [
    {
      id: 'oct05-tromso-city',
      type: '行程',
      title: 'Tromsø Domkirke（特罗姆瑟木教堂与主街）',
      startsAt: '09:00',
      endsAt: '09:45',
      detail: "退房、寄存行李后出发；主街与木教堂外观，游览 45 分钟。",
      navigation: 'Tromsø Domkirke, Storgata 25, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-storgata',
      type: '行程',
      title: 'Storgata（特罗姆瑟主街）',
      startsAt: '10:00',
      endsAt: '11:15',
      detail: "主街、商店与咖啡馆；自由活动 1 小时 15 分钟。",
      navigation: 'Storgata, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-lunch',
      type: '用餐',
      title: '午餐与休息',
      startsAt: '11:30',
      endsAt: '12:30',
      detail: "餐厅待定，主街附近自由选择；预留 1 小时。",
    },
    {
      id: 'oct05-library',
      type: '行程',
      title: 'Tromsø Bibliotek（特罗姆瑟图书馆 · 顺路看看）',
      startsAt: '12:50',
      endsAt: '13:20',
      detail: "图书馆建筑外观；停留 30 分钟。",
      navigation: 'Tromsø bibliotek og byarkiv, Grønnegata 94, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-waterfront',
      type: '行程',
      title: 'Stortorget（广场与酒店附近散步）',
      startsAt: '13:30',
      endsAt: '14:50',
      detail: "广场与海滨自由活动；预留 1 小时 20 分钟。",
      navigation: 'Stortorget, Tromsø, Norway',
    },
    {
      id: 'oct05-hotel-luggage',
      type: '行程',
      title: 'Scandic Ishavshotel（取行李与出发准备）',
      startsAt: '15:15',
      endsAt: '16:30',
      detail: "取行李、整理证件；16:30 前往机场。",
      navigation: 'Scandic Ishavshotel, Tromsø, Norway',
    },
    {
      id: 'oct05-airport-transfer',
      type: '行程',
      title: 'Tromsø Airport（前往特罗姆瑟机场）',
      startsAt: '16:30',
      endsAt: '17:15',
      detail: "交通：出租车，16:30 从酒店出发。\n目标：17:15 到机场，办理托运、安检。",
      navigation: 'Tromsø Airport, Langnes, Norway',
    },
    {
      id: 'oct05-tos-osl',
      type: '交通',
      ...getTransportEventFields('tos-osl-flight'),
      startsAt: '19:50',
      endsAt: '21:45',
      detail: "航班：DY385，19:50 → 21:45。\n舱位：经济舱，无餐食。\n行李：每人托运 23kg。",
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'DY385',
        time: '10.05 19:50 — 21:45',
      },
    },
    {
      id: 'oct05-oslo-stay',
      type: '住宿',
      title: '奥斯陆住宿',
      startsAt: '22:15',
      detail: "房型：Standard Room，1 人。\n付款：Booking.com 订单，到店支付 1,435.50 NOK。\n入住：订单时段 15:00–18:30，计划 22:15 抵达，需确认晚到入住。\n退房：10.06 06:00–11:30。",
      navigation: 'Radisson Hotel & Conference Centre Oslo Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Booking.com 查看',
        time: '10.05 15:00 — 10.06 11:30',
        instruction: '在 Booking.com 查看订单；到店付款',
      },
    },
  ],
  '2026-10-06': [
    {
      id: 'oct06-osl-bkk-hkg',
      type: '交通',
      ...getTransportEventFields('return-flight'),
      startsAt: '13:45',
      endsAt: '23:59',
      displayEndsAt: '11:45 +1',
      detail: "航段：TG955 奥斯陆 → 曼谷；TG600 曼谷 → 香港，10.07 11:45 抵达。\n中转：曼谷 1 小时 45 分；行李直挂，无需过境签。\n行李：每人托运 23kg，手提 7kg。",
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'TG955 / TG600',
        time: '10.06 13:45 — 11:45 +1',
      },
    },
  ],
};

const documentChecklist = [
  {
    id: 'passport-visa',
    emoji: '🛂',
    label: '护照与签证',
    detail: '护照原件、有效申根签证',
  },
  {
    id: 'driving-documents',
    emoji: '🚗',
    label: '驾照文件',
    detail: '驾照原件、驾照翻译件（小白本）、驾照海牙公证',
  },
  {
    id: 'supporting-documents',
    label: '补充材料',
    detail: '旅行保险凭证、机酒与租车订单、回程行程备份',
  },
];

const packingChecklistGroups = [
  {
    id: 'carry-on',
    title: '随身携带',
    items: [
      { id: 'carry-on-pocket-tissues', label: '包纸' },
      { id: 'carry-on-chargers', label: '充电器和转换插（手机、相机）' },
      { id: 'carry-on-change-of-clothes', label: '一套换洗衣物' },
      { id: 'carry-on-pillows', label: '充气颈枕、腰枕' },
      { id: 'carry-on-steam-eye-mask', label: '蒸汽眼罩' },
      { id: 'carry-on-payment-cards', label: '支付卡', detail: 'Visa 或 Mastercard' },
      { id: 'carry-on-power-bank', label: '充电宝' },
      { id: 'carry-on-sim-card', label: '电话卡' },
      { id: 'carry-on-pocket-3', label: 'Pocket 3' },
      { id: 'carry-on-disposable-camera', label: '一次性胶片机' },
      { id: 'carry-on-oppo-x9-ultra', label: 'Oppo X9 Ultra 大地探索家' },
    ],
  },
  {
    id: 'checked-luggage',
    title: '托运行李',
    items: [
      { id: 'checked-suitcase', label: '行李箱' },
      { id: 'checked-small-bag', label: '小包包' },
      { id: 'checked-underwear', label: '内衣内裤' },
      { id: 'checked-socks', label: '袜子' },
      { id: 'checked-outer-layer', label: '外层衣物', detail: '冲锋衣、羽绒服' },
      { id: 'checked-mid-layer', label: '中层衣物', detail: '羽绒内胆、抓绒、毛衣' },
      { id: 'checked-base-layer', label: '内层衣物', detail: '优衣库 HEATTECH 保暖内衣' },
      { id: 'checked-winter-accessories', label: '保暖配件', detail: '手套、围巾、帽子' },
      { id: 'checked-toiletries', label: '洗漱用品、毛巾、牙刷' },
      { id: 'checked-sanitary-pads', label: '卫生巾' },
      { id: 'checked-slippers', label: '拖鞋' },
      { id: 'checked-milk-tea-bags', label: '奶茶袋' },
      { id: 'checked-drip-coffee', label: '挂耳咖啡' },
      { id: 'checked-disposable-tableware', label: '一次性餐具' },
      { id: 'checked-instant-noodles', label: '泡面 × 6' },
      { id: 'checked-seasonings', label: '调料', detail: '六婆、芥末、酱油、火锅底料' },
      { id: 'checked-pocket-3-mount', label: 'Pocket 3 支架' },
      { id: 'checked-sunglasses', label: '墨镜' },
      { id: 'checked-medicine', label: '药品', detail: '晕船药、感冒药、布洛芬、蒙脱石散、过敏药' },
      { id: 'checked-tissues', label: '2 包抽纸' },
    ],
  },
];

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isJourneyOngoing(journey, today = new Date()) {
  const todayKey = getLocalDateKey(today);
  const previewStart = dateFromKey(journey.startsOn);
  previewStart.setUTCMonth(previewStart.getUTCMonth() - 2);
  const previewStartKey = previewStart.toISOString().slice(0, 10);

  return todayKey >= previewStartKey && todayKey <= journey.endsOn;
}

function getFocusedJourneyDayIndex(journey, dates, now = new Date()) {
  const todayKey = getLocalDateKey(now);

  if (todayKey < journey.startsOn || todayKey > journey.endsOn) return 0;

  const todayIndex = dates.findIndex((date) => date.key === todayKey);
  return todayIndex >= 0 ? todayIndex : 0;
}

function getJourneyProgress(journey, now = new Date()) {
  const dayCount = getJourneyDayCount(journey);
  const todayKey = getLocalDateKey(now);

  if (todayKey < journey.startsOn) return { currentDay: 1, dayCount };
  if (todayKey > journey.endsOn) return { currentDay: dayCount, dayCount };

  const start = dateFromKey(journey.startsOn);
  const today = dateFromKey(todayKey);
  return {
    currentDay: Math.round((today - start) / 86400000) + 1,
    dayCount,
  };
}

function timeToMinutes(time) {
  if (!/^\d{2}:\d{2}$/.test(time ?? '')) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentEventFocus(events, now = new Date(), dayKey) {
  if (!events?.length) return null;

  const todayKey = getLocalDateKey(now);
  if (dayKey && todayKey !== dayKey) {
    return {
      event: events[0],
      status: '接下来',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledEvents = events.filter((event) => (
    timeToMinutes(event.startsAt) !== null && timeToMinutes(event.endsAt) !== null
  ));

  const current = scheduledEvents.find((event) => (
    currentMinutes >= timeToMinutes(event.startsAt) && currentMinutes < timeToMinutes(event.endsAt)
  ));
  if (current) return { event: current, status: '接下来' };

  const upcoming = scheduledEvents.find((event) => currentMinutes < timeToMinutes(event.startsAt));
  if (upcoming) return { event: upcoming, status: '接下来' };

  if (scheduledEvents.length > 0) {
    return { event: scheduledEvents.at(-1), status: '接下来' };
  }

  return { event: events[0], status: '接下来' };
}

function formatEventTime(event) {
  const displayEnd = event.displayEndsAt ?? event.endsAt;
  if (!displayEnd) return event.startsAt;
  return `${event.startsAt} — ${displayEnd}`;
}

function formatDateRange(journey) {
  return `${formatShortDate(journey.startsOn)} — ${formatShortDate(journey.endsOn)}`;
}

function formatShortDate(dateKey) {
  const [, month, day] = dateKey.split('-');
  return `${month}.${day}`;
}

function formatRecordRange(record) {
  const start = formatShortDate(record.startsOn);
  const end = formatShortDate(record.endsOn);
  return start === end ? start : `${start} — ${end}`;
}

function getRelevantRecordId(records, today = new Date()) {
  const todayKey = getLocalDateKey(today);
  const current = records.find((record) => todayKey >= record.startsOn && todayKey <= record.endsOn);

  if (current) return current.id;
  return records.find((record) => record.startsOn > todayKey)?.id ?? records[0]?.id;
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h13M14 7l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" />
    </svg>
  );
}

function TransportIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 20H5V21C5 21.5523 4.55228 22 4 22H3C2.44772 22 2 21.5523 2 21V12L4.51334 5.29775C4.80607 4.51715 5.55231 4 6.386 4H17.614C18.4477 4 19.1939 4.51715 19.4867 5.29775L22 12V21C22 21.5523 21.5523 22 21 22H20C19.4477 22 19 21.5523 19 21V20ZM4.136 12H19.864L17.614 6H6.386L4.136 12ZM6.5 17C7.32843 17 8 16.3284 8 15.5C8 14.6716 7.32843 14 6.5 14C5.67157 14 5 14.6716 5 15.5C5 16.3284 5.67157 17 6.5 17ZM17.5 17C18.3284 17 19 16.3284 19 15.5C19 14.6716 18.3284 14 17.5 14C16.6716 14 16 14.6716 16 15.5C16 16.3284 16.6716 17 17.5 17Z" />
    </svg>
  );
}

function StayIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.48907C3 9.18048 3.14247 8.88917 3.38606 8.69972L11.3861 2.47749C11.7472 2.19663 12.2528 2.19663 12.6139 2.47749L20.6139 8.69972C20.8575 8.88917 21 9.18048 21 9.48907V20ZM11 13V19H13V13H11Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m9.5 14.5 5-5M7.7 16.3l-1.2 1.2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.3 7.7l1.2-1.2a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}


function MapPinIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M11 19.9451C6.50005 19.4476 3 15.6326 3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11C21 15.6326 17.5 19.4476 13 19.9451V24H11V19.9451Z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 12h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M6 12h12M12 6v12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function SiteTitle({ linked = false }) {
  const title = <span>across</span>;

  return (
    <header className="title-row">
      {linked ? <Link to="/" aria-label="across home">{title}</Link> : <h1>{title}</h1>}
    </header>
  );
}

function CurrentJourneyCard({ journey }) {
  const { currentDay, dayCount } = getJourneyProgress(journey);

  return (
    <Link className="current-journey" to="/ongoing" aria-label="Open the ongoing journey">
      <div className="current-journey__copy">
        <h2>{journey.destinations.join(' ')}</h2>
        <p className="current-journey__dates">
          <span>{formatDateRange(journey)}</span>
          <span>Day {currentDay} of {dayCount}</span>
        </p>
      </div>
      <span className="current-journey__action">Ongoing <ArrowIcon /></span>
    </Link>
  );
}

function ArchiveEmpty({ type }) {
  return (
    <div
      className="archive-empty"
      role="tabpanel"
      id={`${type}-panel`}
      aria-labelledby={`${type}-tab`}
    >
      <p>No {type} logs yet.</p>
    </div>
  );
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('map');
  const showOngoing = isJourneyOngoing(currentJourney);

  return (
    <div className="page home-page">
      <nav className="home-navigation" aria-label="主导航"><Link to="/templates">模板 ↗</Link></nav>
      <main>
        <section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title">across</h1>
          {showOngoing && (
            <div className="ongoing-slot" aria-label="Ongoing journey">
              <CurrentJourneyCard journey={currentJourney} />
            </div>
          )}
        </section>
        <section className="archive-section" aria-label="Travel logs">
          <div className="log-tabs" role="tablist" aria-label="Travel logs">
            <button
              aria-controls="map-panel"
              aria-selected={activeTab === 'map'}
              className={activeTab === 'map' ? 'is-active' : ''}
              id="map-tab"
              onClick={() => setActiveTab('map')}
              role="tab"
              type="button"
            >
              Map log
            </button>
            <button
              aria-controls="trip-panel"
              aria-selected={activeTab === 'trip'}
              className={activeTab === 'trip' ? 'is-active' : ''}
              id="trip-tab"
              onClick={() => setActiveTab('trip')}
              role="tab"
              type="button"
            >
              Trip log
            </button>
          </div>

          <ArchiveEmpty type={activeTab} />
        </section>
      </main>
    </div>
  );
}

function useModalBehavior(onClose) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
}

function CurrentIndicator({ visible }) {
  return visible ? <span className="info-card__current">当前</span> : null;
}

function CopyableAddress({ label, value }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => setCopied(await copyText(value));

  return (
    <div className="copyable-address-row">
      <button aria-label={copied ? `${label}已复制` : `复制${label}`} className="copyable-address" onClick={handleCopy} type="button">
        <span className="copyable-address__label">{label}</span>
        <span>{value}</span>
        <span className="copy-cue">{copied ? <CheckIcon /> : <CopyIcon />}</span>
      </button>
    </div>
  );
}

function BookingAccess({ access }) {
  if (!access) return null;

  return (
    <aside aria-label="查看预订所需信息" className="booking-access">
      <div className="booking-access__header">
        <span>查看预订需要</span>
        <div className="booking-access__links">
          {access.url && <a href={access.url} rel="noopener noreferrer" target="_blank">
            查询预订<ArrowIcon />
          </a>}
          {access.links?.map((link) => (
            <a href={link.url} key={link.url} rel="noopener noreferrer" target="_blank">
              {link.label}<ArrowIcon />
            </a>
          ))}
        </div>
      </div>
      <div className="booking-access__credentials">
        {access.credentials.map((credential) => (
          credential.label.includes('邮箱')
            ? <div className="booking-access__identity" key={credential.label}>
                <span className="copyable-address__label">{credential.label}</span>
                <span>{credential.value}</span>
              </div>
            : <CopyableAddress key={credential.label} label={credential.label} value={credential.value} />
        ))}
      </div>
    </aside>
  );
}

function LocationCardTitle({ record }) {
  return (
    <div className="info-card__title-block">
      <h3>{record.title}</h3>
      <CopyableAddress label={record.addressLabel ?? '住宿地址'} value={record.navigation} />
    </div>
  );
}

function FlightLegCaption({ text }) {
  const flightNumber = text.match(/\b[A-Z0-9]{2}\d{3,4}\b/);

  if (!flightNumber) return <small>{text}</small>;

  const start = flightNumber.index;
  const end = start + flightNumber[0].length;

  return (
    <small>
      {text.slice(0, start)}
      <b>{flightNumber[0]}</b>
      {text.slice(end)}
    </small>
  );
}

function TransportCard({ record, isRelevant }) {
  return (
    <article className="info-card transport-card" data-relevant={isRelevant || undefined}>
      <header className="info-card__meta">
        <div>
          <span>{record.kind}</span>
        </div>
        <CurrentIndicator visible={isRelevant} />
      </header>
      <p className="info-card__date">{formatRecordRange(record)}</p>
      {record.navigation ? <LocationCardTitle record={record} /> : <h3>{record.title}</h3>}

      {record.legs ? (
        <div className="flight-itinerary">
          {record.legs.map((leg, index) => {
            const connection = record.connections?.[index] ?? record.connection;

            return (
              <div key={`${record.id}-${leg.from}-${leg.depart}`}>
                <div className="flight-leg">
                  <span>{leg.depart}</span>
                  <strong>{leg.from} → {leg.to}</strong>
                  <span>{leg.arrive}</span>
                  <FlightLegCaption text={leg.code} />
                </div>
                {index < record.legs.length - 1 && connection && (
                  <p className="connection-note">{connection}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <dl className="info-card__details">
          {record.details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}

function StayCard({ record, isRelevant }) {
  return (
    <article className="info-card stay-card" data-relevant={isRelevant || undefined}>
      <header className="info-card__meta">
        <span>{formatRecordRange(record)}</span>
        <CurrentIndicator visible={isRelevant} />
      </header>
      <LocationCardTitle record={record} />
      <dl className="info-card__details">
        <div>
          <dt>入住</dt>
          <dd>{record.checkIn}</dd>
        </div>
        <div>
          <dt>退房</dt>
          <dd>{record.checkOut}</dd>
        </div>
        <div>
          <dt>预定</dt>
          <dd>{record.reservation}</dd>
        </div>
        <div>
          <dt>备注</dt>
          <dd>{record.note}</dd>
        </div>
      </dl>
    </article>
  );
}

function InfoModal({ panel, onClose }) {
  const copy = infoPanels[panel];
  const records = panel === 'transport' ? transportRecords : stayRecords;
  const relevantId = getRelevantRecordId(records);
  const relevantRecord = records.find((record) => record.id === relevantId);
  const orderedRecords = relevantRecord
    ? [relevantRecord, ...records.filter((record) => record.id !== relevantId)]
    : records;

  useModalBehavior(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        aria-labelledby={`${panel}-modal-title`}
        aria-modal="true"
        className="journey-modal"
        id={`${panel}-modal`}
        role="dialog"
      >
        <header className="journey-modal__header">
          <div>
            <p>{panel === 'transport' ? 'Transport' : 'Stay'}</p>
            <h2 id={`${panel}-modal-title`}>{copy.title}</h2>
          </div>
          <button aria-label={`关闭${copy.label}信息`} autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <div className="journey-modal__body">
          <div className="journey-modal__list">
            {orderedRecords.map((record) => panel === 'transport' ? (
              <TransportCard isRelevant={record.id === relevantId} key={record.id} record={record} />
            ) : (
              <StayCard isRelevant={record.id === relevantId} key={record.id} record={record} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <header className="notebook-section__heading">
      <h2>{children}</h2>
    </header>
  );
}


function legacyCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

async function copyText(text) {
  // Keep the first attempt inside the click event's user-activation window.
  if (legacyCopyText(text)) return true;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some mobile and embedded browsers deny Clipboard API access.
    }
  }

  return false;
}

function CopyableEventTitle({ className, event }) {
  return (
    <div className={`${className} copyable-title-block`}>
      <h3>{event.title}</h3>
      {event.navigation && (
        <CopyableAddress
          label={event.addressLabel ?? (event.type === '住宿' ? '住宿地址' : '导航地址')}
          value={event.navigation}
        />
      )}
      {event.photoSpots?.length > 0 && (
        <details className="photo-spots">
          <summary><span>拍照点</span><span className="photo-spots__count">{event.photoSpots.length}</span><svg aria-hidden="true" viewBox="0 0 16 16"><path d="m6 4 4 4-4 4" /></svg></summary>
          {event.photoSpots.map((spot) => (
            <div className="photo-spots__item" key={spot.name}>
              <CopyableAddress label="拍照点" value={spot.query} />
              <p>{spot.note}</p>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function getReservationHeading() {
  return '预定信息';
}

function ReservationDetails({ event, showContext = false }) {
  if (!event.reservation) {
    const pending = event.reservationStatus === '未预定';

    return (
      <div className={`reservation-state${pending ? ' is-pending' : ''}`}>
        <strong>{pending ? '未预定' : '无需预定'}</strong>
        <p>{pending ? '预定方式和凭证将在这里补充。' : '此项行程没有预定信息。'}</p>
      </div>
    );
  }

  const fields = event.infoType === 'flight'
    ? [

        ['航班号', event.reservation.flightNumber],

        ['航班时间', event.reservation.time],

      ]
    : [
        ['查看预订', event.reservation.reference],
        ['使用时间', event.reservation.time],
        ['使用方式', event.reservation.instruction],
      ];

  return (
    <div className={`reservation-details${showContext ? '' : ' is-embedded'}`}>
      <div className="reservation-copy">
        {showContext && (
          <>
            <span>{event.type}</span>
            <h3>{event.title}</h3>
          </>
        )}
        <dl className="info-card__details">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '待补充'}</dd>
            </div>
          ))}
        </dl>
        <BookingAccess access={event.bookingAccess} />
      </div>
    </div>
  );
}

function ReservationModal({ event, onClose }) {
  useModalBehavior(onClose);
  const heading = getReservationHeading(event);

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="reservation-modal-title" aria-modal="true" className="journey-modal reservation-modal" role="dialog">
        <header className="journey-modal__header">
          <div>
            <p>{event.infoType === 'flight' ? 'Flight' : 'Reservation'}</p>
            <h2 id="reservation-modal-title">{heading}</h2>
          </div>
          <button aria-label={`关闭${heading}`} autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <ReservationDetails event={event} showContext />
      </section>
    </div>
  );
}

function MapStopModal({ onClose, selection }) {
  const { event, stop } = selection;
  useModalBehavior(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="map-stop-modal-title" aria-modal="true" className="journey-modal map-stop-modal" role="dialog">
        <header className="journey-modal__header">
          <div>
            <p>Map stop</p>
            <h2 id="map-stop-modal-title">{stop.name}</h2>
          </div>
          <button aria-label="关闭停靠点详情" autoFocus onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        <div className="map-stop-modal__body">
          <article className="map-stop-modal__main">
            <div className="map-stop-modal__meta">
              <span>时间待补充</span>
              <span>{event.type}</span>
            </div>
            <CopyableEventTitle className="map-stop-modal__title-row" event={event} />
            <p className="event-description">{event.detail}</p>
            <div className="map-stop-modal__alerts">
              {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
              {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
            </div>
          </article>
          <section className="map-stop-modal__reservation" aria-labelledby="map-stop-reservation-title">
            <header>
              <span>{event.infoType === 'flight' ? 'Flight' : 'Reservation'}</span>
              <h3 id="map-stop-reservation-title">{getReservationHeading(event)}</h3>
            </header>
            <ReservationDetails event={event} />
          </section>
        </div>
      </section>
    </div>
  );
}

function EventFlightDetails({ event }) {
  return (
    <div className="flight-itinerary day-event-card__flight">
      {event.flightLegs.map((leg, index) => (
        <div key={`${event.id}-${leg.from}-${leg.depart}`}>
          <div className="flight-leg">
            <span>{leg.depart}</span>
            <strong>{leg.from} → {leg.to}</strong>
            <span>{leg.arrive}</span>
            <FlightLegCaption text={leg.code} />
          </div>
          {index < event.flightLegs.length - 1 && event.flightConnections?.[index] && (
            <div className="connection-note">{event.flightConnections[index]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function DayEventCard({ event, onOpenReservation }) {
  return <EventCard event={event} onOpenReservation={onOpenReservation}
    title={<CopyableEventTitle className="day-event-card__title-row" event={event} />}>
    {event.flightLegs ? <EventFlightDetails event={event} /> : <p className="event-description">{event.detail}</p>}
  </EventCard>;
}

function TodayFocusCard({ dayIndex, focus }) {
  if (!focus) return null;

  const { event } = focus;
  const hasAlerts = event.reservationStatus === '未预定' || event.paymentStatus === '未付款';

  return (
    <article className="today-focus">
      <div className="today-focus__meta">
        <div className="today-focus__schedule">
          <span>Day {dayIndex + 1}</span>
          <span>{formatEventTime(event)}</span>
        </div>
        <span className="today-focus__type">{event.type}</span>
      </div>
      {hasAlerts && (
        <div className="today-focus__signals">
          {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
        </div>
      )}
      <CopyableEventTitle className="today-focus__title-row" event={event} />
      {event.flightLegs ? <EventFlightDetails event={event} /> : <p className="event-description">{event.detail}</p>}
    </article>
  );
}

function DayItinerary({ day, events, onOpenReservation, onOpenStop }) {
  return (
    <div className="day-detail">
      <Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}><DayRouteMap day={day} events={events} onOpenStop={onOpenStop} /></Suspense>
      <section aria-label={`${day.label} 行程事件`} className="day-events">
        <ol className="day-event-list">
          {events.map((event) => (
            <DayEventCard event={event} key={event.id} onOpenReservation={onOpenReservation} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function OngoingPage() {
  const [activeDay, setActiveDay] = useState(() => getFocusedJourneyDayIndex(currentJourney, journeyDates));
  const [openPanel, setOpenPanel] = useState(null);
  const [openMapStop, setOpenMapStop] = useState(null);
  const [openReservation, setOpenReservation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [tabOverflow, setTabOverflow] = useState({ left: false, right: false });
  const dayTabsRef = useRef(null);

  const todayIndex = getFocusedJourneyDayIndex(currentJourney, journeyDates, now);
  const todayDay = journeyDates[todayIndex];
  const todayEvents = journeyDayEvents[todayDay.key] ?? [];
  const todayFocus = getCurrentEventFocus(todayEvents, now, todayDay.key);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const tabList = dayTabsRef.current;
    if (!tabList) return undefined;

    const updateOverflow = () => {
      const next = {
        left: tabList.scrollLeft > 2,
        right: tabList.scrollLeft + tabList.clientWidth < tabList.scrollWidth - 2,
      };
      setTabOverflow((current) => (
        current.left === next.left && current.right === next.right ? current : next
      ));
    };

    updateOverflow();
    tabList.addEventListener('scroll', updateOverflow, { passive: true });
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(tabList);

    return () => {
      tabList.removeEventListener('scroll', updateOverflow);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const tabList = dayTabsRef.current;
    const selectedTab = document.getElementById(`day-${activeDay + 1}-tab`);

    if (tabList && selectedTab) {
      tabList.scrollTo({
        left: selectedTab.offsetLeft - (tabList.clientWidth - selectedTab.offsetWidth) / 2,
        behavior: 'smooth',
      });
    }
  }, [activeDay]);

  return (
    <div className="page ongoing-page">
      <main className="ongoing-shell">
        <header className="notebook-header">
          <SiteTitle linked />
          <div className="journey-overview">
            <div className="journey-heading">
              <div className="journey-heading__title">
                <h1>{currentJourney.destinations.join(' ')}</h1>
              </div>
            </div>
            <div className="journey-tools" aria-label="行程工具">
              <button
                aria-label="交通"
                aria-controls="transport-modal"
                aria-expanded={openPanel === 'transport'}
                aria-haspopup="dialog"
                className="journey-tool-button"
                onClick={() => setOpenPanel('transport')}
                type="button"
              >
                <TransportIcon />
                <span>交通</span>
              </button>
              <button
                aria-label="住宿"
                aria-controls="stay-modal"
                aria-expanded={openPanel === 'stay'}
                aria-haspopup="dialog"
                className="journey-tool-button"
                onClick={() => setOpenPanel('stay')}
                type="button"
              >
                <StayIcon />
                <span>住宿</span>
              </button>
              <div className="journey-search">
                <SearchIcon />
                <input
                  aria-label="搜索行程"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索行程"
                  type="search"
                  value={searchQuery}
                />
                {searchQuery && (
                  <button
                    aria-label="清空搜索"
                    className="journey-search__clear"
                    onClick={() => setSearchQuery('')}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setSearchQuery('');
                    }}
                    type="button"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="notebook-content">
          <section className="notebook-section" aria-label="当日行程">
            <TodayFocusCard
              dayIndex={todayIndex}
              focus={todayFocus}
            />
          </section>

          <section className="notebook-section" aria-label="所有行程">
            <div
              className={`day-tabs${tabOverflow.left ? ' has-left-overflow' : ''}${tabOverflow.right ? ' has-right-overflow' : ''}`}
              ref={dayTabsRef}
              role="tablist"
              aria-label="每日行程"
            >
              {journeyDates.map((day, index) => (
                <Fragment key={day.key}>
                {journeySectionLabels[day.key] && <span className="day-tabs__country" role="presentation">{journeySectionLabels[day.key]}</span>}
                {day.key === '2026-10-06' && <span className="day-tabs__divider" aria-hidden="true" />}
                <button
                  aria-controls={`day-${index + 1}-panel`}
                  aria-selected={activeDay === index}
                  className={activeDay === index ? 'is-active' : ''}
                  id={`day-${index + 1}-tab`}
                  key={day.key}
                  onClick={() => setActiveDay(index)}
                  role="tab"
                  type="button"
                >
                  {day.label}
                </button>
                </Fragment>
              ))}
            </div>
            {journeyDates.map((day, index) => (
              <section
                aria-labelledby={`day-${index + 1}-tab`}
                className="day-panel"
                hidden={activeDay !== index}
                id={`day-${index + 1}-panel`}
                key={`${day.key}-panel`}
                role="tabpanel"
              >
                {activeDay === index && <DayItinerary
                  day={day}
                  events={journeyDayEvents[day.key] ?? []}
                  onOpenReservation={setOpenReservation}
                  onOpenStop={setOpenMapStop}
                />}
              </section>
            ))}
          </section>

          <section className="notebook-section">
            <SectionHeading>Checklist</SectionHeading>
            <div className="checklist-surface">
              <ChecklistGroup storageId={currentJourney.startsOn} items={documentChecklist} title="证件" variant="documents" />
              <ChecklistGroup storageId={currentJourney.startsOn} groups={packingChecklistGroups} title="行李" variant="packing" />
            </div>
          </section>

          <section className="notebook-section" aria-labelledby="album-title">
            <header className="notebook-section__heading">
              <h2 id="album-title">Album</h2>
            </header>
            <div className="album-empty">
              <span className="album-empty__icon"><LinkIcon /></span>
              <div>
                <h3>尚未添加相册链接</h3>
                <p>之后可以在这里关联网盘或其他存储地址。</p>
              </div>
            </div>
          </section>
        </div>
      </main>
      {openPanel && <InfoModal panel={openPanel} onClose={() => setOpenPanel(null)} />}
      {openReservation && (
        <ReservationModal event={openReservation} onClose={() => setOpenReservation(null)} />
      )}
      {openMapStop && <MapStopModal onClose={() => setOpenMapStop(null)} selection={openMapStop} />}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ongoing" element={<OngoingPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default App;
import { CopyIcon, CheckIcon } from './components/CopyIcons';
