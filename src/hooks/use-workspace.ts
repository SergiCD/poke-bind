'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { demoWorkspace, emptyWorkspace, workspaceSchema, type Workspace } from '@/lib/workspace';

const localKey = 'pokebind:guest:v1';
type Status = 'loading' | 'local' | 'saving' | 'saved' | 'error';

/** Guest storage and account storage never share a key or merge implicitly. */
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(demoWorkspace);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const identity = useRef<string | null>(null);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const current = useRef(workspace);
  const generation = useRef(0);

  const load = useCallback(async (account: User | null) => {
    const token = ++generation.current;
    setReady(false);
    setStatus('loading');
    setError('');
    setUser(account);
    identity.current = account?.id ?? null;
    try {
      let next: Workspace;
      if (account && supabase) {
        const { data, error } = await supabase
          .from('workspaces')
          .select('payload, revision')
          .eq('user_id', account.id)
          .maybeSingle();
        if (error) throw error;
        next = data ? workspaceSchema.parse(data.payload) : emptyWorkspace();
        if (token !== generation.current) return;
        revision.current = data?.revision ?? 0;
      } else {
        const raw = localStorage.getItem(localKey);
        next = raw ? workspaceSchema.parse(JSON.parse(raw)) : demoWorkspace();
      }
      if (token !== generation.current) return;
      current.current = next;
      setWorkspace(next);
      setReady(true);
      setStatus(account ? 'saved' : 'local');
    } catch {
      if (token !== generation.current) return;
      // Do not replace unreadable data with a fresh example and silently erase a collection.
      current.current = emptyWorkspace();
      setWorkspace(emptyWorkspace());
      setError('No hemos podido abrir tu colección. Tus datos no se han sobrescrito.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      void load(null);
      return;
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_OUT' ||
        identity.current !== (session?.user.id ?? null)
      ) {
        // Supabase advises moving asynchronous DB work outside the auth callback.
        setTimeout(() => void load(session?.user ?? null), 0);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
      generation.current++;
    };
  }, [load]);

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key !== localKey || identity.current) return;
      setReady(false);
      setStatus('error');
      setError('Tu colección local ha cambiado en otra pestaña. Vuelve a cargar antes de editar.');
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  const update = useCallback(
    (change: (previous: Workspace) => Workspace) => {
      if (!ready) return;
      const next = workspaceSchema.parse(change(current.current));
      current.current = next;
      setWorkspace(next);
      setError('');
      const accountId = identity.current;
      const token = generation.current;
      if (!accountId) {
        try {
          localStorage.setItem(localKey, JSON.stringify(next));
          setStatus('local');
        } catch {
          setStatus('error');
          setError(
            'No se ha podido guardar en este dispositivo. Exporta una copia antes de cerrar.',
          );
        }
        return;
      }
      setStatus('saving');
      // Serialize writes from this tab. The database revision catches changes from other devices.
      queue.current = queue.current
        .then(async () => {
          if (token !== generation.current) return;
          const { data, error } = await supabase!.rpc('save_workspace', {
            expected_revision: revision.current,
            new_payload: next,
          });
          if (token !== generation.current) return;
          if (error) {
            generation.current++; // Cancel queued writes after a conflict or connection failure.
            setReady(false);
            setStatus('error');
            setError(
              'No se han guardado los últimos cambios. Puede haber otra sesión editando. Exporta una copia y vuelve a cargar.',
            );
            return;
          }
          revision.current = data;
          if (current.current === next) setStatus('saved');
        })
        .catch(() => {
          if (token !== generation.current) return;
          generation.current++;
          setReady(false);
          setStatus('error');
          setError('Se ha interrumpido el guardado. Exporta una copia y vuelve a cargar.');
        });
    },
    [ready],
  );

  return { workspace, update, user, status, error, ready, reload: () => load(user) };
}
