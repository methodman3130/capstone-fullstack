import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { Button, Badge, Spinner, ErrorState, peso } from '../components/ui';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, isAdmin } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    productsApi
      .get(id)
      .then((res) => !cancelled && setProduct(res.data))
      .catch((err) => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.remove(id);
      toast.success('Product deleted');
      navigate('/', { replace: true });
    } catch (err) {
      // 403 here means the API rejected a non-admin. The UI hides the button,
      // but the server is what actually enforces it.
      toast.error(err.message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-slate-300">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    // 404 (no such product) and 400 (malformed id) deserve different words.
    const notFound = error.status === 404;
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          message={
            notFound
              ? 'That product does not exist. It may have been deleted.'
              : error.message
          }
        />
        <div className="mt-4 text-center">
          <Link to="/">
            <Button variant="secondary">Back to products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const stockTone = product.stock === 0 ? 'rose' : product.stock < 5 ? 'amber' : 'green';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-slate-500 hover:text-slate-800">
        &larr; Back to products
      </Link>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid md:grid-cols-2">
          <div className="aspect-square bg-slate-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-6xl text-slate-300">
                {product.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{product.category}</Badge>
              <Badge tone={stockTone}>
                {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
              </Badge>
              {!product.isActive && <Badge tone="slate">inactive</Badge>}
            </div>

            <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
            <p className="text-3xl font-bold text-slate-900">{peso(product.price)}</p>
            <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>

            <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
              <div>
                <dt className="text-slate-400">Created</dt>
                <dd className="text-slate-700">
                  {new Date(product.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Last updated</dt>
                <dd className="text-slate-700">
                  {new Date(product.updatedAt).toLocaleString()}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-400">ID</dt>
                <dd className="font-mono text-slate-700">{product._id}</dd>
              </div>
            </dl>

            {isAuthenticated && (
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <Link to={`/products/${product._id}/edit`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Edit
                  </Button>
                </Link>
                {/* Delete is admin-only on the server, so only admins see it. */}
                {isAdmin && (
                  <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this product?"
        message={`"${product.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
