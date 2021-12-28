const S_LEFT_PAREN = '(';
const S_RIGHT_PAREN = ')';

class SParser {
    static parseList(tokens) {
        let elements = [];

        if (tokens[0] === S_RIGHT_PAREN) {
            return { value: elements, restTokens: tokens.slice(1) };
        }

        while (true) {
            let { value, restTokens } = SParser.parseValue(tokens);

            elements.push(value);

            if (restTokens[0] === S_RIGHT_PAREN) {
                return { value: elements, restTokens: restTokens.slice(1) };
            }

            tokens = restTokens;
        }
    }

    static parseValue(tokens) {
        if (tokens[0] === S_LEFT_PAREN) {
            return SParser.parseList(tokens.slice(1));
        } else {
            let currentToken = tokens[0];
            let shortForm = false;
            let numberString = currentToken;

            // 判断是否为 `123s`, `2.718s` 这种形式的数字
            if (currentToken.endsWith('s')) {
                shortForm = true;
                numberString = currentToken.substring(0, currentToken.length - 1);
            }

            let num = Number(numberString);
            if (Number.isNaN(num)) {
                return { value: currentToken, restTokens: tokens.slice(1) };
            } else {
                // if (shortForm) ... // JavaScript 不支持指定数字数据类型，这里通通使用 Number 来表示。
                return { value: num, restTokens: tokens.slice(1) };
            }
        }
    }

    static parse(tokens) {
        let { value, restTokens } = SParser.parseValue(tokens);
        return value;
    }
}

export { SParser };