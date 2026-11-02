import { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode, useRef } from 'react';
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
  Maximize2,
  Trash2,
  Plus,
  Save,
  LogOut,
  Pencil,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Footprints
} from 'lucide-react';
import { cn } from './lib/utils';
import { 
  STORE_NAME, 
  ADMIN_EMAIL,
  PROMOS, 
  FAQ_ITEMS, 
  URUGUAY_DEPARTMENTS,
  SHIPPING_AGENCIES 
} from './constants';
import { supabase } from './lib/supabase';
import { DevConsole } from './components/DevConsole';
import { logInfo, logOk, logWarn } from './lib/logger';

// /mayorista abre el mismo catálogo con la lista de precios mayorista
const IS_WHOLESALE = /\/mayorista\/?$/i.test(window.location.pathname);
// ?debug=1 muestra la consola de registro también fuera del panel
const DEBUG = new URLSearchParams(window.location.search).has('debug');

// --- Components ---

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-text-primary uppercase tracking-tighter">¡Ups! Algo salió mal</h1>
            <p className="text-text-secondary text-sm">
              La aplicación ha encontrado un error inesperado. Por favor, intenta recargar la página.
            </p>
            <pre className="text-[10px] bg-bg-secondary p-4 rounded-lg overflow-auto max-h-40 text-left border border-border-main">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-pink text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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


