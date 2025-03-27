import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { elementsRegistry } from '@/elements/registry';
import { ReactRenderer } from '@tiptap/react';
import { SuggestionProps } from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import { getNewElement } from '@/elements/registry';
import 'tippy.js/dist/tippy.css';

interface SlashCommandProps {
    onAddElement: (type: string) => void;
}

class CommandsList {
    private element: HTMLElement;
    private props: SuggestionProps;
    private items: { id: string; label: string; icon?: React.ElementType }[];
    private selectedIndex: number;
    private tippyInstance: TippyInstance | null;
    private onAddElement: (type: string) => void;

    constructor(props: SuggestionProps, onAddElement: (type: string) => void) {
        this.props = props;
        this.items = [];
        this.selectedIndex = 0;
        this.element = document.createElement('div');
        this.element.className = 'slash-menu';
        this.tippyInstance = null;
        this.onAddElement = onAddElement;
        this.init();
    }

    init() {
        // Get all elements from registry
        this.items = elementsRegistry.flatMap(category =>
            category.subCategories
                ? category.subCategories.flatMap(sub => sub.elements)
                : category.elements
        ).filter(Boolean).map(element => ({
            id: element.id,
            label: element.label,
            icon: element.Icon
        }));

        // Filter based on the query
        this.filterItems();

        // Build the UI
        this.renderItems();

        // Set up event listeners
        this.element.addEventListener('click', this.handleClick);
        this.element.addEventListener('mouseenter', this.handleMouseEnter);
    }

    filterItems() {
        const query = this.props.query.toLowerCase();
        if (!query || query === '/') {
            return;
        }

        this.items = this.items.filter(item =>
            item.id.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query)
        );
    }

    renderItems() {
        this.element.innerHTML = '';

        if (this.items.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'slash-menu-no-results';
            noResults.textContent = 'No matching elements found';
            this.element.appendChild(noResults);
            return;
        }

        this.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = `slash-menu-item ${index === this.selectedIndex ? 'selected' : ''}`;
            itemElement.dataset.id = item.id;

            // Create an icon placeholder
            const iconElement = document.createElement('div');
            iconElement.className = 'slash-menu-item-icon';
            // Note: We can't directly render React icons here, so just using a placeholder
            iconElement.innerHTML = '•';

            const labelElement = document.createElement('div');
            labelElement.className = 'slash-menu-item-label';
            labelElement.textContent = item.label;

            itemElement.appendChild(iconElement);
            itemElement.appendChild(labelElement);
            this.element.appendChild(itemElement);
        });
    }

    selectItem(index: number) {
        const items = this.element.querySelectorAll('.slash-menu-item');

        // Remove selected class from all items
        items.forEach(item => item.classList.remove('selected'));

        // Update the selected index
        this.selectedIndex = ((index % items.length) + items.length) % items.length;

        // Add selected class to the currently selected item
        items[this.selectedIndex]?.classList.add('selected');
    }

    handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const item = target.closest('.slash-menu-item') as HTMLElement;

        if (item) {
            const id = item.dataset.id;
            if (id) {
                this.selectItem(Array.from(this.element.querySelectorAll('.slash-menu-item')).indexOf(item));
                this.onSelect();
            }
        }
    };

    handleMouseEnter = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const item = target.closest('.slash-menu-item') as HTMLElement;

        if (item) {
            this.selectItem(Array.from(this.element.querySelectorAll('.slash-menu-item')).indexOf(item));
        }
    };

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowUp') {
            this.selectItem(this.selectedIndex - 1);
            event.preventDefault();
        }

        if (event.key === 'ArrowDown') {
            this.selectItem(this.selectedIndex + 1);
            event.preventDefault();
        }

        if (event.key === 'Enter') {
            this.onSelect();
            event.preventDefault();
        }

        if (event.key === 'Escape') {
            this.destroy();
            event.preventDefault();
        }
    }

    onSelect() {
        const item = this.items[this.selectedIndex];
        if (item) {
            this.onAddElement(item.id);
            this.props.command({ id: item.id });
            this.destroy();
        }
    }

    destroy() {
        // Clean up event listeners
        this.element.removeEventListener('click', this.handleClick);
        this.element.removeEventListener('mouseenter', this.handleMouseEnter);

        // Destroy tippy instance
        if (this.tippyInstance) {
            this.tippyInstance.destroy();
        }
    }
}

export const SlashCommandPluginKey = new PluginKey('slash-command');

export const SlashCommandExtension = Extension.create<SlashCommandProps>({
    name: 'slashCommand',

    addOptions() {
        return {
            onAddElement: () => { },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                pluginKey: SlashCommandPluginKey,
                editor: this.editor,
                char: '/',
                startOfLine: false,
                items: ({ query }) => {
                    // Return filtered items based on query
                    return elementsRegistry
                        .flatMap(category =>
                            category.subCategories
                                ? category.subCategories.flatMap(sub => sub.elements)
                                : category.elements
                        )
                        .filter(Boolean)
                        .filter(element => {
                            if (!query) return true;
                            return (
                                element.id.toLowerCase().includes(query.toLowerCase()) ||
                                element.label.toLowerCase().includes(query.toLowerCase())
                            );
                        })
                        .slice(0, 10); // Limit to 10 results for performance
                },
                render: () => {
                    let commandsList: CommandsList;
                    let popup: TippyInstance | null = null;

                    return {
                        onStart: (props) => {
                            commandsList = new CommandsList(props, this.options.onAddElement);

                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => document.body,
                                content: commandsList.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                                theme: 'slash-menu',
                            })[0];
                        },
                        onUpdate: (props) => {
                            commandsList = new CommandsList(props, this.options.onAddElement);

                            if (popup) {
                                popup.setProps({
                                    getReferenceClientRect: props.clientRect,
                                    content: commandsList.element,
                                });
                            }
                        },
                        onKeyDown: (props) => {
                            if (props.event) {
                                return commandsList.onKeyDown(props.event);
                            }
                            return false;
                        },
                        onExit: () => {
                            if (popup) {
                                popup.destroy();
                                popup = null;
                            }

                            commandsList.destroy();
                        },
                    };
                },
                command: ({ editor, range, props }) => {
                    // Delete the slash command input
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .run();

                    return true;
                },
            }),
        ];
    },
}); 