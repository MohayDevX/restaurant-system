const STORAGE_KEY = "mathaq-restaurant-v1";
const money = value => `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function initialData() {
  const inventory = [
    { id: "inv-chicken", name: "صدور دجاج", unit: "كجم", quantity: 18, min: 8, cost: 145, category: "لحوم ودواجن" },
    { id: "inv-rice", name: "أرز بسمتي", unit: "كجم", quantity: 24, min: 10, cost: 58, category: "حبوب" },
    { id: "inv-bread", name: "خبز برجر", unit: "قطعة", quantity: 9, min: 20, cost: 4, category: "مخبوزات" },
    { id: "inv-beef", name: "لحم بقري", unit: "كجم", quantity: 12, min: 6, cost: 290, category: "لحوم ودواجن" },
    { id: "inv-fries", name: "بطاطس", unit: "كجم", quantity: 16, min: 7, cost: 32, category: "خضروات" },
    { id: "inv-cheese", name: "جبنة شيدر", unit: "كجم", quantity: 5, min: 3, cost: 210, category: "ألبان" },
    { id: "inv-oil", name: "زيت قلي", unit: "لتر", quantity: 11, min: 5, cost: 68, category: "مستلزمات" },
    { id: "inv-sauce", name: "صوص خاص", unit: "لتر", quantity: 4, min: 2, cost: 95, category: "مستلزمات" }
  ];
  const menu = [
    { id: "menu-chicken", name: "وجبة دجاج مشوي", category: "وجبات رئيسية", price: 185, emoji: "🍗", description: "دجاج مشوي مع أرز وسلطة", recipe: [{ itemId: "inv-chicken", qty: .25 }, { itemId: "inv-rice", qty: .18 }] },
    { id: "menu-burger", name: "برجر كلاسيك", category: "وجبات رئيسية", price: 165, emoji: "🍔", description: "برجر بقري مع جبنة شيدر", recipe: [{ itemId: "inv-beef", qty: .16 }, { itemId: "inv-bread", qty: 1 }, { itemId: "inv-cheese", qty: .03 }] },
    { id: "menu-meal", name: "وجبة عائلية", category: "وجبات رئيسية", price: 420, emoji: "🍱", description: "تشكيلة مشوية تكفي شخصين", recipe: [{ itemId: "inv-chicken", qty: .5 }, { itemId: "inv-rice", qty: .3 }] },
    { id: "menu-fries", name: "بطاطس مقلية", category: "مقبلات", price: 55, emoji: "🍟", description: "بطاطس ذهبية مقرمشة", recipe: [{ itemId: "inv-fries", qty: .2 }, { itemId: "inv-oil", qty: .03 }] },
    { id: "menu-salad", name: "سلطة خضراء", category: "مقبلات", price: 48, emoji: "🥗", description: "خضروات طازجة يوميًا", recipe: [] },
    { id: "menu-drink", name: "عصير برتقال", category: "مشروبات", price: 38, emoji: "🍹", description: "عصير طبيعي طازج", recipe: [] }
  ];
  const orders = [
    { id: "ORD-1048", date: today(), time: "12:32", type: "صالة", status: "مكتمل", items: [{ menuId: "menu-burger", name: "برجر كلاسيك", emoji: "🍔", qty: 2, price: 165 }, { menuId: "menu-fries", name: "بطاطس مقلية", emoji: "🍟", qty: 1, price: 55 }], subtotal: 385, tax: 53.9, total: 438.9, cost: 61.66, payment: "بطاقة" },
    { id: "ORD-1047", date: today(), time: "12:15", type: "سفري", status: "قيد التجهيز", items: [{ menuId: "menu-chicken", name: "وجبة دجاج مشوي", emoji: "🍗", qty: 1, price: 185 }], subtotal: 185, tax: 25.9, total: 210.9, cost: 47, payment: "نقدي" },
    { id: "ORD-1046", date: today(), time: "11:48", type: "توصيل", status: "مكتمل", items: [{ menuId: "menu-meal", name: "وجبة عائلية", emoji: "🍱", qty: 1, price: 420 }], subtotal: 420, tax: 58.8, total: 478.8, cost: 90, payment: "بطاقة" },
    { id: "ORD-1045", date: today(), time: "11:20", type: "صالة", status: "مكتمل", items: [{ menuId: "menu-drink", name: "عصير برتقال", emoji: "🍹", qty: 2, price: 38 }], subtotal: 76, tax: 10.64, total: 86.64, cost: 22, payment: "نقدي" }
  ];
  orders.filter(order => order.status !== "ملغي").forEach(order => order.items.forEach(row => {
    (menu.find(product => product.id === row.menuId)?.recipe || []).forEach(part => {
      const item = inventory.find(stock => stock.id === part.itemId);
      if (item) item.quantity = Math.max(0, item.quantity - part.qty * row.qty);
    });
  }));
  return { inventory, menu, orders, taxRate: 14, nextOrder: 1049, expenses: 0, expenseEntries: [] };
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialData();
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.inventory) || !Array.isArray(parsed.menu) || !Array.isArray(parsed.orders)) throw new Error("بيانات المطعم غير مكتملة");
    return parsed;
  } catch (error) {
    console.error("تعذر تحميل بيانات المطعم المحفوظة:", error);
    return initialData();
  }
}

let state = loadData();
let cart = [];
let orderFilter = "الكل";
let menuFilter = "الكل";

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("تعذر حفظ بيانات المطعم:", error);
    toast("تعذر حفظ البيانات على هذا الجهاز", true);
  }
}

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const inventoryItem = id => state.inventory.find(item => item.id === id);
const menuItem = id => state.menu.find(item => item.id === id);
const lowStock = () => state.inventory.filter(item => item.quantity <= item.min);
const productCost = product => (product.recipe || []).reduce((sum, part) => sum + (inventoryItem(part.itemId)?.cost || 0) * part.qty, 0);
const pageNames = { dashboard: "لوحة التحكم", orders: "الطلبات", cashier: "الكاشير ونقطة البيع", menu: "المنيو", inventory: "المخازن", finance: "الأرباح والخسائر" };

function toast(message, error = false) {
  const el = document.createElement("div");
  el.className = `toast${error ? " error" : ""}`;
  el.textContent = message;
  document.getElementById("toastRegion").append(el);
  setTimeout(() => el.remove(), 3100);
}

function pageHeading(title, subtitle, actions = "") {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}

function statCard(label, value, icon, foot, color = "") {
  return `<article class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></article>`;
}

function ordersForDay(date = today()) {
  return state.orders.filter(order => order.date === date && order.status !== "ملغي");
}

function renderDashboard() {
  const daily = ordersForDay();
  const revenue = daily.reduce((sum, order) => sum + order.total, 0);
  const profit = daily.reduce((sum, order) => sum + order.total - order.cost, 0);
  const active = state.orders.filter(order => order.status === "قيد التجهيز").length;
  const alerts = lowStock();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const sales = ordersForDay(key);
    return {
      key,
      label: date.toLocaleDateString("ar-EG", { weekday: "short" }),
      total: sales.reduce((sum, order) => sum + order.total, 0),
      profit: sales.reduce((sum, order) => sum + (order.subtotal ?? order.total) - order.cost, 0)
    };
  });
  const max = Math.max(1, ...days.map(day => day.total));
  const popular = state.menu.map(product => ({
    ...product, sold: state.orders.flatMap(order => order.status === "ملغي" ? [] : order.items).filter(item => item.menuId === product.id).reduce((sum, item) => sum + item.qty, 0)
  })).sort((a, b) => b.sold - a.sold).slice(0, 4);
  const recent = [...state.orders].slice(0, 4);
  return `${pageHeading("أهلاً بك، محمد 👋", "إليك نظرة عامة على أداء مطعمك اليوم.", `<button class="button" data-action="export-orders">↓ تصدير الطلبات</button><button class="button button-primary" data-page-link="cashier">＋ طلب جديد</button>`)}
    <div class="stats-grid">
      ${statCard("مبيعات اليوم", money(revenue), "↗", `<span class="trend-up">${daily.length} طلب</span> · إجمالي المبيعات`)}
      ${statCard("صافي الربح التقديري", money(profit), "◷", "بعد خصم تكلفة المكونات", "orange")}
      ${statCard("طلبات اليوم", daily.length.toLocaleString("ar-EG"), "▤", `${active} طلب قيد التجهيز`, "blue")}
      ${statCard("أصناف المنيو", state.menu.length.toLocaleString("ar-EG"), "☷", `${alerts.length} تنبيه مخزون`, "purple")}
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><h2>نظرة عامة على المبيعات</h2><p>إجمالي المبيعات خلال آخر ٧ أيام</p></div><span class="period-select">آخر ٧ أيام⌄</span></div>
        <div class="chart-wrap"><div class="y-labels"><span>${money(max).replace(" ج.م","")}</span><span>${money(max*.66).replace(" ج.م","")}</span><span>${money(max*.33).replace(" ج.م","")}</span><span>٠</span></div><div class="chart">${days.map(day => `<div class="bar-group" title="${esc(day.label)}: المبيعات ${money(day.total)} · الربح ${money(day.profit)}"><div class="bar" style="height:${Math.max(3, day.total / max * 100)}%"></div><div class="bar primary" style="height:${Math.max(3, Math.max(0, day.profit) / max * 100)}%"></div><span class="bar-label">${esc(day.label)}</span></div>`).join("")}</div></div>
        <div class="chart-legend"><span><i class="legend-dot"></i>المبيعات</span><span><i class="legend-dot light"></i>صافي الربح التقديري</span></div>
      </section>
      <section class="panel"><div class="panel-heading"><div><h2>الأكثر مبيعًا</h2><p>حسب عدد الوحدات المباعة</p></div><a href="#menu" data-page-link="menu" class="text-green" style="font-size:10px">عرض المنيو ←</a></div>
        <div class="top-products">${popular.map(product => `<div class="product-row"><span class="product-thumb">${esc(product.emoji)}</span><div class="product-info"><strong>${esc(product.name)}</strong><small>${esc(product.category)}</small></div><div class="product-amount">${money(product.price)}<small>${product.sold} وحدة</small></div></div>`).join("") || `<div class="empty-state">لا توجد أصناف بعد</div>`}</div>
      </section>
    </div>
    <div class="bottom-grid">
      <section class="table-card"><div class="table-title"><h2>أحدث الطلبات</h2><a href="#orders" data-page-link="orders">عرض كل الطلبات ←</a></div><div class="table-scroll"><table><thead><tr><th>رقم الطلب</th><th>الوقت</th><th>النوع</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>${recent.map(order => `<tr><td><strong>${esc(order.id)}</strong></td><td>${esc(order.time || "—")}</td><td>${esc(order.type || "صالة")}</td><td>${money(order.total)}</td><td>${statusBadge(order.status)}</td></tr>`).join("") || `<tr><td colspan="5" class="center muted">لا توجد طلبات بعد</td></tr>`}</tbody></table></div></section>
      <section class="table-card"><div class="table-title"><h2>تنبيهات المخزون</h2><a href="#inventory" data-page-link="inventory">إدارة المخزون ←</a></div><div class="stock-alerts">${alerts.slice(0, 4).map(item => `<div class="stock-alert"><span class="alert-mark">!</span><div><strong>${esc(item.name)}</strong><small>الحد الأدنى ${item.min} ${esc(item.unit)}</small></div><b>${item.quantity} ${esc(item.unit)}</b></div>`).join("") || `<div class="empty-state">المخزون جيد، لا توجد تنبيهات 🎉</div>`}</div></section>
    </div>`;
}

function statusBadge(status) {
  const cls = status === "ملغي" ? "cancelled" : status === "قيد التجهيز" ? "warning" : "";
  return `<span class="status ${cls}">${esc(status || "مكتمل")}</span>`;
}

function renderOrders() {
  const visible = [...state.orders].filter(order => orderFilter === "الكل" || order.status === orderFilter);
  return `${pageHeading("الطلبات", "تابع جميع طلبات المطعم وحالات تجهيزها.", `<button class="button button-primary" data-page-link="cashier">＋ إنشاء طلب</button>`)}
    <div class="filters">${["الكل", "قيد التجهيز", "مكتمل", "ملغي"].map(filter => `<button class="filter-chip ${orderFilter === filter ? "active" : ""}" data-order-filter="${filter}">${filter}</button>`).join("")}</div>
    <section class="table-card"><div class="table-title"><h2>كل الطلبات <span class="table-meta">(${visible.length})</span></h2><button class="button button-small" data-action="export-orders">↓ تصدير CSV</button></div><div class="table-scroll"><table><thead><tr><th>رقم الطلب</th><th>التاريخ والوقت</th><th>النوع</th><th>الأصناف</th><th>الدفع</th><th>الإجمالي</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>
    ${visible.map(order => `<tr><td><strong>${esc(order.id)}</strong></td><td>${esc(order.date)} ${esc(order.time || "")}</td><td>${esc(order.type || "صالة")}</td><td>${order.items.reduce((sum, item) => sum + item.qty, 0)} صنف</td><td>${esc(order.payment || "نقدي")}</td><td><strong>${money(order.total)}</strong></td><td>${statusBadge(order.status)}</td><td><div class="action-cell">${order.status === "قيد التجهيز" ? `<button class="button button-small" data-order-complete="${esc(order.id)}">إكمال</button>` : ""}${order.status !== "ملغي" ? `<button class="button button-small button-danger" data-order-cancel="${esc(order.id)}" aria-label="إلغاء الطلب">إلغاء</button>` : ""}</div></td></tr>`).join("") || `<tr><td colspan="8" class="center muted">لا توجد طلبات في هذا التصنيف.</td></tr>`}
    </tbody></table></div></section>`;
}

function renderInventory() {
  const alerts = lowStock();
  return `${pageHeading("إدارة المخازن", "راقب كميات وتكلفة مخزونك، واستقبل تنبيهات النواقص.", `<button class="button button-primary" data-action="add-inventory">＋ إضافة صنف للمخزن</button>`)}
    <div class="stats-grid">${statCard("إجمالي الأصناف", state.inventory.length, "▧", "صنف مسجل في المخزن")}${statCard("تنبيهات النقص", alerts.length, "!", "أصناف عند الحد الأدنى أو أقل", "orange")}${statCard("قيمة المخزون", money(state.inventory.reduce((sum, item) => sum + item.quantity * item.cost, 0)), "◈", "تقدير تكلفة الكميات الحالية", "blue")}${statCard("أصناف سليمة", state.inventory.length - alerts.length, "✓", "متوفرة فوق حد التنبيه", "purple")}</div>
    ${alerts.length ? `<div class="finance-note" style="background:#fff8eb;color:#a8732a;margin:0 0 13px">⚠ يوجد ${alerts.length} صنف يحتاج إلى إعادة الطلب: ${alerts.map(item => esc(item.name)).join("، ")}.</div>` : ""}
    <div class="toolbar"><div class="toolbar-start"><label class="search-box"><span>⌕</span><input class="input-control" id="inventorySearch" placeholder="ابحث عن صنف..." aria-label="ابحث عن صنف"></label><select class="select-control" id="inventoryCategory"><option value="الكل">كل التصنيفات</option>${[...new Set(state.inventory.map(item => item.category))].map(category => `<option>${esc(category)}</option>`).join("")}</select></div><span class="table-meta">${state.inventory.length} صنف</span></div>
    <section class="table-card"><div class="table-scroll"><table><thead><tr><th>الصنف</th><th>التصنيف</th><th>الكمية المتاحة</th><th>حد التنبيه</th><th>تكلفة الوحدة</th><th>قيمة المخزون</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="inventoryRows">${inventoryRows()}</tbody></table></div></section>`;
}

function inventoryRows(search = "", category = "الكل") {
  const list = state.inventory.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) && (category === "الكل" || item.category === category));
  return list.map(item => `<tr class="${item.quantity <= item.min ? "low-stock-row" : ""}"><td><strong>${esc(item.name)}</strong></td><td>${esc(item.category)}</td><td>${item.quantity} ${esc(item.unit)}</td><td>${item.min} ${esc(item.unit)}</td><td>${money(item.cost)}</td><td>${money(item.cost * item.quantity)}</td><td>${item.quantity <= item.min ? `<span class="status warning">مخزون منخفض</span>` : `<span class="status">متوفر</span>`}</td><td><div class="action-cell"><button class="button button-small" data-stock-adjust="${esc(item.id)}">تعديل كمية</button><button class="button button-small" data-inventory-edit="${esc(item.id)}" aria-label="تعديل الصنف">✎</button></div></td></tr>`).join("") || `<tr><td colspan="8" class="center muted">لا توجد أصناف مطابقة.</td></tr>`;
}

function renderMenu() {
  const categories = ["الكل", ...new Set(state.menu.map(item => item.category))];
  const list = state.menu.filter(item => menuFilter === "الكل" || item.category === menuFilter);
  return `${pageHeading("المنيو", "أدر أصناف مطعمك وأسعارها ومكوناتها.", `<button class="button button-primary" data-action="add-menu">＋ إضافة صنف جديد</button>`)}
    <div class="filters">${categories.map(filter => `<button class="filter-chip ${menuFilter === filter ? "active" : ""}" data-menu-filter="${esc(filter)}">${esc(filter)}</button>`).join("")}</div>
    <div class="menu-grid">${list.map(item => {
      const recipe = (item.recipe || []).map(part => `${esc(inventoryItem(part.itemId)?.name || "مكون محذوف")} (${part.qty})`).join("، ");
      return `<article class="menu-card"><div class="menu-card-top"><span class="menu-emoji">${esc(item.emoji || "🍽️")}</span><div class="menu-actions"><button class="button button-small" data-menu-edit="${esc(item.id)}" aria-label="تعديل الصنف">✎</button><button class="button button-small button-danger" data-menu-delete="${esc(item.id)}" aria-label="حذف الصنف">×</button></div></div><h3>${esc(item.name)}</h3><p>${esc(item.description || item.category)}</p><div class="menu-card-bottom"><div><div class="menu-price">${money(item.price)} <small>/ بيع</small></div><div class="menu-metrics">تكلفة تقديرية: ${money(productCost(item))}</div></div><span class="status">${esc(item.category)}</span></div>${recipe ? `<div class="recipe-list"><span>المكونات:</span>${recipe}</div>` : ""}</article>`;
    }).join("") || `<div class="empty-state">لا توجد أصناف في هذا التصنيف.</div>`}</div>`;
}

function renderCashier() {
  const categories = ["الكل", ...new Set(state.menu.map(item => item.category))];
  const subtotal = cart.reduce((sum, row) => sum + row.price * row.qty, 0);
  const tax = subtotal * (Number(state.taxRate) || 0) / 100;
  const productList = state.menu.filter(item => menuFilter === "الكل" || item.category === menuFilter);
  return `${pageHeading("الكاشير ونقطة البيع", "أضف الأصناف إلى الفاتورة وأتمم الطلب بسهولة.", `<span class="status">● نقطة البيع جاهزة</span>`)}
    <div class="cashier-layout"><section><div class="toolbar"><div class="toolbar-start">${categories.map(filter => `<button class="filter-chip ${menuFilter === filter ? "active" : ""}" data-cashier-filter="${esc(filter)}">${esc(filter)}</button>`).join("")}</div></div>
    <div class="cashier-products">${productList.map(item => `<button class="cashier-product" data-cart-add="${esc(item.id)}"><span class="menu-emoji">${esc(item.emoji || "🍽️")}</span><strong>${esc(item.name)}</strong><small>${money(item.price)}</small></button>`).join("") || `<div class="empty-state">أضف أصنافًا للمنيو لبدء البيع.</div>`}</div></section>
    <section class="panel cart-panel"><div class="panel-heading"><div><h2>الطلب الحالي</h2><p>${cart.reduce((sum, row) => sum + row.qty, 0)} أصناف في الفاتورة</p></div><button class="button button-small" data-action="clear-cart">تفريغ</button></div>
    <div class="form-grid" style="margin-bottom:12px"><div class="form-field"><label>نوع الطلب</label><select id="orderType"><option>صالة</option><option>سفري</option><option>توصيل</option></select></div><div class="form-field"><label>طريقة الدفع</label><select id="paymentType"><option>نقدي</option><option>بطاقة</option><option>محفظة إلكترونية</option></select></div></div>
    <div class="cart-items">${cart.map(row => `<div class="cart-item"><span class="cart-item-emoji">${esc(row.emoji)}</span><div class="cart-item-info"><strong>${esc(row.name)}</strong><small>${money(row.price)}</small></div><div class="qty-control"><button data-cart-minus="${esc(row.id)}">−</button><b>${row.qty}</b><button data-cart-add="${esc(row.id)}">+</button></div></div>`).join("") || `<div class="empty-state">اختر صنفًا من القائمة لإضافته إلى الطلب.</div>`}</div>
    <div class="cart-summary"><div class="summary-line"><span>المجموع الفرعي</span><b>${money(subtotal)}</b></div><div class="summary-line"><span>ضريبة القيمة المضافة (${Number(state.taxRate) || 0}%)</span><b>${money(tax)}</b></div><div class="summary-line total"><span>الإجمالي</span><b>${money(subtotal + tax)}</b></div></div>
    <button class="button button-primary cart-checkout" data-action="checkout" ${cart.length ? "" : "disabled"}>إتمام البيع · ${money(subtotal + tax)}</button></section></div>`;
}

function renderFinance() {
  const valid = state.orders.filter(order => order.status !== "ملغي");
  const revenue = valid.reduce((sum, order) => sum + (order.subtotal ?? order.total), 0);
  const costs = valid.reduce((sum, order) => sum + order.cost, 0);
  const profit = revenue - costs;
  const margin = revenue ? (profit / revenue * 100) : 0;
  const expenses = Number(state.expenses || 0);
  const net = profit - expenses;
  return `${pageHeading("الأرباح والخسائر", "تقرير تلقائي مبني على المبيعات وتكلفة مكونات الوصفات.", `<button class="button" data-action="tax-rate">ضريبة ${Number(state.taxRate) || 0}%</button><button class="button" data-action="add-expense">＋ تسجيل مصروف</button><button class="button" data-action="export-finance">↓ تصدير التقرير</button>`)}
    <div class="finance-grid"><article class="finance-card"><span>إجمالي الإيرادات (قبل الضريبة)</span><strong>${money(revenue)}</strong><small>${valid.length} طلب مكتمل أو قيد التجهيز</small></article><article class="finance-card"><span>تكلفة البضاعة المباعة</span><strong>${money(costs)}</strong><small>محسوبة من وصفات المنيو وقت البيع</small></article><article class="finance-card profit"><span>مجمل الربح</span><strong>${money(profit)}</strong><small>هامش الربح الإجمالي ${margin.toLocaleString("ar-EG", { maximumFractionDigits: 1 })}%</small></article><article class="finance-card"><span>المصروفات التشغيلية المسجلة</span><strong>${money(expenses)}</strong><small>أدخل المصروفات الإضافية يدويًا</small></article><article class="finance-card ${net >= 0 ? "profit" : "loss"}"><span>صافي الربح التقديري</span><strong>${money(net)}</strong><small>مجمل الربح − المصروفات التشغيلية</small></article><article class="finance-card"><span>قيمة المخزون الحالية</span><strong>${money(state.inventory.reduce((sum, item) => sum + item.quantity * item.cost, 0))}</strong><small>تقدير على أساس تكلفة الشراء</small></article></div>
    <section class="table-card"><div class="table-title"><h2>ملخص المبيعات حسب الطلب</h2><span class="table-meta">التكلفة والربح لكل طلب</span></div><div class="table-scroll"><table><thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الإيرادات قبل الضريبة</th><th>تكلفة المكونات</th><th>الربح التقديري</th><th>الحالة</th></tr></thead><tbody>${valid.map(order => `<tr><td><strong>${esc(order.id)}</strong></td><td>${esc(order.date)}</td><td>${money(order.subtotal ?? order.total)}</td><td>${money(order.cost)}</td><td class="profit-positive">${money((order.subtotal ?? order.total) - order.cost)}</td><td>${statusBadge(order.status)}</td></tr>`).join("") || `<tr><td colspan="6" class="center muted">لا توجد بيانات مبيعات بعد.</td></tr>`}</tbody></table></div></section>
    <section class="table-card" style="margin-top:14px"><div class="table-title"><h2>المصروفات التشغيلية</h2><span class="table-meta">${(state.expenseEntries || []).length} مصروف مسجل</span></div><div class="table-scroll"><table><thead><tr><th>الوصف</th><th>التاريخ</th><th>القيمة</th></tr></thead><tbody>${(state.expenseEntries || []).map(entry => `<tr><td><strong>${esc(entry.name)}</strong></td><td>${esc(entry.date)}</td><td>${money(entry.amount)}</td></tr>`).join("") || `<tr><td colspan="3" class="center muted">لا توجد مصروفات مسجلة.</td></tr>`}</tbody></table></div></section>
    <div class="finance-note">ⓘ الأرباح تقديرية: تُحسب تكلفة الطعام من الوصفات وأسعار شراء المخزون. أضف مصروفات الإيجار والرواتب والمرافق يدويًا للحصول على صافي ربح تشغيلي أدق.</div>`;
}

const renderers = { dashboard: renderDashboard, orders: renderOrders, cashier: renderCashier, menu: renderMenu, inventory: renderInventory, finance: renderFinance };
function navigate(page) {
  const current = renderers[page] ? page : "dashboard";
  location.hash = current;
  document.getElementById("breadcrumbTitle").textContent = pageNames[current];
  document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.page === current));
  document.getElementById("pageContent").innerHTML = renderers[current]();
  document.getElementById("ordersBadge").textContent = state.orders.filter(order => order.status === "قيد التجهيز").length.toLocaleString("ar-EG");
  document.getElementById("notificationButton").classList.toggle("has-alert", lowStock().length > 0);
  document.getElementById("sidebar").classList.remove("open");
  if (current === "inventory") bindInventorySearch();
}

function bindInventorySearch() {
  const update = () => {
    const search = document.getElementById("inventorySearch");
    const category = document.getElementById("inventoryCategory");
    const rows = document.getElementById("inventoryRows");
    if (search && category && rows) rows.innerHTML = inventoryRows(search.value, category.value);
  };
  document.getElementById("inventorySearch")?.addEventListener("input", update);
  document.getElementById("inventoryCategory")?.addEventListener("change", update);
}

function showDialog(title, fields, submitLabel, onSubmit) {
  const dialog = document.getElementById("appDialog");
  dialog.className = "app-dialog dialog-backdrop";
  dialog.innerHTML = `<form method="dialog" class="dialog-inner" id="dialogForm"><div class="dialog-head"><h2>${title}</h2><button class="dialog-close" value="cancel" aria-label="إغلاق">×</button></div><div class="form-grid">${fields}</div><div class="form-actions"><button type="button" class="button" data-dialog-cancel>إلغاء</button><button type="submit" class="button button-primary">${submitLabel}</button></div></form>`;
  dialog.showModal();
  dialog.querySelector("[data-dialog-cancel]").addEventListener("click", () => dialog.close());
  dialog.querySelector("#dialogForm").addEventListener("submit", event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (onSubmit(data) !== false) dialog.close();
  });
}

function field(label, name, value = "", type = "text", options = null, required = true) {
  const input = options ? `<select name="${name}" ${required ? "required" : ""}>${options.map(option => `<option value="${esc(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${esc(option.label)}</option>`).join("")}</select>` : `<input name="${name}" type="${type}" value="${esc(value)}" ${required ? "required" : ""} ${type === "number" ? 'step="any"' : ""}>`;
  return `<div class="form-field"><label>${label}</label>${input}</div>`;
}

function inventoryForm(existing = null) {
  const item = existing || { name: "", category: "مستلزمات", unit: "كجم", quantity: 0, min: 5, cost: 0 };
  const categories = [...new Set(["لحوم ودواجن", "خضروات", "ألبان", "مخبوزات", "حبوب", "مستلزمات", ...state.inventory.map(row => row.category)])];
  showDialog(existing ? "تعديل صنف المخزن" : "إضافة صنف للمخزن",
    field("اسم الصنف", "name", item.name) +
    field("التصنيف", "category", item.category, "text", categories.map(value => ({ value, label: value }))) +
    field("وحدة القياس", "unit", item.unit) +
    field("الكمية الحالية", "quantity", item.quantity, "number") +
    field("حد التنبيه الأدنى", "min", item.min, "number") +
    field("تكلفة الوحدة (ج.م)", "cost", item.cost, "number"),
    existing ? "حفظ التعديلات" : "إضافة الصنف", values => {
      const quantity = Number(values.quantity), min = Number(values.min), cost = Number(values.cost);
      if (![quantity, min, cost].every(Number.isFinite) || quantity < 0 || min < 0 || cost < 0) { toast("أدخل قيمًا رقمية صحيحة غير سالبة", true); return false; }
      if (existing) Object.assign(existing, { ...values, quantity, min, cost });
      else state.inventory.push({ id: uid(), ...values, quantity, min, cost });
      saveData(); navigate("inventory"); toast(existing ? "تم تحديث الصنف" : "تمت إضافة الصنف");
    });
}

function menuForm(existing = null) {
  const item = existing || { name: "", category: "وجبات رئيسية", price: 0, emoji: "🍽️", description: "" };
  const categories = [...new Set(["وجبات رئيسية", "مقبلات", "مشروبات", ...state.menu.map(row => row.category)])];
  const recipeFields = (existing?.recipe || []).map((part, index) => `<div class="form-field recipe-field"><label>مكون ${index + 1}</label><select name="ingredient_${index}"><option value="">بدون</option>${state.inventory.map(inv => `<option value="${esc(inv.id)}" ${part.itemId === inv.id ? "selected" : ""}>${esc(inv.name)} (${esc(inv.unit)})</option>`).join("")}</select><input name="qty_${index}" type="number" step="any" min="0" value="${part.qty}"></div>`).join("");
  const emptyRecipes = existing?.recipe?.length ? "" : state.inventory.slice(0, 2).map((inv, index) => `<div class="form-field recipe-field"><label>مكون ${index + 1} (اختياري)</label><select name="ingredient_${index}"><option value="">بدون</option>${state.inventory.map(row => `<option value="${esc(row.id)}" ${row.id === inv.id ? "selected" : ""}>${esc(row.name)} (${esc(row.unit)})</option>`).join("")}</select><input name="qty_${index}" type="number" step="any" min="0" placeholder="الكمية في الوجبة"></div>`).join("");
  showDialog(existing ? "تعديل صنف المنيو" : "إضافة صنف للمنيو",
    field("اسم الصنف", "name", item.name) +
    field("التصنيف", "category", item.category, "text", categories.map(value => ({ value, label: value }))) +
    field("سعر البيع (ج.م)", "price", item.price, "number") +
    field("رمز الصنف (إيموجي)", "emoji", item.emoji, "text", null, false) +
    `<div class="form-field full"><label>وصف مختصر</label><input name="description" value="${esc(item.description)}"></div>` +
    `<div class="form-field full"><label>مكونات الوصفة لكل وجبة (لخصمها تلقائيًا من المخزون وحساب التكلفة)</label><div class="form-grid">${recipeFields || emptyRecipes || `<span class="muted">أضف أصنافًا للمخزن لتسجيل الوصفة.</span>`}</div></div>`,
    existing ? "حفظ التعديلات" : "إضافة للمنيو", values => {
      const price = Number(values.price);
      if (!Number.isFinite(price) || price < 0) { toast("أدخل سعرًا صحيحًا غير سالب", true); return false; }
      const recipe = [];
      Object.keys(values).filter(key => key.startsWith("ingredient_")).forEach(key => {
        const index = key.split("_")[1], itemId = values[key], qty = Number(values[`qty_${index}`]);
        if (itemId && qty > 0 && Number.isFinite(qty)) recipe.push({ itemId, qty });
      });
      const changes = { name: values.name, category: values.category, price, emoji: values.emoji || "🍽️", description: values.description || "", recipe };
      if (existing) Object.assign(existing, changes);
      else state.menu.push({ id: uid(), ...changes });
      saveData(); navigate("menu"); toast(existing ? "تم تحديث الصنف" : "تمت إضافة الصنف");
    });
}

function checkout() {
  if (!cart.length) return;
  const required = new Map();
  cart.forEach(row => (menuItem(row.id)?.recipe || []).forEach(part => required.set(part.itemId, (required.get(part.itemId) || 0) + part.qty * row.qty)));
  const shortages = [...required].filter(([id, qty]) => !inventoryItem(id) || inventoryItem(id).quantity < qty);
  if (shortages.length) {
    toast(`المخزون غير كافٍ: ${shortages.map(([id]) => inventoryItem(id)?.name || "مكون").join("، ")}`, true);
    return;
  }
  const subtotal = cart.reduce((sum, row) => sum + row.price * row.qty, 0);
  const tax = subtotal * (Number(state.taxRate) || 0) / 100;
  const cost = cart.reduce((sum, row) => sum + productCost(menuItem(row.id)) * row.qty, 0);
  const order = {
    id: `ORD-${state.nextOrder++}`, date: today(), time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    type: document.getElementById("orderType")?.value || "صالة", status: "مكتمل",
    items: cart.map(row => ({ menuId: row.id, name: row.name, emoji: row.emoji, qty: row.qty, price: row.price })),
    subtotal, tax, total: subtotal + tax, cost, payment: document.getElementById("paymentType")?.value || "نقدي"
  };
  for (const [id, qty] of required) inventoryItem(id).quantity -= qty;
  state.orders.unshift(order); cart = []; saveData(); navigate("orders"); toast(`تم تسجيل الطلب ${order.id} وخصم المكونات من المخزون`);
}

function changeOrderStatus(id, status) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return;
  if (status === "ملغي" && order.status !== "ملغي") {
    (order.items || []).forEach(row => (menuItem(row.menuId)?.recipe || []).forEach(part => {
      const inv = inventoryItem(part.itemId);
      if (inv) inv.quantity += part.qty * row.qty;
    }));
  }
  order.status = status; saveData(); navigate("orders"); toast(status === "ملغي" ? "تم إلغاء الطلب وإرجاع مكوناته للمخزون" : "تم إكمال الطلب");
}

function exportCsv(filename, rows) {
  const csv = "\ufeff" + rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

document.addEventListener("click", event => {
  const pageLink = event.target.closest("[data-page], [data-page-link]");
  if (pageLink) { event.preventDefault(); navigate(pageLink.dataset.page || pageLink.dataset.pageLink); return; }
  const target = event.target.closest("[data-action], [data-cart-add], [data-cart-minus], [data-order-filter], [data-menu-filter], [data-cashier-filter], [data-order-complete], [data-order-cancel], [data-stock-adjust], [data-inventory-edit], [data-menu-edit], [data-menu-delete]");
  if (!target) return;
  if (target.dataset.orderFilter) { orderFilter = target.dataset.orderFilter; navigate("orders"); }
  else if (target.dataset.menuFilter) { menuFilter = target.dataset.menuFilter; navigate("menu"); }
  else if (target.dataset.cashierFilter) { menuFilter = target.dataset.cashierFilter; navigate("cashier"); }
  else if (target.dataset.cartAdd) {
    const product = menuItem(target.dataset.cartAdd);
    if (!product) return;
    const row = cart.find(item => item.id === product.id);
    if (row) row.qty++;
    else cart.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji || "🍽️", qty: 1 });
    navigate("cashier");
  } else if (target.dataset.cartMinus) {
    const row = cart.find(item => item.id === target.dataset.cartMinus);
    if (row) { row.qty--; if (!row.qty) cart = cart.filter(item => item !== row); }
    navigate("cashier");
  } else if (target.dataset.orderComplete) changeOrderStatus(target.dataset.orderComplete, "مكتمل");
  else if (target.dataset.orderCancel) {
    if (confirm("هل تريد إلغاء هذا الطلب؟ سيتم إرجاع مكوناته إلى المخزون.")) changeOrderStatus(target.dataset.orderCancel, "ملغي");
  } else if (target.dataset.stockAdjust) {
    const item = inventoryItem(target.dataset.stockAdjust);
    if (!item) return;
    showDialog(`تعديل كمية ${esc(item.name)}`, field("الكمية الجديدة", "quantity", item.quantity, "number"), "حفظ الكمية", values => {
      const quantity = Number(values.quantity);
      if (!Number.isFinite(quantity) || quantity < 0) { toast("أدخل كمية صحيحة غير سالبة", true); return false; }
      item.quantity = quantity; saveData(); navigate("inventory"); toast("تم تحديث الكمية");
    });
  } else if (target.dataset.inventoryEdit) inventoryForm(inventoryItem(target.dataset.inventoryEdit));
  else if (target.dataset.menuEdit) menuForm(menuItem(target.dataset.menuEdit));
  else if (target.dataset.menuDelete) {
    const product = menuItem(target.dataset.menuDelete);
    if (product && confirm(`حذف "${product.name}" من المنيو؟`)) { state.menu = state.menu.filter(item => item.id !== product.id); cart = cart.filter(row => row.id !== product.id); saveData(); navigate("menu"); toast("تم حذف الصنف"); }
  } else if (target.dataset.action === "add-inventory") inventoryForm();
  else if (target.dataset.action === "add-menu") menuForm();
  else if (target.dataset.action === "checkout") checkout();
  else if (target.dataset.action === "clear-cart") { cart = []; navigate("cashier"); }
  else if (target.dataset.action === "add-expense") {
    showDialog("تسجيل مصروف تشغيلي", field("وصف المصروف", "name") + field("المبلغ (ج.م)", "amount", "", "number") + field("التاريخ", "date", today(), "date"), "تسجيل المصروف", values => {
      const amount = Number(values.amount);
      if (!Number.isFinite(amount) || amount <= 0) { toast("أدخل مبلغًا صحيحًا أكبر من صفر", true); return false; }
      state.expenseEntries = state.expenseEntries || [];
      state.expenseEntries.push({ id: uid(), name: values.name, amount, date: values.date });
      state.expenses = state.expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
      saveData(); navigate("finance"); toast("تم تسجيل المصروف");
    });
  } else if (target.dataset.action === "export-orders") exportCsv("طلبات-المطعم.csv", [["رقم الطلب", "التاريخ", "الوقت", "النوع", "الإجمالي", "التكلفة", "الحالة"], ...state.orders.map(order => [order.id, order.date, order.time, order.type, order.total, order.cost, order.status])]);
  else if (target.dataset.action === "tax-rate") {
    showDialog("إعداد ضريبة المبيعات", field("نسبة الضريبة (%)", "taxRate", Number(state.taxRate) || 0, "number"), "حفظ النسبة", values => {
      const rate = Number(values.taxRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) { toast("أدخل نسبة بين 0 و100", true); return false; }
      state.taxRate = rate; saveData(); navigate("finance"); toast("تم تحديث نسبة الضريبة للطلبات الجديدة");
    });
  } else if (target.dataset.action === "export-orders") exportCsv("طلبات-المطعم.csv", [["رقم الطلب", "التاريخ", "الوقت", "النوع", "الإجمالي", "التكلفة", "الحالة"], ...state.orders.map(order => [order.id, order.date, order.time, order.type, order.total, order.cost, order.status])]);
  else if (target.dataset.action === "export-finance") exportCsv("تقرير-الأرباح-والخسائر.csv", [["رقم الطلب", "التاريخ", "الإيرادات قبل الضريبة", "التكلفة", "الربح", "الحالة"], ...state.orders.map(order => [order.id, order.date, order.subtotal ?? order.total, order.cost, (order.subtotal ?? order.total) - order.cost, order.status])]);
  else if (target.dataset.action === "help") toast("استخدم القائمة الجانبية للتنقل بين أقسام نظام مطعمك.");
});

document.getElementById("mobileMenu").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("notificationButton").addEventListener("click", () => navigate("inventory"));
document.addEventListener("keydown", event => { if (event.key === "Escape") document.getElementById("sidebar").classList.remove("open"); });
document.getElementById("todayLabel").textContent = new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
window.addEventListener("hashchange", () => navigate(location.hash.slice(1)));
navigate(location.hash.slice(1) || "dashboard");
