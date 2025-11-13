import { writeFileSync } from 'fs';

const clientCode = `import createClient from 'openapi-fetch';
import type { paths } from './schema';

export const client = createClient<paths>({ baseUrl: 'http://localhost:8000' });
`;

writeFileSync('src/client/index.ts', clientCode);
console.log('Generated typed API client at src/client/index.ts');
