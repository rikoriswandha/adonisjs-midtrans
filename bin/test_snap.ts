import { assert } from '@japa/assert'
import { configure, run } from '@japa/runner'

configure({
  files: ['tests/snap_client.spec.ts'],
  plugins: [assert()],
})

run()
