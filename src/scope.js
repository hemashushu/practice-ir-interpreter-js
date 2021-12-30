import { IdentifierError } from './identifiererror.js';

/**
 * 作用域，存储局部变量。
 */
class Scope /* implement IContext */ {
    constructor(parentContext) {
        // Scope、Namespace 或者 Closure 实例
        this.parentContext = parentContext;

        // 局部变量表的 key 是标识符本身的名称
        this.identifiers = new Map();
    }

    //     /**
    //      * 更新局部变量的值
    //      * 注意 Scope 一路从用户自定义函数的 Namespace 继承下来，但只有 Scope 里面
    //      * 的标识符才是局部变量。
    //      *
    //      * 返回值本身。
    //      * @param {*} name
    //      * @param {*} value
    //      */
    //     updateIdentifierValue(name, value) {
    //         if (this.identifiers.has(name)) {
    //             this.identifiers.set(name, value);
    //             return value;
    //
    //         }else if (this.parentContext !== null &&
    //             this.parentContext instanceof Scope) {
    //             return this.parentContext.updateIdentifierValue(name, value);
    //
    //         }else {
    //             throw new IdentifierError(
    //                 'IDENTIFIER_NOT_FOUND',
    //                 { name: name },
    //                 `Local identifier "${name}" not found`);
    //         }
    //     }

    /**
     * @param {*} name 标识符的名称
     * @param {*} value 值的可能值有：
     *     - 字面量，即 i32/i64/f32/f64
     *     - 本地函数、内置函数，比如 add/sub，是一个 JavaScript `Function` 对象
     *     - 用户自定义函数，是一个 JavaScript Object，结构：{parameters, bodyExp}
     *     - Closure 对象
     * @returns
     */
    defineIdentifier( name, value) {
        // 在同一个容器内不允许重名的标识符
        if (this.exist(name)) {
            throw new IdentifierError(
                'IDENTIFIER_ALREADY_EXIST',
                { name },
                `Identifier "${name}" has already exists`);
        }

        this.identifiers.set(name, value);
        return value;
    }

    /**
     *
     * @param {*} name 标识符的名称
     * @returns
     */
    exist(name) {
        return this.identifiers.has(name) ||
            // 作用域具有继承关系，所以也需要检查父作用域的局部变量名称
            this.parentContext.exist(name);
    }

    /**
     *
     * @param {*} name 标识符的名称，注：不能传入标识符全称。
     * @returns
     */
    getIdentifier(name) {
        let value = this.identifiers.get(name);
        if (value === undefined) {
            // 作用域具有继承关系，所以也需要检查父作用域的局部变量名称
            return this.parentContext.getIdentifier(name);

        } else {
            return value;
        }
    }
}

export { Scope };