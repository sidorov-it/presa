import { type Buffer } from 'node:buffer';
import { extractRawText as parseWordFile } from 'mammoth';
import * as cfb from 'cfb';
import { parseStringPromise as xmlToJson } from 'xml2js';

import type { TextExtractionMethod } from 'office-text-extractor';

export class DocExtractor implements TextExtractionMethod {
    /**
     * The type(s) of input acceptable to this method.
     */
    mimes = ['application/x-cfb', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    /**
     * Extract text from a DOCX/DOC file if possible.
     *
     * @param payload The input and its type.
     * @returns The text extracted from the input.
     */
    apply = async (input: Buffer): Promise<string> => {
        try {
            // Try to parse as DOCX
            const parsedDocx = await parseWordFile({ buffer: input });
            return parsedDocx.value;
        } catch (caughtError: unknown) {
            // If it fails, try to parse as DOC
            const error = caughtError as Error;
            if (error.message?.includes('is this a zip file')) {
                const contents = await extractDocText(input);
                return contents;
            } else {
                // If it is not a DOC file, let the error propagate.
                throw caughtError;
            }
        }
    };
}

/**
 * Extract text from a DOC file.
 *
 * @param buffer The buffer containing the file.
 *
 * @returns The extracted text.
 */
const extractDocText = async (input: Buffer): Promise<string> => {
    const cfbFile = cfb.parse(input);
    const wordDocument = cfb.find(cfbFile, 'WordDocument');
    if (!wordDocument) throw new Error('Invalid .doc file, could not find WordDocument.');

    const documentBuffer = wordDocument.content;
    const documentXml = documentBuffer.toString('utf16le'); // DOC files are typically UTF-16 encoded
    const json = await xmlToJson(documentXml);
    const lines = await parseDocSection(json);

    return lines?.join('\n') + '';
};

/**
 * Extracts text from a section of the document, recursively.
 *
 * @param docSection The section of the doc, converted to JSON from XML.
 * @param collectedText The lines of text parsed from the document so far.
 *
 * @returns The lines of text in the document.
 */
const parseDocSection = async (docSection: any, collectedText?: string[]): Promise<string[] | undefined> => {
    // Keep track of the text being collected.
    const beingCollectedText = collectedText ?? [];

    // Parse the section according to what type it is.
    if (Array.isArray(docSection)) {
        // If it is, loop through the elements of the array.
        for (const element of docSection) {
            // Collect all the pieces of text from the array.
            if (typeof element === 'string' && element !== '') {
                beingCollectedText.push(element);
            } else {
                // However, if it is an object or another array, call this function
                // again to parse that.
                await parseDocSection(element, beingCollectedText);
            }
        }

        // Finally, return the collected text.
        return beingCollectedText;
    }

    // If the section is an object, loop through its properties.
    if (typeof docSection === 'object') {
        for (const property of Object.keys(docSection)) {
            // Get the value of the property.
            const value = docSection[property];

            // The `docx` format stores the actual text inside the `w:t` or `_`
            // properties, so extract text from those properties.

            // Check if it is a string or array that contains a string. If it is
            // either, then collect the text content.
            if (typeof value === 'string') {
                if ((property === 'w:t' || property === '_') && value !== '') {
                    beingCollectedText.push(value);
                }
            } else if (typeof value[0] === 'string') {
                if ((property === 'w:t' || property === '_') && value[0] !== '') {
                    beingCollectedText.push(value[0]);
                }
            } else {
                // However, if it is an object or another array, call this function
                // again to parse that.
                await parseDocSection(value, beingCollectedText);
            }
        }

        // Finally, return the collected text.
        return beingCollectedText;
    }
};
