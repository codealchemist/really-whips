const fs = require('fs')
const path = require('path')
const https = require('follow-redirects').https
const vscode = require('vscode')
const { alpacaUrl, alpacaModelUrl } = require('./urls')

function log () {
  console.log('[ Installer ]', ...arguments)
}

class Installer {
  constructor () {
    this.localPath = path.join(__dirname, '.')
    this.storeDir = 'alpaca'
    this.chatFilename = 'chat'
    this.chatFile = path.join(__dirname, this.storeDir, this.chatFilename)
    this.modelFilename = 'ggml-alpaca-7b-q4.bin'
    this.modelFile = path.join(__dirname, this.storeDir, this.modelFilename)
  }


  async download ({ url, dir, file }) {
    log('DOWNLOAD', ...arguments)
    return new Promise((resolve, reject) => {
      try {
        const filePath = path.join(this.localPath, dir)
        if (!fs.existsSync(filePath)){
          log('Create path')
          fs.mkdirSync(filePath, { recursive: true })
        }
    
        const fileWithPath = path.join(filePath, file)
        const fileStream = fs.createWriteStream(fileWithPath)
        https.get(url, response => {
          response.pipe(fileStream)
        
          // Close stream on done.
          fileStream.on('finish', () => {
            fileStream.close()
            log('Download completed', ...arguments)
            resolve(arguments, response)
          })
        })
      } catch (error) {
        log('Failed downloading file', arguments, error)
        reject(error)
      }
    })
  }

  setExecutable (file) {
    try {
      fs.chmodSync(file, 0o100)
      log('Set executable', { file })
    } catch (error) {
      log('Failed setting executable file', { file, error })
    }
  }

  isChatAppInstalled () {
    return fs.existsSync(this.chatFile)
  }

  isModelInstalled () {
    return fs.existsSync(this.modelFile)
  }

  showCompleted () {
    vscode.window.showInformationMessage("🦙 Installation completed! You can start hitting the LLaMA now 🎉")
  }

  async install () {
    const installed = {
      chat: this.isChatAppInstalled(),
      model: this.isModelInstalled()
    }

    // Both installed! Yay!
    if (installed.chat && installed.model) {
      vscode.window.showInformationMessage("🦙 Installation already completed. You can start hitting the LLaMA now!")
      return
    }

    // Install both.
    if (!installed.chat && !installed.model) {
      vscode.window.showInformationMessage("Installing 🦙: note that the lang model is 4GB, so it might take several minutes to donwload.")
      await this.download({ url: alpacaUrl, dir: this.storeDir, file: this.chatFilename })
      this.setExecutable(this.chatFile) // Set as executable.
      await this.download({ url: alpacaModelUrl, dir: this.storeDir, file: this.modelFilename })
      this.showCompleted()
      return
    }

    // Install chat app.
    if (!installed.chat) {
      vscode.window.showInformationMessage("Installing 🦙 chat app ...")
      await this.download({ url: alpacaUrl, dir: this.storeDir, file: this.chatFilename })
      this.setExecutable(this.chatFile) // Set as executable.
      this.showCompleted()
      log('Chat app installed')
      return
    }

    // Install language model.
    if (!installed.model) {
      vscode.window.showInformationMessage("Installing 🦙: note that the lang model is 4GB, so it might take several minutes to donwload.")
      await this.download({ url: alpacaModelUrl, dir: this.storeDir, file: this.modelFilename })
      this.showCompleted()
      log('Model installed')
      return
    }
  }
}

const installer = new Installer()
module.exports = installer
