import { strict as assert } from 'assert';

import {
    Evaluator,
    EvalError,
    SyntaxError,
    IdentifierError
} from "../index.js";


class TestMemory {

    static testLiteral() {
        let evaluator = new Evaluator();
        assert.equal(evaluator.evalFromString('123'), 123);
    }

    static testMemory() {
        TestMemory.testLiteral();
    }
}

export { TestMemory };