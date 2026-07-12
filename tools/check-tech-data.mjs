import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const data = JSON.parse(await readFile(new URL('../data/parsed/tech/TechData.json', import.meta.url)))
const tech = data.techs.find(({ id }) => id === 333)

assert.deepEqual(tech.levels.map(({ effectValue }) => effectValue), [20, 40, 60, 80, 110, 150, 200, 300, 500, 1000])
assert.deepEqual(tech.levels.map(({ powerGain }) => powerGain), [25280, 109964, 216136, 343796, 500526, 709078, 984620, 1372654, 1906042, 2601216])

const stringsDir = new URL('../data/parsed/strings/', import.meta.url)
const localeFiles = (await readdir(stringsDir)).filter((file) => file.endsWith('.json'))
const englishKeys = Object.keys(JSON.parse(await readFile(new URL('en.json', stringsDir)))).sort()

for (const file of localeFiles) {
  assert.deepEqual(Object.keys(JSON.parse(await readFile(new URL(file, stringsDir)))).sort(), englishKeys, `${file} string keys differ from en.json`)
}

assert.equal(localeFiles.length, 20)
console.log('Tech 333 values and all 20 locale string tables are correct.')
