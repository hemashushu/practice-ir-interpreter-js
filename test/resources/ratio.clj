;; 有理数 Ratio

;; struct Ratio
;;     Int n  ;; 分子
;;     Int m  ;; 分母
;; end

;; !! 模块名称 "std"

(namespace Ratio
    ;; 构造函数
    ;; (new n m)
    ;; n 分子
    ;; m 分母
    (defn new
        (n m)
        (do
            (if (native.i64.eq m 0)
                (builtin.panic 10002) ;; 分母不允许为 0
                (do
                    ;; TODO:: 公约数化简
                    (let addr (builtin.memory.create_struct 2 0))
                    (builtin.memory.i64_write addr 0 n)
                    (builtin.memory.i64_write addr 8 m)
                    addr
                )
            )
        )
    )

    ;; 获取分子
    (defn getN
        (addr)
        (builtin.memory.i64_read addr 0)
    )

    ;; 获取分母
    (defn getM
        (addr)
        (builtin.memory.i64_read addr 8)
    )

    ;; 判断是否相等
    (defn equal
        (left_addr right_addr)
        (do
            (let left_n (getN left_addr))
            (let right_n (getN right_addr))
            (let left_m (getM left_addr))
            (let right_m (getM right_addr))
            (builtin.and
                (native.i64.eq left_n right_n)
                (native.i64.eq left_m right_m)
            )
        )
    )

    ;; 有理数的加法
    ;; \[\frac{a}{b} + \frac{c}{d} = \frac{ad+bc}{bd}\]
    (defn add
        (left_addr right_addr)
        (do
            (let left_n (getN left_addr))
            (let right_n (getN right_addr))
            (let left_m (getM left_addr))
            (let right_m (getM right_addr))

            (let n
                (native.i64.add
                    (native.i64.mul left_n right_m)
                    (native.i64.mul right_n left_m)
                )
            )

            (let m (native.i64.mul left_m right_m))
            (new n m)
        )
    )
)