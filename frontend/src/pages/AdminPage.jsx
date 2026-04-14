import { useState, useEffect } from 'react'
import ImageEditor from '@/components/ImageEditor'
import api from '@/lib/api-client'
import {
  loginSchema,
  adminSetupSchema,
  productSchema,
  collectionSchema,
  updateProfileSchema,
  changePasswordSchema,
  validateFields,
} from '@/lib/validators'
import { STORAGE_KEYS } from '@/constants'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN))
  const [view, setView] = useState('dashboard')
  const [sideOpen, setSideOpen] = useState(false)

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN)
    setToken(null)
  }
  if (!token) return <AdminLogin onLogin={setToken} />

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'collections', label: 'Collections', icon: '🗂️' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'whatsapp', label: 'WhatsApp Setup', icon: '📱' },
    { id: 'settings', label: 'Account Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 sm:w-64 bg-navy-800 text-white flex flex-col z-40
        transition-transform duration-300 lg:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 sm:p-6 border-b border-navy-700">
          <img src="/logo.png" alt="Adiyogi" className="h-9 sm:h-10 w-auto" />
          <p className="text-navy-300 text-xs mt-2">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 sm:p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                setSideOpen(false)
              }}
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all ${
                view === item.id
                  ? 'bg-champagne-500 text-white'
                  : 'text-navy-200 hover:bg-navy-700'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 sm:p-4 border-t border-navy-700 space-y-1">
          <button
            onClick={logout}
            className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl text-sm text-navy-300 hover:bg-navy-700 transition-colors"
          >
            🚪 Logout
          </button>
          <a
            href="/"
            className="block px-3 sm:px-4 py-2.5 rounded-xl text-sm text-navy-300 hover:bg-navy-700 transition-colors"
          >
            🏠 View Store
          </a>
        </div>
      </aside>

      <main className="lg:ml-64 flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
          <button
            onClick={() => setSideOpen(true)}
            className="text-gray-600 hover:text-navy-700 p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-display font-bold text-navy-800 text-lg capitalize">
            {view}
          </span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {view === 'dashboard' && <DashboardView />}
          {view === 'products' && <ProductsView />}
          {view === 'collections' && <CollectionsView />}
          {view === 'orders' && <OrdersView />}
          {view === 'whatsapp' && <WhatsAppSetupView />}
          {view === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  )
}

