// Amsterdam local time. Activity times are planning windows; booked status is preserved.
// Transport: 9292 checked for 2026-09-26; shuttle timetable linked by ibis (July 2026 file).
// Sources: https://9292.nl/en/ ; https://www.ibisschipholamsterdamairport.com/the-hotel/airport-shuttle-park-sleep-and-fly-parking/
// Begijnhof: https://begijnhofkapelamsterdam.nl/begijnhofkapel/toegang-entrance-begijnhof-en-begijnhofkapel/
// Van Gogh: two issued e-tickets reviewed 2026-09-17; names, ticket numbers and codes stay private.
// Entry window: https://tickets.vangoghmuseum.com/en/vincentopvrijdag/tickets (checked 2026-09-17).
// The printed 19:00-22:00 window conflicts with the ticket notes; preserve that warning below.
export const amsterdamStay = {
  "id": "netherlands-stay",
  "startsOn": "2026-09-25",
  "endsOn": "2026-09-27",
  "title": "ibis Schiphol Amsterdam Airport（红色 ibis）",
  "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands",
  "checkIn": "09.25 15:00 后",
  "checkOut": "09.27 12:00 前",
  "reservation": "Booking.com → 预订",
  "note": "Superior Double Room（高级双人房），1 间。\n未付款。"
};

