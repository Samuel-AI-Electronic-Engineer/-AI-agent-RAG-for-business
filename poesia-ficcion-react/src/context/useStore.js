import { useContext } from 'react';
import { StoreContext } from './StoreContextDef';

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore debe usarse dentro de StoreProvider');
    return context;
}
