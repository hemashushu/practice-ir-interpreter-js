import { strict as assert } from 'assert';

import {
    Chunk,
    Memory,
} from "../index.js";


class TestMemory {

    static testBytesChunk() {
        let memory = new Memory();

        assert.deepEqual(memory.status(), {
            capacity: 0,
            free: 0,
            used: 0
        });

        // 创建一个 bytes chunk
        // [int32, int64, int32, int64]
        // 4,8,4,8
        let addr1 = memory.createBytes(24);

        let chunk1 = memory.getChunk(addr1);
        assert.equal(chunk1.ref, 0);
        assert.equal(chunk1.type, 2);
        assert.equal(chunk1.mark, 0); // bytes 不使用此字段，默认值为 0
        assert.equal(chunk1.size, 24);

        assert.deepEqual(memory.status(), {
            capacity: 1,
            free: 0,
            used: 1
        });

        // write
        chunk1.i32Write(0, 11);  // +0
        chunk1.i64Write(4, 22);  // +4
        chunk1.i32Write(12, 33); // +4 +8
        chunk1.i64Write(16, 44); // +4 +8 +4

        // read
        assert.equal(chunk1.i32Read(0), 11);
        assert.equal(chunk1.i64Read(4), 22);
        assert.equal(chunk1.i32Read(12), 33);
        assert.equal(chunk1.i64Read(16), 44);

        // update
        chunk1.i32Write(0, 8811);  // +0
        chunk1.i64Write(4, 8822);  // +4
        chunk1.i32Write(12, 8833); // +4 +8
        chunk1.i64Write(16, 8844); // +4 +8 +4

        // verify
        assert.equal(chunk1.i32Read(0), 8811);
        assert.equal(chunk1.i64Read(4), 8822);
        assert.equal(chunk1.i32Read(12), 8833);
        assert.equal(chunk1.i64Read(16), 8844);
    }

    static testMultipleBytesChunkReadWrite() {
        let memory = new Memory();

        assert.deepEqual(memory.status(), {
            capacity: 0,
            free: 0,
            used: 0
        });

        // 第 1 个 bytes chunk
        // [8,8,8,8]
        let addr1 = memory.createBytes(32);

        // 第 2 个 bytes chunk
        // [8,8,8,8]
        let addr2 = memory.createBytes(32);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        let chunk1 = memory.getChunk(addr1);
        let chunk2 = memory.getChunk(addr2);

        // write chunk1
        chunk1.i64Write(0, 1122);  // +8
        chunk1.i64Write(8, 3344);  // +8
        chunk1.i64Write(16, 5566); // +8 +8
        chunk1.i64Write(24, 7788); // +8 +8 +8

        // write chunk2
        chunk2.i64Write(0, 12);  // +8
        chunk2.i64Write(8, 34);  // +8
        chunk2.i64Write(16, 56); // +8 +8
        chunk2.i64Write(24, 78); // +8 +8 +8

        // read chunk2
        assert.equal(chunk2.i64Read(0), 12);
        assert.equal(chunk2.i64Read(8), 34);
        assert.equal(chunk2.i64Read(16), 56);
        assert.equal(chunk2.i64Read(24), 78);

        // read chunk1
        assert.equal(chunk1.i64Read(0), 1122);
        assert.equal(chunk1.i64Read(8), 3344);
        assert.equal(chunk1.i64Read(16), 5566);
        assert.equal(chunk1.i64Read(24), 7788);

        // update chunk1/chunk2
        chunk1.i64Write(0, 101122);  // +8
        chunk1.i64Write(8, 103344);  // +8
        chunk2.i64Write(0, 100012);    // +8
        chunk2.i64Write(8, 100034);    // +8

        // verify chunk1/chunk2
        assert.equal(chunk1.i64Read(0), 101122);
        assert.equal(chunk1.i64Read(8), 103344);
        assert.equal(chunk2.i64Read(0), 100012);
        assert.equal(chunk2.i64Read(8), 100034);
    }

