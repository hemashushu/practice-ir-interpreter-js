# 结构体及内存

本地结构体有两种类型，一个是 bytes 数组，另一个是自定义结构体，它们的内存布局相同，如下：

<!-- * int type 数据类型
  值为数据类型表的索引值。
  其中有5种基本类型（虚拟机直接支持的类型）bytes（字节数组）/i32/i64/f32/f64/，类型值分别为 0,1,2,3,4。
  其他的都是用户自定义类型，也就是结构体，类型值为 5。 -->
  <!--
  当结构体为基本类型时，addrs 只有一个元素，其值为指向值的内存地址（对于数组则指向数组的开始位置，即第一个字节的地址）
  当结构体有多个成员时，addrs 是各个成员（也是结构体）的在内存中的地址。
  -->

<!--
* int length 当前数据的大小
  实际数据的字节数，不包括本地结构体的头字段
  对于 bytes 其值为数组实际长度
  对于结构体，则为成员的个数之和 * 8，因为结构体的每个成员的值都由一个 8 bytes 组成（成员有可能是 i32/i64/f32/f64 的任一一个，或者指向实际内存地址）
-->
* int32 ref 数据被引用的计数值
  当一个结构体的引用计数为 0 时，会让所有其引用的结构体的计数值减少 1，然后销毁自己。
* int32 count 成员的数量，当结构体为数组时，成员数量为 0
* int32 mark 成员的类型，从最低位开始，每一位表示一个成员是基本类型（0）还是自定义类型（1），显然一个自定义机构体最多只能有32个成员。
* byte[] data 数组的原始数据
  [byte[8], byte[8], ... byte[8]] data，结构体各成员的数值，每一个成员占 8 bytes

<!--
自定义结构体 "成员数据类型表"，这张表的结构如下：

* int count 成员的数量
* int[] dataTypes 各成员在 "成员数据类型表" 中的索引，如果是 0 则表示基本数据类型或者数组。

"成员数据类型表" 应该初始化第 0 条记录为一条占位记录，以让自定义数据的类型的索引值从 1 开始（0 表示数组）。
-->

注，本地结构体并没有固定的实现方法，解析器或编译器可以自己实现。如果内存完全有运行环境管理，可能还需要另外一张内存分配表（可能是一棵平衡树）：

* int addr
* int size 本地结构体的内容长度（包括头和数据）
* int capacity 当前本地结构体占用的空间，因为对齐关系，实际分配空间并不一定会刚好等于本地结构体的内容长度。

因为 XiaoXuan 不允许结构体循环引用，只需计算引用数即可实现资源回收，所以引用计数值直接写在本地结构体里，而不是写在分配表里。

bytes 数据的本地结构体示例：

```js
{ref: 1, count: 0, mark: 0, data: [byte 0, byte 1,..., byte N]}
```

XiaoXuan 结构体数据对应的本地结构体示例 1：

```c
struct Point {
    Int x
    Int y
}
```

```js
{
    ref: 1,
    count: 2,
    mark: 0b11,
    data: [(i64 x),(i64 y)]
}
```

XiaoXuan 结构体数据对应的本地结构体示例 2：

```c
struct Rect {
    Point topLeft
    Point bottomRight
}
```

```js
{
    ref: 1,
    count: 2,
    mark: 0b11,
    data: [(addr of topLeft), (addr of bottomRight)]
}
```

IR 不提供直接内存读写的操作，转而通过内置的内存读写函数实现，这样可以为解析器或者编译器带来灵活，比如解析器可以使用宿主环境现有的内存管理器，而编译器到 WASM 或者本地代码，只需将内存读写函数调用替换成内联代码即可。

::TODO

创建结构体的本地方法：

<!--
* create_i32(i32) 分配 4 个字节空间，并写入 i32 值，然后返回该结构体（i32 类型）的地址 int
* create_i64(i64) 分配 8 个字节空间，并写入 i64 值，然后返回该结构体（i64 类型）的地址 int
* create_f32(f32) 分配 4 个字节空间，并写入 f32 值，然后返回该结构体（f32 类型）的地址 int
* create_f64(f64) 分配 8 个字节空间，并写入 f64 值，然后返回该结构体（f64 类型）的地址 int
-->

