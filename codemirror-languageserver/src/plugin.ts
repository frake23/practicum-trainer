import { Extension, StateEffect, Text } from "@codemirror/state";
import { EditorView, PluginValue } from "@codemirror/view";

export class CodeMirrorLanguageServerPlugin implements PluginValue {
  public _view: EditorView;
  public update: PluginValue["update"] = () => null;
  public destroy: PluginValue["destroy"];

  constructor(view: EditorView) {
    this._view = view;
  }

  public setOnUpdate(onUpdate: PluginValue["update"]): void {
    this.update = onUpdate;
  }

  public setOnDestroy(onDestroy: PluginValue["destroy"]): void {
    this.destroy = onDestroy;
  }

  public get viewText(): Text {
    return this._view.state.doc;
  }

  public get viewString(): string {
    return this.viewText.sliceString(0);
  }

  public get view(): EditorView {
    return this._view;
  }

  public addExtension(extension: Extension): void {
    this._view.dispatch({ effects: StateEffect.appendConfig.of(extension) });
  }
}
