/**
 * 管理后台路由（仅内部使用，客户不可见）
 * 提供数据库表的可视化管理界面，支持对产品和知识库数据的增删改查
 * 通过 /admin 路径访问，生产环境应配合鉴权中间件使用
 */
import type { FastifyInstance } from "fastify";
import { getDb } from "../tools/compatibility-check.js";

/** 产品新增/编辑请求体 */
interface ProductBody {
  sku: string;
  name: string;
  category: string;
  specs: Record<string, unknown>;
}

/** 知识库新增/编辑请求体 */
interface KnowledgeBody {
  title: string;
  content: string;
  category: string;
  product_line: string;
  tags?: string[];
}

export function registerAdminRoutes(app: FastifyInstance): void {
  // ==================== 页面路由 ====================

  // 管理后台首页 —— 数据库表可视化 + 增删改查操作
  app.get("/admin", async (_request, reply) => {
    const db = getDb();
    const products = db.prepare("SELECT * FROM products ORDER BY id").all() as Array<{
      id: number; sku: string; name: string; category: string; specs: string; created_at: string;
    }>;
    const knowledgeBase = db.prepare("SELECT * FROM knowledge_base ORDER BY id").all() as Array<{
      id: number; title: string; content: string; category: string; product_line: string; tags: string; created_at: string;
    }>;
    const html = buildAdminPage(products, knowledgeBase);
    reply.type("text/html; charset=utf-8").send(html);
  });

  // ==================== 产品 CRUD API ====================

  // 获取产品列表
  app.get("/admin/api/products", async () => {
    const db = getDb();
    return db.prepare("SELECT * FROM products ORDER BY id").all();
  });

  // 获取单个产品详情
  app.get<{ Params: { id: string } }>("/admin/api/products/:id", async (request) => {
    const db = getDb();
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(request.params.id);
    if (!product) return { error: "产品不存在" };
    return product;
  });

  // 新增产品
  app.post<{ Body: ProductBody }>("/admin/api/products", async (request) => {
    const { sku, name, category, specs } = request.body;
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO products (sku, name, category, specs) VALUES (?, ?, ?, ?)"
    ).run(sku, name, category, JSON.stringify(specs));
    return { success: true, id: result.lastInsertRowid };
  });

  // 更新产品
  app.put<{ Params: { id: string }; Body: ProductBody }>("/admin/api/products/:id", async (request) => {
    const { sku, name, category, specs } = request.body;
    const db = getDb();
    const result = db.prepare(
      "UPDATE products SET sku = ?, name = ?, category = ?, specs = ? WHERE id = ?"
    ).run(sku, name, category, JSON.stringify(specs), request.params.id);
    if (result.changes === 0) return { error: "产品不存在" };
    return { success: true };
  });

  // 删除产品
  app.delete<{ Params: { id: string } }>("/admin/api/products/:id", async (request) => {
    const db = getDb();
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(request.params.id);
    if (result.changes === 0) return { error: "产品不存在" };
    return { success: true };
  });

  // ==================== 知识库 CRUD API ====================

  // 获取知识库列表
  app.get("/admin/api/knowledge", async () => {
    const db = getDb();
    return db.prepare("SELECT * FROM knowledge_base ORDER BY id").all();
  });

  // 获取单条知识库详情
  app.get<{ Params: { id: string } }>("/admin/api/knowledge/:id", async (request) => {
    const db = getDb();
    const entry = db.prepare("SELECT * FROM knowledge_base WHERE id = ?").get(request.params.id);
    if (!entry) return { error: "条目不存在" };
    return entry;
  });

  // 新增知识库条目
  app.post<{ Body: KnowledgeBody }>("/admin/api/knowledge", async (request) => {
    const { title, content, category, product_line, tags } = request.body;
    const db = getDb();
    const result = db.prepare(
      "INSERT INTO knowledge_base (title, content, category, product_line, tags) VALUES (?, ?, ?, ?, ?)"
    ).run(title, content, category, product_line, JSON.stringify(tags || []));
    return { success: true, id: result.lastInsertRowid };
  });

  // 更新知识库条目
  app.put<{ Params: { id: string }; Body: KnowledgeBody }>("/admin/api/knowledge/:id", async (request) => {
    const { title, content, category, product_line, tags } = request.body;
    const db = getDb();
    const result = db.prepare(
      "UPDATE knowledge_base SET title = ?, content = ?, category = ?, product_line = ?, tags = ? WHERE id = ?"
    ).run(title, content, category, product_line, JSON.stringify(tags || []), request.params.id);
    if (result.changes === 0) return { error: "条目不存在" };
    return { success: true };
  });

  // 删除知识库条目
  app.delete<{ Params: { id: string } }>("/admin/api/knowledge/:id", async (request) => {
    const db = getDb();
    const result = db.prepare("DELETE FROM knowledge_base WHERE id = ?").run(request.params.id);
    if (result.changes === 0) return { error: "条目不存在" };
    return { success: true };
  });
}

