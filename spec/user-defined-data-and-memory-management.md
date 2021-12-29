# 用户自定义数据及内存管理

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [用户自定义数据及内存管理](#用户自定义数据及内存管理)
  - [本地结构体](#本地结构体)
  - [本地结构体示例](#本地结构体示例)
  - [对象的访问](#对象的访问)
    - [分配对象的内存空间](#分配对象的内存空间)
    - [读写对象的内容](#读写对象的内容)
  - [资源回收](#资源回收)
    - [修改对象的引用计数](#修改对象的引用计数)
    - [对象的访问模式](#对象的访问模式)
      - [let 表达式](#let-表达式)
      - [loop 表达式](#loop-表达式)
      - [匿名函数](#匿名函数)

<!-- /code_chunk_output -->

XiaoXuan Lang 的枚举和联合体会被转换为命名空间和结构体，所以 XiaoXuan Lang 所有用户自定义数据类型其实都是用结构体表示，而结构体来到 XiaoXuan Lang IR 之后会被转换相应的 `用户自定义数据` 和 `用户自定义函数`，也就是说，在 XiaoXuan Lang IR 里已经完全没有 XiaoXuan Lang 的自定义数据类型的信息。

XiaoXuan Lang IR 的 `用户自定义数据` 使用一个本地结构体（native struct）来存储到内存的 "堆" 中，受 `资源回收器`（GC，garbage collection）管理。`用户自定义数据` 的赋值、传参、返回都是传递该本地结构体在内存中的地址，类似其他编程语言的 `按引用传递`（相对的，基本数据类型的赋值、传参、返回都是直接复制）；当 `用户自定义数据` 传递给其他线程时，则是深度复制。

## 本地结构体

XiaoXuan Lang IR 本地结构体（以下简称为 `对象`）的结构如下：

- i32 ref

  对象的引用计数值，用于表示当前对象被引用的次数。

  当一个对象引用计数为 0 时，会遍历其所有引用的对象（`子对象`），然后把它们的引用计数值都减少 1，最后这个对象会被资源回收。

- i16 type

  对象的类型，目前有 3 种：`多成员结构体`（0）、`字节数组`（1）、`匿名函数`（2），当多成员结构体带有 `析构函数` 时，值为（4）。

- i16 count

  对象成员的数量，当对象为一个 `字节数组`，成员数量为 0。

- i32 mark | i32 size

  当对象是 `多成员结构体`、`匿名函数` 时，该字段是对象成员的类别。从最低位开始，每一位表示一个成员是基本数据类型（0）还是对象类型（1）。

  因为这个字段是使用 i32 存储，所以一个对象类型最多只能有 32 个成员，反映到上层语言————比如 XiaoXuan Lang，则结构体最多只能有 32 个成员，而联合体和枚举因为是分别使用 2 个和 1 个成员的结构体间接实现，所以联合体和枚举的成员则不受限制。

  当对象是 `字节数组` 时，该字段是`字节数组` 的长度，显然字节数组的最大长度是 \(2^32\) 。

- byte[] data | i64[] data | int data

  对象的数据内容。data 的结构跟对象的类型有关：

- 当对象是一个 `字节数组` 时，该字段是数组的原始数据 [byte, byte, ... byte]；
- 当对象是一个 `多成员结构体` 或者 `匿名函数` 时，该字段是各成员的数值，每一个成员占 8 bytes [i64, i64, ... i64]。也就是说，无论该成员是 i8，i16，i32, i64, f32 还是 f64 等基本数据类型，都占用 8 bytes。如果某个成员是指向另外一个对象的指针，则它存储的是一个 int 类型的数值。注：XiaoXuan Lang 不支持结构体成员为函数。

- int destructor

  当对象是一个带有 `析构函数` 的 `多成员结构体`时，才有这个字段，该字段是对象的析构函数的地址，当对象的引用计数值为 0，在资源回收这个对象之前（准确来说在开始对其子对象减少引用计数值之前），会先调用这个析构函数，在析构函数里仍然可以访问当前对象（及其所有成员），但不允许会让当前对象引用数增加的操作。

## 本地结构体示例

当对象是一个 `字节数组`：

```js
{
    ref: 0,
    type: 1,
    count: 0,
    size: N,
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
    type: 0,
    count: 2,
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
    type: 0
    count: 2,
    mark: 0b11,
    data: [(address of topLeft), (address of bottomRight)]
}
```

当对象是 `匿名函数` 时：

```clojure
(fn (num, user) (num) (user) (...))
```

```js
// native structure
{
    ref: 0,
    type: 2
    count: 2,
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
    type: 4,
    count: 1,
    mark: 0b1
    data: [(address of file)]
    data: (address of destructor)
}
```

## 对象的访问

XiaoXuan Lang IR 不支持内存的直接读写，只能通过内置的函数来读写对象。这样可以为解析器和编译器带来灵活性，比如解析器可以使用宿主运行时现有的内存管理器，而编译器到 WASM 或者本地代码，只需将内存读写函数调用替换成内联代码即可。

### 分配对象的内存空间

- `int create_bytes(i32 bytes_length)`

  创建一个 `字节数组` 类型的对象，内存的内容不会被初始化，函数返回该对象在内存中的地址。

- `int create_bytes_zero(i32 bytes_length)`

  跟 `create_bytes` 类似，但会将内存的内容初始化为 `0`。

- `int create_struct(i16 count， i32 mark)`

  创建一个 `多成员结构体` 类型的对象，其中 `count` 为成员个数，`mark` 为各个成员的是否对象类型的标记。

- `int create_clojure(i16 count， i32 mark)`

  创建一个 `匿名函数` 类型的对象，其中 `count` 为成员个数，`mark` 为各个成员的是否对象类型的标记。

- `int create_struct_destructor(i16 count， i32 mark, int destructor_addr)`

  创建一个带 `析构函数` 的 `多成员结构体` 对象，`destructor_addr 是析构函数的地址。

### 读写对象的内容

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

上述函数中，`addr` 参数是目标对象的内存地址，`byte_offset` 是字节偏移量。对于 `多成员结构体` 的对象来说，因为每个成员都占用 8 bytes，所以 `byte_offset` 应该是 8 的整数倍，即 `成员的索引 * 8`。

- `int get_address(int addr, i32 member_index)`

  获取指定成员的地址值。

- `i32 get_type(int addr)`

  获取成员的标记。

- `i32 get_count(int addr)`

  获取成员的数量。

- `i32 get_mark(int addr)`

  获取成员的标记。

- `i32 get_size(int addr)`

  获取数组的长度。

- `int get_destructor(int addr)`

  获取对象的析构函数地址。

## 资源回收

考虑到 XiaoXuan Lang 不会出现对象的循环引用，为了简单起见这里使用 `引用计数法` 举例 XiaoXuan Lang 的资源回收相关函数及方法。

如果要完全实现 `资源回收器`，大致上还应该维护一个废弃对象（garbage）的链表，还要对 `堆` 按照对象的成员数量的不同而分割成多个块，以提高分配新对象的速度。比如 1 个成员的对象归在一个块，2 个成员的对象归在一个块，数组长度在 32 bytes 之内的归在一个块，数组长度在 128 bytes 之内的归在一个块等等。因为资源回收的内容不属于 XiaoXuan Lang IR 的规范范围，这里不进一步展开。

需注意的是，这里描述的资源回收方法，以及本地结构体的实现方法都只是为了方面描述而提供的一种参考，解析器或编译器可以实现自己的资源回收。

### 修改对象的引用计数

- `i32 inc_ref(int addr)`

  增加对象引用计数值，返回更新后的引用计数值。
  当将一个对象赋值给另外一个变量时需要调用这个函数以增加引用计数。

  新建对象的默认引用计数值为 0，所以 XiaoXuan Lang 的一条 `let` 语句，实际上在 XiaoXuan Lang IR 里调用了 `create_struct` （或 `create_bytes`）以及 `inc_ref` 一共 2 个函数共同完成。

- `i32 add_ref(int addr, i32 member_index, int ref_addr)`

  将 "被引用的对象" 的地址写入到指定对象的指定成员，并增加 "被引用的对象" 的引用计数值，返回 "被引用的对象" 更新后的引用计数值。

  注意在创建具有多层结构的对象（即包含 `子对象` 的对象）时，在内层的对象创建之后，不需要单独调用 `inc_ref` 函数增加其计数值，而应该使用 `add_ref` 将内层对象链接到到外层对象。

- `i32 dec_ref(int addr)`

  减少结构体的引用计数值，返回更新后的引用计数值。

  当一个用户自定义数据类型的变量生命周期结束后（即指令运行到变量有效范围的最后一行），需调用这个方法以减少对象的引用计数值。当一个对象引用计数为 0 时，会遍历其所有引用的对象（即 `子对象`），然后把它们的引用计数值都减少 1，最后这个对象的资源会被回收。

### 对象的访问模式

为了能让资源回收正常工作，或者说为了准确地统计对象的引用计数值，XiaoXuan Lang IR 在访问对象时，有一些固定的模式，编译到 XiaoXuan Lang IR 时需要遵循这些模式。

这些模式的原理是，当一个对象被另一个对象引用或者被一个标识符引用时，要保证其引用计数值增加了 1，如果一个引用对象的标识符将要离开其作用域，则要保证其引用计数值减少了 1。

具体的实现有这些：

#### let 表达式

`let` 表达式里的值子表达式如果是调用 `::new(...)` 以及 `::new$N(...)` 之类的对象构造函数，或者直接返回这类构造函数的值，需要紧接着调用 `builtin.memory.inc_ref()` 函数以增加对象的引用计数值。（但在 `::new(...)` 以及 `::new$N(...)` 的函数本身里，对于要返回的对象，则不能调用 `inc_ref`，应该留给构造函数调用者调用）。

当 `let` 表达式创建的标识符离开作用域时，必须调用 `builtin.memory.dec_ref()` 函数以减少对象的引用计数值。即 `inc_ref()` 和 `dec_ref()` 总是成对出现的。

#### loop 表达式

`loop` 表达式里比较特殊，如果 `loop` 表达式的循环参数里有用户自定义类型，需要在 `loop` 表达式之前使用 `inc_ref` 以增加它们的引用计数值，然后在 `loop` 表达式主体的倒数第二句（即，在最后一句 `break` 或者 `recur` 之前）使用 `dec_ref` 以减少它们的引用计数值。

这是因为，`loop` 表达式的循环变量在每次循环时（除了第一次循环）都会（在 `recur` 表达式之前）创建了一个新的对象然后再代入该循环变量参数。

#### 匿名函数

因为匿名函数会捕获当前环境的变量，包括用户自定义类型的变量，而这些变量应该保证在匿名函数（或者说，绑定了匿名函数的变量）的生命周期之内都有效，所以会看到匿名函数表达式的参数略多。不过匿名函数所捕获的用户自定义类型的对象会由运行时自动调用 `inc_ref`，也会在匿名函数生命周期结束之后自动调用 `dec_ref`。

匿名函数本身也会产生一个对象，这个对象的成员就是它所捕获的变量，然后绑定了匿名函数的变量也跟普通 `多成员结构体` 对象一样，需要遵循同样的访问模式。
