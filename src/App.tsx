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
  Moon,
  Trash2,
  Plus,
  Save,
  LogOut,
  Pencil,
  User
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  STORE_NAME, 
  PROMOS, 
  FAQ_ITEMS, 
  URUGUAY_DEPARTMENTS,
  SHIPPING_AGENCIES 
} from './constants';
import { supabase } from './lib/supabase';

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

const formatSize = (eurSize: string) => {
  const eur = parseInt(eurSize);
  if (isNaN(eur)) return eurSize;
  const br = eur - 2;
  return `${br} BR (${eur} EUR)`;
};

const SizeReference = ({ cm, onChange, currentSize }: { cm: number; onChange: (val: number) => void; currentSize: string }) => {
  // Scale factor for the SVG insole - ensure it fits at 35cm
  const scale = (cm / 35) * 0.85; 

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
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-pink text-white px-3 py-1 rounded-full shadow-lg z-10 flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] font-bold leading-tight">{cm.toFixed(1)} cm</span>
            <span className="text-[8px] font-black opacity-90 leading-tight">{formatSize(currentSize)}</span>
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
          <div className="flex flex-col items-center">
            <span className="text-brand-pink">{cm.toFixed(1)} cm</span>
            <span className="text-[10px] text-text-secondary">{formatSize(currentSize)}</span>
          </div>
          <span>35 cm</span>
        </div>
        <input
          type="range"
          min="20"
          max="35"
          step="0.1"
          value={cm}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-brand-pink"
        />
        <p className="text-[10px] text-center text-text-secondary italic">
          Desliza para ajustar los centímetros de la plantilla. El talle se seleccionará automáticamente.
        </p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'info' | 'order' | 'admin'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedPromo, setSelectedPromo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalColor, setModalColor] = useState('');
  const [modalSize, setModalSize] = useState('');
  const [modalDept, setModalDept] = useState('');
  const [modalAgency, setModalAgency] = useState('');
  const [modalCm, setModalCm] = useState(25);
  const [modalName, setModalName] = useState('');
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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Set up real-time subscription
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const cmToSize = (cm: number) => {
    if (cm <= 23.0) return '36';
    if (cm <= 23.5) return '37';
    if (cm < 24.5) return '38'; // 24.5 triggers 39 as requested
    if (cm <= 25.0) return '39';
    if (cm <= 25.5) return '40';
    if (cm <= 26.0) return '41';
    if (cm <= 26.5) return '42';
    if (cm <= 27.5) return '43';
    if (cm <= 28.5) return '44';
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

  const categories = ['Todos', 'Femenino', 'Masculino', 'Infantil', 'Unisex'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesPromo = !selectedPromo || product.promo === selectedPromo;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPromo && matchesSearch;
    });
  }, [products, selectedCategory, selectedPromo, searchQuery]);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalColor(product.colors[0]);
    setModalSize(product.sizes[0]);
    setModalDept('');
    setModalAgency('');
    setModalCm(25);
    setModalName('');
    setShowMap(false);
    setShowSizeRef(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminAuthenticated(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
      setAdminPassword('');
      setNotification({ message: 'Bienvenido, Administrador', type: 'success' });
    } else {
      setNotification({ message: 'Contraseña incorrecta', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setConfirmDelete(null);
      setNotification({ message: 'Producto eliminado correctamente', type: 'success' });
    } catch (error) {
      console.error('Error deleting product:', error);
      setNotification({ message: 'Error al eliminar el producto', type: 'error' });
    }
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Femenino',
    promo: 'promo-2600',
    image: '',
    colors: '',
    sizes: '36,37,38,39,40'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.image) {
      setNotification({ message: 'Por favor, selecciona una imagen para el producto', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const productData = {
        ...newProduct,
        colors: typeof newProduct.colors === 'string' ? newProduct.colors.split(',').map(c => c.trim()) : newProduct.colors,
        sizes: typeof newProduct.sizes === 'string' ? newProduct.sizes.split(',').map(s => s.trim()) : newProduct.sizes
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        setNotification({ message: 'Producto actualizado con éxito', type: 'success' });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
        setNotification({ message: 'Producto creado con éxito', type: 'success' });
      }
      
      setNewProduct({
        name: '',
        category: 'Femenino',
        promo: 'promo-2600',
        image: '',
        colors: '',
        sizes: '36,37,38,39,40'
      });
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setNotification({ message: 'Error al guardar el producto', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      promo: product.promo,
      image: product.image,
      colors: product.colors.join(', '),
      sizes: product.sizes.join(', ')
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      category: 'Femenino',
      promo: 'promo-2600',
      image: '',
      colors: '',
      sizes: '36,37,38,39,40'
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setNewProduct({ ...newProduct, image: publicUrl });
      setNotification({ message: 'Imagen subida correctamente', type: 'success' });
    } catch (error) {
      console.error('Error uploading image:', error);
      setNotification({ message: 'Error al subir la imagen. Verifica el bucket "product-images"', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsAppOrder = () => {
    if (!modalDept) {
      setNotification({ message: 'Por favor, selecciona un departamento de destino', type: 'error' });
      setShowMap(true);
      return;
    }

    if (!modalAgency) {
      setNotification({ message: 'Por favor, selecciona una agencia de envío', type: 'error' });
      return;
    }

    const message = `¡Hola BELLA! Quiero realizar un pedido:
    
🖼️ *Foto del producto:* ${selectedProduct.image}

📌 *Producto:* ${selectedProduct.name}
🎨 *Color:* ${modalColor}
📏 *Talle:* ${modalSize} (${parseInt(modalSize) - 2} BR)
📏 *Plantilla:* ${modalCm.toFixed(1)} cm
📍 *Destino:* ${modalDept}
🚚 *Agencia:* ${modalAgency}
👤 *Nombre:* ${modalName || 'No especificado'}

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
                    <span>Seleccionar Talle (BR / EUR)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedProduct.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setModalSize(size)}
                      className={cn(
                        "w-14 h-14 rounded-lg text-[10px] font-bold transition-all border-2 flex flex-col items-center justify-center leading-tight",
                        modalSize === size 
                          ? "bg-brand-pink text-white border-brand-pink shadow-xl shadow-brand-pink/10 scale-105" 
                          : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                      )}
                    >
                      <span className="font-black text-sm">{parseInt(size) - 2}</span>
                      <span className="opacity-70">({size})</span>
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
                    {showSizeRef ? "CERRAR GUÍA" : "ELEGIR TALLE CON CENTIMETROS"}
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
                      <SizeReference cm={modalCm} onChange={handleCmChange} currentSize={modalSize} />
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

              {/* Shipping Agency Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                  <Truck size={14} />
                  <span>Agencia de Envío</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SHIPPING_AGENCIES.map((agency) => (
                    <button
                      key={agency}
                      onClick={() => setModalAgency(agency)}
                      className={cn(
                        "py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2",
                        modalAgency === agency 
                          ? "bg-brand-pink text-white border-brand-pink shadow-lg shadow-brand-pink/10 scale-105" 
                          : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                      )}
                    >
                      {agency}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                  <User size={14} />
                  <span>Tu Nombre (Opcional)</span>
                </div>
                <input
                  type="text"
                  placeholder="Escribe tu nombre aquí..."
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full p-6 rounded-[1rem] bg-bg-secondary border-2 border-border-main focus:outline-none focus:border-brand-pink text-sm transition-all text-text-primary"
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
              <h1 
                className="text-2xl font-bold tracking-tighter text-brand-pink cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (isAdminAuthenticated) {
                    setActiveTab('admin');
                  } else {
                    setShowAdminLogin(true);
                  }
                }}
              >
                {STORE_NAME}
              </h1>
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
              return (
                <motion.div 
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedPromo(selectedPromo === promo.id ? null : promo.id);
                    setActiveTab('catalog');
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl cursor-pointer transition-all shadow-2xl",
                    selectedPromo === promo.id ? "ring-4 ring-brand-pink ring-offset-4" : ""
                  )}
                >
                  <img 
                    src={promo.banner} 
                    alt={promo.title} 
                    className="w-full h-auto block"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Selection Overlay */}
                  {selectedPromo === promo.id && (
                    <div className="absolute inset-0 bg-brand-pink/10 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-brand-pink text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-xl">
                        Seleccionado
                      </div>
                    </div>
                  )}
                </motion.div>
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
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Cargando catálogo...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
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
                            className="w-full bg-brand-pink text-white py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-pink/90 transition-all active:bg-brand-beige active:text-brand-pink active:scale-95"
                          >
                            <ShoppingBag size={16} />
                            Me Interesa
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-bg-secondary rounded-2xl border border-dashed border-border-main">
                  <AlertCircle size={48} className="text-text-secondary opacity-20" />
                  <div className="space-y-1">
                    <p className="text-text-primary font-bold">No se encontraron productos</p>
                    <p className="text-text-secondary text-sm">Intenta con otra búsqueda o categoría.</p>
                  </div>
                </div>
              )}
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

          {activeTab === 'admin' && isAdminAuthenticated && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Panel de Administración</h2>
                <button 
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    setActiveTab('catalog');
                  }}
                  className="flex items-center gap-2 text-text-secondary hover:text-brand-pink transition-colors font-bold uppercase text-xs tracking-widest"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>

              {/* Add/Edit Product Form */}
              <div className="bg-bg-primary p-6 sm:p-8 rounded-2xl border border-border-main shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {editingProduct ? <Pencil className="text-brand-pink" /> : <Plus className="text-brand-pink" />}
                    {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                  </h3>
                  {editingProduct && (
                    <button 
                      onClick={cancelEdit}
                      className="text-xs font-black text-text-secondary uppercase tracking-widest hover:text-brand-pink flex items-center gap-1"
                    >
                      <X size={14} />
                      Cancelar Edición
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Nombre del Producto</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      placeholder="Ej: Sneaker Urban White"
                      className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Imagen del Producto</label>
                    <div className="flex flex-col gap-4">
                      {newProduct.image && (
                        <img src={newProduct.image} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-border-main" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-bg-secondary file:text-text-primary hover:file:bg-bg-accent transition-all cursor-pointer"
                      />
                      {uploading && <p className="text-[10px] font-bold text-brand-pink animate-pulse">SUBIENDO IMAGEN...</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Categoría</label>
                    <select 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                    >
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Infantil">Infantil</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Promoción / Precio</label>
                    <select 
                      value={newProduct.promo}
                      onChange={e => setNewProduct({...newProduct, promo: e.target.value})}
                      className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                    >
                      {PROMOS.map(p => (
                        <option key={p.id} value={p.id}>{p.label} (${p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Colores (separados por coma)</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.colors}
                      onChange={e => setNewProduct({...newProduct, colors: e.target.value})}
                      placeholder="Blanco, Negro, Beige"
                      className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Talles (separados por coma)</label>
                    <input 
                      required
                      type="text" 
                      value={newProduct.sizes}
                      onChange={e => setNewProduct({...newProduct, sizes: e.target.value})}
                      placeholder="36, 37, 38, 39, 40"
                      className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      type="submit"
                      disabled={uploading}
                      className={cn(
                        "w-full py-5 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95",
                        uploading 
                          ? "bg-brand-pink/40 text-white" 
                          : "bg-[#FF69B4] hover:bg-[#FF1493] text-white" // Stronger pink
                      )}
                    >
                      {uploading ? (
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        editingProduct ? <Save size={24} /> : <Plus size={24} />
                      )}
                      {uploading 
                        ? (editingProduct ? 'Actualizando Producto...' : 'Creando Producto...') 
                        : (editingProduct ? 'Guardar Cambios' : 'Crear Producto')}
                    </button>
                  </div>
                </form>
              </div>

              {/* Manage Existing Products */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-text-primary">Gestionar Catálogo Actual</h3>
                <div className="grid grid-cols-1 gap-4">
                  {products.map(product => (
                    <div key={product.id} className="bg-bg-primary p-4 rounded-xl border border-border-main flex items-center gap-4 shadow-sm hover:border-brand-pink/30 transition-colors">
                      <img src={product.image} alt="" className="w-16 h-16 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-text-primary text-sm sm:text-base">{product.name}</h4>
                        <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-widest font-black">{product.category} • {PROMOS.find(p => p.id === product.promo)?.label}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-3 text-text-secondary hover:text-brand-pink hover:bg-brand-pink/5 transition-all rounded-lg"
                          title="Editar"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(product.id)}
                          className="p-3 text-text-secondary hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Custom Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-2xl font-bold text-sm uppercase tracking-widest flex items-center gap-3",
              notification.type === 'success' ? "bg-green-500 text-white" : "bg-red-500 text-white"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-bg-primary w-full max-w-sm p-8 rounded-3xl border border-border-main shadow-2xl text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">¿Eliminar Producto?</h3>
                <p className="text-text-secondary text-sm">Esta acción no se puede deshacer y el producto desaparecerá del catálogo.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 rounded-xl font-bold text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleDeleteProduct(confirmDelete)}
                  className="flex-1 py-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal Removed - Replaced by Full Screen View */}

      {/* Footer */}
      <footer className="bg-bg-primary border-t border-border-main py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="space-y-3">
            <p className="text-brand-pink font-black text-sm sm:text-base italic">
              * No trabajamos con cambios, por ese motivo es importante medir la plantilla con exactitud.
            </p>
            <p className="text-brand-pink font-black text-sm sm:text-base italic">
              * Como medios de pagos tenemos, transferencias bancarias, depósitos en Abitab o red pagos y mercado pago en hasta 12 cuotas con un pequeño costo adicional.
            </p>
          </div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest pt-4 border-t border-border-main/50">
            © {new Date().getFullYear()} BELLA. TODOS LOS DERECHOS RESERVADOS.
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminLogin(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-bg-primary w-full max-w-md p-8 rounded-3xl border border-border-main shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Acceso Administrativo</h2>
                <p className="text-text-secondary text-sm">Introduce la contraseña para gestionar el catálogo.</p>
              </div>
              <div className="space-y-4">
                <input 
                  type="password" 
                  placeholder="Contraseña"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                  className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all text-center text-xl tracking-widest"
                  autoFocus
                />
                <button 
                  onClick={handleAdminLogin}
                  className="w-full bg-brand-pink text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-brand-pink/90 transition-all"
                >
                  Entrar
                </button>
                <button 
                  onClick={() => setShowAdminLogin(false)}
                  className="w-full text-text-secondary text-xs font-bold uppercase tracking-widest hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
