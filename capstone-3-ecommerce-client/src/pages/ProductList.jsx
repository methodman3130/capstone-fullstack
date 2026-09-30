import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce';
import ProductCard from '../components/ProductCard';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import { Button, Spinner, EmptyState, ErrorState } from '../components/ui';

const EMPTY_FILTERS = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  sort: '',
  page: 1,
};

export default function ProductList() {
  const { isAuthenticated } = useAuth();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [result, setResult] = useState({ data: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allCategories, setAllCategories] = useState([]);

  // Only the text input needs debouncing; dropdowns fire once per change.
  const debouncedSearch = useDebounce(filters.search, 400);

  // Guards against out-of-order responses: if request #2 returns before
  // request #3, we must not let the stale one overwrite fresher data.
  const requestId = useRef(0);

  const query = useMemo(
    () => ({ ...filters, search: debouncedSearch, limit: 12 }),
    [filters, debouncedSearch]
  );

  const fetchProducts = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.list(query);
      if (id === requestId.current) setResult(res);
    } catch (err) {
      if (id === requestId.current) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load the full category list once, unfiltered, so the dropdown does not
  // shrink as you filter (which would trap you inside one category).
  useEffect(() => {
    productsApi
      .list({ limit: 100 })
      .then((res) => {
        setAllCategories([...new Set(res.data.map((p) => p.category))].sort());
      })
      .catch(() => setAllCategories([]));
  }, []);

  const isFiltered = Boolean(
    debouncedSearch || filters.category || filters.minPrice || filters.maxPrice
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading…' : `${result.total} product${result.total === 1 ? '' : 's'} in the catalog`}
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/products/new">
            <Button>Add product</Button>
          </Link>
        )}
      </div>

      <FilterBar
        filters={filters}
        categories={allCategories}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />

      {error ? (
        <ErrorState message={error} onRetry={fetchProducts} />
      ) : loading ? (
        <div className="grid place-items-center py-24 text-slate-300">
          <Spinner size="lg" />
        </div>
      ) : result.data.length === 0 ? (
        /* An empty result is a successful 200 with no matches - never an error. */
        <EmptyState
          title={isFiltered ? 'No products match those filters' : 'No products yet'}
          message={
            isFiltered
              ? 'Try a different keyword, or clear the filters to see everything.'
              : 'Add your first product, or run "npm run seed" in the API to load sample data.'
          }
          action={
            isFiltered ? (
              <Button variant="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear filters
              </Button>
            ) : isAuthenticated ? (
              <Link to="/products/new">
                <Button>Add product</Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.data.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
          <Pagination
            page={result.page}
            pages={result.pages}
            total={result.total}
            onChange={(page) => {
              setFilters((f) => ({ ...f, page }));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </div>
  );
}
