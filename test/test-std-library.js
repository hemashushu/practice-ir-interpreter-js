import { strict as assert } from 'assert';
import path from 'path';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";

class TestStdLibrary {
    static testStruct() {
        let srcFilePath = path.resolve('test', 'resources', 'ratio.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', srcFilePath);

        // 构造 Ratio 实例 r1 = 2/3
        let r1 = evaluator.evalFromString(`
            (do
                (let addr (std.Ratio.new 2 3))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(`(std.Ratio.getN ${r1})`), 2);
        assert.equal(evaluator.evalFromString(`(std.Ratio.getM ${r1})`), 3);

        // 构造 Ratio 实例 r2 = 4/5
        let r2 = evaluator.evalFromString(`
        (do
            (let addr (std.Ratio.new 4 5))
            (builtin.memory.inc_ref addr)
            addr
        )`);

        assert.equal(evaluator.evalFromString(`(std.Ratio.getN ${r2})`), 4);
        assert.equal(evaluator.evalFromString(`(std.Ratio.getM ${r2})`), 5);

        // 构造 Ratio 实例 r3 = 2/3
        let r3 = evaluator.evalFromString(`
        (do
            (let addr (std.Ratio.new 2 3))
            (builtin.memory.inc_ref addr)
            addr
        )`);

        // 测试比较
        assert.equal(evaluator.evalFromString(
            `(std.Ratio.equal ${r1} ${r2})`), 0);

        assert.equal(evaluator.evalFromString(
            `(std.Ratio.equal ${r1} ${r2})`), 0);

        assert.equal(evaluator.evalFromString(
            `(std.Ratio.equal ${r1} ${r3})`), 1);

        assert.equal(evaluator.evalFromString(
            `(std.Ratio.equal ${r1} ${r1})`), 1);

        // 测试加法 r4 = r1 + r2 = 2/3 + 4/5 = 22/15
        let r4 = evaluator.evalFromString(`
            (do
                (let addr (std.Ratio.add ${r1} ${r2}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(`(std.Ratio.getN ${r4})`), 22);
        assert.equal(evaluator.evalFromString(`(std.Ratio.getM ${r4})`), 15);

        // r5 = r1 + r3 = 2/3 + 2/3 = 12/9
        let r5 = evaluator.evalFromString(`
            (do
                (let addr (std.Ratio.add ${r1} ${r3}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(`(std.Ratio.getN ${r5})`), 12);
        assert.equal(evaluator.evalFromString(`(std.Ratio.getM ${r5})`), 9);

        // 检查内存
        assert.deepEqual(evaluator.memory.status(), {
            capacity: 5,
            free: 0,
            used: 5
        });

        // 释放对象
        evaluator.evalFromString(
            `
            (do
                (builtin.memory.dec_ref ${r1})
                (builtin.memory.dec_ref ${r2})
                (builtin.memory.dec_ref ${r3})
                (builtin.memory.dec_ref ${r4})
                (builtin.memory.dec_ref ${r5})
            )`);

        // 检查内存
        assert.deepEqual(evaluator.memory.status(), {
            capacity: 5,
            free: 5,
            used: 0
        });
    }

    static testUnionSubType() {
        let srcFilePath = path.resolve('test', 'resources', 'option.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', srcFilePath);

        // build `let a1 = Option::Some::new(123)`
        let a1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some.new 123))
                (builtin.memory.inc_ref addr)
                addr
            )`);

console.log(evaluator.memory.chunks);
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.getValue ${a1})`), 123)

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

        // Option::Some::equal(a2, a3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a2} ${a3})`), 0);

        // Option::Some::equal(a1, a3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a1} ${a3})`), 1);

        // Option::Some::equal(a1, a1)
        assert.equal(evaluator.evalFromString(
            `(std.Option.Some.equal ${a1} ${a1})`), 1);
    }

    static testUnion() {
        let srcFilePath = path.resolve('test', 'resources', 'option.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', srcFilePath);

        // build `let b1 = Option::Some(11)`
        let b1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some 11))
                (builtin.memory.inc_ref addr)
                addr
            )`
        );

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

        // test getMemberTypeIndex
        assert.equal(evaluator.evalFromString(
            `(std.Option.getMemberTypeIndex ${b1})`), 0);

        assert.equal(evaluator.evalFromString(
            `(std.Option.getMemberTypeIndex ${b4})`), 1);

        // Option::equal(b1, b2)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b2})`), 0);

        // Option::equal(b2, b3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b2} ${b3})`), 0);

        // Option::equal(b1, b3)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b3})`), 1);

        // Option::equal(b1, b1)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b1})`), 1);

        // Option::equal(b1, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b1} ${b4})`), 0);

        // Option::equal(b2, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b2} ${b1})`), 0);

        // Option::equal(b3, b4)
        assert.equal(evaluator.evalFromString(
            `(std.Option.equal ${b3} ${b4})`), 0);

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

    static testStdLibrary() {
        // TestStdLibrary.testStruct();
        TestStdLibrary.testUnionSubType();
        // TestStdLibrary.testUnion();

        console.log('Std library passed');
    }
}

export { TestStdLibrary };