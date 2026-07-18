var LOREBOOK_NAME = "千叶童话";

var CH_NUMS = ["", "一","二","三","四","五","六","七","八","九","十",
    "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
    "二十一","二十二","二十三","二十四","二十五","二十六","二十七","二十八","二十九","三十"];

var CONTROL_PANEL_CONFIG = {
    "tab3-sub1": {
        title: "美化",
        defaultSingle: true,
        items: [
            { id: "cps1-1", name: "正文美化", desc: "启用正文的美化排版与装饰效果。", enableUids: [ 3 ], disableUids: [], defaultChecked: true },
            { id: "cps1-2", name: "纯文字", desc: "使用简洁的纯文字模式，关闭所有美化效果。", enableUids: [ 4 ], disableUids: [] }
        ]
    }
};

var emptyTemplateInfo = {
    "story": { "name": "", "alias": "", "background": "", "startContent": "", "coverImg": "" },
    "variable": {
        "world": { "date": "", "position": "", "time": "" },
        "write": { "stage": "阶段0", "next_stage": "阶段1", "next_next_stage": "阶段2" },
        "user": { "identity": "", "gender": "", "body_state": "", "Inventory": {}, "surroundings": "", "Psychological_description": "" },
        "剧情线": {},
        "描写指导": {},
        "背景信息": { "地区": { "未知地图": { "描述": "尚未开拓之地...", "民俗风情": {} } } }
    }
};

function mtH(str) {
    if(typeof str !== 'string' || !str) return "";
    var s = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>');
    s = s.replace(/~~(.*?)~~/g, '<del class="md-del">$1</del>');
    s = s.replace(/\|\|(.*?)\|\|/g, '<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
    s = s.replace(/(?:^|\n)######\s+(.*)/g, '\n<h6 class="md-h md-h6">$1</h6>');
    s = s.replace(/(?:^|\n)#####\s+(.*)/g, '\n<h5 class="md-h md-h5">$1</h5>');
    s = s.replace(/(?:^|\n)####\s+(.*)/g, '\n<h4 class="md-h md-h4">$1</h4>');
    s = s.replace(/(?:^|\n)###\s+(.*)/g, '\n<h3 class="md-h md-h3">$1</h3>');
    s = s.replace(/(?:^|\n)##\s+(.*)/g, '\n<h2 class="md-h md-h2">$1</h2>');
    s = s.replace(/(?:^|\n)#\s+(.*)/g, '\n<h1 class="md-h md-h1">$1</h1>');
    return s;
}

window.safeRenderMdOnNodes = function(rootElement) {
    if (!rootElement) return;
    var walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while (node = walker.nextNode()) { textNodes.push(node); }
    textNodes.forEach(function(node) {
        var val = node.nodeValue;
        if(!val.trim()) return;
        var s = val;
        var hasMd = s.indexOf('**') !== -1 || s.indexOf('~~') !== -1 || s.indexOf('||') !== -1 || s.indexOf('#') !== -1;
        if(!hasMd) return;
        s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="md-bold">$1</strong>');
        s = s.replace(/~~(.*?)~~/g, '<del class="md-del">$1</del>');
        s = s.replace(/\|\|(.*?)\|\|/g, '<span class="md-spoiler" onclick="this.classList.toggle(\'revealed\')">$1</span>');
        s = s.replace(/(?:^|\n)######\s+(.*)/g, '\n<h6 class="md-h md-h6">$1</h6>');
        s = s.replace(/(?:^|\n)#####\s+(.*)/g, '\n<h5 class="md-h md-h5">$1</h5>');
        s = s.replace(/(?:^|\n)####\s+(.*)/g, '\n<h4 class="md-h md-h4">$1</h4>');
        s = s.replace(/(?:^|\n)###\s+(.*)/g, '\n<h3 class="md-h md-h3">$1</h3>');
        s = s.replace(/(?:^|\n)##\s+(.*)/g, '\n<h2 class="md-h md-h2">$1</h2>');
        s = s.replace(/(?:^|\n)#\s+(.*)/g, '\n<h1 class="md-h md-h1">$1</h1>');
        var modified = s !== val;
        if(modified) {
            var temp = document.createElement('span');
            temp.innerHTML = s;
            while(temp.firstChild) {
                node.parentNode.insertBefore(temp.firstChild, node);
            }
            node.parentNode.removeChild(node);
        }
    });
};

window.extractMdFromNode = function(origNode) {
    if(!origNode) return "";
    var helper = document.getElementById('md-extractor-helper');
    if(!helper) {
        helper = document.createElement('div');
        helper.id = 'md-extractor-helper';
        helper.style.position = 'absolute';
        helper.style.left = '-9999px';
        helper.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(helper);
    }
    helper.innerHTML = origNode.innerHTML;
    var elementsToConvert = helper.querySelectorAll('.md-bold, strong, b, .md-del, del, s, strike, span.md-spoiler, h1, h2, h3, h4, h5, h6, .md-h');
    var arr = Array.from(elementsToConvert).reverse();
    for(var i = 0; i < arr.length; i++) {
        var el = arr[i];
        var tag = el.tagName.toLowerCase();
        var cls = el.className || "";
        var mdStart = "", mdEnd = "";
        var bPrefix = "", bSuffix = "";
        if (cls.indexOf('md-bold') !== -1 || tag === 'strong' || tag === 'b') { mdStart = mdEnd = "**"; }
        else if (cls.indexOf('md-del') !== -1 || tag === 'del' || tag === 's' || tag === 'strike') { mdStart = mdEnd = "~~"; }
        else if (cls.indexOf('md-spoiler') !== -1) { mdStart = mdEnd = "||"; }
        else if (tag.match(/^h[1-6]$/)) { mdStart = '#'.repeat(parseInt(tag[1])) + ' '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h1') !== -1) { mdStart = '# '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h2') !== -1) { mdStart = '## '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h3') !== -1) { mdStart = '### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h4') !== -1) { mdStart = '#### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h5') !== -1) { mdStart = '##### '; bSuffix = '\n'; }
        else if (cls.indexOf('md-h6') !== -1) { mdStart = '###### '; bSuffix = '\n'; }
        var internalText = el.innerText || el.textContent || "";
        var finalOutput = bPrefix + mdStart + internalText + mdEnd + bSuffix;
        var textNode = document.createTextNode(finalOutput);
        if(el.parentNode) el.parentNode.replaceChild(textNode, el);
    }
    var finalStr = helper.innerText;
    if (!finalStr) finalStr = helper.textContent;
    helper.innerHTML = "";
    return finalStr;
};
