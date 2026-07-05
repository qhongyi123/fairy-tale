var LOREBOOK_NAME = "《千叶童话》";

var CH_NUMS = ["", "一","二","三","四","五","六","七","八","九","十",
    "十一","十二","十三","十四","十五","十六","十七","十八","十九","二十",
    "二十一","二十二","二十三","二十四","二十五","二十六","二十七","二十八","二十九","三十"];

var CONTROL_PANEL_CONFIG = {
    "tab3-sub1": {
        title: "叙事节奏",
        defaultSingle: true,
        items: [
            { id: "cps1-1", name: "均衡推进", desc: "进行剧情时，每次至多推进一个阶段", enableUids: [ 101 ], disableUids: [], defaultChecked: true },
            { id: "cps1-2", name: "快速推进", desc: "进行剧情时，每次推进至少一个阶段", enableUids: [ 101 ], disableUids: [] },
            { id: "cps1-3", name: "慢速推进", desc: "进行剧情时，每次推进一个阶段后，进行一个幕间", enableUids: [ 102 ], disableUids: [] }
        ]
    },
    "tab3-sub2": {
        title: "文风",
        defaultSingle: true,
        items: [
            { id: "cps2-1", name: "轻松奇幻", desc: "引入黑暗冷酷的世界观色彩，无情的现实随时都会降临。", enableUids: [ 111 ], disableUids: [], defaultChecked: true },
            { id: "cps2-2", name: "童真暖光", desc: "温暖奇迹般的故事语调，任何挫折也只是奔向甜蜜前的插曲。", enableUids: [ 112 ], disableUids: [] }
        ]
    },
    "tab3-sub3": {
        title: "额外XP",
        defaultSingle: false,
        items: [
            { id: "cps3-1", name: "沉沦扭曲之恋", desc: "将会在对话深处追加强烈的病娇与扭曲占据属性指令许可。", enableUids: [ 201 ], disableUids: [] },
            { id: "cps3-2", name: "屈服驯化记录", desc: "解锁主从羁绊或完全受降的潜台词设定，偏好更深不可测的控制感。", enableUids: [ 202 ], disableUids: [] },
            { id: "cps3-3", name: "奇迹异变体", desc: "赋予故事触手或其余隐晦非常识生物出场的微小倾向加成。", enableUids: [ 203 ], disableUids: [] }
        ]
    },
    "tab3-sub4": {
        title: "备用页面",
        defaultSingle: false,
        items: [
            { id: "cps4-1", name: "暗黑模组试做版 A", desc: "用于挂载未知领域试验法则的一号预留卡槽。", enableUids: [ 301 ], disableUids: [] },
            { id: "cps4-2", name: "心流模组探测器 B", desc: "开启该选项调用世界内部暗线的秘密彩蛋检测机制。", enableUids: [ 302 ], disableUids: [] }
        ]
    }
};

var emptyTemplateInfo = {
    "story": { "name": "", "alias": "", "background": "", "startContent": "", "coverImg": "" },
    "variable": {
        "world": { "date": "", "position": "", "time": "" },
        "write": { "stage": "", "next_stage": "阶段1" },
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
