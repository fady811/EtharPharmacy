# PharmaShop E-Commerce Frontend

A modern, production-ready E-commerce frontend built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion. This application connects to a REST API for pharmacy products.

## 🚀 Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Product Catalog**: Browse products with advanced filtering and search
- **Product Details**: Detailed product pages with image galleries
- **Shopping Cart**: Persistent cart with quantity controls
- **Checkout**: Complete order placement workflow
- **State Management**: Zustand for efficient state management
- **Type Safety**: Full TypeScript implementation
- **Performance**: Optimized with code splitting and lazy loading
- **SEO**: Built-in SEO optimization with Next.js

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge

## 📁 Project Structure

```
new front/
├── app/                    # Next.js App Router pages
│   ├── cart/              # Shopping cart page
│   ├── checkout/          # Checkout page
│   ├── products/          # Products listing and detail pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── features/          # Feature-specific components
│   │   ├── Pagination.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductFilters.tsx
│   ├── layout/            # Layout components
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── ui/                # Reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Loading.tsx
│   └── ErrorBoundary.tsx
├── config/                # Configuration files
│   └── api.ts
├── hooks/                 # Custom React hooks
│   ├── useCategories.ts
│   ├── useDebounce.ts
│   ├── useProduct.ts
│   └── useProducts.ts
├── lib/                   # Utility functions
│   └── utils.ts
├── services/              # API services
│   ├── apiClient.ts
│   ├── orders.ts
│   └── products.ts
├── store/                 # Zustand stores
│   └── cartStore.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── .env.local             # Environment variables
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd "new front"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your API configuration:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🔌 API Integration

The application connects to a REST API with the following endpoints:

### Products API

- **GET /api/products/** - List products with filters and pagination
- **GET /api/products/{id}/** - Get product details
- **GET /api/categories/** - List categories
- **GET /api/categories/{id}/products/** - Get products by category

### Order API

- **POST /api/orders/** - Create a new order

### API Client

The application uses a custom API client (`services/apiClient.ts`) that handles:
- Request/response formatting
- Error handling
- Timeout management
- Type safety

### Example Usage

```typescript
import { productsService } from '@/services/products';

// Fetch products with filters
const { products, pagination } = await productsService.fetchProducts({
  category: 1,
  min_price: 10,
  max_price: 50,
  sort: 'price_asc',
  page: 1,
  page_size: 20,
});

// Fetch single product
const product = await productsService.fetchProduct(1);
```

## 🛒 Cart Management

The cart is managed using Zustand with localStorage persistence:

```typescript
import { useCartStore } from '@/store/cartStore';

function MyComponent() {
  const { items, addItem, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  
  // Add item to cart
  addItem(product, quantity, variation);
  
  // Get total price
  const total = getTotalPrice();
}
```

## 🎨 Styling

The application uses Tailwind CSS with custom theme configuration:

- **Primary Colors**: Blue shades
- **Accent Colors**: Purple shades
- **Custom Animations**: Fade, slide, scale effects
- **Responsive Design**: Mobile-first approach

## 📱 Pages

### Home Page (`/`)
- Hero section with animations
- Feature highlights
- Category showcase
- Featured products

### Products Page (`/products`)
- Product listing with filters
- Search functionality
- Pagination
- Sorting options

### Product Details (`/products/[id]`)
- Image gallery
- Product information
- Variations selection
- Add to cart

### Cart (`/cart`)
- Cart items list
- Quantity controls
- Order summary
- Remove items

### Checkout (`/checkout`)
- Shipping information form
- Order review
- Order placement
- Success confirmation

## 🔧 Customization

### Changing API Base URL

Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=your-api-url
```

### Modifying Colors

Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: {
    // Your custom colors
  },
  accent: {
    // Your custom colors
  },
}
```

### Adding New Pages

Create a new folder in `app/` with a `page.tsx` file:
```typescript
export default function NewPage() {
  return <div>Your content</div>;
}
```

## 🧪 Testing

The application includes error boundaries and loading states for robust error handling.

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (ms) | `30000` |

## 🚀 Deployment

### Vercel

```bash
npm install -g vercel
vercel
```

### Other Platforms

Build the application:
```bash
npm run build
```

The `.next` folder contains the optimized production build.

## 📄 License

This project is part of the Pharmacy E-Commerce system.

## 🤝 Support

For issues or questions, please refer to the API documentation or contact the development team.

---

Built with ❤️ using Next.js and modern web technologies.
