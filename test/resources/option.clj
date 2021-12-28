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
;;         WordWidth memberNumber
;;         WordWidth memberAddr
;;     end
;;
;;     namespace Option
;;         function Parent::Option new_0(Int memberNumber, WordWidth memberAddr)
;;             ;; native
;;         end
;;
;;         function Parent::Option new_1(Int memberNumber)
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


(namespace std.Option
    ;; 私有方法
    ;; std::Option::new_0(WordWidth memberNumber, WordWidth member)
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
    ;; std::Option::new_1(WordWidth memberNumber)
    ;; 构建联合体的常量型成员

    (defn new_1
        (memberNumber)
        (do
            (let addr (builtin.memory.create_struct 2))
            (builtin.memory.i64_write addr 0 memberNumber) ;;!注意必须把空的字段填上 0，JavaScript 会截断空字段
            (builtin.memory.i64_write addr 8 0)
        )
    )

    ;; std::Option::Some(Int value) -> Option::Some

    (defn Some (value)
        (do
            (let addr (std.Option.Some.new value))
            (new_0 0 addr)
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

    ;; std::Option::equal(Option left, Option right) -> i64

    (defn equal
        (leftAddr rightAddr)
        (do
            (builtin.memory.inc_ref leftAddr)
            (builtin.memory.inc_ref rightAddr)

            (let left_member_number (builtin.memory.i64_read leftAddr 0))
            (let right_member_number (builtin.memory.i64_read rightAddr 0))

            (let result
                (if (native.i64.eq left_member_number right_member_number)
                    (if (native.i64.eq left_member_number 0)
                        (std.Option.Some.equal
                            (builtin.memory.read_address leftAddr 1)
                            (builtin.memory.read_address rightAddr 1)
                        )
                        (if (native.i64.eq left_member_number 1)
                            1
                            (builtin.panic 10001)
                        )
                    )
                    0
                )
            )

            (builtin.memory.dec_ref leftAddr)
            (builtin.memory.dec_ref rightAddr)

            result
        )
    )
)

(namespace std.Option.Some

    ;; 私有方法
    ;; std::Option::Some::new(Int value) -> Some

    (defn new
        (value)
        (do
            (let addr (builtin.memory.create_struct 1))
            (builtin.memory.i64_write addr 0 value)
            addr
        )
    )

    ;; std::Option::Some::equal(Some left, Some right) -> i64

    (defn equal
        (leftAddr rightAddr)
        (do
            (builtin.memory.inc_ref leftAddr)
            (builtin.memory.inc_ref rightAddr)

            (let result
                (native.i64.eq
                    (builtin.memory.i64_read leftAddr 0)
                    (builtin.memory.i64_read rightAddr 0)
                )
            )

            (builtin.memory.dec_ref leftAddr)
            (builtin.memory.dec_ref rightAddr)

            result
        )
    )
)
