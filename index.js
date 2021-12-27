/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021 Hippospark <Hippospark@gmail.com>, All rights reserved.
 */

import { JsonLex } from './src/json-lex.js';
import { JsonParser } from './src/json-parser.js';

import { SLex } from './src/s-lex.js';
import { SParser } from './src/s-parser.js';

import { EvalError } from './src/evalerror.js';
import { SyntaxError } from './src/syntexerror.js';
import { IdentifierError } from './src/identifiererror.js';

import { UserDefineFunction } from './src/user-define-function.js';
import { AnonymousFunction } from './src/anonymous-function.js';
import { RecursionFunction } from './src/recursion-function.js';

import { Environment } from './src/environment.js';
import { AbstractContext } from './src/abstractcontext.js';
import { Namespace } from './src/namespace.js';
import { Scope } from './src/scope.js';

import { Chunk } from './src/chunk.js';
import { Memory } from './src/memory.js';

import { Evaluator } from './src/evaluator.js';

export {
    JsonLex,
    JsonParser,
    SLex,
    SParser,

    EvalError,
    SyntaxError,
    IdentifierError,

    UserDefineFunction,
    AnonymousFunction,
    RecursionFunction,

    Environment,
    AbstractContext,
    Namespace,
    Scope,

    Chunk,
    Memory,

    Evaluator,
};