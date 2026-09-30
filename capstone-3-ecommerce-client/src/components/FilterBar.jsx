import { Input, Button } from './ui';

export default function FilterBar({ filters, onChange, onReset, categories }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value, page: 1 });
  }

  const hasFilters =
    filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.sort;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          id="search"
          label="Search"
          placeholder="Name or description"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          className="lg:col-span-2"
        />

        <div>
          <label htmlFor="category" className="mb-1.5 block text-sm font-medium text-slate-700">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            id="minPrice"
            label="Min ₱"
            type="number"
            min="0"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
          />
          <Input
            id="maxPrice"
            label="Max ₱"
            type="number"
            min="0"
            placeholder="—"
            value={filters.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="sort" className="mb-1.5 block text-sm font-medium text-slate-700">
            Sort by
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => set('sort', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="">Newest first</option>
            <option value="price">Price: low to high</option>
            <option value="-price">Price: high to low</option>
            <option value="name">Name A–Z</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
