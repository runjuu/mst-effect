module.exports = {
  '**/package.json': ['yarn format:package'],
  '*.{ts,tsx}': () => ['yarn format:code', 'yarn lint'],
}
