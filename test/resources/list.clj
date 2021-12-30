;; 链表 List

;; struct Node
;;     Int value
;;     Option<Node> nextOptionNode
;; end
;;
;; 函数：
;; Node::new(Int value, Option<Node> nextOptionNode) -> Node

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

;; struct List
;;     Int length
;;     Option<Node> headOptionNode
;; end
;;
;; 函数：
;; List::new() -> List
;; List::head(List) -> Option<Node>
;; List::rest(List) -> List
;; List::add(List, Node) -> List

;; !! 模块名称 "std"

(namespace Node

    ;; std::Node::new(Int value, Option<Node> nextOptionNode) -> Node

    (defn new
        (value next_option_node_addr)
        (do
            (let addr (builtin.memory.create_struct 2 2))
            (builtin.memory.i64_write addr 0 value)
            (builtin.memory.add_ref addr 1 next_option_node_addr)
            addr
        )
    )

    (defn getValue
        (node_addr)
        (builtin.memory.i64_read node_addr 0)
    )
)

(namespace Option

    ;; 私有方法
    ;; std::Option::new(WordWidth member_number, WordWidth member_addr) -> Option
    ;; 构建联合体的结构体类型成员

    (defn new
        (member_number member_addr)
        (do
            (let addr (builtin.memory.create_struct 2 2))
            (builtin.memory.i64_write addr 0 member_number)
            (builtin.memory.add_ref addr 1 member_addr)
            addr
        )
    )

    ;; 私有方法
    ;; std::Option::new$1(WordWidth member_number) -> Option
    ;; 构建联合体的常量型成员

    (defn new$1
        (member_number)
        (do
            (let addr (builtin.memory.create_struct 2 0))
            (builtin.memory.i64_write addr 0 member_number) ;;!注意必须把空的字段填上 0，JavaScript 会截断空字段
            (builtin.memory.i64_write addr 8 0)
            addr
        )
    )

    ;; std::Option::Some(Node node) -> Option::Some
    ;; 快捷构建子成员的方法

    (defn Some (node_addr)
        (do
            (let addr (std.Option.Some.new node_addr))
            (new 0 addr)
            addr
        )
    )

    ;; std::Option::None

    (const None
        (do
            (let addr (new$1 1))
            (builtin.memory.inc_ref addr) ;; const 需要增加引用值
            addr
        )
    )
)

(namespace Option.Some

    ;; 私有方法
    ;; std::Option::Some::new(Node node) -> Some

    (defn new
        (node_addr)
        (do
            (let addr (builtin.memory.create_struct 1 1))
            (builtin.memory.add_ref addr 0 node_addr)
            addr
        )
    )
)
