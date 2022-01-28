;; 链表 List

;; struct List
;;     Int length
;;     Option<Node> headOptionNode
;; end
;;
;; 函数：
;; List::new() -> List
;; List::add(List, Int) -> List
;; List::getLength(List) -> Int
;; List::getHead(List) -> std::Option<Int>
;; List::getRest(List) -> List
;;
;;
;; List.headOptionNode -> Pointer of Option<Node>
;;
;; headOptionNode --> Option<Node>
;;                      |-- value == 33
;;                      |-- Option<Node>
;;                          nextOptionNode --> Option::Some(Node)
;;                                               |-- value == 22
;;                                               |-- Option<Node>
;;                                                    nextOptionNode  -->  Option::None
;; !! 模块名称 "collection"

(namespace List
    ;; 默认构造函数
    (defn new
        (length head_option_node_addr)
        (do
            (let addr (builtin.memory.create_struct 16 2)) ;; type 2 = 0b10
            (builtin.memory.write_i64 addr 0 length) ;; length
            (builtin.memory.add_ref addr 8 head_option_node_addr) ;; option head node
            addr
        )
    )

    ;; 构造函数重载 1，生成一个空 List
    (defn new$1
        ()
        (new 0 collection.Option.None)
    )

    ;; 添加一个整数到列表，返回一个新的列表
    (defn add
        (list_addr value)
        (do
            ;; 原先列表长度
            (let previous_length (builtin.memory.read_i64 list_addr 0))
            ;; 原先的第一个 Option<Node>
            (let previous_option_node_addr (builtin.memory.read_address list_addr 8))
            ;; 创建一个新的 Node
            (let node_addr (collection.Node.new value previous_option_node_addr))
            ;; 创建一个新的 Some<Node>
            (let option_node_addr (collection.Option.Some node_addr))
            ;; 创建一个新的 list
            (new (native.i64.add previous_length 1) option_node_addr)
        )
    )

    (defn getLength
        (list_addr)
        (builtin.memory.read_i64 list_addr 0)
    )

    ;; 获取列表第一个元素的值
    ;; 如果长度为 0，返回 std::Option::None
    ;; 如果长度大于0，返回 std::Option::Some(Int)
    (defn getHead
        (list_addr)
        (do
            (let length (getLength list_addr))
            (let head_option_node_addr (builtin.memory.read_address list_addr 8))

            (if (native.i64.eq length  0)
                ;; 长度为 0，返回 std::Option::None
                std.Option.None
                ;; 长度大于0，返回 std::Option::Some(Int)
                (do
                    (let head_node_addr (collection.Option.getMember head_option_node_addr))
                    (let value (collection.Node.getValue head_node_addr))
                    (builtin.print_i64 99999)
                    (builtin.print_i64 value)
                    (std.Option.Some value)
                )
            )
        )
    )

    ;; 获取除了第一个元素之外的元素，返回一个新列表
    ;; 如果长度为 0，返回空 list
    (defn getRest
        (list_addr)
        (do
            (let length (getLength list_addr))
            (let head_option_node_addr (builtin.memory.read_address list_addr 8))

            (if (native.i64.eq length  0)
                ;; 长度为 0，返回空 list
                (new$1)
                ;; 长度大于0，返回新列表
                (do
                    (let some_head_node_addr (collection.Option.getMember head_option_node_addr))
                    (let node_addr (collection.Option.Some.getValue some_head_node_addr))
                    (let next_option_node_addr (builtin.memory.read_address node_addr 8))
                    (new (native.i64.sub length 1) next_option_node_addr)
                )
            )
        )
    )
)