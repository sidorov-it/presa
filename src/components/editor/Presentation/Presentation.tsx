import { IPresentation, Slide } from "@/types";
import SlideEditor from "../SlideEditor";
import { useDnd } from "@/contexts/DragDropContext";

export default function Presentation(
    { presentation, presentationId, activeSlideId, handleSlideSelect }:
        { presentation: IPresentation, presentationId: string, activeSlideId: string | null, handleSlideSelect: (slideId: string) => void }
) {
    // const { state } = useDnd();

    return (
        <div className="">
            {/* <div className="w-full p-4 bg-white rounded-lg shadow-sm mb-4">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Field</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(state).map(([key, value]) => (
                            <tr key={key} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-700 font-medium">{key}</td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                    {typeof value === 'object'
                                        ? JSON.stringify(value, null, 2)
                                        : value.toString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div> */}

            {presentation.slides.map((slide: Slide) => (
                <SlideEditor
                    key={slide.id}
                    slide={slide}
                    presentationId={presentationId}
                    handleSelectSlide={handleSlideSelect}
                    isSelected={activeSlideId === slide.id}
                />
            ))}
        </div>

    );
}