    static testBytesChunkGarbageCollection() {
        let memory = new Memory();

        // 第 1 个 bytes chunk
        // [8,8,8,8]
        let addr1 = memory.createBytes(32);

        // 第 2 个 bytes chunk
        // [8,8,8,8]
        let addr2 = memory.createBytes(32);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // inc ref chunk1
        let ref1 = memory.incRef(addr1);
        assert.equal(ref1, 1);

        // inc ref chunk2
        let ref2 = memory.incRef(addr2);
        assert.equal(ref2, 1);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // 将 chunk1 引用数减少到 0，chunk1 将会被资源回收
        let ref3 = memory.decRef(addr1);
        assert.equal(ref3, 0);

        assert.equal(memory.getChunk(addr1), null);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });

        // 第 3 个 bytes chunk
        // [8,8,8,8]
        let addr3 = memory.createBytes(32);
        memory.incRef(addr3);

        // 第 3 个应该会重用第 1 个 chunk 的空间
        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // 将 chunk2 引用数减少到 0，chunk2 将会被资源回收
        let ref4 = memory.decRef(addr2);
        assert.equal(ref4, 0);

        assert.equal(memory.getChunk(addr2), null);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });

        // 将 chunk3 引用数减少到 0，chunk2 将会被资源回收
        let ref5 = memory.decRef(addr3);
        assert.equal(ref5, 0);

        assert.equal(memory.getChunk(addr3), null);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 2,
            used: 0
        });
    }

    static testStructChunk() {
        let memory = new Memory();

        // chunk1 = point {
        //     i64 x = 123,
        //     i64 y = 456
        // }
        let addr1 = memory.createStruct(16, 0b00);

        let chunk1 = memory.getChunk(addr1);
        assert.equal(chunk1.ref, 0);
        assert.equal(chunk1.type, 1);
        assert.equal(chunk1.mark, 0b00);
        assert.equal(chunk1.size, 16);

        // write chunk1
        chunk1.i64Write(0, 123);
        chunk1.i64Write(8, 456);

        // read chunk1
        assert.equal(chunk1.i64Read(0), 123);
        assert.equal(chunk1.i64Read(8), 456);

        // chunk2 = point {
        //     i64 x = 666,
        //     i64 y = 777
        // }

        let addr2 = memory.createStruct(16, 0b00);

        let chunk2 = memory.getChunk(addr2);

        // write chunk2
        chunk2.i64Write(0, 666);
        chunk2.i64Write(8, 777);

        // read chunk2
        assert.equal(chunk2.i64Read(0), 666);
        assert.equal(chunk2.i64Read(8), 777);

        // chunk3 = rect {
        //     point top_left = chunk1,
        //     point bottom_right = chunk2,
        // }

        let addr3 = memory.createStruct(16, 0b11);
        memory.incRef(addr3);

        let chunk3 = memory.getChunk(addr3);
        assert.equal(chunk3.ref, 1);
        assert.equal(chunk3.type, 1);
        assert.equal(chunk3.mark, 0b11);
        assert.equal(chunk3.size, 16);

        memory.addRef(addr3, 0, addr1);
        memory.addRef(addr3, 8, addr2);

        // read chunk3
        assert.equal(chunk3.readAddress(0), addr1);
        assert.equal(chunk3.readAddress(8), addr2);

        assert.deepEqual(memory.status(), {
            capacity: 3,
            free: 0,
            used: 3
        });

        // check updated chunk1
        let chunk1b = memory.getChunk(addr1);
        assert.equal(chunk1b.ref, 1);

        // check updated chunk2
        let chunk2b = memory.getChunk(addr2);
        assert.equal(chunk2b.ref, 1);

        // 减少 chunk3 的引用计数，chunk1 和 chunk2 应该都会被资源回收
        memory.decRef(addr3);

        assert.deepEqual(memory.status(), {
            capacity: 3,
            free: 3,
            used: 0
        });
    }

    static testStructChunkGarbageCollection() {
        let memory = new Memory();

        // (no let) chunk1 = bytes[8]
        // (no let) chunk2 = {i64, i64}
        // (no let) chunk3 = {i64, i64}

        // (let) chunk_b1 = {chunk1, chunk2}
        // (let) chunk_b2 = {chunk1, chunk3}

        let addr1 = memory.createBytes(8);
        let addr2 = memory.createStruct(16, 0b00);
        let addr3 = memory.createStruct(16, 0b00);

        let addrB1 = memory.createStruct(16, 0b11);
        memory.incRef(addrB1);
        memory.addRef(addrB1, 0, addr1);
        memory.addRef(addrB1, 8, addr2);

        let addrB2 = memory.createStruct(16, 0b11);
        memory.incRef(addrB2);
        memory.addRef(addrB2, 0, addr1);
        memory.addRef(addrB2, 8, addr3);

        // check refs
        assert.equal(memory.getChunk(addr1).ref, 2);
        assert.equal(memory.getChunk(addr2).ref, 1);
        assert.equal(memory.getChunk(addr3).ref, 1);

        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 0,
            used: 5
        });

        // drop chunk b1
        memory.decRef(addrB1);
        assert.equal(memory.getChunk(addrB1), null);
        assert.equal(memory.getChunk(addr2), null);

        // b1 和 chunk 2 应该都被回收
        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 2,
            used: 3
        });

        // drop chunk b2
        memory.decRef(addrB2);
        assert.equal(memory.getChunk(addrB2), null);
        assert.equal(memory.getChunk(addr3), null);
        assert.equal(memory.getChunk(addr1), null);

        // b2 和 chunk 3 和 chunk 1 应该都被回收
        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 5,
            used: 0
        });
    }

    static testRefChain() {
        let memory = new Memory();

        // head1 <-- a4 <- a3 <- a2 <- a1
        //                 |     |
        // head2 <-  b1 <- /     |
        // head3 <-  c2 <- c1 <--|
        //                       |
        // head4 <-  d1 <--------/

        /**
         * line a
         */

        let a1 = memory.createStruct(8, 0b0);

        let a2 = memory.createStruct(8, 0b1);
        memory.addRef(a2, 0, a1);

        let a3 = memory.createStruct(8, 0b1);
        memory.addRef(a3, 0, a2);

        let a4 = memory.createStruct(8, 0b1);
        memory.addRef(a4, 0, a3);

        let head1 = memory.createStruct(8, 0b1);
        memory.addRef(head1, 0, a4);

        memory.incRef(head1);

        /**
         * line b
         */

        let b1 = memory.createStruct(8, 0b1);
        memory.addRef(b1, 0, a3);

        let head2 = memory.createStruct(8, 0b1);
        memory.addRef(head2, 0, b1);

        memory.incRef(head2);

        /**
         * line c
         */

        let c1 = memory.createStruct(8, 0b1);
        memory.addRef(c1, 0, a2);

        let c2 = memory.createStruct(8, 0b1);
        memory.addRef(c2, 0, c1);

        let head3 = memory.createStruct(8, 0b1);
        memory.addRef(head3, 0, c2);

        memory.incRef(head3);

        /**
         * line d
         */

        let d1 = memory.createStruct(8, 0b1);
        memory.addRef(d1, 0, a2);

        let head4 = memory.createStruct(8, 0b1);
        memory.addRef(head4, 0, d1);

        memory.incRef(head4);

        /**
         * check
         */

        assert.deepEqual(memory.status(), {
            capacity: 12,
            free: 0,
            used: 12
        });

        // check ref
        assert.equal(memory.getChunk(a1).ref, 1);
        assert.equal(memory.getChunk(a2).ref, 3);
        assert.equal(memory.getChunk(a3).ref, 2);
        assert.equal(memory.getChunk(a4).ref, 1);
        assert.equal(memory.getChunk(head1).ref, 1);

        assert.equal(memory.getChunk(b1).ref, 1);
        assert.equal(memory.getChunk(head2).ref, 1);

        assert.equal(memory.getChunk(c1).ref, 1);
        assert.equal(memory.getChunk(c2).ref, 1);
        assert.equal(memory.getChunk(head3).ref, 1);

        assert.equal(memory.getChunk(d1).ref, 1);
        assert.equal(memory.getChunk(head4).ref, 1);

        /**
         * drop head1
         * head1, a4 应该被回收
         */
        memory.decRef(head1);
        assert.equal(memory.getChunk(head1), null);
        assert.equal(memory.getChunk(a4), null);

        // check a3, a2 ref
        assert.equal(memory.getChunk(a3).ref, 1);
        assert.equal(memory.getChunk(a2).ref, 3);

        assert.deepEqual(memory.status(), {
            capacity: 12,
            free: 2,
            used: 10
        });

        /**
         * drop head2
         * head2, b1, a3 应该被回收
         */
        memory.decRef(head2);
        assert.equal(memory.getChunk(head2), null);
        assert.equal(memory.getChunk(b1), null);
        assert.equal(memory.getChunk(a3), null);

        // check a2 ref
        assert.equal(memory.getChunk(a2).ref, 2);

        assert.deepEqual(memory.status(), {
            capacity: 12,
            free: 5,
            used: 7
        });

        /**
         * drop head 3
         * c1, c2, head3 应该被回收
         */
        memory.decRef(head3);
        assert.equal(memory.getChunk(head3), null);
        assert.equal(memory.getChunk(c1), null);
        assert.equal(memory.getChunk(c2), null);

        // check a2 ref
        assert.equal(memory.getChunk(a2).ref, 1);

        assert.deepEqual(memory.status(), {
            capacity: 12,
            free: 8,
            used: 4
        });

        /**
         * drop head 4
         * a1, a2, d1, head4 应该被回收
         */
        memory.decRef(head4);

        assert.equal(memory.getChunk(head4), null);
        assert.equal(memory.getChunk(d1), null);
        assert.equal(memory.getChunk(a2), null);
        assert.equal(memory.getChunk(a1), null);

        assert.deepEqual(memory.status(), {
            capacity: 12,
            free: 12,
            used: 0
        });
    }

    static testMemory() {
        TestMemory.testBytesChunk();
        TestMemory.testMultipleBytesChunkReadWrite();
        TestMemory.testBytesChunkGarbageCollection();
        TestMemory.testStructChunk();
        TestMemory.testStructChunkGarbageCollection();
        TestMemory.testRefChain();

        console.log('Memory passed');
    }
}

export { TestMemory };