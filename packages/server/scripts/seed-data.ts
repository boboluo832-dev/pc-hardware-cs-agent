import Database from "better-sqlite3";
import { config } from "../src/config/index.js";
import { initDatabase } from "../src/knowledge/init-db.js";

initDatabase();

const db = new Database(config.db.path);

const insertProduct = db.prepare(
  "INSERT OR REPLACE INTO products (sku, name, category, specs) VALUES (?, ?, ?, ?)"
);

const insertKB = db.prepare(
  "INSERT OR REPLACE INTO knowledge_base (title, content, category, product_line, tags) VALUES (?, ?, ?, ?, ?)"
);

const products = [
  {
    sku: "CASE-ATX-001",
    name: "幻影 X1 ATX 机箱",
    category: "case",
    specs: {
      form_factor: "ATX",
      supported_motherboards: ["ATX", "M-ATX", "ITX"],
      max_gpu_length: 380,
      max_cooler_height: 170,
      supported_psu_types: ["ATX"],
      dimensions: "450x210x480mm",
      drive_bays: { "3.5": 2, "2.5": 4 },
      fan_slots: { front: 3, top: 2, rear: 1 },
    },
  },
  {
    sku: "CASE-ITX-001",
    name: "灵动 Mini ITX 机箱",
    category: "case",
    specs: {
      form_factor: "ITX",
      supported_motherboards: ["ITX"],
      max_gpu_length: 320,
      max_cooler_height: 145,
      supported_psu_types: ["SFX", "SFX-L"],
      dimensions: "320x150x340mm",
      drive_bays: { "2.5": 2 },
      fan_slots: { bottom: 2, rear: 1 },
    },
  },
  {
    sku: "CASE-MATX-001",
    name: "锐界 M1 M-ATX 机箱",
    category: "case",
    specs: {
      form_factor: "M-ATX",
      supported_motherboards: ["M-ATX", "ITX"],
      max_gpu_length: 350,
      max_cooler_height: 160,
      supported_psu_types: ["ATX", "SFX"],
      dimensions: "400x200x420mm",
      drive_bays: { "3.5": 1, "2.5": 3 },
      fan_slots: { front: 2, top: 1, rear: 1 },
    },
  },
  {
    sku: "PSU-750W-001",
    name: "雷霆 750W 金牌全模组电源",
    category: "psu",
    specs: {
      wattage: 750,
      efficiency: "80+ Gold",
      modular: "full",
      form_factor: "ATX",
      connectors: ["24pin ATX", "8pin CPU", "8pin CPU", "16pin 12VHPWR", "8pin PCIe x2", "SATA x6"],
      atx_version: "ATX 3.0",
      dimensions: "150x86x160mm",
      fan_size: "120mm",
      warranty_years: 10,
    },
  },
  {
    sku: "PSU-550W-001",
    name: "稳行 550W 铜牌电源",
    category: "psu",
    specs: {
      wattage: 550,
      efficiency: "80+ Bronze",
      modular: "semi",
      form_factor: "ATX",
      connectors: ["24pin ATX", "8pin CPU", "8pin PCIe x1", "SATA x4", "Molex x2"],
      atx_version: "ATX 2.52",
      dimensions: "150x86x140mm",
      fan_size: "120mm",
      warranty_years: 5,
    },
  },
  {
    sku: "PSU-SFX-650",
    name: "迷你雷 650W SFX 金牌电源",
    category: "psu",
    specs: {
      wattage: 650,
      efficiency: "80+ Gold",
      modular: "full",
      form_factor: "SFX",
      connectors: ["24pin ATX", "8pin CPU", "16pin 12VHPWR", "8pin PCIe x1", "SATA x4"],
      atx_version: "ATX 3.0",
      dimensions: "125x63.5x100mm",
      fan_size: "92mm",
      warranty_years: 7,
    },
  },
  {
    sku: "COOL-TOWER-001",
    name: "冰封塔 双塔散热器",
    category: "cooler",
    specs: {
      type: "air",
      tdp: 260,
      height: 158,
      supported_sockets: ["LGA1700", "LGA1200", "AM5", "AM4"],
      fan_count: 2,
      fan_size: "120mm",
      noise_level: "28dBA",
      weight: "980g",
    },
  },
  {
    sku: "COOL-AIO-240",
    name: "寒流 240 一体式水冷",
    category: "cooler",
    specs: {
      type: "aio_liquid",
      tdp: 300,
      radiator_size: "240mm",
      supported_sockets: ["LGA1700", "LGA1200", "AM5", "AM4"],
      fan_count: 2,
      fan_size: "120mm",
      noise_level: "25dBA",
      tube_length: "400mm",
    },
  },
  {
    sku: "COOL-AIO-360",
    name: "寒流 360 一体式水冷",
    category: "cooler",
    specs: {
      type: "aio_liquid",
      tdp: 350,
      radiator_size: "360mm",
      supported_sockets: ["LGA1700", "LGA1200", "AM5", "AM4"],
      fan_count: 3,
      fan_size: "120mm",
      noise_level: "26dBA",
      tube_length: "400mm",
      has_screen: true,
      screen_size: "2.1 inch",
      screen_resolution: "480x480",
    },
  },
  {
    sku: "SCREEN-AIO-001",
    name: "寒流 360 Pro 智显水冷",
    category: "smart_screen",
    specs: {
      type: "aio_liquid_with_screen",
      tdp: 350,
      radiator_size: "360mm",
      supported_sockets: ["LGA1700", "LGA1200", "AM5", "AM4"],
      screen_size: "5 inch",
      screen_resolution: "800x480",
      screen_connection: "USB + 磁吸触点",
      software_version: "v2.3.1",
      min_software_version: "v2.0.0",
    },
  },
  {
    sku: "SCREEN-CASE-001",
    name: "幻影 X1 Pro 智显机箱",
    category: "smart_screen",
    specs: {
      form_factor: "ATX",
      supported_motherboards: ["ATX", "M-ATX", "ITX"],
      max_gpu_length: 380,
      max_cooler_height: 170,
      supported_psu_types: ["ATX"],
      screen_size: "6.8 inch",
      screen_resolution: "1280x400",
      screen_connection: "内置排线 + 触点",
      software_version: "v3.1.0",
      min_software_version: "v3.0.0",
    },
  },
];

