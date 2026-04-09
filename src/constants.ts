export const STORE_NAME = "BELLA";

export const PROMOS = [
  {
    id: "promo-2600",
    title: "Promo 2 x $2600",
    label: "Primera Línea",
    description: "Lleva 2 pares por solo $2600. (Un par solo: $1500)",
    price: 2600,
    individualPrice: 1500,
  },
  {
    id: "promo-2990",
    title: "Promo 2 x $2990",
    label: "Premium",
    description: "Lleva 2 pares por solo $2990. (Un par solo: $1690)",
    price: 2990,
    individualPrice: 1690,
  }
];

export const FAQ_ITEMS = [
  {
    question: "¿Cómo hago un pedido?",
    answer: "1. Envía foto del o los pares elegidos.\n2. Envía foto de la etiqueta y plantilla de tu calzado actual.\n3. Una vez confirmemos stock, puedes proceder al pago."
  },
  {
    question: "¿Hacen envíos?",
    answer: "Sí, realizamos envíos todos los días a todo el país a través de agencias como DAC, TURIL, COPAY, entre otras."
  },
  {
    question: "¿Son productos originales?",
    answer: "Trabajamos con calzado de primera línea y calidad premium de procedencia brasileña. Son excelentes réplicas, no son productos originales."
  },
  {
    question: "¿Qué talles tienen?",
    answer: "Contamos con talles del 36 al 45 EUROPA (que equivale al 34 al 43 Brasileño)."
  },
  {
    question: "¿Cómo elijo mi talle?",
    answer: "Para corroborar el talle, necesitamos una foto de la etiqueta de tu calzado actual y una foto de los centímetros de la plantilla. No realizamos cambios, por lo que es vital medir con exactitud."
  },
  {
    question: "¿Cuáles son los medios de pago?",
    answer: "Aceptamos transferencias bancarias, depósitos en Abitab o Red Pagos, y Mercado Pago (hasta 12 cuotas con un pequeño costo adicional)."
  }
];

export const PRODUCTS = [
  {
    id: 1,
    name: "Sneaker Urban White",
    category: "Femenino",
    promo: "promo-2600",
    image: "https://picsum.photos/seed/shoe1/400/400",
    colors: ["Blanco", "Beige", "Rosa"],
    sizes: ["36", "37", "38", "39", "40"],
  },
  {
    id: 2,
    name: "Sport Runner Black",
    category: "Masculino",
    promo: "promo-2990",
    image: "https://picsum.photos/seed/shoe2/400/400",
    colors: ["Negro", "Gris Oscuro", "Blanco"],
    sizes: ["40", "41", "42", "43", "44", "45"],
  },
  {
    id: 3,
    name: "Kids Play Pink",
    category: "Infantil",
    promo: "promo-2600",
    image: "https://picsum.photos/seed/shoe3/400/400",
    colors: ["Rosa", "Blanco", "Beige"],
    sizes: ["28", "29", "30", "31", "32", "33", "34", "35"],
  },
  {
    id: 4,
    name: "Classic Leather Brown",
    category: "Masculino",
    promo: "promo-2990",
    image: "https://picsum.photos/seed/shoe4/400/400",
    colors: ["Beige Oscuro", "Negro", "Blanco"],
    sizes: ["40", "41", "42", "43", "44", "45"],
  },
  {
    id: 5,
    name: "Vibrant Sky Blue",
    category: "Femenino",
    promo: "promo-2600",
    image: "https://picsum.photos/seed/shoe5/400/400",
    colors: ["Rosa Pastel", "Blanco", "Beige"],
    sizes: ["36", "37", "38", "39", "40"],
  },
  {
    id: 6,
    name: "Junior Speed",
    category: "Infantil",
    promo: "promo-2990",
    image: "https://picsum.photos/seed/shoe6/400/400",
    colors: ["Negro", "Blanco", "Rosa"],
    sizes: ["28", "29", "30", "31", "32", "33", "34", "35"],
  }
];

export const URUGUAY_DEPARTMENTS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", 
  "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro", "Rivera", 
  "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres"
];
