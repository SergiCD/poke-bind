'use client';
import { useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { Cloud, Download, LogOut, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Modal } from './modal';

export function AccountModal({
  user,
  onClose,
  onExport,
}: {
  user: User | null;
  onClose: () => void;
  onExport: () => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      const result =
        mode === 'signup'
          ? await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            })
          : mode === 'reset'
            ? await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
              })
            : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setMessage(
          'No se ha podido completar la solicitud. Revisa tus datos o inténtalo más tarde.',
        );
      } else if (mode === 'signin') onClose();
      else
        setMessage(
          mode === 'reset'
            ? 'Si la cuenta existe, recibirás un enlace para cambiar la contraseña.'
            : 'Revisa tu correo para confirmar la cuenta. Tu colección local se mantiene separada de tu cuenta.',
        );
    } catch {
      setMessage('No se ha podido conectar. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={user ? 'Tu cuenta' : 'Tu colección va contigo'} onClose={onClose}>
      <div className="account-content">
        <div className="account-symbol">
          <Cloud size={30} />
        </div>
        {user ? (
          <>
            <h3>{user.email}</h3>
            <p>Tu colección se guarda en tu cuenta.</p>
            <button
              className="button secondary"
              onClick={async () => {
                const result = await supabase!.auth.signOut();
                if (result.error) setMessage('No se ha podido cerrar la sesión.');
                else onClose();
              }}
            >
              <LogOut size={17} />
              Cerrar sesión
            </button>
          </>
        ) : !supabase ? (
          <>
            <h3>Empieza a tu ritmo</h3>
            <p>
              Ahora estás en modo local: tus binders se guardan en este navegador. Las cuentas
              estarán disponibles cuando se active el servicio.
            </p>
            <p className="muted">
              Guarda una copia para conservar tu colección fuera de este dispositivo.
            </p>
          </>
        ) : (
          <>
            <p>Crea tu cuenta para guardar tus binders y abrirlos desde otro dispositivo.</p>
            <form onSubmit={submit} className="form-stack">
              <label>
                Correo electrónico
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {mode !== 'reset' && (
                <label>
                  Contraseña
                  <input
                    type="password"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              )}
              <button className="button primary" disabled={busy}>
                <Mail size={17} />
                {busy
                  ? 'Un momento…'
                  : mode === 'signup'
                    ? 'Crear cuenta'
                    : mode === 'reset'
                      ? 'Enviar enlace'
                      : 'Iniciar sesión'}
              </button>
            </form>
            <div className="account-links">
              <button
                className="text-button"
                onClick={() => {
                  setMessage('');
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                }}
              >
                {mode === 'signup' ? 'Ya tengo cuenta' : 'Crear una cuenta'}
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setMessage('');
                  setMode('reset');
                }}
              >
                Olvidé mi contraseña
              </button>
            </div>
          </>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <button className="button secondary export-button" onClick={onExport}>
          <Download size={17} />
          Exportar mi colección
        </button>
      </div>
    </Modal>
  );
}
