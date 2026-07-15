// 故事清单：每个故事对应一个 JSON 文件
var STORY_MANIFEST = [
    { id: "tab4",  name: "白雪公主",          file: "data/stories/白雪公主.json", headers: ["背景信息", "剧情线", "参数调整", "开始剧情"] },
    { id: "tab5",  name: "灰姑娘",            file: "data/stories/灰姑娘.json", headers: ["背景信息", "剧情线", "参数调整", "开始剧情"] },
    { id: "tab7",  name: "小红帽",            file: "data/stories/小红帽.json", headers: ["背景信息", "剧情线", "参数调整", "开始剧情"] },
    { id: "tab8",  name: "卖火柴的小女孩",    file: "data/stories/卖火柴的小女孩.json", headers: ["背景信息", "剧情线", "参数调整", "开始剧情"] },
    { id: "tab10", name: "小裁缝一次干七个！", file: "data/stories/小裁缝一次干七个！.json", headers: ["背景信息", "剧情线", "参数调整", "开始剧情"] },
    { id: "tab11", name: "自定义开局",        file: null, headers: ["背景信息", "人物信息", "参数调整", "开始剧情"] },
    { id: "tab12", name: "自定义剧本",        file: null, headers: ["背景信息", "剧情线", "人物信息", "参数调整", "开始剧情"] }
];

var originalDataCache = {};
var tabsDataMap = {};

// 加载所有故事 JSON
async function loadAllStories() {
    var promises = STORY_MANIFEST.map(function(cfg) {
        if (cfg.file) {
            return fetch(cfg.file)
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    // JSON 文件中已有 story/variable 顶层字段
                    tabsDataMap[cfg.id] = {
                        headers: cfg.headers,
                        data: {
                            story: data.story,
                            variable: data.variable
                        }
                    };
                })
                .catch(function(err) {
                    console.warn("加载故事失败: " + cfg.file, err);
                    // 回退到空模板
                    tabsDataMap[cfg.id] = {
                        headers: cfg.headers,
                        data: JSON.parse(JSON.stringify(emptyTemplateInfo))
                    };
                });
        } else {
            // 自定义开局/剧本使用空模板
            tabsDataMap[cfg.id] = {
                headers: cfg.headers,
                data: JSON.parse(JSON.stringify(emptyTemplateInfo))
            };
        }
    });
    await Promise.all(promises);
}

