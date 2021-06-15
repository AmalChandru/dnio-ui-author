/// <reference path="../../../../node_modules/monaco-editor/monaco.d.ts" />
import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges } from '@angular/core';

let loadedMonaco = false;
let loadPromise: Promise<void>;

@Component({
  selector: 'odp-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent implements AfterViewInit, OnChanges {

  @Input() theme: string;
  @Input() fontSize: number;
  @Input() code: string;
  @Input() edit: { status: boolean, id?: string };
  @Output() codeChange: EventEmitter<string>;
  codeEditorInstance: monaco.editor.IStandaloneCodeEditor;
  typesString: string;
  constructor(private httpClient: HttpClient) {
    this.theme = 'vs-light';
    this.fontSize = 14;
    this.edit = { status: false };
    this.codeChange = new EventEmitter();
  }

  ngAfterViewInit(): void {
    if (loadedMonaco) {
      // Wait until monaco editor is available
      loadPromise.then(() => {
        this.initMonaco();
      });
    } else {
      loadedMonaco = true;
      loadPromise = new Promise<void>((resolve: any) => {
        if (typeof ((window as any).monaco) === 'object') {
          resolve();
          return;
        }
        const onAmdLoader: any = () => {
          // Load monaco
          (window as any).require.config({ paths: { 'vs': 'assets/monaco/vs' } });

          (window as any).require(['vs/editor/editor.main'], () => {
            this.initMonaco();
            resolve();
          });
        };

        // Load AMD loader if necessary
        if (!(window as any).require) {
          const loaderScript: HTMLScriptElement = document.createElement('script');
          loaderScript.type = 'text/javascript';
          loaderScript.src = 'assets/monaco/vs/loader.js';
          loaderScript.addEventListener('load', onAmdLoader);
          document.body.appendChild(loaderScript);
        } else {
          onAmdLoader();
        }
      });
    }
  }

  ngOnChanges() {
    if (this.codeEditorInstance) {
      this.codeEditorInstance.updateOptions({ fontSize: this.fontSize, theme: this.theme, readOnly: !this.edit.status });
      // monaco.editor.setTheme(this.theme);
      // monaco.editor.updateOption({ fontSize: this.fontSize });
    }
  }

  initMonaco(): void {

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    });

    this.typesString = `const req = {
      headers: {},
      body: {},
      header: (name) => {
        return "";
      },
    };
    
    const res = {
      setHeader: (name, value) => {},
      status: (code = 200) => {},
      write: (data) => {},
      end: () => {},
      josn: (data = {}) => {},
    };
    
    const router = {
      get: (path, callback = (req={
      headers: {},
      body: {},
      header: (name) => {
        return "";
      },
    }, res={
      setHeader: (name, value) => {},
      status: (code = 200) => {},
      write: (data) => {},
      end: () => {},
      josn: (data = {}) => {},
    }) => {}) => {},
      put: (path, callback = (req={
      headers: {},
      body: {},
      header: (name) => {
        return "";
      },
    }, res={
      setHeader: (name, value) => {},
      status: (code = 200) => {},
      write: (data) => {},
      end: () => {},
      josn: (data = {}) => {},
    }) => {}) => {},
      post: (path, callback = (req={
      headers: {},
      body: {},
      header: (name) => {
        return "";
      },
    }, res={
      setHeader: (name, value) => {},
      status: (code = 200) => {},
      write: (data) => {},
      end: () => {},
      josn: (data = {}) => {},
    }) => {}) => {},
      delete: (path, callback = (req={
      headers: {},
      body: {},
      header: (name) => {
        return "";
      },
    }, res={
      setHeader: (name, value) => {},
      status: (code = 200) => {},
      write: (data) => {},
      end: () => {},
      josn: (data = {}) => {},
    }) => {}) => {},
    };`;
    monaco.languages.typescript.javascriptDefaults.addExtraLib(this.typesString);


    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range: monaco.IRange = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        return {
          suggestions: [
            {
              range,
              label: 'router.post',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Add a POST Route',
              insertText: [
                'router.post(\'/\', async (req, res) => {',
                '\t',
                '});'].join('\n')
            },
            {
              range,
              label: 'router.put',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Add a PUT Route',
              insertText: [
                'router.put(\'/\', async (req, res) => {',
                '\t',
                '});'].join('\n')
            },
            {
              range,
              label: 'router.get',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Add a GET Route',
              insertText: [
                'router.get(\'/\', async (req, res) => {',
                '\t',
                '});'].join('\n')
            },
            {
              range,
              label: 'router.delete',
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: 'Add a DELETE Route',
              insertText: [
                'router.delete(\'/\', async (req, res) => {',
                '\t',
                '});'].join('\n')
            }
          ]
        };
      }
    });

    this.codeEditorInstance = monaco.editor.create(document.getElementById('code-editor'), {
      value: this.code,
      language: 'javascript',
      theme: this.theme,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: this.fontSize
    });

    this.codeEditorInstance.getModel().onDidChangeContent(e => {
      const val = this.codeEditorInstance.getValue();
      this.codeChange.emit(val);
    });

    this.codeEditorInstance.layout();
  }
}
