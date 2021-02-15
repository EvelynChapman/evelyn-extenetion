// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { randomInt } from 'crypto';
import * as vscode from 'vscode';
import * as Json1 from './testJson.json';
import * as Json2 from './testJson2.json';
const { spawnSync } = require('child_process');

const CHECKINGTYPE = 'checkingType';
const TEXTEDITOR = vscode.window.activeTextEditor ? vscode.window.activeTextEditor : false;
const DOCUMENT = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : false;

interface ErrorDetail{
	fileName : string,
    description : string,
    lineNumber : number,
    columnNumber  : number,
    conflicts : Conflict[]
}

interface Conflict{
    colour : string, 
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

let chameleonRunning = false;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	vscode.commands.executeCommand('setContext', 'chameleon:diagnosisVisibility', false);
	let annotations: vscode.TextEditorDecorationType[];
	let specialAnno: vscode.TextEditorDecorationType;


	let viewDiagnosis = vscode.commands.registerCommand('haskell-debugging.viewDiagnosis', () => {
		vscode.commands.executeCommand('setContext', 'chameleon:diagnosisVisibility', true);
		chameleonRunning = true;
		if ( vscode.window.activeTextEditor &&vscode.window.activeTextEditor.document){
			//currentError = getChemelionErrors(vscode.window.activeTextEditor.document, context.extensionUri.fsPath)
			decorate(vscode.window.activeTextEditor, currentError)
		}
	});

	let hideDiagnosis = vscode.commands.registerCommand('haskell-debugging.hideDiagnosis', () => {
		vscode.commands.executeCommand('setContext', 'chameleon:diagnosisVisibility', false);
		chameleonRunning = false;
		clearDecorations();
	});




	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	const diagnosticsSet = vscode.languages.createDiagnosticCollection("haskellErrors");
	context.subscriptions.push(diagnosticsSet);

	//let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
	//	docSelector,
	//	new MyCodeLensProvider()
	//);

	let runChameleon = vscode.commands.registerCommand('haskell-debugging.runChameleon', () => {
		//currentError = Json1;
		if (vscode.window.activeTextEditor) {decorate(vscode.window.activeTextEditor, currentError);}
	});

	let clearChameleon = vscode.commands.registerCommand('haskell-debugging.clearChameleon', () => {
		clearDecorations();
	});

	let toggleChameleon = vscode.commands.registerCommand('haskell-debugging.toggleChameleon', () => {
		if (decorationsArchive.length > 0){
			clearDecorations();
		}else{
			//currentError = Json2;
			if (vscode.window.activeTextEditor) {decorate(vscode.window.activeTextEditor, currentError);}
		}
	});

	  

	let onSave = vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
		clearDecorations();
		if (document){
			currentError = getChemelionErrors(document, context.extensionUri.fsPath);
		}
		if (vscode.window.activeTextEditor && chameleonRunning) {decorate(vscode.window.activeTextEditor, currentError);}
	});

	let onSwap = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		clearDecorations();
		if (editor?.document){
			currentError = getChemelionErrors(editor.document, context.extensionUri.fsPath);
		}
		if (editor && chameleonRunning) {decorate(editor, currentError);}
	});

	let docSelector = {
		language: 'haskell',
		scheme: 'file',
	};

	let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
		docSelector,
		new CodeLensProvider()
	);
	  
	context.subscriptions.push(codeLensProviderDisposable);



	context.subscriptions.push(onSave, viewDiagnosis, hideDiagnosis);
	
	context.subscriptions.push(onSwap);
	context.subscriptions.push(runChameleon);
	context.subscriptions.push(clearChameleon);
	context.subscriptions.push(toggleChameleon);


	//context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(docSelector, new DocumentSemanticTokensProvider(), legend));
}

let decorationsArchive: vscode.TextEditorDecorationType[] = [];
let currentError: ErrorDetail | undefined;

const clearDecorations = function(){
	//decorationsArchive.forEach((dec: vscode.TextEditorDecorationType) => dec.dispose())
	decorationsArchive = decorationsArchive.reduce((acc, dec: vscode.TextEditorDecorationType) => {
		dec.dispose();
		return [];
	}, []);
};

const locationToRange = function(loc: Location): vscode.Range{
	 return new vscode.Range(loc.lineFrom, loc.columnFrom, loc.lineTo, loc.columnTo);
};

const subRange = function (document:vscode.TextDocument, range: vscode.Range): vscode.Range[] {
	let start = document.offsetAt(range.start);
	let end = document.offsetAt(range.end);
	let subranges: vscode.Range[] = [];
	for (let i = start; i < end; i += 1) {
		let curr = document.positionAt(i);
		let next = document.positionAt(i + 1);
		subranges = [...subranges, new vscode.Range(curr, next)]
	}
	return subranges
}

