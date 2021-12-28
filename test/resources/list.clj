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

(namespace std.Node

    ;; std::Node::new(Int value, Option<Node> nextOptionNode) -> Node

    (defn new
        (value nextOptionNodeAddr)
        (do
            (builtin.memory.inc_ref nextOptionNodeAddr)

            (let addr (builtin.memory.create_struct 2))
            (builtin.memory.i64_write addr 0 value)
            (builtin.memory.add_ref addr 1 nextOptionNodeAddr)

            (builtin.memory.dec_ref nextOptionNodeAddr)

            addr
        )
    )
)


(namespace std.Option

    ;; 私有方法
    ;; std::Option::new_0(WordWidth memberNumber, WordWidth member) -> Option
    ;; 构建联合体的结构体类型成员

    (defn new_0
        (memberNumber memberAddr)
        (do
            (builtin.memory.inc_ref memberAddr)

            (let addr (builtin.memory.create_struct 2))
            (builtin.memory.i64_write addr 0 memberNumber)
            (builtin.memory.add_ref addr 1 memberAddr)

            (builtin.memory.dec_ref memberAddr)
            addr
        )
    )

    ;; 私有方法
    ;; std::Option::new_1(WordWidth memberNumber) -> Option
    ;; 构建联合体的常量型成员

    (defn new_1
        (memberNumber)
        (do
            (let addr (builtin.memory.create_struct 2))
            (builtin.memory.i64_write addr 0 memberNumber) ;;!注意必须把空的字段填上 0，JavaScript 会截断空字段
            (builtin.memory.i64_write addr 8 0)
            addr
        )
    )

    ;; std::Option::Some(Node node) -> Option::Some

    (defn Some (nodeAddr)
        (do
            (std.memory.inc_ref nodeAddr)

            (let addr (std.Option.Some.new nodeAddr))
            (new_0 0 addr)

            (std.memory.dec_ref nodeAddr)

            addr
        )
    )

    ;; std::Option::None

    (const None
        (do
            (let addr (new_1 1))
            (builtin.memory.inc_ref addr) ;; let/const 需要增加引用值
            addr
        )
    )

)

(namespace std.Option.Some

    ;; 私有方法
    ;; std::Option::Some::new(Node node) -> Some

    (defn new
        (nodeAddr)
        (do
            (std.memory.inc_ref nodeAddr)

            (let addr (builtin.memory.create_struct 1))
            (builtin.memory.add_ref addr 0 nodeAddr)

            (std.memory.dec_ref nodeAddr)

            addr
        )
    )

)
