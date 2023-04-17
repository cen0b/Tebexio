import { AxiosError } from 'axios'
import { ServerPlayer } from 'bdsx/bds/player'
import { events } from 'bdsx/event'
import { LevelTickEvent } from 'bdsx/event_impl/levelevent'
import { bedrockServer } from 'bdsx/launcher'
import { EventEmitter } from 'events'
import { RestClient } from '../api/Client'
import { Store } from '../database/store'
import { Player, StoreData, TebexDueOfflineCommands, TebexDueOnlineCommands, TebexDueQueue, TebexInformation } from '../types'

export class Sweep extends EventEmitter {
  // Base
  protected store: Store<StoreData>
  protected client: RestClient
  protected started = false

  // Sweep
  protected onlinePlayers: Map<string, ServerPlayer>
  protected duePlayers: Map<string, Player>
  protected checkTimeout: NodeJS.Timeout
  protected offlineCommands = false
  protected sweepInterval: NodeJS.Timer

  // Bound Callbacks
  protected _levelTick = this.__levelTick.bind(this)
  protected _checkQueue = this.__checkQueue.bind(this)
  protected _sweepInterval = this.__sweepInterval.bind(this)

  public constructor (store: Store<StoreData>) {
    super()

    this.store = store
  }

  protected verify(): Promise<boolean> {
    return new Promise((r) => {
      // Verify Token Exists
      const token = this.store.get('tebex_secret')
      if (!token?.length) return r(false)

      // Create Rest Client
      this.client = new RestClient(token)

      // Perform Information Fetch
      this.client
        .api
        .information
        .get<TebexInformation>()
        .then(() => r(true))
        .catch(() => r(false))
    })
  }

  public async start(): Promise<void> {
    if (this.started) return
    if ((await this.verify())) {
      console.error(`[plugin:Tebexio]`, `Enabled`.green, '::'.white, 'Beginning sweeps!'.grey)

      // Add LevelTick Listner
      events.levelTick.on(this._levelTick)

      // Start Queue Check Recursive Loop
      this.checkTimeout = setTimeout(this._checkQueue, 0)

      // Start Sweep Interval
      this.sweepInterval = setInterval(this._sweepInterval, 10_000)

      // Set Started To True
      this.started = true
    } else {
      console.error(`[plugin:Tebexio]`, `Disabled`.red, '::'.white, 'Invalid tebex secret, enter a valid one to enable!'.grey)
    }
  }

  public stop(): void {
    if (!this.started) return

    // Remove LevelTick Listner
    events.levelTick.remove(this._levelTick)

    // Stop Queue Check Recursive Loop
    clearTimeout(this.checkTimeout)

    // Stop Sweep Interval
    clearInterval(this.sweepInterval)

    // Set Started To False
    this.started = false
  }

  protected __levelTick(event: LevelTickEvent): void {
    // Update Online Players Map
    this.onlinePlayers = new Map(event.level.getPlayers().map((p) => [p.getCertificate().getXuid(), p]))
  }

  protected __checkQueue(): void {
    this.client.api.queue.get<TebexDueQueue>()
      .then((res) => {
        this.duePlayers = new Map(res.data.players.map((p) => [p.uuid, p]))
        this.offlineCommands = res.data.meta.execute_offline
        this.checkTimeout = setTimeout(this._checkQueue, res.data.meta.next_check * 1000)
        console.log(
          `[plugin:Tebexio]`,
          `Sweep queue request success`.grey,
          '::'.white,
          `GET /queue ${res.status}`.green,
          '::'.white,
          `Found ${res.data.players.length} players awaiting rewards with${res.data.meta.execute_offline ? '' : ' NO'} Offline Commands!`.grey,
          '::'.white,
          `Sweeping again in ${res.data.meta.next_check} seconds!`.grey
        )
      })
      .catch((err: AxiosError) => {
        console.error(
          `[plugin:Tebexio]`,
          `Sweep queue request failed`.grey,
          '::'.white,
          `GET /queue failed with code ${err.code}`.red,
          '::'.white,
          `Will attempt again in 60 seconds!`.grey
        )
        this.checkTimeout = setTimeout(this._checkQueue, 60_000)
      })
  }

