const fs = require('fs')
const { spawn } = require('child_process')
const cleanup = require('./cleanup')

class Alpaca {
  constructor ({ path, method = './chat' }) {
    this.path =  path
    this.method = method
    this.isAlpacaLoaded = false
    this.loadedString = '\nALPACA LOADED\n'
    this.isInitialized = false
    this.timeout = null
    this.init()
  }

  isInstalled () {
    const chatFile = `${this.path}/chat`
    return fs.existsSync(chatFile)
  }

  init () {
    if (!this.isInstalled()) {
      console.log('Not installed yet')
      return
    }

    console.log('STARTING 🦙')
    try {
      this.alpacaProc = spawn(this.method, [], {
        cwd: this.path,
        detached: true
      })

      this.alpacaProc.stdout.on('data', data => {
        process.stdout.write(data)
        if (!data) return

        // Wait until alpaca process loads.
        if (!this.isAlpacaLoaded) {
          if (!data.toString().match(this.loadedString)) {
            console.log('·')
            return
          }

          console.log('🦙 Loaded!')
          this.isAlpacaLoaded = true
        }

        if (data.toString().match(this.loadedString)) return

        // Ignore prompt prefix.
        if (data.toString() === '\n> ') {
          console.log('Response completed')
          return
        }
        
        if (typeof this.onDataCallback === 'function') {
          this.onDataCallback(this.responsePrefix + this.clean(data))
          this.responsePrefix = ''
        }
      })

      this.alpacaProc.stderr.on('data', error => {
        console.log('ERROR', error.toString())
        if (typeof this.onErrorCallback === 'function') {
          this.onErrorCallback(error)
        }
      })

      this.alpacaProc.on('close', code => {
        console.log('CLOSED', { code })
      })

      // Ensure we kill the child Alpaca process on exit.
      cleanup(() => {
        console.log('Killing 🦙')
        this.alpacaProc.kill('SIGKILL')
        this.isAlpacaLoaded = false
      })

      // Init ok!
      this.isInitialized = true
    } catch (error) {
      console.log('Init failed', error)
    }
  }

  clean (data) {
    return data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
  }

  onData (callback) {
    this.onDataCallback = callback
  }

  onError (callback) {
    this.onErrorCallback = callback
  }

  ask (prompt) {
    if (!this.isInitialized) {
      clearTimeout(this.timeout)
      console.log('Ask queued, waiting to init...')
      this.init()

      this.timeout = setTimeout(() => {
        this.ask(prompt)
      }, 1000 * 5)
      return
    }

    this.responsePrefix = '\n'
    this.alpacaProc.stdin.write(`${prompt}\n`)
  }
}

module.exports = Alpaca
