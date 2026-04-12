import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'

// Repo-root templates/ (one level up from src/registry)
const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(__dirname, '..', '..', 'templates')
const schemaPath = join(templatesDir, '_schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'))

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

describe('template JSON files', () => {
  const files = readdirSync(templatesDir).filter((f) => f.endsWith('.json') && f !== '_schema.json')

  it('has template files to validate', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  for (const f of files) {
    it(`validates ${f} against _schema.json`, () => {
      const data = JSON.parse(readFileSync(join(templatesDir, f), 'utf-8'))
      const ok = validate(data)
      if (!ok) expect.fail(JSON.stringify(validate.errors, null, 2))
    })
  }
})
