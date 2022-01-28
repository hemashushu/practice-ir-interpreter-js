import { IdentifierError } from './identifiererror.js';
import { SyntaxError } from './syntexerror.js';

/**
 * 虚拟的 Chunk 和 Context
 */
class Closure /* implement IChunk, IContext */ {
    constructor(ref, mark, names, values, anonymousFunc, namespace) {
        this.ref = ref;
        this.type = 4;
        this.mark = mark;
        this.size = (names.length) * 8;

        this.names = names;
        this.values = values;

        this.destructor = undefined;

        this.anonymousFunc = anonymousFunc;

        // closure 的上层 context 应该是 Namespace，因为已经把
        // 它所在的环境的标识符已经复制一份，没必要继承 Scope。
        this.parentContext = namespace;
    }

    static create(primitiveNames, primitiveValues, refNames, refValues,
        anonymousFunc, namespace) {

        let mark = math.pow(2, refNames.length) - 1;
        let names = refNames.concat(primitiveNames); // 先对象类型，后基本类型
        let values = refValues.concat(primitiveValues);
        return new Closure(0, mark, names, values, anonymousFunc, namespace);
    }

    /*i32*/ i32Read(/*int32*/ byteOffset) {
        return this.values[byteOffset / 8];
    }

    /*i64*/ i64Read(/*int32*/ byteOffset) {
        return this.i32Read(addr, byteOffset);
    }

    /*int*/ readAddress(/*int32*/ byteOffset) {
        return this.values[byteOffset / 8];
    }

    defineIdentifier(name, value) {
        // 变量只可以在 scope 里定义
        throw new SyntaxError(
            'INVALID_LET_EXPRESSION',
            {},
            'Let expressions can only be defined in scopes');
    }

    exist(name) {
        return this.names.includes(name) ||
            this.parentContext.exist(name);
    }

    getIdentifier(name) {
        let idx = names.indexOf(name);
        if (idx === -1) {
            return this.parentContext.getIdentifier(name);

        } else {
            return values[idx];
        }
    }
}

export { Closure };