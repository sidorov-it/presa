/* eslint-disable prettier/prettier */
import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { MenuItem, menuRegistry } from '@/elements/menuRegistry';
import { PluginKey } from '@tiptap/pm/state';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/shift-away.css';

// Icon mappings - we need these to render SVG icons directly in HTML
// since we can't use React components in this context
const iconMap: Record<string, string> = {
    FaFont: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M432 416h-23.41L277.88 53.69A32 32 0 0 0 247.58 32h-47.16a32 32 0 0 0-30.3 21.69L39.41 416H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-19.58l23.3-64h152.56l23.3 64H304a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM176.85 272L224 142.51 271.15 272z"></path></svg>',
    FaTable:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64v-96h160v96zm0-160H64v-96h160v96zm224 160H288v-96h160v96zm0-160H288v-96h160v96z"></path></svg>',
    FaList: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M80 368H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm0-320H16A16 16 0 0 0 0 64v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16zm0 160H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm416 176H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"></path></svg>',
    FaBox: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M509.5 184.6L458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"></path></svg>',
    FaImage:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"></path></svg>',
    FaVideo:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z"></path></svg>',
    FaQuoteLeft:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"></path></svg>',
    FaRegChartBar:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M396.8 352h22.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-192 0h22.4c6.4 0 12.8-6.4 12.8-12.8V140.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h22.4c6.4 0 12.8-6.4 12.8-12.8V204.8c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zM496 400H48V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zm-387.2-48h22.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-22.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8z"></path></svg>',
    FaToggleOn:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M384 64H192C86 64 0 150 0 256s86 192 192 192h192c106 0 192-86 192-192S490 64 384 64zm0 320c-70.8 0-128-57.3-128-128 0-70.8 57.3-128 128-128 70.8 0 128 57.3 128 128 0 70.8-57.3 128-128 128z"></path></svg>',
    FaLink: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.37.37-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z"></path></svg>',
    FaUpload:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M296 384h-80c-13.3 0-24-10.7-24-24V192h-87.7c-17.8 0-26.7-21.5-14.1-34.1L242.3 5.7c7.5-7.5 19.8-7.5 27.3 0l152.2 152.2c12.6 12.6 3.7 34.1-14.1 34.1H320v168c0 13.3-10.7 24-24 24zm216-8v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h136v8c0 30.9 25.1 56 56 56h80c30.9 0 56-25.1 56-56v-8h136c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg>',
    FaQrcode:
        '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M0 224h192V32H0v192zM64 96h64v64H64V96zm192-64v192h192V32H256zm128 128h-64V96h64v64zM0 480h192V288H0v192zm64-128h64v64H64v-64zm352-64h32v128h-96v-32h-32v96h-64V288h96v32h64v-32zm0 160h32v32h-32v-32zm-64 0h32v32h-32v-32z"></path></svg>',
};

interface SlashCommandProps {
    onAddElement: (menuItem: MenuItem) => void;
}

// Helper function to get icon SVG based on name
const getIconSvg = (iconName: string): string => {
    if (!iconName) return '';

    // Extract component name from the full path
    const componentName = iconName;

    return (
        iconMap[componentName] ||
        '<svg viewBox="0 0 24 24" width="1em" height="1em" stroke="currentColor" fill="none"><circle cx="12" cy="12" r="5"/></svg>'
    );
};

class CommandsList {
    private element: HTMLElement;
    private props: SuggestionProps;
    private items: MenuItem[];
    private selectedIndex: number;
    private tippyInstance: TippyInstance | null;
    private onAddElement: (menuItem: MenuItem) => void;