// 初始化动态标签页
async function initDynamicTabs() {
    var container = document.getElementById('dynamic-tabs-area');

    renderControlPanelDynamicArea();

    // 加载所有故事数据
    await loadAllStories();

    // 从目录卡片中同步封面图
    document.querySelectorAll('.toc-img-card').forEach(function(card) {
        var btnOnClick = card.getAttribute('onclick');
        var tabIdMatch = btnOnClick.match(/'(tab\d+)'/);
        if(tabIdMatch) {
            var imgNode = card.querySelector('img');
            var src = imgNode ? imgNode.getAttribute('src') : "";
            var tid = tabIdMatch[1];
            if(tabsDataMap[tid] && src) { tabsDataMap[tid].data.story.coverImg = src; }
        }
    });

    var refNodeTab13 = document.getElementById('tab13');

    Object.keys(tabsDataMap).forEach(function(tabId) {
        var cfg = tabsDataMap[tabId];
        originalDataCache[tabId] = JSON.parse(JSON.stringify(cfg.data));

        var tabNode = document.createElement('div');
        tabNode.id = tabId;
        tabNode.className = 'tab-panel';

        var headerHTML = '<div class="sub-tabs-header">';
        cfg.headers.forEach(function(h, i) { headerHTML += '<button class="sub-tab-btn ' + (i === 0 ? 'active' : '') + '" onclick="switchSubTab(this, \'' + tabId + '-sub' + (i+1) + '\')">' + h + '</button>'; });

        if (tabId !== 'tab11' && tabId !== 'tab12') {
            headerHTML += '<div class="edit-switch-container"><span>修改模式</span><label class="switch-ui"><input type="checkbox" onchange="toggleEditMode(this, \'' + tabId + '\')"><span class="slider"></span></label></div>';
        }
        headerHTML += '</div>';

        var sd = cfg.data.story;
        var vd = cfg.data.variable;
        var panelsHTML = '<div class="sub-panels-wrapper">';

        cfg.headers.forEach(function(h, idx) {
            var contentStr = "";
            var isSubActive = idx === 0 ? "active" : "";
            var thisSubId = tabId + '-sub' + (idx+1);

            if (h === "背景信息") {
                var regionsHTML = "";
                var regions = (vd["背景信息"] && vd["背景信息"]["地区"]) ? vd["背景信息"]["地区"] : {};
                Object.keys(regions).forEach(function(rk) {
                    var rt = regions[rk];
                    var customsHTML = "";
                    if(rt["民俗风情"]) {
                        Object.keys(rt["民俗风情"]).forEach(function(ck) {
                            customsHTML += '<div class="custom-row custom-item" data-ditem><span class="editable-key editable-field" style="color:#8b5a2b;" data-dkey>' + mtH(ck) + '</span>:<span class="editable-field" data-dval>' + mtH(rt["民俗风情"][ck]) + '</span></div>';
                        });
                    }
                    customsHTML += '<div class="add-custom-btn" onclick="addNewCustom(this)">+ 添加风情词条</div>';
                    regionsHTML += '<div class="area-box area-item"><div style="font-weight:bold; color:var(--color-primary-dark); margin-bottom:5px; border-bottom:1px dashed rgba(184,134,11,0.3); padding-bottom:5px;">\u27A4 <span class="editable-field editable-key region-name" style="color:var(--color-accent);">' + mtH(rk) + '</span></div><div class="custom-row" style="margin-bottom:8px;"><span class="param-label" style="flex-shrink:0;">描述:</span><div class="editable-field editable-textarea region-desc" style="flex:1;">' + mtH(rt["描述"] || '') + '</div></div><div class="customs-box"><div class="param-label" style="display:block; margin-bottom:4px;">\u2756 民俗风情:</div>' + customsHTML + '</div></div>';
                });

                var imgWidgetHTML = "";
                if (sd.coverImg && sd.coverImg.trim() !== "") {
                    imgWidgetHTML = '<div class="tab-cover-container"><div class="tab-cover-img-wrapper" id="img-wrapper-' + tabId + '" style="width: 140px;"><img src="' + sd.coverImg + '" alt="渊卷遗像"></div><div class="tab-cover-controls"><div class="zoom-btn" onclick="zoomTabImage(\'' + tabId + '\', 1)">+</div><div class="zoom-btn" onclick="zoomTabImage(\'' + tabId + '\', -1)">-</div></div></div>';
                }

                var ptStyle1 = imgWidgetHTML ? 'border-bottom:none; margin-bottom:0; padding-bottom:0;' : '';

                var infoIntroHTML = '<div class="data-block" style="' + ptStyle1 + '"><div class="data-field-title">\uD83D\uDCD6 卷目指印</div><div>名称：<span class="editable-field" data-path="story.name">' + mtH(sd.name) + '</span></div><div style="font-size:0.9em; margin-top:2px;">又名：<span class="editable-field" data-path="story.alias" style="opacity:0.8;">' + mtH(sd.alias) + '</span></div></div>' + imgWidgetHTML + '<div class="data-block"><div class="data-field-title">\uD83D\uDD78\uFE0F 渊源底本</div><div class="editable-textarea editable-field data-story-text" data-path="story.background">' + mtH(sd.background) + '</div></div>';

                var presetBtnHTML = '<button class="add-preset-btn custom-alert-btn" onclick="openPresetModal(\'' + tabId + '\')" style="margin-top:10px; width:100%; border-style:dashed; padding:8px; background:rgba(138, 43, 226, 0.08); color:var(--color-primary-dark); font-size:1.05rem;">\u2727 预设内容加载 \u2727</button>';

                var importBtnHTML = (tabId === 'tab11' || tabId === 'tab12') ? '<button class="custom-alert-btn" onclick="openImportModal(\'' + tabId + '\')" style="margin-top:10px; width:100%; border-style:dashed; padding:8px; background:rgba(184, 134, 11, 0.08); color:var(--color-primary-dark); font-size:1.05rem;">\u2727 导入预设开局 \u2727</button>' : "";

                contentStr = infoIntroHTML + '<div class="data-block" style="border-bottom:none;"><div class="data-field-title">\uD83D\uDDFA\uFE0F 地域与风土物志</div><div data-region-container id="regions-' + tabId + '">' + regionsHTML + '</div><button class="add-region-btn custom-alert-btn" onclick="addNewRegion(\'' + tabId + '\')" style="margin-top:10px; width:100%; border-style:dashed; padding:8px;">+ 新 建 地 域 </button>' + presetBtnHTML + importBtnHTML + '</div>';
            }
            else if (h === "剧情线") {
                contentStr = '<div class="data-block" style="border-bottom:1px dashed rgba(184, 134, 11, 0.3);"><div class="data-field-title" style="display:flex; justify-content:space-between; align-items:center;"><span>\uD83D\uDCDC 剧情阶段一览</span><span style="font-size:0.75rem; font-weight:normal; display:flex; gap:4px;"><button class="view-mode-btn active" onclick="switchStoryView(\'' + tabId + '\',\'doc\',this)" style="padding:2px 6px; border:1px solid var(--color-primary-dark); border-radius:3px; background:var(--bg-content); color:var(--color-primary-dark); cursor:pointer; font-size:0.7rem;">\uD83D\uDCC4 文档流</button><button class="view-mode-btn" onclick="switchStoryView(\'' + tabId + '\',\'timeline\',this)" style="padding:2px 6px; border:1px solid var(--color-primary-dark); border-radius:3px; background:var(--bg-content); color:var(--color-primary-dark); cursor:pointer; font-size:0.7rem;">\uD83D\uDD17 脉络式</button></span></div><ul style="padding-left:15px; color:var(--color-text-dark); margin-top:10px;" data-complex-dict="variable.剧情线" data-tab-id="' + tabId + '">' + generateComplexStorylines(vd["剧情线"] || {}) + '</ul><div class="add-custom-btn" onclick="addNewStoryline(this, \'stage\')">+ 添加剧情阶段</div></div>' +
                             '<div class="data-block" style="border:none; margin-top:15px;"><div class="data-field-title">\u270D\uFE0F 笔触描写指导</div><ul style="padding-left:15px; color:var(--color-text-dark); margin-top:10px;" data-dict="variable.描写指导">' + generateStorylines(vd["描写指导"] || {}) + '</ul><div class="add-custom-btn" onclick="addNewStoryline(this, \'guide\')">+ 添加描写指导</div></div>';
            }
            else if (h === "人物信息") {
                contentStr = '<div class="data-block" style="border:none; height:100%; display:flex; flex-direction:column;"><div class="data-field-title">\uD83C\uDFAD 世界书读取</div><div style="background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.15); padding:12px; border-radius:6px; margin-top:10px; flex:1; display:flex; flex-direction:column;"><select id="char-select-' + tabId + '" onchange="loadCharEntry(this, \'' + tabId + '\')" style="width:100%; padding:8px; margin-bottom:12px; border-radius:4px; background:var(--bg-content); color:var(--color-text-dark); border:1px solid var(--color-primary-dark); outline:none; font-family:inherit; box-shadow:inset 1px 1px 3px rgba(0,0,0,0.05);"><option value="">载入世间灵魄中，请稍候...</option></select><span class="param-label" style="display:block; margin-bottom:4px;">化身名号 (即神魂封卷语):</span><input type="text" id="char-name-' + tabId + '" placeholder="填写条目名称(例如角色名、称号等)..." style="width:100%; margin-bottom:12px; padding:6px; box-sizing:border-box; background:rgba(253,246,227,0.5); border:1px solid rgba(184,134,11,0.4); outline:none;"><span class="param-label" style="display:block; margin-bottom:4px; flex-shrink:0;">命途轨痕 (世界书人物条目内容):</span><textarea id="char-content-' + tabId + '" placeholder="描摹深层性格法则、种族特质、隐秘喜好等..." style="flex:1; width:100%; resize:none; padding:6px; box-sizing:border-box; background:rgba(253,246,227,0.5); border:1px solid rgba(184,134,11,0.4); outline:none;"></textarea><div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px; flex-shrink:0;"><button onclick="saveCharEntry(\'' + tabId + '\')" style="background:linear-gradient(135deg, #ffffff 0%, #fdf6e3 100%); border:1px solid var(--color-primary-dark); color:var(--color-text-dark); padding:6px 16px; border-radius:4px; cursor:pointer; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.15);">\u2727 写入 \u2727</button><button onclick="populateCharSelectors()" style="background:transparent; border:1px dashed var(--color-accent); color:var(--color-text-dark); padding:6px 12px; border-radius:4px; cursor:pointer;">\u21BB 刷新列表</button></div></div></div>';
            }
            else if (h === "参数调整") {
                contentStr = '<div class="param-group" style="background:rgba(212,175,55,0.06); padding:10px; border-radius:6px; border:1px solid rgba(212,175,55,0.15);"><div class="data-field-title" style="margin-bottom:8px;">\uD83C\uDF10 世界信息</div><div style="display:flex; flex-wrap:wrap; gap:10px; line-height:1.8;"><div style="flex:1; min-width:120px;"><span class="param-label">\uD83D\uDCC5 日期:</span> <span class="editable-field" data-path="variable.world.date">' + mtH(vd.world && vd.world.date || '') + '</span></div><div style="flex:1; min-width:120px;"><span class="param-label">\u23F1\uFE0F 时间:</span> <span class="editable-field" data-path="variable.world.time">' + mtH(vd.world && vd.world.time || '') + '</span></div><div style="width:100%;"><span class="param-label">\uD83D\uDCCD 地点:</span> <span class="editable-field" style="width:calc(100% - 50px);" data-path="variable.world.position">' + mtH(vd.world && vd.world.position || '') + '</span></div></div></div>' +
                    '<div class="param-group" style="padding:10px; border:1px solid rgba(212,175,55,0.1); border-radius:6px;"><div class="data-field-title" style="margin-bottom:8px;">\uD83C\uDFAD 角色信息</div><div style="display:flex; flex-wrap:wrap; gap:10px; line-height:1.8;"><div style="width:100%;"><span class="param-label">\uD83D\uDC64 身份:</span> <span class="editable-field" style="width:calc(100% - 50px);" data-path="variable.user.identity">' + mtH(vd.user && vd.user.identity || '') + '</span></div><div style="flex:1; min-width:120px;"><span class="param-label">\u26A7\uFE0F 性别:</span> <span class="editable-field" data-path="variable.user.gender">' + mtH(vd.user && vd.user.gender || '') + '</span></div><div style="width:100%;"><span class="param-label">\uD83E\uDEC0 身体状态:</span> <div class="editable-field editable-textarea" data-path="variable.user.body_state" style="display:inline-block; vertical-align:top; width:70%;">' + mtH(vd.user && vd.user.body_state || '') + '</div></div></div>' +
                    '<div style="margin-top:12px;"><span class="param-label" style="display:block;">\uD83E\uDEBA 行囊:</span><ul data-dict="variable.user.Inventory" style="padding-left:15px; margin:5px 0;">' + generateInventoryList(vd.user && vd.user.Inventory || {}) + '</ul><div class="add-custom-btn" onclick="addNewInventoryItem(this)">+ 添加物品</div></div>' +
                    '<div style="margin-top:12px;"><span class="param-label" style="display:block;">\uD83C\uDF03 周围环境:</span> <div class="editable-field editable-textarea" data-path="variable.user.surroundings">' + mtH(vd.user && vd.user.surroundings || '') + '</div></div>' +
                    '<div style="margin-top:12px;"><span class="param-label" style="display:block;">\uD83E\uDDE0 心理描写:</span> <div class="editable-field editable-textarea" data-path="variable.user.Psychological_description">' + mtH(vd.user && vd.user.Psychological_description || '') + '</div></div></div>';
            }
            else if (h === "开始剧情") {
                contentStr = '<div class="data-block" style="border-bottom:none;"><div class="data-field-title">\u2728 幕启词刻</div><div class="editable-field editable-textarea data-story-text" data-path="story.startContent" style="min-height:100px;">' + mtH(sd.startContent) + '</div></div><button class="start-game-btn" data-tid="' + tabId + '">开启童话物语</button>';
            }

            panelsHTML += '<div id="' + thisSubId + '" class="sub-panel ' + isSubActive + '">' + contentStr + '</div>';
        });

        panelsHTML += '</div>';
        tabNode.innerHTML = headerHTML + panelsHTML;
        container.insertBefore(tabNode, refNodeTab13);

        if (tabId === 'tab11' || tabId === 'tab12') {
            tabNode.classList.add('is-edit-mode');
            tabNode.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
        }
    });

    // 绑定开始剧情按钮
    document.querySelectorAll('.start-game-btn').forEach(function(btn) {
        if(!btn.getAttribute('data-tid')) return;

        btn.addEventListener('click', async function(e) {
            var tid = this.getAttribute('data-tid');
            if(!tid) return;

            var pContainer = document.getElementById(tid);
            var baseFullData = JSON.parse(JSON.stringify(originalDataCache[tid]));

            pContainer.querySelectorAll('[data-path]').forEach(function(el) {
                var paths = el.getAttribute('data-path').split('.');
                var currentObj = baseFullData;
                for (var i = 0; i < paths.length - 1; i++) {
                    if (currentObj[paths[i]] === undefined) currentObj[paths[i]] = {};
                    currentObj = currentObj[paths[i]];
                }
                currentObj[paths[paths.length - 1]] = window.extractMdFromNode(el).trim();
            });

            pContainer.querySelectorAll('[data-dict]').forEach(function(dictBox) {
                var paths = dictBox.getAttribute('data-dict').split('.');
                var currentObj = baseFullData;
                for(var i = 0; i < paths.length - 1; i++) currentObj = currentObj[paths[i]];
                var targetName = paths[paths.length - 1];
                var dynamicDict = {};
                var ignoreKeys = ["新增民俗风情", "相关民俗传闻", "空空如也", "新增物品", "- 行囊空空如也 -", "- 前路尚未明晰 -", "新增地域"];
                dictBox.querySelectorAll(':scope > [data-ditem]').forEach(function(item) {
                    var kNode = item.querySelector('[data-dkey]');
                    var vNode = item.querySelector('[data-dval]');
                    if(kNode && vNode) {
                        var k = window.extractMdFromNode(kNode).trim();
                        var v = window.extractMdFromNode(vNode).trim();
                        if(k !== "" && ignoreKeys.indexOf(k) === -1 && k.indexOf("阶段") === -1) { dynamicDict[k] = v; }
                    }
                });
                currentObj[targetName] = dynamicDict;
            });

            pContainer.querySelectorAll('[data-complex-dict]').forEach(function(dictBox) {
                var paths = dictBox.getAttribute('data-complex-dict').split('.');
                var currentObj = baseFullData;
                for(var i = 0; i < paths.length - 1; i++) currentObj = currentObj[paths[i]];
                var targetName = paths[paths.length - 1];
                var dynamicDict = {};
                dictBox.querySelectorAll(':scope > [data-citem]').forEach(function(item) {
                    var ckNode = item.querySelector('[data-ckey]');
                    if(ckNode) {
                        var k = window.extractMdFromNode(ckNode).trim();
                        if(k !== "" && k !== "- 前路尚未明晰 -") {
                            var sObj = {};
                            item.querySelectorAll('.custom-row').forEach(function(row) {
                                var snode = row.querySelector('[data-skey]');
                                var vnode = row.querySelector('[data-sval]');
                                if(snode && vnode) {
                                    var sn = window.extractMdFromNode(snode).trim();
                                    var sv = window.extractMdFromNode(vnode).trim();
                                    if(sn) sObj[sn] = sv;
                                }
                            });
                            dynamicDict[k] = sObj;
                        }
                    }
                });
                currentObj[targetName] = dynamicDict;
            });

            var rCont = pContainer.querySelector('[data-region-container]');
            if(rCont) {
                var reDataDict = {};
                var ignoreCustomKeys = ["增添民俗风情", "相关描述", "新增民俗风情"];
                rCont.querySelectorAll('.area-item').forEach(function(ae) {
                    var rnEl = ae.querySelector('.region-name');
                    if(!rnEl) return;
                    var rn = window.extractMdFromNode(rnEl).trim();
                    if(rn && rn !== "新增地域" && rn !== "新的地域") {
                        var rdescEl = ae.querySelector('.region-desc');
                        var rdesc = rdescEl ? window.extractMdFromNode(rdescEl).trim() : "";
                        var rcustom = {};
                        ae.querySelectorAll('.custom-item, .custom-row').forEach(function(ce) {
                            var ckEl = ce.querySelector('.custom-key') || ce.querySelector('[data-dkey]');
                            var cvEl = ce.querySelector('.custom-val') || ce.querySelector('[data-dval]');
                            if(ckEl && cvEl && !ce.querySelector('[data-skey]')) {
                                var ckt = window.extractMdFromNode(ckEl).trim();
                                var cvt = window.extractMdFromNode(cvEl).trim();
                                if(ckt !== "" && ignoreCustomKeys.indexOf(ckt) === -1) rcustom[ckt] = cvt;
                            }
                        });
                        reDataDict[rn] = { "描述": rdesc, "民俗风情": rcustom };
                    }
                });
                baseFullData.variable["背景信息"] = { "地区": reDataDict };
            }

            var agreeRun = await showCustomConfirm("即将开始剧情");
            if (agreeRun) {
                var storyHeadlines = baseFullData.story.startContent || "";
                triggerSTSlashSend(storyHeadlines, baseFullData.variable);
            }
        });
    });
}

