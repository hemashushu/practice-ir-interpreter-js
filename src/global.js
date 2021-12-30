import { IdentifierError } from './identifiererror.js';

/**
 * 全局表，存储所有用户自定义函数和常量。
 *
 * 全局表不是 Context，虽然方法名称相同，但参数（及其意义）不同。
 */
class Global {
    constructor() {
        // 全局表的 key 是标识符的全称（即包括命名空间的名称）
        this.identifiers = new Map();
    }

    /**
     * @param {*} fullPath 标识符所在的名称空间
     * @param {*} name 标识符的名称
     * @param {*} value 值的可能值有：
     *     - 字面量，即 i32/i64/f32/f64
     *     - 本地函数、内置函数，比如 add/sub，是一个 JavaScript `Function` 对象
     *     - 用户自定义函数，是一个 JavaScript Object，结构：{parameters, bodyExp}
     * @returns
     */
    defineIdentifier(fullPath, name, value) {
        // 在同一个容器内不允许重名的标识符

        let fullName = fullPath + '.' + name;
        if (this.exist(fullName)) {
            throw new IdentifierError(
                'IDENTIFIER_ALREADY_EXIST',
                { name: fullName },
                `Identifier "${fullName}" has already exists`);
        }

        this.identifiers.set(fullName, value);
        return value;
    }

    exist(fullName) {
        return this.identifiers.has(fullName);
    }

    getIdentifier(fullName) {
        let value = this.identifiers.get(fullName);
        if (value === undefined) {
            throw new IdentifierError(
                'IDENTIFIER_NOT_FOUND',
                { name: fullName },
                `Identifier "${fullName}" not found`);

        } else {
            return value;
        }
    }
}

export { Global };