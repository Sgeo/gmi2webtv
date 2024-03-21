function escapeHtml(unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

const WINDOWS_1252_BYTES = new Uint8Array(256);
for(let i = 0; i < 256; i++) {
    WINDOWS_1252_BYTES[i] = i;
}
let Windows1252Decoder = new TextDecoder("windows-1252");
const WINDOWS_1252_CHARS = Windows1252Decoder.decode(WINDOWS_1252_BYTES);
const STR_TO_WINDOWS_1252 = {};
for(let i = 0; i < 256; i++) {
    STR_TO_WINDOWS_1252[WINDOWS_1252_CHARS[i]] = i;
}

function get_emoji(emoji) {
    // Based on https://openmoji.org/faq/
    let emoji_code = [...emoji].map(e => e.codePointAt(0).toString(16).padStart(4, '0')).join(`-`).toUpperCase()
    if (emoji_code.length === 10) emoji_code = emoji_code.replace("-FE0F", "");
    let new_url = `openmoji/${emoji_code}.gif`
    return `<img src=${new_url} height=16>`;
}

function text2windows1252(text) {
    let resultBytes = [];
    for(let codepoint of text) {
        let winbyte = STR_TO_WINDOWS_1252[codepoint];
        if(winbyte) {
            resultBytes.push(winbyte);
        } else if(!winbyte && !codepoint) {
            resultBytes.push(0x00);
        } else if(/\p{Emoji}/u.test(codepoint)) {
            // This won't work well for multi-codepoint emojis. What happens to selectors? They get turned into dead images!
            let emoji_img = get_emoji(codepoint);
            resultBytes = resultBytes.concat([...emoji_img].map(c => c.codePointAt(0)));
        } else {
            resultBytes.push(0x00);
        }
    }
    return new Uint8Array(resultBytes);
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
            resultHtml += `<h3>${escapeHtml(line)}</h3>\n`;
        } else if(line.startsWith("## ")) {
            resultHtml += `<h2>${escapeHtml(line)}</h2>\n`;
        } else if(line.startsWith("# ")) {
            resultHtml += `<h1>${escapeHtml(line)}</h1>\n`;
        } else if(line.startsWith("=>")) {
            let [full, url, desc] = LINK_REGEX.exec(line);
            if(desc) {
                resultHtml += `<p><a href="${escapeHtml(url)}">${escapeHtml(desc)}</a></p>\n`;
            } else {
                resultHtml += `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>\n`;
            }
        } else {
            resultHtml += `<p>${escapeHtml(line)}<\p>\n`
        }
    }
    return text2windows1252(resultHtml);
}

export { gmi2webtv };