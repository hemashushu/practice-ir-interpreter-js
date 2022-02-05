# 内置函数

## 本地函数

        /**
         * i64 算术运算
         *
         * - add 加
         * - sub 减
         * - mul 乘
         * - div_s 除
         * - div_u 无符号除
         * - rem_s 余
         * - rem_u 无符号余
         *
         * i64 位运算
         *
         * - and 位与
         * - or 位或
         * - xor 位异或
         * - shl 位左移
         * - shr_s 位右移
         * - shr_u 逻辑位右移
         *
         * i64 比较运算，条件成立返回 1，不成立返回 0
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt_s 小于，返回 0/1
         * - lt_u 无符号小于，返回 0/1
         * - gt_s 大于，返回 0/1
         * - gt_u 无符号大于，返回 0/1
         * - le_s 小于等于，返回 0/1
         * - le_u 无符号小于等于，返回 0/1
         * - ge_s 大于等于，返回 0/1
         * - ge_u 无符号大于等于，返回 0/1
         *
         */


        /**
         * i32 算术运算
         *
         * - add 加
         * - sub 减
         * - mul 乘
         * - div_s 除
         * - div_u 无符号除
         * - rem_s 余
         * - rem_u 无符号余
         *
         * i32 位运算
         *
         * - and 位与
         * - or 位或
         * - xor 位异或
         * - shl 位左移
         * - shr_s 位右移
         * - shr_u 逻辑位右移
         *
         * i32 比较运算，条件成立返回 1，不成立返回 0
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt_s 小于，返回 0/1
         * - lt_u 无符号小于，返回 0/1
         * - gt_s 大于，返回 0/1
         * - gt_u 无符号大于，返回 0/1
         * - le_s 小于等于，返回 0/1
         * - le_u 无符号小于等于，返回 0/1
         * - ge_s 大于等于，返回 0/1
         * - ge_u 无符号大于等于，返回 0/1
         *
         */

          /**
         * f64 算术运算
         * - add 加
         * - sub 减
         * - mul 乘
         * - div 除
         *
         * f64 比较运算
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt 小于，返回 0/1
         * - gt 大于，返回 0/1
         * - le 小于等于，返回 0/1
         * - ge 大于等于，返回 0/1
         *
         * f64 数学函数
         * - abs 绝对值
         * - neg 取反
         * - ceil 向上取整
         * - floor 向下取整
         * - trunc 截断取整
         * - nearest 就近取整（对应一般数学函数 round）
         * - sqrt 平方根
         */

         /**
         * f32 算术运算
         * - add 加
         * - sub 减
         * - mul 乘
         * - div 除
         *
         * f32 比较运算
         * - eq 等于，返回 0/1
         * - ne 不等于，返回 0/1
         * - lt 小于，返回 0/1
         * - gt 大于，返回 0/1
         * - le 小于等于，返回 0/1
         * - ge 大于等于，返回 0/1
         *
         * f32 数学函数
         * - abs 绝对值
         * - neg 取反
         * - ceil 向上取整
         * - floor 向下取整
         * - trunc 截断取整
         * - nearest 就近取整（对应一般数学函数 round）
         * - sqrt 平方根
         */


        /**
         * - 整数(i32, i64)之间转换
         * - 浮点数（f32, f64）之间转换
         * - 整数(i32, i64)与浮点数（f32, f64）之间转换
         *
         * 部分函数
         *
         * - 整数提升
         *   + i64.extend_i32_s(i32) -> i64
         *   + i64.extend_i32_u(i32) -> i64
         * - 整数截断
         *   + i32.wrap(i64) -> i32
         *
         * - 浮点数精度提升
         *   + f64.promote(f32) -> f32
         *
         * - 浮点数精度下降
         *   + f32.demote(f64) -> f32
         *
         * - 浮点转整数
         *   + i32.trunc_f32_s (f32) -> i32
         *   + i32.trunc_f32_u (f32) -> i32
         *   + i64.trunc_f32_s (f32) -> i64
         *   + i64.trunc_f32_u (f32) -> i64
         *
         *   + i32.trunc_f64_s (f64) -> i32
         *   + i32.trunc_f64_u (f64) -> i32
         *   + i64.trunc_f64_s (f64) -> i64
         *   + i64.trunc_f64_u (f64) -> i64
         *
         * - 整数转浮点
         *   + f32.convert_i32_s (i32) -> f32
         *   + f32.convert_i32_u (i32) -> f32
         *   + f64.convert_i32_s (i32) -> f64
         *   + f64.convert_i32_u (i32) -> f64
         *
         *   + f32.convert_i64_s (i64) -> f32
         *   + f32.convert_i64_u (i64) -> f32
         *   + f64.convert_i64_s (i64) -> f64
         *   + f64.convert_i64_u (i64) -> f64
         *
         */