// ===== 页面启动入口 =====
window.addEventListener('DOMContentLoaded', function() {
    initDynamicTabs().then(function() {
        // 对 tab1 ~ tab3 的静态节点做 Markdown 渲染
        ['tab1', 'tab2', 'tab3'].forEach(function(tid) {
            var panelElem = document.getElementById(tid);
            if (panelElem) window.safeRenderMdOnNodes(panelElem);
        });

        populateCharSelectors();
        refreshCharManager();
    });

    // 图片悬浮预览
    var previewContainer = document.createElement('div');
    previewContainer.id = 'global-img-preview';
    var previewImg = document.createElement('img');
    previewContainer.appendChild(previewImg);
    document.body.appendChild(previewContainer);

    document.querySelectorAll('.toc-img-card').forEach(function(card) {
        var frameImg = card.querySelector('.toc-img-frame img');
        card.addEventListener('mousemove', function(e) {
            if (frameImg && frameImg.style.opacity === "1" && frameImg.getAttribute('src')) {
                previewImg.src = frameImg.getAttribute('src');
                previewContainer.classList.add('active');
                var boxW = previewContainer.offsetWidth || 200;
                var boxH = previewContainer.offsetHeight || (boxW * 16 / 9 + 10);
                var left = e.clientX + 20, top = e.clientY + 20;
                if (left + boxW > window.innerWidth) left = e.clientX - boxW - 20;
                if (top + boxH > window.innerHeight) top = e.clientY - boxH - 20;
                previewContainer.style.left = left + 'px';
                previewContainer.style.top = top + 'px';
            }
        });
        card.addEventListener('mouseleave', function() { previewContainer.classList.remove('active'); });
    });
});

