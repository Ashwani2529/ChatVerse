import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '../../images/logo.png';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';
import {
  AlertIcon,
  EyeIcon,
  EyeOffIcon,
  HashIcon,
  LockIcon,
  UsersIcon,
} from '../ui/icons';

const validate = ({ roomId, password, name }) => {
  const errors = {};

  const trimmedRoom = roomId.trim();
  if (!trimmedRoom) errors.roomId = 'Room ID is required';
  else if (trimmedRoom.length < 3) errors.roomId = 'At least 3 characters';
  else if (trimmedRoom.length > 40) errors.roomId = 'At most 40 characters';
  else if (!/^[a-zA-Z0-9._-]+$/.test(trimmedRoom))
    errors.roomId = 'Letters, numbers, dots, hyphens and underscores only';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 4) errors.password = 'At least 4 characters';
  else if (password.length > 128) errors.password = 'At most 128 characters';

  const trimmedName = name.trim();
  if (!trimmedName) errors.name = 'Name is required';
  else if (trimmedName.length < 2) errors.name = 'At least 2 characters';
  else if (trimmedName.length > 50) errors.name = 'At most 50 characters';

  return errors;
};

const Join = () => {
  const navigate = useNavigate();
  const { login, prefill } = useAuth();

  const [form, setForm] = useState({
    roomId: prefill.roomId || '',
    password: '',
    name: prefill.name || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = validate(form);
    setErrors(found);
    setFormError('');

    if (Object.keys(found).length > 0) return;

    setIsSubmitting(true);

    try {
      await login({
        roomId: form.roomId.trim(),
        password: form.password,
        name: form.name.trim(),
      });
      navigate('/chat', { replace: true });
    } catch (error) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setFormError(error.message || 'Could not join the room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (field) =>
    `field-input ${errors[field] ? 'field-input-error' : ''}`;

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      {/* Ambient background glow — purely decorative. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(90,118,243,0.22),transparent_70%),radial-gradient(45%_40%_at_85%_90%,rgba(122,149,255,0.14),transparent_70%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src={logo}
            alt=""
            className="mb-3 h-14 w-14 rounded-2xl object-cover shadow-lg shadow-brand-600/25"
          />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">ChatVerse</h1>
          <p className="mt-2 max-w-xs text-sm text-slate-400">
            Enter a room ID and password to join. New room IDs are created on the spot.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-ink-500/70 bg-ink-800/80 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-7"
        >
          {formError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
            >
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="field-label" htmlFor="roomId">
                Room ID
              </label>
              <div className="relative">
                <HashIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="roomId"
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange('roomId')}
                  className={`${fieldClass('roomId')} pl-10`}
                  placeholder="team-standup"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  maxLength={40}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.roomId)}
                  aria-describedby={errors.roomId ? 'roomId-error' : undefined}
                />
              </div>
              {errors.roomId && (
                <p id="roomId-error" className="mt-1.5 text-xs text-rose-300">
                  {errors.roomId}
                </p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="password">
                Room password
              </label>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  className={`${fieldClass('password')} pl-10 pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  maxLength={128}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn h-9 w-9"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1.5 text-xs text-rose-300">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="name">
                Your name
              </label>
              <div className="relative">
                <UsersIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange('name')}
                  className={`${fieldClass('name')} pl-10`}
                  placeholder="Ashwani"
                  autoComplete="nickname"
                  maxLength={50}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </div>
              {errors.name && (
                <p id="name-error" className="mt-1.5 text-xs text-rose-300">
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary mt-6" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" label="Joining room" />
                Joining…
              </>
            ) : (
              'Enter room'
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            You will stay signed in on this device for 60 days.
          </p>
        </form>
      </div>
    </main>
  );
};

export default Join;
