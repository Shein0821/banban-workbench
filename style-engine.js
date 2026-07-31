/* ===== 搞点穿搭 - style-engine.js ===== */
/* 全局衣橱管理 + 穿搭算法引擎 v2 */
/* 此文件由 index.html 在 init() 前加载 */

var WARDROBE_CATS = ['内搭','上衣','外套','下装','连衣裙','鞋','配饰','包'];
var WARDROBE_COLORS = ['白色','米白','浅灰','深灰','黑色','藏青','雾霾蓝','天蓝','冷粉','玫瑰粉','薄荷绿','橄榄绿','驼色','棕色','酒红','姜黄'];
var WARDROBE_MATERIALS = ['棉','麻','丝绸','雪纺','针织','羊毛','牛仔','皮革','PU','涤纶','混纺','透气网布','防晒涂层','防风面料','速干'];
var WARDROBE_STYLES = ['通勤','休闲','复古','极简','法式','韩系','运动','度假','街头','优雅'];
var WARDROBE_SCENES = ['城市','自然','正式','度假','日常'];

function renderStyle() {
  var el = document.getElementById('styleContent');
  if (!el) return;
  var wardrobe = slGet('wardrobe', []);
  var trips = slGet('trips', []).filter(function(t) { return t.status === 'plan'; });

  var stats = { total: wardrobe.length, cats: {}, travelFav: 0 };
  wardrobe.forEach(function(w) {
    stats.cats[w.cat] = (stats.cats[w.cat] || 0) + 1;
    if (w.travelFav) stats.travelFav++;
  });

  var html = '<div class="style-section">'
    + '<div class="style-section-title">👗 我的衣橱</div>'
    + '<div class="style-subtitle">全局衣橱 · 所有行程共用 · 穿搭生成从这里调取数据</div>'
    + '<div class="style-stats">'
    + '<div class="style-stat"><div class="style-stat-num">' + stats.total + '</div><div class="style-stat-label">总件数</div></div>'
    + '<div class="style-stat"><div class="style-stat-num">' + stats.travelFav + '</div><div class="style-stat-label">旅行常用</div></div>';
  WARDROBE_CATS.forEach(function(c) {
    html += '<div class="style-stat"><div class="style-stat-num">' + (stats.cats[c] || 0) + '</div><div class="style-stat-label">' + c + '</div></div>';
  });
  html += '</div>';

  // filter bar
  html += '<div class="filter-bar" id="wardrobeFilterBar">'
    + '<span class="filter-chip active" data-fcat="all" onclick="filterWardrobe(\'all\',this)">全部</span>';
  WARDROBE_CATS.forEach(function(c) {
    html += '<span class="filter-chip" data-fcat="' + c + '" onclick="filterWardrobe(\'' + c + '\',this)">' + c + '</span>';
  });
  html += '</div>';

  if (!wardrobe.length) {
    html += '<div class="style-empty"><div class="style-empty-icon">👚</div><p>衣橱还是空的</p><p style="font-size:12px;margin-top:4px">添加你的衣服，旅行穿搭生成就能自动匹配了</p></div>';
  } else {
    html += '<div class="wardrobe-grid" id="wardrobeGrid">' + renderWardrobeCards(wardrobe, 'all') + '</div>';
  }

  html += '<div style="text-align:center;padding:14px 0 4px;">'
    + '<button class="life-btn life-btn-primary" onclick="openWardrobeModal()">+ 添加衣物</button>'
    + (wardrobe.length ? '<button class="life-btn life-btn-outline" style="margin-left:6px" onclick="batchAddWardrobe()">+ 批量录入</button>' : '')
    + '</div>';

  // trip quick links
  if (trips.length) {
    html += '<div class="style-section" style="margin-top:18px;padding-top:14px;border-top:2px dashed #e0e0e0">'
      + '<div class="style-section-title">✈️ 行程穿搭生成</div>'
      + '<div class="style-subtitle">选择一个计划中的行程，一键生成穿搭方案</div>';
    trips.forEach(function(t) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--card);border-radius:10px;padding:10px 12px;margin-bottom:6px;box-shadow:var(--shadow)">'
        + '<div><strong style="font-size:13.5px">' + escHtml(t.name) + '</strong>' + (t.country ? ' <span style="font-size:11.5px;color:var(--text-3)">' + escHtml(t.country) + '</span>' : '') + '</div>'
        + '<button class="life-btn life-btn-primary" style="padding:5px 12px;font-size:12px" onclick="genOutfitForTrip(\'' + t.id + '\')">生成穿搭 →</button>'
        + '</div>';
    });
    html += '</div>';
  } else {
    html += '<div class="style-section" style="margin-top:18px;padding-top:14px;border-top:2px dashed #e0e0e0">'
      + '<div class="style-section-title">✈️ 行程穿搭生成</div>'
      + '<div class="style-empty-sub" style="padding:16px">还没有「计划中」的行程<br><span style="font-size:11.5px;color:var(--text-3)">去「看看世界」添加目的地并推进到「计划中」，这里就能生成了</span></div>'
      + '</div>';
  }

  // buy list
  var buyList = slGet('buyList', []);
  if (buyList.length) {
    html += '<div class="style-section" style="margin-top:14px;padding-top:14px;border-top:2px dashed #e0e0e0">'
      + '<div class="style-section-title">🛒 购买追踪 <span style="font-weight:400;font-size:12px;color:var(--text-3)">(' + buyList.length + '项)</span></div>';
    buyList.forEach(function(b) {
      html += '<div class="gen-buy-item">'
        + '<div><span class="gen-buy-name">' + escHtml(b.name) + '</span>'
        + '<span style="font-size:11px;color:var(--text-3);margin-left:6px">' + (b.forTrip ? '· ' + escHtml(b.forTrip) : '') + ' · ' + escHtml(b.cat) + '</span></div>'
        + '<div>'
        + (!b.bought
          ? '<span class="gen-buy-action" onclick="markBought(\'' + b.id + '\')">✅ 已购</span>'
            + '<span class="gen-buy-action" style="margin-left:6px;color:#E65100" onclick="editBuyAddr(\'' + b.id + '\')">📦 改地址</span>'
          : '<span style="font-size:11.5px;color:#2E7D32;font-weight:600">已购买 ✓</span>')
        + '<span class="gen-buy-action" style="color:#AD1457;margin-left:6px" onclick="delBuyItem(\'' + b.id + '\')">删</span>'
        + '</div></div>';
    });
    html += '</div>';
  }

  el.innerHTML = html;
}