// ===== 脉络式时间线系统 =====
var __timelineTabId = '';
var __timelineData = {};
var __timelineAllOpen = false;
var __timelineScrollTimer = null;
var __savedSubPanels = {};

window.switchStoryView = function(tabId, mode, btn) {
    var subPanel = btn.closest('.sub-panel');
    if (!subPanel) return;

    // 同步按钮 active 状态
    var allBtns = btn.parentElement.querySelectorAll('.view-mode-btn');
    allBtns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    if (mode === 'timeline') {
        // 保存原始内容并替换为"点击查看脉络式"
        if (!__savedSubPanels[tabId]) {
            __savedSubPanels[tabId] = subPanel.innerHTML;
        }
        __timelineTabId = tabId;
        __timelineData = originalDataCache[tabId] ? (originalDataCache[tabId].variable['\u5267\u60C5\u7EBF'] || {}) : {};
        subPanel.innerHTML = '<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:30px;">' +
            '<p style="color:var(--color-accent); font-size:0.9rem; margin-bottom:16px;">横屏查看脉络效果更佳</p>' +
            '<button onclick="openTimelineOverlay()" style="background:linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%); color:#1a0f2e; font-family:\'Ma Shan Zheng\',cursive; font-size:1.4rem; border:none; border-radius:8px; padding:14px 40px; cursor:pointer; box-shadow:0 4px 15px rgba(212,175,55,0.4); transition:all 0.3s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'">\u2726 \u70B9\u51FB\u67E5\u770B\u8109\u7EDC \u2726</button>' +
        '</div>';
    } else {
        // 恢复文档流原始内容
        if (__savedSubPanels[tabId]) {
            subPanel.innerHTML = __savedSubPanels[tabId];
            delete __savedSubPanels[tabId];
        }
    }
};

