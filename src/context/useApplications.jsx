import { useContext } from 'react';
import { ApplicationsContext } from './ApplicationsContextValue';

export const useApplications = () => useContext(ApplicationsContext);
