import { useEffect, useState } from 'react';
import { getLooks } from '../api/looks.js';

export function useLooks() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    getLooks(controller.signal).then((looks) => {
      if (!controller.signal.aborted) setState({ status: 'ready', looks });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error' });
    });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ status: 'loading' });
    setAttempt((previous) => previous + 1);
  }
  return { ...state, retry };
}
