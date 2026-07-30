const inputTextArea = document.getElementById('inputHtml');
const outputTextArea = document.getElementById('outputCleaned');

function getSafeDOM(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.body;
}

function getCurrentText() {
    return outputTextArea.value.trim() !== "" ? outputTextArea.value : inputTextArea.value;
}

function stripHtml(container) {
    let text = container.textContent || "";
    return text.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
}

function removeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => s.remove());
}

function removeComments(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_COMMENT, null, false);
    let node;
    const comments = [];
    while (node = walker.nextNode()) comments.push(node);
    comments.forEach(c => c.remove());
}

function removeAttributes(container, types) {
    const attrList = Array.isArray(types) ? types : [types];
    const allElements = container.querySelectorAll('*');

    allElements.forEach(el => {
        const attrs = Array.from(el.attributes);
        attrs.forEach(attr => {
            const name = attr.name.toLowerCase();
            attrList.forEach(type => {
                if (type === 'data' && name.startsWith('data-')) el.removeAttribute(name);
                else if (type === 'events' && name.startsWith('on')) el.removeAttribute(name);
                else if (name === type) el.removeAttribute(name);
            });
        });
    });
}

function removeEmptyTags(container) {
    let changed;
    do {
        changed = false;
        const elements = container.querySelectorAll('p, span, div');
        elements.forEach(el => {
            const content = el.innerHTML.replace(/&nbsp;/g, '').trim();
            if (content === "") {
                el.remove();
                changed = true;
            }
        });
    } while (changed);
}

function wrapBrWithP(container) {
    const nodes = Array.from(container.childNodes);
    let buffer = [];
    const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'SECTION', 'TABLE', 'ARTICLE'];

    const flush = () => {
        if (buffer.length === 0) return;
        const hasContent = buffer.some(n => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ""));
        if (hasContent) {
            const p = document.createElement('p');
            buffer[0].parentNode.insertBefore(p, buffer[0]);
            buffer.forEach(node => p.appendChild(node));
        }
        buffer = [];
    };

    nodes.forEach(node => {
        if (node.nodeName === 'BR') {
            flush();
            node.remove();
        } else if (node.nodeType === Node.ELEMENT_NODE && blockTags.includes(node.nodeName)) {
            flush();
        } else {
            buffer.push(node);
        }
    });
    flush();
}

function applyChanges(actionType, params = null) {
    const htmlString = getCurrentText();
    const container = getSafeDOM(htmlString);

    if (actionType === 'stripAll') {
        outputTextArea.value = stripHtml(container);
        return;
    }

    switch (actionType) {
        case 'scripts': removeScripts(container); break;
        case 'comments': removeComments(container); break;
        case 'empty': removeEmptyTags(container); break;
        case 'wrapBr': wrapBrWithP(container); break;
        case 'attributes': removeAttributes(container, params); break;
        case 'beautiful':
            removeScripts(container);
            removeComments(container);
            removeAttributes(container, ['class', 'id', 'data', 'style', 'events']);
            wrapBrWithP(container);
            removeEmptyTags(container);
            break;
    }

    outputTextArea.value = container.innerHTML.trim();
}

document.getElementById('cleanButton').addEventListener('click', () => applyChanges('stripAll'));
document.getElementById('removeScriptsBtn').addEventListener('click', () => applyChanges('scripts'));
document.getElementById('removeCommentsBtn').addEventListener('click', () => applyChanges('comments'));
document.getElementById('cleanEmptyButton').addEventListener('click', () => applyChanges('empty'));
document.getElementById('wrapBrButton').addEventListener('click', () => applyChanges('wrapBr'));
document.getElementById('makeBeautifulBtn').addEventListener('click', () => applyChanges('beautiful'));

const attrMap = {
    'removeClassBtn': 'class',
    'removeIdBtn': 'id',
    'removeDataBtn': 'data',
    'removeStyleBtn': 'style',
    'removeEventsBtn': 'events'
};

Object.entries(attrMap).forEach(([id, type]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => applyChanges('attributes', type));
});

inputTextArea.addEventListener('input', () => {
    outputTextArea.value = '';
});

function copyToClipboard(elementId, btn) {
    const textArea = document.getElementById(elementId);
    navigator.clipboard.writeText(textArea.value).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'Скопировано';
        btn.style.backgroundColor = '#2ecc71';
        btn.style.color = '#fff';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }, 2000);
    });
}

