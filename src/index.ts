// Imports
import { events } from 'bdsx/event'
import { resolve } from 'path'
import { Store } from './database/store'
import { StoreData } from './types'

import { init as initLink } from './commands/link'
import { Sweep } from './sweep'

// Server Open/Close Events
events.serverOpen.on(start)
events.serverClose.on(end)

// New Persistent JSON Storage
const store = new Store<StoreData>(resolve(__dirname, '../__STORE__/a.json'))

// Prepare Sweeper
const sweep = new Sweep(store)

// Server Close Cleanup Method
async function end() {
  console.log('[plugin:Tebexio] Cleanup')
  sweep.stop()
  store.save()
}

// Server Open Startup Method
async function start() {
  console.log('[plugin:Tebexio] Startup')

  // Start Sweeper (If Feasable)
  sweep.start()

  // Init Commands
  initLink(store, sweep)
}
