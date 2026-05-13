import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const serverDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(serverDir, '.env') });
