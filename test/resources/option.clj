;; 联合体 Option

;; union Option
;;     Some(Int value)
;;     None
;; end
;;
;; 函数：
;; Option::Some(Int value) -> Option::Some
;;
;; 常量：
;; Option::None

;; 注：
;; 联合体将会翻译为结构体
;;
;; namespace std
;;     struct Option
;;         WordWidth member_number
;;         WordWidth member_addr
;;     end
;;
;;     namespace Option
;;         function Parent::Option new(Int member_number, WordWidth member_addr)
;;             ;; native
;;         end
;;
;;         function Parent::Option new$1(Int member_number)
;;             ;; native
;;         end
;;
;;         struct Some
;;             Int value
;;         end
;;
;;         const None = new(2)
;;
;;         namespace Some
;;             function Parent::Some new(Int value)
;;                 ;; native
;;             end
;;         end
;;     end
;; end

;; !! 模块名称 "std"

(namespace Option
    ;; 私有方法
    ;; std::Option::new(WordWidth member_number, WordWidth member_addr)
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
    ;; std::Option::new$1(WordWidth member_number)
    ;; 构建联合体的常量型成员

    (defn new$1
        (member_number)
        (do
            (let addr (builtin.memory.create_struct 2 0))
            (builtin.memory.i64_write addr 0 member_number) ;;!注意必须把空的字段填上 0，JavaScript 会截断空字段
            (builtin.memory.i64_write addr 8 0)
        )
    )

    ;; std::Option::Some(Int value) -> Option::Some
    ;; 快捷构建子成员的方法

    (defn Some (value)
        (do
            (let addr (std.Option.Some.new value))
            (new 0 addr)
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

    ;; std::Option::equal(Option left, Option right) -> i64

    (defn equal
        (left_addr right_addr)
        (do
            (let left_member_number (builtin.memory.i64_read left_addr 0))
            (let right_member_number (builtin.memory.i64_read right_addr 0))

                (if (native.i64.eq left_member_number right_member_number)
                    (if (native.i64.eq left_member_number 0)
                        ;; Option::Some
                        (std.Option.Some.equal
                            (builtin.memory.read_address left_addr 1)
                            (builtin.memory.read_address right_addr 1)
                        )
                        ;; Option::None
                        (if (native.i64.eq left_member_number 1)
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
    ;; std::Option::Some::new(Int value) -> Some

    (defn new
        (value)
        (do
            (let addr (builtin.memory.create_struct 1 0))
            (builtin.memory.i64_write addr 0 value)
            addr
        )
    )

    ;; std::Option::Some::equal(Some left, Some right) -> i64

    (defn equal
        (left_addr right_addr)
        (native.i64.eq
            (builtin.memory.i64_read left_addr 0)
            (builtin.memory.i64_read right_addr 0)
        )
    )
)
