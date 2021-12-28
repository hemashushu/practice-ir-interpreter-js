import { strict as assert } from 'assert';
import path from 'path';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";

class TestLinkList {

    static testCreateNode() {
        let optionFilePath = path.resolve('test', 'resources', 'list.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', optionFilePath);

        /**
         * build `let opt_none = Option::None`
         */

        let opt_none = evaluator.evalFromString(`
            std.Option.None`
        );

        // check mark
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${opt_none} 0)`), 0);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${opt_none} 1)`), 0);

        // check internal value
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.i64_read ${opt_none} 0)`), 1);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.i64_read ${opt_none} 8)`), 0);

        /**
         * build `let node1 = Node::new(123, opt_none)`
         */

        let node1 = evaluator.evalFromString(`
            (do
                (let addr (std.Node.new 123 ${opt_none}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // check value
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.i64_read ${node1} 0)`), 123);

        // check mark
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${node1} 0)`), 0);

        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_mark ${node1} 1)`), 1);

        // check internal value
        assert.equal(evaluator.evalFromString(
            `(builtin.memory.read_address ${node1} 1)`), opt_none);

        /**
         * build `let opt_1 = Option::Some(node1)`
         */

        let opt_1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some ${node1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);


        // // build `let op2 = Option::new(n1)`
        // let op2 = evaluator.evalFromString(`
        //     (do
        //         (let addr (std.Option.new ${n1}))
        //         (builtin.memory.inc_ref addr)
        //         addr
        //     )`);

    }

    static testLinkList() {
        // TestLinkList.testCreateNode();

        console.log('Link-list passed');
    }
}

export { TestLinkList };