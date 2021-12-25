import { strict as assert } from 'assert';

import {
    Chunk,
    Memory
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
        let addr1 = memory.create_bytes(24);

        let chunk1 = memory.getChunk(addr1);
        assert.equal(chunk1.ref, 0);
        assert.equal(chunk1.count, 0);
        assert.equal(chunk1.mark, 0);

        assert.deepEqual(memory.status(), {
            capacity: 1,
            free: 0,
            used: 1
        });

        // write
        memory.i32_write(addr1, 0, 11);  // +0
        memory.i64_write(addr1, 4, 22);  // +4
        memory.i32_write(addr1, 12, 33); // +4 +8
        memory.i64_write(addr1, 16, 44); // +4 +8 +4

        // read
        assert.equal(memory.i32_read(addr1, 0), 11);
        assert.equal(memory.i64_read(addr1, 4), 22);
        assert.equal(memory.i32_read(addr1, 12), 33);
        assert.equal(memory.i64_read(addr1, 16), 44);

        // set
        memory.i64_write(addr1, 4, 55);
        assert.equal(memory.i64_read(addr1, 4), 55);
    }

    static testMultipleChunkReadWrite() {
        let memory = new Memory();

        assert.deepEqual(memory.status(), {
            capacity: 0,
            free: 0,
            used: 0
        });

        // 第 1 个 bytes chunk
        // [8,8,8,8]
        let addr1 = memory.create_bytes(32);

        // 第 2 个 bytes chunk
        // [8,8,8,8]
        let addr2 = memory.create_bytes(32);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // write chunk1
        memory.i64_write(addr1, 0, 1122);  // +8
        memory.i64_write(addr1, 8, 3344);  // +8
        memory.i64_write(addr1, 16, 5566); // +8 +8
        memory.i64_write(addr1, 24, 7788); // +8 +8 +8

        // write chunk2
        memory.i64_write(addr2, 0, 12);  // +8
        memory.i64_write(addr2, 8, 34);  // +8
        memory.i64_write(addr2, 16, 56); // +8 +8
        memory.i64_write(addr2, 24, 78); // +8 +8 +8

        // read chunk2
        assert.equal(memory.i64_read(addr2, 0), 12);
        assert.equal(memory.i64_read(addr2, 8), 34);
        assert.equal(memory.i64_read(addr2, 16), 56);
        assert.equal(memory.i64_read(addr2, 24), 78);

        // read chunk1
        assert.equal(memory.i64_read(addr1, 0), 1122);
        assert.equal(memory.i64_read(addr1, 8), 3344);
        assert.equal(memory.i64_read(addr1, 16), 5566);
        assert.equal(memory.i64_read(addr1, 24), 7788);

        // update chunk1/chunk2
        memory.i64_write(addr1, 0, 101122);  // +8
        memory.i64_write(addr1, 8, 103344);  // +8
        memory.i64_write(addr2, 0, 100012);    // +8
        memory.i64_write(addr2, 8, 100034);    // +8

        // check chunk1/chunk2
        assert.equal(memory.i64_read(addr1, 0), 101122);
        assert.equal(memory.i64_read(addr1, 8), 103344);
        assert.equal(memory.i64_read(addr2, 0), 100012);
        assert.equal(memory.i64_read(addr2, 8), 100034);
    }

    static testResourceCollection() {
        let memory = new Memory();

        // 第 1 个 bytes chunk
        // [8,8,8,8]
        let addr1 = memory.create_bytes(32);

        // 第 2 个 bytes chunk
        // [8,8,8,8]
        let addr2 = memory.create_bytes(32);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // inc ref chunk1
        let ref1 = memory.inc_ref(addr1);
        assert.equal(ref1, 1);

        // inc ref chunk2
        let ref2 = memory.inc_ref(addr2);
        assert.equal(ref2, 1);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // 将 chunk1 引用数减少到 0，chunk1 将会被资源回收
        let ref3 = memory.dec_ref(addr1);
        assert.equal(ref3, 0);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });

        // 第 3 个 bytes chunk
        // [8,8,8,8]
        let addr3 = memory.create_bytes(32);
        memory.inc_ref(addr3);

        // 第 3 个应该会重用第 1 个 chunk 的空间
        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 0,
            used: 2
        });

        // 将 chunk2 引用数减少到 0，chunk2 将会被资源回收
        let ref4 = memory.dec_ref(addr2);
        assert.equal(ref4, 0);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });

        // 将 chunk3 引用数减少到 0，chunk2 将会被资源回收
        let ref5 = memory.dec_ref(addr3);
        assert.equal(ref5, 0);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 2,
            used: 0
        });
    }

    static testStructChunk() {
        let memory = new Memory();

        // chunk1 = point {
        //     i64 x = 10,
        //     i64 y = 20
        // }
        let addr1 = memory.create_struct(2);

        memory.i64_write(addr1, 0, 10);
        memory.i64_write(addr1, 8, 20);

        // read chunk1
        assert.equal(memory.i64_read(addr1, 0), 10);
        assert.equal(memory.i64_read(addr1, 8), 20);

        // chunk2 = point {
        //     i64 x = 110,
        //     i64 y = 120
        // }

        let addr2 = memory.create_struct(2);

        memory.i64_write(addr2, 0, 110);
        memory.i64_write(addr2, 8, 120);

        // read chunk2
        assert.equal(memory.i64_read(addr2, 0), 110);
        assert.equal(memory.i64_read(addr2, 8), 120);

        // chunk3 = rect {
        //     point top_left = chunk1,
        //     point bottom_right = chunk2,
        // }

        let addr3 = memory.create_struct(2);
        memory.inc_ref(addr3);

        memory.add_ref(addr3, 0, addr1);
        memory.add_ref(addr3, 1, addr2);

        // read chunk3
        assert.equal(memory.read_address(addr3, 0), addr1);
        assert.equal(memory.read_address(addr3, 1), addr2);

        // check mark
        let chunk3 = memory.getChunk(addr3);
        assert.equal(chunk3.mark, 0b11);

        assert.deepEqual(memory.status(), {
            capacity: 3,
            free: 0,
            used: 3
        });

        // check chunk1
        let chunk1 = memory.getChunk(addr1);
        assert.equal(chunk1.ref, 1);

        // check chunk2
        let chunk2 = memory.getChunk(addr2);
        assert.equal(chunk2.ref, 1);

        // 减少 chunk3 的引用计数，chunk1 和 chunk2 应该都会被资源回收
        memory.dec_ref(addr3);

        assert.deepEqual(memory.status(), {
            capacity: 3,
            free: 3,
            used: 0
        });
    }

    static testMultipleRef() {
        let memory = new Memory();

        // (no var) chunk1 = bytes[8]
        // (no var) chunk2 = {i64, i64}
        // (no var) chunk3 = {i64, i64}

        // (let) chunk_b1 = {chunk1, chunk2}
        // (let) chunk_b2 = {chunk1, chunk3}

        let chunkAddr1 = memory.create_bytes(8);
        let chunkAddr2 = memory.create_struct(2);
        let chunkAddr3 = memory.create_struct(3);

        let chunkAddrB1 = memory.create_struct(2);
        memory.inc_ref(chunkAddrB1);

        memory.add_ref(chunkAddrB1, 0, chunkAddr1);
        memory.add_ref(chunkAddrB1, 1, chunkAddr2);

        let chunkAddrB2 = memory.create_struct(2);
        memory.inc_ref(chunkAddrB2);

        memory.add_ref(chunkAddrB2, 0, chunkAddr1);
        memory.add_ref(chunkAddrB2, 1, chunkAddr3);

        // check refs

        assert.equal(memory.getChunk(chunkAddr1).ref, 2);
        assert.equal(memory.getChunk(chunkAddr2).ref, 1);
        assert.equal(memory.getChunk(chunkAddr3).ref, 1);

        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 0,
            used: 5
        });

        // drop chunk b1
        memory.dec_ref(chunkAddrB1);

        // b1 和 chunk 2 应该都被回收
        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 2,
            used: 3
        });

        // drop chunk b2
        memory.dec_ref(chunkAddrB2);

        // b2 和 chunk 3 和 chunk 1 应该都被回收
        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 5,
            used: 0
        });
    }

    static testMemory() {
        TestMemory.testBytesChunk();
        TestMemory.testMultipleChunkReadWrite();
        TestMemory.testResourceCollection();
        TestMemory.testStructChunk();
        TestMemory.testMultipleRef();
    }
}

export { TestMemory };