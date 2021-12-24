import { EvalError } from './evalerror.js';
import { Chunk } from './chunk.js';

class Memory {

    constructor() {
        this.chunks = [];
    }

    /**
     * 重新利用一个已释放的空间，或者分配一个新的空间
     *
     * @param {*} chunk
     * @returns
     */
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

    // 分配一个结构体内存空间，其中 count 为成员个数
    /*int*/ create_struct(/*int32*/ count) {
        let chunk = Chunk.createStruct(count);
        return this.addChuck(chunk);
    }

    /*int*/create_bytes(/*int*/ bytes_length) {
        let chunk = Chunk.createBytes(bytes_length);
        return this.addChuck(chunk);
    }

    // 分配一个字节数组，初始化为 0 ，然后返回该结构体（bytes 类型）的地址 int
    /*int*/create_bytes_zero(/*int*/  bytes_length) {
        let chunk = this.create_bytes(bytes_length);
        return this.addChuck(chunk);
    }

    // 返回更新后的引用计数 int
    // 仅当将一个结构体赋值给另外一个变量时（包括传参时）才需要调用这个以增加引用计数。
    // 新建结构体的默认引用计数值为 1， 所以不需要调用这个方法
    /*int32*/ inc_ref(/*int*/ addr) {
        let chunk = this.chunks[addr];
        let ref = chunk.ref + 1;
        chunk.ref = ref; // update
        return ref;
    }

    // 返回更新后的引用计数 int
    /*int*/ dec_ref(/*int*/ addr) {
        let chunk = this.chunks[addr];
        let ref = check.ref - 1;

        if (ref === 0) {
            // 传递引用值减少到所有成员。
            let mark = chunk.mark;
            let data = check.data;
            for (let idx = 0; idx < chunk.count; idx++) {
                if ((mark & 1) === 1) {
                    var view = new DataView(data);
                    // javascript lacks int64, so temporarily use int32 instead
                    let targetAddr = view.getUint32(idx * 8);
                    this.dec_ref(targetAddr);
                }

                // 逻辑右移 1 位
                mark = mark >>> 1;
            }

            // 回收资源
            this.chunks[addr] = null;

            // 返回新的 ref 值
            return 0;

        } else {
            chunk.ref = ref; // update
            return ref;
        }
    }

    /*i32*/ i32_read(/*int*/ addr, /*int32*/ byte_offset) {
        let chunk = this.chunks[addr];

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/getUint32
        var view = new DataView(chunk.data);
        return view.getUint32(byte_offset);
    }

    /*i64*/ i64_read(/*int*/ addr, /*int32*/ byte_offset) {
        // JavaScript lack off int64
        return this.i32_read(addr, byte_offset);
    }

    /*int*/ read_address(/*int*/ addr, /*int32*/ member_index) {
        return this.i64_read(addr, member_index * 8);
    }

    /*f32*/ f32_read(/*int*/ addr, /*int32*/ byte_offset) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*f64*/ f64_read(/*int*/ addr, /*int32*/ byte_offset) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*i32*/ i32_write(/*int*/ addr, /*int32*/ byte_offset, /*i32*/ val) {
        let chunk = this.chunks[addr];
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/setUint32
        var view = new DataView(chunk.data);
        view.setUint32(byte_offset, val);
        return val;
    }

    /*i64*/ i64_write(/*int*/ addr, /*int32*/ byte_offset, /*i64*/ val) {
        // JavaScript lack off int64
        return this.i32_write(addr, byte_offset, val);
    }

    /*f32*/ f32_write(/*int*/ addr, /*int32*/ byte_offset, /*f32*/ val) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*f64*/ f64_write(/*int*/ addr, /*int32*/ byte_offset, /*f64*/ val) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*int*/ write_address(/*int*/ addr, /*int32*/ member_index, /*int*/ target_addr) {
        let chunk = this.chunks[addr];
        // javascript lacks int64, so temporarily use int32 instead
        var view = new DataView(chunk.data);
        view.setUint32(member_index * 8, target_addr);
        // update mark
        view.mark = view.mark | (1 << member_index);
        return target_addr;
    }

}

export { Memory };