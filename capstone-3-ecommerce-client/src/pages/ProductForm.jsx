import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useToast } from '../context/ToastContext';
import { Button, Input, Textarea, Spinner, ErrorState } from '../components/ui';

const BLANK = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  imageUrl: '',
  isActive: true,
};

export default function ProductForm({ mode = 'create' }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(BLANK);
  const [original, setOriginal] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    productsApi
      .get(id)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        const loaded = {
          name: p.name,
          description: p.description,
          // Numbers become strings because <input> values are always strings.
          // String(0) is "0", which is correctly truthy - never use p.price || ''
          // here, or a free product would load with an empty price box.
          price: String(p.price),
          category: p.category,
          stock: String(p.stock),
          imageUrl: p.imageUrl || '',
          isActive: p.isActive,
        };
        setForm(loaded);
        setOriginal(loaded);
      })
      .catch((err) => !cancelled && setLoadError(err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  function validate() {
    const e = {};

    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';

    if (!form.description.trim()) e.description = 'Description is required';

    // '' means "not filled in"; '0' is a real answer. Compare against '',
    // not with a falsy check, for exactly the same reason the API uses
    // `price === undefined` instead of `!price`.
    if (form.price === '') e.price = 'Price is required';
    else if (Number.isNaN(Number(form.price))) e.price = 'Price must be a number';
    else if (Number(form.price) < 0) e.price = 'Price cannot be negative';

    if (!form.category.trim()) e.category = 'Category is required';

    if (form.stock === '') e.stock = 'Stock is required';
    else if (Number.isNaN(Number(form.stock))) e.stock = 'Stock must be a number';
    else if (Number(form.stock) < 0) e.stock = 'Stock cannot be negative';
    else if (!Number.isInteger(Number(form.stock))) e.stock = 'Stock must be a whole number';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        // PATCH is PARTIAL. Send only what actually changed - that is the
        // whole point of the verb. Sending the full object would still work
        // here, but it would be a PUT wearing a PATCH costume.
        const changes = {};
        Object.keys(form).forEach((key) => {
          if (form[key] !== original[key]) {
            changes[key] =
              key === 'price' || key === 'stock' ? Number(form[key]) : form[key];
          }
        });

        if (Object.keys(changes).length === 0) {
          toast.info('Nothing changed');
          setSubmitting(false);
          return;
        }

        await productsApi.update(id, changes);
        toast.success('Product updated');
        navigate(`/products/${id}`);
      } else {
        await productsApi.create({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        });
        toast.success('Product created');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-slate-300">
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState
          message={
            loadError.status === 404
              ? 'That product does not exist.'
              : loadError.message
          }
        />
      </div>
    );
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to={isEdit ? `/products/${id}` : '/'}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        &larr; Cancel
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">
          {isEdit ? 'Edit product' : 'Add a product'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isEdit
            ? 'Only the fields you change are sent to the API.'
            : 'All fields except image URL are required.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Input
            id="name"
            label="Name"
            placeholder="Mechanical Keyboard"
            value={form.name}
            error={errors.name}
            onChange={set('name')}
          />

          <Textarea
            id="description"
            label="Description"
            placeholder="RGB mechanical keyboard with hot-swappable switches"
            value={form.description}
            error={errors.description}
            onChange={set('description')}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="price"
              label="Price (₱)"
              type="number"
              min="0"
              step="0.01"
              placeholder="1850"
              hint="0 is allowed — free items are valid"
              value={form.price}
              error={errors.price}
              onChange={set('price')}
            />
            <Input
              id="stock"
              label="Stock"
              type="number"
              min="0"
              step="1"
              placeholder="12"
              hint="0 means sold out, not missing"
              value={form.stock}
              error={errors.stock}
              onChange={set('stock')}
            />
          </div>

          <Input
            id="category"
            label="Category"
            placeholder="Accessories"
            list="category-suggestions"
            value={form.category}
            error={errors.category}
            onChange={set('category')}
          />
          <datalist id="category-suggestions">
            <option value="Accessories" />
            <option value="Laptop" />
            <option value="Promo" />
          </datalist>

          <Input
            id="imageUrl"
            label="Image URL"
            type="url"
            placeholder="https://example.com/photo.jpg"
            hint="Optional"
            value={form.imageUrl}
            onChange={set('imageUrl')}
          />

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Product is active and visible in the catalog
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" size="lg" loading={submitting} className="flex-1">
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate(isEdit ? `/products/${id}` : '/')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
