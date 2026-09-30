import { Button } from './ui';

export default function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-sm text-slate-500">
        Page {page} of {pages} · {total} product{total === 1 ? '' : 's'}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