* create_bytes(int bytes_length) 分配一个字节数组，内容不初始化，然后返回该结构体（bytes 类型）的地址 int
* create_bytes_zero(int bytes_length) 分配一个字节数组，初始化为 0 ，然后返回该结构体（bytes 类型）的地址 int
<!-- * create_bytes_copy(int addr, int length) 外部程序事先把内容写入内存，然后再使用这个函数 “包装” 成一个字节数组结构体。然后返回该结构体（bytes 类型）的地址 int -->

* create_struct(int count) 分配一个结构体内存空间，其中 count 为 成员个数

修改结构体引用计数的方法：

* inc_ref(addr) 增加一个结构体的引用计数，结构体在创建之初，其引用值为 1。返回更新后的引用计数 int
    // 仅当将一个结构体赋值给另外一个变量时（包括传参时）才需要调用这个以增加引用计数。
    // 新建结构体的默认引用计数值为 1， 所以不需要调用这个方法
* dec_ref(addr) 减少一个结构体的引用计数。注意当一个结构体的引用计数为 0 时，它所引用的全部结构体的引用数会自动被减去 1，然后回收结构体本身的内存。返回更新后的引用计数 int

读取结构体成员地址的方法

<!--
* read_member_addr(addr, offset) 获取 addr 指向的结构体的各个成员的地址
-->

读取本地结构体成员的数据，其中 offset 是相对 data 开始地址的偏移值，一般是 8 的整数倍

* i32_read(int addr, int32 byte_offset)
* i64_read(int addr, int32 byte_offset)

* f32_read(int addr, int32 byte_offset)
* f64_read(int addr, int32 byte_offset)

* read_address(int addr, int32 member_index)

* i32_write(int addr, int32 byte_offset, i32 val)
* i64_write(int addr, int32 byte_offset, i64 val)
* f32_write(int addr, int32 byte_offset, f32 val)
* f64_write(int addr, int32 byte_offset, f64 val)

* write_address(int addr, int32 member_index, int target_addr)

## 附 WASM VM 的读写内存方法

写入内存的本地方法：

在 `native` 命名空间之内

* i32.store(addr) 写入 addr 地址内存 4 个字节
* // TODO:: i32.store_16(addr) (原数据是 i32，写入 addr 地址内存 2 个字节)
* // TODO:: i32.store_8(addr) (原数据是 i32，写入 addr 地址内存 1 个字节)
* i64.store(addr) 写入 addr 地址内存 8 个字节
* // TODO:: i64.store_32(addr) (原数据是 i64，写入 addr 地址内存 4 个字节)
* // TODO:: i64.store_16(addr) (原数据是 i64，写入 addr 地址内存 2 个字节)
* // TODO:: i64.store_8(addr) (原数据是 i64，写入 addr 地址内存 1 个字节)
* f32.store(addr) 写入 addr 地址内存 4 个字节
* f64.store(addr) 写入 addr 地址内存 8 个字节

读取内存数据的本地方法：

在 `native` 命名空间之内

* i32.load(addr) 读取 addr 地址内存中的 4 个字节，并返回 i32 值
* // TODO:: i32.load16_s(addr) 读取 addr 地址内存中的 2 个字节，并返回 i32 值
* // TODO:: i32.load16_u(addr) 读取 addr 地址内存中的 2 个字节，并返回 i32 值
* // TODO:: i32.load8_s(addr) 读取 addr 地址内存中的 1 个字节，并返回 i32 值
* // TODO:: i32.load8_u(addr) 读取 addr 地址内存中的 1 个字节，并返回 i32 值
* i64.load(addr) 读取 addr 地址内存中的 8 个字节，并返回 i64 值
* // TODO:: i64.load32_s(addr) 读取 addr 地址内存中的 4 个字节，并返回 i64 值
* // TODO:: i64.load32_u(addr) 读取 addr 地址内存中的 4 个字节，并返回 i64 值
* // TODO:: i64.load16_s(addr) 读取 addr 地址内存中的 2 个字节，并返回 i64 值
* // TODO:: i64.load16_u(addr) 读取 addr 地址内存中的 2 个字节，并返回 i64 值
* // TODO:: i64.load8_s(addr) 读取 addr 地址内存中的 1 个字节，并返回 i64 值
* // TODO:: i64.load8_u(addr) 读取 addr 地址内存中的 1 个字节，并返回 i64 值
* f32.load(addr) 读取 addr 地址内存中的 4 个字节，并返回 f32 值
* f64.load(addr) 读取 addr 地址内存中的 8 个字节，并返回 f64 值