  protected __sweepInterval(): void {
    for (const [xuid, player] of this.onlinePlayers.entries()) {
      if (this.duePlayers.has(xuid)) {
        // Get Due Object
        const due = this.duePlayers.get(xuid)!
        // Attempt Get Online Commands
        this._getCommands(due.id)
          .then((data) => {
            const completed: number[] = []
            for (const command of data.commands) {
              const final = command.command
                .replace(/{id}/gi, xuid)
                .replace(/{username}/gi, player.getName())

              // Check slots, if not enough return response to player
              const emptySlots = player.getInventory().getSlots().toArray().map(i => i.getName()).filter(name => name === 'minecraft:air').length

              if (command.conditions.slots && emptySlots < command.conditions.slots) {
                return player.sendMessage(`§cCannot claim reward, inventory needs ${command.conditions.slots} empty slots! Trying again in 10 seconds...`)
              }

              setTimeout(() => {
                bedrockServer.executeCommand(final)
                console.log(
                  `[plugin:Tebexio]`,
                  `Doing ${player.getName().cyan}${`'s transaction ${command.id}`.grey}`.grey,
                  '::'.white,
                  `${final}`.grey
                )
              }, command.conditions.delay)

              completed.push(command.id)
            }
            this.duePlayers.delete(xuid)
            if (completed.length) {
              const complete = (): void => {
                this._markAsComplete(completed)
                  .then(() => {
                    console.log(
                      `[plugin:Tebexio]`,
                      `Marked ${player.getName().cyan}${`'s transactions as completed`.grey}`.grey,
                      '::'.white,
                      `[${completed.join(', ')}]`.grey
                    )
                  })
                  .catch((err: AxiosError) => {
                    console.error(
                      `[plugin:Tebexio]`,
                      `Failed to mark ${player.getName().cyan}${`'s queue as complete!`.grey}`.grey,
                      '::'.white,
                      `DELETE /queue failed with code ${err.code}`.red,
                      '::'.white,
                      `Attempting again!`.grey
                    )
                    setTimeout(() => complete(), 0)
                })
              }
              complete()
            }
          })
          .catch((err: AxiosError) => {
            console.error(
              `[plugin:Tebexio]`,
              `Failed to get ${player.getName().cyan}${`'s transaction info!`.grey}`.grey,
              '::'.white,
              `GET /queue/online-commands/${due.id} failed with code ${err.code}`.red,
              '::'.white,
              `Will attempt again next sweep interval!`.grey
            )
          })
      } else continue
    }
    // Do Offline Commands If Exist
    if (this.offlineCommands) {
      this._getOfflineCommands()
        .then((data) => {
          const completed: number[] = []
          for (const command of data.commands) {
            const final = command.command
              .replace(/{id}/gi, String(command.player.id))
              .replace(/{username}/gi, command.player.name)

            // Check slots, if not enough return response to player

            setTimeout(() => {
              bedrockServer.executeCommand(final)
              console.log(
                `[plugin:Tebexio]`,
                `Doing offline command for ${command.player.name.cyan}${`'s transaction ${command.id}`.grey}`.grey,
                '::'.white,
                `${final}`.grey
              )
            }, command.conditions.delay)
            completed.push(command.id)
          }
          if (!completed.length) this.offlineCommands = false
          if (completed.length) {
            const complete = (): void => {
              this._markAsComplete(completed)
                .then(() => {
                  console.log(
                    `[plugin:Tebexio]`,
                    `Completing offline transactions`.grey,
                    '::'.white,
                    `[${completed.join(', ')}]`.grey
                  )
                })
                .catch((err: AxiosError) => {
                  console.error(
                    `[plugin:Tebexio]`,
                    `Failed to mark offline queue as complete!`.grey,
                    '::'.white,
                    `DELETE /queue failed with code ${err.code}`.red,
                    '::'.white,
                    `Attempting again!`.grey
                  )
                  setTimeout(() => complete(), 0)
                })
            }
            complete()
          }
        })
        .catch((err) => {
          console.error(
            `[plugin:Tebexio]`,
            `Failed to get offline commands!`.grey,
            '::'.white,
            `GET /queue/offline-commands failed with code ${err.code}`.red,
            '::'.white,
            `Will attempt again next sweep interval!`
          )
        })
    }
  }

  protected async _getCommands(transactionId: number): Promise<TebexDueOnlineCommands> {
    return new Promise((r, j) => {
      this.client.api.queue['online-commands'][transactionId]
        .get<TebexDueOnlineCommands>()
        .then(({ data }) => r(data))
        .catch((e: AxiosError) => j(e))
    })
  }

  protected async _getOfflineCommands(): Promise<TebexDueOfflineCommands> {
    return new Promise((r, j) => {
      this.client.api.queue['offline-commands']
        .get<TebexDueOfflineCommands>()
        .then(({ data }) => r(data))
        .catch((e: AxiosError) => j(e))
    })
  }

  protected async _markAsComplete(ids: number[]): Promise<void> {
    return new Promise((r, j) => {
      this.client.api.queue.delete({
        data: {
          ids
        }
      })
        .then(() => r())
        .catch((e) => j(e))
    })
  }
}
