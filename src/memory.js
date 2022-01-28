import { EvalError } from './evalerror.js';
import { Chunk } from './chunk.js';
import { Closure } from './closure.js';

/**
 * 模拟 GC
 */
class Memory {

    constructor(requestInvokeFunc) {
        // 使用 Chunk 数组模拟内存
        this.chunks = [];

        // 请求 Evaluator 执行析构函数，传入 fn(destructor, chunkAddr)
        // `destructor` 本应该是析构函数的地址，但在模拟 GC 这里传入
        // 析构函数的标识符全称，比如 `user.Stream.drop`
        this.requestInvokeFunc = requestInvokeFunc;
    }

    /**
     * 获取 "内存" 使用情况
     * @returns
     */
    status() {
        let capacity = this.chunks.length;
        let free = 0;
        for (let chunk of this.chunks) {
            if (chunk === null) {
                free++;
            }
        }
        let used = capacity - free;

        return {
            capacity,
            free,
            used
        };
    }

    getChunk(addr) {
        return this.chunks[addr];
    }

    addChuck(chunk) {
        let pos;
        for (let idx = 0; idx < this.chunks.length; idx++) {
            if (this.chunks[idx] === null) {
                pos = idx;
                break;
            }
        }

        if (pos === undefined) {
            this.chunks.push(chunk);
            return this.chunks.length - 1;

        } else {
            this.chunks[pos] = chunk;
            return pos;
        }
    }

    /*int*/createBytes(/*int*/ bytesLength) {
        let chunk = Chunk.createBytes(bytesLength);
        return this.addChuck(chunk);
    }

    /*int*/ createStruct(/*int32*/ bytes_length, mark) {
        let chunk = Chunk.createStruct(bytes_length, mark);
        return this.addChuck(chunk);
    }

    /*int*/ createStructDestructor(/*int32*/ bytes_length, mark, destructor) {
        // !! 目前的解析器使用 Map 以及标识符的全称作为 key 来装载用户自定义函数，
        // !! 无法函数的地址，所以在 Chunk 的 destructor 字段里
        // !! 存放的是析构函数的标识符全称，比如 `user.Stream.drop`。
        let chunk = Chunk.createStructDestructor(bytes_length, mark, destructor);
        return this.addChuck(chunk);
    }

    createClosure(primitiveNames, primitiveValues, refNames, refValues,
        anonymousFunc, namespace) {

        for(let refAddr of refValues) {
            this.incRef(refAddr);
        }

        let chunk = Closure.create(primitiveNames, primitiveValues,
            refNames, refValues,
            anonymousFunc, namespace);

        return this.addChuck(chunk);
    }

    /*int32*/ incRef(/*int*/ addr) {
        let chunk = this.chunks[addr];
        let ref = chunk.ref + 1;
        chunk.ref = ref; // update
        return ref;
    }

    /*int32*/ decRef(/*int*/ addr) {
        let chunk = this.chunks[addr];
        let ref = chunk.ref - 1;

        if (ref === 0) {
            // type 1 和 type 4 都需要减少子对象的引用计数值
            if ((chunk.type & 5) > 0) {

                // 第 8 位 （即 2^7） 为 1 时，表示带有析构函数
                if ((chunk.type & 128) === 128) {
                    let func = chunk.destructor;
                    this.requestInvokeFunc(func, addr);
                }

                // 减少所有子对象的引用计数值
                let mark = chunk.mark;
                let count = chunk.size / 8;
                for (let idx = 0; idx < count; idx++) {
                    if ((mark & 1) === 1) {
                        let targetAddr = chunk.readAddress(idx * 8);
                        this.decRef(targetAddr);
                    }

                    // 逻辑右移 1 位
                    mark = mark >>> 1;
                }
            }

            // 回收资源
            this.chunks[addr] = null;

            // 返回新的 ref 值
            return 0;

        } else {
            // update
            chunk.ref = ref;

            // 返回新的 ref 值
            return ref;
        }
    }

    /*int32*/ addRef(/*int*/ addr, /*int32*/ byteOffset, /*int*/ refAddr) {

        let chunk = this.chunks[addr];

        // javascript lacks int64, so temporarily use int32 instead
        var view = new DataView(chunk.data);
        view.setUint32(byteOffset, refAddr);

        return this.incRef(refAddr);
    }
}

export { Memory };