import React, { useRef } from 'react';
import Tiptap from './Tiptap';
import { TipTapRefs } from '@/types';

const TestContent = `
<p>Это обычный текст - нормальный размер</p>
<p><span style="font-size: 0.875rem;">Это маленький текст</span></p>
<p><span style="font-size: 1.125rem;">Это большой текст</span></p>
<h1>Это заголовок 1</h1>
<h2>Это заголовок 2</h2>
<h3>Это заголовок 3</h3>
<h4>Это заголовок 4</h4>
<h5>Это заголовок 5</h5>
<h6>Это большой заголовок</h6>
<h6><span style="font-size: 3rem;">Это очень большой заголовок</span></h6>
`;

export default function TextSizeTest() {
    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <h2 className="mb-4 text-2xl font-bold">Тест размеров текста</h2>
            <div className="border border-gray-300 rounded-lg p-2">
                <Tiptap
                    initialContent={TestContent}
                    tiptapRefs={tiptapRefs}
                    elementId="text-size-test"
                    elementConfig={{}}
                    autoFocus
                />
            </div>
        </div>
    );
} 