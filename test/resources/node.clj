;; 链表 Node

;; struct Node
;;     Int value
;;     Option<Node> nextOptionNode
;; end

;; union Option
;;     Some(Node node)
;;     None
;; end
;;
;; 函数：
;; Option::Some(Node node) -> Option::Some
;;
;; 常量：
;; Option::None

;; !! 模块名称 "collection"

(namespace Option

    ;; 私有方法
    ;; collection::Option::new(WordWidth member_type_index, Any member_addr) -> collection::Option
    ;; 构建联合体的结构体类型成员

    (defn new
        (member_type_index member_addr)
        (do
            (let addr (builtin.memory.create_struct 16 2))
            (builtin.memory.write_i64 addr 0 member_type_index)
            (builtin.memory.add_ref addr 8 member_addr)
            addr
        )
    )

    ;; 私有方法
    ;; collection::Option::new$1(WordWidth member_type_index) -> collection::Option
    ;; 构建联合体的常量型成员

    (defn new$1
        (member_type_index)
        (do
            (let addr (builtin.memory.create_struct 16 0))
            (builtin.memory.write_i64 addr 0 member_type_index) ;;!注意必须把空的字段填上 0，JavaScript 会截断空字段
            (builtin.memory.write_i64 addr 8 0)
            addr
        )
    )

    ;; collection::Option::Some(Node node) -> Option::Some
    ;; 快捷构建子成员的方法

    (defn Some (node_addr)
        (do
            (let addr (collection.Option.Some.new node_addr))
            (new 0 addr)
        )
    )

    ;; collection::Option::None

    (const None
        (do
            (let addr (new$1 1))
            (builtin.memory.inc_ref addr) ;; const 需要增加引用值
            addr
        )
    )

    ;; collection::Option::getMemberTypeIndex(Option) -> i64
    ;; 内部方法，获取当前联合体的值的子类型索引
    (defn getMemberTypeIndex
        (addr)
        (builtin.memory.read_i64 addr 0)
    )

    ;; collection::Option::getMember(Option) -> Any
    ;; 内部方法，获取当前联合体的值（某个从属结构体的实例/地址）
    ;; 联合体的值是其子成员的其中之一
    ;; 如果某个子成员是常量类型，则抛出异常
    (defn getMember
        (addr)
        (do
            (let member_type_index (getMemberTypeIndex addr))

            (if (native.i64.eq member_type_index 0) ;; 0 号子成员是从属结构体
                (builtin.memory.read_address addr 8)
                (if (native.i64.eq member_type_index 1) ;; 1 号子成员是常量型，无从属结构体
                    (builtin.panic 10003) ;; 无从属结构体
                    (builtin.panic 10001) ;; 非联合体成员
                )
            )
        )
    )

    (defn equal
        (left_addr right_addr)
        (do
            (let left_member_type_index (builtin.memory.read_i64 left_addr 0))
            (let right_member_type_index (builtin.memory.read_i64 right_addr 0))

                (if (native.i64.eq left_member_type_index right_member_type_index)
                    (if (native.i64.eq left_member_type_index 0)
                        ;; Option::Some
                        (collection.Option.Some.equal
                            (builtin.memory.read_address left_addr 8)
                            (builtin.memory.read_address right_addr 8)
                        )
                        ;; Option::None
                        (if (native.i64.eq left_member_type_index 1)
                            1

                            ;; 非联合体成员
                            (builtin.panic 10001)
                        )
                    )
                    0
                )
        )
    )
)

(namespace Option.Some

    ;; 私有方法
    ;; collection::Option::Some::new(Node node) -> collection::Option::Some
    (defn new
        (node_addr)
        (do
            (let addr (builtin.memory.create_struct 8 1))
            (builtin.memory.add_ref addr 0 node_addr)
            addr
        )
    )

    ;; collection::Option::Some::getValue(Some)
    (defn getValue
        (addr)
        (builtin.memory.read_address addr 0)
    )

    ;; collection::Option::Some::equal(Some left, Some right) -> i64
    (defn equal
        (left_addr right_addr)
        (collection.Option.equal
            (builtin.memory.read_i64 left_addr 0)
            (builtin.memory.read_i64 right_addr 0)
        )
    )
)

(namespace Node
    ;; collection::Node::new(Int value, Option<Node> nextOptionNode) -> Node
    (defn new
        (value next_option_node_addr)
        (do
            (let addr (builtin.memory.create_struct 16 2)) ;; type 2 = 0b10
            (builtin.memory.write_i64 addr 0 value)
            (builtin.memory.add_ref addr 8 next_option_node_addr)
            addr
        )
    )

    (defn getValue
        (node_addr)
        (builtin.memory.read_i64 node_addr 0)
    )

    (defn getNextOptionNode
        (node_addr)
        (builtin.memory.read_address node_addr 8)
    )

    ;; collection::Node::equal(Node left, Node right)
    (defn equal
        (left_addr right_addr)
        ;; 只有 value 和 nextOptionNode 都相等的情况下才算相等
        (builtin.and
            (native.i64.eq
                (getValue left_addr)
                (getValue right_addr)
            )
            (collection.Option.equal
                (getNextOptionNode left_addr)
                (getNextOptionNode right_addr)
            )
        )
    )
)
