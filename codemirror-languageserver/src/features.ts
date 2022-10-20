import { Text } from '@codemirror/state'
import { setDiagnostics } from '@codemirror/lint'
import { CodeMirrorLanguageClient } from './client'
import {
  ClientCapabilities,
  CompletionItem,
  CompletionList,
  CompletionParams,
  DidChangeTextDocumentParams,
  DidOpenTextDocumentParams,
  Hover,
  HoverParams,
  MarkedString,
  MarkupContent,
  PublishDiagnosticsParams,
  ServerCapabilities
} from 'vscode-languageserver-protocol'
import { hoverTooltip } from '@codemirror/view'
import { autocompletion, Completion } from '@codemirror/autocomplete'
import {
  CompletionItemKind,
  CompletionItemTag,
  CompletionTriggerKind,
  InsertTextMode,
  mapFromEnum,
  MarkupKind
} from './enums'

export function ensure<T, K extends keyof T> (target: T, key: K): T[K] {
  if (target[key] === undefined) {
    target[key] = {} as any
  }
  return target[key]
}

export interface IFeature {
  initialize: (capabilities: ServerCapabilities) => void
  fillClientCapabilities: (capabilities: ClientCapabilities) => void
}

export abstract class DefaultCodeMirrorFeature implements IFeature {
  protected _client: CodeMirrorLanguageClient

  public constructor (client: CodeMirrorLanguageClient) {
    this._client = client
  }

  abstract initialize (capabilities: ServerCapabilities): void

  abstract fillClientCapabilities (capabilities: ClientCapabilities): void
}

export class DidOpenTextDocumentFeature extends DefaultCodeMirrorFeature {
  private readonly _method: string = 'textDocument/didOpen'

  public fillClientCapabilities (capabilities: ClientCapabilities): void {
    ensure(ensure(capabilities, 'textDocument')!, 'synchronization')!.dynamicRegistration = true
  }

  public initialize (capabilities: ServerCapabilities): void {
    const params: DidOpenTextDocumentParams = {
      textDocument: {
        uri: this._client.documentUri,
        languageId: this._client.languageId,
        text: this._client.plugin?.viewString ?? '',
        version: this._client.docVersion
      }
    }

    this._client.sendNotification(
      this._method,
      params
    )
  }
}

export class DidChangeTextDocumentFeature extends DefaultCodeMirrorFeature {
  private readonly _method: string = 'textDocument/didChange'

  public fillClientCapabilities (capabilities: ClientCapabilities): void {
    ensure(ensure(capabilities, 'textDocument')!, 'synchronization')!.dynamicRegistration = true
  }

  public initialize (_capabilities: ServerCapabilities): void {
    let timeout: any

    this._client.plugin?.setOnUpdate(({ docChanged }) => {
      if (!docChanged) return

      const params: DidChangeTextDocumentParams = {
        textDocument:
          {
            uri: this._client.documentUri,
            version: this._client.docVersion
          },
        contentChanges: [{ text: this._client.plugin!.viewString }]
      }

      clearTimeout(timeout)

      timeout = setTimeout(() => {
        this._client.sendNotification(this._method, params,)
      }, 500)
    })
  }
}

export class PublishDiagnosticsFeature extends DefaultCodeMirrorFeature {
  private readonly _method: string = 'textDocument/publishDiagnostics'

  public fillClientCapabilities (capabilities: ClientCapabilities): void {
    const diagnostics = ensure(ensure(capabilities, 'textDocument')!, 'publishDiagnostics')!
    diagnostics.relatedInformation = true
    diagnostics.versionSupport = false
    diagnostics.tagSupport = { valueSet: [1, 2] }
    diagnostics.codeDescriptionSupport = true
    diagnostics.dataSupport = true
  }

  public initialize (_capabilities: ServerCapabilities): void {
    this._client.onNotification(this._method, (params: PublishDiagnosticsParams) => {
      if (this._client.plugin == null) return

      const view = this._client.plugin.view
      const text = this._client.plugin.viewText

      const diagnostics = params.diagnostics
        .map(({
          range,
          message,
          severity
        }) => ({
          from: posToOffset(text, range.start)!,
          to: posToOffset(text, range.end)!,
          severity: ({
            1: 'error',
            2: 'warning',
            3: 'info',
            4: 'info'
          } as const)[severity!],
          message
        }))
        .filter(({
          from,
          to
        }) => from !== null && to !== null && from !== undefined && to !== undefined)
        .sort((a, b) => {
          return a.from - b.from
        })

      view.dispatch(setDiagnostics(view.state, diagnostics))
    })
  }
}

export class HoverFeature extends DefaultCodeMirrorFeature {
  private readonly _method: string = 'textDocument/hover'

  public fillClientCapabilities (capabilities: ClientCapabilities): void {
    const hoverCapability = (ensure(ensure(capabilities, 'textDocument')!, 'hover')!)
    hoverCapability.dynamicRegistration = true
    hoverCapability.contentFormat = [MarkupKind.Markdown, MarkupKind.PlainText]
  }

  public initialize (capabilities: ServerCapabilities<any>): void {
    if (!capabilities.hoverProvider) return

    const extension = hoverTooltip(async (view, offset) => {
      const position = offsetToPos(view.state.doc, offset)

      const params: HoverParams = {
        textDocument: {
          uri: this._client.documentUri
        },
        position
      }

      const result = await this._client.makeRequest<HoverParams, Hover | null>(this._method, params)

      if (result == null) return null

      const {
        contents,
        range
      } = result

      let pos: number = offset
      let end: number | undefined

      if (range != null) {
        pos = posToOffset(view.state.doc, range.start)!
        end = posToOffset(view.state.doc, range.end)
      }

      const dom = document.createElement('div')

      dom.classList.add('documentation')
      dom.textContent = formatContents(contents)

      return {
        pos,
        end,
        create: (_view) => ({ dom }),
        above: true
      }
    })

    this._client.plugin?.addExtension(extension)
  }
}