/* ─── LOGIN ─── */
function AdminLogin({ onLogin }) {
  const [showSetup, setShowSetup] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [setupForm, setSetupForm] = useState({ username: '', password: '', name: 'Admin', whatsappNumber: '' })
  const [setupErrors, setSetupErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = validateFields(loginSchema, form)
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error(Object.values(errs)[0]); return }
    setErrors({})
    setLoading(true)
    try {
      const { data } = await api.post('/admin/login', form)
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token)
      onLogin(data.token)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  const handleSetup = async (e) => {
    e.preventDefault()
    const errs = validateFields(adminSetupSchema, setupForm)
    if (Object.keys(errs).length > 0) { setSetupErrors(errs); toast.error(Object.values(errs)[0]); return }
    setSetupErrors({})
    setLoading(true)
    try {
      await api.post('/admin/setup', setupForm)
      toast.success('Admin created! Please login.')
      setShowSetup(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden">
        <div className="bg-navy-700 p-6 sm:p-8 text-center">
          <img src="/logo.png" alt="Adiyogi" className="h-12 sm:h-16 mx-auto mb-3" />
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Admin Panel</h1>
          <p className="text-navy-200 text-xs sm:text-sm">Adiyogi International</p>
        </div>
        <div className="p-5 sm:p-8">
          {!showSetup ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <Label>Username</Label>
                <input
                  value={form.username}
                  onChange={(e) => { setForm((p) => ({ ...p, username: e.target.value })); if (errors.username) setErrors((p) => ({ ...p, username: undefined })) }}
                  className={`input ${errors.username ? 'border-red-400' : ''}`}
                  placeholder="admin"
                />
                <FieldError msg={errors.username} />
              </div>
              <div>
                <Label>Password</Label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); if (errors.password) setErrors((p) => ({ ...p, password: undefined })) }}
                  className={`input ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="••••••••"
                />
                <FieldError msg={errors.password} />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-center text-xs text-gray-400">
                First time?{' '}
                <button type="button" onClick={() => setShowSetup(true)} className="text-navy-600 font-semibold hover:underline">
                  Setup Admin
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4" noValidate>
              <h2 className="font-display font-bold text-navy-800 text-lg sm:text-xl">Create Admin Account</h2>
              {[
                { key: 'name', label: 'Display Name', ph: 'Admin' },
                { key: 'username', label: 'Username', ph: 'admin' },
                { key: 'password', label: 'Password', ph: '••••••••', type: 'password' },
                { key: 'whatsappNumber', label: 'WhatsApp Number', ph: '9876543210' },
              ].map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input
                    type={f.type || 'text'}
                    value={setupForm[f.key]}
                    onChange={(e) => { setSetupForm((p) => ({ ...p, [f.key]: e.target.value })); if (setupErrors[f.key]) setSetupErrors((p) => ({ ...p, [f.key]: undefined })) }}
                    className={`input ${setupErrors[f.key] ? 'border-red-400' : ''}`}
                    placeholder={f.ph}
                  />
                  <FieldError msg={setupErrors[f.key]} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
              <button type="button" onClick={() => setShowSetup(false)} className="w-full text-center text-sm text-gray-500 hover:text-navy-600">
                Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── DASHBOARD ─── */
function DashboardView() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((r) => setStats(r.data))
      .catch(() => {})
  }, [])
  if (!stats) return <LoadingSpinner />

  const cards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders,
      icon: '📋',
      bg: 'bg-blue-50   text-blue-700',
    },
    {
      label: 'Pending',
      value: stats.pendingOrders,
      icon: '⏳',
      bg: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Confirmed',
      value: stats.confirmedOrders,
      icon: '✅',
      bg: 'bg-green-50  text-green-700',
    },
    {
      label: 'Total Revenue',
      value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: '💰',
      bg: 'bg-navy-50   text-navy-700',
    },
    {
      label: 'Active Products',
      value: stats.totalProducts,
      icon: '📦',
      bg: 'bg-purple-50 text-purple-700',
    },
    {
      label: 'Delivered',
      value: stats.deliveredOrders,
      icon: '🚚',
      bg: 'bg-teal-50   text-teal-700',
    },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 mb-5 sm:mb-8">
        Dashboard
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {cards.map((c) => (
          <div key={c.label} className={`${c.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6`}>
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{c.icon}</div>
            <p className="text-xl sm:text-2xl font-bold font-display">{c.value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-70">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-display font-semibold text-base sm:text-lg text-navy-800">
            Recent Orders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>
                {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders?.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-navy-600">
                    {o.orderId}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-700">
                    {o.customer?.name}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 font-semibold">
                    ₹{o.total?.toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-400">
                    {new Date(o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ─── UNIT EDIT MODAL ─── */
function UnitEditModal({ baseUnit, secondaryUnit, conversionRate, onChange, onClose }) {
  const [base, setBase] = useState(baseUnit || 'PAC')
  const [secondary, setSecondary] = useState(secondaryUnit || 'NOS')
  const [mode, setMode] = useState(
    [10, 20].includes(conversionRate) ? 'preset' : 'custom',
  )
  const [preset, setPreset] = useState(
    [10, 20].includes(conversionRate) ? conversionRate : 10,
  )
  const [custom, setCustom] = useState(
    ![10, 20].includes(conversionRate) ? String(conversionRate) : '',
  )

  const showConversion = secondary === 'NOS'
  const finalRate = showConversion
    ? mode === 'preset'
      ? preset
      : parseInt(custom) || 1
    : 1

  const BASE_UNITS = ['PAC', 'NOS']
  const SECONDARY_UNITS = ['NOS', 'None']

  const summaryText =
    secondary === 'None' ? `Unit: ${base} only` : `1 ${base} = ${finalRate} ${secondary}`

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-navy-800 text-lg">
            Edit Unit Configuration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl p-1"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-5">

          {/* Base Unit selector */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Base Unit
            </p>
            <div className="flex gap-2">
              {BASE_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setBase(u)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    base === u
                      ? 'bg-navy-700 text-white border-navy-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {base === 'PAC'
                ? 'Packs — the main unit customers order in'
                : 'Numbers — individual pieces'}
            </p>
          </div>

          {/* Secondary Unit selector */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Secondary Unit
            </p>
            <div className="flex gap-2">
              {SECONDARY_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSecondary(u)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    secondary === u
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {secondary === 'NOS'
                ? 'Numbers — individual pieces per pack'
                : 'No secondary unit for this product'}
            </p>
          </div>

          {/* Conversion rate — only when secondary = NOS */}
          {showConversion && (
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                How many {secondary} in 1 {base}?
              </p>
              <div className="flex gap-2 mb-3">
                {[10, 20].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setMode('preset')
                      setPreset(r)
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      mode === 'preset' && preset === r
                        ? 'bg-navy-700 text-white border-navy-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
                    }`}
                  >
                    {r} {secondary}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    mode === 'custom'
                      ? 'bg-champagne-500 text-white border-champagne-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-champagne-300'
                  }`}
                >
                  Custom
                </button>
              </div>
              {mode === 'custom' && (
                <div className="flex items-center gap-2 bg-champagne-50 rounded-xl p-3 border border-champagne-200">
                  <span className="text-sm text-gray-600 font-semibold whitespace-nowrap">
                    1 {base} =
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g. 50"
                    className="input flex-1 text-center font-bold text-navy-700 py-2"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600 font-semibold">{secondary}</span>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-sm font-semibold text-navy-700">
              <span className="text-champagne-600">{summaryText}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onChange({
                baseUnit: base,
                secondaryUnit: secondary,
                conversionRate: finalRate,
              })
              onClose()
            }}
            className="w-full btn-primary"
            disabled={
              showConversion && mode === 'custom' && (!custom || parseInt(custom) < 1)
            }
          >
            Save Unit Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── INLINE CREATE COLLECTION MODAL ─── */
function CreateCollectionModal({ onCreated, onClose }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleCreate = async () => {
    const fieldErrors = validateFields(collectionSchema, { name, description: desc })
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error(Object.values(fieldErrors)[0])
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('description', desc)
      if (image) fd.append('image', image)
      const { data } = await api.post('/collections', fd)
      toast.success('Collection created!')
      onCreated(data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-navy-800 text-lg">
            Create New Collection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl p-1"
          >
            ✕
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label>Collection Name *</Label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
              }}
              className={`input ${errors.name ? 'border-red-400' : ''}`}
              placeholder="e.g. Spray Nozzles"
            />
            <FieldError msg={errors.name} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          {/* Cover Image */}
          <div>
            <Label>Cover Image</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-navy-50 file:text-navy-700 file:font-semibold hover:file:bg-navy-100"
            />
            {preview && (
              <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border-2 border-navy-100 shadow-sm">
                <img
                  src={preview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                  <span className="text-white text-xs font-semibold">
                    {name || 'Collection'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null)
                    setPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              className="flex-1 btn-primary"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── PRODUCTS ─── */
function ProductsView() {
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  // Unified ordered image list: { type: 'existing'|'new', url, fileId?, file?, preview? }
  // This single array drives both the thumbnail strip and submit order
  const [imageList, setImageList] = useState([])
  const [dragIdx, setDragIdx] = useState(null)

  // Keep legacy existingImages/images/removedFileIds in sync for ImageEditor compatibility
  const existingImages = imageList.filter((x) => x.type === 'existing')
  const images         = imageList.filter((x) => x.type === 'new')

  const setExistingImages = (updater) => {
    setImageList((prev) => {
      const existing = typeof updater === 'function'
        ? updater(prev.filter((x) => x.type === 'existing'))
        : updater
      const newImgs = prev.filter((x) => x.type === 'new')
      return [...existing, ...newImgs]
    })
  }
  const setImages = (updater) => {
    setImageList((prev) => {
      const existingImgs = prev.filter((x) => x.type === 'existing')
      const newImgs = typeof updater === 'function'
        ? updater(prev.filter((x) => x.type === 'new'))
        : updater
      return [...existingImgs, ...newImgs]
    })
  }
  const [loading, setLoading] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [showCreateColl, setShowCreateColl] = useState(false)
  const [errors, setErrors] = useState({})
  const [showImageEditor, setShowImageEditor] = useState(false)

  const EMPTY_FORM = {
    name: '',
    itemCode: '',
    hsnCode: '',
    salesPrice: '',
    purchasePrice: '',
    standardPacking: '',
    baseUnit: 'PAC',
    secondaryUnit: 'NOS',
    unitConversionRate: 10,
    gstRate: 5,
    collections: [],
    place: '',
    description: '',
  }
  const [form, setForm] = useState(EMPTY_FORM)

  const fetchData = () => {
    api.get('/products?limit=200').then((r) => setProducts(r.data.products))
    api.get('/collections').then((r) => setCollections(r.data))
  }
  useEffect(() => {
    fetchData()
  }, [])

  const [removedFileIds, setRemovedFileIds] = useState([])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setImageList([])
    setRemovedFileIds([])
    setEditing(null)
    setErrors({})
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    const newFiles = files.map((file) => ({
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    }))
    setImageList((prev) => [...prev, ...newFiles])
    setShowImageEditor(true)
    e.target.value = ''
  }

  const handleImageEditorApply = (croppedBlob, index, type) => {
    const croppedFile = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' })
    if (type === 'new') {
      // Find the nth 'new' item in imageList and replace it
      setImageList((prev) => {
        let newCount = -1
        return prev.map((item) => {
          if (item.type !== 'new') return item
          newCount++
          if (newCount === index) {
            return { ...item, file: croppedFile, preview: URL.createObjectURL(croppedBlob) }
          }
          return item
        })
      })
    } else {
      // Replace existing image: queue fileId for deletion, swap in cropped new file
      setImageList((prev) => {
        let exCount = -1
        const updated = []
        for (const item of prev) {
          if (item.type !== 'existing') { updated.push(item); continue }
          exCount++
          if (exCount === index) {
            if (item.fileId) setRemovedFileIds((r) => [...r, item.fileId])
            updated.push({ type: 'new', file: croppedFile, preview: URL.createObjectURL(croppedBlob) })
          } else {
            updated.push(item)
          }
        }
        return updated
      })
    }
    setShowImageEditor(false)
  }

  const handleImageRemove = (index, type) => {
    setImageList((prev) => {
      let count = -1
      return prev.filter((item) => {
        if (item.type !== type) return true
        count++
        if (count === index) {
          if (type === 'new' && item.preview) URL.revokeObjectURL(item.preview)
          if (type === 'existing' && item.fileId) setRemovedFileIds((r) => [...r, item.fileId])
          return false
        }
        return true
      })
    })
  }

  // Drag-to-reorder handlers
  const handleDragStart = (e, idx) => {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, idx) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIdx === null || dragIdx === idx) return
    setImageList((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(idx, 0, moved)
      setDragIdx(idx)
      return next
    })
  }
  const handleDragEnd = () => setDragIdx(null)

  const openEdit = (p) => {
    setEditing(p._id)
    setForm({
      name: p.name,
      itemCode: p.itemCode,
      hsnCode: p.hsnCode || '',
      salesPrice: p.salesPrice,
      purchasePrice: p.purchasePrice || '',
      standardPacking: p.standardPacking || '',
      baseUnit: p.baseUnit || 'PAC',
      secondaryUnit: p.secondaryUnit || 'NOS',
      unitConversionRate: p.unitConversionRate || 10,
      gstRate: p.gstRate || 5,
      collections: (p.collections || []).map((c) => c._id || c),
      place: p.place || '',
      description: p.description || '',
    })
    const urls    = p.images       ?? []
    const fileIds = p.imageFileIds ?? []
    setImageList(urls.map((url, i) => ({ type: 'existing', url, fileId: fileIds[i] ?? null })))
    setRemovedFileIds([])
    setShowForm(true)
  }

  const handleCollectionCreated = (newCol) => {
    setCollections((prev) => [...prev, newCol])
    setForm((p) => ({ ...p, collections: [...p.collections, newCol._id] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fieldErrors = validateFields(productSchema, form)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error(Object.values(fieldErrors)[0])
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'collections') return
        fd.append(k, v)
      })
      fd.append('collections', JSON.stringify(form.collections))

      if (editing) {
        // Send ordered list of kept existing URLs so backend can preserve order
        const keptUrls = imageList
          .filter((x) => x.type === 'existing')
          .map((x) => x.url)
        fd.append('keptImageUrls', JSON.stringify(keptUrls))
        if (removedFileIds.length) {
          fd.append('removeImageIds', JSON.stringify(removedFileIds))
        }
      }

      // Append new files in their current order
      imageList.filter((x) => x.type === 'new').forEach((img) => fd.append('images', img.file))

      if (editing) await api.put(`/products/${editing}`, fd)
      else await api.post('/products', fd)
      toast.success(`Product ${editing ? 'updated' : 'created'}!`)
      resetForm()
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (id) => {
    if (!confirm('Remove this product?')) return
    await api.delete(`/products/${id}`)
    toast.success('Product removed')
    fetchData()
  }

  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase()
    if (!q) return true
    return (
      p.name?.toLowerCase().includes(q) ||
      p.itemCode?.toLowerCase().includes(q) ||
      p.hsnCode?.toLowerCase().includes(q) ||
      p.place?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Unit modal */}
      {showUnitModal && (
        <UnitEditModal
          baseUnit={form.baseUnit}
          secondaryUnit={form.secondaryUnit}
          conversionRate={form.unitConversionRate}
          onChange={({ baseUnit, secondaryUnit, conversionRate }) =>
            setForm((p) => ({
              ...p,
              baseUnit,
              secondaryUnit,
              unitConversionRate: conversionRate,
            }))
          }
          onClose={() => setShowUnitModal(false)}
        />
      )}

      {/* Create collection modal */}
      {showCreateColl && (
        <CreateCollectionModal
          onCreated={handleCollectionCreated}
          onClose={() => setShowCreateColl(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 sm:mb-8 gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">
          Products
        </h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="btn-primary whitespace-nowrap"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg sm:text-xl text-navy-800">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-xl p-1"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              noValidate
            >
              {/* Product Name */}
              <FField
                label="Product Name *"
                value={form.name}
                onChange={(v) => {
                  setForm((p) => ({ ...p, name: v }))
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
                placeholder="Product name"
                full
                error={errors.name}
              />

              {/* Item Code */}
              <FField
                label="Item Code *"
                value={form.itemCode}
                onChange={(v) => {
                  setForm((p) => ({ ...p, itemCode: v }))
                  if (errors.itemCode) setErrors((p) => ({ ...p, itemCode: undefined }))
                }}
                placeholder="110-SPACS"
                error={errors.itemCode}
              />

              {/* HSN Code */}
              <FField
                label="HSN Code"
                value={form.hsnCode}
                onChange={(v) => {
                  setForm((p) => ({ ...p, hsnCode: v }))
                  if (errors.hsnCode) setErrors((p) => ({ ...p, hsnCode: undefined }))
                }}
                placeholder="84249000"
                error={errors.hsnCode}
              />

              {/* Sales Price (was Price) */}
              <FField
                label="Sales Price (₹) *"
                type="number"
                value={form.salesPrice}
                onChange={(v) => {
                  setForm((p) => ({ ...p, salesPrice: v }))
                  if (errors.salesPrice)
                    setErrors((p) => ({ ...p, salesPrice: undefined }))
                }}
                placeholder="480"
                error={errors.salesPrice}
              />

              {/* Purchase Price (was Original Price) */}
              <FField
                label="Purchase Price (₹)"
                type="number"
                value={form.purchasePrice}
                onChange={(v) => {
                  setForm((p) => ({ ...p, purchasePrice: v }))
                  if (errors.purchasePrice)
                    setErrors((p) => ({ ...p, purchasePrice: undefined }))
                }}
                placeholder="400"
                error={errors.purchasePrice}
              />

              {/* Standard Packing */}
              <FField
                label="Standard Packing"
                value={form.standardPacking}
                onChange={(v) => {
                  setForm((p) => ({ ...p, standardPacking: v }))
                  if (errors.standardPacking) setErrors((p) => ({ ...p, standardPacking: undefined }))
                }}
                placeholder="e.g. 10 NOS per PAC"
                error={errors.standardPacking}
              />

              {/* GST Rate */}
              <div>
                <Label>GST Rate (%)</Label>
                <select
                  value={form.gstRate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gstRate: Number(e.target.value) }))
                  }
                  onWheel={(e) => e.target.blur()}
                  className="input"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              {/* Unit — Edit Unit button instead of dropdown */}
              <div>
                <Label>Unit Configuration</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 input bg-gray-50 text-gray-600 text-sm flex items-center gap-2 cursor-default">
                    <span className="bg-navy-100 text-navy-700 text-xs font-bold px-2 py-0.5 rounded">
                      {form.baseUnit}
                    </span>
                    {form.secondaryUnit !== 'None' && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs text-gray-500">
                          1 {form.baseUnit} = {form.unitConversionRate}{' '}
                          {form.secondaryUnit}
                        </span>
                      </>
                    )}
                    {form.secondaryUnit === 'None' && (
                      <span className="text-xs text-gray-400">No secondary unit</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUnitModal(true)}
                    className="px-3 py-2 bg-navy-50 text-navy-700 hover:bg-navy-100 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    ✏️ Edit Unit
                  </button>
                </div>
              </div>

              {/* Collections — multi-select checkboxes */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Collections (select multiple)</Label>
                  <button
                    type="button"
                    onClick={() => setShowCreateColl(true)}
                    className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors"
                  >
                    + New Collection
                  </button>
                </div>
                {collections.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    No collections yet. Create one first.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {collections.map((c) => {
                      const checked = form.collections.includes(c._id)
                      return (
                        <label
                          key={c._id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                            checked
                              ? 'bg-navy-700 text-white'
                              : 'bg-white text-gray-700 hover:bg-navy-50 border border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(e) => {
                              setForm((p) => ({
                                ...p,
                                collections: e.target.checked
                                  ? [...p.collections, c._id]
                                  : p.collections.filter((id) => id !== c._id),
                              }))
                            }}
                          />
                          <span
                            className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                              checked
                                ? 'bg-champagne-400 border-champagne-400'
                                : 'border-gray-300'
                            }`}
                          >
                            {checked && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 12 12"
                              >
                                <path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7-1-0.5z" />
                              </svg>
                            )}
                          </span>
                          {c.name}
                          {c.isSystem && (
                            <span className="ml-auto text-champagne-300 text-[9px]">
                              ★
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
                {form.collections.length > 0 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    ✓{' '}
                    {form.collections
                      .map((id) => collections.find((c) => c._id === id)?.name)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>

              {/* Place (was Place / Location) */}
              <FField
                label="Place"
                value={form.place}
                onChange={(v) => {
                  setForm((p) => ({ ...p, place: v }))
                  if (errors.place) setErrors((p) => ({ ...p, place: undefined }))
                }}
                placeholder="KC 12"
                error={errors.place}
              />

              {/* Description */}
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="input resize-none"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              {/* Product Images */}
              <div className="sm:col-span-2">
                <Label>Product Images <span className="text-gray-400 font-normal text-xs">(max 5 · drag to reorder)</span></Label>

                {/* Unified thumbnail row with drag-to-reorder */}
                <div className="flex flex-wrap gap-3 mt-2 items-end">
                  {imageList.map((img, i) => {
                    const src = img.type === 'existing' ? img.url : img.preview
                    const isExisting = img.type === 'existing'
                    // index within its own type group (for ImageEditor callbacks)
                    const typeIdx = imageList.slice(0, i).filter((x) => x.type === img.type).length
                    return (
                      <div
                        key={`${img.type}-${i}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        className={`relative group w-20 h-20 rounded-xl overflow-hidden border-2 shadow-sm bg-gray-50 cursor-grab active:cursor-grabbing select-none ${
                          dragIdx === i ? 'opacity-50 scale-95' : ''
                        } ${isExisting ? 'border-navy-100' : 'border-champagne-400'}`}
                      >
                        <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleImageRemove(typeIdx, img.type) }}
                            className="w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setShowImageEditor(true) }}
                            className="w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow"
                            title="Edit / Crop"
                          >
                            <PencilIcon className="w-3.5 h-3.5 text-navy-700" />
                          </button>
                        </div>
                        <span className={`absolute bottom-1 left-1 text-white text-[9px] font-bold px-1 rounded leading-tight pointer-events-none ${isExisting ? 'bg-navy-700/70' : 'bg-champagne-500/80'}`}>
                          {isExisting ? i + 1 : 'NEW'}
                        </span>
                        {/* drag handle hint */}
                        <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <svg className="w-3 h-3 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                          </svg>
                        </span>
                      </div>
                    )
                  })}

                  {/* Add image button */}
                  {imageList.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-navy-400 hover:bg-navy-50 transition-colors bg-white group">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-navy-500 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-[10px] text-gray-400 group-hover:text-navy-500 font-medium">Add</span>
                      <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Max 10MB each. Drag thumbnails to reorder. Hover to edit or remove.</p>

                {/* Image Editor Modal */}
                {showImageEditor && (
                  <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-3 sm:p-4">
                    <div
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
                      style={{ height: 'min(90vh, 640px)' }}
                    >
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
                        <h2 className="font-display font-bold text-base text-navy-800">Edit Image</h2>
                        <button
                          type="button"
                          onClick={() => setShowImageEditor(false)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ImageEditor
                          images={existingImages.map((img) => ({ url: img.url, fileId: img.fileId }))}
                          newImages={images}
                          onApply={handleImageEditorApply}
                          onCancel={() => setShowImageEditor(false)}
                          onRemove={handleImageRemove}
                          onAddNew={() => document.getElementById('image-input').click()}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit buttons */}
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Product',
                  'Code',
                  'Purchase Price',
                  'Sales Price',
                  'Standard Packing',
                  'Collections',
                  'Place',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">
                            📦
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-gray-700 line-clamp-1 max-w-[140px] sm:max-w-none">
                        {p.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-gray-500">
                    {p.itemCode}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500">
                    {p.purchasePrice ? `₹${p.purchasePrice}` : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5  text-navy-700">₹{p.salesPrice}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-600">{p.standardPacking || '—'}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500 text-xs">
                    {p.collections?.length
                      ? p.collections.map((c) => c.name).join(', ')
                      : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500 text-xs">
                    {p.place || '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5">
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs bg-navy-50 text-navy-700 hover:bg-navy-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <EmptyState
              icon="📦"
              msg={searchQuery ? `No products match "${searchQuery}"` : 'No products yet. Add your first product!'}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── COLLECTIONS ─── */
function CollectionsView() {
  const [collections, setCollections] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(null) // id being deleted

  const fetchCollections = () =>
    api
      .get('/collections')
      .then((r) => setCollections(r.data))
      .catch(() => {})

  useEffect(() => {
    fetchCollections()
  }, [])

  const resetForm = () => {
    setName('')
    setDesc('')
    setImage(null)
    setPreview(null)
    setErrors({})
    setCurrentImage(null)
  }

  const openEditForm = (col) => {
    setEditingCollection(col)
    setName(col.name)
    setDesc(col.description || '')
    setImage(null)
    setPreview(null)
    setCurrentImage(col.image || null)
    setErrors({})
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const fieldErrors = validateFields(collectionSchema, { name, description: desc })
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error(Object.values(fieldErrors)[0])
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('description', desc)
      if (image) fd.append('image', image)
      await api.post('/collections', fd)
      toast.success('Collection created!')
      resetForm()
      setShowForm(false)
      fetchCollections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingCollection) return
    const fieldErrors = validateFields(collectionSchema, { name, description: desc })
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      toast.error(Object.values(fieldErrors)[0])
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', name.trim())
      fd.append('description', desc)
      if (image) fd.append('image', image)
      await api.put(`/collections/${editingCollection._id}`, fd)
      toast.success('Collection updated!')
      resetForm()
      setShowForm(false)
      setEditingCollection(null)
      fetchCollections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, colName) => {
    if (
      !confirm(
        `Remove collection "${colName}"? Products in this collection will become uncategorised.`,
      )
    )
      return
    setDeleting(id)
    try {
      await api.delete(`/collections/${id}`)
      toast.success('Collection removed')
      fetchCollections()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5 sm:mb-8 gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">
          Collections
        </h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className="btn-primary whitespace-nowrap"
        >
          + New Collection
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-display font-bold text-lg text-navy-800">
                {editingCollection ? 'Edit Collection' : 'New Collection'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                  setEditingCollection(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-xl p-1"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={editingCollection ? handleUpdate : handleCreate}
              className="p-5 space-y-4"
              noValidate
            >
              <div>
                <Label>Collection Name *</Label>
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                  }}
                  className={`input ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="e.g. Spray Nozzles"
                />
                <FieldError msg={errors.name} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="input resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Cover Image</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-navy-50 file:text-navy-700 file:font-semibold hover:file:bg-navy-100"
                />
                {(preview || currentImage) && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border-2 border-navy-100">
                    <img
                      src={preview || currentImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setPreview(null)
                        setCurrentImage(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading
                    ? editingCollection
                      ? 'Saving...'
                      : 'Creating...'
                    : editingCollection
                      ? 'Save Changes'
                      : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                    setEditingCollection(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <EmptyState icon="🗂️" msg="No collections yet. Create your first collection!" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div
              key={col._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="h-36 bg-navy-100 relative overflow-hidden">
                {col.image ? (
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🌿
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-14">
                  <h3 className="font-display font-bold text-white text-base">
                    {col.name}
                  </h3>
                  {col.description && (
                    <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
                      {col.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openEditForm(col)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-navy-700 p-1.5 rounded-lg shadow-md transition-colors"
                  title="Edit collection"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                {col.isSystem && (
                  <div className="absolute top-2 left-2 bg-champagne-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    🔒 Protected
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-400 font-mono">
                  ID: {col._id.slice(-6)}
                </span>
                {col.isSystem ? (
                  <span className="text-xs text-gray-400 italic">
                    System collection — cannot remove
                  </span>
                ) : (
                  <button
                    onClick={() => handleDelete(col._id, col.name)}
                    disabled={deleting === col._id}
                    className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    {deleting === col._id ? (
                      <>
                        <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />{' '}
                        Removing...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="w-3.5 h-3.5" /> Remove
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
)

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
)

/* ─── ORDERS ─── */
function OrdersView() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const [selOrder, setSelOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const params = { page, limit: 20 }
    if (filter) params.status = filter
    Promise.resolve()
      .then(() => { if (!cancelled) setLoading(true) })
      .then(() => api.get('/admin/orders', { params }))
      .then((r) => {
        if (!cancelled) {
          setOrders(r.data.orders)
          setTotal(r.data.total)
          setPages(r.data.pages)
          setLoading(false)
        }
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [page, filter, refreshKey])

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/orders/${id}/status`, { status })
    toast.success('Status updated')
    setRefreshKey((k) => k + 1)
    if (selOrder?._id === id) setSelOrder((o) => ({ ...o, status }))
  }

  return (
    <div>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 mb-5 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">
          Orders ({total})
        </h1>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setPage(1)
          }}
          className="input w-auto text-sm"
        >
          <option value="">All Status</option>
          {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Order detail modal */}
      {selOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-navy-800">
                  {selOrder.orderId}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {new Date(selOrder.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setSelOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-xl p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-navy-800 mb-2 text-sm">Customer</h3>
                  <p className="font-bold text-sm">{selOrder.customer?.name}</p>
                  <p className="text-xs text-gray-500">{selOrder.customer?.phone}</p>
                  <p className="text-xs text-gray-500">{selOrder.customer?.address}</p>
                  <p className="text-xs text-gray-500">
                    {selOrder.customer?.city}, {selOrder.customer?.state} -{' '}
                    {selOrder.customer?.pincode}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-navy-800 mb-2 text-sm">Order Info</h3>
                  <p className="text-xs sm:text-sm">
                    <span className="text-gray-400">Payment:</span>{' '}
                    <span className="font-semibold">{selOrder.paymentMode}</span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-gray-400">GST:</span>{' '}
                    <span className="font-semibold">
                      ₹{selOrder.gstTotal?.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm">
                    <span className="text-gray-400">Total:</span>{' '}
                    <span className="font-bold text-navy-700">
                      ₹{selOrder.total?.toFixed(2)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 font-semibold mb-1">
                      UPDATE STATUS
                    </p>
                    <select
                      value={selOrder.status}
                      onChange={(e) => updateStatus(selOrder._id, e.target.value)}
                      className="input text-xs sm:text-sm"
                    >
                      {['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl overflow-hidden min-w-[520px]">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        '#',
                        'Image',
                        'Item',
                        'Code',
                        'HSN',
                        'Qty',
                        'Unit',
                        'Price',
                        'Amount',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-2 sm:px-3 py-2 text-left text-xs text-gray-500 font-semibold border-b border-gray-200"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selOrder.items?.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 sm:px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-base">
                                📦
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          {item.place && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.place}</p>
                          )}
                        </td>
                        <td className="px-2 sm:px-3 py-2 font-mono text-xs">
                          {item.itemCode}
                        </td>
                        <td className="px-2 sm:px-3 py-2 font-mono text-xs">
                          {item.hsnCode}
                        </td>
                        <td className="px-2 sm:px-3 py-2">{item.quantity}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <span className="text-xs bg-navy-50 text-navy-600 font-semibold px-1.5 py-0.5 rounded">
                            PAC
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            (1={item.unitConversionRate || 10} NOS)
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-2">₹{item.price}</td>
                        <td className="px-2 sm:px-3 py-2 font-semibold">
                          ₹{item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 sm:px-3 py-2 text-right text-xs text-gray-500"
                      >
                        Subtotal
                      </td>
                      <td colSpan={2} className="px-2 sm:px-3 py-2 text-sm">
                        ₹{selOrder.subtotal?.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 sm:px-3 py-2 text-right text-xs text-gray-500"
                      >
                        GST
                      </td>
                      <td colSpan={2} className="px-2 sm:px-3 py-2 text-sm">
                        ₹{selOrder.gstTotal?.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 sm:px-3 py-2 font-bold text-right text-xs sm:text-sm"
                      >
                        Total
                      </td>
                      <td
                        colSpan={2}
                        className="px-2 sm:px-3 py-2 font-bold text-navy-700"
                      >
                        ₹{selOrder.total?.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-2 sm:gap-3">
                {selOrder.invoiceUrl ? (
                  <a
                    href={selOrder.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-champagne-500 hover:bg-champagne-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm"
                  >
                    📄 Download Invoice PDF
                  </a>
                ) : (
                  <span className="flex-1 flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-bold px-4 py-2.5 rounded-xl text-sm cursor-not-allowed">
                    📄 Invoice Not Available
                  </span>
                )}
                <a
                  href={`https://wa.me/${selOrder.customer?.whatsapp || selOrder.customer?.phone}?text=${encodeURIComponent('Your order ' + selOrder.orderId + ' status: ' + selOrder.status)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 whatsapp-btn"
                >
                  WhatsApp Customer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[550px]">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Phone', 'Total', 'Status', 'Date', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelOrder(o)}
                  >
                    <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-navy-600">
                      {o.orderId}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-gray-700">
                      {o.customer?.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-500">
                      {o.customer?.phone}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 font-semibold">
                      ₹{o.total?.toFixed(2)}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <button className="text-xs bg-navy-50 text-navy-700 hover:bg-navy-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <EmptyState icon="📋" msg="No orders yet." />}
          </div>
        )}
        {pages > 1 && (
          <div className="flex justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 border-t border-gray-100 flex-wrap">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold ${page === i + 1 ? 'bg-navy-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── WHATSAPP SETUP ─── */
function WhatsAppSetupView() {
  const [status, setStatus] = useState(null)
  const [qrImage, setQrImage] = useState(null)
  const [polling, setPolling] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [testing, setTesting] = useState(false)

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/whatsapp/status')
      setStatus(data)
      if (data.isReady) {
        setQrImage(null)
        setPolling(false)
        return
      }
      if (data.error && !data.hasQR && !data.isInitializing) {
        setPolling(false)
        return
      }
      if (data.hasQR) {
        const qrRes = await api.get('/whatsapp/qr')
        if (qrRes.data.qr) setQrImage(qrRes.data.qr)
      }
    } catch {
      setPolling(false)
    }
  }

  const handleInit = async () => {
    setInitializing(true)
    try {
      await api.post('/whatsapp/init')
      toast.success('WhatsApp initialization started')
      setPolling(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize WhatsApp')
    } finally {
      setInitializing(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('This will disconnect WhatsApp and require a new QR scan. Continue?'))
      return
    try {
      await api.post('/whatsapp/reset')
      setStatus(null)
      setQrImage(null)
      toast.success('Session cleared — click Initialize to get a new QR code')
      setPolling(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset session')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const { data } = await api.post('/whatsapp/test')
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching with polling */
  useEffect(() => {
    fetchStatus()
    if (!polling) return
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [polling])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 mb-2">
        WhatsApp Auto-Send
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Scan the QR code once to enable automatic order notifications — no clicks needed
        ever again.
      </p>

      {/* Status card */}
      <div
        className={`rounded-2xl p-5 mb-6 border-2 flex items-start gap-4 ${
          status?.isReady
            ? 'bg-green-50 border-green-300'
            : status?.error
              ? 'bg-amber-50 border-amber-300'
              : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 mt-0.5 ${
            status?.isReady
              ? 'bg-green-200'
              : status?.error
                ? 'bg-amber-200'
                : 'bg-blue-200'
          }`}
        >
          {status?.isReady ? '🟢' : status?.error ? '⚙️' : '⏳'}
        </div>
        <div className="flex-1">
          <p
            className={`font-bold text-base ${status?.isReady ? 'text-green-800' : status?.error ? 'text-amber-800' : 'text-blue-800'}`}
          >
            {status?.isReady
              ? '✅ WhatsApp Connected — Auto-send is ACTIVE'
              : status?.hasQR
                ? '📱 Scan QR Code Below to Connect'
                : status?.error
                  ? '⚙️ WhatsApp Setup Required'
                  : '⏳ Initializing WhatsApp...'}
          </p>
          {status?.error && (
            <div className="mt-2 space-y-1">
              <p className="text-amber-700 text-sm">{status.error}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInit}
                  disabled={initializing}
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-semibold text-sm hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {initializing ? 'Retrying...' : 'Retry Connection'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-red-100 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-200 transition"
                >
                  Reset Session
                </button>
              </div>
            </div>
          )}
          {status?.isReady && (
            <div className="mt-2 space-y-2">
              <p className="text-green-600 text-sm">
                Messages and PDFs are sent automatically when a customer places an order.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold text-xs hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {testing ? 'Sending...' : '📨 Send Test Message'}
                </button>
                <span className="text-xs text-gray-400">Sends a message to your registered WhatsApp number to verify delivery.</span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-red-500 underline"
              >
                Disconnect / Reset Session
              </button>
            </div>
          )}
          {!status?.isReady && !status?.error && status?.hasQR && (
            <p className="text-blue-700 text-sm mt-1">
              Open WhatsApp → More Options → Linked Devices → Link a Device → Scan QR
            </p>
          )}
        </div>
      </div>

      {/* QR Code */}
      {!status?.isReady && (
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-center max-w-md">
          {qrImage ? (
            <>
              <p className="font-display font-bold text-navy-800 text-lg mb-4">
                Scan with WhatsApp
              </p>
              <div className="border-4 border-navy-100 rounded-2xl overflow-hidden inline-block mb-4 p-2">
                <img
                  src={qrImage}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72"
                />
              </div>
              <p className="text-gray-500 text-sm">
                QR refreshes automatically. Once scanned, this page will show Connected.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-ping inline-block"></span>
                Auto-refreshing...
              </div>
            </>
          ) : (
            <div className="py-10">
              {status?.isInitializing ? (
                <>
                  <div className="w-12 h-12 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Initializing WhatsApp...</p>
                  <p className="text-gray-400 text-xs mt-2">
                    Waiting for QR code. This takes ~30 seconds.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-4 text-xs text-gray-400 hover:text-red-500 underline"
                  >
                    Stuck? Reset Session
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-gray-600 font-medium mb-2">
                    WhatsApp is not initialized
                  </p>
                  <p className="text-gray-400 text-xs mb-4">
                    Click below to start the WhatsApp service and generate a QR code.
                  </p>
                  <button
                    onClick={handleInit}
                    disabled={initializing}
                    className="px-6 py-2.5 bg-navy-600 text-white rounded-xl font-semibold text-sm hover:bg-navy-700 disabled:opacity-50 transition"
                  >
                    {initializing ? 'Starting...' : 'Initialize WhatsApp'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="mt-6 bg-navy-50 rounded-2xl p-5 max-w-2xl">
        <h3 className="font-display font-bold text-navy-800 mb-4">How Auto-Send Works</h3>
        <div className="space-y-3">
          {[
            { step: '1', text: 'Admin scans QR code above once with their phone' },
            {
              step: '2',
              text: 'WhatsApp stays connected on the server (persists across restarts)',
            },
            {
              step: '3',
              text: 'Customer places an order → server auto-sends message + PDF to admin',
            },
            {
              step: '4',
              text: "Server also auto-sends order confirmation + PDF to customer's WhatsApp",
            },
            { step: '5', text: 'Zero manual steps. Zero clicking. Fully automatic.' },
          ].map((s) => (
            <div key={s.step} className="flex items-start gap-3">
              <span className="w-7 h-7 bg-champagne-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {s.step}
              </span>
              <p className="text-sm text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const Label = ({ children }) => (
  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">
    {children}
  </label>
)

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null

const FField = ({ label, value, onChange, type = 'text', placeholder, full, error }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <Label>{label}</Label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onWheel={type === 'number' ? (e) => e.target.blur() : undefined}
      className={`input ${error ? 'border-red-400' : ''}`}
      placeholder={placeholder}
    />
    <FieldError msg={error} />
  </div>
)

const StatusBadge = ({ status }) => {
  const c = {
    Pending: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700',
    Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`badge ${c[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
  )
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16 sm:py-20">
    <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
  </div>
)

const EmptyState = ({ icon, msg }) => (
  <div className="text-center py-12 sm:py-16 text-gray-400">
    <div className="text-4xl mb-3">{icon}</div>
    <p className="text-sm">{msg}</p>
  </div>
)

/* ─── SETTINGS ─── */
function SettingsView() {
  const [profile, setProfile] = useState({ name: '', username: '', whatsappNumber: '' })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFetching, setProfileFetching] = useState(true)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/profile')
      .then((r) => setProfile(r.data))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setProfileFetching(false))
  }, [])

  const handleProfileSave = async (e) => {
    e.preventDefault()
    const errors = validateFields(updateProfileSchema, profile)
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }
    setProfileErrors({})
    setProfileLoading(true)
    try {
      const { data } = await api.patch('/admin/profile', profile)
      setProfile(data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    const errors = validateFields(changePasswordSchema, pwForm)
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors)
      toast.error(Object.values(errors)[0])
      return
    }
    setPwErrors({})
    setPwLoading(true)
    try {
      await api.patch('/admin/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  if (profileFetching) return <LoadingSpinner />

  return (
    <div className="max-w-xl space-y-8">
      {/* Profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-display font-bold text-navy-800 text-lg mb-5">Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-4" noValidate>
          {[
            { key: 'name', label: 'Display Name', ph: 'Admin', type: 'text' },
            { key: 'username', label: 'Username', ph: 'admin', type: 'text' },
            { key: 'whatsappNumber', label: 'WhatsApp Number', ph: '919876543210', type: 'text' },
          ].map(({ key, label, ph, type }) => (
            <div key={key}>
              <Label>{label}</Label>
              <input
                type={type}
                value={profile[key]}
                onChange={(e) => {
                  setProfile((p) => ({ ...p, [key]: e.target.value }))
                  if (profileErrors[key]) setProfileErrors((p) => ({ ...p, [key]: undefined }))
                }}
                className={`input ${profileErrors[key] ? 'border-red-400' : ''}`}
                placeholder={ph}
              />
              <FieldError msg={profileErrors[key]} />
            </div>
          ))}
          <button
            type="submit"
            disabled={profileLoading}
            className="btn-primary w-full sm:w-auto px-8"
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-display font-bold text-navy-800 text-lg mb-1">Change Password</h2>
        <p className="text-sm text-gray-500 mb-5">Choose a strong password of at least 6 characters.</p>
        <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
          {[
            { key: 'currentPassword', label: 'Current Password', ph: '••••••••' },
            { key: 'newPassword', label: 'New Password', ph: '••••••••' },
            { key: 'confirmPassword', label: 'Confirm New Password', ph: '••••••••' },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <Label>{label}</Label>
              <input
                type="password"
                value={pwForm[key]}
                onChange={(e) => {
                  setPwForm((p) => ({ ...p, [key]: e.target.value }))
                  if (pwErrors[key]) setPwErrors((p) => ({ ...p, [key]: undefined }))
                }}
                className={`input ${pwErrors[key] ? 'border-red-400' : ''}`}
                placeholder={ph}
                autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'}
              />
              <FieldError msg={pwErrors[key]} />
            </div>
          ))}
          <button
            type="submit"
            disabled={pwLoading}
            className="btn-primary w-full sm:w-auto px-8"
          >
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