const knowledgeBase = [
  {
    title: "带屏幕产品安装后屏幕不亮 - 排查指南",
    content: `## 屏幕不亮排查步骤

1. **检查触点连接**
   - 将屏幕模块取下，用干净的棉签轻轻擦拭触点表面
   - 重新安装时确保听到"咔嗒"声，表示卡扣到位
   - 检查触点是否有氧化或异物

2. **检查连接线**
   - 确认 USB 连接线已正确插入主板 USB 接口
   - 尝试更换 USB 接口（建议使用主板背板 USB 口）
   - 检查线材是否有折损

3. **检查软件版本**
   - 打开控制软件，查看当前固件版本
   - 对照产品页面确认最低支持版本
   - 如版本过低，请先升级软件再重启

4. **硬件检测**
   - 如以上步骤均无效，可能是屏幕硬件故障
   - 建议联系售后寄回检测（保修期内免费）`,
    category: "troubleshooting",
    product_line: "smart_screen",
    tags: ["屏幕不亮", "触点", "安装", "排查"],
  },
  {
    title: "智能产品软件版本不匹配问题",
    content: `## 软件版本问题解决方案

**症状**：屏幕亮但无法正常显示内容，或显示异常/花屏

**原因**：控制软件版本与固件版本不匹配

**解决步骤**：
1. 访问官网下载中心，下载最新版控制软件
2. 卸载旧版软件（控制面板 → 程序卸载）
3. 安装新版软件并重启电脑
4. 打开软件后会自动检测固件版本，按提示升级
5. 升级完成后重启设备

**注意事项**：
- 升级过程中请勿断电或拔出连接线
- 如升级失败，长按设备 Reset 键 10 秒恢复出厂
- 最低支持版本请查看产品规格页`,
    category: "smart_screen",
    product_line: "smart_screen",
    tags: ["软件版本", "固件", "升级", "花屏"],
  },
  {
    title: "电源瓦数选择指南",
    content: `## 如何选择合适的电源瓦数

**基本原则**：电源额定功率应为整机满载功耗的 1.3-1.5 倍

**常见配置推荐**：
- i5/R5 + RTX 4060：建议 550W 起步
- i7/R7 + RTX 4070：建议 650W 起步
- i7/R7 + RTX 4080：建议 750W 起步
- i9/R9 + RTX 4090：建议 850W-1000W

**注意事项**：
- RTX 40 系列显卡建议选择 ATX 3.0 电源（原生 12VHPWR 接口）
- 使用转接线有烧毁风险，建议原生接口
- 超频用户额外预留 100-150W`,
    category: "faq",
    product_line: "psu",
    tags: ["瓦数", "选择", "功耗", "推荐"],
  },
  {
    title: "散热器与 CPU 兼容性说明",
    content: `## 散热器插槽兼容性

我司散热器均附带多平台扣具，支持以下插槽：
- Intel: LGA1700, LGA1200
- AMD: AM5, AM4

**安装注意**：
- LGA1700 需使用专用背板（包装内附带）
- AM5 与 AM4 共用同一套扣具
- 安装前请确认已选择正确的扣具组

**TDP 匹配建议**：
- 65W TDP CPU：任意散热器均可
- 125W TDP CPU：建议双塔风冷或 240 水冷起步
- 170W+ TDP CPU：建议 360 水冷
- 超频场景：在上述基础上提升一档`,
    category: "faq",
    product_line: "cooler",
    tags: ["兼容性", "插槽", "TDP", "安装"],
  },
  {
    title: "保修政策",
    content: `## 售后保修政策

**保修期限**：
- 机箱：2 年质保
- 电源：按产品标注（5-10 年）
- 散热器：3 年质保
- 智能屏幕产品：2 年质保（屏幕 1 年）

**保修范围**：
- 非人为损坏的产品质量问题
- 正常使用下的功能故障

**不在保修范围**：
- 人为拆解、改装造成的损坏
- 自然灾害、电压异常导致的损坏
- 超过保修期限

**退换货政策**：
- 7 天无理由退换（未拆封）
- 15 天内质量问题可换新
- 保修期内免费维修（来回运费由公司承担）

**售后流程**：
1. 联系客服确认问题
2. 获取售后单号
3. 寄回产品（附购买凭证）
4. 检测维修（3-7 个工作日）
5. 寄回用户`,
    category: "policy",
    product_line: "general",
    tags: ["保修", "退换货", "售后", "流程"],
  },
  {
    title: "机箱风扇安装与走线指南",
    content: `## 机箱风扇安装

**风道建议**：前进后出、下进上出

**安装位置**：
- 前面板：进风（风扇标签面朝外）
- 顶部：出风（风扇标签面朝上）
- 后部：出风（风扇标签面朝后）

**接线说明**：
- 3pin：仅支持电压调速
- 4pin PWM：支持 PWM 智能调速（推荐）
- ARGB 线：连接主板 5V 3pin 接口（注意不要插到 12V!）

**常见问题**：
- 风扇不转：检查供电接口是否插紧
- 噪音大：检查是否与机箱共振，可加装减震垫
- RGB 不亮：确认 ARGB 线正确连接到 5V 3pin`,
    category: "installation",
    product_line: "case",
    tags: ["风扇", "安装", "走线", "风道"],
  },
  {
    title: "电源异响/不开机排查",
    content: `## 电源故障排查

**电源无法开机**：
1. 确认电源开关已打开（后部 I/O 开关）
2. 检查电源线是否插紧
3. 短接 24pin 主板接口的绿线和任意黑线测试电源是否工作
4. 如风扇转动说明电源正常，问题在主板端

**电源异响**：
- 高频啸叫：轻载时正常现象，如严重可申请换新
- 风扇异响：可能是风扇轴承问题，保修期内免费更换
- 电流声：检查是否接地正常

**过载保护触发**：
- 电源自动关机可能是过载保护
- 检查整机功耗是否超过电源额定功率
- 检查是否有短路情况`,
    category: "troubleshooting",
    product_line: "psu",
    tags: ["不开机", "异响", "故障", "排查"],
  },
];

db.transaction(() => {
  for (const p of products) {
    insertProduct.run(p.sku, p.name, p.category, JSON.stringify(p.specs));
  }
  for (const kb of knowledgeBase) {
    insertKB.run(kb.title, kb.content, kb.category, kb.product_line, JSON.stringify(kb.tags));
  }
})();

console.log(`Seeded ${products.length} products and ${knowledgeBase.length} knowledge base entries.`);
db.close();
