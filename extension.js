// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path = require('path')
const vscode = require('vscode')
const Alpaca = require('./alpaca')
const installer = require('./installer')

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

const alpacaPath = path.join(__dirname, 'alpaca/')
const alpaca = new Alpaca({ path: alpacaPath })

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "really-whips" is now active!')

  const installDisposable = vscode.commands.registerCommand('really-whips.installAlpaca', async function () {
    await installer.install()
  })

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const hitDisposable = vscode.commands.registerCommand('really-whips.hitLlama', async function () {
    const editor = vscode.window.activeTextEditor
		// The code you place here will be executed every time your command is executed

    // vscode.window.showInformationMessage("It really whips the LLaMA's ass! 🦙")
    
    // Get response and write it to current file.
    alpaca.onData(data => {
      // console.log(data.toString())
      console.log('-')
      if (!editor) {
        console.log('No editor to write to!')
        return
      }

      editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.end, data.toString())
      })
    })

    // Get user input.
    // const input = await vscode.window.showInputBox()
    // vscode.window.showInformationMessage('Asking 🦙 ...')
    // alpaca.ask(input)

    // Warn if Alpaca is not installed yet.
    if (!alpaca.isInstalled()) {
      vscode.window.showInformationMessage('Please, complete "Alpaca Install 🦙" command first')
      return
    }

    // Get selected text.
    const selection = editor.selection

    // No selected text. Show info.
    if (!selection || selection.isEmpty) {
      vscode.window.showInformationMessage('Write your prompt for the 🦙 and select it first 😉')
      return
    }
    
    // Ask selected text.
    const selectionRange = new vscode.Range(selection.start.line, selection.start.character, selection.end.line, selection.end.character)
    const selectedText = editor.document.getText(selectionRange)
    vscode.window.showInformationMessage('Asking 🦙 ...')
    const langId = editor.document.languageId
    console.info(`LANG ID: ${langId}`)
    alpaca.ask(`${langId} ${selectedText}`)
	})

	context.subscriptions.push(hitDisposable)
	context.subscriptions.push(installDisposable)
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
