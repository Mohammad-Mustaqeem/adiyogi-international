import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/formatters";
import { ITEMS_PER_PAGE } from "@/constants";

/* ─────────────────────────────────────────────
   PRODUCT CAROUSEL
───────────────────────────────────────────── */
function ProductCarousel({ collections }) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState({ active: false, startX: 0 });
  const timerRef = useRef(null);

  useEffect(() => {
    if (!collections?.length) return;
    const newArrivals = collections.find((c) => c.slug === "new-arrivals");
    if (!newArrivals) return;
    api
      .get("/products", { params: { limit: 12, page: 1, collection: newArrivals._id } })
      .then((res) => {
        const prods = res.data.products.filter((p) => p.images?.length > 0);
        setSlides(prods);
      })
      .catch(() => {});
  }, [collections]);

  const goTo = useCallback((idx, total) => {
    setIndex(((idx % total) + total) % total);
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    if (paused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused]);

  const handleNav = (dir, e) => {
    e.stopPropagation();
    clearInterval(timerRef.current);
    goTo(index + dir, slides.length);
  };

  const onDragStart = (x) => setDrag({ active: true, startX: x });
  const onDragEnd = (x) => {
    if (!drag.active) return;
    const diff = drag.startX - x;
    if (Math.abs(diff) > 50) { clearInterval(timerRef.current); goTo(index + (diff > 0 ? 1 : -1), slides.length); }
    setDrag({ active: false, startX: 0 });
  };

  if (slides.length === 0) return null;

  const product = slides[index];
  const salesPrice = product.salesPrice ?? product.price ?? 0;

  return (
    <section className="py-10 sm:py-14 bg-navy-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-10">
          <span className="text-champagne-400 font-bold text-xs sm:text-sm uppercase tracking-widest">Just In</span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-1">New Arrivals</h2>
          <p className="text-navy-300 text-sm mt-2">Latest additions to our catalogue</p>
        </div>
        <div
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl select-none"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onMouseDown={(e) => onDragStart(e.clientX)}
          onMouseUp={(e) => onDragEnd(e.clientX)}
          onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
          onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX)}
        >
          <div className="relative h-52 xs:h-64 sm:h-80 md:h-96 lg:h-[440px] bg-navy-800 cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
            {product.images?.[0] ? (
              <img key={index} src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-4 sm:p-8 animate-fade-in" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/10 to-transparent" />
            {product.collection?.name && (
              <div className="absolute top-3 right-14 sm:top-5 sm:right-16 bg-champagne-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {product.collection.name}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 cursor-pointer" onClick={() => navigate(`/product/${product._id}`)}>
            <p className="text-champagne-300 text-[10px] sm:text-xs font-mono mb-1">{product.itemCode}</p>
            <h3 className="font-display font-bold text-white text-lg sm:text-2xl lg:text-3xl leading-tight mb-2 line-clamp-1">{product.name}</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display font-black text-champagne-400 text-xl sm:text-2xl">₹{formatCurrency(salesPrice)}</span>
              <span className="text-white/60 text-xs">/PAC</span>
              <span className="ml-auto inline-flex items-center gap-1.5 bg-champagne-500 hover:bg-champagne-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl transition-all">
                View Details
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </div>
          </div>
          {slides.length > 1 && (
            <>
              <button onClick={(e) => handleNav(-1, e)} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={(e) => handleNav(1, e)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}
        </div>
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { clearInterval(timerRef.current); goTo(i, slides.length); }}
                className={`rounded-full transition-all duration-300 ${i === index ? "w-6 sm:w-8 h-2 bg-champagne-400" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`} />
            ))}
            <span className="text-white/40 text-xs ml-2 font-mono">{index + 1}/{slides.length}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────────── */
export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeCollection, setActiveCollection] = useState("all");
  const [loading, setLoading] = useState(false);
  const productsRef = useRef();

  const debouncedSearch = useDebounce(search);

  useEffect(() => { api.get("/collections").then((r) => setCollections(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = { page: currentPage, limit: ITEMS_PER_PAGE };
        if (debouncedSearch) params.search = debouncedSearch;
        if (activeCollection !== "all") params.collection = activeCollection;
        const { data } = await api.get("/products", { params });
        setProducts(data.products);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [currentPage, debouncedSearch, activeCollection]);

  const handleCollection = (id) => {
    setActiveCollection(id);
    setCurrentPage(1);
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePage = (p) => {
    setCurrentPage(p);
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
        <div className="absolute inset-0 pattern-bg" />
        <div className="absolute top-1/4 right-0 w-60 sm:w-96 h-60 sm:h-96 bg-champagne-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 sm:w-80 h-48 sm:h-80 bg-navy-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-20 sm:pt-24">
          {/* Floating Logo */}
          <div className="animate-float mb-6 sm:mb-8">
            <img src="/logo.png" alt="Adiyogi International" className="h-24 xs:h-28 sm:h-36 md:h-44 mx-auto drop-shadow-2xl" />
          </div>

          {/* Business Identity Card */}
          <div className="mb-8 sm:mb-10">
            <div className="inline-block border border-champagne-500/40 rounded-2xl px-6 sm:px-10 py-4 sm:py-5 bg-white/5 backdrop-blur-sm">
              <p className="font-display font-black text-champagne-400 text-lg sm:text-2xl tracking-widest uppercase mb-0.5">
                Adiyogi International
              </p>
              <div className="flex items-center justify-center gap-2 my-2">
                <span className="h-px w-8 bg-champagne-500/50" />
                <span className="text-navy-300 text-xs sm:text-sm font-medium tracking-wider uppercase">
                  Bhoomi Agrotech · Vijaypur
                </span>
                <span className="h-px w-8 bg-champagne-500/50" />
              </div>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mt-3">
                {['7975198804', '8123458984', '8722812222'].map((num) => (
                  <a key={num} href={`tel:${num}`}
                    className="flex items-center gap-1.5 text-champagne-400 hover:text-white transition-colors text-xs sm:text-sm font-mono">
                    <span className="text-champagne-500 text-xs">📞</span>
                    {num}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="page-enter">
            <h1 className="font-display text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-3 sm:mb-4">
              Come Experience
              <br />
              <span className="text-champagne-400">The Quality</span>
            </h1>
            <p className="text-navy-200 text-sm sm:text-base md:text-xl max-w-xl sm:max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-2">
              Premium products, exceptional service. Explore our curated collections and experience the difference.
            </p>
            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 justify-center px-4 xs:px-0">
              <a href="#products" className="inline-flex items-center justify-center gap-2 bg-champagne-500 hover:bg-champagne-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-sm mb-4 sm:text-lg">
                Shop Now
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
              <a href="#collections" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 text-sm sm:text-lg mb-4 backdrop-blur-sm">
                View Collections
              </a>
            </div>
          </div>

          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── PRODUCT CAROUSEL ── */}
      <ProductCarousel collections={collections} />

      {/* ── COLLECTIONS ── */}
      <section id="collections" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="section-label">Browse By</span>
            <h2 className="section-title text-navy-800 mt-2">Our Collections</h2>
          </div>
          {collections.length > 0 ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              <CollectionCard name="All Products" active={activeCollection === "all"} onClick={() => handleCollection("all")} />
              {collections.map((col) => (
                <CollectionCard key={col._id} name={col.name} image={col.image} active={activeCollection === col._id} onClick={() => handleCollection(col._id)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8 text-sm">Add collections from the admin panel to display here.</p>
          )}
        </div>
      </section>

      {/* ── HOW TO ORDER ── */}
      <section id="how-to-order" className="py-12 sm:py-16 lg:py-20 bg-ivory">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="section-label">Simple & Easy</span>
            <h2 className="section-title text-navy-800 mt-2">How to Place an Order</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8">
            {[
              { step: "01", icon: "🔍", title: "Browse & Select", desc: "Explore collections, search for products, and pick what you need." },
              { step: "02", icon: "🛒", title: "Add to Cart", desc: "Choose your quantities and add products to your cart." },
              { step: "03", icon: "📱", title: "Order via WhatsApp", desc: "Fill your details and we'll send an invoice straight to WhatsApp." },
            ].map((s) => (
              <div key={s.step} className="text-center bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-shadow">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{s.icon}</div>
                <div className="font-mono text-xs sm:text-sm text-champagne-500 font-bold mb-2">STEP {s.step}</div>
                <h3 className="font-display font-bold text-lg sm:text-xl text-navy-800 mb-2 sm:mb-3">{s.title}</h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-12 sm:py-16 lg:py-20 bg-white" ref={productsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <span className="section-label">
                {activeCollection !== "all" ? collections.find((c) => c._id === activeCollection)?.name || "Collection" : "All Items"}
              </span>
              <h2 className="section-title text-navy-800 mt-1">
                Our Products
                {total > 0 && <span className="text-base sm:text-lg font-normal text-gray-400 ml-2">({total})</span>}
              </h2>
            </div>
            <div className="relative w-full sm:w-80 lg:w-96">
              <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search products, codes..." className="input pl-9 sm:pl-12 pr-8 sm:pr-10" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>

          {collections.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 sm:mb-8">
              {[{ _id: "all", name: "All Products" }, ...collections].map((col) => (
                <button key={col._id} onClick={() => handleCollection(col._id)}
                  className={`flex-shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    activeCollection === col._id ? "bg-navy-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-navy-50 hover:text-navy-700"
                  }`}>
                  {col.name}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                    <div className="h-3.5 bg-gray-200 rounded w-full" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                    <div className="h-9 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {products.map((product, i) => (
                <div key={product._id} className="page-enter" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 sm:py-24">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-gray-500 mb-2">No products found</h3>
              <p className="text-gray-400 text-sm">Try a different search or browse all collections</p>
              <button onClick={() => { setSearch(""); setActiveCollection("all"); }} className="mt-6 btn-primary">Show All Products</button>
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-10 sm:mt-12 flex-wrap">
              <button onClick={() => handlePage(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 sm:p-3 rounded-xl border border-gray-200 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                let page;
                if (pages <= 7) page = i + 1;
                else if (i === 0) page = 1;
                else if (i === 6) page = pages;
                else if (currentPage <= 4) page = i + 1;
                else if (currentPage >= pages - 3) page = pages - 6 + i;
                else page = currentPage - 3 + i;
                return (
                  <button key={page} onClick={() => handlePage(page)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                      currentPage === page ? "bg-navy-600 text-white shadow-md" : "border border-gray-200 hover:bg-navy-50 text-gray-600"
                    }`}>
                    {page}
                  </button>
                );
              })}
              <button onClick={() => handlePage(currentPage + 1)} disabled={currentPage === pages}
                className="p-2 sm:p-3 rounded-xl border border-gray-200 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CollectionCard({ name, image, active, onClick }) {
  const gradients = ["from-navy-700 to-navy-900","from-slate-600 to-slate-800","from-indigo-700 to-navy-900","from-teal-700 to-navy-800","from-navy-600 to-slate-800"];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradient = gradients[hash % gradients.length];
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <button onClick={onClick}
      className={`group relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square cursor-pointer transition-all duration-300 ${
        active ? "ring-4 ring-champagne-500 shadow-xl scale-105" : "hover:scale-105 hover:shadow-lg"
      }`}>
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-1`}>
          <span className="font-display font-black text-white/20 text-4xl sm:text-5xl leading-none select-none">{initials}</span>
        </div>
      )}
      <div className={`absolute inset-0 flex items-end p-2 sm:p-3 ${image ? "bg-gradient-to-t from-black/70 to-transparent" : "bg-gradient-to-t from-black/40 to-transparent"}`}>
        <span className="font-display font-bold text-xs sm:text-sm leading-tight text-white drop-shadow">{name}</span>
      </div>
      {active && (
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-champagne-500 text-white rounded-full p-0.5 sm:p-1">
          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
        </div>
      )}
    </button>
  );
}
