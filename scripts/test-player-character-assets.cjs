const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { load } = require('./helpers/load-typescript.cjs');
const root = path.resolve(__dirname, '..');
const files = ['novice.webp', 'novice-female.webp', 'apprentice.webp', 'apprentice-male.webp', 'explorer.webp', 'explorer-male.webp', 'researcher.webp', 'researcher-male.webp', 'sage.webp', 'sage-female.webp'];
const overrides = {
  'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
  'expo-image': { Image: 'Image' },
};
for (const name of files) overrides[`../../assets/player-characters/${name}`] = name;
const Character = load('src/components/PlayerCharacter.tsx', overrides).default;
(async () => {
  const expected = [[1, 'novice.webp', 'novice-female.webp'], [2, 'apprentice-male.webp', 'apprentice.webp'], [5, 'explorer-male.webp', 'explorer.webp'], [10, 'researcher-male.webp', 'researcher.webp'], [15, 'sage.webp', 'sage-female.webp']];
  for (const [level, male, female] of expected) {
    assert.equal(Character({ level, variant: 'male' }).props.source, male);
    assert.equal(Character({ level, variant: 'female' }).props.source, female);
  }
  let total = 0;
  for (const name of files) {
    const file = path.join(root, 'assets/player-characters', name);
    const meta = await sharp(file).metadata();
    assert.equal(meta.width, 256); assert.equal(meta.height, 256); assert.ok(meta.hasAlpha);
    assert.ok(fs.statSync(file).size < 25000, 'Each portrait should stay below 25 KB');
    total += fs.statSync(file).size;
  }
  assert.ok(total < 180000, 'All ten bundled portraits should stay below 180 KB');
  console.log(`All ten class/variant mappings, transparent WebP sizes and asset budget passed (${total} bytes)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
