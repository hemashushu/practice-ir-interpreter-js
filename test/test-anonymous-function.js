import { strict as assert } from 'assert';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";

class TestAnonymousFunction {

    static testAnonymousFunction() {
        let evaluator = new Evaluator();

        // test invoke anonymous function directly
        // 语法约束不再支持这样的写法
        // assert.equal(evaluator.evalFromString(
        //     `((fn (i) (native.i64.mul i 3)) 9)`
        // ), 27);

        // test assign an anonymous function to a variable
        assert.equal(evaluator.evalFromString(
            `
            (do
                (let f (fn (i) () () (native.i64.mul i 3)))
                ;; (builtin.memory.inc_ref f)
                (f 7)
                ;; (builtin.memory.dec_ref f)
            )`
        ), 21);

        // 在普通函数里定义匿名函数
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn foo (i)
                (do
                    (let bar (fn () (i) () 3))
                    ;; (builtin.memory.inc_ref bar)
                    (let result (native.i64.add i (bar)))
                    ;; (builtin.memory.dec_ref bar)
                    result
                )
            )
            (foo 2)`
        ), 5);

        // test anonymous function as return value
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn makeInc
                (much)
                (fn (base) (much) () (native.i64.add base much))
            )

            (do
                (let incTwo (makeInc 2))
                ;; (builtin.memory.inc_ref incTwo)
                (let result (incTwo 6))
                ;; (builtin.memory.dec_ref incTwo)
                result
            )`
        ), 8);

        // test anonymous function as arg
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn execFun
                (i f)
                (f i)
            )
            (do
                (let pf (fn (i) () () (native.i64.mul i 2)))
                ;; (builtin.memory.inc_ref pf)
                (let result (execFun 3 pf))
                ;; (builtin.memory.dec_ref pf)
                result
            )
            `
        ), 6);

        // test loop by anonymous function recursion
        assert.equal(evaluator.evalFromStringMultiExps(
            `
            (defn accumulate (count)
                (do
                    (let internalLoop
                        (fn (i result) () ()
                            (if (native.i64.eq i 0)
                                result
                                (internalLoop (native.i64.sub i 1) (native.i64.add i result))
                            )
                        )
                    )
                    ;; (builtin.memory.inc_ref internalLoop)
                    (let result (internalLoop count 0))
                    ;; (builtin.memory.dec_ref internalLoop)
                    result
                )
            )
            (accumulate 100)
            `
        ), 5050);

        console.log('Anonymous function passed');
    }

}

export { TestAnonymousFunction };
