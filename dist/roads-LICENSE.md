# 固定道路路线来源与使用边界

2026-10-14，一次性请求11组原行程驾车路线，缓存为 `work/source/dist/assets/road-routes.js`。页面读取本地文件，无运行时路线服务器、密钥、收费地图、公共瓦片下载或新外部依赖。

页面道路层应显示：**道路数据 © OpenStreetMap contributors · OSRM**。OpenStreetMap 文案链接 https://www.openstreetmap.org/copyright ，OSRM链接 https://project-osrm.org/ 。同时提供地图纠错入口 https://www.openstreetmap.org/ 。

- 数据来源：OpenStreetMap；许可为 Open Database License (ODbL) 1.0，https://opendatacommons.org/licenses/odbl/1-0/ 。保留本文件及下载数据里的来源，公开分发时保留署名与许可链接。
- 路线计算：OSRM，固定 car/driving profile，https://router.project-osrm.org/route/v1/driving/ 。OSRM程序为BSD-2-Clause；此项目只缓存计算结果，不分发引擎程序。
- 官方接口参数依据：https://project-osrm.org/docs/v5.24.0/api/ 。请求使用 overview=full、geometries=geojson、steps=true、alternatives=false。
- 公共服务当前政策：https://routing.openstreetmap.de/about.html ：最多每秒1次、正确User-Agent、适当来源与许可署名、无重度使用。本次11次按顺序请求，间隔至少1.1秒；UA为NordicJournalStaticRouteBuild/1.0，并注明个人非商业行程的一次性获取。
- https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy 明确其早期条款针对旧服务器，当前政策应看上述FOSSGIS入口。德国完整条款入口 https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/ 本次网页读取被Anubis阻止；已读官方服务页英文政策摘要。

## 行程与道路事实

`data.js`未改动。SHA256及各路线距离、顶点数、道路吸附距离见 `validation.json`。原始11组API响应独立缓存于本目录，重新构建优先读缓存。

原 `drivingKeys(day)` 保留在每条记录的 `originalKeys`。Day8在SVJ机场截止，Day10从KEF机场开始，排除两日飞行段。Day10 A与B分别独立计算。

Day15按原时间线纠正车辆路径为 `uthlid → p5 → tradarkot → kef-airport`：P5至Silfra报到为步行、浮潜后回停车地点；市区主停Traðarkot后步行购物与教堂游览，Harpa为替换景点/备选停车。没有新增地点、活动、日期或时刻。

路线沿OSRM道路网络计算，原点可能位于景区、机场或港口内部，因此道路终点与原始地点标记不必重合：KEF吸附约1217米；Flesa约526米；Gullfoss约396米；Skógafoss约389米；Brúarfoss约319米。保存原始坐标、吸附坐标与误差，页面不应用直线把景区/步行点强行连接为车辆路线。KEF原坐标不是精确租车柜台/航站楼道路位置，路线只表示机场区域接近路线。

11组全部返回Ok。所有腿的步骤类型为driving，无渡轮；原始路线顶点间无超过5公里的跳跃。挪威、冰岛各自的道路几何均未跨国；无飞行段。OSRM路径并不能证明未来道路开放、施工放行时间、冰雪通行条件或车辆有权进入特定入口，实际出发仍打开外部导航核对。

Day6原途经点Flesa、Day8原途经点Napp均作为强制waypoint保留；两天路线步骤均明确含 `Nappstraumtunnelen`，没有用最快算法绕开该隧道。Day8还含 `Fjøsdalen tunnel`、`Rørvikskartunnelen`。每条腿保存 `namedTunnels`，只记录接口步骤名称可识别的隧道，无法声称完整隧道清单。服务响应没有提供收费class或收费金额；`tollStatus: 'unknown'`。本数据不证明免费道路，也不计算通行费。既有Flesa/Napp施工放行时窗只来自原路书，不能因引擎估计驾车时间而删减或自动调整。

每条记录 `diagnostics` 公开保存超过200米的吸附误差及用户可读说明；特别标出KEF机场约1.2公里原点误差。地图显示层应保留可见说明，而非仅在隐藏日志记录。

`distance`单位米，`duration`单位秒；`durationKind: 'engine-estimate'`只表示引擎估算，无实时交通、天气、停车、步行、用餐、活动与休息时间，不能覆盖原行程时间线。数据的generatedAt为获取结果时刻；dataTimestamp按返回data_version原样记录，若null则来源未提供快照日期。

## 轻量底图结论

此次固定路线总览约2.6万顶点；本地路线几何可供浏览器离线画出真实道路弯曲。已有Natural Earth边界保留。全区域道路背景需要另行提取OSM道路网且体积与许可管理明显扩大；公共OSM瓦片不适合批量离线下载。因此本次不增加“看似道路”的手绘底图、不预下载公共瓦片，车辆实线来自已缓存的OSRM几何。
