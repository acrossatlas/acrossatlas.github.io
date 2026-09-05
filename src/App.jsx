import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

const currentJourney = {
  startsOn: '2026-09-24',
  endsOn: '2026-10-06',
  destinations: ['Netherlands', 'Iceland', 'Norway'],
};

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
    title: '香港 → 台北 → 阿姆斯特丹',
    legs: [
      { code: '航班号待补充', from: 'HKG', to: 'TPE', depart: '17:35', arrive: '待补充' },
      { code: '航班号待补充', from: 'TPE', to: 'AMS', depart: '待补充', arrive: '07:40' },
    ],
    connection: '订单 EKG5FB　中转时间与行李直挂待确认',
  },
  {
    id: 'ams-kef-flight',
    kind: '航班',
    startsOn: '2026-09-27',
    endsOn: '2026-09-27',
    title: '阿姆斯特丹 → 雷克雅未克',
    legs: [
      { code: '航班号待补充', from: 'AMS', to: 'KEF', depart: '17:00', arrive: '18:15' },
    ],
  },
  {
    id: 'iceland-car',
    kind: '租车',
    startsOn: '2026-09-27',
    endsOn: '2026-09-27',
    title: 'Lotus Car Rental',
    details: [
      ['取车', '20260927 · 时间待补充'],
      ['还车', '日期与时间待补充'],
      ['提车点', 'Lotus Car Rental'],
      ['预约', '#155816'],
      ['预订网站', 'lotuscarrental.is/client/manage'],
    ],
  },
  {
    id: 'kef-svj-flight',
    kind: '航班',
    startsOn: '2026-10-01',
    endsOn: '2026-10-01',
    title: '雷克雅未克 → 斯沃尔韦尔',
    legs: [
      { code: '航班号待补充', from: 'KEF', to: 'SVJ', depart: '待补充', arrive: '待补充' },
    ],
  },
  {
    id: 'norway-car',
    kind: '租车',
    startsOn: '2026-10-01',
    endsOn: '2026-10-01',
    title: 'Hertz 租车',
    details: [
      ['取车', '20261001 · 时间待补充'],
      ['还车', '日期与时间待补充'],
      ['提车点', 'Hertz'],
      ['预约', '#L52108732E4'],
      ['付款', '未付款'],
      ['备注', 'CAO'],
    ],
  },
  {
    id: 'tos-osl-flight',
    kind: '航班',
    startsOn: '2026-10-05',
    endsOn: '2026-10-05',
    title: '特罗姆瑟 → 奥斯陆',
    legs: [
      { code: 'DY385', from: 'TOS', to: 'OSL', depart: '19:50', arrive: '21:45' },
    ],
  },
  {
    id: 'return-flight',
    kind: '航班',
    startsOn: '2026-10-06',
    endsOn: '2026-10-06',
    title: '奥斯陆 → 曼谷 → 香港',
    legs: [
      { code: '航班号待补充', from: 'OSL', to: 'BKK', depart: '13:45', arrive: '待补充' },
      { code: '航班号待补充', from: 'BKK', to: 'HKG', depart: '待补充', arrive: '11:45' },
    ],
    connection: '订单 8EL2FL　中转时间与行李直挂待确认',
  },
];

