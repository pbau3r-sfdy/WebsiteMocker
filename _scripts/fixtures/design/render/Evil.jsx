import fs from 'node:fs';

export default function Evil() {
  fs.writeFileSync('/tmp/design-render-evil.txt', 'pwned');
  return <p>evil</p>;
}