export const amsterdamDays = {
  "2026-09-25": [
    {
      "id": "sep25-arrival",
      "type": "交通",
      "title": "Schiphol 抵达、取行李与寄存",
      "startsAt": "07:40",
      "detail": "入境、取行李后前往 ibis 寄存；上午安排随落地进度调整。",
      "endsAt": "10:00",
      "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands"
    },
    {
      "id": "sep25-coffee",
      "type": "行程",
      "title": "九街附近咖啡",
      "startsAt": "11:00",
      "detail": "先喝咖啡、休息。10:00 酒店出发；397 10:18–10:49，Knooppunt Noord → Elandsgracht，下车后步行到九街。",
      "endsAt": "11:30",
      "navigation": "De 9 Straatjes, Amsterdam"
    },
    {
      "id": "sep25-nine-streets",
      "type": "行程",
      "title": "九街散步、逛店与午餐",
      "startsAt": "11:30",
      "detail": "Berenstraat、Wolvenstraat 一带逛店，沿途午餐。",
      "endsAt": "13:00",
      "navigation": "Berenstraat, Amsterdam"
    },
    {
      "id": "sep25-begijnhof",
      "type": "行程",
      "title": "Begijnhof 贝居安会院",
      "startsAt": "13:15",
      "endsAt": "13:45",
      "detail": "开放 09:30–18:00；从 Gedempte Begijnensloot 入口进入，安静参观。",
      "navigation": "Gedempte Begijnensloot, Amsterdam"
    },
    {
      "id": "sep25-flower-market",
      "type": "行程",
      "title": "Bloemenmarkt 花市",
      "startsAt": "13:55",
      "endsAt": "14:20",
      "detail": "Singel 运河花市，逛摊约 25 分钟。",
      "navigation": "Bloemenmarkt, Singel, Amsterdam"
    },
    {
      "id": "sep25-amsterdam-stay",
      "type": "住宿",
      "title": "ibis 入住与午休",
      "startsAt": "15:30",
      "detail": "入住、午休。花市步行到 Leidseplein；397 14:41–15:10 至 Knooppunt Noord，再步行回酒店。",
      "endsAt": "17:15",
      "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands",
      "reservationStatus": "已预定",
      "paymentStatus": "未付款",
      "reservation": {
        "reference": "Booking.com → 预订 → ibis Schiphol Amsterdam Airport",
        "time": "09.25 15:00 后 — 09.27 12:00 前",
        "instruction": "Superior Double Room（高级双人房），1 间。\n未付款。"
      },
      "bookingAccess": {
        "url": "https://www.booking.com/myreservations.html",
        "credentials": [
          {
            "label": "订单联系邮箱",
            "value": "2*********@qq.com"
          }
        ]
      }
    },
    {
      "id": "sep25-dinner",
      "type": "用餐",
      "title": "博物馆区晚餐",
      "startsAt": "18:00",
      "detail": "17:15 酒店出发；397 17:27–17:47 到 Museumplein。附近晚餐，19:15 左右到博物馆入口。",
      "endsAt": "19:15",
      "navigation": "Museumplein, Amsterdam"
    },
    {
      "id": "sep25-van-gogh",
      "type": "行程",
      "title": "梵高博物馆 · Vincent on Friday",
      "startsAt": "19:30",
      "detail": "已出票：2 张成人票，EUR 11／张，合计 EUR 22。看画、音乐与活动。\n19:15 左右到主入口，暂按 19:30 入场。票面时间与入场须知不一致，详见「预定信息」。",
      "endsAt": "23:00",
      "navigation": "Van Gogh Museum, Museumplein 6, 1071 DJ Amsterdam, Netherlands",
      "reservationStatus": "已预定",
      "paymentStatus": "已付款",
      "reservation": {
        "reference": "已保存的梵高博物馆电子票 PDF：共 2 页，每页 1 张成人票。购票日期：2026.09.16。",
        "time": "2026.09.25（周五，阿姆斯特丹当地时间）\n行程暂按 19:30–23:00；官网及票券须知：19:30–22:30 可入场，票券须知注明 23:00 结束。\n注意：票面另写 19:00–22:00，与须知不一致，出发前请向馆方确认。",
        "instruction": "2 张成人票，EUR 11／张，合计 EUR 22。直接前往博物馆主入口（Museumplein 6），分别出示两页电子票扫码入场。\n提前在手机离线保存原票，勿折损或涂改二维码；仅限票载日期使用，不可退款。\n馆方咨询电话：+31 20 570 5200。"
      }
    },
    {
      "id": "sep25-night-bus",
      "type": "住宿",
      "title": "阿姆斯特丹住宿",
      "startsAt": "夜间",
      "detail": "Museumplein 乘 397，23:13–23:33 到 Knooppunt Noord，步行回 ibis。",
      "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands"
    }
  ],
  "2026-09-26": [
    {
      "id": "sep26-market",
      "type": "行程",
      "title": "Noordermarkt 农夫集市",
      "startsAt": "11:30",
      "detail": "周六 09:00–16:00。\n10:25 酒店出发；10:40 乘 397，Museumplein 转 5 路至 Marnixplein，步行约 10 分钟。计划 11:21 抵达；Museumplein 换乘仅 2 分钟，未赶上则顺延游览。",
      "endsAt": "12:30",
      "navigation": "Noordermarkt, Amsterdam"
    },
    {
      "id": "sep26-lunch",
      "type": "用餐",
      "title": "午餐",
      "startsAt": "12:30",
      "endsAt": "13:30",
      "detail": "集市周边或沿途餐厅自选，坐下休息。",
      "navigation": "Noordermarkt, Amsterdam"
    },
    {
      "id": "sep26-jordaan",
      "type": "行程",
      "title": "运河散步 · Haarlemmerstraat 购物街",
      "startsAt": "13:30",
      "detail": "沿 Brouwersgracht 运河散步，再到 Haarlemmerstraat 购物街逛小店，向中央站慢行；Jordaan 体验融入集市周边，不另绕远。",
      "endsAt": "14:15",
      "navigation": "Brouwersgracht, Amsterdam"
    },
    {
      "id": "sep26-damrak",
      "type": "行程",
      "title": "Damrak 运河街景",
      "startsAt": "14:15",
      "endsAt": "15:00",
      "detail": "从中央站沿 Damrak 向南，运河拍照、逛街。",
      "navigation": "Damrak, Amsterdam"
    },
    {
      "id": "sep26-dam",
      "type": "行程",
      "title": "Dam 广场",
      "startsAt": "15:00",
      "detail": "广场、王宫外观及周边街道。",
      "endsAt": "16:00",
      "navigation": "Dam, Amsterdam"
    },
    {
      "id": "sep26-coffee-break",
      "type": "用餐",
      "title": "咖啡与休息",
      "startsAt": "16:00",
      "endsAt": "17:00",
      "detail": "Dam 周边休息；17:00 前出发前往中央站旁 Flagship 码头，17:15 集合。",
      "navigation": "Dam, Amsterdam"
    },
    {
      "id": "sep26-cruise",
      "type": "行程",
      "title": "Flagship 运河游船（中央站出发）",
      "startsAt": "17:30",
      "detail": "17:15 集合，17:30 开船；航程约 1 小时，英文现场导览。\n在中央站市中心侧码头找橘色制服的 Flagship 工作人员，出示电子船票。",
      "endsAt": "18:30",
      "navigation": "Prins Hendrikkade 33A, Amsterdam, Netherlands",
      "addressLabel": "集合码头",
      "reservationStatus": "已预定",
      "reservation": {
        "reference": "订单号 ARY788197 · 2 位成人；电子船票见淘宝订单／已保存的 PDF",
        "time": "09.26 17:30 — 约18:30（阿姆斯特丹当地时间；17:15 集合）",
        "instruction": "出示两位成人各自的电子凭证二维码。所选套餐为中央站出发，集合地址 Prins Hendrikkade 33A；票内另列的 Prinsengracht 地址与套餐不符，勿据此导航。"
      }
    },
    {
      "id": "sep26-dinner",
      "type": "用餐",
      "title": "老城晚餐",
      "startsAt": "18:30",
      "detail": "下船后在老城附近用餐。",
      "endsAt": "19:30"
    },
    {
      "id": "sep26-de-wallen",
      "type": "行程",
      "title": "Oude Kerk 老教堂 · De Wallen 红灯区",
      "startsAt": "19:30",
      "detail": "老教堂、Oudezijds 运河周边；20:25 结束，步行前往中央站。",
      "endsAt": "20:25",
      "navigation": "Oude Kerk, Amsterdam"
    },
    {
      "id": "sep26-amsterdam-stay",
      "type": "住宿",
      "title": "阿姆斯特丹住宿",
      "startsAt": "约21:30",
      "detail": "返程参考：20:25 从老教堂附近出发；20:48–21:05 中央站 → Schiphol，接 21:17 酒店巴士。\n次日出门前退房、寄存行李。",
      "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands",
      "reservationStatus": "已预定",
      "paymentStatus": "未付款",
      "reservation": {
        "reference": "Booking.com → 预订 → ibis Schiphol Amsterdam Airport",
        "time": "09.25 15:00 后 — 09.27 12:00 前",
        "instruction": "Superior Double Room（高级双人房），1 间。\n未付款。"
      },
      "bookingAccess": {
        "url": "https://www.booking.com/myreservations.html",
        "credentials": [
          {
            "label": "订单联系邮箱",
            "value": "2*********@qq.com"
          }
        ]
      }
    }
  ]
};

