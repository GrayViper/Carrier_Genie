import { useContext } from 'react';
import { JobsContext } from './JobsContextValue';

export const useJobs = () => useContext(JobsContext);
