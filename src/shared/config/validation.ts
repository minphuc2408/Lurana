import { z } from 'zod';

// Run before schema modules load: strict CSP forbids Zod's new Function probe.
z.config({ jitless: true });