const SizeReference = ({ cm, onChange }: { cm: string; onChange: (val: string) => void }) => {
  return (
    <div className="relative overflow-hidden space-y-4 p-6 pt-9 bg-bg-primary rounded-xl border border-border-main shadow-inner">
      <span className="absolute top-0 left-0 bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl">
        Obligatorio
      </span>
      <div className="space-y-2">
        <label className="text-[9px] sm:text-[10px] font-black text-text-secondary uppercase tracking-wide sm:tracking-widest block text-center whitespace-nowrap">
          Escribe los centimetros de tu plantilla
        </label>
        <div className="flex justify-center items-center gap-3">
          <div className="w-full max-w-[160px]">
            <input
              type="number"
              min="12"
              max="29"
              step="0.01"
              value={cm}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ej: 24.5"
              className="w-full p-4 rounded-xl bg-bg-secondary border-2 border-brand-pink text-center text-2xl font-black text-brand-pink focus:outline-none focus:ring-4 focus:ring-brand-pink/20 transition-all"
            />
          </div>
          <span className="font-black text-brand-pink text-xl">CM</span>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

// Tabla de talles BR: medidas de plantilla en cm. Una sola fuente, sin duplicar en el JSX.
const BR_TALLES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43'];
const BR_CM = ['23', '23.5', '24 / 24.5', '25', '25.5', '26', '26.5', '27 / 27.5', '28 / 28.5', '28.5 / 29'];

const SizeTable = () => {
  const scroller = useRef<HTMLDivElement>(null);
  const [hayIzq, setHayIzq] = useState(false);
  const [hayDer, setHayDer] = useState(false);
  const drag = useRef({ x: 0, left: 0, activo: false });

  const medir = () => {
    const el = scroller.current;
    if (!el) return;
    setHayIzq(el.scrollLeft > 4);
    setHayDer(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, []);

  const mover = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: 'smooth' });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: '#7A3F4E' }}>
        <Ruler size={14} />
        <span>Guía de Talles</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: '#EBD7D2' }}>
        <div
          ref={scroller}
          onScroll={medir}
          onPointerDown={e => {
            drag.current = { x: e.clientX, left: scroller.current?.scrollLeft ?? 0, activo: true };
            scroller.current?.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            if (!drag.current.activo || !scroller.current) return;
            scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
          }}
          onPointerUp={() => { drag.current.activo = false; }}
          onPointerCancel={() => { drag.current.activo = false; }}
          className="overflow-x-auto select-none cursor-grab active:cursor-grabbing [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-[#FBF4EA] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#F2B8C4]"
          style={{ scrollbarColor: '#F2B8C4 #FBF4EA' }}
        >
          <table className="w-full border-collapse min-w-[620px] text-center">
            <tbody>
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-left whitespace-nowrap border"
                  style={{ backgroundColor: '#F7D6DC', color: '#7A3F4E', borderColor: '#ECCBD2' }}
                >
                  Talle BR
                </th>
                {BR_TALLES.map(t => (
                  <td
                    key={t}
                    className="px-3 py-2 text-[12px] font-black tabular-nums border"
                    style={{ backgroundColor: '#FBF4EA', color: '#5B4033', borderColor: '#E9DAC6' }}
                  >
                    {t}
                  </td>
                ))}
              </tr>
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-left whitespace-nowrap border"
                  style={{ backgroundColor: '#F7D6DC', color: '#7A3F4E', borderColor: '#ECCBD2' }}
                >
                  cm de plantilla
                </th>
                {BR_CM.map((cm, i) => (
                  <td
                    key={`${cm}-${i}`}
                    className="px-3 py-2 text-[12px] font-bold tabular-nums whitespace-nowrap border"
                    style={{ backgroundColor: '#FDF8F1', color: '#5B4033', borderColor: '#E9DAC6' }}
                  >
                    {cm}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {hayIzq && <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F7D6DC] to-transparent" />}
        {hayDer && <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#F7D6DC] to-transparent" />}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => mover(-180)}
          disabled={!hayIzq}
          title="Ver talles anteriores"
          className="p-2 rounded-full border transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default"
          style={{ backgroundColor: '#F7D6DC', borderColor: '#ECCBD2', color: '#7A3F4E' }}
        >
          <ChevronLeft size={16} />
        </button>

        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest" style={{ color: '#7A3F4E' }}>
          <Footprints size={14} />
          Deslizá para ver todos
        </span>

        <button
          type="button"
          onClick={() => mover(180)}
          disabled={!hayDer}
          title="Ver más talles"
          className="p-2 rounded-full border transition-all active:scale-90 disabled:opacity-30 disabled:cursor-default"
          style={{ backgroundColor: '#F7D6DC', borderColor: '#ECCBD2', color: '#7A3F4E' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="text-[10px] font-semibold" style={{ color: '#7A3F4E', opacity: 0.7 }}>
        Medidas de plantilla en centímetros. Ante la duda, elegí medio número más.
      </p>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'info' | 'order' | 'admin'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedPromo, setSelectedPromo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);  const [adminPassword, setAdminPassword] = useState('');
  const [adminCatalog, setAdminCatalog] = useState<'retail' | 'wholesale'>(IS_WHOLESALE ? 'wholesale' : 'retail');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [sizeRange, setSizeRange] = useState({ from: '', to: '' });

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalColor, setModalColor] = useState('');
  const [slide, setSlide] = useState(0);
  const pointerStartX = useRef(0);
  const swipedAt = useRef(0);
  const [modalSize, setModalSize] = useState('');
  const [modalDept, setModalDept] = useState('');
  const [modalAgency, setModalAgency] = useState('');
  const [modalCm, setModalCm] = useState<string>('0');
  const [modalName, setModalName] = useState('');
  const [modalPayment, setModalPayment] = useState('');
  const [modalFullName, setModalFullName] = useState('');
  const [modalID, setModalID] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalPickupLocation, setModalPickupLocation] = useState('');
  const [modalNeighborhood, setModalNeighborhood] = useState('');
  const [modalAddress, setModalAddress] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showSizeRef, setShowSizeRef] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideUrl, setSizeGuideUrl] = useState('');
  const [guideUploading, setGuideUploading] = useState(false);

  const [promoFirstPair, setPromoFirstPair] = useState<any | null>(null);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsAdminAuthenticated(true);
    });
  }, []);

  // Guía de talles: una sola imagen global, guardada en settings. Si la tabla no existe, se ignora.
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'size_guide_url')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setSizeGuideUrl(data.value);
      });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        logInfo('Cargando catálogo');
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
        logOk(`Catálogo cargado: ${(data || []).length} productos`);
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

  // La vista mayorista no se indexa: evita mezclar precios en Google
  useEffect(() => {
    if (!IS_WHOLESALE) return;
    document.title = 'BELLA · Mayorista';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,follow';
    document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    logInfo(`Pestaña: ${activeTab}`, { catálogo: adminCatalog });
  }, [activeTab, adminCatalog]);

  const cmToSize = (cmStr: string) => {    const cm = parseFloat(cmStr);
    if (isNaN(cm)) return '36';
    // Kids range (approximate)
    if (cm < 13.0) return '20';
    if (cm < 13.5) return '21';
    if (cm < 14.0) return '22';
    if (cm < 14.5) return '23';
    if (cm < 15.0) return '24';
    if (cm < 15.5) return '25';
    if (cm < 16.0) return '26';
    if (cm < 16.5) return '27';
    if (cm < 17.0) return '28';
    if (cm < 17.5) return '29';
    if (cm < 18.0) return '30';
    if (cm < 18.5) return '31';
    if (cm < 19.5) return '32';
    if (cm < 20.5) return '33';
    if (cm < 21.5) return '34';
    if (cm < 22.5) return '35';
    
    // Adult range (user provided)
    if (cm < 23.25) return '36';
    if (cm < 24.0) return '37';
    if (cm < 24.75) return '38';
    if (cm < 25.25) return '39';
    if (cm < 25.75) return '40';
    if (cm < 26.25) return '41';
    if (cm < 27.0) return '42';
    if (cm < 28.0) return '43';
    if (cm < 28.75) return '44';
    return '45';
  };

  const handleCmChange = (cm: string) => {
    setModalCm(cm);
  };

  const categories = ['Todos', 'Femenino', 'Masculino', 'Infantil', 'Unisex', 'Deportivos', 'Chanclas'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
      const matchesPromo = !selectedPromo || product.promo === selectedPromo;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = IS_WHOLESALE ? true : !product.wholesale_only;
      return matchesCategory && matchesPromo && matchesSearch && matchesChannel;
    });
  }, [products, selectedCategory, selectedPromo, searchQuery]);

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setModalColor(product.colors[0]);
    setSlide(0);
    setModalSize(product.sizes[0]);
    setModalDept('');
    setModalAgency('');
    setModalCm('0');
    setModalName('');
    setModalPayment('');
    setModalFullName('');
    setModalID('');
    setModalPhone('');
    setModalPickupLocation('');
    setModalNeighborhood('');
    setModalAddress('');
    setShowMap(false);
    setShowSizeRef(false);
    // Scroll to top of product detail
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = async () => {
    logInfo('Intento de acceso al panel');
    if (!supabase) {
      setNotification({ message: 'Supabase no está configurado', type: 'error' });
      return;
    }
    if (!ADMIN_EMAIL) {
      setNotification({ message: 'Falta VITE_ADMIN_EMAIL en .env', type: 'error' });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: adminPassword,
    });

    if (error) {
      console.error('Admin login failed:', error.message);
      setNotification({ message: 'Email o contraseña incorrectos', type: 'error' });
      return;
    }

    setIsAdminAuthenticated(true);
    setShowAdminLogin(false);
    setActiveTab('admin');
    setAdminCatalog(IS_WHOLESALE ? 'wholesale' : 'retail');
    setAdminPassword('');
    logOk('Sesión de administración iniciada');
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
      logOk('Producto eliminado', { id });
    } catch (error) {
      console.error('Error deleting product:', error);
      setNotification({ message: 'Error al eliminar el producto', type: 'error' });
    }
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Femenino',
    promo: 'promo-2990',
    price: '',
    price_wholesale: '',
    wholesale_only: false,
    image: '', // This will store JSON string of images array
    images: [] as {url: string, color: string}[],
    sizes: '36,37,38,39,40'
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    logInfo(`Guardar producto (${editingProduct ? 'edición' : 'nuevo'})`, { nombre: newProduct.name, catálogo: adminCatalog });
    if (newProduct.images.length === 0) {
      setNotification({ message: 'Por favor, sube al menos una imagen para el producto', type: 'error' });
      return;
    }

    try {
      setUploading(true);

      // Extract unique colors from images
      const extractedColors = Array.from(new Set(
        newProduct.images
          .map(img => (img.color || '').trim())
          .filter(color => color !== '')
      ));

      if (extractedColors.length === 0) {
        setNotification({ message: 'Por favor, asigna un color a cada imagen', type: 'error' });
        setUploading(false);
        return;
      }

      const productData: any = {
        name: newProduct.name,
        category: newProduct.category,
        promo: newProduct.promo,
        price: newProduct.price,
        image: JSON.stringify(newProduct.images),
        colors: extractedColors,
        sizes: typeof newProduct.sizes === 'string' ? newProduct.sizes.split(',').map(s => s.trim()) : newProduct.sizes
      };
      // Solo se envía si hay valor: así el admin sigue guardando aunque la columna no exista todavía
      if (newProduct.price_wholesale) productData.price_wholesale = newProduct.price_wholesale;
      // Se manda solo cuando cambia, para que el catálogo normal siga guardando sin la columna
      if (newProduct.wholesale_only !== !!(editingProduct && editingProduct.wholesale_only)) {
        productData.wholesale_only = newProduct.wholesale_only;
      }

      // Si las columnas mayoristas todavía no existen, se guarda sin ellas en vez de fallar
      let savingPayload: any = productData;
      let res = editingProduct
        ? await supabase.from('products').update(savingPayload).eq('id', editingProduct.id)
        : await supabase.from('products').insert([savingPayload]);

      let sinColumnasMayoristas = false;
      if (res.error?.code === '42703') {
        const { price_wholesale, wholesale_only, ...rest } = productData;
        void price_wholesale; void wholesale_only;
        savingPayload = rest;
        sinColumnasMayoristas = true;
        res = editingProduct
          ? await supabase.from('products').update(savingPayload).eq('id', editingProduct.id)
          : await supabase.from('products').insert([savingPayload]);
      }

      if (res.error) throw res.error;

      if (sinColumnasMayoristas) {
        logWarn('Guardado sin precio mayorista: faltan columnas en Supabase');
        setNotification({ message: 'Producto guardado, pero el precio mayorista no: falta crear la columna en Supabase', type: 'error' });
      } else {
        logOk(editingProduct ? 'Producto actualizado' : 'Producto creado', { nombre: newProduct.name });
        if (editingProduct) {
          setNotification({ message: 'Producto actualizado con éxito', type: 'success' });
        } else {
          setNotification({ message: 'Producto creado con éxito', type: 'success' });
        }
      }
      
      cancelEdit();
    } catch (error) {
      console.error('Error saving product:', error);
      setNotification({ message: 'Error al guardar el producto', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (product: any) => {
    let parsedImages = [];
    try {
      parsedImages = JSON.parse(product.image);
      if (!Array.isArray(parsedImages)) parsedImages = [{url: product.image, color: product.colors[0]}];
    } catch (e) {
      parsedImages = [{url: product.image, color: product.colors[0]}];
    }
    // Filas viejas guardan solo [{"url": "..."}]; el input de color no admite undefined.
    parsedImages = parsedImages.map((img: any) => ({ ...img, color: img.color || '' }));

    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      promo: product.promo,
      price: product.price || '',
      price_wholesale: product.price_wholesale || '',
      wholesale_only: !!product.wholesale_only,
      image: product.image,
      images: parsedImages,
      sizes: product.sizes.join(', ')
    });
    // El rango se precarga con el talle más chico y el más grande del producto.
    const nums = product.sizes.map((s: string) => parseInt(s, 10)).filter((n: number) => Number.isFinite(n));
    if (nums.length > 0) setSizeRange({ from: String(Math.min(...nums)), to: String(Math.max(...nums)) });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      category: 'Femenino',
      promo: 'promo-2990',
      price: '',
      price_wholesale: '',
      wholesale_only: false,
      image: '',
      images: [],
      sizes: '36,37,38,39,40'
    });
    setSizeRange({ from: '36', to: '40' });
  };

  const uploadToCloudinary = async (file: File) => {
    // Compresión en el navegador: 800 px máx, JPEG 0.7. Evita crashes en celulares con fotos grandes.
    const compressed = await new Promise<File>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX) { height *= MAX / width; width = MAX; }
          } else if (height > MAX) {
            width *= MAX / height; height = MAX;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => {
            blob ? resolve(new File([blob], file.name, { type: 'image/jpeg' })) : reject(new Error('Error al comprimir imagen'));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = () => reject(new Error('Error al cargar imagen'));
      };
      reader.onerror = () => reject(new Error('Error al leer archivo'));
    });

    const formData = new FormData();
    formData.append('file', compressed);
    formData.append('upload_preset', 'bella_catalogo');

    const response = await fetch('https://api.cloudinary.com/v1_1/nudnxkcm/image/upload', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || 'Cloudinary rechazó la imagen');
    }
    // f_auto → WebP/AVIF según navegador, q_auto + w_700 recorta el peso
    return String(data.secure_url).replace('/upload/', '/upload/f_auto,q_auto,w_700/');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!supabase) {
      setNotification({ message: 'Error: Supabase no está configurado correctamente.', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadToCloudinary(file));
      }
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...urls.map(url => ({ url, color: '' }))]
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setNotification({
        message: `Error al subir: ${error.message || 'Revisa el preset "bella_catalogo"'}`,
        type: 'error'
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSizeGuideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    try {
      setGuideUploading(true);
      const url = await uploadToCloudinary(file);
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'size_guide_url', value: url, updated_at: new Date().toISOString() });
      if (error) throw error;
      setSizeGuideUrl(url);
      setNotification({ message: 'Guía de talles actualizada', type: 'success' });
    } catch (err: any) {
      setNotification({ message: `Error al guardar la guía: ${err.message}`, type: 'error' });
    } finally {
      setGuideUploading(false);
      e.target.value = '';
    }
  };

  // Galería del producto abierto: el índice manda, el color lo acompaña.
  const gallery: { url: string; color?: string }[] = (() => {
    if (!selectedProduct) return [];
    try {
      const parsed = JSON.parse(selectedProduct.image);
      return Array.isArray(parsed) && parsed.length ? parsed : [];
    } catch { return []; }
  })();

  const normColor = (c?: string) => (c || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const goToSlide = (i: number) => {
    if (gallery.length === 0) return;
    const next = (i + gallery.length) % gallery.length;
    setSlide(next);
    setModalColor((gallery[next]?.color || '').trim());
  };

  const getProductImage = (product: any, color: string) => {
    if (!product) return '';
    try {
      const images = JSON.parse(product.image);
      if (Array.isArray(images)) {
        const matched = images.find((img: any) => normColor(img.color) === normColor(color));
        return matched ? matched.url : images[0].url;
      }
    } catch (e) {
      // Not a JSON string, return as is
    }
    return product.image;
  };

  // WhatsApp no adjunta imágenes por link de texto, pero sí dibuja la foto si la URL es un jpg directo
  // (f_auto devuelve webp y el preview queda sin miniatura)
  const getShareImage = (product: any, color: string) =>
    getProductImage(product, color).replace('/f_auto,', '/f_jpg,');

  // Precio según la lista que se está viendo: minorista en /, mayorista en /mayorista
  // El mayorista se guarda como "1450/1290/1245": 1-10, 11-20 y 21-30 pares
  const wholesaleTiers = (p: any) =>
    String(p?.price_wholesale || '').split('/').map((s: string) => s.trim()).filter(Boolean);
  const priceOf = (p: any) =>
    IS_WHOLESALE ? (wholesaleTiers(p)[0] || '') : (p?.price || '');

  const handleNextPair = () => {
    if (!modalColor || !modalSize) {
      setNotification({ message: 'Por favor, elige color y talle', type: 'error' });
      return;
    }
    if (!modalCm || modalCm === '0' || parseFloat(modalCm) <= 0) {
      setNotification({ message: 'Los centímetros de plantilla son obligatorios', type: 'error' });
      return;
    }
    setPromoFirstPair({
      product: selectedProduct,
      color: modalColor,
      size: modalSize,
      cm: modalCm
    });
    setSelectedProduct(null);
    setNotification({ message: '¡Primer par guardado! Ahora elige el segundo.', type: 'success' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Texto exacto que se envía por WhatsApp; el preview y el handler usan la misma fuente
  const orderMessage = useMemo(() => {
    if (!selectedProduct) return '';
    const val = (v?: string | null) => (v && v.trim() ? v.trim() : '—');
    const isRivera = modalDept.trim().toLowerCase() === 'rivera';

    let shippingData = `👤 *Nombre y Apellido:* ${val(modalFullName)}\n`;
    if (isRivera) {
      shippingData += `🏘️ *Barrio:* ${val(modalNeighborhood)}\n🏠 *Dirección:* ${val(modalAddress)}`;
    } else {
      shippingData += `🆔 *Cédula:* ${val(modalID)}\n📞 *Teléfono:* ${val(modalPhone)}\n🏢 *Lugar de retiro:* ${val(modalPickupLocation)}`;
    }

    let productDetails = '';
    let totalValue = '';

    if (promoFirstPair) {
      const promo = PROMOS.find(p => p.id === selectedPromo);
      totalValue = promo ? String(promo.price) : '';
      productDetails = `
🔗 *Link 1:* ${getShareImage(promoFirstPair.product, promoFirstPair.color)}
🔗 *Link 2:* ${getShareImage(selectedProduct, modalColor)}

⭐ *${promo?.title || 'Promo'}* ⭐

1️⃣ *Par 1:* ${promoFirstPair.product.name}
🎨 *Color:* ${val(promoFirstPair.color)}
📏 *Numero:* ${val(promoFirstPair.size)} BR
📏 *CM plantilla:* ${val(promoFirstPair.cm)}

2️⃣ *Par 2:* ${selectedProduct.name}
🎨 *Color:* ${val(modalColor)}
📏 *Numero:* ${val(modalSize)} BR
📏 *CM plantilla:* ${val(modalCm)}
`;
    } else {
      totalValue = priceOf(selectedProduct);
      productDetails = `
🔗 *Link:* ${getShareImage(selectedProduct, modalColor)}

📌 *Producto:* ${selectedProduct.name}
🎨 *Color:* ${val(modalColor)}
📏 *Numero:* ${val(modalSize)} BR
📏 *CM plantilla:* ${val(modalCm)}
${IS_WHOLESALE && wholesaleTiers(selectedProduct).length > 1
  ? `💰 *Escala por cantidad:* ${wholesaleTiers(selectedProduct).map((v: string, i: number) => `${['1-10', '11-20', '21-30'][i]} $${v}`).join(' · ')}`
  : ''}
`;
    }

    return `${IS_WHOLESALE ? '¡Hola BELLA! Quiero un pedido mayorista:' : '¡Hola BELLA! Quiero realizar este pedido:'}
${productDetails}
📍 *Destino:* ${val(modalDept)}
${isRivera ? '' : `🚚 *Agencia:* ${val(modalAgency)}\n`}
📦 *Datos de Envío:*
${shippingData}

💳 *Método de Pago:* ${val(modalPayment)}

💰 *${IS_WHOLESALE ? 'Precio unitario' : 'Valor total a pagar'}:* $${totalValue}

¿Cómo procedo con el pago?`;
  }, [
    modalDept, modalAgency, modalPayment, modalFullName, modalNeighborhood,
    modalAddress, modalID, modalPhone, modalPickupLocation,
    promoFirstPair, selectedPromo, selectedProduct, modalColor, modalSize, modalCm,
  ]);

  const handleWhatsAppOrder = () => {
    if (!modalDept) {
      setNotification({ message: 'Por favor, selecciona un departamento de destino', type: 'error' });
      setShowMap(true);
      return;
    }

    const isRivera = modalDept.toLowerCase() === 'rivera';

    if (!isRivera && !modalAgency) {
      setNotification({ message: 'Por favor, selecciona una agencia de envío', type: 'error' });
      return;
    }

    if (!modalPayment) {
      setNotification({ message: 'Por favor, selecciona un método de pago', type: 'error' });
      return;
    }

    if (!modalFullName) {
      setNotification({ message: 'Por favor, ingresa tu nombre y apellido', type: 'error' });
      return;
    }

    if (!modalCm || modalCm === '0' || parseFloat(modalCm) <= 0) {
      setNotification({ message: 'Los centímetros de plantilla son obligatorios', type: 'error' });
      return;
    }

    logInfo('Pedido enviado a WhatsApp', { producto: selectedProduct.name, total: orderMessage.match(/Valor total a pagar:\*\* \$(\d+)/)?.[1] ?? '—' });
    window.open(`https://wa.me/59895149966?text=${encodeURIComponent(orderMessage)}`, '_blank');
    setPromoFirstPair(null);
  };

  const handleWhatsAppGeneral = () => {
    const text = "Hola BELLA! Quisiera más información sobre el catálogo.";
    window.open(`https://wa.me/59895149966?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (selectedProduct) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-bg-primary flex flex-col">
        {/* Detail Header */}
        <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setPromoFirstPair(null);
                  setSelectedPromo(null);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border-main text-text-secondary hover:text-brand-pink hover:border-brand-pink transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
              </button>
              <h1 className="text-xl font-bold tracking-tighter text-brand-pink">{STORE_NAME}</h1>
            </div>
          </div>
        </header>

        <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Image Section */}
            <div className="lg:w-1/2 space-y-4">
              <h2 className="text-4xl font-black text-text-primary leading-tight text-center">{selectedProduct.name}</h2>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onPointerDown={e => {
                    // el mouse no arrastra: un clic abre el zoom
                    if (e.pointerType === 'mouse') return;
                    pointerStartX.current = e.clientX;
                  }}
                  onPointerUp={e => {
                    if (e.pointerType === 'mouse') return;
                    const dx = e.clientX - pointerStartX.current;
                    if (Math.abs(dx) > 45 && gallery.length > 1) {
                      swipedAt.current = Date.now();
                      goToSlide(slide + (dx < 0 ? 1 : -1));
                    }
                  }}
                  onClick={() => {
                    // un desliz también emite click: lo ignoramos solo si acaba de pasar
                    if (Date.now() - swipedAt.current < 350) return;
                    setZoomOpen(true);
                  }}
                  className="aspect-square rounded-[1.5rem] overflow-hidden shadow-2xl border border-border-main bg-brand-pink/15 relative select-none cursor-zoom-in"
                >
                  <img 
                    src={gallery[slide]?.url || getProductImage(selectedProduct, modalColor)} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading="eager"
                    referrerPolicy="no-referrer"
                  />
                  {/* precarga la siguiente para que el desliz no parpadee */}
                  {gallery.length > 1 && (
                    <img src={gallery[(slide + 1) % gallery.length].url} alt="" className="hidden" referrerPolicy="no-referrer" />
                  )}

                  <span className="absolute top-0 left-0 bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl">
                    Stock Disponible
                  </span>

                  <span className="absolute bottom-3 left-3 bg-black/45 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                    {gallery[slide]?.color || 'Principal'}{gallery.length > 1 ? ` · ${slide + 1}/${gallery.length}` : ''}
                  </span>

                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        title="Anterior"
                        onClick={e => { e.stopPropagation(); goToSlide(slide - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/85 text-text-primary rounded-full p-2.5 shadow-lg hover:bg-white transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        title="Siguiente"
                        onClick={e => { e.stopPropagation(); goToSlide(slide + 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/85 text-text-primary rounded-full p-2.5 shadow-lg hover:bg-white transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </motion.div>

                {/* Todos los colores a la vista */}
                {gallery.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {gallery.map((img, i) => (
                      <button
                        key={`${img.url}-${i}`}
                        onClick={() => goToSlide(i)}
                        title={img.color || 'Sin color'}
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 bg-brand-pink/10 transition-all",
                          i === slide ? "border-brand-pink shadow-lg scale-105" : "border-border-main opacity-70 hover:opacity-100"
                        )}
                      >
                        <img src={img.url} alt={img.color || ''} loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
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
                <div className="flex flex-wrap gap-2">
                  {selectedPromo && !IS_WHOLESALE && (
                    <div className="inline-block bg-brand-pink text-white px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-pink/10">
                      <span>{PROMOS.find(p => p.id === selectedProduct.promo)?.title}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">Color seleccionado</span>
                  <span className="text-2xl font-black text-text-primary">
                    {modalColor?.trim() || gallery[slide]?.color?.trim() || 'Elegí una foto'}
                  </span>
                </div>
                {!selectedPromo && (priceOf(selectedProduct) || IS_WHOLESALE) && (
                  <div className="mt-8 flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-[#F2E4DC] border border-[#E8D2C6]">
                    <span className="text-xs font-black uppercase tracking-widest text-brand-pink">
                      {IS_WHOLESALE ? 'Precio mayorista' : 'Precio'}
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {priceOf(selectedProduct) ? `${IS_WHOLESALE ? 'desde ' : ''}$${priceOf(selectedProduct)}` : 'Consultar'}
                    </span>
                  </div>
                )}
                {IS_WHOLESALE && !selectedPromo && wholesaleTiers(selectedProduct).length > 1 && (
                  <div className="mt-3 space-y-1 rounded-xl bg-[#F2E4DC]/60 border border-[#E8D2C6] px-5 py-3">
                    {['1 a 10 pares', '11 a 20 pares', '21 a 30 pares'].slice(0, wholesaleTiers(selectedProduct).length).map((tramo, i) => (
                      <div key={tramo} className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{tramo}</span>
                        <span className="text-sm font-black text-text-primary">${wholesaleTiers(selectedProduct)[i]} c/u</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guía de talles */}
              <SizeTable />

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                    <Maximize2 size={14} />
                    <span>Seleccionar Talle</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {selectedProduct.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setModalSize(size)}
                      className={cn(
                        "w-full h-14 rounded-lg text-sm font-black transition-all border-2 flex items-center justify-center",
                        modalSize === size 
                          ? "bg-brand-pink text-white border-brand-pink shadow-xl shadow-brand-pink/10 scale-105" 
                          : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                      )}
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span>{size}</span>
                        <span className="text-[8px] opacity-70 mt-0.5">BR</span>
                      </div>
                    </button>
                  ))}
                </div>

                  <div className="pt-2">
                    <SizeReference cm={modalCm} onChange={handleCmChange} />
                  </div>

                  {sizeGuideUrl && (
                    <button
                      type="button"
                      onClick={() => setShowSizeRef(true)}
                      className="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-brand-pink/50 text-brand-pink text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Ruler size={14} />
                      Ver guía de talles
                    </button>
                  )}
                </div>

              {/* Destination Selection */}
              {(!selectedPromo || promoFirstPair) && (
                <div className="space-y-4">
                  {(!modalDept || showMap) && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                      <MapPin size={14} />
                      <span>Destino del Envío</span>
                      <ArrowRight size={14} className="text-brand-pink ml-1" strokeWidth={3} />
                    </div>
                    <button 
                      onClick={() => setShowMap(!showMap)}
                      className="bg-brand-pink text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-pink/25 flex flex-col items-stretch justify-center leading-tight min-w-[7.5rem]"
                    >
                      {showMap
                        ? <><span className="block w-full text-center">Mapa</span><span className="block w-full text-center">Cerrar</span></>
                        : <><span className="block w-full text-center">Elegir</span><span className="block w-full text-center">Departamento</span></>}
                    </button>
                  </div>
                  )}
                  
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
              )}

              {/* Order Details Container */}
              {(!selectedPromo || promoFirstPair) && (
                <div className="p-6 bg-bg-secondary rounded-2xl border border-border-main space-y-8 shadow-sm">
                  {/* Shipping Agency Selection */}
                  {modalDept.toLowerCase() !== 'rivera' && (
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
                  )}

                  {/* Shipping Data */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                      <User size={14} />
                      <span>Datos de envío</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Nombre y apellido</label>
                        <input 
                          type="text" 
                          value={modalFullName}
                          onChange={e => setModalFullName(e.target.value)}
                          placeholder="Tu nombre completo"
                          className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                        />
                      </div>

                      {modalDept.toLowerCase() === 'rivera' ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Barrio</label>
                            <input 
                              type="text" 
                              value={modalNeighborhood}
                              onChange={e => setModalNeighborhood(e.target.value)}
                              placeholder="Tu barrio"
                              className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Dirección</label>
                            <input 
                              type="text" 
                              value={modalAddress}
                              onChange={e => setModalAddress(e.target.value)}
                              placeholder="Calle y número de puerta"
                              className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Cédula</label>
                            <input 
                              type="text" 
                              value={modalID}
                              onChange={e => setModalID(e.target.value)}
                              placeholder="Tu número de CI"
                              className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Teléfono</label>
                            <input 
                              type="tel" 
                              value={modalPhone}
                              onChange={e => setModalPhone(e.target.value)}
                              placeholder="Tu número de contacto"
                              className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Lugar de retiro</label>
                            <input 
                              type="text" 
                              value={modalPickupLocation}
                              onChange={e => setModalPickupLocation(e.target.value)}
                              placeholder="Agencia o punto de retiro"
                              className="w-full p-4 rounded-xl bg-bg-primary border border-border-main focus:border-brand-pink outline-none transition-all"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-secondary uppercase text-[10px] font-black tracking-widest">
                      <CreditCard size={14} />
                      <span>¿Cómo le gustaría realizar el pago?</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {(modalDept.toLowerCase() === 'rivera' 
                        ? ['Transferencia', 'Mercado Pago en hasta 12 cuotas con recargo', 'Efectivo']
                        : [
                            'Transferencia', 
                            'Depósito Abitab/red pagos', 
                            'Mercado Pago en hasta 12 cuotas con recargo', 
                            'Efectivo únicamente en la ciudad de Rivera'
                          ]
                      ).map((method) => (
                        <button
                          key={method}
                          onClick={() => setModalPayment(method)}
                          className={cn(
                            "p-4 rounded-xl text-xs font-bold text-left transition-all border-2",
                            modalPayment === method 
                              ? "bg-brand-pink text-white border-brand-pink shadow-lg" 
                              : "bg-bg-primary text-text-secondary border-border-main hover:border-brand-pink"
                          )}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview del mensaje de WhatsApp */}
              {(!selectedPromo || promoFirstPair) && (
                <div className="p-5 rounded-2xl border border-[#CFE8C4] bg-[#F3FAF0] shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-[#3E6B34] uppercase text-[10px] font-black tracking-widest">
                    <MessageCircle size={14} />
                    <span>Así se verá tu mensaje</span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#DCF8C6] border border-[#C5E9B0] p-4 text-[13px] leading-relaxed text-[#1F2C1A] whitespace-pre-wrap break-words">
                    {orderMessage}
                  </div>
                  <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest text-center">
                    Revisá los datos antes de enviar
                  </p>
                </div>
              )}

              {/* Promo Summary if applicable */}
              {promoFirstPair && (
                <div className="p-4 bg-brand-pink/10 rounded-2xl border-2 border-brand-pink border-dashed space-y-3">
                  <p className="text-[10px] font-black text-brand-pink uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag size={14} />
                    <span>Primer par seleccionado</span>
                  </p>
                  <div className="flex gap-4 items-center">
                    <img 
                      src={getProductImage(promoFirstPair.product, promoFirstPair.color)} 
                      alt="" 
                      className="w-16 h-16 object-cover rounded-lg border border-brand-pink/20"
                      loading="lazy"
                    />
                    <div>
                      <p className="font-bold text-text-primary text-sm">{promoFirstPair.product.name}</p>
                      <p className="text-xs text-text-secondary">{promoFirstPair.color} | Talle {promoFirstPair.size} BR</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Order Button */}
              {selectedPromo && !promoFirstPair ? (
                <button 
                  onClick={handleNextPair}
                  className="w-full bg-brand-pink text-white py-6 rounded-[1.25rem] text-xl font-black flex items-center justify-center gap-4 hover:bg-text-primary transition-all shadow-2xl shadow-brand-pink/10 active:scale-95 group"
                >
                  <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                  SIGUIENTE PAR
                </button>
              ) : (
                <button 
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-text-primary text-bg-primary py-6 rounded-[1.25rem] text-xl font-black flex items-center justify-center gap-4 hover:bg-brand-pink hover:text-white transition-all shadow-2xl shadow-brand-pink/10 active:scale-95 group"
                >
                  <ShoppingBag size={28} className="group-hover:rotate-12 transition-transform" />
                  ¡LO QUIERO!
                </button>
              )}
            </div>
          </div>
        </main>

        <footer className="bg-bg-primary border-t border-border-main py-12 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">BELLA URUGUAY</p>
          </div>
        </footer>

        {/* Zoom de la foto */}
        {zoomOpen && (
          <div
            onClick={() => setZoomOpen(false)}
            className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute top-4 right-4 bg-white/15 text-white rounded-full p-3 hover:bg-white/25 transition-colors"
              title="Cerrar"
            >
              <X size={22} />
            </button>
            <img
              src={gallery[slide]?.url || getProductImage(selectedProduct, modalColor)}
              alt={selectedProduct.name}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            {gallery.length > 1 && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); goToSlide(slide - 1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/15 text-white rounded-full p-3 hover:bg-white/25 transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); goToSlide(slide + 1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/15 text-white rounded-full p-3 hover:bg-white/25 transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Guía de talles */}
        {showSizeRef && sizeGuideUrl && (
          <div
            onClick={() => setShowSizeRef(false)}
            className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4"
          >
            <div className="max-w-3xl w-full max-h-full overflow-auto rounded-2xl bg-white p-2">
              <div className="flex justify-end">
                <button onClick={() => setShowSizeRef(false)} className="p-2 text-text-secondary hover:text-brand-pink" title="Cerrar">
                  <X size={20} />
                </button>
              </div>
              <img src={sizeGuideUrl} alt="Guía de talles" className="w-full rounded-xl" />
            </div>
          </div>
        )}
      </div>
      </ErrorBoundary>
    );
  }

  const isAdminPanel = activeTab === 'admin' && isAdminAuthenticated;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-between items-center h-16">
            <div className={cn("flex items-center gap-2", isAdminPanel && "absolute left-1/2 -translate-x-1/2")}>
              <h1 
                className="text-2xl font-bold tracking-tighter text-brand-pink cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                onClick={() => {
                  setAdminCatalog(IS_WHOLESALE ? 'wholesale' : 'retail');
                  if (isAdminAuthenticated) {
                    setActiveTab('admin');
                  } else {
                    setShowAdminLogin(true);
                  }
                }}
              >
                {isAdminPanel ? (
                  <span className="inline-flex items-baseline justify-center gap-2">
                    <span>{STORE_NAME}</span>
                    <span className="font-bold uppercase">Administradora</span>
                  </span>
                ) : (
                  <span className="inline-flex items-baseline gap-2">
                    <span>{STORE_NAME}</span>
                    {IS_WHOLESALE && <span className="font-black uppercase tracking-widest">Mayorista</span>}
                  </span>
                )}
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
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isAdminPanel && (
          <div className="max-w-2xl mx-auto mb-4">
            <button 
              onClick={async () => {
                await supabase?.auth.signOut();
                setIsAdminAuthenticated(false);
                setActiveTab('catalog');
              }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-bg-primary border-2 border-border-main shadow-xl shadow-brand-pink/10 text-text-secondary hover:text-brand-pink hover:border-brand-pink text-lg font-black uppercase tracking-widest transition-all"
            >
              <LogOut size={20} />
              Cerrar Sesión
            </button>
          </div>
        )}
        {/* Precios mayoristas */}
        {IS_WHOLESALE && !isAdminPanel && (
          <section className="mb-8 rounded-2xl border-2 border-brand-pink/40 bg-brand-pink/10 p-5 sm:p-6 space-y-4">
            <p className="text-brand-pink font-black uppercase tracking-[0.25em] text-xs text-center">Catálogo mayorista</p>
            <div className="space-y-2 text-left text-text-primary text-sm sm:text-base font-bold leading-relaxed">
              <p>1. En la primera compra, el mínimo es de 3 pares para acceder a precios especiales.</p>
              <p>2. A partir de la segunda compra, podés llevar desde 1 par.</p>
            </div>
          </section>
        )}

        {/* Search Bar Above Promos */}
        {!isAdminPanel && (
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-brand-pink transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="¿Qué calzado estás buscando hoy?"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory('Todos');
                setActiveTab('catalog');
              }}
              className="w-full pl-12 pr-6 py-4 rounded-full bg-bg-primary border-2 border-border-main shadow-xl shadow-brand-pink/10 focus:outline-none focus:border-brand-pink text-lg transition-all placeholder:text-text-secondary/50 text-text-primary"
            />
          </div>
        </div>
        )}

        {/* Hero / Promos */}
        {!isAdminPanel && !IS_WHOLESALE && (
        <section className="mb-12">
          <div className="text-center mb-6">
            <p className="text-sm sm:text-lg font-black text-brand-pink uppercase tracking-tighter leading-tight">
              Haz clic en la imagen y selecciona
              <br />
              tu combo favorito.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8">
            {PROMOS.filter(p => !p.hideBanner).map((promo) => {
              return (
                <motion.div 
                  key={promo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedPromo(selectedPromo === promo.id ? null : promo.id);
                    setPromoFirstPair(null); // Reset promo selection when switching promos
                    setActiveTab('catalog');
                    setTimeout(() => {
                      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
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
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'catalog' && (
            <motion.div
              ref={catalogRef}
              key="catalog"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Filters */}
              {!searchQuery && (
              <div className="space-y-2">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  const look = {
                    Todos: {
                      bar: "bg-gradient-to-r from-brand-pink/35 via-brand-pink/12 to-transparent border-brand-pink/60",
                      stripe: "bg-brand-pink",
                      halo: "bg-brand-pink/40",
                    },
                    Femenino: {
                      bar: "bg-white border-rose-200",
                      stripe: "bg-rose-400",
                      halo: "bg-rose-200/70",
                    },
                    Masculino: {
                      bar: "bg-gradient-to-r from-brand-beige to-[#FBFBF0] border-[#E0D6AE]",
                      stripe: "bg-[#C9B96A]",
                      halo: "bg-[#E8DFB8]/80",
                    },
                    Infantil: {
                      bar: "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300 border-dashed",
                      stripe: "bg-amber-400",
                      halo: "bg-amber-200/80",
                    },
                    Unisex: {
                      bar: "bg-gradient-to-r from-[#FFE7EE] to-white border-brand-pink/40",
                      stripe: "bg-brand-pink/80",
                      halo: "bg-brand-pink/30",
                    },
                    Deportivos: {
                      bar: "bg-gradient-to-r from-sky-100 to-sky-50 border-sky-300",
                      stripe: "bg-sky-400",
                      halo: "bg-sky-200/80",
                    },
                    Chanclas: {
                      bar: "bg-gradient-to-r from-violet-100 to-violet-50 border-violet-300",
                      stripe: "bg-violet-400",
                      halo: "bg-violet-200/80",
                    },
                  }[cat] ?? { bar: "bg-bg-secondary border-border-main", stripe: "bg-brand-pink", halo: "bg-transparent" };

                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "group relative w-full flex items-center justify-center px-4 py-2.5 rounded-xl border overflow-hidden text-center transition-all hover:shadow-md hover:-translate-y-px shadow-sm",
                        look.bar
                      )}
                    >
                      <span className={cn("absolute inset-y-0 left-0 w-1.5", look.stripe)} />
                      <span className={cn("absolute -right-8 -top-10 w-28 h-28 rounded-full blur-2xl opacity-70 transition-opacity group-hover:opacity-100", look.halo)} />
                      {active && (
                        <motion.span
                          layoutId="category-frame"
                          className="absolute inset-0 rounded-xl border-2 border-brand-pink shadow-[0_0_0_4px_rgba(255,182,193,0.18)]"
                          transition={{ type: "spring", stiffness: 520, damping: 42 }}
                        />
                      )}
                      <span className={cn(
                        "relative text-xs font-black uppercase tracking-widest transition-colors",
                        active ? "text-text-primary" : "text-text-primary/75 group-hover:text-text-primary"
                      )}>
                        {cat}
                      </span>
                    </button>
                  );
                })}
                {selectedPromo && (
                  <button
                    onClick={() => setSelectedPromo(null)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-2 border-dashed border-brand-pink/40 text-brand-pink hover:bg-brand-pink/5 transition-colors"
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      Promo: {PROMOS.find(p => p.id === selectedPromo)?.label}
                    </span>
                    <X size={14} />
                  </button>
                )}
              </div>
              )}

              {/* Product Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">Cargando catálogo...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={cn(
                  "grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 rounded-2xl transition-colors duration-500",
                  selectedPromo && "bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.10),transparent_65%)] p-2 sm:p-3"
                )}>
                  {filteredProducts.map((product) => {
                    const promoLabel = PROMOS.find(p => p.id === product.promo)?.label;
                    const isPremium = promoLabel === 'Premium';
                    
                    return (
                      <motion.div
                        key={`${selectedCategory}-${product.id}`}
                        initial={{ rotateY: 180 }}
                        animate={{ rotateY: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{ transformPerspective: 900, transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                        className={cn(
                          "group relative bg-bg-primary rounded-xl overflow-hidden border transition-shadow duration-300",
                          selectedPromo
                            ? "border-[#D4AF37]/60 shadow-[0_0_18px_rgba(212,175,55,0.28)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]"
                            : "border-border-main shadow-sm hover:shadow-xl"
                        )}
                      >
                        {selectedPromo && (
                          <span className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,215,120,0.22),transparent_65%)]" />
                        )}
                        <div className="aspect-square overflow-hidden relative bg-brand-pink/15">
                          <img 
                            src={(() => {
                              try {
                                const imgs = JSON.parse(product.image);
                                return Array.isArray(imgs) ? imgs[0].url : product.image;
                              } catch (e) {
                                return product.image;
                              }
                            })()} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        
                        {/* Category Bar */}
                        {!IS_WHOLESALE && (
                        <div className={cn(
                          "py-1 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white",
                          isPremium 
                            ? "bg-gradient-to-r from-[#B8860B] via-[#FFD700] to-[#B8860B] text-black shadow-inner" // Gold/Dorado
                            : "bg-gradient-to-r from-[#71706E] via-[#E5E4E2] to-[#71706E] text-black shadow-inner" // Platinum/Silver/Platino
                        )}>
                          {promoLabel}
                        </div>
                        )}

                        <div className="p-4 sm:p-6">
                          <p className="text-[10px] font-bold text-brand-pink uppercase tracking-widest mb-1">{product.category}</p>
                          <div className="mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-text-primary leading-tight mb-1">{product.name}</h3>
                            {(priceOf(product) || IS_WHOLESALE) && (
                              <div className="text-brand-pink font-black text-xl">
                                {priceOf(product) ? `${IS_WHOLESALE ? 'desde ' : ''}$${priceOf(product)}` : 'Consultar'}
                              </div>
                            )}
                          </div>
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

          {isAdminPanel && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Pestañas de catálogo */}
              <div className="flex gap-2 p-1.5 bg-bg-secondary rounded-2xl border border-border-main">
                {(['retail', 'wholesale'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setAdminCatalog(c)}
                    className={cn(
                      "flex-1 py-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all",
                      adminCatalog === c
                        ? "bg-brand-pink text-white shadow-lg shadow-brand-pink/20"
                        : "text-text-secondary hover:text-brand-pink"
                    )}
                  >
                    {c === 'retail' ? 'BELLA' : 'BELLA MAYORISTA'}
                  </button>
                ))}
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
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Imágenes del Producto (Sube una por cada color)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {newProduct.images.map((img, idx) => (
                        <div key={idx} className="relative group bg-bg-secondary rounded-xl border border-border-main p-2 space-y-2">
                          <img src={img.url} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-lg" />
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 bg-[#D4AF37] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow">
                              Portada
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const imgs = [...newProduct.images];
                                const [elegida] = imgs.splice(idx, 1);
                                setNewProduct({ ...newProduct, images: [elegida, ...imgs] });
                              }}
                              className="absolute top-1 left-1 bg-white/90 text-text-secondary hover:text-[#B8952E] hover:bg-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow transition-colors"
                              title="Usar como portada"
                            >
                              Portada
                            </button>
                          )}
                          <input 
                            type="text"
                            placeholder="Color"
                            value={img.color}
                            onChange={(e) => {
                              const newImages = [...newProduct.images];
                              newImages[idx].color = e.target.value;
                              setNewProduct({ ...newProduct, images: newImages });
                            }}
                            className="w-full p-2 text-[10px] rounded bg-bg-primary border border-border-main outline-none focus:border-brand-pink"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImages = newProduct.images.filter((_, i) => i !== idx);
                              setNewProduct({ ...newProduct, images: newImages });
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full shadow-xl hover:bg-red-700 transition-all z-10"
                            title="Quitar imagen"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-border-main flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-pink hover:bg-brand-pink/5 transition-all text-text-secondary hover:text-brand-pink">
                        <Plus size={24} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Subir Fotos</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploading && (
                      <p key="uploading-status" className="text-[10px] font-bold text-brand-pink animate-pulse">
                        <span>SUBIENDO IMAGEN...</span>
                      </p>
                    )}
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
                      <option value="Deportivos">Deportivos</option>
                      <option value="Chanclas">Chanclas</option>
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
                        <option key={p.id} value={p.id}>{p.label}{p.price > 0 ? ` ($${p.price})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  {adminCatalog === 'wholesale' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Precio Mayorista (1-10 / 11-20 / 21-30)</label>
                      <input 
                        type="text" 
                        value={newProduct.price_wholesale}
                        onChange={e => setNewProduct({...newProduct, price_wholesale: e.target.value})}
                        placeholder="Ej: 1450/1290/1245"
                        className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Precio Individual (Opcional)</label>
                      <input 
                        type="text" 
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                        placeholder="Ej: 1500"
                        className="w-full p-4 rounded-xl bg-bg-secondary border border-border-main focus:border-brand-pink outline-none transition-all"
                      />
                    </div>
                  )}
                  <label className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-border-main bg-bg-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.wholesale_only}
                      onChange={e => setNewProduct({...newProduct, wholesale_only: e.target.checked})}
                      className="w-5 h-5 accent-brand-pink"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                      Solo mayorista — no aparece en bellacatalogo.com
                    </span>
                  </label>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Talles</label>
                    {(() => {
                      const from = parseInt(sizeRange.from, 10);
                      const to = parseInt(sizeRange.to, 10);
                      const list = Number.isFinite(from) && Number.isFinite(to) && to >= from && to - from <= 30
                        ? Array.from({ length: to - from + 1 }, (_, i) => String(from + i))
                        : [];
                      const guardados = String(newProduct.sizes || '').split(',').map(s => s.trim()).filter(Boolean);
                      return (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-dashed border-brand-pink/50 bg-brand-pink/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">Del</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={sizeRange.from}
                              onChange={e => setSizeRange({ ...sizeRange, from: e.target.value })}
                              placeholder="34"
                              className="w-16 p-2 text-center rounded-lg bg-white border border-border-main focus:border-brand-pink outline-none text-sm font-bold"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">al</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={sizeRange.to}
                              onChange={e => setSizeRange({ ...sizeRange, to: e.target.value })}
                              placeholder="40"
                              className="w-16 p-2 text-center rounded-lg bg-white border border-border-main focus:border-brand-pink outline-none text-sm font-bold"
                            />
                            <button
                              type="button"
                              disabled={list.length === 0}
                              onClick={() => setNewProduct({ ...newProduct, sizes: list.join(', ') })}
                              className="ml-auto px-3 py-2 rounded-lg bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                              Aplicar
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {guardados.length > 0 ? guardados.map((s, i) => (
                              <button
                                key={`${s}-${i}`}
                                type="button"
                                title="Quitar talle"
                                onClick={() => setNewProduct({ ...newProduct, sizes: guardados.filter((_, k) => k !== i).join(', ') })}
                                className="group/talle px-3 py-1.5 rounded-lg bg-bg-secondary border border-border-main text-xs font-black text-text-primary tabular-nums hover:border-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                              >
                                {s}
                                <X size={10} className="opacity-40 group-hover/talle:opacity-100" />
                              </button>
                            )) : (
                              <span className="text-xs font-semibold text-text-secondary/70">Elegí el rango y tocá Aplicar.</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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
                        <div key="spinner" className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        editingProduct ? <Save key="save-icon" size={24} /> : <Plus key="plus-icon" size={24} />
                      )}
                      <span key="button-text">
                        {uploading 
                          ? (editingProduct ? 'Actualizando Producto...' : 'Creando Producto...') 
                          : (editingProduct ? 'Guardar Cambios' : 'Crear Producto')}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Guía de talles */}
              <div className="bg-bg-primary p-6 sm:p-8 rounded-2xl border border-border-main shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Ruler className="text-brand-pink" />
                  Guía de Talles
                </h3>
                <p className="text-xs text-text-secondary">Imagen que ve el cliente al tocar "Ver guía de talles" en cada producto.</p>
                <div className="flex flex-wrap items-center gap-4">
                  {sizeGuideUrl ? (
                    <img src={sizeGuideUrl} alt="Guía de talles" className="h-28 rounded-xl border border-border-main object-contain bg-white" />
                  ) : (
                    <span className="text-xs font-black uppercase tracking-widest text-text-secondary/60">Sin imagen cargada</span>
                  )}
                  <label className="px-5 py-3 rounded-xl bg-brand-pink text-white text-[10px] font-black uppercase tracking-widest cursor-pointer hover:opacity-90 transition-opacity">
                    {guideUploading ? 'Subiendo...' : (sizeGuideUrl ? 'Cambiar imagen' : 'Subir imagen')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={guideUploading}
                      onChange={handleSizeGuideUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Manage Existing Products */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-text-primary">Gestionar Catálogo Actual</h3>
                <div className="grid grid-cols-1 gap-4">
                  {products
                    .filter(product => adminCatalog === 'wholesale' ? true : !product.wholesale_only)
                    .map(product => (
                    <div key={product.id} className="bg-bg-primary p-4 rounded-xl border border-border-main flex items-center gap-4 shadow-sm hover:border-brand-pink/30 transition-colors">
                      <img src={getProductImage(product, product.colors?.[0])} alt="" loading="lazy" className="w-16 h-16 object-cover rounded-lg" referrerPolicy="no-referrer" />
                      <div className="flex-grow">
                        <h4 className="font-bold text-text-primary text-sm sm:text-base">
                          <span>{product.name}</span>
                        </h4>
                        <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-widest font-black">
                          <span>{product.category} • {PROMOS.find(p => p.id === product.promo)?.label}</span>
                          {product.wholesale_only && <span className="ml-2 text-brand-pink">• Solo mayorista</span>}
                        </p>
                        <p className="text-xs font-black text-text-primary mt-1">
                          {adminCatalog === 'wholesale'
                            ? (product.price_wholesale ? `Mayorista: ${product.price_wholesale}` : 'Sin precio mayorista')
                            : (product.price ? `$${product.price}` : 'Sin precio')}
                        </p>
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
            key="notification-toast"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className={cn(
              "fixed top-0 left-0 right-0 z-[200] px-4 py-3 shadow-lg font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis",
              notification.type === 'success' ? "bg-brand-pink text-white" : "bg-red-500 text-white"
            )}
          >
            {notification.type === 'success'
              ? <CheckCircle2 size={18} className="shrink-0 text-green-400 drop-shadow" strokeWidth={3} />
              : <AlertCircle size={18} className="shrink-0" />}
            <span className="truncate">{notification.message}</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-4">
            {!isAdminPanel && (
            <>
            <div className="bg-brand-pink/5 border border-brand-pink/20 p-6 rounded-2xl">
              <p className="text-brand-pink font-black text-sm sm:text-base">
                Atención: No se procesan cambios, por favor verifique su talla con exactitud antes de realizar su pedido.
              </p>
            </div>
            <p className="text-text-primary font-bold text-sm sm:text-base">
              Formas de pago: Transferencia bancaria, depósitos, y Mercado Pago hasta 12 cuotas.
            </p>
            </>
            )}
          </div>
          <div className="text-[10px] text-text-secondary uppercase tracking-widest pt-4 border-t border-border-main/50">
            BELLA URUGUAY
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

      <DevConsole visible={isAdminPanel || DEBUG} />
    </div>
    </ErrorBoundary>
  );
}