function openTimelineOverlay() {
    __timelineAllOpen = false;
    var overlay = document.getElementById('timeline-overlay');
    document.getElementById('timeline-expand-btn').textContent = '\u26F6 \u5168\u5F00';
    document.getElementById('timeline-init-screen').style.display = '';
    document.getElementById('timeline-canvas').style.display = 'none';
    overlay.classList.add('active');
    renderTimelineNodes();

    // 同步编辑模式开关状态
    var tabEl = document.getElementById(__timelineTabId);
    var tlChk = document.getElementById('timeline-edit-chk');
    if (tabEl && tlChk) {
        tlChk.checked = tabEl.classList.contains('is-edit-mode');
    }

    // 请求浏览器全屏
    var el = overlay;
    if (el.requestFullscreen) {
        el.requestFullscreen().catch(function() {});
    } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
    }
}

window.closeTimeline = function() {
    if (__infoCardsDirty) {
        if (!confirm('卡片中有未保存的修改，确定要退出脉络式吗？')) return;
    }
    __infoCardsDirty = false;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
    document.getElementById('timeline-overlay').classList.remove('active');
};

// 监听 ESC 或系统退出全屏时同步关闭覆盖层
document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        __infoCardsDirty = false;
        document.getElementById('timeline-overlay').classList.remove('active');
    }
});
document.addEventListener('webkitfullscreenchange', function() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        __infoCardsDirty = false;
        document.getElementById('timeline-overlay').classList.remove('active');
    }
});

