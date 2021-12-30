import { SyntaxError } from './syntexerror.js';
import { IdentifierError } from './identifiererror.js';

/**
 * 一个虚拟的 Context
 */
class Namespace /* implement IContext */ {
    constructor(global, moduleName, fullPath) {
        this.global = global;
        this.moduleName = moduleName;
        this.fullPath = fullPath;
    }

    defineIdentifier(name, value) {
        // 变量只可以在 scope 里定义
        throw new SyntaxError(
            'INVALID_LET_EXPRESSION',
            {},
            'Let expressions can only be defined in scopes');
    }

    exist(name) {
        let fullName = this.fullPath + '.' + name;
        return this.global.exist(fullName);
    }

    getIdentifier(name) {
        let fullName = this.fullPath + '.' + name;
        return this.global.getIdentifier(fullName);
    }
}

export { Namespace };