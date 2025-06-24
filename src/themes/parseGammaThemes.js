/* eslint-disable no-undef */
const roundessMap = {
    0: '4px',
    1: '8px',
    2: '12px',
    3: '20px',
};

const shadowsMap = ['none', 'sm', 'md'];

const borderMap = ['none', 'thin', 'medium', 'thick'];

const transparencyMap = [1, 0.8, 0.5];

const shape = ['default', 'fade', 'diagonal', 'round', 'round-inverse', 'wiggle'];

const blockFillTypeMap = ['subtle', 'primary', 'custom'];

const blockFillMap = ['fill', 'semi', 'none'];

const themes = [];

async function parseTheme(name) {
    const theme = {
        name: name,
    };

    // Primary accent color
    theme.primaryAccent = document
        .querySelector('[data-testid="custom-theme-primary-color-picker"]')
        .querySelector('input').value;

    // Heading color
    theme.headingColor = document
        .querySelector('[data-testid="custom-theme-heading-color-picker"]')
        .querySelector('input').value;

    // Body color
    theme.bodyColor = document
        .querySelector('[data-testid="custom-theme-body-color-picker"]')
        .querySelector('input').value;

    // Card color
    theme.cardColor = document
        .querySelector('[data-testid="custom-theme-card-color-picker"]')
        .querySelector('input').value;

    // Page background color
    theme.pageBackground = document
        .querySelector('[data-testid="media-drawer-menu-button"]')
        .parentNode.querySelector('input').value;

    // "дизайн"
    // eslint-disable-next-line no-undef
    document.querySelector('[data-testid="theme-config-tab-design"]').click();

    await new Promise(resolve => setTimeout(() => resolve(), 200));

    // группы
    const groups = document
        .querySelector('[data-testid="theme-config-tab-panel-0"]')
        .querySelectorAll('.chakra-form-control');

    const roundnessButtons = Array.from(groups[0].querySelectorAll('button'));
    // берем индекс кнопки, чей класс отличается от других

    function getActiveButtonIndex(buttons) {
        const buttonClassesCounter = {};

        buttons.forEach(button => {
            button.classList.forEach(className => {
                if (buttonClassesCounter[className]) {
                    buttonClassesCounter[className]++;
                } else {
                    buttonClassesCounter[className] = 1;
                }
            });
        });

        const activeButtonIndex = Object.entries(buttonClassesCounter).find(([, count]) => count === 1)[0];
        return buttons.findIndex(button => button.classList.contains(activeButtonIndex));
    }

    const roundnessIndex = getActiveButtonIndex(roundnessButtons);
    theme.roundness = roundessMap[roundnessIndex];

    const shadowButtons = Array.from(groups[1].querySelectorAll('button'));
    const shadowIndex = getActiveButtonIndex(shadowButtons);

    theme.shadow = shadowsMap[shadowIndex];

    const cardBorder = Array.from(groups[2].querySelectorAll('button'));
    const cardBorderIndex = getActiveButtonIndex(cardBorder);

    theme.cardBorder = borderMap[cardBorderIndex];

    let nextBlockIndex = 3;

    if (theme.cardBorder !== 'none') {
        nextBlockIndex = 4;
        const cardBorderColorVal =
            groups[3].querySelector('input').value || groups[3].querySelector('input').placeholder;
        const spaceIndex = cardBorderColorVal.indexOf(' ');

        if (spaceIndex !== -1) {
            theme.cardBorderColor = cardBorderColorVal.slice(0, spaceIndex);
        } else {
            theme.cardBorderColor = cardBorderColorVal;
        }
    }

    const cardTransparency = Array.from(groups[nextBlockIndex].querySelectorAll('button')).map(el => el.children[0]);
    const cardTransparencyIndex = getActiveButtonIndex(cardTransparency);

    nextBlockIndex++;

    theme.cardTransparency = transparencyMap[cardTransparencyIndex];

    const imageShape = Array.from(groups[nextBlockIndex].querySelectorAll('button')).map(el => el.children[0]);
    const imageShapeIndex = getActiveButtonIndex(imageShape);

    theme.imageShape = shape[imageShapeIndex];

    // ======== Блоки
    // eslint-disable-next-line no-undef
    document.querySelector('[data-testid="theme-config-tab-1"]').click();

    await new Promise(resolve => setTimeout(() => resolve(), 100));

    const groupsBlocks = document
        .querySelector('[data-testid="theme-config-tab-panel-1"]')
        .querySelectorAll('.chakra-form-control');

    const blockFillTypeIndex = Array.from(groupsBlocks[0].querySelectorAll('.chakra-radio')).findIndex(
        el => el.attributes['data-checked']
    );

    theme.blockFillType = blockFillTypeMap[blockFillTypeIndex];

    const blockFill = Array.from(groupsBlocks[1].querySelectorAll('button'));
    theme.blockFill = blockFillMap[getActiveButtonIndex(blockFill)];

    const blockBorder = Array.from(groupsBlocks[2].querySelectorAll('button'));
    theme.blockBorder = borderMap[getActiveButtonIndex(blockBorder)];

    const blockShadow = Array.from(groupsBlocks[3].querySelectorAll('button'));
    theme.blockShadow = shadowsMap[getActiveButtonIndex(blockShadow)];

    themes.push(theme);
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const themesButtons = document.querySelectorAll('[data-theme-id]');
    console.log('[PARSER] start parsing themes');

    let counter = 0;
    for (const themeButton of themesButtons) {
        counter++;

        console.log(`[PARSER] parsing theme ${counter} of ${themesButtons.length}`);

        window.scrollTo(themeButton.getBoundingClientRect().x, themeButton.getBoundingClientRect().y);

        const themeName = themeButton.textContent;

        themeButton.click();
        await timeout(200);

        try {
            await parseTheme(themeName);
        } catch (e) {
            console.log(e);
        }

        await timeout(200);

        document.querySelectorAll('[aria-label="Close"]')[1].click();

        await timeout(100);
        document.querySelectorAll('footer')[0].querySelectorAll('button')[1].click();

        await timeout(100);
    }

    console.log(themes);
}

try {
    main();
} catch {
    console.log(themes);
}