function renderWardrobeCards(wardrobe, filterCat) {
  var list = (filterCat && filterCat !== 'all') ? wardrobe.filter(function(w) { return w.cat === filterCat; }) : wardrobe;
  if (!list.length) return '<div class="style-empty-sub" style="grid-column:1/-1;padding:16px">该分类暂无衣物</div>';
  var catMap = {'内搭':'tag-cat-inner','上衣':'tag-cat-top','外套':'tag-cat-outer','下装':'tag-cat-bottom','连衣裙':'tag-cat-dress','鞋':'tag-cat-shoe','配饰':'tag-cat-accessory','包':'tag-cat-bag'};
  return list.map(function(w) {
    var cc = catMap[w.cat] || '';
    return '<div class="wardrobe-card' + (w.travelFav ? ' travel-fav' : '') + '" onclick="editWardrobeItem(\'' + w.id + '\')">'
      + '<div class="wardrobe-name">' + escHtml(w.name) + '</div>'
      + '<div class="wardrobe-meta">'
      + '<span class="wardrobe-tag ' + cc + '">' + w.cat + '</span>'
      + (w.color ? '<span class="wardrobe-tag" style="background:#E8EAF6;color:#283593">' + escHtml(w.color) + '</span>' : '')
      + (w.isLong ? '<span class="wardrobe-tag tag-long">长款</span>' : '')
      + (w.material ? '<span style="font-size:10.5px;color:var(--text-3)">' + escHtml(w.material) + '</span>' : '')
      + '</div>'
      + (w.style ? '<div style="font-size:11px;color:var(--text-3);margin-top:3px">风格: ' + escHtml(w.style) + ' | 场景: ' + escHtml(w.scene || '—') + '</div>' : '')
      + '</div>';
  }).join('');
}

function filterWardrobe(cat, el) {
  document.querySelectorAll('#wardrobeFilterBar .filter-chip').forEach(function(c) { c.classList.toggle('active', c === el); });
  var grid = document.getElementById('wardrobeGrid');
  if (grid) grid.innerHTML = renderWardrobeCards(slGet('wardrobe', []), cat);
}

