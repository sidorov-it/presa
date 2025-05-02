// Example usage of the deep-diff library

import deepDiff from 'deep-diff';

// Example objects
const before = {
  id: 'presentation-1',
  title: 'My Presentation',
  slides: [
    {
      id: 'slide-1',
      title: 'Introduction',
      layouts: [
        {
          id: 'layout-1',
          type: 'single-column',
          elements: [
            {
              id: 'element-1',
              content: 'Hello world',
              type: 'text'
            }
          ]
        }
      ]
    }
  ]
};

// After changing text content of an element
const after1 = {
  id: 'presentation-1',
  title: 'My Presentation',
  slides: [
    {
      id: 'slide-1',
      title: 'Introduction',
      layouts: [
        {
          id: 'layout-1',
          type: 'single-column',
          elements: [
            {
              id: 'element-1',
              content: 'Hello\nworld', // Content changed
              type: 'text'
            }
          ]
        }
      ]
    }
  ]
};

// After adding a new layout
const after2 = {
  id: 'presentation-1',
  title: 'My Presentation',
  slides: [
    {
      id: 'slide-1',
      title: 'Introduction',
      layouts: [
        {
          id: 'layout-1',
          type: 'single-column',
          elements: [
            {
              id: 'element-1',
              content: 'Hello world',
              type: 'text'
            }
          ]
        },
        {
          id: 'layout-2',
          type: 'two-columns',
          elements: [
            {
              id: 'element-2',
              content: 'New element',
              type: 'text'
            }
          ]
        }
      ]
    }
  ]
};

// Example 1: Editing element content
console.log('Example 1: Editing element content');
const contentEditDiffs = deepDiff.diff(before, after1);
console.log('Content edit diffs:', JSON.stringify(contentEditDiffs, null, 2));

// Example 2: Adding a new layout
console.log('\nExample 2: Adding a new layout');
const layoutAddDiffs = deepDiff.diff(before, after2);
console.log('Layout add diffs:', JSON.stringify(layoutAddDiffs, null, 2));

// Example of applying diffs forwards
console.log('\nExample of applying diffs forwards');
const obj = { value: 10, nested: { a: 1, b: 2 } };
const modified = { value: 20, nested: { a: 3, b: 2 } };

const diffs = deepDiff.diff(obj, modified);
console.log('Original object:', JSON.stringify(obj));
console.log('Modified object:', JSON.stringify(modified));
console.log('Diffs:', JSON.stringify(diffs, null, 2));

// Apply forward
const forwardResult = JSON.parse(JSON.stringify(obj)); // Clone the object
diffs.forEach(diff => deepDiff.applyChange(forwardResult, undefined, diff));
console.log('After applying diffs:', JSON.stringify(forwardResult));

// Revert diffs
console.log('\nExample of reverting diffs');
const revertResult = JSON.parse(JSON.stringify(modified)); // Clone the modified object
diffs.forEach(diff => deepDiff.revertChange(revertResult, undefined, diff));
console.log('After reverting diffs:', JSON.stringify(revertResult));

// Example usage in history store format
const historyAction = {
  type: 'element',
  description: 'Update element content',
  presentationId: 'presentation-1',
  elementId: 'element-1',
  changes: contentEditDiffs,
  timestamp: Date.now(),
  before,
  after: after1
};

console.log('\nHistory action:', JSON.stringify(historyAction, null, 2)); 