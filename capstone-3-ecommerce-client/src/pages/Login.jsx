import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Where the user was headed before the guard bounced them here.
  const redirectTo = location.state?.from?.pathname || '/';

  function validate() {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name}`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to manage the product catalog.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