export class CompletionFeature extends DefaultCodeMirrorFeature {
  private readonly _method: string = 'textDocument/completion'

  public fillClientCapabilities (capabilities: ClientCapabilities): void {
    const completion = ensure(ensure(capabilities, 'textDocument')!, 'completion')!
    completion.dynamicRegistration = true
    completion.contextSupport = true
    completion.completionItem = {
      snippetSupport: true,
      commitCharactersSupport: true,
      documentationFormat: [MarkupKind.Markdown, MarkupKind.PlainText],
      deprecatedSupport: true,
      preselectSupport: true,
      tagSupport: { valueSet: [CompletionItemTag.Deprecated] },
      insertReplaceSupport: true,
      resolveSupport: {
        properties: ['documentation', 'detail', 'additionalTextEdits']
      },
      insertTextModeSupport: { valueSet: [InsertTextMode.asIs, InsertTextMode.adjustIndentation] },
      labelDetailsSupport: true
    }
    completion.insertTextMode = 2
    completion.completionItemKind = { valueSet: Array(25).fill(1).map((value, i) => value + i) }
    completion.completionList = {
      itemDefaults: [
        'commitCharacters', 'editRange', 'insertTextFormat', 'insertTextMode'
      ]
    }
  }

  public initialize (capabilities: ServerCapabilities): void {
    if (capabilities.completionProvider == null) return

    const extension = autocompletion({
      override: [
        async (context) => {
          const {
            state,
            explicit
          } = context
          let { pos } = context
          const currentLine = state.doc.lineAt(pos)

          let triggerKind = CompletionTriggerKind.Invoked
          let triggerCharacter: string | undefined

          if (
            !explicit &&
            capabilities.completionProvider?.triggerCharacters?.includes(
              currentLine.text[pos - currentLine.from - 1]
            )
          ) {
            triggerKind = CompletionTriggerKind.TriggerCharacter
            triggerCharacter = currentLine.text[pos - currentLine.from - 1]
          }

          if (triggerKind === CompletionTriggerKind.Invoked && (context.matchBefore(/\w+$/) == null)) {
            return null
          }

          const position = offsetToPos(state.doc, pos)

          const params: CompletionParams = {
            textDocument: { uri: this._client.documentUri },
            position,
            context: {
              triggerKind,
              triggerCharacter
            }
          }

          const result = await this._client.makeRequest<CompletionParams, CompletionItem[] | CompletionList | null>(this._method, params)

          if (result == null) return null

          const items = 'items' in result ? result.items : result

          let options = items.map(
            ({
              detail,
              label,
              kind,
              textEdit,
              documentation,
              sortText,
              filterText
            }) => {
              const completion: Completion & {
                filterText: string
                sortText?: string
                apply: string
              } = {
                label,
                detail,
                apply: textEdit?.newText ?? label,
                type: kind && mapFromEnum(CompletionItemKind)[kind].toLowerCase(),
                sortText: sortText ?? label,
                filterText: filterText ?? label
              }

              if (documentation) {
                completion.info = formatContents(documentation)
              }
              return completion
            }
          )

          const [, match] = prefixMatch(options)
          const token = context.matchBefore(match)

          if (token != null) {
            pos = token.from
            const word = token.text.toLowerCase()
            if (/^\w+$/.test(word)) {
              options = options
                .filter(({ filterText }) =>
                  filterText.toLowerCase().startsWith(word)
                )
                .sort(({ apply: a }, { apply: b }) => {
                  switch (true) {
                    case a.startsWith(token.text) &&
                    !b.startsWith(token.text):
                      return -1
                    case !a.startsWith(token.text) &&
                    b.startsWith(token.text):
                      return 1
                  }
                  return 0
                })
            }
          }
          return {
            from: pos,
            options
          }
        }
      ]
    })

    this._client.plugin?.addExtension(extension)
  }
}

function posToOffset (doc: Text, pos: { line: number, character: number }) {
  if (pos.line >= doc.lines) return

  const offset = doc.line(pos.line + 1).from + pos.character

  if (offset > doc.length) return

  return offset
}

function offsetToPos (doc: Text, offset: number) {
  const line = doc.lineAt(offset)
  return {
    line: line.number - 1,
    character: offset - line.from
  }
}

function formatContents (
  contents: MarkupContent | MarkedString | MarkedString[]
): string {
  if (Array.isArray(contents)) {
    return contents.map((c) => formatContents(c) + '\n\n').join('')
  } else if (typeof contents === 'string') {
    return contents
  } else {
    return contents.value
  }
}

function prefixMatch (options: Completion[]) {
  const first = new Set<string>()
  const rest = new Set<string>()

  for (const { apply } of options) {
    const [initial, ...restStr] = apply as string
    first.add(initial)
    for (const char of restStr) {
      rest.add(char)
    }
  }

  const source = toSet(first) + toSet(rest) + '*$'
  return [new RegExp('^' + source), new RegExp(source)]
}

function toSet (chars: Set<string>) {
  let preamble = ''
  let flat = Array.from(chars).join('')
  const words = /\w/.test(flat)
  if (words) {
    preamble += '\\w'
    flat = flat.replace(/\w/g, '')
  }
  return `[${preamble}${flat.replace(/[^\w\s]/g, '\\$&')}]`
}