函数分布在 `native.memory` 名称空间内。

读取数据的函数：

- `i32 i32_read_8s(int addr, i32 byte_offset)`
- `i32 i32_read_8u(int addr, i32 byte_offset)`
- `i32 i32_read_16s(int addr, i32 byte_offset)`
- `i32 i32_read_16u(int addr, i32 byte_offset)`
- `i32 i32_read(int addr, i32 byte_offset)`

- `i64 i64_read_8s(int addr, i32 byte_offset)`
- `i64 i64_read_8u(int addr, i32 byte_offset)`
- `i64 i64_read_16s(int addr, i32 byte_offset)`
- `i64 i64_read_16u(int addr, i32 byte_offset)`
- `i64 i64_read_32s(int addr, i32 byte_offset)`
- `i64 i64_read_32u(int addr, i32 byte_offset)`
- `i64 i64_read(int addr, i32 byte_offset)`

- `f32 f32_read(int addr, i32 byte_offset)`
- `f64 f64_read(int addr, i32 byte_offset)`

写入数据的函数：

- `i32 i32_write_8(int addr, i32 byte_offset, i32 val)`
- `i32 i32_write_16(int addr, i32 byte_offset, i32 val)`
- `i32 i32_write(int addr, i32 byte_offset, i32 val)`

- `i64 i64_write_8(int addr, i32 byte_offset, i64 val)`
- `i64 i64_write_16(int addr, i32 byte_offset, i64 val)`
- `i64 i64_write_32(int addr, i32 byte_offset, i64 val)`
- `i64 i64_write(int addr, i32 byte_offset, i64 val)`

- `f32 f32_write(int addr, i32 byte_offset, f32 val)`
- `f64 f64_write(int addr, i32 byte_offset, f64 val)`

## 基础函数
        * 逻辑运算
        * 约定 0 为 false，1 为 true，内部使用位运算实现。
        * - and 逻辑与，返回 0/1
        * - or 逻辑或，返回 0/1
        * - not 逻辑非，返回 0/1

builtin.logic.and
builtin.logic.or
builtin.logic.not

builtin.io.print_i32(i32)
builtin.io.print_i64(i64)
builtin.io.print_f32(f32)
builtin.io.print_f64(f64)

向 stdout 流写一个字符
builtin.io.putchar(i32)

从 stdio 流中读取一个字符
builtin.io.getchar() -> i32  // 注意在某些环境里不一定实现

从 stdio 流中读取一行字符，返回结果不包括行尾的 '\n' 字符，但会多加一个 '\0' 字符。
builtin.io.gets() -> byte chunk

向 stdout 写字符串结构体的内容，然后写一个换行符
std.string.puts(*string)

std.string.gets() -> *string struct


builtin.panic(int)


builtin.type.lookup (int, :name)
查找指定数据类型名字为 `name` 的方法。用于调用动态数据类型（即特性类型的用户自定义数据）绑定的函数。

## builtin.memory
: 见内存管理一章

