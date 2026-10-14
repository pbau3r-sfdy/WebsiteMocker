// Single definition of the internal-review gate (D-05): open-point markers, pill,
// footer link, noindex meta and the /open-points route exist only in sandbox builds.
import { isSandbox } from '../../../../_scripts/lib/env.mjs';

export const SHOW_INTERNAL: boolean = isSandbox(import.meta.env.BASE_URL);
