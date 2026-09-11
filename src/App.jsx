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
  {
    id: 'netherlands-stay',
    startsOn: '2026-09-25',
    endsOn: '2026-09-27',
    title: '荷兰住宿',
    navigation: 'Hyatt Place Amsterdam Airport',
    addressLabel: '酒店名称',
    checkIn: '09.25 15:00 — 00:00',
    checkOut: '09.27 00:00 — 12:00',
    reservation: '在 Booking.com 查看',
    note: 'Booking.com｜Hyatt Place Amsterdam Airport，King Room，2 人｜到店付款约 EUR 243.78',
  },
  {
    id: 'iceland-stay',
    startsOn: '2026-09-27',
    endsOn: '2026-09-30',
    title: '雷克雅未克住宿',
    navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
    checkIn: '09.27 15:00 后',
    checkOut: '09.30 12:00 前',
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
      detail: 'CI916 17:35 从香港出发，19:25 抵达台北；中转 3 小时 25 分后搭乘 CI073，09.25 07:40 抵达阿姆斯特丹。行李直挂，无需过境签；每人托运 2×23kg、手提 7kg。',
      reservationStatus: '已预定',
      infoType: 'flight',
      reservation: {
        flightNumber: 'CI916 / CI073',
        time: '09.24 17:35 — 07:40 +1',
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
      detail: 'Hyatt Place Amsterdam Airport，King Room，2 人；09.25 15:00 后入住，09.27 12:00 前退房。Booking.com 预定，到店付款约 EUR 243.78。',
      navigation: 'Hyatt Place Amsterdam Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Booking.com 查看',
        time: '09.25 15:00 — 09.27 12:00',
        instruction: '在 Booking.com 查看订单，前台办理入住',
      },
    },
  ],
  '2026-09-26': [
    {
      id: 'sep26-amsterdam-stay',
      type: '住宿',
      title: '荷兰住宿',
      startsAt: '20:00',
      detail: '继续住在 Hyatt Place Amsterdam Airport；09.27 12:00 前退房。Booking.com 订单到店付款。',
      navigation: 'Hyatt Place Amsterdam Airport',
      addressLabel: '酒店名称',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Booking.com 查看',
        time: '09.25 15:00 — 09.27 12:00',
        instruction: '在 Booking.com 查看订单，前台办理入住',
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
        flightNumber: 'HV6885',
        time: '09.27 17:00 — 18:15',
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
        reference: '在 Lotus 预订邮件中查看',
        time: '09.27 20:00 — 09.30 20:00',
        instruction: 'KEF 机场取还；总计 53,070 ISK',
      },
      bookingAccess: {

        credentials: [
          { label: '登录邮箱', value: 'W********@gmail.com' },

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
        reference: '在 Airbnb 查看',
        time: '09.27 15:00 — 09.30 12:00',
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
      detail: '国家公园 · 板块裂谷与议会历史。08:30 从 Kelduland 19 出发，车程约 50 分钟，09:20 左右抵达；停车及游览共留约 1 小时 55 分。由 Hakið 观景台俯瞰湖泊，沿 Almannagjá（阿尔曼纳裂谷）步道下行，看 Lögberg（法律岩）与议会旧址，再到 Þingvallakirkja（辛格维利尔教堂）外观及河边散步，预留返回停车场的时间。Öxarárfoss（厄克萨拉瀑布）只是园内可选支线，不必专程走到；优先逛好裂谷与历史核心区。出发前吃好早餐、加满油，并确认天气与路况。',
      navigation: 'Þingvellir Visitor Centre, Hakið P1, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-geysir-lunch',
      type: '用餐',
      title: 'Geysir Bistro（盖歇尔游客中心简餐）',
      startsAt: '12:10',
      endsAt: '12:50',
      detail: '11:15 从国家公园出发，预留约 55 分钟驾车及停车；抵达 Geysir 后先在游客中心解决午餐，预留 40 分钟。Bistro 提供汉堡、炸鱼薯条、沙拉、汤和蛋糕，适合当天直接选择；出发前再确认当天营业安排。',
      navigation: 'Geysir Centre, Haukadalur, 806 Bláskógabyggð, Iceland',
      addressLabel: '用餐地址',
    },
    {
      id: 'sep28-geysir',
      type: '行程',
      title: 'Geysir（盖歇尔间歇泉）',
      startsAt: '12:50',
      endsAt: '13:50',
      detail: '间歇泉 · 地热区。Geysir 本体目前并不规律喷发，主要观看约每 5–10 分钟喷发一次的 Strokkur；游览约 1 小时。先观察风向，避免站在热水雾飘来的下风侧。导航至 Geysir Parking；停车约 1,000 ISK，可在现场机器或 Parka 缴费，游客中心有免费厕所。',
      navigation: 'Geysir Parking, 806 Bláskógabyggð, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-gullfoss',
      type: '行程',
      title: 'Gullfoss（黄金瀑布）',
      startsAt: '14:10',
      endsAt: '15:40',
      detail: '瀑布 · 双层峡谷瀑布。从 Geysir 出发预留约 20 分钟驾车及停车；现场游览 1 小时 30 分。先在上层平台俯瞰全景，再根据天气和步道情况决定是否走下层近水步道；水雾较大，注意防水和防滑。停车免费，游客中心内有厕所，开放时间以当天为准。三个主景点结束后，再按时间和体力决定是否加返程可选项目。',
      navigation: 'Gullfoss falls Car Park, 846 Bláskógabyggð, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep28-secret-lagoon-optional',
      type: '行程',
      title: 'Secret Lagoon（秘密温泉，可选）',
      startsAt: '16:20',
      endsAt: '18:00',
      detail: '天然温泉 · 与 Kerið 火山口二选一。从 Gullfoss 预留约 40 分钟车程，现场留 1 小时 40 分用于更衣、淋浴和泡汤，预计 19:30 左右回民宿。9 月官网营业时间 10:00–20:00，成人票目前 4,500 ISK；尚未预订，建议提前订票，临时到场不保证有位。自带泳衣、毛巾。预订：https://secretlagoon.is/booking/。',
      navigation: 'Secret Lagoon, Hvammsvegur, 845 Flúðir, Iceland',
      addressLabel: '导航地址',
    },
    {
      id: 'sep28-kerid-optional',
      type: '行程',
      title: 'Kerið（凯瑞斯火山口，可选）',
      startsAt: '16:40',
      endsAt: '17:25',
      detail: '火山口湖 · 与 Secret Lagoon 二选一。15:40 从 Gullfoss 出发，预留约 1 小时驾车；沿火山口边缘看红色岩壁与湖水，留 45 分钟，视体力再走台阶下到湖边。需购入场票，开放以日照及现场安排为准；若主景点延误或天气不佳就跳过。',
      navigation: 'Kerið Crater, 805 Grímsnes, Iceland',
      addressLabel: '导航地址',
    },
    {
      id: 'sep28-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '18:35',
      detail: '按火山口方案，17:25 离开 Kerið，预留约 1 小时 10 分返回 Kelduland 19，预计 18:35 抵达；若跳过可选项目，从 Gullfoss 直接返程约 1 小时 50 分，预计 17:30 抵达。若改选 Secret Lagoon，预计 19:30 左右回民宿。车程均为规划估算，随天气、路况与休息调整；当天入住事项沿用前一晚。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
        time: '09.27 15:00 — 09.30 12:00',
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
      detail: '瀑布 · 水帘洞瀑布。08:00 从住宿出发，车程约 1 小时 50 分；09:50 抵达后游览 1 小时，可视步道开放情况绕到瀑布背后。水雾很大，穿防水外套和防滑鞋。停车 900 ISK，通过现场 Checkit 系统缴费，费用包含厕所。出发前确认南岸风速和道路状况。',
      navigation: 'Seljalandsfoss, 861 Hvolsvöllur, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-skogafoss',
      type: '行程',
      title: 'Skógafoss（斯科加瀑布）',
      startsAt: '11:20',
      endsAt: '12:20',
      detail: '瀑布 · 彩虹瀑布。从 Seljalandsfoss 驾车约 30 分钟；现场游览 1 小时，可在瀑布底部近观，体力允许再走旁边约 527 级台阶登顶。水雾大、台阶湿滑；如果前面行程延误，优先保留底部观景。停车通过 Parka 缴费，金额以现场为准。',
      navigation: 'Skógafoss, 861 Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-solheimajokull',
      type: '行程',
      title: 'Sólheimajökull（索尔黑马冰川）',
      startsAt: '12:50',
      endsAt: '13:50',
      detail: '冰川 · 观景步道。从 Skógafoss 出发，预留约 30 分钟驾车至冰川停车场。停车场至冰川观景处单程步行约 15–20 分钟，现场共留 1 小时；只在标记步道远观，不自行踏上冰面。停车约 750 ISK，可用 Parka 或刷卡缴费，现场有厕所；参加冰川徒步需另行预订向导及安排时间。',
      navigation: 'Sólheimajökull glacier parking lot, 871 Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-vik-lunch',
      type: '用餐',
      title: 'Black Crust Pizzeria（维克黑披萨）',
      startsAt: '14:25',
      endsAt: '15:25',
      detail: '13:50 从冰川停车场出发，预留约 35 分钟驾车至 Vík；午餐留 1 小时，含现场排队。午餐较晚，建议携带路餐或零食。餐厅提供黑色火山风格披萨、酸种与无麸质饼底，每日 12:00–21:00 营业；散客无需预订。晚餐食材与次日早餐计划返程在 Selfoss 采购。',
      navigation: 'Austurvegur 16, 870 Vík, Iceland',
      addressLabel: '用餐地址',
    },
    {
      id: 'sep29-vik-church',
      type: '行程',
      title: 'Vík í Mýrdal Church（维克红顶教堂）',
      startsAt: '15:35',
      endsAt: '15:55',
      detail: '教堂 · 小镇观景点。从镇中心短途上山，在红顶教堂与相邻墓地停留约 20 分钟，可俯瞰 Vík、小镇海岸与 Reynisdrangar 海蚀柱；镇内停车通常免费。',
      navigation: 'Vík i Myrdal Church, 870 Vík, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-reynisfjara',
      type: '行程',
      title: 'Reynisfjara Beach（雷尼斯黑沙滩）',
      startsAt: '16:15',
      endsAt: '17:05',
      detail: '黑沙滩 · 玄武岩海岸。从 Vík 教堂出发，预留约 20 分钟驾车及停车；现场停留 50 分钟，观看玄武岩柱、黑沙与 Reynisdrangar 海蚀柱。海岸侵蚀可能限制可进入区域，到场后遵守围栏与告示；不要靠近水线或背对海浪，也不要将固定距离视为安全保证。停车约 750–1,000 ISK，可通过 Parka 缴费。',
      navigation: 'Reynisfjara Beach, 871 Vík, Iceland',
      addressLabel: '停车地址',
    },
    {
      id: 'sep29-selfoss-shopping',
      type: '行程',
      title: 'Selfoss（塞尔福斯购物补给）',
      startsAt: '18:35',
      endsAt: '19:15',
      detail: '超市 · 可选补给。17:05 从黑沙滩出发，预留约 1 小时 30 分钟抵达 Selfoss；在 Krónan 留 40 分钟购买晚餐食材、次日早餐和零食。门店目前每天 08:00–21:00 营业，出发前确认；若物资已齐可跳过，提前回民宿。',
      navigation: 'Krónan Selfoss, Austurvegur 3, 800 Selfoss, Iceland',
      addressLabel: '购物地址',
    },
    {
      id: 'sep29-reykjavik-stay',
      type: '住宿',
      title: '雷克雅未克住宿',
      startsAt: '20:15',
      detail: '19:15 从 Selfoss 出发，预留约 1 小时返回 Kelduland 19 民宿；预计 20:15 抵达。当天时间为自驾规划估算，随天气、路况和休息时间调整；当天入住事项沿用前一晚。',
      navigation: 'Kelduland 19, 108 Reykjavík, Iceland',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Airbnb 查看',
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
        reference: '在手机 GetYourGuide App 查看票券／二维码',
        time: '09.30 09:00 — 11:00（提前 30 分钟集合）',
        instruction: '票券及二维码保存在手机 GetYourGuide App 中；打开该观鲸订单出示电子票券／二维码，在 Elding 老码头售票处办理登船并签署免责声明，至少提前 30 分钟到达。',
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
        flightNumber: 'SK4786 / SK4116 / WF836',
        time: '10.01 08:40 — 20:50',
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
        reference: '在 Hertz 预订邮件中查看',
        time: '10.01 19:00 — 10.03 19:00',
        instruction: '机场取车、Fiskergata 23 还车；到店支付',
      },
      bookingAccess: {

        credentials: [
          { label: '姓氏拼音', value: 'C**' },

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
      detail: "白沙与翡翠色海水，停留 40 分钟，沿海滩散步拍照。当天 08:30 从民宿出发。",
      navigation: 'Hauklandstranda, 8370 Leknes, Norway',
      addressLabel: '停车导航',
    },
    {
      id: 'oct02-skagsanden',
      type: '行程',
      title: 'Skagsanden Beach（斯卡格桑登海滩 · 顺路可停）',
      startsAt: '11:15',
      endsAt: '11:30',
      detail: "看沙纹、海浪和背后的山峰，顺路停留 15 分钟，可跳过。",
      navigation: 'Skagsanden Beach, Flakstad, Norway',
    },
    {
      id: 'oct02-ramberg-beach',
      type: '行程',
      title: 'Ramberg Beach（拉姆贝格白沙滩）',
      startsAt: '11:40',
      endsAt: '12:00',
      detail: "沿木枕步道下到白沙滩，拍海湾与群山，停留 20 分钟。停车：Rambergstranda 风景公路休息区，旁边有厕所。",
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
      detail: "拍红色渔屋、峡湾和尖峰，留 30 分钟；主机位在桥上，另有 2 个备选机位。",
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
      detail: "逛黄色渔屋和海湾，拍照 25 分钟后就近午餐；高处机位 Olenilsøya 可选。停车：Anita’s 顾客车位。",
      navigation: 'Sakrisøya, 8390 Reine, Norway',
      addressLabel: '导航地址',
    },
    {
      id: 'oct02-anitas-lunch',
      type: '用餐',
      title: 'Anita’s Sjømat（安妮塔海鲜午餐）',
      startsAt: '13:35',
      endsAt: '14:35',
      detail: "黄屋岛海鲜午餐，留 1 小时。可选鱼肉汉堡、熏三文鱼等；吃完继续去雷讷。停车：餐厅顾客车位。",
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
      detail: "逛港口、渔屋和街巷，拍群峰与峡湾倒影，停留 1 小时 15 分钟。停车：Reine Ytre Havn。",
      navigation: 'Reine Ytre Havn, 8390 Reine, Norway',
      addressLabel: '停车导航',
    },
    {
      id: 'oct02-a-village',
      type: '行程',
      title: 'Å（奥镇／E10 公路尽头）',
      startsAt: '16:30',
      endsAt: '17:45',
      detail: "逛老木屋、小港口和 E10 公路尽头，停留 1 小时 15 分钟。停车：隧道后的游客停车场。",
      navigation: 'Parking Å, Moskenes, Norway',
      addressLabel: '停车搜索（隧道后游客停车场）',
    },
    {
      id: 'oct02-dinner',
      type: '用餐',
      title: 'Reine（雷讷晚餐）',
      startsAt: '18:10',
      endsAt: '19:10',
      detail: "在雷讷吃晚餐、休息 1 小时，餐厅待选。",
      navigation: 'Reine, Norway',
      addressLabel: '用餐区域（餐厅待选）',
    },
    {
      id: 'oct02-henningsvaer-stay',
      type: '住宿',
      title: '罗弗敦住宿',
      startsAt: '21:40',
      detail: "晚餐后返回亨宁斯韦尔民宿休息。",
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
      detail: "出门前退房。留 2 小时 30 分钟逛港口、彩色木屋、街巷和足球场外围。",
      navigation: "Henningsvær, Norway",
      addressLabel: "导航地址",
    },
    {
      id: "oct03-henningsvaer-lunch",
      type: "用餐",
      title: "Henningsvær（亨宁斯韦尔午餐）",
      startsAt: "11:30",
      endsAt: "12:30",
      detail: "在村里吃午餐、休息 1 小时，餐厅待选。",
      navigation: "Henningsvær, Norway",
      addressLabel: "用餐区域",
    },
    {
      id: "oct03-vagan-church",
      type: "行程",
      title: "Vågan Church（沃甘教堂／罗弗敦大教堂）",
      startsAt: "14:10",
      endsAt: "14:40",
      detail: "看木教堂外观与周边，停留 30 分钟。",
      navigation: "Kong Øysteins vei 6, 8310 Kabelvåg, Norway",
      addressLabel: "教堂导航",
    },
    {
      id: "oct03-svolvaer-center",
      type: "行程",
      title: "Svolvær Sentrum（斯沃尔韦尔市中心与港口）",
      startsAt: "15:00",
      endsAt: "16:00",
      detail: "沿 Torget 广场和海滨散步，看渔船、商铺与山海街景，顺便补给，停留 1 小时。",
      navigation: "Torget, 8300 Svolvær, Norway",
      addressLabel: "步行区域",
    },
    {
      id: "oct03-svinoya",
      type: "行程",
      title: "Svinøya（斯温岛渔村）",
      startsAt: "16:20",
      endsAt: "17:10",
      detail: "看红色渔屋、小港湾，岛上停留 50 分钟。",
      navigation: "Svinøya, Svolvær, Norway",
      addressLabel: "步行导航",
    },
    {
      id: "oct03-refuel",
      type: "行程",
      title: "Svolvær（加油与还车准备）",
      startsAt: "17:30",
      endsAt: "19:00",
      detail: "加油、整理行李，拍下车况和油表，19:00 到 Hertz 还车。导航指向还车门店；还车后行李随身。",
      navigation: "Fiskergata 23, 8300 Svolvær, Norway",
      addressLabel: "还车目的地",
    },
    {
      id: 'oct03-hertz-return',
      type: '行程',
      title: 'Hertz 还车',
      startsAt: '19:00',
      detail: "在 Fiskergata 23 归还 Toyota Yaris Cross，办理还车及付款。",
      navigation: 'Fiskergata 23, 8300 Svolvær, Norway',
      addressLabel: '还车地址',
      reservationStatus: '已预定',
      paymentStatus: '未付款',
      reservation: {
        reference: '在 Hertz 预订邮件中查看',
        time: '10.03 19:00',
        instruction: '在 Hertz Fiskergata 23 门店办理异地还车并付款',
      },
    },
    {
      id: 'oct03-dinner',
      type: '用餐',
      title: 'Svolvær（晚餐与登船前休息）',
      startsAt: '19:15',
      endsAt: '21:15',
      detail: "还车后在市区吃晚餐、休息，餐厅待选。21:15 出发去码头，预计 21:45 到港准备登船。",
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
      detail: "22:15 从斯沃尔韦尔出发，船上过夜；次日 14:15 抵达特罗姆瑟。",
      navigation: 'Torget 22, 8300 Svolvær, Norway',
      addressLabel: '集合地点',
      reservationStatus: '已预定',
      reservation: {
        reference: '在 Hurtigruten 预订邮件中查看',
        time: '10.03 22:15 — 14:15 +1',
        instruction: '在 Hurtigruten 预订邮件中查看登船凭证；至少提前 15 分钟到港',
      },
      bookingAccess: {

        credentials: [
          { label: '登录邮箱', value: 'L************@gmail.com' },

        ],
      },
    },
  ],
  '2026-10-04': [
    {
      id: 'oct04-tromso-city',
      type: '行程',
      title: 'Tromsø Harbour（特罗姆瑟港口）',
      startsAt: '15:00',
      endsAt: '15:40',
      detail: "下船后先到酒店寄存行李。沿港口散步，看海景和木屋街景，停留 40 分钟。",
      navigation: 'Prostneset, 9008 Tromsø, Norway',
    },
    {
      id: 'oct04-arctic-cathedral',
      type: '行程',
      title: 'Ishavskatedralen（北极大教堂）',
      startsAt: '16:20',
      endsAt: '16:50',
      detail: "缆车附近顺路看白色三角形教堂外观和桥头海景，停留 30 分钟。",
      navigation: 'Ishavskatedralen, Hans Nilsens veg 41, 9020 Tromsdalen, Norway',
    },
    {
      id: 'oct04-fjellheisen',
      type: '行程',
      title: 'Fjellheisen（特罗姆瑟缆车与山顶观景）',
      startsAt: '17:10',
      endsAt: '18:30',
      detail: "今天的重点：乘缆车上 Storsteinen，在山顶观景平台看城市、海峡与群山，安排 1 小时 20 分钟。",
      reservationStatus: '未预定',
      navigation: 'Fjellheisen, Sollivegen 12, 9020 Tromsdalen, Norway',
    },
    {
      id: 'oct04-dinner',
      type: '用餐',
      title: 'Tromsø Sentrum（特罗姆瑟市中心晚餐）',
      startsAt: '19:00',
      endsAt: '20:00',
      detail: "在市中心吃晚餐、休息 1 小时，餐厅待选。",
      navigation: 'Storgata, 9008 Tromsø, Norway',
    },
    {
      id: 'oct04-tromso-stay',
      type: '住宿',
      title: '特罗姆瑟住宿',
      startsAt: '20:00',
      detail: '晚餐后回 Scandic Ishavshotel 休息，房型为 Superior King Room。',
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
      detail: "早餐后退房、寄存行李，逛 Storgata 主街和黄色木教堂外观，安排 45 分钟。",
      navigation: 'Tromsø Domkirke, Storgata 25, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-storgata',
      type: '行程',
      title: 'Storgata（特罗姆瑟主街）',
      startsAt: '10:00',
      endsAt: '11:15',
      detail: '逛彩色木屋街道、纪念品店和咖啡馆，留 1 小时 15 分钟慢慢走。',
      navigation: 'Storgata, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-lunch',
      type: '用餐',
      title: 'McDonald’s Tromsø（特罗姆瑟麦当劳）',
      startsAt: '11:30',
      endsAt: '12:30',
      detail: '在主街麦当劳吃午餐、打卡，休息 1 小时。',
      navigation: 'McDonald’s Tromsø, Storgata 70, 9008 Tromsø, Norway',
      addressLabel: '用餐地址',
    },
    {
      id: 'oct05-library',
      type: '行程',
      title: 'Tromsø Bibliotek（特罗姆瑟图书馆 · 顺路看看）',
      startsAt: '12:50',
      endsAt: '13:20',
      detail: '看弧形屋顶和玻璃外墙，拍建筑与周边街景，停留 30 分钟。',
      navigation: 'Tromsø bibliotek og byarkiv, Grønnegata 94, 9008 Tromsø, Norway',
    },
    {
      id: 'oct05-waterfront',
      type: '行程',
      title: 'Stortorget（广场与酒店附近散步）',
      startsAt: '13:30',
      endsAt: '14:50',
      detail: '沿广场和海滨慢逛，拍港口、桥与对岸山景，也可以找咖啡馆坐坐，留 1 小时 20 分钟自由活动。',
      navigation: 'Stortorget, Tromsø, Norway',
    },
    {
      id: 'oct05-hotel-luggage',
      type: '行程',
      title: 'Scandic Ishavshotel（取行李与出发准备）',
      startsAt: '15:15',
      endsAt: '16:30',
      detail: "回酒店取行李、整理证件并休息，16:30 出发去机场。",
      navigation: 'Scandic Ishavshotel, Tromsø, Norway',
    },
    {
      id: 'oct05-airport-transfer',
      type: '行程',
      title: 'Tromsø Airport（前往特罗姆瑟机场）',
      startsAt: '16:30',
      endsAt: '17:15',
      detail: "乘机场巴士或出租车，17:15 抵达机场，办理托运和安检。",
      navigation: 'Tromsø Airport, Langnes, Norway',
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
        flightNumber: 'DY385',
        time: '10.05 19:50 — 21:45',
      },
    },
    {
      id: 'oct05-oslo-stay',
      type: '住宿',
      title: '奥斯陆住宿',
      startsAt: '22:15',
      detail: 'Radisson Hotel & Conference Centre Oslo Airport，Standard Room，1 人；10.05 15:00–18:30 入住，10.06 06:00–11:30 退房。Booking.com 预定，到店支付 1,435.50 NOK。',
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
      detail: 'TG955 13:45 从奥斯陆出发，10.07 06:15 抵达曼谷；中转仅 1 小时 45 分后搭乘 TG600，11:45 抵达香港。行李直挂，无需过境签；每人托运 23kg、手提 7kg。',
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
        <span>账号提示</span>
      </div>
      <div className="booking-access__credentials">
        {access.credentials.map((credential) => (
          <p key={credential.label}>{credential.label}：{credential.value}</p>
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
    </li>
  );
}

function TodayFocusCard({ dayIndex, focus }) {
  const cardRef = useRef(null);
  const [isDocked, setIsDocked] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      // Only dock after the whole card has scrolled above the viewport.
      setIsDocked(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    }, { threshold: 0 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [focus?.event.id]);

  if (!focus) return null;

  const { event } = focus;
  const hasAlerts = event.reservationStatus === '未预定' || event.paymentStatus === '未付款';

  return (
    <>
    {isDocked && (
      <button
        className="journey-island"
        type="button"
        aria-label={`查看完整行程：${event.title}`}
        onClick={() => cardRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
          block: 'center',
        })}
      >
        <span className="journey-island__type">{event.type}</span>
        <span className="journey-island__content">
          <strong>{event.title}</strong>
          <span>{formatEventTime(event)}</span>
        </span>
      </button>
    )}
    <article className="today-focus" ref={cardRef}>
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
    </article>
    </>
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
