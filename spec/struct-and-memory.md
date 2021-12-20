# struct

结构体的内存布局：

* i64 type 数据类型
  值为数据类型表的索引值。
  其中有5种基本类型（虚拟机直接支持的类型）i32/i64/f32/f64/bytes（字节数组）
  其他的都是用户自定义类型，也就是结构体
* i64 size 数据的大小
  数据的字节数，对于 i32/f32 其值为 4，对于 i64/f64 其值为 8，对于 bytes 其值为数组实际长度
  对于结构体，则为成员的个数之和 * 8，因为结构体的每个成员的值都由一个指针指向实际内存地址，而指针的大小为 i64，即 8。
  比如对于结构体 (i64, i64, f32)，其大小为 3 * 8 = 24。
* i64 ref 数据被引用的计数值
  当一个结构体的引用计数为 0 时，会让所有其引用的结构体的计数值 -1，然后销毁自己。
* i64[] addrs
  各成员的地址
  当结构体为基本类型时，addrs 只有一个元素，其值为指向值的内存地址（对于数组则指向数组的开始位置，即第一个字节的地址）
  当结构体有多个成员时，addrs 是各个成员（也是结构体）的在内存中的地址。


读取内存数据的本地方法：

* read_member_addr(addr, index) 获取 addr 指向的结构体的各个成员的地址

* read_i32(addr) 读取 addr 地址内存中的 4 个字节，并返回 i32 值
* read_i64(addr) 读取 addr 地址内存中的 8 个字节，并返回 i64 值
* read_f32(addr) 读取 addr 地址内存中的 4 个字节，并返回 f32 值
* read_f64(addr) 读取 addr 地址内存中的 8 个字节，并返回 i64 值

* read_member_i32(addr)，是函数 read_i32(read_member_addr(addr, 0)) 的简写，用于通过 i32 类型结构体的地址直接读取其 i32 值
* read_member_i64(addr)，类似上一个函数
* read_member_f32(addr)，类似上一个函数
* read_member_f64(addr)，类似上一个函数

创建结构体的本地方法：

* create_i32(i32) 分配 4 个字节空间，并写入 i32 值，然后返回该结构体（i32 类型）的地址
* create_i64(i64) 分配 8 个字节空间，并写入 i64 值，然后返回该结构体（i64 类型）的地址
* create_f32(f32) 分配 4 个字节空间，并写入 f32 值，然后返回该结构体（f32 类型）的地址
* create_f64(f64) 分配 8 个字节空间，并写入 f64 值，然后返回该结构体（f64 类型）的地址
* create_bytes(i64 addr, i64 length) 分配一个字节数组，注意虚拟机无法直接构建字节数组的内容，只能通过外部程序事先把内容写入内存，然后再使用这个函数 “包装” 成一个字节数组结构体。

修改结构体引用计数的方法：

* inc_ref(addr) 增加一个结构体的引用计数，结构体在创建之初，其引用值为 1。
* dec_ref(addr) 减少一个结构体的引用计数。注意当一个结构体的引用计数为 0 时，它所引用的全部结构体的引用数会自动被减去 1，然后回收结构体本身的内存。
