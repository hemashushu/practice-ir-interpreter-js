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

    static testMultipleBytesChunkReadWrite() {
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

    static testBytesChunkResourceCollection() {
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

        assert.equal(memory.getChunk(addr1), null);

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

        assert.equal(memory.getChunk(addr2), null);

        assert.deepEqual(memory.status(), {
            capacity: 2,
            free: 1,
            used: 1
        });

        // 将 chunk3 引用数减少到 0，chunk2 将会被资源回收
        let ref5 = memory.dec_ref(addr3);
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
        let addr1 = memory.create_struct(2);

        memory.i64_write(addr1, 0, 123);
        memory.i64_write(addr1, 8, 456);

        // read chunk1
        assert.equal(memory.i64_read(addr1, 0), 123);
        assert.equal(memory.i64_read(addr1, 8), 456);

        assert.equal(memory.read_mark(addr1, 0), 0);
        assert.equal(memory.read_mark(addr1, 1), 0);

        // chunk2 = point {
        //     i64 x = 666,
        //     i64 y = 777
        // }

        let addr2 = memory.create_struct(2);

        memory.i64_write(addr2, 0, 666);
        memory.i64_write(addr2, 8, 777);

        // read chunk2
        assert.equal(memory.i64_read(addr2, 0), 666);
        assert.equal(memory.i64_read(addr2, 8), 777);

        assert.equal(memory.read_mark(addr2, 0), 0);
        assert.equal(memory.read_mark(addr2, 1), 0);

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
        assert.equal(memory.read_mark(addr3, 0), 1);
        assert.equal(memory.read_mark(addr3, 1), 1);

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

        assert.equal(memory.getChunk(chunkAddrB1), null);
        assert.equal(memory.getChunk(chunkAddr2), null);

        // b1 和 chunk 2 应该都被回收
        assert.deepEqual(memory.status(), {
            capacity: 5,
            free: 2,
            used: 3
        });

        // drop chunk b2
        memory.dec_ref(chunkAddrB2);

        assert.equal(memory.getChunk(chunkAddrB2), null);
        assert.equal(memory.getChunk(chunkAddr3), null);
        assert.equal(memory.getChunk(chunkAddr1), null);

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
        // head3 <-  c2 <- c1 ---|

        // line a

        let a1 = memory.create_struct(1);

        let a2 = memory.create_struct(1);
        memory.add_ref(a2, 0, a1);

        let a3 = memory.create_struct(1);
        memory.add_ref(a3, 0, a2);

        let a4 = memory.create_struct(1);
        memory.add_ref(a4, 0, a3);

        let head1 = memory.create_struct(1);
        memory.add_ref(head1, 0, a4);

        memory.inc_ref(head1);

        // line b

        let b1 = memory.create_struct(1);
        memory.add_ref(b1, 0, a3);

        let head2 = memory.create_struct(1);
        memory.add_ref(head2, 0, b1);

        memory.inc_ref(head2);

        // line c
        let c1 = memory.create_struct(1);
        memory.add_ref(c1, 0, a2);

        let c2 = memory.create_struct(1);
        memory.add_ref(c2, 0, c1);

        let head3 = memory.create_struct(1);
        memory.add_ref(head3, 0, c2);

        memory.inc_ref(head3);

        assert.deepEqual(memory.status(), {
            capacity: 10,
            free: 0,
            used: 10
        });

        // check a3, a2 ref
        assert.equal(memory.getChunk(a3).ref, 2);
        assert.equal(memory.getChunk(a2).ref, 2);

        // drop head1
        memory.dec_ref(head1);

        // head1, a4 should be collected
        assert.equal(memory.getChunk(head1), null);
        assert.equal(memory.getChunk(a4), null);

        assert.deepEqual(memory.status(), {
            capacity: 10,
            free: 2,
            used: 8
        });

        // check a3, a2 ref
        assert.equal(memory.getChunk(a3).ref, 1);
        assert.equal(memory.getChunk(a2).ref, 2);

        // drop head2
        memory.dec_ref(head2);

        // head2, b1, a3 should be collected
        assert.equal(memory.getChunk(head2), null);
        assert.equal(memory.getChunk(b1), null);
        assert.equal(memory.getChunk(a3), null);

        assert.deepEqual(memory.status(), {
            capacity: 10,
            free: 5,
            used: 5
        });

        // check a2 ref
        assert.equal(memory.getChunk(a2).ref, 1);

        // drop head 1
        memory.dec_ref(head3);

        // all nodes should be collected
        assert.deepEqual(memory.status(), {
            capacity: 10,
            free: 10,
            used: 0
        });
    }

    static testMemory() {
        TestMemory.testBytesChunk();
        TestMemory.testMultipleBytesChunkReadWrite();
        TestMemory.testBytesChunkResourceCollection();
        TestMemory.testStructChunk();
        TestMemory.testMultipleRef();
        TestMemory.testRefChain();

        console.log('Memory passed');
    }
}

export { TestMemory };