# 内置函数

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


builtin.memory
: 见内存管理一章