/** 构建管理后台 HTML 页面（含增删改查交互） */
function buildAdminPage(
  products: Array<{ id: number; sku: string; name: string; category: string; specs: string; created_at: string }>,
  knowledgeBase: Array<{ id: number; title: string; content: string; category: string; product_line: string; tags: string; created_at: string }>
): string {
  const categoryLabels: Record<string, string> = {
    case: "机箱", psu: "电源", cooler: "散热器", smart_screen: "智能屏幕",
    troubleshooting: "故障排查", faq: "常见问题", policy: "售后政策",
    installation: "安装教程", general: "通用",
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>客服系统 - 数据管理后台</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; color: #1f2937; }
    .header { background: #1e293b; color: white; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 20px; font-weight: 600; }
    .header .badge { background: #ef4444; color: white; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .stats { display: flex; gap: 16px; margin-bottom: 20px; }
    .stat-card { background: white; border-radius: 12px; padding: 16px 24px; flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .stat-card .number { font-size: 28px; font-weight: 700; color: #2563eb; }
    .stat-card .label { font-size: 13px; color: #6b7280; margin-top: 4px; }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tabs { display: flex; gap: 4px; }
    .tab { padding: 10px 20px; border-radius: 8px 8px 0 0; cursor: pointer; font-size: 14px; font-weight: 500; background: #e2e8f0; color: #64748b; border: none; transition: all 0.2s; }
    .tab.active { background: white; color: #1e293b; box-shadow: 0 -2px 4px rgba(0,0,0,0.05); }
    .btn { padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-edit { background: #f59e0b; color: white; }
    .btn-edit:hover { background: #d97706; }
    .btn-sm { padding: 4px 10px; font-size: 12px; }
    .panel { display: none; background: white; border-radius: 0 12px 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; }
    .panel.active { display: block; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:hover td { background: #f8fafc; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .tag-case { background: #dbeafe; color: #1d4ed8; }
    .tag-psu { background: #fef3c7; color: #92400e; }
    .tag-cooler { background: #d1fae5; color: #065f46; }
    .tag-smart_screen { background: #ede9fe; color: #5b21b6; }
    .tag-troubleshooting { background: #fee2e2; color: #991b1b; }
    .tag-faq { background: #e0e7ff; color: #3730a3; }
    .tag-policy { background: #fef3c7; color: #92400e; }
    .tag-installation { background: #d1fae5; color: #065f46; }
    .tag-general { background: #f3f4f6; color: #374151; }
    .actions { display: flex; gap: 6px; }
    .content-preview { max-width: 300px; max-height: 40px; overflow: hidden; text-overflow: ellipsis; color: #6b7280; font-size: 13px; white-space: nowrap; }
    /* 弹窗样式 */
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
    .modal-overlay.show { display: flex; }
    .modal { background: white; border-radius: 12px; padding: 24px; max-width: 750px; width: 90%; max-height: 85vh; overflow-y: auto; }
    .modal h3 { margin-bottom: 20px; font-size: 18px; }
    .modal-close { float: right; background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; }
    .form-group textarea { min-height: 120px; resize: vertical; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .form-row { display: flex; gap: 16px; }
    .form-row .form-group { flex: 1; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 8px; color: white; font-size: 14px; z-index: 2000; animation: slideIn 0.3s ease; }
    .toast-success { background: #10b981; }
    .toast-error { background: #ef4444; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  </style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;">
      <h1>客服系统数据管理后台</h1>
      <span class="badge">内部使用</span>
    </div>
    <span style="font-size:13px;color:#94a3b8;">仅管理员可访问 | 支持增删改查</span>
  </div>

  <div class="container">
    <div class="stats">
      <div class="stat-card"><div class="number">${products.length}</div><div class="label">产品总数</div></div>
      <div class="stat-card"><div class="number">${knowledgeBase.length}</div><div class="label">知识库条目</div></div>
      <div class="stat-card"><div class="number">${new Set(products.map(p => p.category)).size}</div><div class="label">产品分类</div></div>
      <div class="stat-card"><div class="number">${new Set(knowledgeBase.map(k => k.category)).size}</div><div class="label">知识库分类</div></div>
    </div>

    <div class="toolbar">
      <div class="tabs">
        <button class="tab active" onclick="switchTab('products')">产品表</button>
        <button class="tab" onclick="switchTab('knowledge')">知识库</button>
      </div>
      <div>
        <button class="btn btn-primary" id="btn-add" onclick="openAddForm()">+ 新增</button>
      </div>
    </div>

    <!-- 产品表 -->
    <div class="panel active" id="panel-products">
      <table>
        <thead><tr><th>ID</th><th>SKU</th><th>产品名称</th><th>分类</th><th>创建时间</th><th>操作</th></tr></thead>
        <tbody>
          ${products.map(p => `<tr>
            <td>${p.id}</td>
            <td><code>${p.sku}</code></td>
            <td><strong>${p.name}</strong></td>
            <td><span class="tag tag-${p.category}">${categoryLabels[p.category] || p.category}</span></td>
            <td style="color:#6b7280;font-size:13px;">${p.created_at || '-'}</td>
            <td><div class="actions">
              <button class="btn btn-sm btn-primary" onclick="viewProduct(${p.id})">查看</button>
              <button class="btn btn-sm btn-edit" onclick="editProduct(${p.id})">编辑</button>
              <button class="btn btn-sm btn-danger" onclick="deleteItem('products', ${p.id}, '${p.name}')">删除</button>
            </div></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>

    <!-- 知识库表 -->
    <div class="panel" id="panel-knowledge">
      <table>
        <thead><tr><th>ID</th><th>标题</th><th>分类</th><th>产品线</th><th>内容预览</th><th>操作</th></tr></thead>
        <tbody>
          ${knowledgeBase.map(k => `<tr>
            <td>${k.id}</td>
            <td><strong>${k.title}</strong></td>
            <td><span class="tag tag-${k.category}">${categoryLabels[k.category] || k.category}</span></td>
            <td><span class="tag tag-${k.product_line}">${categoryLabels[k.product_line] || k.product_line}</span></td>
            <td><div class="content-preview">${k.content.substring(0, 60)}...</div></td>
            <td><div class="actions">
              <button class="btn btn-sm btn-primary" onclick="viewKnowledge(${k.id})">查看</button>
              <button class="btn btn-sm btn-edit" onclick="editKnowledge(${k.id})">编辑</button>
              <button class="btn btn-sm btn-danger" onclick="deleteItem('knowledge', ${k.id}, '${k.title}')">删除</button>
            </div></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>

  <!-- 通用弹窗 -->
  <div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <div id="modal-body"></div>
    </div>
  </div>

  <script>
    let currentTab = 'products';

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('panel-' + tab).classList.add('active');
    }

    function closeModal() { document.getElementById('modal').classList.remove('show'); }
    function openModal(html) {
      document.getElementById('modal-body').innerHTML = html;
      document.getElementById('modal').classList.add('show');
    }

    function toast(msg, type = 'success') {
      const el = document.createElement('div');
      el.className = 'toast toast-' + type;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }

    // ========== 查看详情 ==========
    async function viewProduct(id) {
      const res = await fetch('/admin/api/products/' + id);
      const data = await res.json();
      const specs = JSON.parse(data.specs || '{}');
      openModal('<h3>' + data.name + ' - 产品详情</h3><pre>' + JSON.stringify({sku: data.sku, name: data.name, category: data.category, specs}, null, 2) + '</pre>');
    }

    async function viewKnowledge(id) {
      const res = await fetch('/admin/api/knowledge/' + id);
      const data = await res.json();
      openModal('<h3>' + data.title + '</h3><p style="margin-bottom:8px;"><span class="tag tag-' + data.category + '">' + data.category + '</span> <span class="tag tag-' + data.product_line + '">' + data.product_line + '</span></p><pre>' + data.content + '</pre>');
    }

    // ========== 新增 ==========
    function openAddForm() {
      if (currentTab === 'products') openProductForm();
      else openKnowledgeForm();
    }

    function openProductForm(data = null) {
      const isEdit = !!data;
      openModal(\`
        <h3>\${isEdit ? '编辑产品' : '新增产品'}</h3>
        <div class="form-row">
          <div class="form-group"><label>SKU</label><input id="f-sku" value="\${data?.sku || ''}" placeholder="如 CASE-ATX-002"></div>
          <div class="form-group"><label>分类</label>
            <select id="f-category">
              <option value="case" \${data?.category==='case'?'selected':''}>机箱</option>
              <option value="psu" \${data?.category==='psu'?'selected':''}>电源</option>
              <option value="cooler" \${data?.category==='cooler'?'selected':''}>散热器</option>
              <option value="smart_screen" \${data?.category==='smart_screen'?'selected':''}>智能屏幕</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>产品名称</label><input id="f-name" value="\${data?.name || ''}" placeholder="如 幻影 X2 ATX 机箱"></div>
        <div class="form-group"><label>规格参数 (JSON)</label><textarea id="f-specs" placeholder='{"max_gpu_length": 380, "supported_motherboards": ["ATX","M-ATX"]}'>\${data ? JSON.stringify(JSON.parse(data.specs || '{}'), null, 2) : ''}</textarea></div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="saveProduct(\${data?.id || 'null'})">\${isEdit ? '保存修改' : '确认新增'}</button>
        </div>
      \`);
    }

    function openKnowledgeForm(data = null) {
      const isEdit = !!data;
      openModal(\`
        <h3>\${isEdit ? '编辑知识库条目' : '新增知识库条目'}</h3>
        <div class="form-group"><label>标题</label><input id="f-title" value="\${data?.title || ''}" placeholder="如：电源异响排查指南"></div>
        <div class="form-row">
          <div class="form-group"><label>分类</label>
            <select id="f-kb-category">
              <option value="troubleshooting" \${data?.category==='troubleshooting'?'selected':''}>故障排查</option>
              <option value="faq" \${data?.category==='faq'?'selected':''}>常见问题</option>
              <option value="policy" \${data?.category==='policy'?'selected':''}>售后政策</option>
              <option value="installation" \${data?.category==='installation'?'selected':''}>安装教程</option>
              <option value="smart_screen" \${data?.category==='smart_screen'?'selected':''}>智能屏幕</option>
            </select>
          </div>
          <div class="form-group"><label>产品线</label>
            <select id="f-product-line">
              <option value="general" \${data?.product_line==='general'?'selected':''}>通用</option>
              <option value="case" \${data?.product_line==='case'?'selected':''}>机箱</option>
              <option value="psu" \${data?.product_line==='psu'?'selected':''}>电源</option>
              <option value="cooler" \${data?.product_line==='cooler'?'selected':''}>散热器</option>
              <option value="smart_screen" \${data?.product_line==='smart_screen'?'selected':''}>智能屏幕</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>内容 (支持 Markdown)</label><textarea id="f-content" style="min-height:200px" placeholder="在此输入知识库文档内容...">\${data?.content || ''}</textarea></div>
        <div class="form-group"><label>标签 (逗号分隔)</label><input id="f-tags" value="\${data ? JSON.parse(data.tags || '[]').join(', ') : ''}" placeholder="如：电源, 异响, 故障"></div>
        <div class="form-actions">
          <button class="btn" onclick="closeModal()">取消</button>
          <button class="btn btn-primary" onclick="saveKnowledge(\${data?.id || 'null'})">\${isEdit ? '保存修改' : '确认新增'}</button>
        </div>
      \`);
    }

    // ========== 编辑 ==========
    async function editProduct(id) {
      const res = await fetch('/admin/api/products/' + id);
      const data = await res.json();
      openProductForm(data);
    }

    async function editKnowledge(id) {
      const res = await fetch('/admin/api/knowledge/' + id);
      const data = await res.json();
      openKnowledgeForm(data);
    }

    // ========== 保存 ==========
    async function saveProduct(id) {
      const specs = document.getElementById('f-specs').value.trim();
      let parsedSpecs;
      try { parsedSpecs = specs ? JSON.parse(specs) : {}; }
      catch(e) { toast('规格参数 JSON 格式错误', 'error'); return; }

      const body = {
        sku: document.getElementById('f-sku').value.trim(),
        name: document.getElementById('f-name').value.trim(),
        category: document.getElementById('f-category').value,
        specs: parsedSpecs,
      };
      if (!body.sku || !body.name) { toast('SKU 和名称不能为空', 'error'); return; }

      const url = id ? '/admin/api/products/' + id : '/admin/api/products';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.success) { toast(id ? '产品已更新' : '产品已新增'); setTimeout(() => location.reload(), 800); }
      else toast(result.error || '操作失败', 'error');
    }

    async function saveKnowledge(id) {
      const tagsStr = document.getElementById('f-tags').value.trim();
      const body = {
        title: document.getElementById('f-title').value.trim(),
        content: document.getElementById('f-content').value.trim(),
        category: document.getElementById('f-kb-category').value,
        product_line: document.getElementById('f-product-line').value,
        tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (!body.title || !body.content) { toast('标题和内容不能为空', 'error'); return; }

      const url = id ? '/admin/api/knowledge/' + id : '/admin/api/knowledge';
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const result = await res.json();
      if (result.success) { toast(id ? '条目已更新' : '条目已新增'); setTimeout(() => location.reload(), 800); }
      else toast(result.error || '操作失败', 'error');
    }

    // ========== 删除 ==========
    async function deleteItem(type, id, name) {
      if (!confirm('确定要删除「' + name + '」吗？此操作不可撤销。')) return;
      const res = await fetch('/admin/api/' + type + '/' + id, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { toast('已删除'); setTimeout(() => location.reload(), 800); }
      else toast(result.error || '删除失败', 'error');
    }
  </script>
</body>
</html>`;
}
