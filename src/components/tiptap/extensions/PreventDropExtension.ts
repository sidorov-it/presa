import { Extension } from '@tiptap/react';
import { PluginKey, Plugin } from '@tiptap/pm/state';

export const pluginKey = new PluginKey('prevent-drop-from-outside');

export const preventDropFromOutsidePlugin = new Plugin({
    key: pluginKey,
    state: {
        init: () => false,
        apply: (tr, prev) => {
            const action = tr.getMeta(pluginKey);
            if (!action) {
                return prev;
            }

            switch (action) {
                case 'drag':
                    return true;
                case 'drop':
                default:
                    return false;
            }
        },
    },
    props: {
        handleDOMEvents: {
            dragstart(view) {
                const dragFromInsideActive = pluginKey.getState(view.state);
                if (!dragFromInsideActive) {
                    view.dispatch(view.state.tr.setMeta(pluginKey, 'drag'));
                }
            },
            drop(view, event) {
                const dragFromInsideActive = pluginKey.getState(view.state);
                if (dragFromInsideActive) {
                    view.dispatch(view.state.tr.setMeta(pluginKey, 'drop'));
                    return false;
                }
                event.preventDefault();
                return true;
            },
        },
    },
});

// Create a custom extension to add the preventDropFromOutsidePlugin
export const PreventDropExtension = Extension.create({
    name: 'preventDrop',
    addProseMirrorPlugins() {
        return [preventDropFromOutsidePlugin];
    },
});
