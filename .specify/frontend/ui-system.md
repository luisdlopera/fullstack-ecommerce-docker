# UI System

## Overview

Nexstore uses a combination of **Tailwind CSS** for styling and **HeroUI** for pre-built components.

## Tailwind CSS 4

### Configuration

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #f59e0b;
}
```

### Usage Patterns

```tsx
// Utility-first approach
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="
      px-4 py-2 
      bg-primary text-white 
      rounded-lg 
      hover:bg-primary-dark 
      active:scale-95
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
    ">
      {children}
    </button>
  );
}
```

### Common Patterns

```tsx
// Card pattern
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

// Flex layout
<div className="flex items-center justify-between gap-4">

// Grid layout  
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">

// Hover states
<button className="hover:bg-gray-100 transition-colors">
```

## HeroUI

HeroUI provides comprehensive React components with Tailwind styling.

### Installation

Already included in dependencies:
```json
{
  "@heroui/react": "^2.6.14",
  "@heroui/system": "^2.4.27",
  "@heroui/theme": "^2.4.26"
}
```

### Common Components

```tsx
import { 
  Button, 
  Input, 
  Modal, 
  Card, 
  Select, 
  Table,
  Badge,
  Spinner 
} from '@heroui/react';

// Button
<Button color="primary" variant="solid" size="lg">
  Add to Cart
</Button>

// Input
<Input 
  label="Email" 
  type="email" 
  placeholder="Enter your email"
  isRequired
  errorMessage="Please enter a valid email"
/>

// Modal
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Confirm</ModalHeader>
    <ModalBody>Are you sure?</ModalBody>
    <ModalFooter>
      <Button onClick={onClose}>Cancel</Button>
      <Button color="primary" onClick={onConfirm}>Confirm</Button>
    </ModalFooter>
  </ModalContent>
</Modal>

// Card
<Card>
  <CardBody>
    <h3>Product Name</h3>
    <p>$99.00</p>
  </CardBody>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>

// Table
<Table>
  <TableHeader>
    <TableColumn>Product</TableColumn>
    <TableColumn>Price</TableColumn>
    <TableColumn>Stock</TableColumn>
  </TableHeader>
  <TableBody>
    {products.map(product => (
      <TableRow key={product.id}>
        <TableCell>{product.name}</TableCell>
        <TableCell>${product.price}</TableCell>
        <TableCell>{product.stock}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Badge
<Badge color="success">In Stock</Badge>
<Badge color="danger">Out of Stock</Badge>
<Badge color="warning">Low Stock</Badge>

// Spinner
<Spinner size="lg" />
```

## Custom Components

### ProductCard

```tsx
// components/shared/product-card.tsx
import { Card, CardBody, CardFooter, Button, Image } from '@heroui/react';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.slug}`}>
        <CardBody className="p-0">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={product.images[0]?.url || '/placeholder.png'}
              alt={product.title}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {product.comparePrice && (
              <Badge color="danger" className="absolute top-2 right-2">
                Sale
              </Badge>
            )}
          </div>
        </CardBody>
        <CardFooter className="flex-col items-start">
          <h3 className="font-medium line-clamp-1">{product.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold">${product.price}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-500 line-through">
                ${product.comparePrice}
              </span>
            )}
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
```

### Layout Components

```tsx
// components/layout/container.tsx
export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

// components/layout/section.tsx
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={`py-12 md:py-16 ${className || ''}`}>
      {children}
    </section>
  );
}
```

## Icons

Using **Lucide React** for icons:

```tsx
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  Menu,
  X,
  ChevronRight,
  Star
} from 'lucide-react';

<ShoppingCart className="w-5 h-5" />
<Heart className="w-5 h-5" />
<Search className="w-5 h-5" />
```

## Responsive Breakpoints

| Breakpoint | Tailwind | Usage |
|------------|----------|-------|
| Mobile | default | < 640px |
| Tablet | `sm:` | ≥ 640px |
| Small Desktop | `md:` | ≥ 768px |
| Desktop | `lg:` | ≥ 1024px |
| Large Desktop | `xl:` | ≥ 1280px |
| Extra Large | `2xl:` | ≥ 1536px |

## Form Styling

```tsx
// Consistent form patterns
<div className="space-y-4">
  <Input
    label="Full Name"
    placeholder="Enter your name"
    variant="bordered"
    isRequired
  />
  
  <Input
    label="Email"
    type="email"
    placeholder="you@example.com"
    variant="bordered"
    isRequired
  />
  
  <Select
    label="Country"
    placeholder="Select your country"
    variant="bordered"
  >
    {countries.map(country => (
      <SelectItem key={country.id} value={country.id}>
        {country.name}
      </SelectItem>
    ))}
  </Select>
  
  <Button color="primary" fullWidth>
    Submit
  </Button>
</div>
```

## Animation

Using Framer Motion for animations:

```tsx
import { motion } from 'framer-motion';

// Fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }}
>
  {items.map(item => (
    <motion.div key={item.id} variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}>
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

## References

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [HeroUI Docs](https://heroui.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
