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
        let srcFilePath = path.resolve('test', 'resources', 'node.clj');

        let evaluator = new Evaluator();
        evaluator.loadModuleFromFile('collection', srcFilePath);

        // build:
        // node2(456) --next--> node1(123) --next--> none

        /**
         * `let opt_none = Option::None`
         */

        let opt_none = evaluator.evalFromString(`
            collection.Option.None`
        );

        /**
         * `let node1 = Node::new(123, opt_none)`
         */

        let node1 = evaluator.evalFromString(`
            (do
                (let addr (collection.Node.new 123 ${opt_none}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // check value
        assert.equal(evaluator.evalFromString(
            `(collection.Node.getValue ${node1})`), 123);

        /**
         * build `let opt_1 = Option::Some(node1)`
         */

        let opt_node1 = evaluator.evalFromString(`
            (do
                (let addr (collection.Option.Some ${node1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        /**
         * `let node2 = Node::new(456, opt_node1)`
         */

        let node2 = evaluator.evalFromString(`
            (do
                (let addr (collection.Node.new 456 ${opt_node1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        // check value
        assert.equal(evaluator.evalFromString(
            `(collection.Node.getValue ${node2})`), 456);

        // check Option member type
        assert.equal(evaluator.evalFromString(
            `(collection.Option.getMemberTypeIndex ${opt_node1})`), 0);

        assert.equal(evaluator.evalFromString(
            `(collection.Option.getMemberTypeIndex ${opt_none})`), 1);
    }

    static testCreateList() {
        let evaluator = new Evaluator();

        evaluator.loadModuleFromFile('collection',
            path.resolve('test', 'resources', 'node.clj'));

        evaluator.loadModuleFromFile('collection',
            path.resolve('test', 'resources', 'list.clj'));

        evaluator.loadModuleFromFile('std',
            path.resolve('test', 'resources', 'option.clj'));

        /**
         * 创建一个空列表
         */
        let list1 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.new$1))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${list1})`), 0);

        let optionHead1 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getHead ${list1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (std.Option.getMemberTypeIndex ${optionHead1})`), 1); // std::Option::None

        let rest1 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getRest ${list1}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${rest1})`), 0);

        /**
         * 添加第一个元素：22
         */
        let list2 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.add ${list1} 22))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${list2})`), 1);

        let optionHead2 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getHead ${list2}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (std.Option.getMemberTypeIndex ${optionHead2})`), 0); // std::Option::Some(Int)

        assert.equal(evaluator.evalFromString(
            `
            (std.Option.Some.getValue (std.Option.getMember ${optionHead2}))`), 22);

        let rest2 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getRest ${list2}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${rest2})`), 0);

        /**
         * 添加第二个元素：33
         */
        let list3 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.add ${list2} 33))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${list3})`), 2);

        let head3 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getHead ${list3}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (std.Option.getMemberTypeIndex ${head3})`), 0); // std::Option::Some(Int)

        assert.equal(evaluator.evalFromString(
            `
            (do
                (let some_node_addr (std.Option.getMember ${head3}))
                (std.Option.Some.getValue some_node_addr)
            )`), 33);

        let rest3 = evaluator.evalFromString(
            `
            (do
                (let addr (collection.List.getRest ${list3}))
                (builtin.memory.inc_ref addr)
                addr
            )`);

        assert.equal(evaluator.evalFromString(
            `
            (collection.List.getLength ${rest3})`), 1);

        // check memory
        assert.deepEqual(evaluator.memory.status(), {
            capacity: 14,
            free: 0,
            used: 14
        });

        // drop list1, rest1, list2, rest2 and rest3
        evaluator.evalFromString(
            `
            (do
                (builtin.memory.dec_ref ${list1})
                (builtin.memory.dec_ref ${list2})
                (builtin.memory.dec_ref ${optionHead1})
                (builtin.memory.dec_ref ${optionHead2})
                (builtin.memory.dec_ref ${head3})
                (builtin.memory.dec_ref ${rest1})
                (builtin.memory.dec_ref ${rest2})
                (builtin.memory.dec_ref ${rest3})
            )`);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 14,
            free: 5,
            used: 9
        });

        evaluator.evalFromString(
            `(builtin.memory.dec_ref ${list3})`);

        assert.deepEqual(evaluator.memory.status(), {
            capacity: 14,
            free: 14,
            used: 0
        });
    }

    static testLinkList() {
        // TestLinkList.testCreateNode();
        TestLinkList.testCreateList();
        console.log('Link-list passed');
    }
}

export { TestLinkList };