import './style.css';

declare global {
  interface Window {
    utils: {
      updateOutput: () => void;
      clampMyHeightTo: (me: HTMLElement, elementId: string, offset: number) => void;
    };
  }
}

window.utils = window.utils || {};

window.utils.updateOutput = function () {
  const targetId = 'parent';
  const targetElt = document.getElementById(targetId);
  if (!targetElt) {
    console.error(`Element with id ${targetId} not found`);
    return;
  }

  const outputTargetId = 'html-output';
  const outputTargetElt = document.getElementById(outputTargetId);
  if (!outputTargetElt) {
    console.error(`Element with id ${outputTargetId} not found`);
    return;
  }

  const cssOutputId = 'css-output';
  const cssOutputElt = document.getElementById(cssOutputId);
  if (!cssOutputElt) {
    console.error(`Element with id ${cssOutputId} not found`);
    return;
  }

  // Clone element
  const clone = targetElt.cloneNode(true);
  if (!(clone instanceof HTMLElement)) {
    console.error('Cloned element is not an HTMLElement');
    return;
  }

  // Remove inline styles from the cloned root element
  clone.removeAttribute('style');

  // Remove Ids from all parent and descendants
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

  // Remove inline styles from all descendants
  clone.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));

  // Format the output properly using DOMParser and XMLSerializer
  const formattedHtml = formatHtml(clone.outerHTML);

  // Insert formatted HTML into output
  outputTargetElt.textContent = formattedHtml;

  // Get computed styles and format them
  const formattedCss = getFilteredComputedCss(targetElt);
  
  // Insert formatted CSS into output
  cssOutputElt.textContent = formattedCss;
};

// Function to pretty-print HTML
function formatHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc.body.firstChild) return '';

  return formatNode(doc.body.firstChild as HTMLElement, 0);
}

// Recursive function to format a node with indentation
function formatNode(node: HTMLElement, level: number): string {
  const indent = "  ".repeat(level);
  let formatted = `${indent}<${node.tagName.toLowerCase()}`;

  // Add attributes
  if (node.attributes.length > 0) {
    for (const attr of Array.from(node.attributes)) {
      formatted += ` ${attr.name}="${attr.value}"`;
    }
  }
  formatted += ">";

  // Handle children or text content
  if (node.childNodes.length > 0) {
    formatted += "\n";
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          formatted += indent + "  " + text + "\n";
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        formatted += formatNode(child as HTMLElement, level + 1);
      }
    }
    formatted += indent;
  }

  formatted += `</${node.tagName.toLowerCase()}>\n`;
  return formatted;
}

// Object mapping class names to the properties to include
const cssPropertiesToInclude: { [key: string]: string[] } = {
  'parent': [
    'position', 'display', 'flex-direction', 'justify-content', 'align-items',
    'padding', 'width', 'height'
  ],
  'content': [
    'display', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'z-index'
  ],
  'bg-wrapper': [
    'position', 'top', 'left', 'height', 'width'
  ],
  'bg-inner': [
    'position', 'top', 'left', 'width', 'height', 'transform', 'border-color',
    'border-style', 'border-width', 'background-color', 'opacity'
  ]
};

// Function to extract filtered computed CSS for an element and its descendants
function getFilteredComputedCss(element: HTMLElement): string {
  const styles: string[] = [];

  function processElement(el: HTMLElement) {
    const computedStyle = window.getComputedStyle(el);
    const classList = Array.from(el.classList);
    const selector = classList.length > 0 ? `.${classList.join('.')}` : el.tagName.toLowerCase();
    
    const cssRules: string[] = [];
    classList.forEach(className => {
      const properties = cssPropertiesToInclude[className];
      if (properties) {
        properties.forEach(property => {
          let value = computedStyle.getPropertyValue(property);
          if (property === 'transform' && value.includes('matrix')) {
            value = convertMatrixToDegrees(value);
          }
          if (value) {
            cssRules.push(`  ${property}: ${value};`);
          }
        });
      }
    });

    if (cssRules.length > 0) {
      styles.push(`${selector} {\n${cssRules.join("\n")}\n}`);
    }
  }

  // Process the parent element
  processElement(element);

  // Process all descendants
  element.querySelectorAll("*").forEach((child) => {
    if (child instanceof HTMLElement) {
      processElement(child);
    }
  });

  return styles.join("\n\n");
}

// Function to convert matrix to degrees
function convertMatrixToDegrees(matrix: string): string {
  const values = matrix.match(/matrix\(([^)]+)\)/);
  if (!values) return matrix;

  const parts = values[1].split(',').map(parseFloat);
  const angle = Math.round(Math.atan2(parts[1], parts[0]) * (180 / Math.PI));
  return `rotate(${angle}deg)`;
}


window.utils.clampMyHeightTo = function (me: HTMLElement, elementId: string, offset: number) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Get the height of each child element, not all descendants.
  const children = element.children;
  let totalHeight = 0;
  for (let i = 0; i < children.length; i++) {
    totalHeight += children[i].clientHeight;
  }

  // Add the offset
  totalHeight += offset;

  // Set the height of the parent element
  me.style.display = 'flex';
  me.style.height = `${totalHeight}px`;
}

// Run the update on load
window.utils.updateOutput();
