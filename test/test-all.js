import { TestJsonLex } from './test-json-lex.js';
import { TestJsonParser } from './test-json-parser.js';
import { TestSLex } from './test-s-lex.js';
import { TestSParser } from './test-s-parser.js';
import { TestEvaluator } from './test-evaluator.js';
import { TestMemory } from './test-memory.js';

function testAll() {
    // TestJsonLex.testJsonLex();
    // TestJsonParser.testJsonParser();
    // TestSLex.testSLex();
    // TestSParser.testSParser();
    // TestEvaluator.testEvaluator();

    TestMemory.testMemory();
    console.log('All passed.');
}

testAll();