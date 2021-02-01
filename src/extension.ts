// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { randomInt } from 'crypto';
import * as vscode from 'vscode';
import * as Json1 from './testJson.json';
import * as Json2 from './testJson2.json';
const { spawnSync } = require('child_process')

const CHECKINGTYPE = 'checkingType';
const TEXTEDITOR = vscode.window.activeTextEditor ? vscode.window.activeTextEditor : false;
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
	fileName : string,
    description : string,
    line : number,
    column  : number,
    conflicts : Conflict[]
}

interface Conflict{
    highlightColor : string, 
    label : string,
    instanciatedType : string,
    expectedType : string,
    locations : Location[]
}

interface Location{
	lineFrom : number,
    lineTo : number,
    columnFrom : number,
    columnTo : number
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	const diagnosticsSet = vscode.languages.createDiagnosticCollection("haskellErrors");
	context.subscriptions.push(diagnosticsSet);

	//let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
	//	docSelector,
	//	new MyCodeLensProvider()
	//);

	let runChameleon = vscode.commands.registerCommand('haskell-debugging.runChameleon', () => {
		currentError = Json1
		if (vscode.window.activeTextEditor) decorate(vscode.window.activeTextEditor, currentError);
	});

	let clearChameleon = vscode.commands.registerCommand('haskell-debugging.clearChameleon', () => {
		clearDecorations()
	});

	let toggleChameleon = vscode.commands.registerCommand('haskell-debugging.toggleChameleon', () => {
		if (decorationsArchive.length > 0){
			clearDecorations()
		}else{
			currentError = Json2
			if (vscode.window.activeTextEditor) decorate(vscode.window.activeTextEditor, currentError);
		}
	});

	  

	let onSave = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		clearDecorations()
		currentError = Json2
		getChemelionErrors(diagnosticsSet, document);
		console.log("document save")
		if (vscode.window.activeTextEditor) decorate(vscode.window.activeTextEditor, currentError);
	});

	let onSwap = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		clearDecorations()
		currentError = Json1
		
		console.log("swap document")
		if (editor) decorate(editor, Json1);
	});

	let docSelector = {
		language: 'haskell',
		scheme: 'file',
	  }

	let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
		docSelector,
		new CodeLensProvider()
	)
	  
	context.subscriptions.push(codeLensProviderDisposable)



	context.subscriptions.push(onSave);
	
	context.subscriptions.push(onSwap);
	context.subscriptions.push(runChameleon);
	context.subscriptions.push(clearChameleon);
	context.subscriptions.push(toggleChameleon);


	//context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(docSelector, new DocumentSemanticTokensProvider(), legend));
}

const ChemelionDecoration1 = vscode.window.createTextEditorDecorationType({
	fontStyle: 'bold',
	backgroundColor: '#3e90b6',
	border: '2px solid white',
	
  });

const ChemelionDecoration2 = vscode.window.createTextEditorDecorationType({
backgroundColor: '#571643',
border: '2px solid white',
});

export function activateDecotator(context: vscode.ExtensionContext) {
	vscode.workspace.onWillSaveTextDocument(event => {
	  const openEditor = vscode.window.visibleTextEditors.filter(
		editor => editor.document.uri === event.document.uri
	  )[0];
	  decorate(openEditor);
	});
}

let decorationsArchive: vscode.TextEditorDecorationType[] = [];
let currentError: ErrorDetail | null;

const clearDecorations = function(){
	currentError = null;
	//decorationsArchive.forEach((dec: vscode.TextEditorDecorationType) => dec.dispose())
	decorationsArchive = decorationsArchive.reduce((acc, dec: vscode.TextEditorDecorationType) => {
		dec.dispose();
		return [];
	}, []);
};

const locationToRange = function(loc: Location): vscode.Range{
	 return new vscode.Range(loc.lineFrom, loc.columnFrom, loc.lineTo, loc.columnTo)
};


const decorate = function(editor: vscode.TextEditor, error: ErrorDetail){
	//console.log("FICK")
	//clearDecorations();
	let decorationsArray: vscode.DecorationOptions[] = [];
	//console.log(error)
	//let snippet = new vscode.SnippetString('console.log($1);\n')

	//editor.insertSnippet(snippet, new vscode.Range(error.line, error.column, error.line, error.column))

	const overallType = vscode.window.createTextEditorDecorationType({
		border: 'dotted dotted solid solid' ,
		isWholeLine: true
	});
	const startRow = error.line
	let endRow = error.line
	let endCol = 0
	error.conflicts.forEach((conflict: Conflict) =>{
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: conflict.highlightColor
		});

		decorationsArchive.push(decorationType);
		const string =   conflict.label 
		const types = "Exprected Type :: " + conflict.expectedType + "\nInstanciated Type :: " + conflict.instanciatedType;
		let message = new vscode.MarkdownString().appendCodeblock(string, "txt").appendCodeblock(types, "haskell")
		message.isTrusted = true;
		let decorations = conflict.locations.map((loc:Location) : vscode.DecorationOptions  => {
			if (loc.lineTo > endRow) endRow = loc.lineTo;
			return {
				range : locationToRange(loc),
				hoverMessage : message
			}
		}
		);
		editor.setDecorations(decorationType, decorations);
	})
	decorationsArchive.push(overallType)
	editor.setDecorations(overallType, [
		{
			range : new vscode.Range(startRow, 0, endRow, 100),
			hoverMessage : new vscode.MarkdownString().appendText("--- Chameleon Error --- \n" + error.description)
		}
	])
		

	

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
		builder.push(3, 10, 6, 1, 0);
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

export class CodeLensProvider implements vscode.CodeLensProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[]{
		console.log(currentError)
		console.log("yeet")
		if (!currentError) {
			console.log("no erroe")
			return [];
		}
		const range = new vscode.Range(currentError.line, currentError.column, currentError.line, currentError.column);
		const c: vscode.Command = {
			command: 'haskell-debugging.toggleChameleon',
			tooltip: 'Clear Chameleon Errors',
			title: currentError.description + " (Click to toggle)"
		} ;
		let codeLens = new vscode.CodeLens(range, c);
		console.log(codeLens)
		console.log("codelens")
		return [codeLens];
	}

}

"https://cdn.mos.cms.futurecdn.net/gofvpedSqHBfoC3RKe559N.jpg"
