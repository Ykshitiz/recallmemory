"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = random;
function random(len) {
    let options = "aoeifjpapualuauk59adfae";
    let length = options.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * length)];
    }
    return ans;
}
