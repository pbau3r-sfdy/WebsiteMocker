// Registers internal-review routes (open points) only for sandbox builds (D-05).
// Production builds (base "/") never get the route, so nothing internal ships.
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isSandbox } from './lib/env.mjs';

export default function internalPages() {
  return {
    name: 'websitemocker-internal-pages',
    hooks: {
      'astro:config:setup': ({ config, injectRoute }) => {
        if (!isSandbox(config.base)) return;
        injectRoute({
          pattern: '/open-points',
          entrypoint: join(fileURLToPath(config.root), 'src/internal/open-points.astro'),
        });
      },
    },
  };
}