window.startTimeline = function() {
    document.getElementById('timeline-init-screen').style.display = 'none';
    document.getElementById('timeline-canvas').style.display = '';
    setupTimelineDrag();
    renderTimelineNodes();
};

// 脉络式内的编辑模式开关（与外部同步）
window.toggleTimelineEditMode = function(chkEl) {
    var tabEl = document.getElementById(__timelineTabId);
    if (!tabEl) return;
    var isChecked = chkEl.checked;

    // 找到外部 tab 的编辑开关
    var outerChk = tabEl.querySelector('.edit-switch-container input[type="checkbox"]');
    if (outerChk && outerChk.checked !== isChecked) {
        outerChk.checked = isChecked;
        window.toggleEditMode(outerChk, __timelineTabId);
    } else if (!outerChk) {
        // 外部没有开关时直接操作
        if (isChecked) {
            tabEl.classList.add('is-edit-mode');
            tabEl.querySelectorAll('.editable-field').forEach(function(el) { el.setAttribute('contenteditable', 'true'); });
        } else {
            tabEl.classList.remove('is-edit-mode');
            tabEl.querySelectorAll('.editable-field').forEach(function(el) { el.removeAttribute('contenteditable'); });
        }
    }

    // 如果当前有卡片打开，刷新为编辑模式
    if (__infoCardsStageName && __timelineData[__infoCardsStageName]) {
        var cards = document.querySelectorAll('.timeline-info-card');
        var anyVisible = false;
        cards.forEach(function(c) { if (c.style.display === 'block') anyVisible = true; });
        if (anyVisible) {
            window.showTimelinePopup(__infoCardsStageName, __timelineData[__infoCardsStageName]);
        }
    }
};

// ===== 桌面端鼠标拖拽滚动 =====
var __timelineDragging = false;
var __timelineStartX = 0;
var __timelineScrollLeft = 0;

function setupTimelineDrag() {
    var canvas = document.getElementById('timeline-canvas');
    if (!canvas || canvas.dataset.dragReady) return;
    canvas.dataset.dragReady = '1';

    canvas.addEventListener('mousedown', function(e) {
        __timelineDragging = true;
        __timelineStartX = e.pageX - canvas.offsetLeft;
        __timelineScrollLeft = canvas.scrollLeft;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', function(e) {
        if (!__timelineDragging) return;
        var canvas = document.getElementById('timeline-canvas');
        var x = e.pageX - canvas.offsetLeft;
        var walk = (x - __timelineStartX) * 1.5;
        canvas.scrollLeft = __timelineScrollLeft - walk;
    });

    window.addEventListener('mouseup', function() {
        if (__timelineDragging) {
            __timelineDragging = false;
            var canvas = document.getElementById('timeline-canvas');
            if (canvas) canvas.style.cursor = 'grab';
            updateNodeVisibility();
        }
    });

    canvas.addEventListener('scroll', function() {
        if (!__timelineDragging) {
            if (__timelineScrollTimer) clearTimeout(__timelineScrollTimer);
            __timelineScrollTimer = setTimeout(updateNodeVisibility, 80);
        }
    });

    // 点击画布空白区域关闭卡片
    canvas.addEventListener('click', function(e) {
        if (e.target === canvas || e.target.classList.contains('timeline-nodes')) {
            closeInfoCards();
        }
    });
}

