/**
 * 本地结构体，一块内存数据
 */
class Chunk {
    /**
     *
     * @param {*} ref 初始值为 1
     * @param {*} count 成员数量，对于数组，成员数量是 0
     * @param {*} mark 成员的数据类型（基本类型还是自定义类型）
     * @param {*} data 一个 `ArrayBuffer` 对象
     */
    constructor(/*int32*/ ref, /*int32*/ count, /*int32*/ mark, data) {
        this.ref = ref;
        this.count = count;
        this.mark = mark;
        this.data = data;
    }

    /**
     * 初始的 ref 数为 1
     * @param {*} count 成员数量
     */
    static createStruct(count) {
        // 每个成员占用 8 个字节
        let bytesLength = count * 8;

        // `new ArrayBuffer` 方法会创建一个全 0 的字节数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
        let data = new ArrayBuffer(bytesLength)
        return new Chunk(1, count, 0, data);
    }

    /**
     * 初始的 ref 数为 1
     * @param {*} bytesLength
     */
     static createBytes(bytesLength) {
        // length 为字节数
        // `new ArrayBuffer` 方法会创建一个全 0 的字节数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
        let data = new ArrayBuffer(bytesLength)
        return new Chunk(1, 0, 0, data);
    }
}

export { Chunk };