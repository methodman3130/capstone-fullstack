import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Input } from '../components/ui';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';

    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // confirmPassword never leaves the browser - it is a UI check only.
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      toast.success(`Account created. Welcome, ${user.name}`);
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-xl border border-slate-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">
          You need an account to add or edit products.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <Input
            id="name"
            label="Name"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
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
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />

          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="user">User — can create and edit products</option>
              <option value="admin">Admin — can also delete products</option>
            </select>
            <p className="mt-1 text-xs text-amber-600">
              Demo only. A real app never lets a client pick its own role.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
