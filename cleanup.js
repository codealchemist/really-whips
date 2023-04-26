let alreadyCleanedUp = false

function cleanup (callback) {
  function exitHandler () {
    if (alreadyCleanedUp) {
      console.log('Already cleaned up, just exit.')
      // process.exit()
      return
    }
  
    alreadyCleanedUp = true
    console.log('\nCLEANUP 🧹')
    callback()
    // process.exit()
  }
  // process.stdin.resume() //so the program will not close instantly

  //do something when app is closing
  process.on('exit', exitHandler)

  //catches ctrl+c event
  process.on('SIGINT', exitHandler)

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler)
  process.on('SIGUSR2', exitHandler)

  //catches uncaught exceptions
  process.on('uncaughtException', exitHandler)
}

module.exports = cleanup
