import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';

type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Veriler ekran dışından değiştiğinde (ör. bildirimdeki "Tamamlandı" düğmesi)
 * açık ekranların listeyi yeniden okumasını sağlar. Uygulama arka plandan öne
 * geldiğinde useFocusEffect tekrar çalışmadığı için tek başına yetmiyor.
 */
export function notifyDataChanged(): void {
  for (const listener of listeners) listener();
}

/** Ekran odaklandığında ve veri dışarıdan değiştiğinde `load`'u çalıştırır. */
export function useDataLoader(load: () => void): void {
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  useEffect(() => {
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, [load]);
}
