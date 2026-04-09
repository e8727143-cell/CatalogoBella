import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Info, 
  Truck, 
  CreditCard, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  MapPin,
  Ruler,
  Palette,
  Maximize2,
  Check,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from './lib/utils';
import { STORE_NAME, PROMOS, FAQ_ITEMS, PRODUCTS, URUGUAY_DEPARTMENTS } from './constants';

// --- Components ---

const UruguayMap = ({ selected, onSelect }: { selected: string; onSelect: (dept: string) => void }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-bg-secondary rounded-2xl border border-border-main">
      {URUGUAY_DEPARTMENTS.map((dept) => (
        <button
          key={dept}
          onClick={() => onSelect(dept)}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-bold transition-all border",
            selected === dept 
              ? "bg-brand-pink text-white border-brand-pink shadow-md scale-105" 
              : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink hover:bg-bg-accent"
          )}
        >
          {dept}
        </button>
      ))}
    </div>
  );
};

const SizeReference = ({ cm, onChange }: { cm: number; onChange: (val: number) => void }) => {
  // Scale factor for the SVG insole - ensure it fits at 40cm
  const scale = (cm / 40) * 0.85; 

  return (
    <div className="space-y-6 p-6 bg-bg-primary rounded-xl border border-border-main shadow-inner">
      <div className="flex justify-center items-center h-48 bg-bg-secondary rounded-lg relative">
        <motion.div
          animate={{ scale }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative flex items-center justify-center"
        >
          {/* SVG Insole Design - Horizontal */}
          <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M235 60C235 40 220 20 190 15C160 10 130 25 110 30C90 35 60 25 30 30C0 35 0 85 30 90C60 95 90 85 110 90C130 95 160 110 190 105C220 100 235 80 235 60Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" className="text-brand-pink"/>
            <path d="M40 40C40 40 35 50 35 60C35 70 40 80 40 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-pink"/>
            <circle cx="180" cy="60" r="20" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-brand-beige"/>
            <text x="125" y="65" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold" className="select-none text-brand-pink">BELLA</text>
          </svg>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-pink text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg z-10">
            {cm.toFixed(1)} cm
          </div>
        </motion.div>
        
        {/* Ruler Background */}
        <div className="absolute bottom-2 left-4 right-4 h-1 bg-border-main rounded-full">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="absolute h-2 w-0.5 bg-text-secondary/20" style={{ left: `${i * 10}%` }} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs font-bold text-text-secondary uppercase tracking-widest">
          <span>20 cm</span>
          <span className="text-brand-pink">{cm.toFixed(1)} cm</span>
          <span>40 cm</span>
        </div>
        <input
          type="range"
          min="20"
          max="40"
          step="0.1"
          value={cm}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-brand-pink"
        />
        <p className="text-[10px] text-center text-text-secondary italic">
          Desliza para ajustar los centímetros de la plantilla que se adapta a tu pie.
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'info' | 'order'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedPromo, setSelectedPromo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalColor, setModalColor] = useState('');
  const [modalSize, setModalSize] = useState('');
  const [modalDept, setModalDept] = useState('');
  const [modalCm, setModalCm] = useState(25);
  const [modalDetails, setModalDetails] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showSizeRef, setShowSizeRef] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const cmToSize = (cm: number) => {
    if (cm <= 23) return '36';
    if (cm <= 23.7) return '37';
    if (cm <= 24.3) return '38';
    if (cm <= 25.0) return '39';
    if (cm <= 25.7) return '40';
    if (cm <= 26.3) return '41';
    if (cm <= 27.0) return '42';
    if (cm <= 27.7) return '43';
    if (cm <= 28.3) return '44';
    return '45';
  };

  const handleCmChange = (cm: number) => {
    setModalCm(cm);
    const calculatedSize = cmToSize(cm);
    // Only update if the size is available for this product
    if (selectedProduct?.sizes.includes(calculatedSize)) {
      setModalSize(calculatedSize);
    }
  };

  const categories = ['Todos', 'Femenino', 'Masculino', 'Infantil'];

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(product => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesPromo = !selectedPromo || product.promo === selectedPromo;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPromo && matchesSearch;
    });
  }, [selectedCategory, selectedPromo, searchQuery]);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalColor(product.colors[0]);
    setModalSize(product.sizes[0]);
    setModalDept('');
    setModalCm(25);
    setModalDetails('');
    setShowMap(false);
    setShowSizeRef(false);
  };

  const handleWhatsAppOrder = () => {
    if (!modalDept) {
      alert("Por favor, selecciona un departamento de destino.");
      setShowMap(true);
      return;
    }

    const message = `¡Hola BELLA! Quiero realizar un pedido:
    
🖼️ *Foto del producto:* ${selectedProduct.image}

📌 *Producto:* ${selectedProduct.name}
🎨 *Color:* ${modalColor}
📏 *Talle:* ${modalSize}
📏 *Plantilla:* ${modalCm.toFixed(1)} cm
📍 *Destino:* ${modalDept}
📝 *Detalles:* ${modalDetails || 'Sin detalles adicionales'}

¿Cómo procedo con el pago?`;

    window.open(`https://wa.me/59895330959?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWhatsAppGeneral = () => {
    const text = "Hola BELLA! Quisiera más información sobre el catálogo.";
    window.open(`https://wa.me/59895330959?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col">
        {/* Detail Header */}
        <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="flex items-center gap-2 text-text-secondary hover:text-brand-pink transition-colors font-bold"
              >
                <X size={20} />
                <span>Volver al Catálogo</span>
              </button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tighter text-brand-pink">{STORE_NAME}</h1>
                </div>
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="p-2 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-accent transition-all shadow-sm border border-border-main"
                  aria-label="Toggle Theme"
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Image Section */}
            <div className="lg:w-1/2 space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl border border-border-main"
              >
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-bg-secondary rounded-lg text-center">
                  <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest">Categoría</p>
                  <p className="font-bold text-text-primary">{selectedProduct.category}</p>
                </div>
                <div className="flex-1 p-4 bg-bg-secondary rounded-lg text-center">
                  <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest">Calidad</p>
                  <p className="font-bold text-text-primary">Premium</p>
                </div>
              </div>
            </div>

            {/* Config Section */}
            <div className="lg:w-1/2 space-y-10">
              <div>
                <h2 className="text-4xl font-black text-text-primary mb-2 leading-tight">{selectedProduct.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <div className="inline-block bg-brand-pink text-white px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-pink/10">
                    {PROMOS.find(p => p.id === selectedProduct.promo)?.title}
                  </div>
                  <div className="inline-block bg-text-primary text-bg-primary px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                    Stock Disponible
                  </div>
                </div>
              </div>

              {/* Product Info Card */}
              <div className="p-8 bg-bg-secondary rounded-[1.25rem] border border-border-main space-y-6">
                <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                  <Info size={14} />
                  <span>Especificaciones</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg-primary rounded-xl flex items-center justify-center text-brand-pink shadow-sm">
                      <Check size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Calidad</p>
                      <p className="text-sm font-bold text-text-primary">Premium / 1ra Línea</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg-primary rounded-xl flex items-center justify-center text-brand-pink shadow-sm">
                      <Globe size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Origen</p>
                      <p className="text-sm font-bold text-text-primary">Brasil</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg-primary rounded-xl flex items-center justify-center text-brand-pink shadow-sm">
                      <Maximize2 size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Numeración</p>
                      <p className="text-sm font-bold text-text-primary">36 al 45 (EU)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-bg-primary rounded-xl flex items-center justify-center text-brand-pink shadow-sm">
                      <Truck size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Envíos</p>
                      <p className="text-sm font-bold text-text-primary">Todo Uruguay</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                  <Palette size={14} />
                  <span>Seleccionar Color</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setModalColor(color)}
                      className={cn(
                        "px-6 py-3 rounded-lg text-sm font-bold transition-all border-2",
                        modalColor === color 
                          ? "bg-brand-pink text-white border-brand-pink shadow-xl shadow-brand-pink/10 scale-105" 
                          : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                    <Maximize2 size={14} />
                    <span>Seleccionar Talle (EU)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setModalSize(size)}
                      className={cn(
                        "w-14 h-14 rounded-lg text-sm font-bold transition-all border-2 flex items-center justify-center",
                        modalSize === size 
                          ? "bg-brand-pink text-white border-brand-pink shadow-xl shadow-brand-pink/10 scale-105" 
                          : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <button 
                    onClick={() => setShowSizeRef(!showSizeRef)}
                    className={cn(
                      "w-full py-4 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                      showSizeRef 
                        ? "bg-text-primary text-bg-primary" 
                        : "bg-brand-pink text-white hover:bg-brand-pink/90 shadow-brand-pink/10"
                    )}
                  >
                    <Ruler size={16} />
                    {showSizeRef ? "Cerrar Guía de Talles" : "Elegir talle con referencia en Centimetros"}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showSizeRef && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <SizeReference cm={modalCm} onChange={handleCmChange} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Destination Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                    <MapPin size={14} />
                    <span>Destino del Envío (Uruguay)</span>
                  </div>
                  <button 
                    onClick={() => setShowMap(!showMap)}
                    className="bg-bg-secondary text-text-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink hover:text-white transition-all border border-border-main"
                  >
                    {showMap ? "Cerrar Mapa" : "Elegir Departamento"}
                  </button>
                </div>
                
                {modalDept && !showMap && (
                  <div className="p-5 bg-bg-secondary rounded-[1rem] border-2 border-brand-pink/20 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-pink rounded-full flex items-center justify-center text-white">
                        <MapPin size={16} />
                      </div>
                      <span className="font-black text-brand-pink text-lg">{modalDept}</span>
                    </div>
                    <button onClick={() => setShowMap(true)} className="text-xs font-bold text-text-secondary underline uppercase tracking-widest">Cambiar</button>
                  </div>
                )}

                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <UruguayMap 
                        selected={modalDept} 
                        onSelect={(dept) => {
                          setModalDept(dept);
                          setShowMap(false);
                        }} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Additional Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                  <Info size={14} />
                  <span>Detalles o Notas</span>
                </div>
                <textarea
                  placeholder="Escribe aquí cualquier detalle adicional para tu pedido..."
                  value={modalDetails}
                  onChange={(e) => setModalDetails(e.target.value)}
                  className="w-full p-6 rounded-[1rem] bg-bg-secondary border-2 border-border-main focus:outline-none focus:border-brand-pink text-sm min-h-[120px] resize-none transition-all text-text-primary"
                />
              </div>

              {/* Final Order Button */}
              <button 
                onClick={handleWhatsAppOrder}
                className="w-full bg-text-primary text-bg-primary py-6 rounded-[1.25rem] text-xl font-black flex items-center justify-center gap-4 hover:bg-brand-pink hover:text-white transition-all shadow-2xl shadow-brand-pink/10 active:scale-95 group"
              >
                <ShoppingBag size={28} className="group-hover:rotate-12 transition-transform" />
                ¡LO QUIERO!
              </button>
            </div>
          </div>
        </main>

        <footer className="bg-bg-primary border-t border-border-main py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">BELLA FOOTWEAR URUGUAY</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tighter text-brand-pink">{STORE_NAME}</h1>
            </div>
            
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex space-x-8">
                <button 
                  onClick={() => setActiveTab('catalog')}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    activeTab === 'catalog' ? "text-brand-pink" : "text-text-secondary hover:text-brand-pink"
                  )}
                >
                  Catálogo
                </button>
                <button 
                  onClick={() => setActiveTab('order')}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    activeTab === 'order' ? "text-brand-pink" : "text-text-secondary hover:text-brand-pink"
                  )}
                >
                  Cómo Comprar
                </button>
                <button 
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    activeTab === 'info' ? "text-brand-pink" : "text-text-secondary hover:text-brand-pink"
                  )}
                >
                  Info & FAQ
                </button>
              </nav>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-bg-secondary text-text-primary hover:bg-bg-accent transition-all shadow-sm border border-border-main"
                aria-label="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar Above Promos */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-pink transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="¿Qué calzado estás buscando hoy?"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveTab('catalog');
              }}
              className="w-full pl-12 pr-6 py-4 rounded-full bg-bg-primary border-2 border-border-main shadow-xl shadow-brand-pink/10 focus:outline-none focus:border-brand-pink text-lg transition-all placeholder:text-text-secondary/50 text-text-primary"
            />
          </div>
        </div>

        {/* Hero / Promos */}
        <section className="mb-12">
          <div className="grid grid-cols-1 gap-8">
            {PROMOS.map((promo) => {
              const [mainDesc, subDesc] = promo.description.split(' (');
              return (
                <div key={promo.id} className="space-y-2">
                  <div className={cn(
                    "inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ml-2",
                    promo.id === 'promo-2600' ? "bg-brand-beige text-text-primary" : "bg-[#DAA520] text-white"
                  )}>
                    {promo.label}
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => {
                      setSelectedPromo(selectedPromo === promo.id ? null : promo.id);
                      setActiveTab('catalog');
                    }}
                    className={cn(
                      "relative overflow-hidden rounded-xl p-6 text-text-primary shadow-xl cursor-pointer transition-all border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                      promo.id === 'promo-2600' 
                        ? "bg-gradient-to-br from-[#E8E8E8] via-[#F5F5F5] to-[#C0C0C0] border-white/40" 
                        : "bg-gradient-to-br from-[#FFD700] via-[#FFFACD] to-[#DAA520] border-white/40",
                      selectedPromo === promo.id ? "ring-4 ring-brand-pink ring-offset-2" : "border-transparent"
                    )}
                  >
                    {/* Shiny Effect Overlay */}
                    <motion.div 
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
                    />

                    <div className="relative z-10">
                      <h2 className="text-2xl font-black tracking-tighter leading-none mb-3">{promo.title}</h2>
                      <div className="space-y-1">
                        <p className="text-sm font-bold leading-tight">{mainDesc}</p>
                        <p className="text-sm font-bold leading-tight">({subDesc}</p>
                      </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-10 bg-bg-primary/30 backdrop-blur-md px-8 py-4 rounded-lg border border-border-main shadow-inner">
                      <span className="text-4xl font-black tracking-tighter">${promo.price}</span>
                      <span className="text-xl font-black uppercase tracking-widest text-text-primary">2 pares</span>
                    </div>

                    {/* Background Icon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 rotate-12 pointer-events-none">
                      <ShoppingBag size={140} />
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 justify-start items-center bg-bg-primary p-4 rounded-lg border border-border-main shadow-sm">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        selectedCategory === cat 
                          ? "bg-brand-pink text-white border-brand-pink border" 
                          : "bg-bg-secondary text-text-secondary border-transparent border hover:bg-bg-accent"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                  {selectedPromo && (
                    <button
                      onClick={() => setSelectedPromo(null)}
                      className="px-4 py-2 rounded-full text-sm font-black bg-brand-pink text-white flex items-center gap-2 shadow-md hover:bg-brand-pink/80 transition-all"
                    >
                      <span>Promo: {PROMOS.find(p => p.id === selectedPromo)?.label}</span>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {filteredProducts.map((product) => {
                  const promoLabel = PROMOS.find(p => p.id === product.promo)?.label;
                  const isPremium = promoLabel === 'Premium';
                  
                  return (
                    <motion.div
                      layout
                      key={product.id}
                      className="group bg-bg-primary rounded-xl overflow-hidden border border-border-main shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      
                      {/* Category Bar */}
                      <div className={cn(
                        "py-1 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white",
                        isPremium 
                          ? "bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-black shadow-inner" // Gold/Dorado
                          : "bg-gradient-to-r from-[#71706E] via-[#E5E4E2] to-[#71706E] text-black shadow-inner" // Platinum/Silver/Platino
                      )}>
                        {promoLabel}
                      </div>

                      <div className="p-4 sm:p-6">
                        <p className="text-[10px] font-bold text-brand-pink uppercase tracking-widest mb-1">{product.category}</p>
                        <h3 className="text-lg font-bold text-text-primary mb-4 line-clamp-1">{product.name}</h3>
                        <button 
                          onClick={() => openProductModal(product)}
                          className="w-full bg-text-primary text-bg-primary py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-pink transition-colors active:scale-95"
                        >
                          <ShoppingBag size={16} />
                          Ver Detalles
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'order' && (
            <motion.div
              key="order"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-text-primary">¿Cómo hacer tu pedido?</h2>
                <p className="text-text-secondary">Sigue estos simples pasos para asegurar tu par perfecto.</p>
              </div>

              <div className="space-y-6">
                {[
                  { 
                    icon: <ShoppingBag className="text-brand-pink" />, 
                    title: "Elige tus modelos", 
                    desc: "Navega por nuestro catálogo y selecciona los pares que más te gusten. Envíanos una captura de pantalla." 
                  },
                  { 
                    icon: <Filter className="text-brand-pink" />, 
                    title: "Confirma tu talle", 
                    desc: "Para evitar errores, envíanos una foto de la etiqueta de tu calzado actual y de los cm de la plantilla." 
                  },
                  { 
                    icon: <CreditCard className="text-brand-pink" />, 
                    title: "Realiza el pago", 
                    desc: "Una vez confirmado el stock, abona mediante transferencia, Abitab, Red Pagos o Mercado Pago." 
                  },
                  { 
                    icon: <Truck className="text-brand-pink" />, 
                    title: "Recibe tu pedido", 
                    desc: "Despachamos todos los días por DAC, Turil, Copay y más a todo el país." 
                  }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6 p-6 bg-bg-primary rounded-xl border border-border-main shadow-sm">
                    <div className="w-12 h-12 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                      {step.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary mb-1">{step.title}</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-bg-secondary border border-brand-pink/20 rounded-xl p-6 flex gap-4">
                <AlertCircle className="text-brand-pink flex-shrink-0" />
                <div className="text-sm text-text-primary">
                  <p className="font-bold mb-1">Importante sobre talles:</p>
                  <p className="opacity-80">No trabajamos con cambios. Por este motivo es fundamental medir la plantilla con exactitud antes de confirmar.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-text-primary">Preguntas Frecuentes</h2>
                <p className="text-text-secondary">Todo lo que necesitas saber sobre BELLA.</p>
              </div>

              <div className="space-y-4">
                {FAQ_ITEMS.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-bg-primary rounded-lg border border-border-main overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-bg-secondary transition-colors"
                    >
                      <span className="font-bold text-text-primary">{item.question}</span>
                      {openFaq === index ? <ChevronUp className="text-brand-pink" /> : <ChevronDown className="text-text-secondary" />}
                    </button>
                    <AnimatePresence>
                      {openFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-4"
                        >
                          <div className="pt-2 border-t border-border-main text-text-secondary text-sm whitespace-pre-line leading-relaxed">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 bg-bg-secondary rounded-xl text-center space-y-2 border border-border-main">
                  <CheckCircle2 className="mx-auto text-brand-pink" />
                  <h4 className="font-bold text-text-primary">Calidad Premium</h4>
                  <p className="text-xs text-text-secondary">Productos de procedencia brasileña de alta gama.</p>
                </div>
                <div className="p-6 bg-bg-secondary rounded-xl text-center space-y-2 border border-border-main">
                  <Truck className="mx-auto text-brand-pink" />
                  <h4 className="font-bold text-text-primary">Envíos Diarios</h4>
                  <p className="text-xs text-text-secondary">Despachamos todos los días a todo el país.</p>
                </div>
                <div className="p-6 bg-bg-secondary rounded-xl text-center space-y-2 border border-border-main">
                  <CreditCard className="mx-auto text-brand-pink" />
                  <h4 className="font-bold text-text-primary">Pagos Seguros</h4>
                  <p className="text-xs text-text-secondary">Mercado Pago, Abitab y transferencias.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal Removed - Replaced by Full Screen View */}

      {/* Footer */}
      <footer className="bg-bg-primary border-t border-border-main py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[10px] text-text-secondary uppercase tracking-widest">
            © {new Date().getFullYear()} BELLA FOOTWEAR. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp for Mobile Removed */}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-brand-200);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-brand-300);
        }
      `}</style>
    </div>
  );
}
