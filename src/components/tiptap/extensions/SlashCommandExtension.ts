/* eslint-disable prettier/prettier */
import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { menuRegistry } from '@/elements/menuRegistry';
import { PluginKey } from '@tiptap/pm/state';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/shift-away.css';
import { MenuItem } from '@/types/templates';

// Icon mappings - we need these to render SVG icons directly in HTML
// since we can't use React components in this context
const iconMap: Record<string, string> = {
    FaFont: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M432 416h-23.41L277.88 53.69A32 32 0 0 0 247.58 32h-47.16a32 32 0 0 0-30.3 21.69L39.41 416H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-19.58l23.3-64h152.56l23.3 64H304a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM176.85 272L224 142.51 271.15 272z"></path></svg>',
    FaTable: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64v-96h160v96zm0-160H64v-96h160v96zm224 160H288v-96h160v96zm0-160H288v-96h160v96z"></path></svg>',
    FaList: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M80 368H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm0-320H16A16 16 0 0 0 0 64v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16zm0 160H16a16 16 0 0 0-16 16v64a16 16 0 0 0 16 16h64a16 16 0 0 0 16-16v-64a16 16 0 0 0-16-16zm416 176H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16z"></path></svg>',
    FaBox: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M509.5 184.6L458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"></path></svg>',
    FaImage: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 448H48c-26.51 0-48-21.49-48-48V112c0-26.51 21.49-48 48-48h416c26.51 0 48 21.49 48 48v288c0 26.51-21.49 48-48 48zM112 120c-30.928 0-56 25.072-56 56s25.072 56 56 56 56-25.072 56-56-25.072-56-56-56zM64 384h384V272l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L208 320l-55.515-55.515c-4.686-4.686-12.284-4.686-16.971 0L64 336v48z"></path></svg>',
    FaQuoteLeft: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z"></path></svg>',
    FaChartBar: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-192 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-16c0-8.84-7.16-16-16-16zM108.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8z"></path></svg>',
    FaRegChartBar: '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>',
    FaChartPie: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 544 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M527.79 288H290.5l158.03 158.03c6.04 6.04 15.98 6.53 22.19.68 38.7-36.46 65.32-85.61 73.13-140.86 1.34-9.46-6.51-17.85-16.06-17.85zm-15.83-64.8C503.72 103.74 408.26 8.28 288.8.04 279.68-.59 272 7.1 272 16.24V240h223.77c9.14 0 16.82-7.68 16.19-16.8zM224 288V50.71c0-9.55-8.39-17.4-17.84-16.06C86.99 51.49-4.1 155.6.14 280.37 4.5 408.51 114.83 513.59 243.03 511.98c50.4-.63 96.97-16.87 135.26-44.03 7.9-5.6 8.42-17.23 1.57-24.08L224 288z"></path></svg>',
    FaHeading: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 96v320h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H320a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V288H160v128h32a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H32a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h32V96H32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16h-32v128h192V96h-32a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16h160a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16z"></path></svg>',
    FaListOl: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-13.22v-3.85a11.5 11.5 0 0 0-11.5-11.5H24.73a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a1.5 1.5 0 0 1 1.5 1.5v.5a1.5 1.5 0 0 1-.37 1l-9.61 11.07a8 8 0 0 0 6.11 13.15H72.34a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H61.77zM176 224h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm0 160h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zm0-320h320a16 16 0 0 0 16-16V16a16 16 0 0 0-16-16H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-2.3 72.7a19.86 19.86 0 0 0-5.7 14v.3A19.86 19.86 0 0 0 13.7 261l12.4 17.7a19.86 19.86 0 0 0 16.5 9.3h45.4a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H32a1.5 1.5 0 0 1-1.5-1.5v-.5a1.5 1.5 0 0 1 .37-1l9.61-11.07a8 8 0 0 0-6.11-13.15H8.23a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h5.54z"></path></svg>',
    FaListCheck: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"></path></svg>',
    FaRegAddressCard: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M40 48C26.7 48 16 58.7 16 72v368c0 13.3 10.7 24 24 24h416c13.3 0 24-10.7 24-24V72c0-13.3-10.7-24-24-24H40zM64 96h384v320H64V96zm64 64c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm160 32c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16h-96c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16h-96c-8.8 0-16-7.2-16-16zm0 64c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16h-96c-8.8 0-16-7.2-16-16zM112 320h96c8.8 0 16-7.2 16-16v-64c0-8.8-7.2-16-16-16h-96c-8.8 0-16 7.2-16 16v64c0 8.8 7.2 16 16 16z"></path></svg>',
    LuHeading1: '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="m17 12 3-2v8"></path></svg>',
    LuHeading2: '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"></path></svg>',
    LuHeading3: '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"></path><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"></path></svg>',
    LuHeading4: '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M4 12h8"></path><path d="M4 18V6"></path><path d="M12 18V6"></path><path d="M17 10v4h4"></path><path d="M21 10v8"></path></svg>',
    TbChartDonutFilled: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6zm0 2c-2.209 0-4 1.791-4 4s1.791 4 4 4 4-1.791 4-4-1.791-4-4-4z"></path></svg>',
    // Box icons
    MdNotes: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"></path></svg>',
    BsInfoCircle: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"></path></svg>',
    BsExclamationTriangle: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"></path><path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"></path></svg>',
    BsExclamationCircle: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"></path></svg>',
    BsCheckCircle: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"></path></svg>',
    BsQuestionCircle: '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"></path><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"></path></svg>',
};

interface SlashCommandProps {
    onAddElement: (menuItem: MenuItem) => void;
}

// Helper function to get icon SVG based on React component
const getIconSvg = (Icon: any): string => {
    if (!Icon) return '';

    // Extract component name from React icon component
    let componentName: string = '';

    if (typeof Icon === 'function') {
        // Try to get the display name or function name
        componentName = Icon.displayName || Icon.name || '';
    } else if (typeof Icon === 'string') {
        componentName = Icon;
    }

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
                if (isInTable && category.excludeFromTable || category.id === 'slide-templates') {
                    return [];
                }

                return category.subCategories
                    ? category.subCategories.flatMap(sub => {
                        if ((isInTable && sub.excludeFromTable)) {
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
            iconElement.innerHTML = getIconSvg(item.Icon);

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

                            const isDarkMode = Array.from(document.body.children).some(element => {
                                return element.classList.contains('dark');
                            });

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
                                onCreate(instance) {
                                    // Add dark class to tippy box if dark mode is active
                                    if (isDarkMode && instance.popper) {
                                        instance.popper.classList.add('dark');
                                    }
                                },
                                onMount(instance) {
                                    // Ensure dark class is added when mounting
                                    if (isDarkMode && instance.popper) {
                                        instance.popper.classList.add('dark');
                                    }
                                },
                            });
                        },

                        onUpdate: props => {
                            commandsList = new CommandsList(props, this.options.onAddElement);

                            if (popup) {
                                // Check if dark mode is active
                                const isDarkMode = document.documentElement.classList.contains('dark') ||
                                                  document.body.classList.contains('dark');

                                const rect = props.clientRect?.() || new DOMRect(0, 0, 0, 0);
                                popup.setProps({
                                    getReferenceClientRect: () => rect,
                                    content: commandsList.getElement(),
                                });

                                // Ensure dark class is applied if dark mode is active
                                if (popup.popper) {
                                    if (isDarkMode) {
                                        popup.popper.classList.add('dark');
                                    } else {
                                        popup.popper.classList.remove('dark');
                                    }
                                }
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
