Vue.config.devtools = true

const app = new Vue({
  el: '#app',

  data() {
    return {
      players: [
        { id: 1, name: 'Spencer Horton', avatar: 'player-1.jpg' },
        { id: 2, name: 'Glen Rouse', avatar: 'player-2.jpg' },
        { id: 3, name: 'Phoenix Walker', avatar: 'player-3.jpg' },
        { id: 4, name: 'Judy Sewell', avatar: 'player-4.jpg' },
        { id: 5, name: 'Victor Hansen', avatar: 'player-5.jpg' },
        { id: 6, name: 'Alisa Hester', avatar: 'player-6.jpg' },
        { id: 7, name: 'Kelis Ford', avatar: 'player-7.jpg' },
        { id: 8, name: 'Rene Wells', avatar: 'player-8.jpg' },
        { id: 9, name: 'Calla Wang', avatar: 'player-9.jpg' },
        { id: 10, name: 'Dorian Cordova', avatar: 'player-10.jpg' },
      ],
      selectedPlayer: {
        player1: { id: 4, name: '', avatar: '' },
        player2: { id: 2, name: '', avatar: '' },
      },
      health: {
        player1: 100,
        player2: 100,
      },
      status: {
        play: false,
        winner: false,
        giveUp: false,
      },
      limit: {
        heal: 3,
      },
      tracker: {
        heal: 0,
      },
      stats: {
        win: {
          player1: 0,
          player2: 0,
        }
      },
      logs: [],
      els: {
        logs: document.querySelector('.logs')
      }
    }
  },

  created () {
    this.selectRandPlayers()
  },

  methods: {
    getRandPlayers () {
      return this.players[Math.floor(Math.random() * this.players.length)]
    },

    selectRandPlayers () {
      const rand = setInterval(() => {
        if (this.status.play) clearInterval(rand)

        this.selectedPlayer.player1 = this.getRandPlayers()
        this.selectedPlayer.player2 = this.getRandPlayers()

        if (this.selectedPlayer.player1 === this.selectedPlayer.player2) {
          this.selectedPlayer.player2 = this.getRandPlayers()
        }
      }, 1000)
    },

    resetCrown (players) {
      players.forEach((player) => {
        if (this.selectedPlayer[player].name.includes('👑')) {
          this.selectedPlayer[player].name = this.selectedPlayer[player].name.split('👑').filter(n => n).join(' ').trim()
        }
      })
    },

    startNewGame() {
      this.resetCrown(['player1', 'player2'])
      this.status.play = true
      this.status.winner = false
      this.status.giveUp = false
      this.health.player1 = 100
      this.health.player2 = 100
      this.tracker.heal = 0
      this.logs = []
      this.stats.win.player1 = 0
      this.stats.win.player2 = 0
    },

    reBattle () {
      this.resetCrown(['player1', 'player2'])
      this.status.play = true
      this.status.winner = false
      this.status.giveUp = false
      this.health.player1 = 100
      this.health.player2 = 100
      this.tracker.heal = 0
      this.logs = []
    },

    exitGame () {
      this.resetCrown(['player1', 'player2'])
      this.selectRandPlayers()
      this.stats.win.player1 = 0;
      this.stats.win.player2 = 0;
      this.status.play = false
      this.status.winner = false
      this.status.giveUp = false
    },

    gameOver () {
      this.status.play = false
      this.status.winner = true
      this.status.giveUp = false
    },

    determineTheWinner() {
      if (this.health.player1 <= 0 && this.health.player2 <= 0) {
        this.createLog('NO ONE WIN THIS BATTLE ⚔️')
        this.gameOver()
        return true
      }

      if (this.health.player1 <= 0) {
        const name = this.selectedPlayer.player2.name.toUpperCase()
        this.selectedPlayer.player2.name = `👑 ${name}`
        this.stats.win.player2 += 1
        this.health.player1 = 0;
        this.createLog(`${name} HAS WON THE BATTLE ⚔️`)
        this.gameOver()
        return true
      }

      if (this.health.player2 <= 0) {
        const name = this.selectedPlayer.player1.name.toUpperCase()
        this.selectedPlayer.player1.name = `👑 ${name}`
        this.stats.win.player1 += 1
        this.health.player2 = 0;
        this.createLog(`${name} HAS WON THE BATTLE ⚔️`)
        this.gameOver()
        return true
      }

      return false
    },

    calcDemage (min = 2, max = 10) {
      return Math.max(Math.floor(Math.random() * max) + 1, min)
    },

    createLog (message) {
      const logs = document.querySelector('.logs')

      setTimeout(() => {
        logs.scrollTo({
          left: 0,
          top: logs.scrollHeight,
          behavior: 'smooth',
        })
      }, 0)

      this.logs.push(`${message}\n`)
    },

    attack() {
      const player1 = this.selectedPlayer.player1.name
      const player2 = this.selectedPlayer.player2.name
      const demangePlayer1 = this.calcDemage()
      const demagePlayer2 = this.calcDemage()

      this.health.player1 -= demangePlayer1
      this.health.player2 -= demagePlayer2

      this.createLog(`${player1} hits ${player2} for ${demagePlayer2}`)
      this.createLog(`${player2} hits ${player1} for ${demangePlayer1}`)

      if (this.determineTheWinner()) return

      this.determineTheWinner()
    },

    specialAttack() {
      const player1 = this.selectedPlayer.player1.name
      const player2 = this.selectedPlayer.player2.name
      const demangePlayer1 = this.calcDemage(10, 25)
      const demagePlayer2 = this.calcDemage(10, 25)

      this.health.player1 -= demangePlayer1
      this.health.player2 -= demagePlayer2

      this.createLog(`${player1} hits ${player2} for ${demagePlayer2}`)
      this.createLog(`${player2} hits ${player1} for ${demangePlayer1}`)

      if (this.determineTheWinner()) return

      this.determineTheWinner()
    },

    heal() {
      const isHealthBarFull = this.health.player1 < 90 && this.health.player2 < 90

      if (this.tracker.heal < this.limit.heal && isHealthBarFull) {
        this.tracker.heal++

        const player1 = this.selectedPlayer.player1.name
        const player2 = this.selectedPlayer.player2.name

        if (this.health.player1 >= 100) this.health.player1 = 100
        if (this.health.player2 >= 100) this.health.player2 = 100

        this.health.player1 += 10
        this.health.player2 += 10

        this.createLog(`${player1} heals himself for ${10}`)
        this.createLog(`${player2} heals himself for ${10}`)
      }
    },

    showDialogGiveUp () {
      const giveUpDialogBackdrop = document.createElement('div')

      giveUpDialogBackdrop.className = 'give-up-dialog-backdrop'

      document.getElementById('give-up-dialog').setAttribute('open', 'true')
      document.body.appendChild(giveUpDialogBackdrop)

      giveUpDialogBackdrop.addEventListener('click', () => {
          this.hideDialogGiveUp()
      })
    },

    hideDialogGiveUp () {
      document.getElementById('give-up-dialog').removeAttribute('open')
      document.querySelector('.give-up-dialog-backdrop').remove()
    },

    giveUp () {
      const winStats = this.stats.win
      const player1 = this.selectedPlayer.player1.name
      const player2 = this.selectedPlayer.player2.name
      const player1Win = winStats.player1 > winStats.player2
      const player2Win = winStats.player2 > winStats.player1
      const tie = winStats.player1 > 0 && winStats.player2 > 0 && winStats.player1 === winStats.player2
      const equalWinStatsAndNotFullHealthBar = winStats.player1 === winStats.player2 && this.health.player1 < 100 && this.health.player2 < 100
      const noWinAndLogs = winStats.player1 === 0 && winStats.player2 === 0 && this.logs.length === 1 || this.logs.length === 0

      if (player1Win) {
        this.createLog(`${player1} HAS WON THE BATTLE ⚔️, AFTER ${player2} CHOOSE TO SURRENDER.`)
      } else if (player2Win) {
        this.createLog(`${player2} HAS WON THE BATTLE ⚔️, AFTER ${player1} CHOOSE TO SURRENDER.`)
      } else if (tie) {
        this.createLog(`THE BATTLE ⚔️ WAS TIE.`)
      } else if (equalWinStatsAndNotFullHealthBar) {
        this.createLog(`THe BATTLE ⚔️ WAS EPIC! BUT TWO SIDES AGREE TO MAKE A PEACE.`)
      } else {
        this.createLog(`THE BATTLE ⚔️ WAS NEVER HAPPAND! TWO SIDES AGREE TO MAKE A PEACE.`)
      }

      this.status.giveUp = true
      this.status.play = false
      this.status.winner = false
      this.tracker.heal = 0
      this.hideDialogGiveUp()
      this.selectRandPlayers()
    },

    healthBarColorStatus(value) {
      return {
        'is-primary': value > 50 && value <= 80,
        'is-success': value > 30 && value <= 50,
        'is-warning': value > 10 && value <= 30,
        'is-error': value <= 10,
      }
    },
  }
})