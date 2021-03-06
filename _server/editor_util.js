
    export const createGuid = function () {
        return 'id_' + 'xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    export const HTMLescape = function (str_) {
        return String(str_).split('').map(function (v) {
            return '&#' + v.charCodeAt(0) + ';'
        }).join('');
    }

    // rgbToHsl hue2rgb hslToRgb from https://github.com/carloscabo/colz.git
    //--------------------------------------------
    // The MIT License (MIT)
    //
    // Copyright (c) 2014 Carlos Cabo
    //
    // Permission is hereby granted, free of charge, to any person obtaining a copy
    // of this software and associated documentation files (the "Software"), to deal
    // in the Software without restriction, including without limitation the rights
    // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    // copies of the Software, and to permit persons to whom the Software is
    // furnished to do so, subject to the following conditions:
    //
    // The above copyright notice and this permission notice shall be included in all
    // copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    // SOFTWARE.
    //--------------------------------------------
    // https://github.com/carloscabo/colz/blob/master/public/js/colz.class.js
    var round = Math.round;
    export const rgbToHsl = function (rgba) {
        var arg, r, g, b, h, s, l, d, max, min;

        arg = rgba;

        if (typeof arg[0] === 'number') {
            r = arg[0];
            g = arg[1];
            b = arg[2];
        } else {
            r = arg[0][0];
            g = arg[0][1];
            b = arg[0][2];
        }

        r /= 255;
        g /= 255;
        b /= 255;

        max = Math.max(r, g, b);
        min = Math.min(r, g, b);
        l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        //CARLOS
        h = round(h * 360);
        s = round(s * 100);
        l = round(l * 100);

        return [h, s, l];
    }
    //
    export const hue2rgb = function (p, q, t) {
        if (t < 0) { t += 1; }
        if (t > 1) { t -= 1; }
        if (t < 1 / 6) { return p + (q - p) * 6 * t; }
        if (t < 1 / 2) { return q; }
        if (t < 2 / 3) { return p + (q - p) * (2 / 3 - t) * 6; }
        return p;
    }
    export const hslToRgb = function (hsl) {
        var arg, r, g, b, h, s, l, q, p;

        arg = hsl;

        if (typeof arg[0] === 'number') {
            h = arg[0] / 360;
            s = arg[1] / 100;
            l = arg[2] / 100;
        } else {
            h = arg[0][0] / 360;
            s = arg[0][1] / 100;
            l = arg[0][2] / 100;
        }

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {

            q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [round(r * 255), round(g * 255), round(b * 255)];
    }

    export const encode64 = function (str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode(parseInt(p1, 16))
        }))
    }

    export const decode64 = function (str) {
        return decodeURIComponent(atob(str.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
    }

    /** 判断某对象是否不为null也不为NaN */
    export const isset = function (val) {
        return val != null && !(typeof val == 'number' && isNaN(val));
    }

    export const exec = function (func, ...args) {
        if (func instanceof Function) return func(...args);
    }

    
    /** 深拷贝一个对象 */
    export const clone = function (data) {
        if (!isset(data)) return null;
        // date
        if (data instanceof Date) {
            return new Date(data);
        }
        // array
        if (Array.isArray(data)) {
            const copy = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                copy[i] = clone(data[i]);
            }
            return copy;
        }
        // 函数
        if (data instanceof Function) {
            return data;
        }
        // object
        if (data instanceof Object) {
            let copy = {};
            for (let i in data) {
                if (data.hasOwnProperty(i))
                    copy[i] = clone(data[i]);
            }
            return copy;
        }
        return data;
    }

    /**
     * 检查字符串数组中是否有重复字符串
     * @param {Array<String>} thiseval 
     */
    export const checkUnique = function (thiseval) {
        if (!(thiseval instanceof Array)) return false;
        const map = {};
        for (var i = 0; i < thiseval.length; ++i) {
            if (map[thiseval[i]]) {
                return false;
            }
            map[thiseval[i]] = true;
        }
        return true;
    }

    export const keyCodeDict = {
        "backspace": 8,
        "tab": 9,
        "enter": 13,
        "shift": 16,
        "ctrl": 17,
        "alt": 18,
        "esc": 27,
        "spcae": 32,
        "pageup": 33,
        "pagedown": 34,
        "left": 37,
        "up": 38,
        "right": 39,
        "down": 40,
        "delete": 46,
    }

    /** 翻译键盘码 */
    export const translateKeyCode = function(keyCode) {
        if (keyCodeDict[keyCode]) return keyCodeDict[keyCode];
        if (keyCode.length > 1) {
            if (keyCode[0] == 'f')  { // 功能键
                const fcode = keyCode.charCodeAt(1) - 48;
                if (fcode >= 1 && fcode <= 12) return 111 + fcode;
            }
            else if (keyCode[0] == 'k')  { // 键盘码, 为与数字区分前面需要加k
                return parseInt(keyCode.slice(1));
            }
        } else {
            const charcode = keyCode.charCodeAt(0);
            if (charcode >= 48 && charcode <= 57) return charcode; // 数字
            if (charcode >= 97 && charcode <= 122) return charcode-32; // 字母
        }
        throw new Error(keyCode+"不是合法的键盘码");
    }

    /** 向一个对象的所有键值对混入一个对象 */
    export const batchMixin = function(obj, m) {
        const newObj = {};
        for (let e in obj) {
            newObj[e] = Object.assign({}, m, obj[e]);
        }
        return newObj;
    }

    export class Pos {
        constructor(x, y) {
            if (typeof x == 'string') {
                x = x.split(y);
                this.x = x[0], this.y = x[1];
            }
            else if (x instanceof Pos) this.x = x.x, this.y = x.y;
            else this.x = x || 0, this.y = y || 0;
        }

        /**
         * 将坐标转为网格坐标
         * @param {Number} xsize 网格宽度 
         * @param {Number} [ysize] 网格高度, 若不填则视为与宽度相同
         * @returns {Pos}
         */
        gridding(xsize, ysize = xsize) {
            return new Pos(parseInt(this.x/xsize), parseInt(this.y/ysize));
        }

        set(x, y) {
            if (x instanceof Pos) y = x.y, x = x.x;
            this.x = x, this.y = y;
        }

        add(x, y) {
            if (!isset(y)) y = x;
            return new Pos(this.x + x, this.y + y);
        }

        mutli(x, y = x) {
            return new Pos(this.x * x, this.y * y);
        }

        /**
         *
         * @param {String} separator
         * @returns {String}
         */
        format(separator) {
            return this.x + separator + this.y;
        }

        copy() {
            return new Pos(this.x, this.y);
        }

        /** @param {Pos} p */
        equal(p) {
            return this.x === p.x && this.y === p.y;
        }

        in(x, y, w, h) {
            return this.x >= x && this.x <= x+w 
                && this.y >= y && this.y <= y+h;
        }
    }

    export class CommandStack {
    
        stack = []
        pointer = -1
        commands = {};
    
        /**
         * 命令栈
         * @param {Number} size 命令栈的大小, 默认为20 
         */
        constructor(size = 20) {
            this.size = size;
        }
    
        /**
         * 注册命令
         * @param {String} type 类型 
         * @param {Function} redo 
         * @param {Function} undo 
         */
        register(type, redo, undo) {
            this.commands[type] = { redo, undo }
        }
    
        push(type, data) {
            if (this.pointer < this.stack.length-1) {
                this.stack.splice(this.pointer+1);
                this.pointer = this.stack.length;
            } else if (this.stack.length >= this.size) this.stack.shift();
            else this.pointer++;
            data = this.commands[type].redo(data, true);
            this.stack.push({ type, data });
        }
    
        hasBack() { return this.pointer >= 0; }
    
        undo() {
            if (!~this.pointer) return false;
            const command = this.stack[this.pointer--];
            this.commands[command.type].undo(command.data);
            return true;
        }
    
        hasNext() { return this.pointer < this.stack.length-1; }
    
        redo() {
            if (this.pointer >= this.stack.length-1) return false;
            const command = this.stack[++this.pointer];
            this.commands[command.type].redo(command.data);
            return true;
        }
    
        clear() {
            this.stack = [], this.pointer = -1;
        }
    }

    export const mountJs = function(text) {
        let script = document.createElement('script');
        script.innerHTML = text;
        document.body.appendChild(script);
    }

    /**
     * 
     * @param {Object} data 
     * @param {String} route 
     */
    export const accessField = function(data, route) {
        if (route.startsWith("[")) {
            route = route.slice(1, -1).split("][");
        } else route = route.split(".");
        for (let n of route) {
            data = data[n];
        }
        return data;
    }