function openWardrobeModal(editId) {
  var wardrobe = slGet('wardrobe', []);
  var item = editId ? wardrobe.find(function(w) { return w.id === editId; }) : null;
  var m = document.createElement('div');
  m.className = 'life-modal-overlay open';
  m.innerHTML = '<div class="life-modal" style="max-height:92vh;overflow-y:auto">'
    + '<div class="life-modal-title">' + (item ? '编辑衣物' : '添加衣物') + '</div>'
    + '<div class="life-form-group"><label class="life-form-label">名称 *</label>'
      + '<input class="life-form-input" id="wdName" value="' + (item ? escHtml(item.name) : '') + '" placeholder="如：白色针织开衫"/></div>'
    + '<div class="style-form-row">'
      + '<div class="life-form-group"><label class="life-form-label">类别 *</label>'
        + '<select class="style-select" id="wdCat">' + WARDROBE_CATS.map(function(c) { return '<option value="' + c + '"' + (item && item.cat === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '<div class="life-form-group"><label class="life-form-label">颜色</label>'
        + '<select class="style-select" id="wdColor"><option value="">未指定</option>' + WARDROBE_COLORS.map(function(c) { return '<option value="' + c + '"' + (item && item.color === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
    + '</div>'
    + '<div class="style-form-row">'
      + '<div class="life-form-group"><label class="life-form-label">材质</label>'
        + '<select class="style-select" id="wdMat"><option value="">未指定</option>' + WARDROBE_MATERIALS.map(function(c) { return '<option value="' + c + '"' + (item && item.material === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '<div class="life-form-group"><label class="life-form-label">风格</label>'
        + '<select class="style-select" id="wdStyle"><option value="">未指定</option>' + WARDROBE_STYLES.map(function(c) { return '<option value="' + c + '"' + (item && item.style === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
    + '</div>'
    + '<div class="style-form-row">'
      + '<div class="life-form-group"><label class="life-form-label">场景</label>'
        + '<select class="style-select" id="wdScene"><option value="">未指定</option>' + WARDROBE_SCENES.map(function(c) { return '<option value="' + c + '"' + (item && item.scene === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>'
      + '<div class="life-form-group"><label class="life-form-label">长度</label>'
        + '<select class="style-select" id="wdLong"><option value="0">短款/常规</option><option value="1"' + (item && item.isLong ? ' selected' : '') + '>长款（不露腿）</option></select></div>'
    + '</div>'
    + '<div class="life-form-group"><label class="life-form-label">日常可穿度</label>'
      + '<select class="style-select" id="wdDaily">'
        + '<option value="高">⭐ 高 — 日常经常穿</option>'
        + '<option value="中"' + (!item || !item.dailyWear || item.dailyWear === '中' ? ' selected' : '') + '>🔸 中 — 偶尔穿</option>'
        + '<option value="' + (item && item.dailyWear === 'low' ? 'selected' : '') + '">○ 低 — 特殊场合/旅行专用</option>'
      + '</select></div>'
    + '<div class="life-form-group"><label class="life-form-label">备注</label>'
      + '<input class="life-form-input" id="wdNotes" value="' + (item ? escHtml(item.notes || '') : '') + '" placeholder="品牌、尺码、特殊护理说明等"/></div>'
    + '<label style="display:flex;align-items:center;gap:6px;font-size:13px;margin:8px 0;cursor:pointer">'
      + '<input type="checkbox" id="wdTravelFav"' + (item && item.travelFav ? ' checked' : '') + '/> 标记为「旅行常用」（穿搭生成优先匹配）'
    + '</label>'
    + '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<button class="life-btn life-btn-primary" style="flex:1" onclick="saveWardrobeItem(\'' + (editId || '') + '\')">💾 保存</button>'
      + '<button class="life-btn life-btn-outline" style="flex:1" onclick="this.closest(\'.life-modal-overlay\').remove()">取消</button>'
      + (item ? '<button class="life-btn" style="color:#AD1457" onclick="deleteWardrobeItem(\'' + item.id + '\')">删除</button>' : '')
    + '</div></div>';
  document.body.appendChild(m);
  m.onclick = function(e) { if (e.target === m) m.remove(); };
}

function saveWardrobeItem(editId) {
  var name = document.getElementById('wdName').value.trim();
  if (!name) { alert('请输入名称'); return; }
  var wardrobe = slGet('wardrobe', []);
  var item = {
    id: editId || genId(),
    name: name,
    cat: document.getElementById('wdCat').value,
    color: document.getElementById('wdColor').value,
    material: document.getElementById('wdMat').value,
    style: document.getElementById('wdStyle').value,
    scene: document.getElementById('wdScene').value,
    isLong: document.getElementById('wdLong').value === '1',
    dailyWear: document.getElementById('wdDaily').value,
    notes: document.getElementById('wdNotes').value.trim(),
    travelFav: !!document.getElementById('wdTravelFav').checked
  };
  if (editId) {
    var idx = wardrobe.findIndex(function(w) { return w.id === editId; });
    if (idx >= 0) wardrobe[idx] = item;
  } else {
    wardrobe.push(item);
  }
  slSet('wardrobe', wardrobe);
  document.querySelector('.life-modal-overlay.open')?.remove();
  renderStyle();
}

function deleteWardrobeItem(id) {
  if (!confirm('确定删除这件衣物？')) return;
  var w = slGet('wardrobe', []);
  w = w.filter(function(x) { return x.id !== id; });
  slSet('wardrobe', w);
  document.querySelector('.life-modal-overlay.open')?.remove();
  renderStyle();
}

function editWardrobeItem(id) { openWardrobeModal(id); }

function batchAddWardrobe() {
  var m = document.createElement('div');
  m.className = 'life-modal-overlay open';
  m.innerHTML = '<div class="life-modal" style="max-width:480px">'
    + '<div class="life-modal-title">批量添加衣物</div>'
    + '<p style="font-size:12.5px;color:var(--text-2);margin-bottom:10px">每行一件，格式：<code>名称, 类别, 颜色, 材质</code><br>例：<code>白色针织开衫, 外套, 白色, 针织</code></p>'
    + '<textarea class="life-form-textarea" id="batchWdText" rows="10" placeholder="白色V领T恤, 上衣, 白色, 棉&#10;浅蓝牛仔裤, 下装, 浅蓝, 牛仔&#10;驼色风衣, 外套, 驼色, 混纺"></textarea>'
    + '<div style="display:flex;gap:8px;margin-top:12px">'
    + '<button class="life-btn life-btn-primary" style="flex:1" onclick="execBatchWardrobe()">导入</button>'
    + '<button class="life-btn life-btn-outline" style="flex:1" onclick="this.closest(\'.life-modal-overlay\').remove()">取消</button>'
    + '</div></div>';
  document.body.appendChild(m);
  m.onclick = function(e) { if (e.target === m) m.remove(); };
}

function execBatchWardrobe() {
  var text = document.getElementById('batchWdText').value.trim();
  if (!text) { alert('请输入内容'); return; }
  var lines = text.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
  var wardrobe = slGet('wardrobe', []);
  var added = 0;
  lines.forEach(function(line) {
    var parts = line.split(',').map(function(s) { return s.trim(); });
    if (!parts[0]) return;
    wardrobe.push({
      id: genId(), name: parts[0],
      cat: WARDROBE_CATS.indexOf(parts[1]) >= 0 ? parts[1] : '上衣',
      color: parts[2] || '', material: parts[3] || '',
      style: '', scene: '', isLong: false, dailyWear: '中',
      notes: '', travelFav: false
    });
    added++;
  });
  slSet('wardrobe', wardrobe);
  document.querySelector('.life-modal-overlay.open')?.remove();
  alert('成功导入 ' + added + ' 件衣物');
  renderStyle();
}

// Buy tracking
function addBuyListItem(b) {
  var bl = slGet('buyList', []);
  bl.push({ name: b.name, reason: b.reason, priority: b.priority, rec: b.rec, dailyOk: b.dailyOk, shipToHotel: b.shipToHotel, shipNote: b.shipNote, forTrip: b.forTrip, id: genId(), addedAt: new Date().toISOString(), bought: false });
  slSet('buyList', bl);
  alert('已加入购买清单：' + b.name);
}
function markBought(id) {
  var bl = slGet('buyList', []);
  var item = bl.find(function(x) { return x.id === id; });
  if (!item) return;
  item.bought = true;
  item.boughtAt = new Date().toISOString();
  slSet('buyList', bl);
  renderStyle();
}
function editBuyAddr(id) {
  var addr = prompt('修改收货地址（家 / 酒店）：');
  if (!addr) return;
  var bl = slGet('buyList', []);
  var item = bl.find(function(x) { return x.id === id; });
  if (!item) return;
  item.shipAddr = addr;
  slSet('buyList', bl);
  renderStyle();
}
function delBuyItem(id) {
  if (!confirm('确定删除？')) return;
  var b = slGet('buyList', []);
  b = b.filter(function(x) { return x.id !== id; });
  slSet('buyList', b);
  renderStyle();
}

// Outfit engine v2 - full version
var DEST_KB = {
  "京都": {
    "taboo": [
      "暴露装束(超短裙/深V露背)、过于鲜艳的荧光色、印有冒犯性图案"
    ],
    "palette": [
      "靛蓝",
      "绀色",
      "朱红",
      "鼠灰",
      "墨黑",
      "山吹色",
      "白"
    ],
    "weather": {
      "spring": "12-22C多雨",
      "summer": "25-35C湿热",
      "autumn": "15-26C凉爽",
      "winter": "2-10C干冷"
    },
    "vibe": "古都·禅意·和风·侘寂",
    "photoStyle": "温婉和风 / 极简留白 / 暗调情绪"
  },
  "圣托里尼": {
    "taboo": [
      "全身黑色(当地迷信)、过于暴露(教堂区域)、高跟鞋(石板路)"
    ],
    "palette": [
      "白",
      "蓝",
      "土黄",
      "陶红",
      "海蓝"
    ],
    "weather": {
      "spring": "15-24C微风",
      "summer": "25-32C烈日",
      "autumn": "18-26C温和",
      "winter": "10-18C多风"
    },
    "vibe": "蓝白·浪漫·爱琴海·日落",
    "photoStyle": "清新度假 / 蓝白撞色 / 电影感"
  },
  "冰岛": {
    "taboo": [
      "单薄外套(天气多变)、纯棉(不防水)、高跟鞋(冰川徒步)"
    ],
    "palette": [
      "黑",
      "灰",
      "军绿",
      "藏青",
      "燕麦白",
      "锈红"
    ],
    "weather": {
      "spring": "0-8C",
      "summer": "8-14C",
      "autumn": "0-8C",
      "winter": "-5到2C"
    },
    "vibe": "极地·荒野·冰川·极光",
    "photoStyle": "暗调机能 / 大地色系 / 电影史诗"
  },
  "大理": {
    "taboo": [
      "过于正式的礼服(除非婚礼)、全身迷彩(部分区域敏感)"
    ],
    "palette": [
      "白",
      "扎染蓝",
      "草木绿",
      "土棕",
      "浅杏",
      "灰"
    ],
    "weather": {
      "spring": "8-20C",
      "summer": "16-26C雨季",
      "autumn": "10-22C",
      "winter": "2-15C干燥"
    },
    "vibe": "苍山·洱海·慢生活·文艺",
    "photoStyle": "森系文艺 / 自然松弛 / 胶片感"
  },
  "摩洛哥": {
    "taboo": [
      "超短裙短裤(非度假区)、透明装束、过于暴露的上衣"
    ],
    "palette": [
      "陶土红",
      "沙漠金",
      "马赛克蓝",
      "象牙白",
      "橄榄绿",
      "藏青"
    ],
    "weather": {
      "spring": "12-25C",
      "summer": "20-37C酷热",
      "autumn": "14-28C",
      "winter": "8-20C昼夜大温差"
    },
    "vibe": "北非·迷宫·色彩·异域",
    "photoStyle": "浓郁撞色 / 异域风情 / 人文纪实"
  }
};
var BODY_RULES = {
  shape: '梨形身材 - 胯宽腿粗、腰细、肩颈后背线条好、轻微肌肉线条',
  face: '方圆脸',
  rules: [
    {rule:'不露腿', desc:'优先长裤/长裙/及踝裤，短裙短裤直接排除'},
    {rule:'显腰线', desc:'收腰设计、腰带、塞衣角，突出细腰优势'},
    {rule:'肩颈露出', desc:'大方领/V领/一字肩/挂脖，展示好看的肩颈后背'},
    {rule:'领型适配', desc:'方圆脸适合：V领 > 方领 > 大圆领 > 一字肩；避免小圆领、高领'},
    {rule:'上松下紧避让', desc:'避免紧身裤+宽松上衣；推荐A字裙/阔腿裤+修身上衣'},
    {rule:'鞋跟控制', desc:'出片可带一双精致跟鞋(拍照用)，主走选舒适平底/粗跟'}
  ]
};

var ACCESSORY_MATRIX = [
  {item:'丝巾', scenes:['下午茶','古镇','城市漫步','美术馆'], effect:'优雅气质加分'},
  {item:'墨镜', scenes:['海岛','自驾','城市街拍','机场'], effect:'瞬间提升时髦度'},
  {item:'金属耳环', scenes:['夜景','酒吧','精致晚餐','城市'], effect:'点亮面部'},
  {item:'珍珠饰品', scenes:['古镇','下午茶','日式庭院','美术馆'], effect:'温婉知性'},
  {item:'草编帽/贝雷帽', scenes:['海岛','度假','田园','欧洲小镇'], effect:'打造度假氛围'}
];

function genOutfitForTrip(tripId) {
  var trips = slGet('trips', []);
  var trip = trips.find(function(t) { return t.id === tripId; });
  if (!trip) { alert('行程不存在'); return; }

  var wardrobe = slGet('wardrobe', []);
  if (!wardrobe.length) {
    if (confirm('你的衣橱还是空的。\n\n是否去「搞点穿搭」添加衣物？')) {
      var m0 = document.querySelector('.life-modal-overlay.open'); if (m0) m0.remove();
      switchLifeTab('style'); renderStyle();
    }
    return;
  }

  if (!document.getElementById('planDeepBody')) openPlanDeep(tripId);
  var el = document.getElementById('planDeepBody');
  if (el) el.innerHTML = '<div style="text-align:center;padding:50px 20px">'
    + '<div style="font-size:36px;margin-bottom:10px">✨</div>'
    + '<div style="font-size:15px;font-weight:600;color:var(--primary-dark)">正在为「' + escHtml(trip.name) + '」生成穿搭方案...</div>'
    + '<div style="font-size:12px;color:var(--text-3);margin-top:6px">禁忌排除 → 温度筛选 → 色系匹配 → 身材规则 → 场景规划</div>'
    + '</div>';

  setTimeout(function() {
    var result = runOutfitEngine(trip, wardrobe);
    showOutfitResult(result, tripId);
  }, 350);
}

function runOutfitEngine(trip, wardrobe) {
  var dest = trip.name;
  var kb = DEST_KB[dest] || {};
  var mode = trip.travelMode || 'photo';

  // Step 1: taboo filter
  var forbidden = kb.taboo || [];
  var safeWardrobe = wardrobe.filter(function(w) {
    if (forbidden.some(function(f) {
      if (f.includes('超短裙') && w.cat === '下装' && !w.isLong) return true;
      if (f.includes('高跟鞋') && w.cat === '鞋' && w.name.includes('跟')) return true;
      if (f.includes('暴露') && w.cat === '下装' && !w.isLong) return true;
      if (f.includes('黑色') && w.color === '黑色' && dest === '圣托里尼') return true;
      if (f.includes('单薄') && w.material && ['雪纺','丝绸','棉'].indexOf(w.material) >= 0) return true;
      return false;
    })) return false;
    return true;
  });

  // Step 2: temp filter
  var tempStr = trip.itineraryText ? extractTempFromText(trip.itineraryText) : null;
  var seasonTemp = kb.weather ? Object.values(kb.weather)[0] : null;
  var avgTemp = parseAvgTemp(tempStr || seasonTemp || '15-25C');

  // Step 3: color scoring
  var destPalette = kb.palette || [];
  var colorScored = safeWardrobe.map(function(w) {
    var score = 0;
    if (w.color && destPalette.some(function(p) { return w.color.indexOf(p) >= 0 || p.indexOf(w.color) >= 0; })) score += 30;
    if (w.color && isColdTone(w.color)) score += 15;
    if (w.travelFav) score += 20;
    if (w.dailyWear === '高') score += 10;
    if (w.cat === '下装' && w.isLong) score += 25;
    if (['上衣','外套'].indexOf(w.cat) >= 0 && w.name.match(/V领|方领|一字肩|挂脖|露背/) !== null) score += 15;
    if (w.cat === '下装' && w.name.match(/A字|阔腿|直筒|长裙/) !== null) score += 20;
    if (w.cat === '配饰' && w.name.match(/丝巾|耳环|项链|墨镜/) !== null) score += 10;
    w._score = score;
    return w;
  }).sort(function(a, b) { return b._score - a._score; });

  // Categorize
  var tops = colorScored.filter(function(w) { return ['上衣','内搭'].indexOf(w.cat) >= 0; });
  var outers = colorScored.filter(function(w) { return w.cat === '外套'; });
  var bottoms = colorScored.filter(function(w) { return w.cat === '下装'; });
  var dresses = colorScored.filter(function(w) { return w.cat === '连衣裙'; });
  var shoes = colorScored.filter(function(w) { return w.cat === '鞋'; });
  var accessories = colorScored.filter(function(w) { return w.cat === '配饰'; });
  var bags = colorScored.filter(function(w) { return w.cat === '包'; });

  var pools = { tops: tops, outers: outers, bottoms: bottoms, dresses: dresses, shoes: shoes, accessories: accessories, bags: bags };

  // Scenes
  var pois = trip.pois || [];
  var scenes = pois.length > 0 ? buildScenesFromPois(pois) : defaultScenes(dest, mode);

  // Day plans
  var dayPlans = scenes.map(function(scene, idx) { return buildDayPlan(scene, idx, pools, colorScored, kb, mode); });

  // Capsule
  var capsule = buildCapsule(dayPlans, colorScored);

  // Buy suggestions
  var buySuggestions = buildBuySuggestions(capsule.missing, wardrobe, dest, kb, trip);

  return {
    dest: dest, country: trip.country || '', mode: mode,
    forbidden: forbidden, tempStr: tempStr || seasonTemp || '待确认',
    vibe: kb.vibe || '', photoStyle: kb.photoStyle || '',
    destPalette: destPalette, bodyRules: BODY_RULES,
    dayPlans: dayPlans, capsule: capsule,
    buySuggestions: buySuggestions,
    accessoryTips: ACCESSORY_MATRIX.filter(function(a) {
      return scenes.some(function(s) { return a.scenes.some(function(as) { return s.title.indexOf(as) >= 0 || s.type.indexOf(as) >= 0; }); });
    }),
    transitTip: buildTransitOutfit(colorScored, kb),
    photoPoses: [
      {bodyPart:'肩颈后背', pose:'侧身回头 + 手撩发 + 微微抬下巴', why:'你肩颈后背好看，这个角度最出片'},
      {bodyPart:'腰线', pose:'单手叉腰 / 侧身收腹 / 塞衣角强调腰线', why:'梨形身材腰细是最大优势'},
      {bodyPart:'整体', pose:'45度角站立（比正面显瘦）+ 重心放后腿', why:'经典模特站姿'},
      {bodyPart:'坐姿', pose:'侧坐 + 腿交叠伸向镜头方向', why:'坐着更显腰细腿长'}
    ]
  };
}

function extractTempFromText(text) {
  var m = text.match(/(\d+)\s*[-~～]\s*(\d+)\s*°?[CF]?/);
  return m ? m[1] + '-' + m[2] + 'C' : null;
}
function parseAvgTemp(str) {
  var m = str.match(/\d+/g);
  if (!m) return 20;
  return Math.round(m.reduce(function(a, b) { return a + Number(b); }, 0) / m.length);
}
function isColdTone(c) {
  return [/蓝/,/灰/,/白/,/薄荷/,/藏青/,/雾霾/,/银/].some(function(r) { return r.test(c); });
}
function getTravelPrefs() {
  return slGet('travelPrefs', {
    like: ['地方特色','文化底蕴','非遗','审美高级','特色体验','好吃','特色店铺'],
    forbid: ['危险','刺激','人多拥挤','脏乱差'],
    hotelHigh: ['瑰丽','万豪','丽思卡尔顿','柏悦','安缦'],
    hotelBudget: ['全季','桔子','亚朵','有特色民宿'],
    hotelRequire: ['干净','服务好','能出片','安全'],
    style: ['省心','出片','享受','体验当地']
  });
}

function defaultScenes(dest, mode) {
  var map = {
    '京都': [{title:'Day 1 抵达+祇园花见小路',type:'古城漫步,下午茶',vibe:'温婉和风'},{title:'Day 2 伏见稻荷+清水寺',type:'景点打卡,爬坡',vibe:'轻便出行'},{title:'Day 3 岚山竹林+岚电',type:'自然,火车',vibe:'森系文艺'},{title:'Day 4 锦市场+逛街',type:'美食,购物',vibe:'轻松休闲'}],
    '圣托里尼': [{title:'Day 1 抵达+伊亚日落',type:'小镇漫步,悬崖观景',vibe:'清新度假'},{title:'Day 2 红沙滩+白沙滩',type:'海滩,拍照',vibe:'海岛风情'},{title:'Day 3 费拉+游船',type:'城镇,出海',vibe:'浪漫蓝白'},{title:'Day 4 古遗迹+酒庄',type:'文化,品酒',vibe:'优雅知性'}],
    '冰岛': [{title:'Day 1 雷克雅未克+黄金圈',type:'城市,景点',vibe:'暗调机能'},{title:'Day 2 南岸瀑布+黑沙滩',type:'自然,徒步',vibe:'户外探险'},{title:'Day 3 冰河湖+钻石沙滩',type:'冰川,拍照',vibe:'电影史诗'},{title:'Day 4 蓝湖温泉+极光',type:'放松,夜拍',vibe:'温暖治愈'}],
    '大理': [{title:'Day 1 洱海边+S湾',type:'环海,骑行',vibe:'自然松弛'},{title:'Day 2 古城+喜洲',type:'古镇,人文',vibe:'森系文艺'},{title:'Day 3 苍山+寂照庵',type:'爬山,寺庙',vibe:'禅意清幽'},{title:'Day 4 双廊+拍照',type:'旅拍,闲逛',vibe:'胶片感'}],
    '摩洛哥': [{title:'Day 1 马拉喀什老城',type:'迷宫探索,市集',vibe:'浓郁异域'},{title:'Day 2 舍夫沙万蓝城',type:'小镇,摄影',vibe:'梦幻色彩'},{title:'Day 3 撒哈拉沙漠',type:'沙漠,骆驼',vibe:'旷野浪漫'},{title:'Day 4 非斯古城+皮革坊',type:'文化,手工',vibe:'人文深度'}]
  };
  return map[dest] || [{title:'Day 1 抵达+适应环境',type:'城市漫步',vibe:'轻松'},{title:'Day 2 主要景点打卡',type:'景点,拍照',vibe:'出片为主'},{title:'Day 3 深度体验',type:'文化,美食',vibe:'享受当地'},{title:'Day 4 闲逛+返程',type:'购物,休息',vibe:'悠闲'}];
}

function buildScenesFromPois(pois) {
  var days = [];
  for (var i = 0; i < pois.length; i += 3) {
    var slice = pois.slice(i, i + 3);
    days.push({ title: 'Day ' + (Math.floor(i / 3) + 1) + ' ' + slice.map(function(p) { return p.name; }).join('+'), type: slice.map(function(p) { return p.type; }).join(','), vibe: '根据攻略定制' });
  }
  return days.length ? days : defaultScenes('');
}

function buildDayPlan(scene, idx, pools, allWardrobe, kb, mode) {
  var sets = [];

  if (pools.dresses.length && idx < pools.dresses.length) {
    var d = pools.dresses[idx];
    var setItems = [d];
    if (pools.outers.length) setItems.push(pools.outers[0]);
    if (pools.accessories.length) setItems.push(pools.accessories[0]);
    sets.push({ label: '主造型(连衣裙)', items: setItems, tip: d.name + (d.isLong ? ' — 不露腿安心' : '') });
  } else {
    var topPick = pools.tops[idx % Math.max(pools.tops.length, 1)] || pools.tops[0];
    var bottomPick = (pools.bottoms.filter(function(b) { return b.isLong; })[idx % Math.max(pools.bottoms.filter(function(b) { return b.isLong; }).length, 1)]) || pools.bottoms.find(function(b) { return b.isLong; }) || pools.bottoms[0];
    var setItems2 = [topPick, bottomPick].filter(Boolean);
    if (pools.outers.length) setItems2.push(pools.outers[Math.min(idx, pools.outers.length - 1)]);
    sets.push({ label: '主造型(分体)', items: setItems2, tip: (bottomPick && bottomPick.isLong) ? '长裤/长裙 · 不露腿+显腰线' : '建议搭配长外套平衡比例' });
  }

  if (pools.shoes.length) sets[0].items.push(pools.shoes[idx % pools.shoes.length]);
  if (pools.bags.length) sets[0].items.push(pools.bags[idx % pools.bags.length]);
  if (pools.accessories.length) sets[0].items.push(pools.accessories[Math.min(idx, pools.accessories.length - 1)]);

  // Accessory tips
  var sceneAccTips = ACCESSORY_MATRIX.filter(function(a) {
    return scene.type.split(',').some(function(t) {
      return a.scenes.some(function(as) { return t.trim().indexOf(as) >= 0 || as.indexOf(t.trim()) >= 0; });
    });
  });
  if (sceneAccTips.length) {
    sets.push({
      label: '换配饰=换风格',
      items: sceneAccTips.slice(0, 2).map(function(a) { return {name: a.item + ' 🔄', cat: '配饰', _isTip: true, tip: a.effect}; }),
      tip: '不换衣服，换个配饰就切换一个风格'
    });
  }

  return { title: scene.title, type: scene.type, vibe: scene.vibe, sets: sets };
}

function buildCapsule(dayPlans, allWardrobe) {
  var used = {};
  var missing = { categories: [], specific: [] };
  dayPlans.forEach(function(dp) {
    dp.sets.forEach(function(set) {
      set.items.forEach(function(it) {
        if (!it._isTop) used[it.id] = true;
      });
    });
  });
  var usedIds = Object.keys(used);
  var usedItems = allWardrobe.filter(function(w) { return used[w.id]; });

  ['上衣','下装','外套','鞋','配饰'].forEach(function(cat) {
    if (!usedItems.some(function(w) { return w.cat === cat; })) missing.categories.push(cat);
  });

  if (!usedItems.some(function(w) { return w.isLong && ['下装','连衣裙'].indexOf(w.cat) >= 0; })) {
    missing.specific.push({name: '一条长裤或长裙（梨形必备）', reason: '不露腿原则 + 显瘦遮胯', priority: '高'});
  }
  if (!usedItems.some(function(w) { return w.cat === '外套'; })) {
    missing.specific.push({name: '一件适配温度的外套', reason: '应对温差/空调/早晚凉', priority: '高'});
  }
  if (!usedItems.some(function(w) { return w.cat === '配饰'; })) {
    missing.specific.push({name: '配饰组（丝巾+耳环+墨镜）', reason: '换配饰换风格的核心', priority: '中'});
  }

  return { totalUsed: usedIds.length, items: usedItems, missing: missing };
}

function buildBuySuggestions(missing, wardrobe, dest, kb, trip) {
  var suggestions = [];
  var destPaletteStr = (kb.palette || []).join('/');

  missing.specific.forEach(function(m) {
    suggestions.push({
      name: m.name, reason: m.reason, priority: m.priority,
      rec: '优先选 ' + destPaletteStr + ' 色系',
      dailyOk: m.reason.indexOf('梨形') >= 0 || m.reason.indexOf('核心') >= 0,
      shipToHotel: false, forTrip: trip.name
    });
  });

  missing.categories.forEach(function(cat) {
    suggestions.push({
      name: cat + ' x 1-2件', reason: '当前衣橱缺少' + cat + '，影响搭配完整性',
      priority: '中', rec: '选日常可穿的' + cat + '，旅行也能用',
      dailyOk: true, shipToHotel: false, forTrip: trip.name
    });
  });

  if (trip.date) {
    var dl = daysUntil(trip.date);
    suggestions.forEach(function(s) {
      s.shipToHotel = dl <= 7 && dl > 0;
      s.shipNote = s.shipToHotel ? '距出发约' + dl + '天，建议直接寄到酒店' : '时间充裕，可以寄到家再装箱';
    });
  }

  return suggestions;
}

function buildTransitOutfit(allWardrobe, kb) {
  var outer = allWardrobe.find(function(w) { return w.cat === '外套' && (w.name.indexOf('风衣') >= 0 || w.name.indexOf('大衣') >= 0 || w.name.indexOf('夹克') >= 0); });
  var shoe = allWardrobe.find(function(w) { return w.cat === '鞋' && (w.name.indexOf('小白鞋') >= 0 || w.name.indexOf('运动') >= 0 || w.name.indexOf('平底') >= 0); });
  return {
    tip: '机场/高铁穿搭 = 舒适 + 出片 + 落地能直接拍',
    items: [outer, shoe].filter(Boolean).map(function(w) { return w.name; }),
    advice: outer ? '这件外套落地可以直接当外拍层' : '建议带一件轻薄外套（飞机冷气+落地拍照两用）'
  };
}

function daysUntil(dateStr) {
  var m = dateStr.match(/(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/);
  if (!m) return 999;
  var target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.ceil((target - Date.now()) / 86400000);
}

function showOutfitResult(result, tripId) {
  var el = document.getElementById('planDeepBody') || document.getElementById('styleContent');
  var html = '<div class="gen-outfit-result">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'
      + '<div><span style="font-size:18px;font-weight:800;color:var(--primary)">✨ 穿搭方案 · ' + escHtml(result.dest) + '</span></div>'
      + '<div style="display:flex;gap:6px">'
        + '<button class="life-btn life-btn-outline" style="padding:5px 10px;font-size:11.5px" onclick="switchPlanTab(null, \'' + tripId + '\', \'outfit\')">← 返回</button>'
        + '<button class="life-btn life-btn-primary" style="padding:5px 10px;font-size:11.5px" onclick="saveOutfitResult(\'' + tripId + '\')">💾 存入行程</button>'
      + '</div></div>';

  // Block 1: destination check
  html += '<div class="gen-block"><div class="gen-block-title">🎯 目的地核对</div>'
    + '<div style="font-size:13px;line-height:1.8">'
    + '<strong>目的地：</strong>' + escHtml(result.dest) + (result.country ? ' (' + escHtml(result.country) + ')' : '') + '<br>'
    + '<strong>拍摄风格：</strong>' + result.photoStyle + '<br>'
    + '<strong>氛围关键词：</strong>' + result.vibe + '<br>'
    + '<strong>推荐色系：</strong>' + result.destPalette.map(function(p) { return '<span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:6px;font-size:12px;margin:1px">' + p + '</span>'; }).join('')
    + '<br><strong>预计温度：</strong>' + result.tempStr
    + '<br><strong>旅行方式：</strong>' + (result.mode === 'local' ? '🏠 当地生活型（租房子）' : '✈️ 出片型（集中拍摄+闲逛爽吃）')
    + '</div></div>';

  // Block 2: taboos
  html += '<div class="gen-block"><div class="gen-block-title">🚫 禁忌排除</div>'
    + '<div style="font-size:13px;line-height:1.7">' + (result.forbidden.length ? result.forbidden.map(function(f) { return '❌ ' + f; }).join('<br>') : '✅ 该目的地无特别禁忌') + '</div></div>';

  // Block 3: body rules
  html += '<div class="gen-block"><div class="gen-block-title">👤 你的身材规则</div>'
    + '<div style="font-size:12px;color:var(--text-2);margin-bottom:6px">' + result.bodyRules.shape + ' · ' + result.bodyRules.face + '</div>'
    + result.bodyRules.rules.map(function(r) {
      return '<div style="background:#FAFBFC;border-radius:8px;padding:8px 10px;margin-bottom:5px;font-size:13px"><strong style="color:var(--primary)">' + r.rule + '</strong> — ' + r.desc + '</div>';
    }).join('') + '</div>';

  // Block 4: day plans
  html += '<div class="gen-block"><div class="gen-block-title">📅 每日穿搭方案</div>'
    + '<div style="font-size:11.5px;color:var(--text-3);margin-bottom:10px">💡 核心思路：换配饰就能换风格，尽量少换衣服</div>';
  result.dayPlans.forEach(function(dp) {
    html += '<div class="gen-day-plan"><div class="gen-day-title">' + dp.title + '</div>'
      + '<div style="font-size:11.5px;color:var(--text-3);margin-bottom:6px">📍 ' + dp.type + ' · 🎨 ' + dp.vibe + '</div>';
    dp.sets.forEach(function(set) {
      html += '<div class="gen-outfit-set"><div class="gen-outfit-label">👗 ' + set.label + (set.tip ? ' — ' + set.tip : '') + '</div>'
        + '<div class="gen-outfit-items">';
      set.items.forEach(function(it) {
        if (it._isTip) {
          html += '<span style="background:#FFF8E1;padding:3px 8px;border-radius:6px;font-size:12px;margin:2px;display:inline-block">💡 ' + escHtml(it.name) + (it.tip ? ' <span style="color:#F57F17">' + escHtml(it.tip) + '</span>' : '') + '</span>';
        } else {
          html += '<span class="wardrobe-tag tag-cat-' + ({'内搭':'inner','上衣':'top','外套':'outer','下装':'bottom','连衣裙':'dress','鞋':'shoe','配饰':'accessory','包':'bag'}[it.cat] || 'inner') + '" style="margin:1px">' + escHtml(it.name) + '</span>';
        }
      });
      html += '</div></div>';
    });
    html += '</div>';
  });
  html += '</div>';

  // Block 5: transit
  html += '<div class="gen-block"><div class="gen-block-title">✈️ 机场/转运穿搭</div>'
    + '<div style="font-size:13px;line-height:1.7"><div class="gen-tip">' + result.transitTip.tip + '</div>'
    + '<div style="margin-top:6px"><strong>推荐：</strong>' + (result.transitTip.items.length ? result.transitTip.items.join(' + ') : '从衣橱挑选舒适+出片的组合')
    + '</div><div style="font-size:12px;color:var(--text-3);margin-top:4px">' + result.transitTip.advice + '</div></div></div>';

  // Block 6: photo poses
  html += '<div class="gen-block"><div class="gen-block-title">📸 出片姿势指南</div>';
  result.photoPoses.forEach(function(p) {
    html += '<div style="display:flex;gap:8px;margin-bottom:6px">'
      + '<span style="background:var(--primary);color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;white-space:nowrap;height:fit-content">' + p.bodyPart + '</span>'
      + '<span><strong>' + p.pose + '</strong> — <span style="color:var(--text-2)">' + p.why + '</span></span></div>';
  });
  html += '</div>';

  // Block 7: capsule
  html += '<div class="gen-block"><div class="gen-block-title">🧳 胶囊行李清单（共' + result.capsule.totalUsed + '件）</div>'
    + '<div style="font-size:13px;line-height:1.8">';
  result.capsule.items.forEach(function(w) {
    html += '☑️ ' + escHtml(w.name) + ' <span style="font-size:11px;color:var(--text-3)">(' + w.cat + (w.color ? '·' + w.color : '') + ')</span><br>';
  });
  html += '</div></div>';

  // Block 8: buy suggestions
  if (result.buySuggestions.length) {
    html += '<div class="gen-block"><div class="gen-block-title">🛒 购买建议</div>';
    result.buySuggestions.forEach(function(b) {
      html += '<div class="gen-buy-item"><div><span class="gen-buy-name">' + escHtml(b.name) + '</span>'
        + '<div style="font-size:11.5px;color:var(--text-2);margin-top:2px">' + b.reason + ' · 推荐：' + b.rec + '</div>'
        + (b.dailyOk ? '<div style="font-size:11px;color:#2E7D32;margin-top:2px">✅ 日常也能穿，值得投资</div>' : '')
        + '<div style="font-size:11.5px;color:var(--primary);margin-top:2px;font-weight:600">' + (b.shipNote || '') + '</div></div>'
        + '<button class="life-btn life-btn-primary" style="padding:4px 10px;font-size:11px" onclick="addBuyListItem(' + JSON.stringify(b).replace(/"/g, '&quot;') + ')">+ 加入购买清单</button></div>';
    });
    html += '</div>';
  }

  // Store for saving
  window._lastOutfitResult = result;
  window._lastOutfitTripId = tripId;

  el.innerHTML = html;
}

function saveOutfitResult(tripId) {
  if (!window._lastOutfitResult) { alert('没有可保存的结果'); return; }
  var trips = slGet('trips', []);
  var t = trips.find(function(x) { return x.id === tripId; });
  if (!t) return;
  t.outfitResult = window._lastOutfitResult;
  t.outfitSavedAt = new Date().toISOString();
  slSet('trips', trips);
  alert('✅ 穿搭方案已存入行程！');
}

// Plan outfit tab renderer (called from index.html switchPlanTab 'outfit')
function renderPlanOutfitTab(tripId) {
  var body = document.getElementById('planDeepBody');
  if (!body) return;
  var trips = slGet('trips', []);
  var t = trips.find(function(x) { return x.id === tripId; });
  if (!t) return;
  if (t.outfitResult) {
    showOutfitResult(t.outfitResult, tripId);
    return;
  }
  body.innerHTML = '<div style="text-align:center;padding:28px 16px">'
    + '<div style="font-size:38px;margin-bottom:10px">👗</div>'
    + '<div style="font-size:15px;font-weight:700;color:var(--primary-dark)">还没有「' + escHtml(t.name) + '」的穿搭方案</div>'
    + '<div style="font-size:12.5px;color:var(--text-2);margin:8px 0 16px">衣橱数据来自「搞点穿搭」（全局数据库）。<br>点击下方，按目的地禁忌 / 温度 / 色系 / 你的身材规则一键生成。</div>'
    + '<button class="life-btn life-btn-primary" style="padding:9px 18px" onclick="genOutfitForTrip(\'' + tripId + '\')">✨ 生成穿搭方案</button>'
    + '<div style="margin-top:14px"><button class="life-btn life-btn-outline" style="font-size:12px;padding:5px 12px" onclick="var m=document.querySelector(\'.life-modal-overlay.open\');if(m)m.remove();switchLifeTab(\'style\');renderStyle();">去「搞点穿搭」管理衣橱</button></div>'
    + '</div>';
}

console.log('[style-engine.js] 搞点穿搭模块已加载 ✅');
