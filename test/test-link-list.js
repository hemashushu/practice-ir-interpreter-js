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
        let srcFilePath = path.resolve('test', 'resources', 'list.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('std', srcFilePath);

        // build:
        // node2(456) --next--> node1(123) --next--> none

        /**
         * `let opt_none = Option::None`
         */

        let opt_none = evaluator.evalFromString(`
            std.Option.None`
        );

        /**
         * `let node1 = Node::new(123, opt_none)`
         */

        let node1 = evaluator.evalFromString(`
            (do
                (let addr (std.Node.new 123 ${opt_none}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // check value
        assert.equal(evaluator.evalFromString(
            `(std.Node.getValue ${node1})`), 123);

        /**
         * build `let opt_1 = Option::Some(node1)`
         */

        let opt_node1 = evaluator.evalFromString(`
            (do
                (let addr (std.Option.Some ${node1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        /**
         * `let node2 = Node::new(456, opt_node1)`
         */

        let node2 = evaluator.evalFromString(`
            (do
                (let addr (std.Node.new 456 ${opt_node1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // check value
        assert.equal(evaluator.evalFromString(
            `(std.Node.getValue ${node2})`), 456);




    }

    static testLinkList() {
        TestLinkList.testCreateNode();

        console.log('Link-list passed');
    }
}

export { TestLinkList };