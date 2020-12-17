// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as noInstanceJson from './no-instance.json';

import * as incompatiblilityJson from './incompatiblility.json';
import * as IncompatibilityNumberJson from './Incompatibility-chooseNumber.json';
import * as IncompatibilityStringJson from './Incompatibility-chooseString.json';
import { execFile } from 'child_process';
const { exec } = require('child_process')

const CHECKINGTYPE = 'checkingType';
const DOCUMENT = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : false;

interface error {
	message: string
	locations: location[]
}
interface location{
	fromLine: number
	toLine: number
	fromColumn: number
	toColumn: number
}

interface parsedJson {
	fileName: string
	moduleName: string
	errors: error[] 
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	const diagnosticsSet = vscode.languages.createDiagnosticCollection("haskellErrors");
	context.subscriptions.push(diagnosticsSet);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let basicErrors = vscode.commands.registerCommand('haskell-debugging.showHighlight', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const filePath = document.fileName;
			const fileName = filePath.split("\\").pop()?.split(".").shift();
			switch(fileName){
				case "No-Instance":
					updateDiagnostics(document, diagnosticsSet, noInstanceJson);
					break;
				case "Incompatibility":
					updateDiagnostics(document, diagnosticsSet, incompatiblilityJson);
					break;
				default:
					vscode.window.showInformationMessage('This function can only be used with Incompatibility.hs or no-instance.hs');
					return;
			}
			
			
		}

	});

	let selectType = vscode.commands.registerCommand('haskell-debugging.startTypeQuestion', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const filePath = document.fileName;
			const fileName = filePath.split("\\").pop()?.split(".").shift();
			const uri = document.uri;
			if (fileName != "Incompatibility"){
				vscode.window.showInformationMessage('This function can only be used with Incompatibility.hs');
				return;
			}
			

			const diagnostics = incompatiblilityJson.errors.map(error => error.locations.map(
				l => new vscode.Diagnostic(new vscode.Range(l.fromLine, l.fromColumn, l.toLine, l.toColumn), error.message))).flat();
			
			for (let item of diagnostics) {
				item.code = CHECKINGTYPE;
			}      
			diagnosticsSet.set(uri, diagnostics); 
		}
	});

	let runChameleon = vscode.commands.registerCommand('haskell-debugging.runChameleon', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const filePath = document.fileName;
			const fileName = filePath.split("\\").pop();
			
			//var spawn = require("child_process").spawn,child;
			//child = spawn("C:\\Users\\Cody\\chameleon-master\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe",['--lib="C:\\Users\\Cody\\chameleon-master"', filePath]);
			//child.stdout.on("data", (data: string) => {
			//	console.log("Powershell Data: " + data);
			//});
			//child.stderr.on("data", (data: string) => {
			//	console.log("Powershell Data: " + data);
			//});
		//`C:\\Users\\Cody\\chameleon-master\\.stack-work\\install\\1afa3193\\bin\\chameleon.exe`, ['--lib="C:\\Users\\Cody\\chameleon-master"', 'C:\\Users\\Cody\\evelyn-extenetion\\examples\\sumLength.hs'
			execFile('get-location', [], function (error: any, stdout: string, stderr: any) {
				if (error) {
					console.log(error);
					vscode.window.showErrorMessage("Chameleon errors")
				}
				console.log(stdout);
			});

		}


	});
	context.subscriptions.push(runChameleon);
	context.subscriptions.push(basicErrors);
	context.subscriptions.push(selectType);
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'haskell' }, new TypeChooser(), {
			providedCodeActionKinds: TypeChooser.providedCodeActionKinds
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('haskell-debugging.updateDiognostics', (json) => {
			DOCUMENT ?
			updateDiagnostics(DOCUMENT, diagnosticsSet, json) :
			vscode.window.showInformationMessage('This function can only be used with Incompatibility.hs');
		})
	);

}



const jsonToDiagnostics = function(string: string) : vscode.Diagnostic[] {

	
	const json : parsedJson= JSON.parse(string);

	const diagnostics = json.errors.map((e : error) => e.locations.map(
		l => new vscode.Diagnostic(new vscode.Range(l.fromLine, l.fromColumn, l.toLine, l.toColumn), e.message))).flat();
	
	return diagnostics;
	} ;

// this method is called when your extension is deactivated
export function deactivate() {}

const updateDiagnostics = function(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection, json: parsedJson){
	const uri = document.uri;

	const diagnostics = json.errors.map(error => error.locations.map(
		l => new vscode.Diagnostic(new vscode.Range(l.fromLine, l.fromColumn, l.toLine, l.toColumn), error.message))).flat();

	diagnosticCollection.set(uri, diagnostics);
};


export class TypeChooser implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.CodeAction[] {
		console.log(context.diagnostics);
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === CHECKINGTYPE)
			.map(diagnostic => this.createCommandCodeAction(diagnostic)).flat();
	}

	private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction[] {
		const action = new vscode.CodeAction('type is \'whoIsRight: Bool -> String\'', vscode.CodeActionKind.QuickFix);
		action.command = { command: 'haskell-debugging.updateDiognostics', title: 'Set to string', arguments: [IncompatibilityStringJson]};
		action.diagnostics = [diagnostic];
		action.isPreferred = false;
		const action2 = new vscode.CodeAction('type is \'whoIsRight: Num a => Bool -> a\'', vscode.CodeActionKind.QuickFix);
		action2.command = { command: 'haskell-debugging.updateDiognostics', title: 'Set to number', arguments: [IncompatibilityNumberJson]};
		action2.diagnostics = [diagnostic];
		action2.isPreferred = false;
		return [action, action2];
	}
}