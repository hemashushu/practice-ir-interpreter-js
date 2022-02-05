# 数据结构

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [数据结构](#数据结构)
  - [本地结构体](#本地结构体)
  - [本地结构体示例](#本地结构体示例)
  - [数组](#数组)
    - [字符串 String](#字符串-string)
    - [传统字符串 CString （::TODO 未定）](#传统字符串-cstring-todo-未定)
  - [特性类型参数](#特性类型参数)
  - [函数类型参数与闭包](#函数类型参数与闭包)
  - [闭包](#闭包)

<!-- /code_chunk_output -->

Lang 的枚举和联合体会被转换为命名空间和结构体，所以 Lang 所有用户自定义数据类型其实都是用结构体表示，而结构体来到 IR 之后会被转换相应的 `用户自定义数据` 和 `用户自定义函数`，也就是说，在 IR 里已经完全没有 Lang 的自定义数据类型的信息。

IR 的 `用户自定义数据` 使用一个本地结构体（native struct）来存储到内存的 "堆" 中，受 `资源回收器`（GC，garbage collection）管理。`用户自定义数据` 的赋值、传参、返回都是传递该本地结构体在内存中的地址，类似其他编程语言的 `按引用传递`（相对的，基本数据类型的赋值、传参、返回都是直接复制）；当 `用户自定义数据` 传递给其他线程时，则是深度复制。

IR 使用 `int` 类型存储本地结构体（以下简称为 `对象`）的内存地址（也叫指针），这个内存地址对应上层语言（比如 Lang）来说就是结构体的 `实例`（instance），比如函数 `Point::new(Int x, Int y) -> Point` 的返回值是类型 `Point` 的实例，转换成 IR 的时候，这个函数的返回值是一个内存地址。

简单来说，IR 的对象的内存地址，就是上层语言的用户自定义数据的实例。

Lang 在编译过程中会经过多个 `解构`（Decomposition，就是将各种高级特性和语法糖解构为最基本的语言） 阶段再转译为 IR，在解构过程中，无可避免地会使用到一种能装载任何数据类型实例的类型，为此准备了一种叫 `Any` 的数据类型，它可以跟任意数据类型相互转换，实际上就是为了让编译器跳过类型检查，它用来装载对象的指针，最后会被转译为 IR 的 `int` 类型。

## 本地结构体

IR 本地结构体的结构如下：

- i32 ref

  对象的引用计数值，用于表示当前对象被引用的次数。

  当一个对象引用计数为 0 时，会遍历其所有引用的对象（`子对象`），然后把它们的引用计数值都减少 1，最后这个对象会被资源回收。

- i32 type

  对象的类型，目前有 3 种：`多成员结构体`（1）、`字节数组`（2）、`匿名函数闭包`（4）。

  当多成员结构体带有 `析构函数` 时，数值的 **第 5 位（从 0 开始数）** 会被置为 1，所以带有析构函数的多成员结构体的 type 值为（2^7 & 1 = 128 + 1 = 129）。

  当结构体整体不受资源回收管理时，数值的 **第 6 位（从 0 开始数）** 会被置为 1。比如位于程序只读数据段的数据（比如字符串字面量）

  当结构体指向的外部数据时，（外部数据不受资源回收管理， 即外部数据占用的空间不回收，一般是由外部程序将 C 风格字符串包装为 CString，或者将外部的 C 风格的结构体包装为 IR 结构体时产生的），数值的  **第 7 位（从 0 开始数）** 会被置为 1。注意，虽然外部数据不受资源回收管理，但该结构体本身仍然受资源回收管理。

- i32 size

  对象内容的长度，如果对象是 `多成员结构体` 或者 `匿名函数闭包`，该字段的值为 `成员的数量 * 8`，当对象为一个 `字节数组`，该字段是`字节数组` 的长度，显然字节数组的最大长度是 \(2^32\) 。

- i32 mark

  当对象是 `多成员结构体`、`匿名函数闭包` 时，该字段是对象成员的类别。从最低位开始，每一位表示一个成员是基本数据类型（0）还是对象类型（1）。

  因为这个字段是使用 i32 存储，所以一个对象类型最多只能有 32 个成员，反映到上层语言————比如 Lang，则结构体最多只能有 32 个成员，而联合体和枚举因为是分别使用 2 个和 1 个成员的结构体间接实现，所以联合体和枚举的成员则不受限制。

  当对象是 `字节数组` 时，该字段是 0。

- byte[] data | i64[] data | int data

  对象的数据内容。data 的结构跟对象的类型有关：

- 当对象是一个 `字节数组` 时，该字段是数组的原始数据 [byte, byte, ... byte]；
- 当对象是一个 `多成员结构体` 或者 `匿名函数闭包` 时，该字段是各成员的数值，每一个成员占 8 bytes [i64, i64, ... i64]。也就是说，无论该成员是 i8，i16，i32, i64, f32 还是 f64 等基本数据类型，都占用 8 bytes。如果某个成员是指向另外一个对象的指针，则它存储的是一个 int 类型的数值。注：Lang 不支持结构体成员为函数。
- 当对象使用外部数据时，该字段是外部数据的指针。

- int destructor

  当对象是一个带有 `析构函数` 的 `多成员结构体`时，才有这个字段，该字段是对象的析构函数的地址，当对象的引用计数值为 0，在资源回收这个对象之前（准确来说在开始对其子对象减少引用计数值之前），会先调用这个析构函数，在析构函数里仍然可以访问当前对象（及其所有成员），但不允许会让当前对象引用数增加的操作。

## 本地结构体示例

当对象是一个 `字节数组`：

```js
{
    ref: 0,
    type: 0b0010,
    size: N,
    mark: 0,
    data: [byte 0, byte 1,..., byte N]
}
```

当对象是 `多成员结构体` 且成员的值是基本数据类型时：

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
    type: 0b0001,
    size: 16, // 2 * 8 = 16
    mark: 0,
    data: [i64, i64]
}
```

当对象是 `多成员结构体` 其成员的值是对象时：

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
    type: 0b0001
    size: 16,
    mark: 0b11,
    data: [(address of topLeft), (address of bottomRight)]
}
```

当对象是 `匿名函数闭包` 时：

```clojure
(fn (num, user) (num) (user) (...))
```

```js
// native structure
{
    ref: 0,
    type: 0b0100
    size: 16,
    mark: 0b01,
    data: [i64, (address of user)]
}
```

当对象是一个带有 `析构函数` 的 `多成员结构体` 时：

```js
// XiaoXuan code
struct Stream
    File file
    ...
end

impl Stream train Drop
    // 析构函数
    function Void drop(Self self)
        self.file.close()
        ...
    end
end
```

```js
// native structure
{
    ref: 0,
    type: 0b10000001,
    size: 8, // 1 * 8 = 8
    mark: 0b1
    data: [(address of file)]
    destructor: (address of destructor)
}
```

## 数组

数组 Chunk 的内容是一个 Byte 序列，即在内存中的连续的 Byte 数据，大小通常是取 2 的整数倍，比如 16 Bytes, 32 Bytes, 64 Bytes, 128 Bytes 等。需注意并不是所有内容都是有效数据。

对于上层语言来说，其数组的元素数据类型可能是 Int32, Int64, Real32 或者结构体等等，最后它们都会转换为 Chunk 的 Byte 序列。

比如对于 `List<Int32>`，元素的数据类型是 Int32，转换到 Chunk 时将会以 4 Bytes 表示一个 Int32（规定大小序为小端序，Little Endian）；

List<Int32> 类型变量的值是一个内部结构体的指针，该内部结构体的结构如下：

```js
{
    *chunkAddr: int, // 指向内部 byte 类型的 Chunk 的地址；
    offset: 0,       // 有效内容的开始偏移值（注：有效内容是指数组当中呈现给外部可见的内容，它可以是数组的全部元素，也可以是其中的一部分）；
    length: 2,       // 有效内容的个数，以上层数组的数据类型来计算，比如当前例子是以 Int32 类型来计算，长度为 2 实际空间是 2 * 4 = 8 bytes；
    capacity: 8,     // 数组总共元素的个数，这个字段一般用于校验 `offset + size` 有无超出范围。
    typeSize: 4      // 元素数据类型的的字节数长度，比如 Int32 类型就是 4 bytes。
}
```

注意：

1. `length` 不一定等于 `capacity`。
   比如当上层使用 `rest()` 或者 `slice()` 等函数获取数组的部分元素时，实际过程是：新建了一个表示数组的内部结构体，重用底层的 Chunk，复制 `capacity` 和 `typeSize` 值，取适当的 `offset` 和 `length` 值。在此过程中 `capacity` 用于保障 `offset + length` 在有效的范围之内。

2. 数组内部结构体的 `capacity * （bytes per element）` 的值不一定等于 Chunk 的 `size`。
   前者是用于描述数组的所有元素的实际长度，后者用于描述数组的所有元素在底层内存当中的占用空间的长度。在分配 Chunk 时，往往会基于管理的原因分配一系列固定大小的空间（如 8 bytes, 16 bytes, 32 bytes, 64 bytes, 128 bytes 等），假如一个数组的实际长度是 11 bytes，在分配 Chunk 时则会分配能容纳 11 bytes 的空间值，也就是 16 bytes。

3. 因为 IR 不支持修改数据，所以当往数组添加（add） 或累加（append）数据时（包括连接数组），Chunk 没法重用，只能重新分配了一个 Chunk 然后复制元素的内容过去。

### 字符串 String

String 是 List<Char> 的别称，而 Char 是 Natural/UInt32 的别称，所以 String 是一个 UInt32 数组。即 List<UInt32>。

示例：

字符串 "Hi 你好"，其中数组内部结构体的内容如下：

```js
{
    *chunkAddr: ...,
    offset: 0,
    length: 5,
    capacity: 5,   // 5 个元素
    typeSize: 4    // 一个 Int32 数据的长度是 4 bytes
}
```

对应的 Chunk 内容如下：

```js
{
    ref: 0,
    type: 2,
    size: 32, // 字符串实际长度是 5 * 4 = 20 bytes, 占用 32 bytes
    mark: 0,
    data: '0x00000048, 0x00000069, 0x00000020, 0x00004F60, 0x0000597D, ...' // 后面都是 0
}
```

### 传统字符串 CString （::TODO 未定）

CString 是 List<UInt8> 的别称，用于存储一段以 UTF-8 编码的字符串。一般用于跟外部库 C 风格的 String 交流，跟 String 不同的有：

1. 数组是字符串使用 UInt8 编码后的 UInt8 数组。
2. 虽然 C 风格的 String 最末尾会多出一个字节 0，但 IR 的底层 Chunk 在有效内容后面会 **不会** 多一个值为 `0x00` 的字节。这有利于 `rest()`、`slice()` 等函数可以重用底层 Chunk。

示例：

字符串 "Hi 你好"，其中数组内部结构体的内容如下：

```js
{
    *chunkAddr: ...,
    offset: 0,
    length: 9,
    capacity: 9,    // 将字符串编码为 UTF-8 之后的字节数，不包括最末尾的 0；
    typeSize: 1     // 一个 UInt8 数据的长度是 1 bytes。
}
```

对应的 Chunk 内容如下：

```js
{
    ref: 0,
    type: 2,
    size: 32, // 字符串实际长度是 9 bytes, 占用 16 bytes
    mark: 0,
    data: '0x48, 0x69, 0x20, 0xe4, 0xbd, 0xa0, 0xe5, 0xa5, 0xbd, ...' // 后面都是 0
}
```

使用 UTF-8 将字符串转为字节数组的可以参考 Nodejs 的 `Buffer.from` 函数：
https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding

如：

```js
import { Buffer } from 'buffer';
let s = 'Hi 你好';
let b = Buffer.from(s, 'utf-8');
console.log(b);
```

标准库有一个 `int wrap_cstring(*char[])` 供外部程序调用，该函数可以将标准 C 的字符串封装为 CString 对象（不复制数据，仅仅封装），并返回该对象的地址；另外还有 `int unwrap_cstring(*cstring)` 函数，用于将 CString 转为 C 风格的字符串（实际上是复制了一份并在末尾添加 `0x00` 再返回)，并返回该字符串的地址。

注，标准库还有 `int wrap_struct(*struct)` 和 `int unwrap_struct(*struct)` 用于封装和转换 C 结构体和 IR 的结构体。`wrap_struct` 仅仅是封装，但 `unwrap_struct` 则是进行一次深度复制再返回。

## 特性类型参数

在上层语言里可能会使用特性（trait，或者接口 interface）作为函数的参数的数据类型，然后在函数内部调用该数据的方法（即跟该数据类型相关联的函数），因为数据的具体类型无法得知，所以在编译阶段无法确定该调用的函数是哪一个，示例：

```js
function sayHello(dyn Writer w) {
    let s = w.write("hello");
}

implement Buffer trait Writer {
    function String write(self) { ... }
}

implement OutputFile trait Writer {
    function String write(self) { ... }
}
```

上面示例中，结构体 `Buffer` 和 `OutputFile` 都实现了特性 `Writer`，现在假如有如下的调用代码：

```js
let w = ...; // 可能是 Buffer 也可能是 OutputFile 的实例
sayHello(w);
```

这时就不知道该调用 `Buffer::write` 还是 `OutoutFile::write`，IR 为了实现这种需求，当一个参数的类型是 `特性` 时，实际上传入的是两个值：一个是数据类型（一个在数据类型登记表里的索引值）、一个是数据的值（或者，对于自定义数据类型来说，是一个数据的地址），下面是 `sayHello` 函数的 IR 代码：

```js
(defn sayHello ([type, *data])
    (let !func (std.function.lookup type #write))
    (call !func *data 0)
)
```

使用 `std.function.lookup(type, #name)` 内置函数可以根据数据类型和函数的名称获取函数的指针。

## 函数类型参数与闭包

TODO::

## 闭包

TODO::