import { MutableRefObject } from "react";

import { TipTapRefs, BaseElement } from "@/types";

const isEditorPropertyConsistent = (elements: BaseElement[], tiptapRefs: MutableRefObject<TipTapRefs>, propertyName: string) => {
    const notEmptyEditors = elements.filter(element => tiptapRefs.current.editors[element.id] && !tiptapRefs.current.editors[element.id].editor.isEmpty);
    if (!notEmptyEditors.length) return false;

    return notEmptyEditors.every(element => {
        const editor = tiptapRefs.current.editors[element.id]?.editor;
        if (editor) {
            if (editor.isEmpty) {
                return true;
            }
            return editor.isActive(propertyName);
        }
        return false;
    });
}

export default isEditorPropertyConsistent;
