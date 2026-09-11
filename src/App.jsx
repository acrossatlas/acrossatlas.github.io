import { useEffect, useRef, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

const currentJourney = {
  startsOn: '2026-09-24',
  endsOn: '2026-10-07',
  itineraryEndsOn: '2026-10-06',
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
    title: '香港 → 阿姆斯特丹',
    legs: [
      { code: '中华航空 CI916 · 托运 2×23kg / 手提 7kg', from: 'HKG', to: 'TPE', depart: '17:35', arrive: '19:25' },
      { code: '中华航空 CI073 · 托运 2×23kg / 手提 7kg', from: 'TPE', to: 'AMS', depart: '22:50', arrive: '07:40' },
    ],
    connection: '台北中转 3 小时 25 分；无需重新托运行李，无需过境签',
    voucher: {
      alt: '09.24 香港经台北至阿姆斯特丹航班与行李信息',
      images: [
        '/vouchers/flight-09-24-hkg-ams.jpg',
        '/vouchers/baggage-09-24-hkg-tpe.jpg',
        '/vouchers/baggage-09-24-tpe-ams.jpg',
      ],
    },
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
    voucher: {
      alt: '09.27 阿姆斯特丹至雷克雅未克航班信息',
      images: ['/vouchers/flight-09-27-ams-kef.jpg'],
    },
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
    voucher: {
      alt: '10.01 雷克雅未克经奥斯陆和博多至斯沃尔韦尔航班信息',
      images: ['/vouchers/flight-10-01-kef-svj.jpg'],
    },
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
    voucher: {
      alt: '10.05 特罗姆瑟至奥斯陆航班信息',
      images: ['/vouchers/flight-10-05-tos-osl.jpg'],
    },
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
    voucher: {
      alt: '10.06 奥斯陆经曼谷至香港航班与行李信息',
      images: [
        '/vouchers/flight-10-06-osl-hkg.jpg',
        '/vouchers/baggage-10-06-osl-bkk.jpg',
        '/vouchers/baggage-10-07-bkk-hkg.jpg',
      ],
    },
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
  {
    id: 'netherlands-stay',
    startsOn: '2026-09-25',
    endsOn: '2026-09-27',
    title: '荷兰住宿',
    navigation: 'Hyatt Place Amsterdam Airport',
    addressLabel: '酒店名称',
    checkIn: '09.25 15:00 — 00:00',
    checkOut: '09.27 00:00 — 12:00',
    reservation: '5791629773 · PIN 7204',
    note: 'Booking.com｜Hyatt Place Amsterdam Airport，King Room，2 人｜到店付款约 EUR 243.78｜酒店内自助停车，首小时免费，过夜 EUR 19.50',
    voucher: {
      alt: 'Hyatt Place Amsterdam Airport Booking.com 预定凭证',
      images: ['/vouchers/stay-hyatt-booking.jpg'],
    },
  },
  {
    id: 'iceland-stay',
    startsOn: '2026-09-27',
    endsOn: '2026-09-30',
    title: '雷克雅未克住宿',
    navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
    checkIn: '09.27 15:00 后',
    checkOut: '09.30 12:00 前',
    reservation: 'HMEPFWFFR3',
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
    reservation: '预定编号待补充',
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
    reservation: 'HMTYZXPEJB',
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
    reservation: '2330704',
    note: 'Hurtigruten 官网｜Svolvær → Tromsø｜船上住宿，停车不适用',
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
    reservation: '1753018586',
    note: 'Agoda｜前台入住，建议准备护照与订单号｜酒店有 4 个收费室外车位，另有 500 米外 Fjellet P-hus',
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
    reservation: '6770573874 · PIN 7107',
    note: 'Booking.com｜Radisson Hotel & Conference Centre Oslo Airport，Standard Room，1 人｜到店支付 1,435.50 NOK｜附近公共停车 530 NOK/天，无需预定',
    voucher: {
      alt: 'Radisson Hotel & Conference Centre Oslo Airport Booking.com 预定凭证',
      images: [
        '/vouchers/stay-radisson-booking-1.png',
        '/vouchers/stay-radisson-booking-2.png',
      ],
    },
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
    reservationStatus: '已预定',
    paymentStatus: '已付款',
    reservation: {
      reference: '预定编号待补充',
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
      reference: '预定编号待补充',
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
      detail: 'CI916 17:35 从香港出发，19:25 抵达台北；中转 3 小时 25 分后搭乘 CI073，09.25 07:40 抵达阿姆斯特丹。行李直挂，无需过境签；每人托运 2×23kg、手提 7kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        orderNumber: '1128146096447141',
        flightNumber: 'CI916 / CI073',
        airlineReference: 'EKG5FB',
        time: '09.24 17:35 — 07:40 +1',
        ticketNumber: '297-9555649633、297-9555649634',
        voucher: {
          alt: '09.24 香港经台北至阿姆斯特丹航班与行李信息',
          images: [
            '/vouchers/flight-09-24-hkg-ams.jpg',
            '/vouchers/baggage-09-24-hkg-tpe.jpg',
            '/vouchers/baggage-09-24-tpe-ams.jpg',
          ],
        },
      },
    },
  ],
  '2026-09-25': [
    {
      id: 'sep25-rijksmuseum',
      type: '行程',
      title: '国立博物馆',
      startsAt: '时间待补充',
      detail: '尚未预定；具体到达时间、预定方式与参观安排待补充。',
      navigation: '国立博物馆 Amsterdam',
      reservationStatus: '未预定',
      paymentStatus: '未付款',
    },
    {
      id: 'sep25-van-gogh',
      type: '行程',
      title: 'Van Gogh Museum',
      startsAt: '时间待补充',
      detail: '需提前两周预定；具体参观时段待补充。',
      navigation: 'Van Gogh Museum Amsterdam',
      reservationStatus: '未预定',
      paymentStatus: '未付款',
    },
    {
      id: 'sep25-amsterdam-stay',
      type: '住宿',
      title: '荷兰住宿',
      startsAt: '20:00',
      detail: 'Hyatt Place Amsterdam Airport，King Room，2 人；09.25 15:00 后入住，09.27 12:00 前退房。Booking.com 预定，到店付款约 EUR 243.78；酒店内自助停车，首小时免费，过夜 EUR 19.50。',
      navigation: 'Hyatt Place Amsterdam Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '5791629773 · PIN 7204',
        time: '09.25 15:00 — 09.27 12:00',
        instruction: '前台出示护照、确认号与 PIN 办理入住',
        voucher: {
          alt: 'Hyatt Place Amsterdam Airport Booking.com 预定凭证',
          images: ['/vouchers/stay-hyatt-booking.jpg'],
        },
      },
    },
  ],
  '2026-09-26': [
    {
      id: 'sep26-amsterdam-stay',
      type: '住宿',
      title: '荷兰住宿',
      startsAt: '20:00',
      detail: '继续住在 Hyatt Place Amsterdam Airport；09.27 12:00 前退房。Booking.com 订单到店付款；酒店内自助停车，过夜 EUR 19.50。',
      navigation: 'Hyatt Place Amsterdam Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '5791629773 · PIN 7204',
        time: '09.25 15:00 — 09.27 12:00',
        instruction: '前台出示护照、确认号与 PIN 办理入住',
        voucher: {
          alt: 'Hyatt Place Amsterdam Airport Booking.com 预定凭证',
          images: ['/vouchers/stay-hyatt-booking.jpg'],
        },
      },
    },
  ],
  '2026-09-27': [
    {
      id: 'sep27-ams-kef',
      type: '交通',
      ...getTransportEventFields('ams-kef-flight'),
      startsAt: '17:00',
      endsAt: '18:15',
      detail: '搭乘荷兰泛航空 HV6885 从阿姆斯特丹飞往雷克雅未克，17:00 起飞、18:15 到达；经济舱，无餐食，每人托运行李 25kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        orderNumber: '待补充',
        flightNumber: 'HV6885',
        airlineReference: 'PKRCRE',
        time: '09.27 17:00 — 18:15',
        ticketNumber: 'PKRCRE',
        voucher: {
          alt: '09.27 阿姆斯特丹至雷克雅未克航班信息',
          images: ['/vouchers/flight-09-27-ams-kef.jpg'],
        },
      },
    },
    {
      id: 'sep27-lotus-car',
      type: '行程',
      title: 'Lotus Car Rental 取车',
      startsAt: '20:00',
      detail: 'Toyota Yaris（自动挡）；09.27 20:00 在 Keflavík International Airport 取车，09.30 20:00 原地还车。含 Silver 与 Platinum (S) + Wi‑Fi 保险方案、无限里程。',
      navigation: 'Flugvellir 6-10, 230 Keflavík, Iceland',
      addressLabel: '取车地址',
      reservationStatus: '已预定',
      reservation: {
        reference: '#155816',
        time: '09.27 20:00 — 09.30 20:00',
        instruction: 'KEF 机场取还；总计 53,070 ISK',
        voucher: {
          alt: 'Lotus Car Rental 订单截图',
          images: ['/vouchers/rental-lotus.jpg'],
        },
      },
      bookingAccess: {
        url: 'https://www.lotuscarrental.is/client/manage',
        credentials: [
          { label: '登录邮箱', value: 'wendicao71@gmail.com' },
          { label: '预订号', value: '#155816' },
        ],
      },
    },
    {
      id: 'sep27-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '21:30',
      detail: 'Airbnb 钥匙盒自助入住；入住指南与 Wi‑Fi 于入住前 48 小时显示。楼外可免费停车，车位充足。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '09.27 15:00 — 09.30 12:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
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
      detail: '尚未预定；预定页面已记录，具体入场时段待补充。',
      navigation: 'Secret Lagoon Iceland',
      reservationStatus: '未预定',
      paymentStatus: '未付款',
    },
    {
      id: 'sep28-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '20:00',
      detail: '继续住在 Reykjavík；当天入住相关事项沿用前一晚。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '09.27 15:00 — 09.30 12:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
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
      title: '雷克雅未克住宿',
      startsAt: '20:00',
      detail: '继续住在 Reykjavík；当天入住相关事项沿用前一晚。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: 'HMEPFWFFR3',
        time: '09.27 15:00 — 09.30 12:00',
        instruction: '钥匙盒自助入住；入住前 48 小时查看指南',
      },
    },
  ],
  '2026-09-30': [
    {
      id: 'sep30-whale-watching',
      type: '行程',
      title: '雷克雅未克 RIB 观鲸与海鹦',
      startsAt: '09:00',
      endsAt: '11:00',
      detail: 'GetYourGuide 预定，2 位成人，英语导览，约 2 小时。请在出发前 30 分钟到 Elding 老码头售票处办理登船；提供连体工作服、护目镜与救生衣，仍需穿保暖多层衣物、结实鞋并带手套和帽子。行程受天气与海况影响。',
      navigation: 'Ægisgarður 5, 101 Reykjavík, Iceland',
      addressLabel: '集合地址',
      reservationStatus: '已预定',
      reservation: {
        reference: 'GYGKBF5YANRW',
        time: '09.30 09:00 — 11:00（提前 30 分钟集合）',
        instruction: '在 Elding 老码头售票处出示电子票券并签署免责声明',
        voucher: {
          alt: 'GetYourGuide 雷克雅未克 RIB 游艇观鲸与海鹦电子票券',
          images: [
            '/vouchers/whale-watching-confirmation.png',
            '/vouchers/whale-watching-details.jpg',
          ],
        },
      },
    },
    {
      id: 'sep30-reykjavik-afternoon',
      type: '行程',
      title: '雷克雅未克市区',
      startsAt: '12:00',
      endsAt: '18:30',
      detail: '观鲸结束后在雷克雅未克市区逛逛；18:30 左右出发前往 Keflavík，为 20:00 还车预留路程。具体地点与路线稍后补充。',
      navigation: 'Reykjavík, Iceland',
    },
    {
      id: 'sep30-lotus-return',
      type: '行程',
      title: 'Lotus Car Rental 还车',
      startsAt: '20:00',
      detail: '在原取车门店归还 Toyota Yaris（自动挡）；还车前检查油量、个人物品和车辆外观。',
      navigation: 'Flugvellir 6-10, 230 Keflavík, Iceland',
      addressLabel: '还车地址',
      reservationStatus: '已预定',
      reservation: {
        reference: '#68LQL6',
        time: '09.30 20:00',
        instruction: '在 Lotus Car Rental 原门店还车',
      },
    },
    {
      id: 'sep30-airport-stay',
      type: '住宿',
      title: '机场住宿',
      startsAt: '22:00',
      detail: '住在 Keflavík International Airport，便于次日搭乘早班机；具体住宿设施与退房方式待补充。',
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
      detail: 'SK4786 经奥斯陆、SK4116 经博多，再转 WF836 抵达斯沃尔韦尔。奥斯陆中转 2 小时 20 分，行李直达博多；博多中转 3 小时 20 分，需要重新托运。每人托运 23kg、手提 8kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        orderNumber: '待补充',
        flightNumber: 'SK4786 / SK4116 / WF836',
        airlineReference: '待补充',
        time: '10.01 08:40 — 20:50',
        ticketNumber: '待补充',
        voucher: {
          alt: '10.01 雷克雅未克经奥斯陆和博多至斯沃尔韦尔航班信息',
          images: ['/vouchers/flight-10-01-kef-svj.jpg'],
        },
      },
    },
    {
      id: 'oct01-hertz-car',
      type: '行程',
      title: 'Hertz 取车',
      startsAt: '19:00',
      detail: '在 Svolvær Airport 提取 Toyota Yaris Cross 4×4（自动挡），不限公里，柜台支付 3,859.62 NOK。预定取车时间早于航班 20:50 抵达，需要调整或确认留车。',
      navigation: 'Svolvær lufthavn, Helle, 8300 Svolvær, Norway',
      addressLabel: '取车地址',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '#L52108732E4',
        time: '10.01 19:00 — 10.03 19:00',
        instruction: '机场取车、Fiskergata 23 还车；到店支付',
        voucher: {
          alt: 'Hertz 挪威租车订单截图',
          images: ['/vouchers/rental-hertz.jpg'],
        },
      },
      bookingAccess: {
        url: 'https://www.hertz.com/rentacar/reservation/?confirmationNumber=L52108732E4#review',
        credentials: [
          { label: '姓氏拼音', value: 'CAO' },
          { label: '预订号', value: '#L52108732E4' },
        ],
      },
    },
    {
      id: 'oct01-henningsvaer-stay',
      type: '住宿',
      title: '罗弗敦住宿',
      startsAt: '22:00',
      detail: 'Airbnb 房源位于 Henningsvær 码头；房东亲自迎接，需提前联系 Øystein。提供停车位。',
      navigation: 'Misværveien 2, 8312 Henningsvær, Norway',
      reservationStatus: '已预定',
      reservation: {
        reference: 'HMTYZXPEJB',
        time: '10.01 15:00 — 10.03 11:00',
        instruction: '房东亲自迎接；到达前联系 Øystein',
      },
    },
  ],
  '2026-10-02': [
    {
      id: 'oct02-lofoten-west',
      type: '行程',
      title: 'Svinøya',
      startsAt: '08:30',
      detail: '08:30 从斯沃尔韦尔传统渔村出发；红色渔民木屋与港口景观也是西线的第一个拍摄点。',
      navigation: 'Svinøya, 8300 Svolvær, Norway',
    },
    {
      id: 'oct02-flakstadoya',
      type: '行程',
      title: 'Flakstadøya',
      startsAt: '09:30',
      endsAt: '09:50',
      detail: 'GetYourGuide 路线中的 20 分钟摄影停靠点，可拍摄岛屿海岸、山体与渔村景观。',
      navigation: 'Flakstadøya, Flakstad, Norway',
    },
    {
      id: 'oct02-hamnoy-bridge',
      type: '行程',
      title: 'Hamnøy Bridge',
      startsAt: '10:20',
      endsAt: '10:40',
      detail: '经典罗弗敦取景位，可从桥边拍摄红色渔屋、海湾与陡峭山峰。',
      navigation: 'Hamnøy Bridge, E10, 8390 Reine, Norway',
    },
    {
      id: 'oct02-reine',
      type: '行程',
      title: 'Reine',
      startsAt: '10:40',
      endsAt: '11:10',
      detail: '罗弗敦最具代表性的渔村之一，可看山峰、峡湾和水边木屋组成的明信片景观。',
      navigation: 'Reine, 8390 Reine, Norway',
    },
    {
      id: 'oct02-sakrisoy',
      type: '行程',
      title: 'Sakrisøy',
      startsAt: '11:10',
      endsAt: '11:55',
      detail: '以黄色渔屋、木制晒鱼架和海湾景色闻名；GetYourGuide 在这里安排休息与拍摄。',
      navigation: 'Sakrisøya, 8390 Reine, Norway',
    },
    {
      id: 'oct02-ramberg-beach',
      type: '行程',
      title: 'Ramberg Beach',
      startsAt: '12:25',
      endsAt: '12:45',
      detail: '白沙、碧蓝海水与高山环绕的北极海滩，适合散步和拍摄开阔海岸风景。',
      navigation: 'Rambergstranda, 8380 Ramberg, Norway',
    },
    {
      id: 'oct02-henningsvaer-stay',
      type: '住宿',
      title: '罗弗敦住宿',
      startsAt: '20:00',
      detail: '继续住在 Henningsvær；地址为 Misværveien 2。',
      navigation: 'Misværveien 2, 8312 Henningsvær, Norway',
      reservationStatus: '已预定',
      reservation: {
        reference: 'HMTYZXPEJB',
        time: '10.01 15:00 — 10.03 11:00',
        instruction: '房东亲自迎接；到达前联系 Øystein',
      },
    },
  ],
  '2026-10-03': [
    {
      id: 'oct03-lofoten-east',
      type: '行程',
      title: 'Kabelvåg',
      startsAt: '08:30',
      endsAt: '08:50',
      detail: '罗弗敦最古老的聚落之一，可看传统木建筑并了解当地海洋与渔业历史。',
      navigation: 'Kabelvåg, 8310 Kabelvåg, Norway',
    },
    {
      id: 'oct03-vagan-church',
      type: '行程',
      title: 'Vågan Church',
      startsAt: '08:50',
      endsAt: '09:10',
      detail: '又称 Lofoten Cathedral，是当地醒目的木结构教堂和历史地标。',
      navigation: 'Kong Øysteins vei 6, 8310 Kabelvåg, Norway',
    },
    {
      id: 'oct03-gimsoya',
      type: '行程',
      title: 'Gimsøya',
      startsAt: '10:00',
      endsAt: '10:30',
      detail: '岛上地势开阔，可观察农田、海岸与北冰洋方向的宽广景观。',
      navigation: 'Gimsøya, Vågan, Norway',
    },
    {
      id: 'oct03-haukland-beach',
      type: '行程',
      title: 'Haukland Beach',
      startsAt: '11:10',
      endsAt: '11:30',
      detail: '由白沙、青绿色海水和高山构成的海滩，适合散步与风景摄影。',
      navigation: 'Hauklandstranda, 8370 Leknes, Norway',
    },
    {
      id: 'oct03-unstad-beach',
      type: '行程',
      title: 'Unstad Beach',
      startsAt: '12:00',
      endsAt: '12:45',
      detail: '以悬崖、海浪和北极冲浪文化闻名，可在海边停留并安排简短休息。',
      navigation: 'Unstad Beach, 8360 Bøstad, Norway',
    },
    {
      id: 'oct03-henningsvaer',
      type: '行程',
      title: 'Henningsvær',
      startsAt: '13:30',
      endsAt: '14:00',
      detail: '由小岛组成的彩色渔村，适合逛港口、街道、画廊并看海岸景观。',
      navigation: 'Henningsvær, 8312 Henningsvær, Norway',
    },
    {
      id: 'oct03-hertz-return',
      type: '行程',
      title: 'Hertz 还车',
      startsAt: '19:00',
      detail: '在 Fiskergata 23 归还 Toyota Yaris Cross 4×4（自动挡）；确认油量、个人物品和车辆外观后办理还车。',
      navigation: 'Fiskergata 23, 8300 Svolvær, Norway',
      addressLabel: '还车地址',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '#L52108732E4',
        time: '10.03 19:00',
        instruction: '在 Hertz Fiskergata 23 门店办理异地还车并付款',
      },
    },
    {
      id: 'oct03-hurtigruten',
      type: '住宿',
      title: '游轮住宿',
      startsAt: '22:15',
      endsAt: '23:59',
      displayEndsAt: '14:15 +1',
      detail: 'Hurtigruten Svolvær → Tromsø 船上住宿；至少提前 15 分钟到港，10.04 14:15 抵达 Tromsø。',
      navigation: 'Torget 22, 8300 Svolvær, Norway',
      addressLabel: '集合地点',
      reservationStatus: '已预定',
      reservation: {
        reference: '2330704',
        time: '10.03 22:15 — 14:15 +1',
        instruction: '凭订单号办理登船；至少提前 15 分钟到港',
      },
      bookingAccess: {
        url: 'https://www.hurtigruten.com/en/my-booking/booking',
        credentials: [
          { label: '登录邮箱', value: 'xiaojieliang31@gmail.com' },
          { label: '预订号', value: '2330704' },
        ],
      },
    },
  ],
  '2026-10-04': [
    {
      id: 'oct04-tromso-city',
      type: '行程',
      title: 'Tromsø city',
      startsAt: '15:00',
      endsAt: '20:00',
      detail: '游轮 14:15 抵达后前往特罗姆瑟市区，安排下午至晚间行程；具体地点与路线稍后补充。',
      navigation: 'Tromsø',
    },
    {
      id: 'oct04-tromso-stay',
      type: '住宿',
      title: '特罗姆瑟住宿',
      startsAt: '20:00',
      detail: 'Agoda 预定，Superior King Room；前台入住建议准备护照和订单号。酒店有收费室外车位，另有 500 米外停车库。',
      navigation: 'Scandic Ishavshotel',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      reservation: {
        reference: '1753018586',
        time: '10.04 16:00 — 10.05 12:00',
        instruction: '前台出示护照与 Agoda 订单号办理入住',
      },
    },
  ],
  '2026-10-05': [
    {
      id: 'oct05-tromso-city',
      type: '行程',
      title: 'Tromsø city',
      startsAt: '09:00',
      endsAt: '16:30',
      detail: '继续安排特罗姆瑟市区行程；16:30 左右出发前往机场，为 19:50 航班预留路程与值机时间。',
      navigation: 'Tromsø',
    },
    {
      id: 'oct05-tos-osl',
      type: '交通',
      ...getTransportEventFields('tos-osl-flight'),
      startsAt: '19:50',
      endsAt: '21:45',
      detail: '搭乘挪威航空 DY385 从特罗姆瑟飞往奥斯陆，19:50 起飞、21:45 到达；经济舱，无餐食，每人托运行李 23kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        orderNumber: '待补充',
        flightNumber: 'DY385',
        airlineReference: 'BA3ZVL',
        time: '10.05 19:50 — 21:45',
        ticketNumber: 'BA3ZVL',
        voucher: {
          alt: '10.05 特罗姆瑟至奥斯陆航班信息',
          images: ['/vouchers/flight-10-05-tos-osl.jpg'],
        },
      },
    },
    {
      id: 'oct05-oslo-stay',
      type: '住宿',
      title: '奥斯陆住宿',
      startsAt: '22:15',
      detail: 'Radisson Hotel & Conference Centre Oslo Airport，Standard Room，1 人；10.05 15:00–18:30 入住，10.06 06:00–11:30 退房。Booking.com 预定，到店支付 1,435.50 NOK；附近公共停车 530 NOK/天，无需预定。',
      navigation: 'Radisson Hotel & Conference Centre Oslo Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '6770573874 · PIN 7107',
        time: '10.05 15:00 — 10.06 11:30',
        instruction: '前台出示护照、确认号与 PIN；到店付款',
        voucher: {
          alt: 'Radisson Hotel & Conference Centre Oslo Airport Booking.com 预定凭证',
          images: [
            '/vouchers/stay-radisson-booking-1.png',
            '/vouchers/stay-radisson-booking-2.png',
          ],
        },
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
      detail: 'TG955 13:45 从奥斯陆出发，10.07 06:15 抵达曼谷；中转仅 1 小时 45 分后搭乘 TG600，11:45 抵达香港。行李直挂，无需过境签；每人托运 23kg、手提 7kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        orderNumber: '1128146096549157',
        flightNumber: 'TG955 / TG600',
        airlineReference: '8EL2FL',
        time: '10.06 13:45 — 11:45 +1',
        ticketNumber: '217-6333199177、217-6333199176',
        voucher: {
          alt: '10.06 奥斯陆经曼谷至香港航班与行李信息',
          images: [
            '/vouchers/flight-10-06-osl-hkg.jpg',
            '/vouchers/baggage-10-06-osl-bkk.jpg',
            '/vouchers/baggage-10-07-bkk-hkg.jpg',
          ],
        },
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
      { id: 'carry-on-oppo-x9-ultra', label: 'Oppo X9 Ultra 大地探索家' },
    ],
  },
  {
    id: 'checked-luggage',
    title: '托运行李',
    items: [
      { id: 'checked-suitcase', label: '行李箱' },
      { id: 'checked-underwear', label: '内衣内裤' },
      { id: 'checked-socks', label: '袜子' },
      { id: 'checked-outer-layer', label: '外层衣物', detail: '冲锋衣、羽绒服' },
      { id: 'checked-mid-layer', label: '中层衣物', detail: '羽绒内胆、抓绒、毛衣' },
      { id: 'checked-base-layer', label: '内层衣物', detail: '优衣库 HEATTECH 保暖内衣' },
      { id: 'checked-winter-accessories', label: '保暖配件', detail: '手套、围巾、帽子' },
      { id: 'checked-toiletries', label: '洗漱用品、毛巾、牙刷' },
      { id: 'checked-slippers', label: '拖鞋' },
      { id: 'checked-milk-tea-bags', label: '奶茶袋' },
      { id: 'checked-disposable-tableware', label: '一次性餐具' },
      { id: 'checked-instant-noodles', label: '泡面 × 6' },
      { id: 'checked-pocket-3-mount', label: 'Pocket 3 支架' },
      { id: 'checked-sunglasses', label: '墨镜' },
      { id: 'checked-medicine', label: '药品', detail: '晕船药、感冒药、布洛芬、蒙脱石散' },
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
        <a href={access.url} rel="noreferrer" target="_blank">
          打开订单
          <ArrowIcon />
        </a>
      </div>
      <div className="booking-access__credentials">
        {access.credentials.map((credential) => (
          <CopyableAddress
            key={credential.label}
            label={credential.label}
            value={credential.value}
          />
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

function ChecklistGroup({ groups, items = [], title, variant }) {
  const allItems = groups ? groups.flatMap((group) => group.items) : items;
  const storageKey = `across-atlas:${currentJourney.startsOn}:checklist:${variant}`;
  const [checkedItems, setCheckedItems] = useState(() => {
    const defaultItems = allItems.filter((item) => item.checked).map((item) => item.id);

    try {
      const storedItems = JSON.parse(window.localStorage.getItem(storageKey));
      if (!Array.isArray(storedItems)) return new Set(defaultItems);

      const validItemIds = new Set(allItems.map((item) => item.id));
      return new Set(storedItems.filter((itemId) => validItemIds.has(itemId)));
    } catch {
      return new Set(defaultItems);
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...checkedItems]));
    } catch {
      // Keep the checklist usable when browser storage is unavailable.
    }
  }, [checkedItems, storageKey]);

  const toggleItem = (itemId, checked) => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const renderItems = (groupItems) => (
    <div className="checklist-grid">
      {groupItems.map((item) => {
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
  );

  return (
    <section className={`checklist-group checklist-group--${variant}`}>
      <h3>{title}</h3>
      {groups ? groups.map((group) => (
        <section className="checklist-subgroup" key={group.id}>
          <h4>{group.title}</h4>
          {renderItems(group.items)}
        </section>
      )) : renderItems(items)}
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
          aria-label="放大地图"
          disabled={zoom >= 1.6}
          onClick={() => setZoom((currentZoom) => Math.min(1.6, currentZoom + 0.2))}
          type="button"
        >
          <PlusIcon />
        </button>
        <button
          aria-label="缩小地图"
          disabled={zoom <= 1}
          onClick={() => setZoom((currentZoom) => Math.max(1, currentZoom - 0.2))}
          type="button"
        >
          <MinusIcon />
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
  return (
    <div className={`${className} copyable-title-block`}>
      <h3>{event.title}</h3>
      {event.navigation && (
        <CopyableAddress
          label={event.addressLabel ?? (event.type === '住宿' ? '住宿地址' : '导航地址')}
          value={event.navigation}
        />
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
        ['订单号', event.reservation.orderNumber],
        ['航班号', event.reservation.flightNumber],
        ['航司预订号', event.reservation.airlineReference],
        ['航班时间', event.reservation.time],
        ['票号', event.reservation.ticketNumber],
      ]
    : [
        ['预定编号', event.reservation.reference],
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
            <p>{event.detail}</p>
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

  return (
    <li className="day-event-card">
      <div className="day-event-card__meta">
        <span className="day-event-card__time">{formatEventTime(event)}</span>
        <div className="day-event-card__signals">
          {event.reservationStatus === '未预定' && <span className="event-alert-tag">未预定</span>}
          {event.reservationStatus === '已预定' && (
            <button className="reservation-info-trigger" onClick={() => onOpenReservation(event)} type="button">
              {getReservationHeading(event)}
            </button>
          )}
          {event.paymentStatus === '未付款' && <span className="event-alert-tag">未付款</span>}
          <span className="day-event-card__type">{event.type}</span>
        </div>
      </div>
      <CopyableEventTitle className="day-event-card__title-row" event={event} />
      {event.flightLegs ? <EventFlightDetails event={event} /> : <p>{event.detail}</p>}
      <BookingAccess access={event.bookingAccess} />
    </li>
  );
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
      {event.flightLegs ? <EventFlightDetails event={event} /> : <p>{event.detail}</p>}
      <BookingAccess access={event.bookingAccess} />
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
              <ChecklistGroup groups={packingChecklistGroups} title="行李" variant="packing" />
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
