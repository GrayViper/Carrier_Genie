import { useContext } from 'react';
import { AuthContext } from './AuthContextValue';

export const useAuth = () => useContext(AuthContext);
