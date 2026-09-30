import { Link } from 'react-router-dom';
import { Badge, peso } from './ui';

export default function ProductCard({ product }) {
  const stockTone = product.stock === 0 ? 'rose' : product.stock < 5 ? 'amber' : 'green';
  const stockLabel =
    product.stock === 0 ? 'Out of stock' : product.stock < 5 ? `Low: ${product.stock}` : `${product.stock} in stock`;

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-slate-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl text-slate-300">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-medium text-slate-900">{product.name}</h3>
          {!product.isActive && <Badge tone="slate">inactive</Badge>}
        </div>

        <p className="line-clamp-2 flex-1 text-sm text-slate-500">{product.description}</p>

        <div className="mt-1 flex items-center justify-between">
          {/* peso(0) renders "₱0.00", not an empty string - a free item is still priced */}
          <span className="font-semibold text-slate-900">{peso(product.price)}</span>
          <Badge tone={stockTone}>{stockLabel}</Badge>
        </div>

        <Badge tone="brand">{product.category}</Badge>
      </div>
    </Link>
  );
}
