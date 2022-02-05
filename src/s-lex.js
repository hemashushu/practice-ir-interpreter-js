/**
 * IR 的 `S-表达式` 文本示例：
 *
 * ; 行注释
 *
 * ; 一句表达式由一对括号组成，表达式内各部分用空格分隔
 * (add 1 2)                    ; 标识符和数字字面量
 * (data string "hello world")  ; 字符串字面量
 * (mul 1.0 6.626e-34)          ; 浮点数字面量
 *
 * ; 表达式可嵌套
 * (do (add 1 2) (div 4 2))
 *
 * ; 多行表达式
 * (if -1
 *     (print_i64 33)
 *     (print_i64 34)
 *     )
 *
 * ; 数据类型
 * (let x 123s)         ; 在标识符后面加上冒号，冒号后面的内容为数据类型的名称
 *
 * (defn inc:i32 (x:i32)    ; 函数返回值的数据类型，参数的数据类型
 *      (add x 1)
 * )
 *
 * ; 元组
 * (let [i, j] [1, 2])
 *
 * (defn swap:[i64 i64]     ; 返回值为元组
 *      ([i:i64, j:i64])    ; 元组作为形参
 *      ([j, i])            ; 元组作为返回值
 * )
 *
 * (let [m, n]
 *      swap([2, 8]))       ; 元组作为实参
 *
 * ; 注：元组不支持嵌套
 *
 * ; 标识符的操作符
 *
 * (let s:int #hello)       ; # 操作符表示引用名为 `hello` 的只读数据
 * (map data $foo)          ; $ 操作符表示引用名为 `foo` 的函数
 * (let i %c.x)             ; % 操作符表示访问闭包的成员的值
 */

const S_LEFT_PAREN = '(';
const S_RIGHT_PAREN = ')';

const S_PUNCTUATIONS = [
    S_LEFT_PAREN,
    S_RIGHT_PAREN,
];

const S_WHITESPACE = [' ', '\t', '\n', '\r'];
const S_NUMBER_PREFIX = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const S_NUMBER_CONTENT = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 'e', '-', 'i', 'f'];

const S_COMMENT = ';';
const S_EOL = '\n';



class SLex {
    static fromString(str) {
        let tokens = [];
        while (str.length > 0) {
            // 跳过空格
            if (SLex.oneOf(str[0], S_WHITESPACE)) {
                str = str.slice(1);
                continue;
            }

            // 跳过行注释
            if (str[0] === S_COMMENT) {
                let pos;
                for (let idx = 0; idx < str.length; idx++) {
                    if (str[idx] === S_EOL) {
                        pos = idx + 1;
                        break;
                    }
                }

                if (pos === undefined) {
                    pos = str.length;
                }

                str = str.slice(pos);
                continue;
            }

            // 左括号和右括号
            if (SLex.oneOf(str[0], S_PUNCTUATIONS)) {
                tokens.push(str[0]);
                str = str.slice(1);
                continue;
            }

            // 数字字面量


            // s symbol
            let { sSymbol, restString: restAfterSymbol } = SLex.lexSymbol(str);
            if (sSymbol !== undefined) {
                tokens.push(sSymbol);
                str = restAfterSymbol;
                continue;
            }

            throw new Error(`Invalid char ${str[0]}`);
        }

        return tokens;
    }

    static

    static lexSymbol(str) {
        for (let idx = 0; idx < str.length; idx++) {
            let nextChar = str[idx];
            if (SLex.oneOf(nextChar, S_WHITESPACE) ||
                nextChar === S_RIGHT_PAREN ||
                nextChar === S_COMMENT) {
                let sSymbol = str.substring(0, idx);
                let restString = str.substring(idx);
                return { sSymbol, restString };
            }
        }

        return { sSymbol: str, restString: '' };
    }

    static oneOf(char, array) {
        return array.includes(char);
    }
}

export { SLex };