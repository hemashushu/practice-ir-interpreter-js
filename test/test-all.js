import { TestSLex } from './test-s-lex.js';
import { TestSParser } from './test-s-parser.js';
import { TestEvaluator } from './test-evaluator.js';
import { TestMemory } from './test-memory.js';
import { TestUserDefinedType } from './test-user-defined-type.js';
import { TestStdLibrary } from './test-std-library.js';
import { TestLinkList } from './test-link-list.js';
import { TestAnonymousFunction } from './test-anonymous-function.js';

function testAll() {
    // TestSLex.testSLex();
    // TestSParser.testSParser();
    // TestEvaluator.testEvaluator();
    // TestMemory.testMemory();
    // TestUserDefinedType.testUserDefinedType();
    TestStdLibrary.testStdLibrary();

    // TestLinkList.testLinkList();
    // TestAnonymousFunction.testAnonymousFunction();

    console.log('All passed.');
}

testAll();