    constructor(props: SuggestionProps, onAddElement: (menuItem: MenuItem) => void) {
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const isInTable = this.props.editor.options.editorProps.attributes['data-is-in-table'] === 'true';

        this.items = menuRegistry
            .flatMap(category => {
                if (isInTable && category.excludeFromTable) {
                    return [];
                }

                return category.subCategories
                    ? category.subCategories.flatMap(sub => {
                        if (isInTable && sub.excludeFromTable) {
                            return [];
                        }

                        return sub.elements || [];
                    })
                    : category.elements || [];
            })
            .filter(element => element !== undefined);

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

        this.items = this.items.filter(
            item => item.elementTypeId.toLowerCase().includes(query) || item.label.toLowerCase().includes(query)
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
            itemElement.dataset.id = item.elementTypeId;

            // Create an icon with SVG content
            const iconElement = document.createElement('div');
            iconElement.className = 'slash-menu-item-icon';
            iconElement.innerHTML = getIconSvg(item.Icon || '');

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
        if (items.length === 0) return;

        // Remove selected class from all items
        items.forEach(item => item.classList.remove('selected'));

        // Update the selected index
        this.selectedIndex = ((index % items.length) + items.length) % items.length;

        // Add selected class to the currently selected item
        const selectedItem = items[this.selectedIndex];
        if (selectedItem) {
            selectedItem.classList.add('selected');

            // Make sure the selected item is visible by scrolling if needed
            selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
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
        console.log('onKeyDown SlashCommandExtension');
        if (event.key === 'ArrowUp') {
            this.selectItem(this.selectedIndex - 1);
            event.preventDefault();
            return true;
        }

        if (event.key === 'ArrowDown') {
            this.selectItem(this.selectedIndex + 1);
            event.preventDefault();
            return true;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            console.log('Enter SlashCommandExtension');
            this.onSelect();
            return true;
        }

        if (event.key === 'Escape') {
            this.destroy();
            event.preventDefault();
            return true;
        }

        return false;
    }

    onSelect() {
        const item = this.items[this.selectedIndex];
        if (item) {
            this.onAddElement(item);
            this.props.command({ id: item.elementTypeId });
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

    // Public getter for the element
    getElement() {
        return this.element;
    }
}

export const SlashCommandPluginKey = new PluginKey('slash-command');

export const SlashCommandExtension = Extension.create<SlashCommandProps>({
    name: 'slashCommand',

    addOptions() {
        return {
            onAddElement: () => {},
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                pluginKey: SlashCommandPluginKey,
                editor: this.editor,
                char: '/',
                startOfLine: true,
                items: ({ query }) => {
                    // Return filtered items based on query
                    return menuRegistry
                        .flatMap(category =>
                            category.subCategories
                                ? category.subCategories.flatMap(sub => sub.elements || [])
                                : category.elements || []
                        )
                        .filter(element => element !== undefined)
                        .filter(element => {
                            if (!query) return true;
                            return (
                                element.elementTypeId.toLowerCase().includes(query.toLowerCase()) ||
                                element.label.toLowerCase().includes(query.toLowerCase())
                            );
                        })
                        .slice(0, 10); // Limit to 10 results for performance
                },
                render: () => {
                    let commandsList: CommandsList;
                    let popup: TippyInstance | null = null;

                    return {
                        onStart: props => {
                            if (props.range.from !== 1 && props.range.to !== 2) {
                                return;
                            }

                            commandsList = new CommandsList(props, this.options.onAddElement);

                            // Use document.body directly as the tippy target
                            const rect = props.clientRect?.() || new DOMRect(0, 0, 0, 0);
                            popup = tippy(document.body, {
                                getReferenceClientRect: () => rect,
                                appendTo: document.body,
                                content: commandsList.getElement(),
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                                theme: 'light',
                                maxWidth: 300,
                                animation: 'shift-away',
                                popperOptions: {
                                    strategy: 'fixed',
                                    modifiers: [
                                        {
                                            name: 'preventOverflow',
                                            options: {
                                                padding: 8,
                                            },
                                        },
                                    ],
                                },
                            });
                        },

                        onUpdate: props => {
                            commandsList = new CommandsList(props, this.options.onAddElement);

                            if (popup) {
                                const rect = props.clientRect?.() || new DOMRect(0, 0, 0, 0);
                                popup.setProps({
                                    getReferenceClientRect: () => rect,
                                    content: commandsList.getElement(),
                                });
                            }
                        },
                        onKeyDown: props => {
                            if (props.event && commandsList) {
                                return commandsList.onKeyDown(props.event);
                            }
                            return false;
                        },
                        onExit: () => {
                            if (popup) {
                                popup.destroy();
                                popup = null;
                            }

                            commandsList?.destroy();
                        },
                    };
                },
                command: () => {
                    return false;
                },
            }),
        ];
    },
});
