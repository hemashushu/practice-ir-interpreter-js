/**
 * 本地结构体
 */
class Chunk {
    /**
     *
     * @param {*} ref 引用计数值，初始值为 0
     * @param {*} type
     * @param {*} count 成员数量，对于数组，成员数量是 0
     * @param {*} mark 成员的数据类型（基本类型还是自定义类型）
     * @param {*} size
     * @param {*} data 一个 `ArrayBuffer` 对象
     * @param {*} destructor 析构函数的地址
     */
    constructor(/*int32*/ ref,
        /*int16*/ type,
        /*int16*/ count,
        /*int32*/ mark,
        /*int32*/ size,
        /* byte[] | i64[] */ data,
        /*int*/ destructor) {
        this.ref = ref;
        this.type = type;
        this.count = count;
        this.mark = mark;
        this.size = size;
        this.data = data;

        // !! 目前的解析器使用 Map 以及标识符的全称作为 key 来装载用户自定义函数，
        // !! 无法函数的地址，所以在 Chunk 的 destructor 字段里
        // !! 存放的是析构函数的标识符全称。比如 `user.Stream.drop`。
        this.destructor = destructor;
    }

    static createBytes(bytesLength) {
        // length 为字节数
        // `new ArrayBuffer` 方法会创建一个全 0 的字节数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
        let data = new ArrayBuffer(bytesLength)
        return new Chunk(0, 2, 0, 0, bytesLength, data, null);
    }

    static createStruct(count, mark) {
        // 每个成员占用 8 个字节
        let bytesLength = count * 8;

        // `new ArrayBuffer` 方法会创建一个全 0 的字节数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
        let data = new ArrayBuffer(bytesLength)
        return new Chunk(0, 1, count, mark, 0, data, null);
    }

    static createStructDestructor(count, mark, destructor) {
        // 每个成员占用 8 个字节
        let bytesLength = count * 8;
        let data = new ArrayBuffer(bytesLength)
        // 129 = 2^7 & 1 = 128 + 1 = 129
        return new Chunk(0, 129, count, mark, 0, data, destructor);
    }

    /*i32*/ i32Read(/*int32*/ byteOffset) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/getUint32
        var view = new DataView(this.data);
        return view.getUint32(byteOffset);
    }

    /*i64*/ i64Read(/*int32*/ byteOffset) {
        // JavaScript lack off int64
        return this.i32Read(byteOffset);
    }

    /*f32*/ f32Read(/*int32*/ byteOffset) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*f64*/ f64Read(/*int32*/ byteOffset) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*i32*/ i32Write(/*int32*/ byteOffset, /*i32*/ val) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView/setUint32
        var view = new DataView(this.data);
        view.setUint32(byteOffset, val);
        return val;
    }

    /*i64*/ i64Write(/*int32*/ byteOffset, /*i64*/ val) {
        // JavaScript lack off int64
        return this.i32Write(byteOffset, val);
    }

    /*f32*/ f32Write(/*int32*/ byteOffset, /*f32*/ val) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /*f64*/ f64Write(/*int32*/ byteOffset, /*f64*/ val) {
        throw new EvalError('NOT_IMPLEMENT');
    }

    /**
     * 读取指定成员的地址值。
     */
    /*int*/ readAddress(/*int32*/ memberIndex) {
        return this.i64Read(memberIndex * 8);
    }

}

export { Chunk };