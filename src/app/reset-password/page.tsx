'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('Abriendo enlace de recuperación…');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supabase) {
      setMessage('Las cuentas todavía no están activadas.');
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'INITIAL_SESSION' && session)) {
        setReady(true);
        setMessage('Elige una contraseña de al menos 8 caracteres.');
      } else if (event === 'INITIAL_SESSION' && !session)
        setMessage('El enlace ha caducado o no es válido. Solicita otro desde tu cuenta.');
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !ready) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      setMessage(
        error
          ? 'No se ha podido actualizar. Solicita un nuevo enlace e inténtalo otra vez.'
          : 'Contraseña actualizada. Ya puedes volver a tu colección.',
      );
      if (!error) setReady(false);
    } catch {
      setMessage('No se ha podido conectar. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="reset-page">
      <h1>Vuelve a tu colección.</h1>
      <p role="status">{message}</p>
      {ready && (
        <form className="form-stack" onSubmit={submit}>
          <label>
            Nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="button primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
      <p>
        <a href="/">Volver a PokeBind</a>
      </p>
    </main>
  );
}