const joinRange = function (document:vscode.TextDocument, subranges: vscode.Range[]): vscode.Range {
	let offsets = subranges
		.flatMap(subrange => [document.offsetAt(subrange.start), document.offsetAt(subrange.end)])

	let min:number = offsets.reduce((a, b)=> a > b ? b : a ,Infinity);
	let max:number = offsets.reduce((a, b)=> a > b ? a : b ,0);;
	return new vscode.Range(document.positionAt(min), document.positionAt(max))
}

const isTokenSeperator = function (s: string) {
	console.log(s)
	return /\s/g.test(s);
}
const cleanUpWhiteTokenSeperator = function (editor:vscode.TextEditor, range: vscode.Range): vscode.Range {
	let document = editor.document
	let subranges = subRange(document, range)
		.filter(srange => !isTokenSeperator(editor.document.getText(srange)))
	let joind = joinRange(document, subranges)
	console.log(joind)
	return joind
}

const decorate = function(editor: vscode.TextEditor, error: ErrorDetail | undefined){
	console.log("yrrt");
	if (error === undefined) {
		console.log("KILLED");
		return undefined;
	}

	const overallType = vscode.window.createTextEditorDecorationType({
		border: 'dotted dotted solid solid' ,
		isWholeLine: true
	});
	const startRow = error.lineNumber;
	let endRow = error.lineNumber;
	let endCol = 0;
	error.conflicts.forEach((conflict: Conflict) =>{
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: conflict.colour
		});

		decorationsArchive.push(decorationType);
		const string =   conflict.label ;
		const types = "Exprected Type :: " + conflict.expectedType + "\nInstanciated Type :: " + conflict.instanciatedType;
		let message = new vscode.MarkdownString().appendCodeblock(string, "txt").appendCodeblock(types, "haskell");
		message.isTrusted = true;
		let decorations = conflict.locations.map((loc:Location) : vscode.DecorationOptions  => {
			if (loc.lineTo > endRow) {endRow = loc.lineTo;}
			return {
				range : cleanUpWhiteTokenSeperator(editor, locationToRange(loc)),
				hoverMessage : message
			};
		}
		);
		editor.setDecorations(decorationType, decorations);
	});
	decorationsArchive.push(overallType);
	editor.setDecorations(overallType, [
		{
			range : new vscode.Range(startRow, 0, endRow, 100),
			hoverMessage : new vscode.MarkdownString().appendText("--- Chameleon Error --- \n" + error.description)
		}
	]);
		

	

};



const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const getChemelionErrors = function (document: vscode.TextDocument, extentionPath: string): ErrorDetail | undefined{
	const workPaths = vscode.workspace.workspaceFolders;
	if (workPaths?.length) {
		const workPath = workPaths[0].uri.fsPath;
		const filePath = document.uri.path;
		let fileName: string;
		if (document.uri.scheme === "file") {
			fileName = filePath
				.split('/')
				.reduce((accu, curr, currIn, arr) => currIn === arr.length - 1 ? accu + curr : accu, "");

		} else if (document.uri.scheme === "git") {
			fileName = filePath
				.split('/')
				.reduce((accu, curr, currIn, arr) => currIn === arr.length - 1 ? accu + curr : accu, "")
				.split('.')
				.reduce((accu: string[], curr, currIn, arr) => currIn === arr.length - 1 ? accu : [...accu, curr], [])
				.join('.');
		} else {
			fileName = "none";
		}
		//console.log(`${extentionPath}\\bin\\chameleon.exe`+ ` --lib=${extentionPath}\\bin `+ fileName);
		const chameleonProcess = spawnSync(
			`${extentionPath}\\bin\\chameleon.exe`
			+ ` --lib=${extentionPath}\\bin `
			+ fileName,
			{ shell: "powershell.exe", cwd: workPath, encoding: 'utf8' }
		);
		//console.log(chameleonProcess.stdout);
		if (chameleonProcess.stdout === 'InfFailureUConsUnmatched'){
			return undefined;
		}
		let errors: ErrorDetail = JSON.parse(chameleonProcess.stdout)[0];
		return errors;
	}
};

// this method is called when your extension is deactivated
export function deactivate() {}
export class CodeLensProvider implements vscode.CodeLensProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[]{
		//console.log(currentError)
		//console.log("yeet")
		if (!currentError) {
			//console.log("no erroe")
			return [];
		}
		const range = new vscode.Range(currentError.lineNumber, currentError.columnNumber, currentError.lineNumber, currentError.columnNumber);
		const c: vscode.Command = {
			command: 'haskell-debugging.toggleChameleon',
			tooltip: 'Clear Chameleon Errors',
			title: currentError.description + " (Click to toggle)"
		} ;
		let codeLens = new vscode.CodeLens(range, c);
		//console.log(codeLens)
		//console.log("codelens")
		return [codeLens];
	}

}

"https://cdn.mos.cms.futurecdn.net/gofvpedSqHBfoC3RKe559N.jpg";
