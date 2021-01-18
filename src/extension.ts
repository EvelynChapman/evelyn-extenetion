// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Semantics } from './semantics';

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

interface ErrorDetail{
	fileName : String,
    description : String,
    lineNumber : Number,
    columnNumber  : Number,
    conflicts : [Conflict]
}

interface Conflict{
    colour : String, 
    label : String,
    instanciatedType : String,
    expectedType : String,
    locations : [Location]
}

interface Location{
	lineFrom : Number,
    lineTo : Number,
    columnFrom : Number,
    columnTo : Number
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

	//let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
	//	docSelector,
	//	new MyCodeLensProvider()
	//);
	  

	let onSave = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		getChemelionErrors(diagnosticsSet, document)
	});

	let onOpen = vscode.workspace.onDidOpenTextDocument((document: vscode.TextDocument) => {
		getChemelionErrors(diagnosticsSet, document)
	});


	context.subscriptions.push(onOpen);
	context.subscriptions.push(onSave);

	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(docSelector, new DocumentSemanticTokensProvider(), legend));

}



const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = (function () {
	const tokenTypesLegend = [
		'1', '2', '3', '4'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'documentation'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();



class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const builder = new vscode.SemanticTokensBuilder();
		builder.push(3, 0, 3, 0, 0);
		builder.push(3, 10, 6, 0, 0);
		console.log(builder.build())
		return builder.build();
	}
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
		
		const diagnostics = processOutput(printString, jsonOut);
		
		//console.log(diagnostics)
		diognosticSet.set(uri, diagnostics);
	}
};





const processOutput = function(error: string, jsonString: string) : vscode.Diagnostic[] {
	//console.log(jsonString)
	if (jsonString === ''){
		//console.log("fuck")
		return [];
	}
	const json : chameleonOutput[] = JSON.parse(jsonString);
	//console.log(jsonString.length)
	const errors = json.filter((message:chameleonOutput) => message.format.tag === "TextHL")
	const diagnostics: vscode.Diagnostic[] = errors.map((message:chameleonOutput): vscode.Diagnostic =>{
		const start = message.region.start;
		const end = message.region.end;
		return new vscode.Diagnostic(new vscode.Range(start[0] - 1, start[1] - 1, end[0] - 1, end[1] - 1), error);
	});
	console.log(diagnostics);
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
				const location = result[0].range;
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

"https://cdn.mos.cms.futurecdn.net/gofvpedSqHBfoC3RKe559N.jpg"
