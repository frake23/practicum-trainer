import { Text } from "@codemirror/state";
import { EditorView, PluginValue } from "@codemirror/view";

export class CodeMirrorLanguageServerPlugin implements PluginValue {
    public view: EditorView;
    public update: PluginValue['update'] = () => null;
    public destroy: PluginValue['destroy'];

    constructor(view: EditorView) {
        this.view = view;
    }

    public setOnUpdate(onUpdate: PluginValue['update']) {
        this.update = onUpdate;
    }

    public setOnDestroy(onDestroy: PluginValue['destroy']) {
        this.destroy = onDestroy;
    }

    public get viewText(): Text {
        return this.view.state.doc;
    }

    public get viewString(): string {
        return this.viewText.sliceString(0);
    }
}