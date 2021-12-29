import { strict as assert } from 'assert';
import path from 'path';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";

class TestUserDefinedType {

    static testCreateStruct() {
        let evaluator = new Evaluator();

        // a1 = {
        //     i64 x = 1234,
        //     i64 y = 5678
        // }
        let addr1 = evaluator.evalFromString(
            `
            (do
                (let addr1 (builtin.memory.create_struct 2))
                (builtin.memory.i64_write addr1 0 1234)
                (builtin.memory.i64_write addr1 8 5678)
                addr1
            )`
        );

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.i64_read ${addr1} 0)`
        ), 1234);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.i64_read ${addr1} 8)`
        ), 5678);

        // check mark
        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_mark ${addr1} 0)
            `), 0);

        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_mark ${addr1} 1)
            `), 0);

        let chunk1 = evaluator.memory.getChunk(addr1);
        assert.equal(chunk1.mark, 0);

        // a2 = {
        //     i64 x = 1122,
        //     i64 y = 3344
        // }
        let addr2 = evaluator.evalFromString(
            `
            (do
                (let addr2 (builtin.memory.create_struct 2))
                (builtin.memory.i64_write addr2 0 1122)
                (builtin.memory.i64_write addr2 8 3344)
                addr2
            )`
        );

        // a3 = {
        //     a1,
        //     a2
        // }
        let addr3 = evaluator.evalFromString(
            `
            (do
                (let addr3 (builtin.memory.create_struct 2))
                (builtin.memory.inc_ref addr3)
                (builtin.memory.add_ref addr3 0 ${addr1})
                (builtin.memory.add_ref addr3 1 ${addr2})
                addr3
            )`
        );

        // check ref address
        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.get_address ${addr3} 0)
            `), addr1);

        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.get_address ${addr3} 1)
            `), addr2);

        // check mark
        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_mark ${addr3} 0)
            `), 1);

        assert.equal(evaluator.evalFromString(
            `
            (builtin.memory.read_mark ${addr3} 1)
            `), 1);

        let chunk3 = evaluator.memory.getChunk(addr3);
        assert.equal(chunk3.mark, 0b11);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 3,
            free: 0,
            used: 3
        });

        // drop chunk3
        evaluator.evalFromString(
            `(builtin.memory.dec_ref ${addr3})`
        );

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 3,
            free: 3,
            used: 0
        });
    }

    static testCreateStructByStd() {
        let optionFilePath = path.resolve('test', 'resources', 'option.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', optionFilePath);

        // build `let a1 = Option::Some::new(123)`
        let a1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some.new 123))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // build `let a2 = Option::Some::new(456)`
        let a2 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some.new 456))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // build `let a3 = Option::Some::new(123)`
        let a3 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some.new 123))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // Option::Some::equal(a1, a2)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a1} ${a2})`), 0);

        // Option::Some::equal(a1, a3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a1} ${a3})`), 1);

        // Option::Some::equal(a2, a3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a2} ${a3})`), 0);

        // Option::Some::equal(a1, a1)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a1} ${a1})`), 1);
    }

    static testCreateUnionByStd() {
        let optionFilePath = path.resolve('test', 'resources', 'option.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', optionFilePath);

        // build `let b1 = Option::Some(11)`
        let b1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some 11))
                (builtin.memory.inc_ref addr)
                addr
            )`
        );

        // check mark
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${b1} 0)`), 0);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${b1} 1)`), 1);

        // build `let b1 = Option::Some(22)`
        let b2 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some 22))
                (builtin.memory.inc_ref addr)
                addr
            )`
        );

        // build `let b3 = Option::Some(11)`
        let b3 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some 11))
                (builtin.memory.inc_ref addr)
                addr
            )`
        );

        // build `let b4 = Option::None`
        let b4 = evaluator.evalFromString(`
            std.Option.None`
        );

        // check mark
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${b4} 0)`), 0);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${b4} 1)`), 0);

        // Option::equal(b1, b2)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b2})`), 0);

        // Option::equal(b1, b3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b3})`), 1);

        // Option::equal(b2, b3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b2} ${b3})`), 0);

        // Option::equal(b1, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b4})`), 0);

        // Option::equal(b1, b1)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b1})`), 1);

        // Option::equal(b2, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b2} ${b4})`), 0);

        // Option::equal(b4, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b4} ${b4})`), 1);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 7,
            free: 0,
            used: 7
        });

        // drop b1, b2, b3
        evaluator.evalFromString(`
            (do
                (builtin.memory.dec_ref ${b1})
                (builtin.memory.dec_ref ${b2})
                (builtin.memory.dec_ref ${b3})
            )`
        );

        // b1, b2, b3 等 Option 实例以及内层的 Some 实例应该被回收，
        assert.deepEqual(evaluator.memory.status(), {
            capacity: 7,
            free: 6,
            used: 1
        });
    }

    static testUserDefinedType() {
        TestUserDefinedType.testCreateStruct();
        TestUserDefinedType.testCreateStructByStd();
        TestUserDefinedType.testCreateUnionByStd();

        console.log('User-defined type passed');
    }
}

export { TestUserDefinedType };