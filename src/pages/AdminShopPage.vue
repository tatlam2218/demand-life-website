<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const activeTab = ref('orders')
const loading = ref(true)

// Orders state
const ordersState = reactive({
  loading: false,
  loaded: false,
  orders: [],
  summary: {},
  filter: 'all',
  selected: null
})

const inventoryState = reactive({
  loading: false,
  loaded: false,
  products: [],
  summary: {},
  sheetUrl: ''
})

// Product editor modal state
const editorState = reactive({
  open: false,
  saving: false,
  isNew: false,
  error: '',
  form: {
    sku: '',
    nameEn: '',
    nameZh: '',
    category: '',
    stock: 0,
    price: 0,
    cost: 0,
    supplier: '',
    variant: '',
    status: 'active',
    notes: '',
    imageUrl: '',
    descriptionEn: '',
    descriptionZh: '',
    gallery: '',
    materials: '',
    dimensions: '',
    careInstructions: ''
  }
})

function openProductEditor(product = null) {
  editorState.isNew = !product
  editorState.error = ''
  if (product) {
    Object.assign(editorState.form, {
      sku: product.sku || '',
      nameEn: product.nameEn || '',
      nameZh: product.nameZh || '',
      category: product.category || '',
      stock: product.stock ?? 0,
      price: product.price ?? 0,
      cost: product.cost ?? 0,
      supplier: product.supplier || '',
      variant: product.variant || '',
      status: product.status || 'active',
      notes: product.notes || '',
      imageUrl: product.imageUrl || '',
      descriptionEn: product.descriptionEn || '',
      descriptionZh: product.descriptionZh || '',
      gallery: Array.isArray(product.gallery) ? product.gallery.join('\n') : (product.gallery || ''),
      materials: product.materials || '',
      dimensions: product.dimensions || '',
      careInstructions: product.careInstructions || ''
    })
  } else {
    Object.assign(editorState.form, {
      sku: '', nameEn: '', nameZh: '', category: '',
      stock: 0, price: 0, cost: 0, supplier: '', variant: '',
      status: 'active', notes: '', imageUrl: '',
      descriptionEn: '', descriptionZh: '', gallery: '',
      materials: '', dimensions: '', careInstructions: ''
    })
  }
  editorState.open = true
}

function closeEditor() {
  editorState.open = false
}

async function saveProduct() {
  editorState.saving = true
  editorState.error = ''
  try {
    const sku = editorState.form.sku.trim()
    if (!sku) throw new Error('SKU is required')
    if (!editorState.form.nameEn.trim()) throw new Error('Product name (EN) is required')

    const payload = {
      ...editorState.form,
      stock: Number(editorState.form.stock) || 0,
      price: Number(editorState.form.price) || 0,
      cost: Number(editorState.form.cost) || 0,
      gallery: editorState.form.gallery
        .split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    }

    const res = await fetch(`/api/admin/shop/inventory/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Save failed')
    }
    success.value = `Product ${sku} ${data.action}`
    setTimeout(() => (success.value = ''), 3000)
    editorState.open = false
    await loadInventory()
  } catch (e) {
    editorState.error = e.message
  } finally {
    editorState.saving = false
  }
}

async function deactivateProduct(product) {
  if (!confirm(`Deactivate ${product.sku} (${product.nameEn})? It will be hidden from the public shop but kept in the sheet.`)) return
  try {
    const res = await fetch(`/api/admin/shop/inventory/${encodeURIComponent(product.sku)}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (res.ok) {
      success.value = `Deactivated ${product.sku}`
      setTimeout(() => (success.value = ''), 3000)
      await loadInventory()
    }
  } catch (e) {
    error.value = e.message
  }
}

const error = ref('')
const success = ref('')

onMounted(async () => {
  // Verify auth + role
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' })
    if (!res.ok) throw new Error('not authenticated')
    const me = await res.json()
    if (me.role !== 'shop' && me.role !== 'admin') {
      router.replace('/admin/shop/login')
      return
    }
    user.value = me
    loading.value = false
    await loadOrders()
  } catch (e) {
    router.replace('/admin/shop/login')
  }
})

