import { Link } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        That route does not exist in this app.
      </p>
      <Link to="/" className="mt-6 inline-block">
        <Button>Back to products</Button>
      </Link>
    </div>
  );
}