const stayRecords = [
  {
    id: 'netherlands-stay',
    startsOn: '2026-09-25',
    endsOn: '2026-09-26',
    title: 'Stay in Amsterdam',
    navigation: 'Amsterdam',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: '尚未预约',
    note: '住宿名称、地址与入住方式待补充',
  },
  {
    id: 'iceland-stay',
    startsOn: '2026-09-27',
    endsOn: '2026-09-29',
    title: 'Stay in Reykjavík',
    navigation: 'Reykjavík',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: 'HMEPFWFFR3',
    note: 'Airbnb · 未付款',
  },
  {
    id: 'airport-stay',
    startsOn: '2026-09-30',
    endsOn: '2026-09-30',
    title: 'Stay at Airport',
    navigation: '机场住宿导航地址待补充',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: '预约编号待补充',
    note: '住宿名称、机场与地址待补充',
  },
  {
    id: 'henningsvaer-stay',
    startsOn: '2026-10-01',
    endsOn: '2026-10-02',
    title: 'Stay in Henningsvær',
    navigation: 'Misværveien 2, Vågan, Nordland 8312',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: 'HMTYZXPEJB',
    note: 'Airbnb · 未付款',
  },
  {
    id: 'hurtigruten-stay',
    startsOn: '2026-10-03',
    endsOn: '2026-10-03',
    title: 'Stay at Hurtigruten',
    navigation: 'Hurtigruten 登船地点待补充',
    checkIn: '登船时间待补充',
    checkOut: '离船时间待补充',
    reservation: '2330704',
    note: 'Hurtigruten · 已付款',
  },
  {
    id: 'tromso-stay',
    startsOn: '2026-10-04',
    endsOn: '2026-10-04',
    title: 'Stay in Tromsø',
    navigation: 'Tromsø 住宿导航地址待补充',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: '预约编号待补充',
    note: 'Agoda · 已付款',
  },
  {
    id: 'oslo-stay',
    startsOn: '2026-10-05',
    endsOn: '2026-10-05',
    title: 'Stay in Oslo',
    navigation: 'Oslo 住宿导航地址待补充',
    checkIn: '入住时间待补充',
    checkOut: '退房时间待补充',
    reservation: '6770573874',
    note: 'Booking.com · 未付款',
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
  const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  });

  return Array.from({ length: getJourneyDayCount(journey) }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);

    return {
      key: date.toISOString().slice(0, 10),
      label: formatter.format(date),
    };
  });
}

const journeyDates = createJourneyDates(currentJourney);

const placeholderRouteStops = [
  { id: 'stop-1', eventIndex: 0, name: '停靠点 1', x: '16%', y: '68%' },
  { id: 'stop-2', eventIndex: 1, name: '停靠点 2', x: '36%', y: '45%' },
  { id: 'stop-3', eventIndex: 2, name: '停靠点 3', x: '62%', y: '57%' },
  { id: 'stop-4', eventIndex: 3, name: '停靠点 4', x: '84%', y: '28%' },
];