async function loadOrders() {
  ordersState.loading = true
  try {
    const res = await fetch('/api/admin/shop/orders', { credentials: 'include' })
    const data = await res.json()
    if (res.ok && data.success) {
      ordersState.orders = data.orders
      ordersState.summary = data.summary
      ordersState.loaded = true
    }
  } catch (e) { error.value = e.message }
  finally { ordersState.loading = false }
}

async function loadInventory() {
  inventoryState.loading = true
  try {
    const res = await fetch('/api/admin/shop/inventory', { credentials: 'include' })
    const data = await res.json()
    if (res.ok && data.success) {
      inventoryState.products = data.products
      inventoryState.summary = data.summary
      inventoryState.sheetUrl = data.sheetUrl
      inventoryState.loaded = true
    }
  } catch (e) { error.value = e.message }
  finally { inventoryState.loading = false }
}

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'inventory' && !inventoryState.loaded) loadInventory()
  if (tab === 'orders' && !ordersState.loaded) loadOrders()
}

const filteredOrders = computed(() => {
  if (ordersState.filter === 'all') return ordersState.orders
  if (ordersState.filter === 'awaiting-payment') return ordersState.orders.filter(o => o.payment?.status === 'pending')
  if (ordersState.filter === 'awaiting-ship') return ordersState.orders.filter(o => o.status === 'paid' && o.delivery?.method === 'ship')
  if (ordersState.filter === 'awaiting-pickup') return ordersState.orders.filter(o => o.status === 'paid' && o.delivery?.method === 'pickup')
  return ordersState.orders.filter(o => o.status === ordersState.filter)
})

async function openOrder(orderId) {
  const res = await fetch(`/api/admin/shop/orders/${orderId}`, { credentials: 'include' })
  const data = await res.json()
  if (data.success) {
    ordersState.selected = data.order
    // refresh list to clear unread
    await loadOrders()
  }
}