export const amsterdamDepartureEvents = [
  {
    "id": "sep27-checkout",
    "type": "住宿",
    "title": "ibis 退房、寄存行李",
    "startsAt": "08:30",
    "detail": "行李留酒店，轻装参观；下午取回后去机场。",
    "endsAt": "08:45",
    "navigation": "ibis Schiphol Amsterdam Airport, Schipholweg 181, 1171 PK Badhoevedorp, Netherlands"
  },
  {
    "id": "sep27-rijksmuseum",
    "type": "行程",
    "title": "Rijksmuseum 国立博物馆",
    "startsAt": "10:00",
    "detail": "10:00 入馆，计划参观至 12:30；票券入场时段 10:00–11:00。\n08:45 酒店出发；397 09:02–09:19 到 Museumplein，再步行到博物馆。电子票见「预定信息」。",
    "endsAt": "12:30",
    "navigation": "Rijksmuseum, Museumstraat 1, Amsterdam",
    "reservationStatus": "已预定",
    "paymentStatus": "已付款",
    "reservation": {
      "reference": "在购票 Gmail 确认邮件查看／下载电子票（订单号 27984897）",
      "time": "09.27 10:00–11:00 入场",
      "instruction": "2 位成人，已付款 EUR 50。出示确认邮件内电子票；邮箱搜索 Rijksmuseum 或 27984897。"
    }
  },
  {
    "id": "sep27-hotel-luggage",
    "type": "用餐",
    "title": "午餐",
    "startsAt": "12:30",
    "detail": "博物馆附近用餐；397 13:09–13:34，Museumplein → Knooppunt Noord，回酒店取行李。",
    "endsAt": "13:00",
    "navigation": "Museumplein, Amsterdam"
  },
  {
    "id": "sep27-airport-taxi",
    "type": "交通",
    "title": "离开酒店，前往机场",
    "startsAt": "14:00",
    "detail": "14:00 酒店接驳发车；提前候车，目标 14:30 前抵达航站楼。接驳表未公布到达时间。",
    "endsAt": "14:30",
    "navigation": "Schiphol Airport, Netherlands"
  }
];
