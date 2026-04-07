import { useState, useEffect, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import api from "@/lib/api-client";
import { loginSchema, adminSetupSchema, productSchema, collectionSchema, validateFields } from "@/lib/validators";
import { STORAGE_KEYS } from "@/constants";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [token,    setToken]    = useState(() => localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN));
  const [view,     setView]     = useState('dashboard');
  const [sideOpen, setSideOpen] = useState(false);

  const logout = () => { localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN); setToken(null); };
  if (!token) return <AdminLogin onLogin={setToken} />;

  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',      icon: '📊' },
    { id: 'products',    label: 'Products',        icon: '📦' },
    { id: 'collections', label: 'Collections',     icon: '🗂️' },
    { id: 'orders',      label: 'Orders',          icon: '📋' },
    { id: 'whatsapp',    label: 'WhatsApp Setup',  icon: '📱' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sideOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSideOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-60 sm:w-64 bg-navy-800 text-white flex flex-col z-40
        transition-transform duration-300 lg:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 sm:p-6 border-b border-navy-700">
          <img src="/logo.png" alt="Adiyogi" className="h-9 sm:h-10 w-auto"  />
          <p className="text-navy-300 text-xs mt-2">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 sm:p-4 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setView(item.id); setSideOpen(false); }}
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all ${
                view === item.id ? 'bg-champagne-500 text-white' : 'text-navy-200 hover:bg-navy-700'
              }`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 sm:p-4 border-t border-navy-700 space-y-1">
          <button onClick={logout} className="w-full text-left px-3 sm:px-4 py-2.5 rounded-xl text-sm text-navy-300 hover:bg-navy-700 transition-colors">
            🚪 Logout
          </button>
          <a href="/" className="block px-3 sm:px-4 py-2.5 rounded-xl text-sm text-navy-300 hover:bg-navy-700 transition-colors">
            🏠 View Store
          </a>
        </div>
      </aside>

      <main className="lg:ml-64 flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
          <button onClick={() => setSideOpen(true)} className="text-gray-600 hover:text-navy-700 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display font-bold text-navy-800 text-lg capitalize">{view}</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {view === 'dashboard'   && <DashboardView />}
          {view === 'products'    && <ProductsView />}
          {view === 'collections' && <CollectionsView />}
          {view === 'orders'      && <OrdersView />}
          {view === 'whatsapp'    && <WhatsAppSetupView />}
        </div>
      </main>
    </div>
  );
}

/* ─── LOGIN ─── */
function AdminLogin({ onLogin }) {
  const [form,        setForm]        = useState({ username: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [showSetup,   setShowSetup]   = useState(false);
  const [setupForm,   setSetupForm]   = useState({ username: '', password: '', name: 'Admin', whatsappNumber: '' });
  const [setupErrors, setSetupErrors] = useState({});
  const [loading,     setLoading]     = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    const fieldErrors = validateFields(loginSchema, form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setErrors({});
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', form);
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
      onLogin(data.token);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  const handleSetup = async e => {
    e.preventDefault();
    const fieldErrors = validateFields(adminSetupSchema, setupForm);
    if (Object.keys(fieldErrors).length > 0) { setSetupErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setSetupErrors({});
    setLoading(true);
    try {
      await api.post('/admin/setup', setupForm);
      toast.success('Admin created! Please login.'); setShowSetup(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Setup failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden">
        <div className="bg-navy-700 p-6 sm:p-8 text-center">
          <img src="/logo.png" alt="Adiyogi" className="h-12 sm:h-16 mx-auto mb-3"  />
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Admin Panel</h1>
          <p className="text-navy-200 text-xs sm:text-sm">Adiyogi International</p>
        </div>
        <div className="p-5 sm:p-8">
          {!showSetup ? (
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div>
                <Label>Username</Label>
                <input value={form.username} onChange={e => { setForm(p => ({...p, username: e.target.value})); if (errors.username) setErrors(p => ({...p, username: undefined})); }} className={`input ${errors.username ? 'border-red-400' : ''}`} placeholder="admin" />
                <FieldError msg={errors.username} />
              </div>
              <div>
                <Label>Password</Label>
                <input type="password" value={form.password} onChange={e => { setForm(p => ({...p, password: e.target.value})); if (errors.password) setErrors(p => ({...p, password: undefined})); }} className={`input ${errors.password ? 'border-red-400' : ''}`} placeholder="••••••••" />
                <FieldError msg={errors.password} />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Logging in...' : 'Login'}</button>
              <p className="text-center text-xs text-gray-400">
                First time?{' '}
                <button type="button" onClick={() => setShowSetup(true)} className="text-navy-600 font-semibold hover:underline">Setup Admin</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4" noValidate>
              <h2 className="font-display font-bold text-navy-800 text-lg sm:text-xl">Create Admin Account</h2>
              {[
                { key:'name',           label:'Display Name',                     ph:'Admin' },
                { key:'username',       label:'Username',                          ph:'admin' },
                { key:'password',       label:'Password',                          ph:'••••••••', type:'password' },
                { key:'whatsappNumber', label:'WhatsApp (country code + number)',  ph:'919876543210' },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input type={f.type||'text'} value={setupForm[f.key]}
                    onChange={e => { setSetupForm(p => ({...p, [f.key]: e.target.value})); if (setupErrors[f.key]) setSetupErrors(p => ({...p, [f.key]: undefined})); }}
                    className={`input ${setupErrors[f.key] ? 'border-red-400' : ''}`} placeholder={f.ph} />
                  <FieldError msg={setupErrors[f.key]} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Creating...' : 'Create Admin'}</button>
              <button type="button" onClick={() => setShowSetup(false)} className="w-full text-center text-sm text-gray-500 hover:text-navy-600">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function DashboardView() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => {}); }, []);
  if (!stats) return <LoadingSpinner />;

  const cards = [
    { label:'Total Orders',    value: stats.totalOrders,                                        icon:'📋', bg:'bg-blue-50   text-blue-700'   },
    { label:'Pending',         value: stats.pendingOrders,                                       icon:'⏳', bg:'bg-yellow-50 text-yellow-700' },
    { label:'Confirmed',       value: stats.confirmedOrders,                                     icon:'✅', bg:'bg-green-50  text-green-700'  },
    { label:'Total Revenue',   value:`₹${(stats.totalRevenue||0).toLocaleString('en-IN')}`,     icon:'💰', bg:'bg-navy-50   text-navy-700'   },
    { label:'Active Products', value: stats.totalProducts,                                       icon:'📦', bg:'bg-purple-50 text-purple-700' },
    { label:'Delivered',       value: stats.deliveredOrders,                                     icon:'🚚', bg:'bg-teal-50   text-teal-700'   },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 mb-5 sm:mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {cards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl sm:rounded-2xl p-4 sm:p-6`}>
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{c.icon}</div>
            <p className="text-xl sm:text-2xl font-bold font-display">{c.value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-70">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <h2 className="font-display font-semibold text-base sm:text-lg text-navy-800">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[500px]">
            <thead className="bg-gray-50">
              <tr>{['Order ID','Customer','Amount','Status','Date'].map(h=>(
                <th key={h} className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders?.map(o=>(
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-navy-600">{o.orderId}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-700">{o.customer?.name}</td>
                  <td className="px-3 sm:px-4 py-2.5 font-semibold">₹{o.total?.toFixed(2)}</td>
                  <td className="px-3 sm:px-4 py-2.5"><StatusBadge status={o.status}/></td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── UNIT EDIT MODAL ─── */
function UnitEditModal({ baseUnit, secondaryUnit, conversionRate, onChange, onClose }) {
  const [base,      setBase]      = useState(baseUnit      || 'PAC');
  const [secondary, setSecondary] = useState(secondaryUnit || 'NOS');
  const [mode,      setMode]      = useState([10, 20].includes(conversionRate) ? 'preset' : 'custom');
  const [preset,    setPreset]    = useState([10, 20].includes(conversionRate) ? conversionRate : 10);
  const [custom,    setCustom]    = useState(![10, 20].includes(conversionRate) ? String(conversionRate) : '');

  const showConversion = secondary === 'NOS';
  const finalRate = showConversion ? (mode === 'preset' ? preset : parseInt(custom) || 1) : 1;

  const BASE_UNITS      = ['PAC', 'NOS'];
  const SECONDARY_UNITS = ['NOS', 'None'];

  const summaryText = secondary === 'None'
    ? `Unit: ${base} only`
    : `1 ${base} = ${finalRate} ${secondary}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-navy-800 text-lg">Edit Unit Configuration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
        </div>
        <div className="p-5 space-y-5">

          {/* Base Unit selector */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Base Unit</p>
            <div className="flex gap-2">
              {BASE_UNITS.map(u => (
                <button key={u} type="button"
                  onClick={() => setBase(u)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    base === u
                      ? 'bg-navy-700 text-white border-navy-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
                  }`}>
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {base === 'PAC' ? 'Packs — the main unit customers order in' : 'Numbers — individual pieces'}
            </p>
          </div>

          {/* Secondary Unit selector */}
          <div>
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Secondary Unit</p>
            <div className="flex gap-2">
              {SECONDARY_UNITS.map(u => (
                <button key={u} type="button"
                  onClick={() => setSecondary(u)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    secondary === u
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}>
                  {u}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {secondary === 'NOS' ? 'Numbers — individual pieces per pack' : 'No secondary unit for this product'}
            </p>
          </div>

          {/* Conversion rate — only when secondary = NOS */}
          {showConversion && (
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                How many {secondary} in 1 {base}?
              </p>
              <div className="flex gap-2 mb-3">
                {[10, 20].map(r => (
                  <button key={r} type="button"
                    onClick={() => { setMode('preset'); setPreset(r); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      mode === 'preset' && preset === r
                        ? 'bg-navy-700 text-white border-navy-700'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
                    }`}>
                    {r} {secondary}
                  </button>
                ))}
                <button type="button"
                  onClick={() => setMode('custom')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    mode === 'custom'
                      ? 'bg-champagne-500 text-white border-champagne-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-champagne-300'
                  }`}>
                  Custom
                </button>
              </div>
              {mode === 'custom' && (
                <div className="flex items-center gap-2 bg-champagne-50 rounded-xl p-3 border border-champagne-200">
                  <span className="text-sm text-gray-600 font-semibold whitespace-nowrap">1 {base} =</span>
                  <input type="number" min="1" max="9999" value={custom}
                    onChange={e => setCustom(e.target.value)}
                    placeholder="e.g. 50"
                    className="input flex-1 text-center font-bold text-navy-700 py-2"
                    autoFocus />
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

          <button type="button"
            onClick={() => { onChange({ baseUnit: base, secondaryUnit: secondary, conversionRate: finalRate }); onClose(); }}
            className="w-full btn-primary"
            disabled={showConversion && mode === 'custom' && (!custom || parseInt(custom) < 1)}>
            Save Unit Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── INLINE CREATE COLLECTION MODAL ─── */
function CreateCollectionModal({ onCreated, onClose }) {
  const [name,    setName]    = useState('');
  const [desc,    setDesc]    = useState('');
  const [image,   setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreate = async () => {
    const fieldErrors = validateFields(collectionSchema, { name, description: desc });
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', desc);
      if (image) fd.append('image', image);
      const { data } = await api.post('/collections', fd);
      toast.success('Collection created!');
      onCreated(data);
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-display font-bold text-navy-800 text-lg">Create New Collection</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <Label>Collection Name *</Label>
            <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({...p, name: undefined})); }} className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Spray Nozzles" />
            <FieldError msg={errors.name} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input resize-none" rows={2} placeholder="Optional description" />
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
                <img src={preview} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-2">
                  <span className="text-white text-xs font-semibold">{name || 'Collection'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setImage(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >✕</button>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" disabled={loading} onClick={handleCreate} className="flex-1 btn-primary">
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PRODUCTS ─── */
function ProductsView() {
  const [products,           setProducts]           = useState([]);
  const [collections,        setCollections]        = useState([]);
  const [showForm,           setShowForm]           = useState(false);
  const [editing,            setEditing]            = useState(null);
  const [images,             setImages]             = useState([]);
  const [imagePreviews,      setImagePreviews]      = useState([]);
  const [existingImages,     setExistingImages]     = useState([]); // [{url, fileId}] from CDN
  const [removedFileIds,     setRemovedFileIds]     = useState([]); // fileIds queued for deletion
  const [loading,            setLoading]            = useState(false);
  const [showUnitModal,      setShowUnitModal]      = useState(false);
  const [showCreateColl,     setShowCreateColl]     = useState(false);
  const [errors,             setErrors]             = useState({});
  const [cropModalOpen,      setCropModalOpen]      = useState(false);
  const [cropImageSrc,       setCropImageSrc]       = useState(null);
  const [cropIndex,          setCropIndex]          = useState(null);
  const [crop,               setCrop]               = useState();
  const [completedCrop,     setCompletedCrop]      = useState();
  const imgRef = useRef(null);

  const EMPTY_FORM = {
    name: '', itemCode: '', hsnCode: '', salesPrice: '', purchasePrice: '',
    stock: '', baseUnit: 'PAC', secondaryUnit: 'NOS', unitConversionRate: 10,
    gstRate: 5,
    collections: [], place: '', description: '',
  };
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchData = () => {
    api.get('/products?limit=200').then(r => setProducts(r.data.products));
    api.get('/collections').then(r => setCollections(r.data));
  };
  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImages([]); setImagePreviews([]); setExistingImages([]); setRemovedFileIds([]); setEditing(null); setErrors({});
  };

  function centerAspectCrop(mediaWidth, mediaHeight) {
    return centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, mediaWidth, mediaHeight),
      mediaWidth,
      mediaHeight
    );
  }

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result);
        setCropIndex(null);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const onImageLoad = e => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    const maxSize = 800;
    const size = Math.min(maxSize, Math.max(crop.width * scaleX, crop.height * scaleY));
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      size,
      size
    );
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg", 0.85);
    });
  };

  const applyCrop = async () => {
    if (!cropImageSrc || !completedCrop || !imgRef.current) return;
    const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
    if (cropIndex !== null) {
      const newImages = [...images];
      newImages[cropIndex] = croppedFile;
      setImages(newImages);
      const newPreviews = [...imagePreviews];
      newPreviews[cropIndex] = URL.createObjectURL(croppedFile);
      setImagePreviews(newPreviews);
    } else {
      setImages(prev => [...prev, croppedFile]);
      setImagePreviews(prev => [...prev, URL.createObjectURL(croppedFile)]);
    }
    setCropModalOpen(false);
    setCropImageSrc(null);
    setCropIndex(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const openEdit = p => {
    setEditing(p._id);
    setForm({
      name: p.name, itemCode: p.itemCode, hsnCode: p.hsnCode || '',
      salesPrice: p.salesPrice, purchasePrice: p.purchasePrice || '',
      stock: p.stock,
      baseUnit: p.baseUnit || 'PAC',
      secondaryUnit: p.secondaryUnit || 'NOS',
      unitConversionRate: p.unitConversionRate || 10,
      gstRate: p.gstRate || 5,
      collections: (p.collections || []).map(c => c._id || c),
      place: p.place || '',
      description: p.description || '',
    });
    // Build existingImages from parallel arrays; fall back gracefully if fileIds are missing
    const urls    = p.images        ?? [];
    const fileIds = p.imageFileIds  ?? [];
    setExistingImages(urls.map((url, i) => ({ url, fileId: fileIds[i] ?? null })));
    setImagePreviews([]);
    setImages([]);
    setRemovedFileIds([]);
    setShowForm(true);
  };

  const handleCollectionCreated = newCol => {
    setCollections(prev => [...prev, newCol]);
    setForm(p => ({ ...p, collections: [...p.collections, newCol._id] }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const fieldErrors = validateFields(productSchema, form);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      // Append all scalar fields
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'collections') return; // handled separately
        fd.append(k, v);
      });
      // Send collections as JSON string
      fd.append('collections', JSON.stringify(form.collections));
      // Tell the backend which existing CDN images to delete
      if (editing && removedFileIds.length) {
        fd.append('removeImageIds', JSON.stringify(removedFileIds));
      }
      images.forEach(img => fd.append('images', img));
      if (editing) await api.put(`/products/${editing}`, fd);
      else         await api.post('/products', fd);
      toast.success(`Product ${editing ? 'updated' : 'created'}!`);
      resetForm(); setShowForm(false); fetchData();
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Remove this product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Product removed'); fetchData();
  };

  return (
    <div>
      {/* Unit modal */}
      {showUnitModal && (
        <UnitEditModal
          baseUnit={form.baseUnit}
          secondaryUnit={form.secondaryUnit}
          conversionRate={form.unitConversionRate}
          onChange={({ baseUnit, secondaryUnit, conversionRate }) =>
            setForm(p => ({ ...p, baseUnit, secondaryUnit, unitConversionRate: conversionRate }))
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

      <div className="flex justify-between items-center mb-5 sm:mb-8 gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">Products</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary whitespace-nowrap">+ Add Product</button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg sm:text-xl text-navy-800">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" noValidate>
              {/* Product Name */}
              <FField label="Product Name *" value={form.name} onChange={v => { setForm(p => ({...p, name: v})); if (errors.name) setErrors(p => ({...p, name: undefined})); }} placeholder="Product name" full error={errors.name} />

              {/* Item Code */}
              <FField label="Item Code *" value={form.itemCode} onChange={v => { setForm(p => ({...p, itemCode: v})); if (errors.itemCode) setErrors(p => ({...p, itemCode: undefined})); }} placeholder="110-SPACS" error={errors.itemCode} />

              {/* HSN Code */}
              <FField label="HSN Code" value={form.hsnCode} onChange={v => { setForm(p => ({...p, hsnCode: v})); if (errors.hsnCode) setErrors(p => ({...p, hsnCode: undefined})); }} placeholder="84249000" error={errors.hsnCode} />

              {/* Sales Price (was Price) */}
              <FField label="Sales Price (₹) *" type="number" value={form.salesPrice} onChange={v => { setForm(p => ({...p, salesPrice: v})); if (errors.salesPrice) setErrors(p => ({...p, salesPrice: undefined})); }} placeholder="480" error={errors.salesPrice} />

              {/* Purchase Price (was Original Price) */}
              <FField label="Purchase Price (₹)" type="number" value={form.purchasePrice} onChange={v => { setForm(p => ({...p, purchasePrice: v})); if (errors.purchasePrice) setErrors(p => ({...p, purchasePrice: undefined})); }} placeholder="400" error={errors.purchasePrice} />

              {/* Stock */}
              <FField label="Stock Quantity" type="number" value={form.stock} onChange={v => { setForm(p => ({...p, stock: v})); if (errors.stock) setErrors(p => ({...p, stock: undefined})); }} placeholder="100" error={errors.stock} />

              {/* GST Rate */}
              <div>
                <Label>GST Rate (%)</Label>
                <select
                  value={form.gstRate}
                  onChange={e => setForm(p => ({...p, gstRate: Number(e.target.value)}))}
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
                    <span className="bg-navy-100 text-navy-700 text-xs font-bold px-2 py-0.5 rounded">{form.baseUnit}</span>
                    {form.secondaryUnit !== 'None' && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs text-gray-500">
                          1 {form.baseUnit} = {form.unitConversionRate} {form.secondaryUnit}
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
                  <button type="button" onClick={() => setShowCreateColl(true)}
                    className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors">
                    + New Collection
                  </button>
                </div>
                {collections.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No collections yet. Create one first.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    {collections.map(c => {
                      const checked = form.collections.includes(c._id);
                      return (
                        <label key={c._id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all ${
                            checked ? 'bg-navy-700 text-white' : 'bg-white text-gray-700 hover:bg-navy-50 border border-gray-200'
                          }`}>
                          <input type="checkbox" className="hidden"
                            checked={checked}
                            onChange={e => {
                              setForm(p => ({
                                ...p,
                                collections: e.target.checked
                                  ? [...p.collections, c._id]
                                  : p.collections.filter(id => id !== c._id),
                              }));
                            }} />
                          <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-champagne-400 border-champagne-400' : 'border-gray-300'
                          }`}>
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5l-1 1L5 10.5l6-7-1-0.5z"/></svg>}
                          </span>
                          {c.name}
                          {c.isSystem && <span className="ml-auto text-champagne-300 text-[9px]">★</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.collections.length > 0 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    ✓ {form.collections.map(id => collections.find(c => c._id === id)?.name).filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Place (was Place / Location) */}
              <FField label="Place" value={form.place} onChange={v => { setForm(p => ({...p, place: v})); if (errors.place) setErrors(p => ({...p, place: undefined})); }} placeholder="KC 12" error={errors.place} />

              {/* Description */}
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  className="input resize-none" rows={3} placeholder="Product description..." />
              </div>

              {/* Product Images with mini preview */}
              <div className="sm:col-span-2">
                <Label>Product Images (max 5)</Label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-xs sm:text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:bg-navy-50 file:text-navy-700 file:font-semibold hover:file:bg-navy-100 file:text-xs sm:file:text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">Max 10MB each.</p>

                {/* Image previews — existing CDN images + newly selected files */}
                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Existing CDN images */}
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-navy-100 shadow-sm group">
                        <img src={img.url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setExistingImages(prev => prev.filter((_, idx) => idx !== i));
                            if (img.fileId) setRemovedFileIds(prev => [...prev, img.fileId]);
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold leading-none opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >×</button>
                        <div className="absolute inset-0 bg-black/10 flex items-end justify-center pb-0.5 pointer-events-none">
                          <span className="text-white text-[9px] font-bold">{i + 1}</span>
                        </div>
                        <div className="absolute top-0 right-0 flex flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              const newImages = images.filter((_, idx) => idx !== i);
                              const newPreviews = imagePreviews.filter((_, idx) => idx !== i);
                              setImages(newImages);
                              setImagePreviews(newPreviews);
                            }}
                            className="w-5 h-5 bg-red-500 text-white rounded-bl-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete image"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setCropImageSrc(reader.result);
                                setCropIndex(i);
                                setCropModalOpen(true);
                              };
                              if (src.startsWith('blob:')) {
                                reader.readAsDataURL(images[i]);
                              } else {
                                const img = new Image();
                                img.crossOrigin = "anonymous";
                                img.onload = () => {
                                  const canvas = document.createElement("canvas");
                                  canvas.width = img.width;
                                  canvas.height = img.height;
                                  const ctx = canvas.getContext("2d");
                                  ctx.drawImage(img, 0, 0);
                                  canvas.toBlob(blob => {
                                    reader.readAsDataURL(blob);
                                  }, "image/jpeg");
                                };
                                img.src = src;
                              }
                            }}
                            className="w-5 h-5 bg-navy-700 text-white rounded-tr-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Re-crop image"
                          >
                            <PencilIcon className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* New file previews */}
                    {imagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-champagne-300 shadow-sm group">
                        <img src={src} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImages(prev => prev.filter((_, idx) => idx !== i));
                            setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold leading-none opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove image"
                        >×</button>
                        <div className="absolute inset-0 bg-black/10 flex items-end justify-center pb-0.5 pointer-events-none">
                          <span className="text-champagne-200 text-[9px] font-bold">NEW</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit buttons */}
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h2 className="font-display font-bold text-lg text-navy-800">Crop Image (1:1)</h2>
              <button onClick={() => { setCropModalOpen(false); setCropImageSrc(null); setCropIndex(null); }} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {cropImageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={1}
                  centerPercent={90}
                >
                  <img
                    ref={imgRef}
                    src={cropImageSrc}
                    onLoad={onImageLoad}
                    alt="Crop"
                    className="max-h-[50vh] w-full object-contain"
                  />
                </ReactCrop>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={applyCrop} className="flex-1 btn-primary">Apply Crop</button>
              <button onClick={() => { setCropModalOpen(false); setCropImageSrc(null); setCropIndex(null); }} className="flex-1 btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>{['Product','Code','Purchase Price','Sales Price','Stock','Collections','Place','Actions'].map(h=>(
                <th key={h} className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-base">📦</div>}
                      </div>
                      <p className="font-medium text-gray-700 line-clamp-1 max-w-[140px] sm:max-w-none">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 font-mono text-xs text-gray-500">{p.itemCode}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500">{p.purchasePrice ? `₹${p.purchasePrice}` : '—'}</td>
                  <td className="px-3 sm:px-4 py-2.5  text-navy-700">₹{p.salesPrice}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-600">{p.stock}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500 text-xs">
                    {p.collections?.length ? p.collections.map(c => c.name).join(', ') : '—'}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 text-gray-500 text-xs">{p.place || '—'}</td>
                  <td className="px-3 sm:px-4 py-2.5">
                    <div className="flex gap-1.5 sm:gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs bg-navy-50 text-navy-700 hover:bg-navy-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <EmptyState icon="📦" msg="No products yet. Add your first product!" />}
        </div>
      </div>
    </div>
  );
}

/* ─── COLLECTIONS ─── */
function CollectionsView() {
  const [collections,  setCollections]  = useState([]);
  const [showForm,     setShowForm]     = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [name,         setName]         = useState('');
  const [desc,         setDesc]         = useState('');
  const [image,        setImage]        = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [deleting,     setDeleting]     = useState(null); // id being deleted

  const fetchCollections = () =>
    api.get('/collections').then(r => setCollections(r.data)).catch(() => {});

  useEffect(() => { fetchCollections(); }, []);

  const resetForm = () => { setName(''); setDesc(''); setImage(null); setPreview(null); setErrors({}); setCurrentImage(null); };

  const openEditForm = (col) => {
    setEditingCollection(col);
    setName(col.name);
    setDesc(col.description || '');
    setImage(null);
    setPreview(null);
    setCurrentImage(col.image || null);
    setErrors({});
    setShowForm(true);
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleCreate = async e => {
    e.preventDefault();
    const fieldErrors = validateFields(collectionSchema, { name, description: desc });
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', desc);
      if (image) fd.append('image', image);
      await api.post('/collections', fd);
      toast.success('Collection created!');
      resetForm(); setShowForm(false); fetchCollections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setLoading(false); }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    if (!editingCollection) return;
    const fieldErrors = validateFields(collectionSchema, { name, description: desc });
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error(Object.values(fieldErrors)[0]); return; }
    setErrors({});
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('description', desc);
      if (image) fd.append('image', image);
      await api.put(`/collections/${editingCollection._id}`, fd);
      toast.success('Collection updated!');
      resetForm(); setShowForm(false); setEditingCollection(null); fetchCollections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, colName) => {
    if (!confirm(`Remove collection "${colName}"? Products in this collection will become uncategorised.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/collections/${id}`);
      toast.success('Collection removed');
      fetchCollections();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5 sm:mb-8 gap-3">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">Collections</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary whitespace-nowrap">+ New Collection</button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-display font-bold text-lg text-navy-800">{editingCollection ? 'Edit Collection' : 'New Collection'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); setEditingCollection(null); }} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
            </div>
            <form onSubmit={editingCollection ? handleUpdate : handleCreate} className="p-5 space-y-4" noValidate>
              <div>
                <Label>Collection Name *</Label>
                <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({...p, name: undefined})); }} className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="e.g. Spray Nozzles" />
                <FieldError msg={errors.name} />
              </div>
              <div>
                <Label>Description</Label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} className="input resize-none" rows={2} placeholder="Optional description" />
              </div>
              <div>
                <Label>Cover Image</Label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-navy-50 file:text-navy-700 file:font-semibold hover:file:bg-navy-100" />
                {(preview || currentImage) && (
                  <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border-2 border-navy-100">
                    <img src={preview || currentImage} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImage(null); setPreview(null); setCurrentImage(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">✕</button>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? (editingCollection ? 'Saving...' : 'Creating...') : (editingCollection ? 'Save Changes' : 'Create')}</button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); setEditingCollection(null); }} className="flex-1 btn-secondary">Cancel</button>
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
          {collections.map(col => (
            <div key={col._id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-36 bg-navy-100 relative overflow-hidden">
                {col.image ? (
                  <img src={col.image} alt={col.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-14">
                  <h3 className="font-display font-bold text-white text-base">{col.name}</h3>
                  {col.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{col.description}</p>}
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
                <span className="text-xs text-gray-400 font-mono">ID: {col._id.slice(-6)}</span>
                {col.isSystem ? (
                  <span className="text-xs text-gray-400 italic">System collection — cannot remove</span>
                ) : (
                  <button
                    onClick={() => handleDelete(col._id, col.name)}
                    disabled={deleting === col._id}
                    className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                  >
                    {deleting === col._id ? (
                      <><span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" /> Removing...</>
                    ) : (
                      <><TrashIcon className="w-3.5 h-3.5" /> Remove</>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

/* ─── ORDERS ─── */
function OrdersView() {
  const [orders,   setOrders]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [filter,   setFilter]   = useState('');
  const [selOrder, setSelOrder] = useState(null);
  const [loading,  setLoading]  = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (filter) params.status = filter;
    api.get('/admin/orders', { params }).then(r => {
      setOrders(r.data.orders); setTotal(r.data.total); setPages(r.data.pages);
    }).finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- data fetching pattern
  useEffect(() => { fetchOrders(); }, [page, filter]);

  const updateStatus = async (id, status) => {
    await api.patch(`/admin/orders/${id}/status`, { status });
    toast.success('Status updated'); fetchOrders();
    if (selOrder?._id === id) setSelOrder(o => ({...o, status}));
  };

  return (
    <div>
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 mb-5 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800">Orders ({total})</h1>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="input w-auto text-sm">
          <option value="">All Status</option>
          {['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Order detail modal */}
      {selOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-navy-800">{selOrder.orderId}</h2>
                <p className="text-gray-400 text-xs sm:text-sm">{new Date(selOrder.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setSelOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
            </div>
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-navy-800 mb-2 text-sm">Customer</h3>
                  <p className="font-bold text-sm">{selOrder.customer?.name}</p>
                  <p className="text-xs text-gray-500">{selOrder.customer?.phone}</p>
                  <p className="text-xs text-gray-500">{selOrder.customer?.address}</p>
                  <p className="text-xs text-gray-500">{selOrder.customer?.city}, {selOrder.customer?.state} - {selOrder.customer?.pincode}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                  <h3 className="font-semibold text-navy-800 mb-2 text-sm">Order Info</h3>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">Payment:</span> <span className="font-semibold">{selOrder.paymentMode}</span></p>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">GST:</span> <span className="font-semibold">₹{selOrder.gstTotal?.toFixed(2)}</span></p>
                  <p className="text-xs sm:text-sm"><span className="text-gray-400">Total:</span> <span className="font-bold text-navy-700">₹{selOrder.total?.toFixed(2)}</span></p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 font-semibold mb-1">UPDATE STATUS</p>
                    <select value={selOrder.status} onChange={e => updateStatus(selOrder._id, e.target.value)} className="input text-xs sm:text-sm">
                      {['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl overflow-hidden min-w-[520px]">
                  <thead className="bg-gray-50">
                    <tr>{['#','Image','Item','Code','HSN','Qty','Unit','Price','Amount'].map(h=>(
                      <th key={h} className="px-2 sm:px-3 py-2 text-left text-xs text-gray-500 font-semibold border-b border-gray-200">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {selOrder.items?.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 sm:px-3 py-2 text-gray-500">{i+1}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0]
                              ? <img src={item.product.images[0]} alt={item.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-base">📦</div>}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          {item.place && <p className="text-xs text-gray-400 mt-0.5">{item.place}</p>}
                        </td>
                        <td className="px-2 sm:px-3 py-2 font-mono text-xs">{item.itemCode}</td>
                        <td className="px-2 sm:px-3 py-2 font-mono text-xs">{item.hsnCode}</td>
                        <td className="px-2 sm:px-3 py-2">{item.quantity}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <span className="text-xs bg-navy-50 text-navy-600 font-semibold px-1.5 py-0.5 rounded">PAC</span>
                          <span className="text-xs text-gray-400 ml-1">(1={item.unitConversionRate||10} NOS)</span>
                        </td>
                        <td className="px-2 sm:px-3 py-2">₹{item.price}</td>
                        <td className="px-2 sm:px-3 py-2 font-semibold">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={7} className="px-2 sm:px-3 py-2 text-right text-xs text-gray-500">Subtotal</td>
                      <td colSpan={2} className="px-2 sm:px-3 py-2 text-sm">₹{selOrder.subtotal?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="px-2 sm:px-3 py-2 text-right text-xs text-gray-500">GST</td>
                      <td colSpan={2} className="px-2 sm:px-3 py-2 text-sm">₹{selOrder.gstTotal?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colSpan={7} className="px-2 sm:px-3 py-2 font-bold text-right text-xs sm:text-sm">Total</td>
                      <td colSpan={2} className="px-2 sm:px-3 py-2 font-bold text-navy-700">₹{selOrder.total?.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <a href={`/uploads/invoices/${selOrder.orderId}.pdf`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-champagne-500 hover:bg-champagne-600 text-white font-bold px-4 py-2.5 rounded-xl transition-all text-sm">
                  📄 Download Invoice PDF
                </a>
                <a href={`https://wa.me/${selOrder.customer?.whatsapp||selOrder.customer?.phone}?text=${encodeURIComponent('Your order '+selOrder.orderId+' status: '+selOrder.status)}`}
                  target="_blank" rel="noopener noreferrer" className="flex-1 whatsapp-btn">
                  WhatsApp Customer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[550px]">
              <thead className="bg-gray-50">
                <tr>{['Order ID','Customer','Phone','Total','Status','Date',''].map(h=>(
                  <th key={h} className="text-left px-3 sm:px-4 py-2.5 sm:py-3 text-gray-500 font-semibold text-xs uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelOrder(o)}>
                    <td className="px-3 sm:px-4 py-2.5 font-mono font-bold text-navy-600">{o.orderId}</td>
                    <td className="px-3 sm:px-4 py-2.5 font-medium text-gray-700">{o.customer?.name}</td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-500">{o.customer?.phone}</td>
                    <td className="px-3 sm:px-4 py-2.5 font-semibold">₹{o.total?.toFixed(2)}</td>
                    <td className="px-3 sm:px-4 py-2.5"><StatusBadge status={o.status}/></td>
                    <td className="px-3 sm:px-4 py-2.5 text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 sm:px-4 py-2.5">
                      <button className="text-xs bg-navy-50 text-navy-700 hover:bg-navy-100 px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold">View</button>
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
            {Array.from({length: pages}, (_, i) => (
              <button key={i+1} onClick={() => setPage(i+1)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-semibold ${page===i+1?'bg-navy-600 text-white':'bg-gray-100 hover:bg-gray-200'}`}>
                {i+1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── WHATSAPP SETUP ─── */
function WhatsAppSetupView() {
  const [status,       setStatus]       = useState(null);
  const [qrImage,      setQrImage]      = useState(null);
  const [polling,      setPolling]      = useState(true);
  const [initializing, setInitializing] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get('/whatsapp/status');
      setStatus(data);
      if (data.isReady) { setQrImage(null); setPolling(false); return; }
      if (data.error && !data.hasQR && !data.isInitializing) { setPolling(false); return; }
      if (data.hasQR) {
        const qrRes = await api.get('/whatsapp/qr');
        if (qrRes.data.qr) setQrImage(qrRes.data.qr);
      }
    } catch { setPolling(false); }
  };

  const handleInit = async () => {
    setInitializing(true);
    try {
      await api.post('/whatsapp/init');
      toast.success('WhatsApp initialization started');
      setPolling(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize WhatsApp');
    } finally {
      setInitializing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('This will disconnect WhatsApp and require a new QR scan. Continue?')) return;
    try {
      await api.post('/whatsapp/reset');
      setStatus(null); setQrImage(null);
      toast.success('Session cleared — click Initialize to get a new QR code');
      setPolling(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset session');
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- data fetching with polling */
  useEffect(() => {
    fetchStatus();
    if (!polling) return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [polling]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-navy-800 mb-2">WhatsApp Auto-Send</h1>
      <p className="text-gray-500 text-sm mb-6">Scan the QR code once to enable automatic order notifications — no clicks needed ever again.</p>

      {/* Status card */}
      <div className={`rounded-2xl p-5 mb-6 border-2 flex items-start gap-4 ${
        status?.isReady
          ? 'bg-green-50 border-green-300'
          : status?.error
          ? 'bg-amber-50 border-amber-300'
          : 'bg-blue-50 border-blue-300'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 mt-0.5 ${
          status?.isReady ? 'bg-green-200' : status?.error ? 'bg-amber-200' : 'bg-blue-200'
        }`}>
          {status?.isReady ? '🟢' : status?.error ? '⚙️' : '⏳'}
        </div>
        <div className="flex-1">
          <p className={`font-bold text-base ${status?.isReady ? 'text-green-800' : status?.error ? 'text-amber-800' : 'text-blue-800'}`}>
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
            <div className="mt-1 flex items-center gap-3">
              <p className="text-green-600 text-sm">Messages and PDFs are sent automatically when a customer places an order.</p>
              <button onClick={handleReset} className="text-xs text-gray-400 hover:text-red-500 underline whitespace-nowrap">Reset</button>
            </div>
          )}
          {!status?.isReady && !status?.error && status?.hasQR && (
            <p className="text-blue-700 text-sm mt-1">Open WhatsApp → More Options → Linked Devices → Link a Device → Scan QR</p>
          )}
        </div>
      </div>

      {/* QR Code */}
      {!status?.isReady && (
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-center max-w-md">
          {qrImage ? (
            <>
              <p className="font-display font-bold text-navy-800 text-lg mb-4">Scan with WhatsApp</p>
              <div className="border-4 border-navy-100 rounded-2xl overflow-hidden inline-block mb-4 p-2">
                <img src={qrImage} alt="WhatsApp QR Code" className="w-64 h-64 sm:w-72 sm:h-72" />
              </div>
              <p className="text-gray-500 text-sm">QR refreshes automatically. Once scanned, this page will show Connected.</p>
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
                  <p className="text-gray-400 text-xs mt-2">Waiting for QR code. This takes ~30 seconds.</p>
                  <button onClick={handleReset} className="mt-4 text-xs text-gray-400 hover:text-red-500 underline">
                    Stuck? Reset Session
                  </button>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-gray-600 font-medium mb-2">WhatsApp is not initialized</p>
                  <p className="text-gray-400 text-xs mb-4">Click below to start the WhatsApp service and generate a QR code.</p>
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
            { step:'1', text:'Admin scans QR code above once with their phone' },
            { step:'2', text:'WhatsApp stays connected on the server (persists across restarts)' },
            { step:'3', text:'Customer places an order → server auto-sends message + PDF to admin' },
            { step:'4', text:'Server also auto-sends order confirmation + PDF to customer\'s WhatsApp' },
            { step:'5', text:'Zero manual steps. Zero clicking. Fully automatic.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <span className="w-7 h-7 bg-champagne-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</span>
              <p className="text-sm text-gray-700">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


const Label = ({ children }) => (
  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-1.5">{children}</label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;

const FField = ({ label, value, onChange, type = 'text', placeholder, full, error }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <Label>{label}</Label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      className={`input ${error ? 'border-red-400' : ''}`} placeholder={placeholder} />
    <FieldError msg={error} />
  </div>
);

const StatusBadge = ({ status }) => {
  const c = {
    Pending: 'bg-yellow-100 text-yellow-700', Confirmed: 'bg-blue-100 text-blue-700',
    Shipped: 'bg-purple-100 text-purple-700', Delivered: 'bg-green-100 text-green-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return <span className={`badge ${c[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-16 sm:py-20">
    <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
  </div>
);

const EmptyState = ({ icon, msg }) => (
  <div className="text-center py-12 sm:py-16 text-gray-400">
    <div className="text-4xl mb-3">{icon}</div>
    <p className="text-sm">{msg}</p>
  </div>
);
