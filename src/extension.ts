// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as noInstanceJson from './no-instance.json';

import * as incompatiblilityJson from './incompatiblility.json';
import * as IncompatibilityNumberJson from './Incompatibility-chooseNumber.json';
import * as IncompatibilityStringJson from './Incompatibility-chooseString.json';
import { start } from 'repl';
import { kMaxLength } from 'buffer';
const { spawnSync } = require('child_process')

const CHECKINGTYPE = 'checkingType';
const DOCUMENT = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : false;

interface region {
	tag: string
	start: number[]
	end: number[]
}

interface chameleonOutput{
	test: string
	format: format
	region: region

}

interface format{
	tag: string
	contents: number
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	const diagnosticsSet = vscode.languages.createDiagnosticCollection("haskellErrors");
	context.subscriptions.push(diagnosticsSet);

	let docSelector = {
		language: 'haskell',
		scheme: 'file',
	};

	let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
		docSelector,
		new MyCodeLensProvider()
	);
	  
	//context.subscriptions.push(codeLensProviderDisposable)

	let runChameleon = vscode.commands.registerCommand('haskell-debugging.runChameleon', () => {
		const editor = vscode.window.activeTextEditor;
		const workPath = vscode.workspace.rootPath;
		if (editor && workPath) {
			getChemelionErrors(diagnosticsSet, editor.document);
		}
	});

	let onSave = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		getChemelionErrors(diagnosticsSet, document)
	});

	let onOpen = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		getChemelionErrors(diagnosticsSet, document)
	});


	context.subscriptions.push(onOpen);
	context.subscriptions.push(onSave)
}

const getChemelionErrors = function(diognosticSet: vscode.DiagnosticCollection, document: vscode.TextDocument) {
	
	const workPath = vscode.workspace.rootPath;
	if(workPath){
		const filePath = document.fileName;
		const uri = document.uri;
		const fileName = filePath.split("\\").pop();
		
		let json: string;
		
		const reletivePath = filePath.replace(workPath, '');
		const jsonOut = spawnSync('C:\\Users\\Cody\\Documents\\GitHub\\chameleon\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe'
				+ ' --lib=C:\\Users\\Cody\\Documents\\GitHub\\chameleon ' 
				+ reletivePath
				+ ' --json', 
			{shell: "powershell.exe", cwd: workPath, encoding : 'utf8' }	
		).stdout;
		const messageOut = spawnSync('C:\\Users\\Cody\\Documents\\GitHub\\chameleon\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe'
				+ ' --lib=C:\\Users\\Cody\\Documents\\GitHub\\chameleon ' 
				+ reletivePath, 
			{shell: "powershell.exe", cwd: workPath, encoding : 'utf8' }	
		).stdout;
		const printString = messageOut.split("\n").filter((a: string) => a.includes("ERROR"))[0];
		diognosticSet.set(uri, processOutput(printString, jsonOut));
	}
};

const processOutput = function(error: string, jsonString: string) : vscode.Diagnostic[] {

	
	const json : chameleonOutput[] = JSON.parse(jsonString);

	const errors = json.filter((message:chameleonOutput) => message.format.tag === "TextHL")
	const diagnostics = errors.map((message:chameleonOutput): vscode.Diagnostic =>{
		const start = message.region.start;
		const end = message.region.end;
		return new vscode.Diagnostic(new vscode.Range(start[0] - 1, start[1] - 1, end[0] - 1, end[1] - 1), error);
	});

	
	return diagnostics;
};

// this method is called when your extension is deactivated
export function deactivate() {}

class MyCodeLensProvider implements vscode.CodeLensProvider {
	async provideCodeLenses(document: vscode.TextDocument): Promise<vscode.CodeLens[]> {
		
	
		
	
	let topOfDocument = new vscode.Range(0, 0, 0, 0);

	const editor = vscode.window.activeTextEditor;
	const workPath = vscode.workspace.rootPath;
	if (editor && workPath) {
		const document = editor.document;
		const filePath = document.fileName;
		const uri = document.uri;
		const fileName = filePath.split("\\").pop();
		
		let json: string;
		
		const reletivePath = filePath.replace(workPath, '');
		const jsonOut = spawnSync('C:\\Users\\Cody\\Documents\\GitHub\\chameleon\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe'
				+ ' --lib=C:\\Users\\Cody\\Documents\\GitHub\\chameleon ' 
				+ reletivePath
				+ ' --json', 
			{shell: "powershell.exe", cwd: workPath, encoding : 'utf8' }	
		).stdout;
		const messageOut = spawnSync('C:\\Users\\Cody\\Documents\\GitHub\\chameleon\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe'
				+ ' --lib=C:\\Users\\Cody\\Documents\\GitHub\\chameleon ' 
				+ reletivePath, 
			{shell: "powershell.exe", cwd: workPath, encoding : 'utf8' }	
		).stdout;
		const printString = messageOut.split("\n").filter((a: string) => a.includes("ERROR"))[0];
		const result = processOutput(printString, jsonOut);
		if (result.length > 0){
			const location = result[0].range
			let c: vscode.Command = {
				command: 'extension.addConsoleLog',
				title: printString,
			};
			let codeLens = new vscode.CodeLens(location, c);
			return [codeLens];
		}
	}

  
	
  
  
	return [];
	}
  }