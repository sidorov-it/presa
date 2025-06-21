import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import { ChartElement } from '@/types';
import ChartComponent from './ChartComponent';

interface ChartProps {
    elementId: string;
    className?: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    hasMultipleCells?: boolean;
    inSettings?: boolean;
    slideBackground?: string;
}

export default function Chart({
    elementId,
    className = '',
    presentationId,
    slideId,
    layoutId,
    hasMultipleCells,
    inSettings,
    slideBackground,
}: ChartProps) {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ChartElement;
    const updateElement = usePresentationStore(state => state.updateElement);
    const deleteElement = usePresentationStore(state => state.deleteElement);
    const currentTheme = useThemeStore(state => state.currentTheme);

    return (
        <ChartComponent
            element={element}
            className={className}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            hasMultipleCells={hasMultipleCells}
            inSettings={inSettings}
            theme={currentTheme}
            slideBackground={slideBackground}
            onUpdateElement={data =>
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data,
                })
            }
            onDeleteElement={() => deleteElement(presentationId, slideId, layoutId, elementId)}
        />
    );
}