const placeholderEventTypes = [
  {
    type: '交通',
    title: '交通名称待补充',
    detail: '补充班次、上车地点、换乘方式，以及这一段需要特别注意的信息。',
    reservationStatus: '已预约',
    paymentStatus: '已付款',
    reservation: {
      reference: '预约编号待补充',
      time: '使用时间待补充',
      instruction: '取票或使用方式待补充',
    },
  },
  {
    type: '住宿',
    title: '住宿名称待补充',
    detail: '用容易辨认的说明补充入住地点、入住方式和住宿相关注意事项。',
    navigation: '住宿导航地址待补充',
    reservationStatus: '已预约',
    paymentStatus: '未付款',
    reservation: {
      reference: '预约编号待补充',
      time: '入住时间待补充',
      instruction: '入住凭证与门禁方式待补充',
    },
  },
  {
    type: '行程',
    title: '官方地点名称待补充',
    detail: '这里用熟悉的语言说明地点是什么、为什么前往，以及到达后需要做什么。',
    navigation: '地点导航地址待补充',
    reservationStatus: '未预约',
  },
  {
    type: '行程',
    title: '自由活动待补充',
    detail: '不需要预约或付款的普通行程也保留相同的信息节奏，之后可以继续补充说明。',
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
      title: 'HKG → TPE → AMS',
      startsAt: '17:35',
      endsAt: '07:40',
      detail: '香港出发，经台北转机前往阿姆斯特丹；两段航班号、中转时间与行李直挂待确认。',
      reservationStatus: '已预约',
      reservation: {
        reference: 'EKG5FB',
        time: '20260924 17:35 — 20260925 07:40',
        instruction: '票号 297-9555649633、297-9555649634',
      },
    },
  ],
  '2026-09-25': [
    {
      id: 'sep25-rijksmuseum',
      type: '行程',
      title: '国立博物馆',
      startsAt: '时间待补充',
      detail: '尚未预约；具体到达时间、预约方式与参观安排待补充。',
      navigation: '国立博物馆 Amsterdam',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
    {
      id: 'sep25-van-gogh',
      type: '行程',
      title: 'Van Gogh Museum',
      startsAt: '时间待补充',
      detail: '需提前两周预约；具体参观时段待补充。',
      navigation: 'Van Gogh Museum Amsterdam',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
    {
      id: 'sep25-amsterdam-stay',
      type: '住宿',
      title: 'Stay in Amsterdam',
      startsAt: '入住时间待补充',
      detail: '住宿尚未预约，住宿名称、地址与入住方式待补充。',
      navigation: 'Amsterdam',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
  ],
  '2026-09-26': [
    {
      id: 'sep26-amsterdam-stay',
      type: '住宿',
      title: 'Stay in Amsterdam',
      startsAt: '时间待补充',
      detail: '继续住在 Amsterdam；当天行程与住宿信息待补充。',
      navigation: 'Amsterdam',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
  ],
  '2026-09-27': [
    {
      id: 'sep27-ams-kef',
      type: '交通',
      title: 'AMS → KEF',
      startsAt: '17:00',
      endsAt: '18:15',
      detail: '从阿姆斯特丹飞往雷克雅未克；航班号与机场衔接信息待补充。',
      reservationStatus: '已预约',
      reservation: {
        reference: '预约编号待补充',
        time: '20260927 17:00 — 18:15',
        instruction: '电子行程单待补充',
      },
    },
    {
      id: 'sep27-lotus-car',
      type: '交通',
      title: 'Lotus Car Rental',
      startsAt: '取车时间待补充',
      detail: '抵达冰岛后取车；提车点、还车日期与还车时间待补充。',
      reservationStatus: '已预约',
      reservation: {
        reference: '#155816',
        time: '20260927 取车时间待补充',
        instruction: 'Lotus 订单管理链接已记录',
      },
    },
    {
      id: 'sep27-reykjavik-stay',
      type: '住宿',
      title: 'Stay in Reykjavík',
      startsAt: '入住时间待补充',
      detail: 'Airbnb 已预约；住宿名称、详细地址与入住方式待补充。',
      navigation: 'Reykjavík',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '20260927 — 20260929',
        instruction: 'Airbnb 行程单已记录',
      },
    },
  ],
  '2026-09-28': [
    {
      id: 'sep28-golden-circle',
      type: '行程',
      title: 'Golden Circle',
      startsAt: '时间待补充',
      detail: '黄金圈当日路线；具体停靠点、路线顺序与时间稍后补充。',
      navigation: 'Golden Circle Iceland',
    },
    {
      id: 'sep28-secret-lagoon',
      type: '行程',
      title: 'Secret Lagoon',
      startsAt: '时间待补充',
      detail: '尚未预约；预订页面已记录，具体入场时段待补充。',
      navigation: 'Secret Lagoon Iceland',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
    {
      id: 'sep28-reykjavik-stay',
      type: '住宿',
      title: 'Stay in Reykjavík',
      startsAt: '时间待补充',
      detail: '继续住在 Reykjavík；当天入住相关事项沿用前一晚。',
      navigation: 'Reykjavík',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '20260927 — 20260929',
        instruction: 'Airbnb 行程单已记录',
      },
    },
  ],
  '2026-09-29': [
    {
      id: 'sep29-south-coast',
      type: '行程',
      title: 'South Coast',
      startsAt: '时间待补充',
      detail: '冰岛南岸当日路线；具体停靠点、路线顺序与时间稍后补充。',
      navigation: 'South Coast Iceland',
    },
    {
      id: 'sep29-reykjavik-stay',
      type: '住宿',
      title: 'Stay in Reykjavík',
      startsAt: '时间待补充',
      detail: '继续住在 Reykjavík；当天入住相关事项沿用前一晚。',
      navigation: 'Reykjavík',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '20260927 — 20260929',
        instruction: 'Airbnb 行程单已记录',
      },
    },
  ],
  '2026-09-30': [
    {
      id: 'sep30-whale-watching',
      type: '行程',
      title: 'Whale watching tour RIB boat',
      startsAt: '时间待补充',
      detail: '雷克雅未克 RIB 游艇观鲸与海鹦行程；尚未预约，集合点与具体时段待补充。',
      navigation: 'Reykjavík whale watching',
      reservationStatus: '未预约',
      paymentStatus: '未付款',
    },
    {
      id: 'sep30-airport-stay',
      type: '住宿',
      title: 'Stay at Airport',
      startsAt: '入住时间待补充',
      detail: '机场住宿；酒店名称、机场、导航地址与入住信息待补充。',
      navigation: '机场住宿导航地址待补充',
    },
  ],
  '2026-10-01': [
    {
      id: 'oct01-kef-svj',
      type: '交通',
      title: 'KEF → SVJ',
      startsAt: '时间待补充',
      detail: '从雷克雅未克前往斯沃尔韦尔；航班号、起降时间与中转信息待补充。',
      reservationStatus: '已预约',
      reservation: {
        reference: '预约编号待补充',
        time: '20261001 · 时间待补充',
        instruction: '电子行程单待补充',
      },
    },
    {
      id: 'oct01-hertz-car',
      type: '交通',
      title: 'Hertz 租车',
      startsAt: '取车时间待补充',
      detail: '抵达挪威后取车；提车点、还车日期与还车时间待补充。',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: '#L52108732E4',
        time: '20261001 取车时间待补充',
        instruction: 'Hertz 确认单与订单管理链接已记录',
      },
    },
    {
      id: 'oct01-henningsvaer-stay',
      type: '住宿',
      title: 'Stay in Henningsvær',
      startsAt: '入住时间待补充',
      detail: 'Airbnb 已预约；地址为 Misværveien 2，入住方式待补充。',
      navigation: 'Misværveien 2, Vågan, Nordland 8312',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: 'HMTYZXPEJB',
        time: '20261001 — 20261002',
        instruction: 'Airbnb 行程单已记录',
      },
    },
  ],
  '2026-10-02': [
    {
      id: 'oct02-lofoten-west',
      type: '行程',
      title: 'Lofoten west',
      startsAt: '时间待补充',
      detail: '罗弗敦西线；具体停靠点、路线顺序与时间稍后补充。',
      navigation: 'Lofoten west',
    },
    {
      id: 'oct02-henningsvaer-stay',
      type: '住宿',
      title: 'Stay in Henningsvær',
      startsAt: '时间待补充',
      detail: '继续住在 Henningsvær；地址为 Misværveien 2。',
      navigation: 'Misværveien 2, Vågan, Nordland 8312',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: 'HMTYZXPEJB',
        time: '20261001 — 20261002',
        instruction: 'Airbnb 行程单已记录',
      },
    },
  ],
  '2026-10-03': [
    {
      id: 'oct03-lofoten-east',
      type: '行程',
      title: 'Lofoten east',
      startsAt: '时间待补充',
      detail: '罗弗敦东线；具体停靠点、路线顺序与时间稍后补充。',
      navigation: 'Lofoten east',
    },
    {
      id: 'oct03-hurtigruten',
      type: '住宿',
      title: 'Stay at Hurtigruten',
      startsAt: '登船时间待补充',
      detail: 'Hurtigruten 船上住宿；登船地点、离船时间与舱位信息待补充。',
      navigation: 'Hurtigruten 登船地点待补充',
      reservationStatus: '已预约',
      reservation: {
        reference: '2330704',
        time: '20261003 · 时间待补充',
        instruction: 'Hurtigruten 订单管理链接已记录',
      },
    },
  ],
  '2026-10-04': [
    {
      id: 'oct04-tromso-city',
      type: '行程',
      title: 'Tromsø city',
      startsAt: '时间待补充',
      detail: '特罗姆瑟市区行程；具体地点、路线与时间稍后补充。',
      navigation: 'Tromsø',
    },
    {
      id: 'oct04-tromso-stay',
      type: '住宿',
      title: 'Stay in Tromsø',
      startsAt: '入住时间待补充',
      detail: 'Agoda 住宿已预约；住宿名称、地址与入住信息待补充。',
      navigation: 'Tromsø 住宿导航地址待补充',
      reservationStatus: '已预约',
      reservation: {
        reference: '预约编号待补充',
        time: '20261004 · 入住时间待补充',
        instruction: 'Agoda 订单信息待补充',
      },
    },
  ],
  '2026-10-05': [
    {
      id: 'oct05-tromso-city',
      type: '行程',
      title: 'Tromsø city',
      startsAt: '时间待补充',
      detail: '继续安排特罗姆瑟市区行程；前往机场的时间待补充。',
      navigation: 'Tromsø',
    },
    {
      id: 'oct05-tos-osl',
      type: '交通',
      title: 'TOS → OSL',
      startsAt: '19:50',
      endsAt: '21:45',
      detail: '搭乘 DY385 从特罗姆瑟飞往奥斯陆；到达后的衔接信息待补充。',
      reservationStatus: '已预约',
      reservation: {
        reference: 'BA3ZVL',
        time: '20261005 19:50 — 21:45',
        instruction: '航班 DY385；英文出行单已记录',
      },
    },
    {
      id: 'oct05-oslo-stay',
      type: '住宿',
      title: 'Stay in Oslo',
      startsAt: '入住时间待补充',
      detail: 'Booking.com 住宿已预约；住宿名称、地址与入住方式待补充。',
      navigation: 'Oslo 住宿导航地址待补充',
      reservationStatus: '已预约',
      paymentStatus: '未付款',
      reservation: {
        reference: '6770573874',
        time: '20261005 · 入住时间待补充',
        instruction: 'Booking.com 订单与 PDF 已记录',
      },
    },
  ],
  '2026-10-06': [
    {
      id: 'oct06-osl-bkk-hkg',
      type: '交通',
      title: 'OSL → BKK → HKG',
      startsAt: '13:45',
      endsAt: '11:45',
      detail: '从奥斯陆出发，经曼谷返回香港；两段航班号、中转时间与行李直挂待确认。',
      reservationStatus: '已预约',
      reservation: {
        reference: '8EL2FL',
        time: '20261006 13:45 — 次日 11:45',
        instruction: '票号 217-6333199177、217-6333199176',
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

const packingChecklist = [
  '行李箱',
  '衣物',
  '洗漱用品、毛巾、牙刷',
  '拖鞋',
  '包纸',
  '药（维生素）',
  '充电器和转换插（手机、相机）',
  '奶茶袋',
  '一次性餐具',
  '一套换洗衣物',
  '充气颈枕、腰枕',
  '信用卡',
  'Pocket 3',
  'Oppo X9 Ultra 大地探索家',
].map((label, index) => ({ id: `packing-${index + 1}`, label }));

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
      status: todayKey < dayKey ? '行程未开始' : '行程已结束',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledEvents = events.filter((event) => (
    timeToMinutes(event.startsAt) !== null && timeToMinutes(event.endsAt) !== null
  ));

  const current = scheduledEvents.find((event) => (
    currentMinutes >= timeToMinutes(event.startsAt) && currentMinutes < timeToMinutes(event.endsAt)
  ));
  if (current) return { event: current, status: '正在进行' };

  const upcoming = scheduledEvents.find((event) => currentMinutes < timeToMinutes(event.startsAt));
  if (upcoming) return { event: upcoming, status: '接下来' };

  if (scheduledEvents.length > 0) {
    return { event: scheduledEvents.at(-1), status: '今日已完成' };
  }

  return { event: events[0], status: '时间待补充' };
}

function formatEventTime(event) {
  if (!event.endsAt) return event.startsAt;
  return `${event.startsAt} — ${event.endsAt}`;
}

function formatDateRange(journey) {
  const format = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' });
  const start = new Date(`${journey.startsOn}T00:00:00`);
  const end = new Date(`${journey.endsOn}T00:00:00`);

  return `${format.format(start)} — ${format.format(end)}`;
}

function compactDate(date) {
  return date.replaceAll('-', '');
}

function formatRecordRange(record) {
  const start = compactDate(record.startsOn);
  const end = compactDate(record.endsOn);
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

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m3.3 8.2 3 3 6.4-6.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" />
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
        <p className="current-journey__status">
          <span aria-hidden="true" className="journey-live-dot" />
          Ongoing
        </p>
        <h2>{journey.destinations.join(' ')}</h2>
        <p className="current-journey__dates">
          <span>{formatDateRange(journey)}</span>
          <span>Day {currentDay} of {dayCount}</span>
        </p>
      </div>
      <span className="current-journey__action">Open <ArrowIcon /></span>
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
      <h3>{record.title}</h3>

      {record.legs ? (
        <div className="flight-itinerary">
          {record.legs.map((leg, index) => (
            <div key={`${record.id}-${leg.from}`}>
              <div className="flight-leg">
                <span>{leg.depart}</span>
                <strong>{leg.from} → {leg.to}</strong>
                <span>{leg.arrive}</span>
                <small>{leg.code}</small>
              </div>
              {index < record.legs.length - 1 && (
                <p className="connection-note">{record.connection}</p>
              )}
            </div>
          ))}
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

function CopyableLocation({ record }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => setCopied(await copyText(record.navigation));

  return (
    <div className="stay-card__title">
      <button aria-label={`复制${record.title}的导航地址`} className="copyable-name" onClick={handleCopy} type="button">
        <span>{record.title}</span>
        {!copied && <span className="copy-cue"><CopyIcon /></span>}
      </button>
      <span aria-live="polite" className={`copy-feedback${copied ? ' is-visible' : ''}`}>
        {copied ? '已复制' : ''}
      </span>
    </div>
  );
}

function StayCard({ record, isRelevant }) {
  return (
    <article className="info-card stay-card" data-relevant={isRelevant || undefined}>
      <header className="info-card__meta">
        <span>{formatRecordRange(record)}</span>
        <CurrentIndicator visible={isRelevant} />
      </header>
      <CopyableLocation record={record} />
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
          <dt>预约</dt>
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

function ChecklistGroup({ items, title, variant }) {
  const [checkedItems, setCheckedItems] = useState(() => new Set(
    items.filter((item) => item.checked).map((item) => item.id),
  ));

  const toggleItem = (itemId, checked) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  return (
    <section className={`checklist-group checklist-group--${variant}`}>
      <h3>{title}</h3>
      <div className="checklist-grid">
        {items.map((item) => {
          const checked = checkedItems.has(item.id);

          return (
            <label className={`checklist-item${checked ? ' is-checked' : ''}`} key={item.id}>
              <input
                checked={checked}
                onChange={(event) => toggleItem(item.id, event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" className="checklist-box"><CheckIcon /></span>
              <span className="checklist-copy">
                {item.emoji && <span aria-hidden="true" className="checklist-emoji">{item.emoji}</span>}
                <span className="checklist-text">
                  <strong>{item.label}</strong>
                  {item.detail && <small>{item.detail}</small>}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function DayRouteMap({ day, onOpenStop }) {
  const [zoom, setZoom] = useState(1);

  return (
    <figure aria-label={`${day.label} 路线地图占位`} className="day-map">
      <figcaption className="day-map__caption">
        <span>{day.label}</span>
        <strong>路线地图</strong>
      </figcaption>

      <div className="day-map__canvas" style={{ transform: `scale(${zoom})` }}>
        <svg aria-hidden="true" className="day-map__drawing" preserveAspectRatio="none" viewBox="0 0 720 500">
          <g className="day-map__roads">
            <path d="M-20 90C120 54 170 146 300 112S520 22 760 70" />
            <path d="M-10 410C150 370 220 438 350 394S560 300 750 342" />
            <path d="M110-20C92 98 156 184 116 294S34 452 82 530" />
            <path d="M560-20C520 116 612 194 556 300S488 444 532 530" />
          </g>
          <g className="day-map__route">
            <path d="M115 340C162 326 202 250 259 225" />
            <path d="M259 225C326 206 386 316 446 285" />
            <path d="M446 285C510 252 548 166 605 140" />
          </g>
        </svg>

        {placeholderRouteStops.map((stop) => (
          <button
            aria-label={`查看${stop.name}详情`}
            className="route-stop"
            key={stop.id}
            onClick={() => onOpenStop({ event: placeholderDayEvents[stop.eventIndex], stop })}
            style={{ left: stop.x, top: stop.y }}
            type="button"
          >
            <span className="route-stop__pin"><MapPinIcon /></span>
            <span className="route-stop__name">{stop.name}</span>
          </button>
        ))}

        <span className="route-segment route-segment--one">路段 1</span>
        <span className="route-segment route-segment--two">路段 2</span>
        <span className="route-segment route-segment--three">路段 3</span>
      </div>

      <div aria-label="地图缩放" className="map-zoom-controls" role="group">
        <button
          aria-label="缩小地图"
          disabled={zoom <= 1}
          onClick={() => setZoom((currentZoom) => Math.max(1, currentZoom - 0.2))}
          type="button"
        >
          <MinusIcon />
        </button>
        <button
          aria-label="放大地图"
          disabled={zoom >= 1.6}
          onClick={() => setZoom((currentZoom) => Math.min(1.6, currentZoom + 0.2))}
          type="button"
        >
          <PlusIcon />
        </button>
      </div>
    </figure>
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyNavigation = async () => {
    setCopied(await copyText(event.navigation));
  };

  return (
    <div className={className}>
      <h3>
        {event.navigation ? (
          <button aria-label={`复制${event.title}的导航地址`} className="copyable-name" onClick={copyNavigation} type="button">
            <span>{event.title}</span>
            {!copied && <span className="copy-cue"><CopyIcon /></span>}
          </button>
        ) : event.title}
      </h3>
      <span aria-live="polite" className={`copy-feedback${copied ? ' is-visible' : ''}`}>
        {copied ? '已复制' : ''}
      </span>
    </div>
  );
}

function ReservationDetails({ event, showContext = false }) {
  if (!event.reservation) {
    const pending = event.reservationStatus === '未预约';

    return (
      <div className={`reservation-state${pending ? ' is-pending' : ''}`}>
        <strong>{pending ? '未预约' : '无需预约'}</strong>
        <p>{pending ? '预约方式和凭证将在这里补充。' : '此项行程没有预约信息。'}</p>
      </div>
    );
  }

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
          <div>
            <dt>预约编号</dt>
            <dd>{event.reservation.reference}</dd>
          </div>
          <div>
            <dt>使用时间</dt>
            <dd>{event.reservation.time}</dd>
          </div>
          <div>
            <dt>使用方式</dt>
            <dd>{event.reservation.instruction}</dd>
          </div>
        </dl>
      </div>
      <div className="reservation-voucher">
        <span>二维码或凭证图片</span>
        <p>待补充</p>
      </div>
    </div>
  );
}

function ReservationModal({ event, onClose }) {
  useModalBehavior(onClose);

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <section aria-labelledby="reservation-modal-title" aria-modal="true" className="journey-modal reservation-modal" role="dialog">
        <header className="journey-modal__header">
          <div>
            <p>Reservation</p>
            <h2 id="reservation-modal-title">预约信息</h2>
          </div>
          <button aria-label="关闭预约信息" autoFocus onClick={onClose} type="button">
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
            <p>{event.detail}</p>
            <div className="map-stop-modal__alerts">
              {event.reservationStatus === '未预约' && <span className="event-alert-tag">未预约</span>}
              {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
            </div>
          </article>
          <section className="map-stop-modal__reservation" aria-labelledby="map-stop-reservation-title">
            <header>
              <span>Reservation</span>
              <h3 id="map-stop-reservation-title">预约信息</h3>
            </header>
            <ReservationDetails event={event} />
          </section>
        </div>
      </section>
    </div>
  );
}

function DayEventCard({ event, onOpenReservation }) {

  return (
    <li className="day-event-card">
      <div className="day-event-card__meta">
        <span className="day-event-card__time">{formatEventTime(event)}</span>
        <div className="day-event-card__signals">
          {event.reservationStatus === '未预约' && <span className="event-alert-tag">未预约</span>}
          {event.reservationStatus === '已预约' && (
            <button className="reservation-info-trigger" onClick={() => onOpenReservation(event)} type="button">
              预约信息
            </button>
          )}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
          <span className="day-event-card__type">{event.type}</span>
        </div>
      </div>
      <CopyableEventTitle className="day-event-card__title-row" event={event} />
      <p>{event.detail}</p>
    </li>
  );
}

function TodayReservationPreview({ event }) {
  if (!event.reservation) return null;

  return (
    <dl className="today-focus__reservation">
      <div>
        <dt>预约编号</dt>
        <dd>{event.reservation.reference}</dd>
      </div>
      <div>
        <dt>使用时间</dt>
        <dd>{event.reservation.time}</dd>
      </div>
      <div>
        <dt>使用方式</dt>
        <dd>{event.reservation.instruction}</dd>
      </div>
    </dl>
  );
}

function TodayFocusCard({ dayIndex, focus }) {
  if (!focus) return null;

  const { event, status } = focus;

  return (
    <article className="today-focus">
      <div className="today-focus__meta">
        <div className="today-focus__schedule">
          <span>Day {dayIndex + 1}</span>
          <span>{formatEventTime(event)}</span>
        </div>
        <span className="today-focus__type">{event.type}</span>
      </div>
      <div className="today-focus__signals">
        <span className="today-focus__status">
          <span aria-hidden="true" className="journey-live-dot" />
          {status}
        </span>
        {event.reservationStatus === '未预约' && <span className="event-alert-tag">未预约</span>}
        {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
      </div>
      <CopyableEventTitle className="today-focus__title-row" event={event} />
      <p>{event.detail}</p>
      <TodayReservationPreview event={event} />
    </article>
  );
}

function DayItinerary({ day, events, onOpenReservation, onOpenStop }) {
  return (
    <div className="day-detail">
      <DayRouteMap day={day} onOpenStop={onOpenStop} />
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
                <DayItinerary
                  day={day}
                  events={journeyDayEvents[day.key] ?? []}
                  onOpenReservation={setOpenReservation}
                  onOpenStop={setOpenMapStop}
                />
              </section>
            ))}
          </section>

          <section className="notebook-section">
            <SectionHeading>Checklist</SectionHeading>
            <div className="checklist-surface">
              <ChecklistGroup items={documentChecklist} title="证件" variant="documents" />
              <ChecklistGroup items={packingChecklist} title="行李" variant="packing" />
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
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default App;
