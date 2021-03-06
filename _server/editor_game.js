/**
 * @module game
 * editor_game.js 游戏运行时的类
 * 原则上其他部分获取游戏信息均需要通过此处, 若玩家自行修改游戏, 对应获取信息的更改也均在此处调整
 */

import { ftools, JsFile, Config } from "./editor_file.js";
import { createGuid } from "./editor_util.js";

import * as map from "./game/map.js";
import * as data from "./game/data.js";
import * as plugin from "./game/plugin.js";
import * as resource from "./game/resource.js";

export default new class gameRuntime {

    /** 原始游戏数据 */ oriData = {};
    /** @type {Object<JsFile>} 包装的游戏数据类 */ gameData = {};

    /** @type {Object<Promise>} 生命周期钩子 */ hooks = {};
    /** @type {Object<Function>} 生命周期钩子的resolve */ __resolves__ = {}

    maps = {};

    scenes = {};

    map = map;
    data = data;
    plugin = plugin;
    resource = resource;

    used_flags = {};

    /////// 初始化方法 ////////

    constructor() {
        this.iframe = document.createElement("iframe");
        this.iframe.style.display = "none";
        document.body.appendChild(this.iframe);
        this.runtime = this.iframe.contentWindow;
        this.document = this.iframe.contentDocument;
        const res = this.createHooks([
            'iframeLoad', 'dataLoad', 'libLoad', 'floorsLoad', 'imagesLoad', 'initOver'
        ]);
        this.iframe.onload = res.iframeLoad;
        this.iframe.src = "./editor_runtime.html";

        // 设置钩子对应事件
        this.hooks.dataLoad.then(() => {
            this.wrapData();
            ["map", "data", "plugin", "resource"].forEach(e => this[e].init(e));
        })

        this.hooks.libLoad.then(() => {
            this.fixLoadImage();
        })

        this.hooks.floorsLoad.then(() => {
            this.wrapMaps();
        });

        this.hooks.imagesLoad.then(() => {
            this.fixCreateCleanCanvas();
        })

        this.hooks.initOver.then(() => {
            const core = this.core;
            core.resetGame(core.firstData.hero, null, core.firstData.floorId, core.clone(core.initStatus.maps));
        });
    }

    async load() {
        await this.hooks.iframeLoad;
        const res = this.__resolves__;
        this.runtime._editor__setHooks__(res);
        this.main = this.runtime.main;
        this.main.init('editor', () => {
            this.core = this.runtime.core;
            res.initOver();
        });
        await this.hooks.floorsLoad;
    }

    createHooks(hooks) {
        const resolves = this.__resolves__;
        for (let h of hooks) {
            this.hooks[h] = new Promise((res, rej) => {
                resolves[h] = () => { console.log("======"+h+"======");res(); };
            });
        }
        return resolves;
    }

    wrapData() {
        /**@todo 将formatter移动到editor_file, 并配置化 */
        const normalFormat = function(data) {
            return JSON.stringify(data, ftools.replacerForSaving, '\t');
        }
        const listFormat = function(data) {
            // 只用\t展开第一层
            const emap = {};
            let estr = JSON.stringify(data, function (_k, v) {
                if (v.id != null) {
                    const id_ = createGuid();
                    emap[id_] = JSON.stringify(v, ftools.replacerForSaving);
                    return id_;
                } else return v
            }, '\t');
            for (let id_ in emap) {
                estr = estr.replace('"' + id_ + '"', emap[id_]);
            }
            return estr;
        }
        const pureData = editor.gameInfo.get("pureData", {});
        for (let n in pureData) {
            const name = pureData[n];
            this.oriData[n] = this.runtime[name];
            this.gameData[n] = new JsFile(`./project/${n}.js`, this.runtime[name], `var ${name} = \n`, {
                stringifier: ['maps', 'enemys'].some(e => e === n) ? listFormat : normalFormat,
            });
        }
    }

    wrapMaps() {
        let maps = this.main.floors;
        const defaultMap = editor.gameInfo.get("defaultMap", {});
        for (let m in maps) {
            this.maps[m] = new map.MapFile(m, Object.assign({}, defaultMap, maps[m]));
        }
    }

    fixLoadImage() {
        this.runtime.loader.prototype.loadImage = function(dir, imgName, callback) {
            try {
                var name = imgName;
                if (name.indexOf(".") < 0)
                    name = name + ".png";
                var image = new Image();
                image.onload = function () {
                    callback(imgName, image);
                }
                image.src = 'project/'+ dir + '/' + name + "?v=" + this.main.version;
            }
            catch (e) {
                console.error(e);
            }
        }.bind(this);
    }

    fixCreateCleanCanvas() {
        this.runtime.core.scenes.createCleanCanvas = function (name, x, y, width, height, z) {
            var newCanvas = document.createElement("canvas");
            var scale = this.runtime.core.domStyle.scale;
            newCanvas.id = name;
            newCanvas.style.display = 'block';
            newCanvas.width = width;
            newCanvas.height = height;
            newCanvas.setAttribute("_left", x);
            newCanvas.setAttribute("_top", y);
            newCanvas.style.width = width * scale + 'px';
            newCanvas.style.height = height * scale + 'px';
            newCanvas.style.left = x * scale + 'px';
            newCanvas.style.top = y * scale + 'px';
            newCanvas.style.zIndex = z;
            newCanvas.style.position = 'absolute';
            return newCanvas;
        }.bind(this);
    }

    async fetchScene(name) {
        await this.hooks.initOver;
        return this.scenes[name];
    }

    apply(funcname, ...rest) {
        funcname = funcname.split(".");
        const func = this.core[funcname[0]];
        if (funcname.length == 2) {
            return func[funcname[1]].apply(func, rest);
        } else return func.apply(this.core, rest);
    }

    //////// 获取游戏信息的方法 ////////

    /** 
     * 获取游戏地图
     */
    getMaps() {
        return this.maps;
    }

    /** 获取当前地图 */
    fetchMap() {
        var mapArray = core.maps.saveMap(core.status.floorId);
        editor.map = mapArray.map(function (v) {
            return v.map(function (v) {
                var x = parseInt(v), y = editor.indexs[x];
                if (y == null) {
                    printe("素材数字" + x + "未定义。是不是忘了注册，或者接档时没有覆盖icons.js和maps.js？");
                    y = [0];
                }
                return editor.ids[y[0]]
            })
        });
        editor.currentFloorId = core.status.floorId;
        editor.currentFloorData = core.floors[core.status.floorId];
        // 补出缺省的数据
        editor.currentFloorData.autoEvent = editor.currentFloorData.autoEvent || {};
        //
        for (var ii = 0, name; name = ['bgmap', 'fgmap'][ii]; ii++) {
            var mapArray = editor.currentFloorData[name];
            if (!mapArray || JSON.stringify(mapArray) == JSON.stringify([])) {//未设置或空数组
                //与editor.map同形的全0
                mapArray = eval('[' + Array(editor.map.length + 1).join('[' + Array(editor.map[0].length + 1).join('0,') + '],') + ']');
            }
            editor[name] = mapArray.map(function (v) {
                return v.map(function (v) {
                    var x = parseInt(v), y = editor.indexs[x];
                    if (y == null) {
                        printe("素材数字" + x + "未定义。是不是忘了注册，或者接档时没有覆盖icons.js和maps.js？");
                        y = [0];
                    }
                    return editor.ids[y[0]]
                })
            });
        }
    }

    idsInit(maps, icons) {
        editor.ids = [0];
        editor.indexs = [];
        var MAX_NUM = 0;
        var keys = Object.keys(maps_90f36752_8815_4be8_b32b_d7fad1d0542e);
        for (var ii = 0; ii < keys.length; ii++) {
            var v = ~~keys[ii];
            if (v > MAX_NUM && v < core.icons.tilesetStartOffset) MAX_NUM = v;
        }
        editor.MAX_NUM = MAX_NUM;
        var getInfoById = function (id) {
            var block = maps.initBlock(0, 0, id);
            if (Object.prototype.hasOwnProperty.call(block, 'event')) {
                return block;
            }
        }
        var point = 0;
        for (var i = 0; i <= MAX_NUM; i++) {
            var indexBlock = getInfoById(i);
            editor.indexs[i] = [];
            if (indexBlock) {
                var id = indexBlock.event.id;
                var indexId = indexBlock.id;
                var allCls = Object.keys(icons);
                if (i == 17) {
                    editor.ids.push({ 'idnum': 17, 'id': id, 'images': 'terrains' });
                    point++;
                    editor.indexs[i].push(point);
                    continue;
                }
                for (var j = 0; j < allCls.length; j++) {
                    if (id in icons[allCls[j]]) {
                        editor.ids.push({ 'idnum': indexId, 'id': id, 'images': allCls[j], 'y': icons[allCls[j]][id] });
                        point++;
                        editor.indexs[i].push(point);
                    }
                }
            }
        }
        editor.indexs[0] = [0];

        var startOffset = core.icons.tilesetStartOffset;
        for (var i in core.tilesets) {
            var imgName = core.tilesets[i];
            var img = core.material.images.tilesets[imgName];
            var width = Math.floor(img.width / 32), height = Math.floor(img.height / 32);
            if (img.width % 32 || img.height % 32) {
                // alert(imgName + '的长或宽不是32的整数倍, 请修改后刷新页面');
                console.warn(imgName + '的长或宽不是32的整数倍, 请修改后刷新页面');
            }
            if (img.width * img.height > 32 * 32 * 3000) {
                // alert(imgName + '上的图块数量超过了3000，请修改后刷新页面');
                console.warn(imgName + '上的图块数量超过了3000，请修改后刷新页面');
            }
            for (var id = startOffset; id < startOffset + width * height; id++) {
                var x = (id - startOffset) % width, y = parseInt((id - startOffset) / width);
                var indexBlock = getInfoById(id);
                editor.ids.push({ 'idnum': id, 'id': indexBlock.event.id, 'images': imgName, "x": x, "y": y, isTile: true });
                point++;
                editor.indexs[id] = [point];
            }
            startOffset += core.icons.tilesetStartOffset;
        }
    }

    updateAutotiles() {

    }

    registerBlock() {

    }
}
