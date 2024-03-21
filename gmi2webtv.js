function escapeHtml(unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

const CHARCODES = {};
// From https://html.spec.whatwg.org/multipage/parsing.html#numeric-character-reference-end-state
CHARCODES[`€`] = 0x80; // Wrongly shows up in WebTV as right arrow
CHARCODES[`‚`] = 0x82;
CHARCODES[`ƒ`] = 0x83;
CHARCODES[`„`] = 0x84;
CHARCODES[`…`] = 0x85;
CHARCODES[`†`] = 0x86;
CHARCODES[`‡`] = 0x87;
CHARCODES[`ˆ`] = 0x88;
CHARCODES[`‰`] = 0x89;
CHARCODES[`Š`] = 0x8A;
CHARCODES[`‹`] = 0x8B;
CHARCODES[`Œ`] = 0x8C;
CHARCODES[`Ž`] = 0x8E; // Missing from WebTV
CHARCODES[`‘`] = 0x91;
CHARCODES[`’`] = 0x92;
CHARCODES[`“`] = 0x93;
CHARCODES[`”`] = 0x94;
CHARCODES[`•`] = 0x95;
CHARCODES[`–`] = 0x96;
CHARCODES[`—`] = 0x97;
CHARCODES[`˜`] = 0x98;
CHARCODES[`™`] = 0x99;
CHARCODES[`š`] = 0x9A;
CHARCODES[`›`] = 0x9B;
CHARCODES[`œ`] = 0x9C;
CHARCODES[`ž`] = 0x9E; // Missing from WebTV
CHARCODES[`Ÿ`] = 0x9F;


function text2charrefs(text) {
    let result = "";
    for(let char of text) {
        let codepoint = char.codePointAt(0);
        if(codepoint >= 0x80) {
            let charCode = CHARCODES[char];
            if(!charCode) {
                charCode = codepoint;
            }
            result += `&#${charCode};`;
        } else {
            result += char;
        }
    }
    return result;
}

function getEmoji(emoji) {
    // Based on https://openmoji.org/faq/
    let emoji_code = [...emoji].map(e => e.codePointAt(0).toString(16).padStart(4, '0')).join(`-`).toUpperCase()
    emoji_code = emoji_code.replace("-FE0F", "");
    let new_url = `openmoji/${emoji_code}.gif`
    return `<img src=${new_url} height=16>`;
}

function replaceEmoji(text) {
    return text.replaceAll(/\p{RGI_Emoji}/gv, getEmoji);
}

function processText(text) {
    // For text in main body
    let escaped = escapeHtml(text);
    let emojified = replaceEmoji(escaped); // TODO: Insert emoji processing here
    let encoded = text2charrefs(emojified);
    return encoded;
}

function gmi2webtv(gemtext) {
    const LINK_REGEX = /^=>\s*([^\s]+)\s*(.*)$/
    let lines = gemtext.split("\n");
    let resultHtml = "";
    let preformatted = false;
    for(let line of lines) {
        if(preformatted) {
            if(line.startsWith("```")) {
                preformatted = false;
                resultHtml += "</pre>\n";
            } else {
                resultHtml += escapeHtml(line);
            }
        } else if(line.startsWith("```")) {
            preformatted = true;
            resultHtml += "<pre>\n";
        } else if(line.startsWith("### ")) {
            resultHtml += `<h3>${processText(line)}</h3>\n`;
        } else if(line.startsWith("## ")) {
            resultHtml += `<h2>${processText(line)}</h2>\n`;
        } else if(line.startsWith("# ")) {
            resultHtml += `<h1>${processText(line)}</h1>\n`;
        } else if(line.startsWith("=>")) {
            let [full, url, desc] = LINK_REGEX.exec(line);
            if(desc) {
                resultHtml += `<p><a href="${escapeHtml(url)}">${processText(desc)}</a></p>\n`;
            } else {
                resultHtml += `<p><a href="${escapeHtml(url)}">${processText(url)}</a></p>\n`;
            }
        } else {
            resultHtml += `<p>${processText(line)}<\p>\n`
        }
    }
    return resultHtml;
}

export { gmi2webtv };