async function orderAction(action, extra = {}) {
  if (!ordersState.selected) return
  try {
    const res = await fetch(`/api/admin/shop/orders/${ordersState.selected.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, ...extra })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      success.value = `Action "${action}" completed${data.emailSent ? ' · email sent' : ''}`
      setTimeout(() => success.value = '', 3000)
      ordersState.selected = data.order
      await loadOrders()
    } else error.value = data.error || data.message || 'Action failed'
  } catch (e) { error.value = e.message }
}

async function seedDemoProducts() {
  if (!confirm('Seed 3 demo products into Inventory Sheet?')) return
  try {
    const res = await fetch('/api/admin/shop/inventory', {
      method: 'POST', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'seed-demo' })
    })
    const data = await res.json()
    if (data.success) {
      success.value = `Seeded ${data.seeded} demo products`
      setTimeout(() => success.value = '', 3000)
      await loadInventory()
    } else error.value = data.error || 'Seed failed'
  } catch (e) { error.value = e.message }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
  router.replace('/login')
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return iso }
}

function statusBadge(status) {
  const map = {
    new: { color: '#b48a3a', bg: '#fef8e7', label: 'New' },
    paid: { color: '#3a8a5e', bg: '#e7f5ed', label: 'Paid' },
    shipped: { color: '#3a8a5e', bg: '#e7f5ed', label: 'Shipped' },
    completed: { color: '#666', bg: '#f0f0f0', label: 'Completed' },
    cancelled: { color: '#b03030', bg: '#fde8e8', label: 'Cancelled' }
  }
  return map[status] || { color: '#888', bg: '#f0f0f0', label: status }
}
</script>

<template>
  <div class="admin-shell" v-if="!loading">
    <aside class="sidebar">
      <p class="brand-eyebrow">Demain Life · Shop</p>
      <h2 class="brand-name">🛍️ Shop Admin</h2>
      <p class="user-info">{{ user?.username }}</p>

      <nav class="tabs">
        <button :class="{ active: activeTab === 'orders' }" @click="switchTab('orders')">
          📦 Orders
          <span v-if="ordersState.summary.newOrders > 0" class="badge">{{ ordersState.summary.newOrders }}</span>
        </button>
        <button :class="{ active: activeTab === 'inventory' }" @click="switchTab('inventory')">
          📚 Inventory
        </button>
      </nav>

      <button class="logout-btn" @click="logout">Sign out</button>
    </aside>

    <main class="content">
      <!-- Header -->
      <header class="content-header">
        <h2>{{ activeTab === 'orders' ? 'Orders' : 'Inventory' }}</h2>
        <div v-if="success" class="toast success">{{ success }}</div>
        <div v-if="error" class="toast error">{{ error }}</div>
      </header>

      <!-- ========== ORDERS TAB ========== -->
      <section v-if="activeTab === 'orders'" class="orders-layout">
        <!-- Summary cards -->
        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-label">New orders</div>
            <div class="summary-value">{{ ordersState.summary.newOrders || 0 }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Awaiting shipment</div>
            <div class="summary-value">{{ ordersState.summary.awaitingShipment || 0 }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Awaiting pickup</div>
            <div class="summary-value">{{ ordersState.summary.awaitingPickup || 0 }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Revenue (month)</div>
            <div class="summary-value">HK${{ ordersState.summary.revenueThisMonth || 0 }}</div>
          </div>
        </div>

        <!-- Filters + List -->
        <div class="filters">
          <button v-for="f in [
            { key: 'all', label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'awaiting-payment', label: 'Awaiting payment' },
            { key: 'paid', label: 'Paid' },
            { key: 'awaiting-ship', label: 'Awaiting shipment' },
            { key: 'awaiting-pickup', label: 'Awaiting pickup' },
            { key: 'shipped', label: 'Shipped' },
            { key: 'completed', label: 'Completed' }
          ]" :key="f.key"
            :class="{ active: ordersState.filter === f.key }"
            @click="ordersState.filter = f.key">
            {{ f.label }}
          </button>
        </div>

        <div class="orders-grid">
          <div class="orders-list">
            <button class="mini-btn" :disabled="ordersState.loading" @click="loadOrders">
              {{ ordersState.loading ? 'Loading…' : 'Refresh' }}
            </button>
            <div v-if="filteredOrders.length === 0" class="empty-state">No orders match this filter.</div>
            <article v-for="o in filteredOrders" :key="o.id"
              class="order-row"
              :class="{ active: ordersState.selected?.id === o.id, unread: o.unread }"
              @click="openOrder(o.id)">
              <div class="row-top">
                <strong>{{ o.id }}</strong>
                <span class="status-badge" :style="{ color: statusBadge(o.status).color, background: statusBadge(o.status).bg }">
                  {{ statusBadge(o.status).label }}
                </span>
              </div>
              <div class="row-mid">{{ o.customer.name }} · HK${{ o.totals.total }}</div>
              <div class="row-bot">
                <span>{{ o.items.reduce((s, i) => s + i.qty, 0) }} items</span>
                <span>{{ o.delivery.method === 'pickup' ? '📦 Pickup' : '🚚 Ship' }}</span>
                <span>{{ formatDate(o.createdAt) }}</span>
              </div>
            </article>
          </div>

          <aside class="order-detail" v-if="ordersState.selected">
            <header>
              <h3>{{ ordersState.selected.id }}</h3>
              <button class="close-btn" @click="ordersState.selected = null">×</button>
            </header>
            <div class="detail-section">
              <h4>Customer</h4>
              <p><strong>{{ ordersState.selected.customer.name }}</strong></p>
              <p>📧 <a :href="`mailto:${ordersState.selected.customer.email}`">{{ ordersState.selected.customer.email }}</a></p>
              <p v-if="ordersState.selected.customer.phone">📞 {{ ordersState.selected.customer.phone }}</p>
            </div>

            <div class="detail-section">
              <h4>Items</h4>
              <div v-for="it in ordersState.selected.items" :key="it.sku" class="item-row">
                <span>{{ it.name }} × {{ it.qty }}</span>
                <span>HK${{ it.lineTotal }}</span>
              </div>
              <div class="item-row total"><strong>Total</strong><strong>HK${{ ordersState.selected.totals.total }}</strong></div>
            </div>

            <div class="detail-section">
              <h4>Delivery</h4>
              <p>{{ ordersState.selected.delivery.method === 'pickup' ? '📦 Pickup at 1331' : '🚚 ' + (ordersState.selected.delivery.address || 'Ship') }}</p>
              <p v-if="ordersState.selected.delivery.trackingNumber">Tracking: {{ ordersState.selected.delivery.trackingNumber }}</p>
            </div>

            <div class="detail-section">
              <h4>Payment</h4>
              <p>Method: {{ ordersState.selected.payment.method }}</p>
              <p>Status: <strong :style="{ color: ordersState.selected.payment.status === 'paid' ? '#3a8a5e' : '#b48a3a' }">
                {{ ordersState.selected.payment.status }}
              </strong></p>
            </div>

            <!-- Actions -->
            <div class="detail-section actions">
              <h4>Actions</h4>
              <button v-if="ordersState.selected.payment.status !== 'paid'" class="action-btn primary" @click="orderAction('mark-paid')">
                ✅ Mark as paid
              </button>
              <template v-if="ordersState.selected.payment.status === 'paid'">
                <template v-if="ordersState.selected.delivery.method === 'ship' && ordersState.selected.status !== 'shipped' && ordersState.selected.status !== 'completed'">
                  <input v-model="ordersState.trackingInput" placeholder="Tracking number (optional)" />
                  <button class="action-btn primary" @click="orderAction('mark-shipped', { trackingNumber: ordersState.trackingInput })">
                    📤 Mark as shipped
                  </button>
                </template>
                <button v-if="ordersState.selected.delivery.method === 'pickup' && ordersState.selected.status !== 'completed'" class="action-btn primary" @click="orderAction('mark-picked-up')">
                  ✅ Confirm picked up
                </button>
                <button v-if="ordersState.selected.delivery.method === 'ship' && ordersState.selected.status === 'shipped'" class="action-btn" @click="orderAction('mark-delivered')">
                  ✅ Mark as delivered
                </button>
              </template>
              <button class="action-btn danger" @click="orderAction('cancel', { reason: 'Manual cancellation' })">
                ❌ Cancel order
              </button>
            </div>

            <div class="detail-section">
              <h4>History</h4>
              <ul class="history">
                <li v-for="(h, i) in ordersState.selected.history" :key="i">
                  {{ formatDate(h.at) }} · {{ h.action }}<span v-if="h.by"> · {{ h.by }}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <!-- ========== INVENTORY TAB ========== -->
      <section v-else-if="activeTab === 'inventory'" class="inventory-layout">
        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-label">Total SKUs</div>
            <div class="summary-value">{{ inventoryState.summary.total || 0 }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Active</div>
            <div class="summary-value">{{ inventoryState.summary.active || 0 }}</div>
          </div>
          <div class="summary-card warn">
            <div class="summary-label">Low stock (< 5)</div>
            <div class="summary-value">{{ inventoryState.summary.lowStock || 0 }}</div>
          </div>
          <div class="summary-card warn">
            <div class="summary-label">Out of stock</div>
            <div class="summary-value">{{ inventoryState.summary.outOfStock || 0 }}</div>
          </div>
        </div>

        <div class="inventory-toolbar">
          <p>Edit products below — or directly in <a :href="inventoryState.sheetUrl" target="_blank">Google Sheet</a>. Changes sync both ways.</p>
          <div>
            <button class="mini-btn primary" @click="openProductEditor(null)">
              + Add Product
            </button>
            <button class="mini-btn" :disabled="inventoryState.loading" @click="loadInventory">
              {{ inventoryState.loading ? 'Loading…' : 'Refresh' }}
            </button>
            <button class="mini-btn" @click="seedDemoProducts" v-if="inventoryState.products.length === 0">
              🌱 Seed demo data
            </button>
          </div>
        </div>

        <div v-if="inventoryState.products.length === 0" class="empty-state">
          No products yet. Click "Seed demo data" or add rows in the Inventory Sheet.
        </div>

        <table v-else class="inv-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th style="text-align:right;">Stock</th>
              <th style="text-align:right;">Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in inventoryState.products" :key="p.sku">
              <td><code>{{ p.sku }}</code></td>
              <td>
                <img v-if="p.imageUrl" :src="p.imageUrl" class="inv-thumb" />
                <span v-else class="inv-thumb-empty">—</span>
              </td>
              <td>
                {{ p.nameEn }}
                <div v-if="p.nameZh" class="zh-name">{{ p.nameZh }}</div>
              </td>
              <td>{{ p.category }}</td>
              <td style="text-align:right;" :class="{ 'low-stock': p.stock < 5 && p.stock > 0, 'out-of-stock': p.stock === 0 }">
                {{ p.stock }}
              </td>
              <td style="text-align:right;">HK${{ p.price }}</td>
              <td>
                <span class="status-badge" :class="`status-${p.status || 'active'}`">{{ p.status || 'active' }}</span>
              </td>
              <td class="actions-cell">
                <button class="row-btn" @click="openProductEditor(p)">Edit</button>
                <a class="row-btn ghost" :href="`/shop/product/${p.sku}`" target="_blank">View</a>
                <button v-if="p.status !== 'inactive'" class="row-btn danger" @click="deactivateProduct(p)">Hide</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ========== PRODUCT EDITOR MODAL ========== -->
      <div v-if="editorState.open" class="modal-overlay" @click.self="closeEditor">
        <div class="editor-modal">
          <header class="editor-header">
            <h3>{{ editorState.isNew ? '+ Add New Product' : `Edit · ${editorState.form.sku}` }}</h3>
            <button class="close-x" @click="closeEditor">×</button>
          </header>

          <div class="editor-body">
            <div class="editor-section">
              <h4>Basic Info</h4>
              <div class="form-row two-col">
                <label>
                  SKU <span class="req">*</span>
                  <input v-model="editorState.form.sku" :disabled="!editorState.isNew" placeholder="DLS-XXX" />
                  <small v-if="!editorState.isNew">SKU is the unique identifier and cannot be changed</small>
                </label>
                <label>
                  Category
                  <input v-model="editorState.form.category" placeholder="Home / Tableware / Bath" />
                </label>
              </div>
              <div class="form-row two-col">
                <label>
                  Name (EN) <span class="req">*</span>
                  <input v-model="editorState.form.nameEn" placeholder="Linen Tote" />
                </label>
                <label>
                  Name (中)
                  <input v-model="editorState.form.nameZh" placeholder="亚麻托特包" />
                </label>
              </div>
            </div>

            <div class="editor-section">
              <h4>Pricing & Stock</h4>
              <div class="form-row three-col">
                <label>
                  Price (HKD) <span class="req">*</span>
                  <input type="number" min="0" v-model.number="editorState.form.price" />
                </label>
                <label>
                  Cost (HKD)
                  <input type="number" min="0" v-model.number="editorState.form.cost" />
                </label>
                <label>
                  Stock
                  <input type="number" min="0" v-model.number="editorState.form.stock" />
                </label>
              </div>
              <div class="form-row two-col">
                <label>
                  Status
                  <select v-model="editorState.form.status">
                    <option value="active">Active (visible in shop)</option>
                    <option value="inactive">Inactive (hidden)</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
                <label>
                  Variant
                  <input v-model="editorState.form.variant" placeholder="Natural / Warm white" />
                </label>
              </div>
            </div>

            <div class="editor-section">
              <h4>Images</h4>
              <label>
                Main image URL
                <input v-model="editorState.form.imageUrl" placeholder="https://..." />
                <small>Tip: upload to Google Drive (Anyone with link can view) or Unsplash and paste the direct image URL.</small>
              </label>
              <label v-if="editorState.form.imageUrl" class="image-preview-wrap">
                <img :src="editorState.form.imageUrl" class="image-preview" />
              </label>
              <label>
                Gallery URLs (one per line)
                <textarea v-model="editorState.form.gallery" rows="3" placeholder="https://image1.jpg&#10;https://image2.jpg"></textarea>
              </label>
            </div>

            <div class="editor-section">
              <h4>Product Detail Page Content</h4>
              <label>
                Description (EN)
                <textarea v-model="editorState.form.descriptionEn" rows="4" placeholder="Long-form description shown on the product detail page…"></textarea>
              </label>
              <label>
                Description (中)
                <textarea v-model="editorState.form.descriptionZh" rows="4" placeholder="中文详细描述…"></textarea>
              </label>
              <div class="form-row two-col">
                <label>
                  Materials
                  <input v-model="editorState.form.materials" placeholder="100% natural linen" />
                </label>
                <label>
                  Dimensions
                  <input v-model="editorState.form.dimensions" placeholder="40 × 35 cm" />
                </label>
              </div>
              <label>
                Care Instructions
                <input v-model="editorState.form.careInstructions" placeholder="Hand wash cold, hang to dry" />
              </label>
            </div>

            <div class="editor-section">
              <h4>Internal Notes</h4>
              <div class="form-row two-col">
                <label>
                  Supplier
                  <input v-model="editorState.form.supplier" placeholder="Demain Workshop" />
                </label>
                <label>
                  Short note (card preview)
                  <input v-model="editorState.form.notes" placeholder="Brief text shown on the shop card" />
                </label>
              </div>
            </div>

            <p v-if="editorState.error" class="editor-error">{{ editorState.error }}</p>
          </div>

          <footer class="editor-footer">
            <button class="mini-btn ghost" @click="closeEditor" :disabled="editorState.saving">Cancel</button>
            <button class="mini-btn primary" @click="saveProduct" :disabled="editorState.saving">
              {{ editorState.saving ? 'Saving…' : (editorState.isNew ? 'Create product' : 'Save changes') }}
            </button>
          </footer>
        </div>
      </div>
    </main>
  </div>
  <div v-else class="loading">Loading…</div>
</template>

<style scoped>
.loading { padding: 4rem; text-align: center; color: #888; }
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr; background: #fafaf7; font-family: 'Inter', -apple-system, sans-serif; }
.sidebar { background: #fff; border-right: 1px solid #e8e6e1; padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.brand-eyebrow { font-size: 0.7rem; letter-spacing: 0.16em; text-transform: uppercase; color: #8a8780; margin: 0; }
.brand-name { font-size: 1.2rem; margin: 0; font-weight: 500; }
.user-info { font-size: 0.82rem; color: #6b665e; padding: 0.5rem 0; border-bottom: 1px solid #f0eee9; }

.tabs { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
.tabs button { background: transparent; border: none; padding: 0.7rem 0.8rem; text-align: left; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
.tabs button.active { background: #f4f1ea; font-weight: 500; }
.badge { background: #b03030; color: #fff; font-size: 0.7rem; padding: 2px 8px; border-radius: 100px; }

.logout-btn { padding: 0.6rem; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.88rem; color: #666; }

.content { overflow-x: auto; }
.content-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 2rem; border-bottom: 1px solid #e8e6e1; background: #fff; }
.content-header h2 { margin: 0; font-weight: 500; }
.toast { padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.88rem; }
.toast.success { background: #e7f5ed; color: #2a6d44; }
.toast.error { background: #fde8e8; color: #a02020; }

.orders-layout, .inventory-layout { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.2rem; }
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.summary-card { background: #fff; border: 1px solid #e8e6e1; border-radius: 10px; padding: 1rem 1.2rem; }
.summary-card .summary-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
.summary-card .summary-value { font-size: 1.6rem; font-weight: 500; margin-top: 0.3rem; }
.summary-card.warn .summary-value { color: #b48a3a; }

.filters { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.filters button { background: #fff; border: 1px solid #e8e6e1; padding: 0.4rem 0.9rem; border-radius: 100px; cursor: pointer; font-size: 0.85rem; font-family: inherit; }
.filters button.active { background: #2a2826; color: #fff; border-color: #2a2826; }

.orders-grid { display: grid; grid-template-columns: 1fr 380px; gap: 1.2rem; align-items: start; }
.orders-list { background: #fff; border: 1px solid #e8e6e1; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.empty-state { padding: 2.5rem; text-align: center; color: #888; }

.order-row { display: flex; flex-direction: column; gap: 0.3rem; padding: 0.8rem 1rem; border: 1px solid transparent; border-radius: 8px; cursor: pointer; background: #fafaf7; transition: border-color 0.15s; }
.order-row:hover { border-color: #ddd; }
.order-row.active { border-color: #2a2826; }
.order-row.unread { background: #fff7e6; }
.row-top { display: flex; justify-content: space-between; align-items: center; }
.row-mid { font-size: 0.92rem; }
.row-bot { display: flex; gap: 0.8rem; font-size: 0.78rem; color: #8a8780; }
.status-badge { padding: 2px 8px; border-radius: 100px; font-size: 0.72rem; font-weight: 500; }

.order-detail { background: #fff; border: 1px solid #e8e6e1; border-radius: 10px; padding: 1.3rem; }
.order-detail header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; }
.order-detail h3 { margin: 0; font-size: 1.05rem; }
.close-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #888; }
.detail-section { margin-bottom: 1.2rem; }
.detail-section h4 { font-size: 0.78rem; color: #888; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.5rem; }
.detail-section p { margin: 0.25rem 0; font-size: 0.92rem; }
.item-row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem; }
.item-row.total { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee; }
.actions { display: flex; flex-direction: column; gap: 0.5rem; }
.actions input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; }
.action-btn { padding: 0.6rem; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; font-family: inherit; font-weight: 500; }
.action-btn.primary { background: #2a2826; color: #fff; border-color: #2a2826; }
.action-btn.danger { color: #b03030; border-color: #f4c8c8; }
.history { list-style: none; padding: 0; margin: 0; font-size: 0.82rem; color: #6b665e; }
.history li { padding: 0.3rem 0; border-bottom: 1px dashed #f0eee9; }

.inventory-toolbar { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 1rem 1.5rem; border-radius: 8px; border: 1px solid #e8e6e1; gap: 1rem; }
.inventory-toolbar p { margin: 0; font-size: 0.9rem; color: #6b665e; }
.inventory-toolbar a { color: #2a2826; }
.inventory-toolbar > div { display: flex; gap: 0.5rem; }
.mini-btn { padding: 0.4rem 0.9rem; background: #2a2826; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 0.85rem; }

.inv-table { width: 100%; background: #fff; border-collapse: collapse; border: 1px solid #e8e6e1; border-radius: 8px; overflow: hidden; }
.inv-table th, .inv-table td { padding: 0.7rem 1rem; text-align: left; border-bottom: 1px solid #f0eee9; }
.inv-table th { background: #f4f1ea; font-weight: 500; font-size: 0.85rem; }
.inv-table .zh-name { font-size: 0.82rem; color: #8a8780; }
.inv-table .low-stock { color: #b48a3a; font-weight: 500; }
.inv-table .out-of-stock { color: #b03030; font-weight: 500; }
.inv-table .status-badge { background: #e7f5ed; color: #2a6d44; }
.inv-table .status-badge.status-sold-out { background: #fde8e8; color: #a02020; }
.inv-table .status-badge.status-discontinued { background: #f0f0f0; color: #666; }

@media (max-width: 900px) {
  .admin-shell { grid-template-columns: 1fr; }
  .summary-row { grid-template-columns: repeat(2, 1fr); }
  .orders-grid { grid-template-columns: 1fr; }
}

/* ===== Product editor modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}
.editor-modal {
  background: #fff;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid #eee;
}
.editor-header h3 { margin: 0; font-size: 1.05rem; font-weight: 600; }
.close-x {
  background: transparent;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: #888;
  line-height: 1;
}
.close-x:hover { color: #000; }
.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.4rem 1.5rem;
}
.editor-section {
  margin-bottom: 1.6rem;
  padding-bottom: 1.4rem;
  border-bottom: 1px dashed #eee;
}
.editor-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}
.editor-section h4 {
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 0.8rem;
  font-weight: 600;
}
.editor-body label {
  display: block;
  margin-bottom: 0.9rem;
  font-size: 0.85rem;
  color: #444;
  font-weight: 500;
}
.editor-body input,
.editor-body select,
.editor-body textarea {
  width: 100%;
  margin-top: 0.3rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9rem;
  font-family: inherit;
  background: #fff;
  color: #1a1a1a;
}
.editor-body input:focus,
.editor-body select:focus,
.editor-body textarea:focus {
  outline: none;
  border-color: var(--color-neon, #39ff14);
  box-shadow: 0 0 0 3px rgba(57, 255, 20, 0.15);
}
.editor-body textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
.editor-body input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}
.editor-body small {
  display: block;
  margin-top: 0.3rem;
  color: #888;
  font-size: 0.75rem;
  font-weight: 400;
}
.req { color: #d04040; font-weight: 600; }
.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
}
.form-row.three-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.9rem;
}
.form-row.two-col > label,
.form-row.three-col > label { margin-bottom: 0; }
.image-preview-wrap {
  display: block;
  margin-top: 0.3rem;
}
.image-preview {
  max-width: 200px;
  max-height: 160px;
  border-radius: 4px;
  border: 1px solid #eee;
}
.editor-error {
  background: #fee;
  color: #c00;
  padding: 0.7rem 0.9rem;
  border-radius: 5px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
}
.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #fafaf7;
}

/* Action cell in inventory table */
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.row-btn {
  font-size: 0.75rem;
  padding: 0.35rem 0.7rem;
  border-radius: 4px;
  background: var(--color-neon, #39ff14);
  color: #0d0d0d;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}
.row-btn:hover { box-shadow: 0 2px 8px rgba(57,255,20,0.4); }
.row-btn.ghost {
  background: transparent;
  color: #444;
  border: 1px solid #ddd;
  font-weight: 500;
}
.row-btn.ghost:hover { border-color: #999; box-shadow: none; }
.row-btn.danger {
  background: #fee;
  color: #c00;
  font-weight: 500;
}

.inv-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
  display: block;
}
.inv-thumb-empty {
  display: inline-block;
  width: 48px;
  height: 48px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  line-height: 48px;
  color: #ccc;
}

.mini-btn.primary {
  background: var(--color-neon, #39ff14);
  color: #0d0d0d;
  font-weight: 600;
  border: none;
  box-shadow: 0 0 0 1px rgba(57,255,20,0.4), 0 2px 8px rgba(57,255,20,0.25);
}
.mini-btn.primary:hover {
  box-shadow: 0 0 0 1px rgba(57,255,20,0.7), 0 4px 14px rgba(57,255,20,0.4);
}

@media (max-width: 600px) {
  .form-row.two-col,
  .form-row.three-col {
    grid-template-columns: 1fr;
  }
}

</style>
