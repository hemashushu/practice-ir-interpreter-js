# 用户自定义数据及内存管理

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [用户自定义数据及内存管理](#用户自定义数据及内存管理)
  - [本地结构体](#本地结构体)
  - [本地结构体示例](#本地结构体示例)
  - [数据的管理](#数据的管理)
    - [分配数据内存](#分配数据内存)
    - [读写数据的内容](#读写数据的内容)
    - [修改数据的引用计数](#修改数据的引用计数)
  - [资源回收](#资源回收)

<!-- /code_chunk_output -->

XiaoXuan Lang 的所有自定义数据类型（包括枚举、结构体、联合体）都会被转换为命名空间和结构体，然后在进一步转换为 XiaoXuan IR 里的用户自定义数据和函数，也就是说，在 XiaoXuan IR 里已经完全没有 XiaoXuan Lang 的自定义数据类型的信息。

XiaoXuan IR 的所有用户自定义数据都在内存的 "堆" 中分配，用户自定义数据的赋值、传参、返回都是传递数据在内存中的地址，类似其他编程语言的 `按引用传递`。相对的，基本数据类型的赋值、传参、返回都是直接复制。

## 本地结构体

XiaoXuan IR 的用户自定义数据使用一个本地结构体（native struct）在内存表示，该本地结构体的结构如下：

* i32 ref

  数据的引用计数值，用于表示当前数据被引用的次数。
  当一个数据引用计数为 0 时，会遍历其所有引用的用户自定义数据，然后把它们的引用计数值都减少 1，最后这个数据的资源会被回收。

* i32 count

  用户自定义数据成员的数量，当数据为一个 `字节数组` 时，成员数量为 0。

* i32 mark

  成员的类别，从最低位开始，每一位表示一个成员是基本数据类型（0）还是用户自定义数据（1）
  因为这个字段是使用 i32 存储，所以一个用户自定义数据最多只能有 32 个成员。

* i8[] data

  - 当数据是一个 `字节数组` 时，该字段就是数组的原始数据 [i8, i8, ... i8]；

  - 当数据是一个 `多成员结构` 时，该字段是各成员的数值，每一个成员占 8 bytes [i8[8], i8[8], ... i8[8]]。

    也就是说，无论该成员是 i8，i16，i32, i64, f32 还是 f64，都占用 8 bytes。如果某个成员是指向另外一个用户自定义数据，则该成员值将会是该数据的内存地址，也就是一个 int 类型的数值。

需注意的是，本地结构体并没有固定的实现方法，解析器或编译器可以自己实现，上面只是给出一种最简单的实现方法。

如果内存完全由运行时（runtime）来管理，可能还需要一张内存分配表，这张表的大致结构如下：

* int addr

  数据的内存地址

* int size

  本地结构体的内容总长度（包括各字段和数据）

* int capacity

  本地结构体占用的空间，因为地址对齐及重复利用的原因，实际分配空间并不一定会刚好等于本地结构体的内容长度。

考虑到 XiaoXuan Lang 不允许结构体循环引用，所以只需简单地使用数据的引用计数法即可实现资源回收，所以可以把引用计数值直接写在本地结构体里，而不是写在内存分配表里。

需再强调的是，上述的方法只是一个参考实现。

## 本地结构体示例

当用户自定义数据是一个字节数组是，本地结构体的内容如下：

```js
{ref: 0, count: 0, mark: 0, data: [byte 0, byte 1,..., byte N]}
```

当用户自定义数据是多成员结构时，本地结构体的内容如下：

```c
// XiaoXuan code
struct Point {
    Int x
    Int y
}
```

```js
// native structure
{
    ref: 0,
    count: 2,
    mark: 0,
    data: [i64, i64]
}
```

当数据的成员引用其他数据时，本地结构体的内容如下：

```c
// XiaoXuan code
struct Rect {
    Point topLeft
    Point bottomRight
}
```

```js
// native structure
{
    ref: 0,
    count: 2,
    mark: 0b11,
    data: [(addr of topLeft), (addr of bottomRight)]
}
```

## 数据的管理

XiaoXuan IR 不支持内存的直接读写，只能通过内置的函数来读写 `用户自定义数据`（以下简称为 `数据`）。这样可以为解析器和编译器带来灵活性，比如解析器可以使用宿主运行时现有的内存管理器，而编译器到 WASM Bytecode 或者本地代码，只需将内存读写函数调用替换成内联代码即可。

### 分配数据内存

* `int create_bytes(int bytes_length)`

  创建一个 `字节数组` 类型的本地结构体，内存的内容不会被初始化，函数返回该结构体在内存中的地址。

* `int create_bytes_zero(int bytes_length)`

  跟 `create_bytes` 类似，但会将内存的内容初始化为 `0`。

* `int create_struct(int count)`

  创建一个 `多成员结构` 的本地结构体，其中 count 为成员个数，函数返回该结构体在内存中的地址。

### 读写数据的内容

读取数据的函数：

* `i32 i32_read_8s(int addr, i32 byte_offset)`
* `i32 i32_read_8u(int addr, i32 byte_offset)`
* `i32 i32_read_16s(int addr, i32 byte_offset)`
* `i32 i32_read_16u(int addr, i32 byte_offset)`
* `i32 i32_read(int addr, i32 byte_offset)`

* `i64 i64_read_8s(int addr, i32 byte_offset)`
* `i64 i64_read_8u(int addr, i32 byte_offset)`
* `i64 i64_read_16s(int addr, i32 byte_offset)`
* `i64 i64_read_16u(int addr, i32 byte_offset)`
* `i64 i64_read_32s(int addr, i32 byte_offset)`
* `i64 i64_read_32u(int addr, i32 byte_offset)`
* `i64 i64_read(int addr, i32 byte_offset)`

* `f32 f32_read(int addr, i32 byte_offset)`
* `f64 f64_read(int addr, i32 byte_offset)`

写入数据的函数：

* `i32 i32_write_8(int addr, i32 byte_offset, i32 val)`
* `i32 i32_write_16(int addr, i32 byte_offset, i32 val)`
* `i32 i32_write(int addr, i32 byte_offset, i32 val)`

* `i64 i64_write_8(int addr, i32 byte_offset, i64 val)`
* `i64 i64_write_16(int addr, i32 byte_offset, i64 val)`
* `i64 i64_write_32(int addr, i32 byte_offset, i64 val)`
* `i64 i64_write(int addr, i32 byte_offset, i64 val)`

* `f32 f32_write(int addr, i32 byte_offset, f32 val)`
* `f64 f64_write(int addr, i32 byte_offset, f64 val)`

上述函数中，`addr` 参数是目标数据的本地结构体的内存地址，`byte_offset` 是字节偏移量。对于 `多成员结构` 的数据来说，因为每个成员都占用 8 bytes，所以 `byte_offset` 应该是 8 的整数倍，具体来说，是 `成员的索引 * 8`。

### 修改数据的引用计数

* `i32 inc_ref(int addr)`

  增加数据引用计数值，返回更新后的引用计数值。
  当将一个数据赋值给另外一个变量时（包括传参）需要调用这个函数以增加引用计数。

  新建数据的默认引用计数值为 0，所以 XiaoXuan Lang 的一条 `let` 语句，实际上在 IR 里调用了 `create_struct` （或 `create_bytes`）以及 `inc_ref` 一共 2 个函数共同完成。

* `i32 add_ref(int addr, i32 member_index, int ref_addr)`

  将 "被引用的数据" 的地址写入到指定数据的指定成员，并增加 "被引用的数据" 的引用计数值，返回 "被引用的数据" 更新后的引用计数值。

  注意在创建具有多层结构的数据时，在内层的数据创建之后，不需要单独调用 `inc_ref` 函数增加其计数值，而应该使用 `add_ref` 将内层数据链接到到外层数据。

* `i32 read_mark(int addr, i32 member_index)`

  读取指定成员的标记，如果指定的成员是一个基本数据类型，则返回 0，如果是一个数据地址，则返回 1。

* `int read_address(int addr, i32 member_index)`

  读取指定成员的地址值。

* `i32 dec_ref(int addr)`

  减少结构体的引用计数值，返回更新后的引用计数值。

  当一个用户自定义数据类型的变量生命周期结束后（即指令运行到变量有效范围最后一行），需调用这个方法以减少数据的引用计数值。当一个数据引用计数为 0 时，会遍历其所有引用的用户自定义数据，然后把它们的引用计数值都减少 1，最后这个数据的资源会被回收。

## 资源回收

::TODO 各种语句的回收模式，比如 let 语句，set 语句，函数参数

:: 函数参数名称的约定： 基本类型 name，自定义类型 *name， 函数类型 #name

:: hook 回收方法，即如何实现 drop trait

:: 匿名函数的表示和回收方法

`fn (arg1 arg2) (copy_identifier1 copy_identifer2) (ref_identifier1 ref_identifier2) (func_body)`

