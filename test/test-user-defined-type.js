import { strict as assert } from 'assert';

import {
    Evaluator,
} from "../index.js";

class TestUserDefinedType {

    static testCreateBytes() {
        let evaluator = new Evaluator();

        // a1 = [int32, int64, int32, int64]
        // 4,8,4,8
        let addr1 = evaluator.evalFromString(
            `
            (do
                (let addr (builtin.memory.create_bytes 24))
                addr
            )`);

        let chunk1 = evaluator.memory.getChunk(addr1);
        assert.equal(chunk1.ref, 0);
        assert.equal(chunk1.type, 2);
        assert.equal(chunk1.mark, 0); // bytes 不使用此字段，默认值为 0
        assert.equal(chunk1.size, 24);

        // write
        evaluator.evalFromString(
            `
            (do
                (builtin.memory.write_i32 ${addr1} 0 11)
                (builtin.memory.write_i64 ${addr1} 4 22)
                (builtin.memory.write_i32 ${addr1} 12 33)
                (builtin.memory.write_i64 ${addr1} 16 44)
            )`);

        // read
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i32 ${addr1} 0)`), 11);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 4)`), 22);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i32 ${addr1} 12)`), 33);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 16)`), 44);

        // update
        evaluator.evalFromString(
            `
            (do
                (builtin.memory.write_i32 ${addr1} 0 8811)
                (builtin.memory.write_i64 ${addr1} 4 8822)
                (builtin.memory.write_i32 ${addr1} 12 8833)
                (builtin.memory.write_i64 ${addr1} 16 8844)
            )`);

        // verify
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i32 ${addr1} 0)`), 8811);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 4)`), 8822);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i32 ${addr1} 12)`), 8833);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 16)`), 8844);
    }

    static testCreateStruct() {
        let evaluator = new Evaluator();

        // a1 = {
        //     i64 x = 123,
        //     i64 y = 456
        // }
        let addr1 = evaluator.evalFromString(
            `
            (do
                (let addr (builtin.memory.create_struct 16 0))
                addr
            )`
        );

        let chunk1 = evaluator.memory.getChunk(addr1);
        assert.equal(chunk1.ref, 0);
        assert.equal(chunk1.type, 1);
        assert.equal(chunk1.mark, 0b00);
        assert.equal(chunk1.size, 16);

        // write
        evaluator.evalFromString(
            `
            (do
                (builtin.memory.write_i64 ${addr1} 0 123)
                (builtin.memory.write_i64 ${addr1} 8 456)
            )`);

        // read
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 0)`
        ), 123);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 8)`
        ), 456);

        // a2 = {
        //     i64 x = 666,
        //     i64 y = 777
        // }
        let addr2 = evaluator.evalFromString(
            `
            (do
                (let addr (builtin.memory.create_struct 16 0))
                (builtin.memory.write_i64 addr 0 666)
                (builtin.memory.write_i64 addr 8 777)
                addr
            )`
        );

        // read
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr2} 0)`
        ), 666);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr2} 8)`
        ), 777);

        // a3 = {
        //     a1,
        //     a2
        // }
        let addr3 = evaluator.evalFromString(
            `
            (do
                (let addr (builtin.memory.create_struct 16 3))
                (builtin.memory.add_ref addr 0 ${addr1})
                (builtin.memory.add_ref addr 8 ${addr2})
                (builtin.memory.inc_ref addr)
                addr
            )`
        );

        let chunk3 = evaluator.memory.getChunk(addr3);
        assert.equal(chunk3.ref, 1);
        assert.equal(chunk3.type, 1);
        assert.equal(chunk3.mark, 0b11);
        assert.equal(chunk3.size, 16);

        // check ref address
        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_address ${addr3} 0)
            `), addr1);

        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_address ${addr3} 8)
            `), addr2);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 3,
            free: 0,
            used: 3
        });

        // check updated chunk1
        let chunk1b = evaluator.memory.getChunk(addr1);
        assert.equal(chunk1b.ref, 1);

        // check updated chunk2
        let chunk2b = evaluator.memory.getChunk(addr2);
        assert.equal(chunk2b.ref, 1);

        // 减少 chunk3 的引用计数，chunk1 和 chunk2 应该都会被资源回收
        evaluator.evalFromString(
            `(builtin.memory.dec_ref ${addr3})`
        );

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 3,
            free: 3,
            used: 0
        });
    }

    static testCreateStructChunkDestructor() {
        let evaluator = new Evaluator();

        // !! 目前的解析器使用 Map 以及标识符的全称作为 key 来装载用户自定义函数，
        // !! 无法函数的地址，所以在 Chunk 的 destructor 字段里
        // !! 存放的是析构函数的标识符全称，比如 `user.Stream.drop`。

        // 目标：
        // 构建一个用于检验的 chunk1 = {x: 10, y: 20}
        // 构建一个用于附加构造函数的 chunk2
        // 当 chunk2 被资源回收时，析构函数会把 chunk2 的数据复制到 chunk1
        // 检查 chunk1 的数据，如果发现更新，则说明析构函数被正确执行。

        let addr1 = evaluator.evalFromString(
            `
            (do
                (let addr (builtin.memory.create_struct 16 0))
                (builtin.memory.inc_ref addr)
                (builtin.memory.write_i64 addr 0 10)
                (builtin.memory.write_i64 addr 8 20)
                addr
            )`);

        // read
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 0)`
        ), 10);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 8)`
        ), 20);

        // 定义析构函数
        evaluator.evalFromString(
            `
            (defn drop (pointAddr)
                (do
                    ;; 复制被回收的 point 对象的 x,y 值
                    (builtin.memory.write_i64 ${addr1} 0 (builtin.memory.read_i64 pointAddr 0))
                    (builtin.memory.write_i64 ${addr1} 8 (builtin.memory.read_i64 pointAddr 8))
                )
            )`);

        // 创建带有析构函数的结构体 chunk2 = {x: 1234, y: 5678}

        // 注：无法使用 IR 语句创建
        let addr2 = evaluator.memory.createStructDestructor(16, 0, 'user.drop');

        evaluator.evalFromString(
            `
            (do
                (builtin.memory.inc_ref ${addr2})
                (builtin.memory.write_i64 ${addr2} 0 1234)
                (builtin.memory.write_i64 ${addr2} 8 5678)
            )`);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // 释放 chunk2
        evaluator.evalFromString(`(builtin.memory.dec_ref ${addr2})`);

        // 检查 chunk1 的值
        // read
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 0)`
        ), 1234);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_i64 ${addr1} 8)`
        ), 5678);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });
    }

    static testUserDefinedType() {
        TestUserDefinedType.testCreateBytes();
        TestUserDefinedType.testCreateStruct();
        TestUserDefinedType.testCreateStructChunkDestructor();

        console.log('User-defined type passed');
    }
}

export { TestUserDefinedType };