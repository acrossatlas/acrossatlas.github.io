# 旅行模板复用规范

模板页：`/templates`。标准底稿：`public/templates/journey.json`，页面上的下载按钮提供同一份文件。

## 新建行程

1. 复制底稿到 `src/data/<journey-name>.json`，保留 `schemaVersion: 1`。
2. 填写 `title`、`destinations`、`startsOn` 和 `endsOn`。日期使用 YYYY-MM-DD；尚未确定时使用 null。
3. 从 `days` 中选择多地点游览、转场、单项活动的示例（原 driving / city / transfer / outdoor 标识保留兼容），按需复制和排序，删除不需要的示例。城市模板也用于休整和自由活动。
4. 每天赋予唯一 `id` 和真实 `date`。事件 `id` 在整趟旅行中必须唯一；复制后同步更新 `focusEventId` 和地图站点的 `eventId`。
5. 填写交通、住宿、Checklist 和相册。空白不等于已确认；保留 null 或空字符串，界面显示待填写。
6. 接入旅行页面后检查日期顺序、站点对应关系和移动端显示。

## 统一字段

- `events`：`startsAt` / `endsAt` 使用当地 HH:mm；不定时活动留空。`type` 为交通、住宿、行程或用餐；`title` 为事件名称；`navigation` 为导航地址；`detail` 为补充说明。
- `reservationStatus`：不适用、未预定、已预定。`paymentStatus`：不适用、未付款、已付款。`reservationNote` 仅用于不敏感的说明。
- `map.stops`：`id` 在当天唯一；通过 `eventId` 关联事件；`coordinates` 使用 [经度, 纬度] 或 null。
- `map.legs`：通过 `fromStopId` / `toStopId` 关联站点，记录 `mode`、`distanceKm`、`durationMinutes`；`geometry` 预留为 GeoJSON LineString 或 null。缺少路由数据时不得把直线当作真实导航路线。
- `focusEventId`：引用当天最重要的事件。
- `transport`：交通方式、名称、起止日期与说明；`stays`：住宿名称、入住 / 退房日期、地址与说明。
- `days[].group`：日期栏分组名称，相邻同组日期只显示一次分组标签。
- `map.preview`：模板预览的中心、缩放、连线开关；转场模板使用示例国家与整体边界。
- `checklist`：证件使用 `items`，行李使用 `groups`（随身携带 / 托运行李），各条目使用唯一 `id`，每项的 `checked` 默认 false。`album`：名称和链接。

## 当前实现边界

模板页为静态样板，下载得到空白底稿，预览勾选不会写入文件。四个示例日不是推荐行程顺序。普通单日地图使用真实纽约底图，默认中心 [-73.985, 40.748]、缩放 11.5。自驾沿真实道路、户外沿真实步行路网显示实线，城市只显示点位；转场使用中国与美国的国家总览作为示例，中国范围沿用原行程数据，美国范围使用 Natural Earth 数据。通用编号点仅为预览锚点，沿用 ongoing 标注样式并联动事件卡；陆地缺少实际路线数据时不绘线，不使用直线兜底；海运和航空使用起终点直连虚线。预览路网数据存储于 `src/data/template-new-york-routes.json`，来源及更新方法见同名 Markdown。

模板和 ongoing 共用 `EventCard` 与 `ChecklistGroup` 组件。原行程的清单保存键保持不变，模板勾选仅在当前页面有效。现有 ongoing 的真实路线仍由原地图组件承载；底稿暂不支持上传后自动生成完整旅行，也尚未将旧旅行数据整体迁移到此格式。新旅行接入时需配置真实地图和页面路由，可继续复用样板布局和共享事件卡。

公开部署继续遵循 PROJECT-CHARTER：不要把证件、预订凭证、私人住宿信息或实时敏感行程写入公开底稿。

## Day structure and map updates

Date navigation groups by country placeholder: 国家 A → 01.01, 01.02; 国家 B → 01.03, 01.04. `dateLabel` is a visual placeholder, while `date` remains null until a real trip is configured.

`structure` describes the day's organization: `multi-stop`, `single-activity`, or `transfer`. Driving/walking/public transport belong to route legs, rather than mutually exclusive day categories. The four previews demonstrate two multi-stop variants, one transfer, and one single-activity variant.

The transfer preview now uses China and the United States. Template maps use inline CARTO raster styles to reduce external dependencies, with an OpenStreetMap raster fallback after the initial load timeout. Retry reloads the map style without refreshing the page.