function renderTimelineNodes() {
    var container = document.getElementById('timeline-nodes');
    container.innerHTML = '';
    var keys = Object.keys(__timelineData);
    if (keys.length === 0) {
        container.innerHTML = '<div style="color:var(--color-text-light); padding:40px; font-size:1.2rem;">暂无剧情阶段数据</div>';
        return;
    }

    keys.forEach(function(key) {
        var node = document.createElement('div');
        node.className = 'timeline-node';
        node.textContent = key;
        node.addEventListener('click', function() {
            showTimelinePopup(key, __timelineData[key]);
        });
        container.appendChild(node);
    });

    updateNodeVisibility();
}

function updateNodeVisibility() {
    if (__timelineAllOpen) return;
    var canvas = document.getElementById('timeline-canvas');
    if (canvas.style.display === 'none') return;
    var nodes = document.querySelectorAll('.timeline-node');
    var canvasRect = canvas.getBoundingClientRect();
    var centerX = canvasRect.left + canvasRect.width / 2;

    nodes.forEach(function(node) {
        var rect = node.getBoundingClientRect();
        var nodeCenterX = rect.left + rect.width / 2;
        var distance = Math.abs(nodeCenterX - centerX);
        var threshold = canvasRect.width * 0.35;
        if (distance > threshold) {
            node.classList.add('shrunk');
            node.classList.remove('expand-all');
        } else {
            node.classList.remove('shrunk');
            node.classList.add('expand-all');
        }
    });
}

window.toggleTimelineExpand = function() {
    __timelineAllOpen = !__timelineAllOpen;
    var btn = document.getElementById('timeline-expand-btn');
    var nodes = document.querySelectorAll('.timeline-node');
    if (__timelineAllOpen) {
        btn.textContent = '\u26F6 \u6536\u8D77';
        nodes.forEach(function(n) { n.classList.remove('shrunk'); n.classList.add('expand-all'); });
    } else {
        btn.textContent = '\u26F6 \u5168\u5F00';
        nodes.forEach(function(n) { n.classList.remove('expand-all'); });
        updateNodeVisibility();
    }
};

var __infoCardsDirty = false;
var __infoCardsStageName = '';

window.showTimelinePopup = function(stageName, stageData) {
    var desc = (stageData && stageData['\u63CF\u8FF0']) ? stageData['\u63CF\u8FF0'] : '\u65E0';
    var cond = (stageData && stageData['\u89E6\u53D1\u6761\u4EF6']) ? stageData['\u89E6\u53D1\u6761\u4EF6'] : '\u65E0';
    var guide = (stageData && stageData['\u9636\u6BB5\u6307\u5BFC']) ? stageData['\u9636\u6BB5\u6307\u5BFC'] : '\u65E0';

    var tabEl = document.getElementById(__timelineTabId);
    var isEdit = tabEl && tabEl.classList.contains('is-edit-mode');
    __infoCardsStageName = stageName;
    __infoCardsDirty = false;

    var cardDesc  = document.getElementById('info-card-desc');
    var cardCond  = document.getElementById('info-card-cond');
    var cardGuide = document.getElementById('info-card-guide');
    var allCards = [cardDesc, cardCond, cardGuide];

    if (isEdit) {
        cardDesc.querySelector('.timeline-info-card-body').innerHTML = '<div class="editable-field timeline-info-card-body" contenteditable="true" data-field="desc" oninput="__infoCardsDirty=true" style="border:1px solid rgba(184,134,11,0.3);border-radius:3px;padding:2px 6px;min-height:2em;">' + desc + '</div>';
        cardCond.querySelector('.timeline-info-card-body').innerHTML = '<div class="editable-field timeline-info-card-body" contenteditable="true" data-field="cond" oninput="__infoCardsDirty=true" style="border:1px solid rgba(184,134,11,0.3);border-radius:3px;padding:2px 6px;min-height:2em;">' + cond + '</div>';
        cardGuide.querySelector('.timeline-info-card-body').innerHTML = '<div class="editable-field timeline-info-card-body" contenteditable="true" data-field="guide" oninput="__infoCardsDirty=true" style="border:1px solid rgba(184,134,11,0.3);border-radius:3px;padding:2px 6px;min-height:2em;">' + guide + '</div>';
    } else {
        cardDesc.querySelector('.timeline-info-card-body').textContent = desc;
        cardCond.querySelector('.timeline-info-card-body').textContent = cond;
        cardGuide.querySelector('.timeline-info-card-body').textContent = guide;
    }

    var nodes = document.querySelectorAll('.timeline-node');
    var targetNode = null;
    nodes.forEach(function(n) {
        if (n.textContent.indexOf(stageName) !== -1) targetNode = n;
    });
    if (!targetNode) return;

    var canvas = document.getElementById('timeline-canvas');
    var nodeRect = targetNode.getBoundingClientRect();
    var canvasRect = canvas.getBoundingClientRect();
    var scrollLeft = canvas.scrollLeft;

    var nodeX = nodeRect.left - canvasRect.left + scrollLeft;
    var nodeY = nodeRect.top - canvasRect.top;
    var nodeW = nodeRect.width;
    var nodeH = nodeRect.height;

    var cardW = 210;
    var cardH = 130;
    var gap = 16;
    var margin = 20;
    var totalW = cardW * 3 + gap * 2;
    var startX = nodeX + nodeW / 2 - totalW / 2;

    var cardTop = nodeY - cardH - margin;
    var placeBelow = (cardTop < 10);
    if (placeBelow) {
        cardTop = nodeY + nodeH + margin;
    }

    var positions = [
        { el: cardDesc,  left: startX },
        { el: cardCond,  left: startX + cardW + gap },
        { el: cardGuide, left: startX + (cardW + gap) * 2 }
    ];

    allCards.forEach(function(c) {
        c.classList.remove('show');
    });

    positions.forEach(function(pos) {
        var card = pos.el;
        card.style.left = pos.left + 'px';
        card.style.top = cardTop + 'px';
        card.style.width = cardW + 'px';
        card.style.display = 'block';

        // 阻止卡片上的拖拽事件冒泡到画布
        card.onmousedown = function(e) { e.stopPropagation(); };
    });

    var minX = 10;
    var maxX = canvas.scrollWidth - totalW - 10;
    if (startX < minX) {
        var shift = minX - startX;
        positions.forEach(function(p) { p.el.style.left = (parseFloat(p.el.style.left) + shift) + 'px'; });
    } else if (startX > maxX) {
        var shift = startX - maxX;
        positions.forEach(function(p) { p.el.style.left = (parseFloat(p.el.style.left) - shift) + 'px'; });
    }

    void cardDesc.offsetHeight;
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            allCards.forEach(function(c) { c.classList.add('show'); });
        });
    });

    var saveBar = document.getElementById('timeline-info-savebar');
    if (!saveBar) {
        saveBar = document.createElement('div');
        saveBar.id = 'timeline-info-savebar';
        saveBar.className = 'timeline-info-savebar';
        saveBar.innerHTML = '<button onclick="saveInfoCardEdit(\'' + stageName + '\')">\u2727 \u4FDD\u5B58</button>';
        canvas.appendChild(saveBar);
    } else {
        saveBar.querySelector('button').setAttribute('onclick', 'saveInfoCardEdit(\'' + stageName + '\')');
    }

    if (isEdit) {
        saveBar.classList.add('show');
        saveBar.style.left = (startX + totalW - 70) + 'px';
        saveBar.style.top = (placeBelow ? cardTop + cardH + 8 : cardTop - 36) + 'px';
        saveBar.onmousedown = function(e) { e.stopPropagation(); };
    } else {
        saveBar.classList.remove('show');
    }
};

