import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { transformWithEsbuild } from 'vite'

// Use the existing Vite toolchain to load the TypeScript helper under Node 20.
const source = new URL('../src/features/products/model/suggestedPrice.ts', import.meta.url)
const { code } = await transformWithEsbuild(await readFile(source, 'utf8'), 'suggestedPrice.ts')
const { getSuggestedPrice } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

test('applies markup to the cost, not to the sale price', () => {
  assert.equal(getSuggestedPrice(1000, '30'), '1300.00')
  assert.equal(getSuggestedPrice(1000, '0'), '1000.00')
})

test('accepts a decimal comma and rounds the resulting price once', () => {
  assert.equal(getSuggestedPrice(123.456, '12,5'), '138.89')
  assert.equal(getSuggestedPrice(1.005, '0'), '1.01')
})

test('does not suggest a price for absent costs or invalid markup', () => {
  assert.equal(getSuggestedPrice(0, '30'), null)
  assert.equal(getSuggestedPrice(Infinity, '30'), null)
  assert.equal(getSuggestedPrice(0.001, '30'), null)
  for (const value of ['', '-30', '30.123', '30%', '3e2']) {
    assert.equal(getSuggestedPrice(1000, value), null)
  }
})
