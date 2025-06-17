import { Label } from '@/components/ui/Label';
import { Theme, ThemeDesignButtonShape } from '@/types/theme';
import { ThemeDesign } from '@/types/theme';
import ColorPicker from '@/components/ui/ColorPicker';

import styles from './ButtonsDesign.module.css';

export default function ButtonsDesign({
    theme,
    handleDesignChange,
}: {
    theme: Theme;
    handleDesignChange: (design: Partial<ThemeDesign>) => void;
}) {
    return (
        <div
            style={{
                marginTop: '1rem',
            }}
        >
            {/* <div>
                <Label>Цвет кнопки</Label>
                <ColorPicker
                    value={theme.design.buttons.buttonColor}
                    isShowRemoveIcon={true}
                    onChange={newColor => {
                        handleDesignChange({
                            buttons: {
                                ...theme.design.buttons,
                                buttonColor: newColor,
                            },
                        });
                    }}
                />
            </div> */}
            <div>
                <Label>Форма кнопки</Label>

                <div style={{ display: 'flex', marginTop: '0.5rem', gap: '0.5rem' }}>
                    {[{ value: 'square' }, { value: 'capsule' }, { value: 'default' }, { value: 'rounded' }].map(
                        option => (
                            <button
                                key={option.value}
                                onClick={() =>
                                    handleDesignChange({
                                        buttons: {
                                            ...theme.design.buttons,
                                            buttonShape: option.value as ThemeDesignButtonShape,
                                        },
                                    })
                                }
                                className={`${styles.buttonShapeButton} ${
                                    theme.design.buttons.buttonShape === option.value ? styles.buttonShapeActive : ''
                                }`}
                            >
                                <div
                                    className={`${styles.buttonShapeContent} ${styles[`buttonShape-${option.value}`]}`}
                                >
                                    Кнопка
                                </div>
                            </button>
                        )
                    )}
                </div>
            </div>
            <div>
                <Label>Цвет ссылки</Label>
                <ColorPicker
                    value={theme.design.buttons.linkColor}
                    isShowRemoveIcon={true}
                    placeholder={theme.colors.primaryAccent}
                    onChange={newColor => {
                        handleDesignChange({
                            buttons: {
                                ...theme.design.buttons,
                                linkColor: newColor,
                            },
                        });
                    }}
                />
            </div>
        </div>
    );
}