window.closeInfoCards = function() {
    if (__infoCardsDirty) {
        if (!confirm('你有未保存的修改，确定要关闭吗？')) return;
    }
    __infoCardsDirty = false;
    var cards = document.querySelectorAll('.timeline-info-card');
    cards.forEach(function(c) {
        c.classList.remove('show');
        c.style.display = 'none';
    });
    var saveBar = document.getElementById('timeline-info-savebar');
    if (saveBar) saveBar.classList.remove('show');
};

window.saveInfoCardEdit = function(stageName) {
    var tabEl = document.getElementById(__timelineTabId);
    if (!tabEl) return;

    var descEl  = document.querySelector('#info-card-desc [data-field="desc"]');
    var condEl  = document.querySelector('#info-card-cond [data-field="cond"]');
    var guideEl = document.querySelector('#info-card-guide [data-field="guide"]');

    var newDesc  = descEl  ? (descEl.innerText || descEl.textContent || '').trim() : '';
    var newCond  = condEl  ? (condEl.innerText || condEl.textContent || '').trim() : '';
    var newGuide = guideEl ? (guideEl.innerText || guideEl.textContent || '').trim() : '';

    if (originalDataCache[__timelineTabId] && originalDataCache[__timelineTabId].variable['\u5267\u60C5\u7EBF']) {
        originalDataCache[__timelineTabId].variable['\u5267\u60C5\u7EBF'][stageName] = {
            '\u63CF\u8FF0': newDesc,
            '\u89E6\u53D1\u6761\u4EF6': newCond,
            '\u9636\u6BB5\u6307\u5BFC': newGuide
        };
    }

    var dictUl = tabEl.querySelector('ul[data-complex-dict]');
    if (dictUl) {
        var stageItems = dictUl.querySelectorAll('li[data-citem]');
        stageItems.forEach(function(item) {
            var ckey = item.querySelector('[data-ckey]');
            if (ckey && ckey.textContent.trim() === stageName) {
                var rows = item.querySelectorAll('.custom-row');
                rows.forEach(function(row) {
                    var skey = row.querySelector('[data-skey]');
                    var sval = row.querySelector('[data-sval]');
                    if (skey && sval) {
                        var kt = skey.textContent.trim();
                        if (kt === '\u63CF\u8FF0') sval.innerHTML = mtH(newDesc);
                        else if (kt === '\u89E6\u53D1\u6761\u4EF6') sval.innerHTML = mtH(newCond);
                        else if (kt === '\u9636\u6BB5\u6307\u5BFC') sval.innerHTML = mtH(newGuide);
                    }
                });
            }
        });
    }

    __infoCardsDirty = false;
    closeInfoCards();
};
