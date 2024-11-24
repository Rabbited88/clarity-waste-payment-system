;; Define constants and errors
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-insufficient-balance (err u101))
(define-constant err-invalid-amount (err u102))
(define-constant err-payment-failed (err u103))

;; Define data variables
(define-data-var service-cost uint u10)
(define-map customer-balances principal uint)
(define-map collection-records
    principal
    {last-collection: uint,
     collections-count: uint,
     total-paid: uint})

;; Public functions
(define-public (register-customer)
    (begin
        (map-set customer-balances tx-sender u0)
        (map-set collection-records tx-sender
            {last-collection: u0,
             collections-count: u0,
             total-paid: u0})
        (ok true)))

;; Add funds to customer balance
(define-public (add-funds (amount uint))
    (let (
        (current-balance (default-to u0 (map-get? customer-balances tx-sender)))
    )
    (begin
        (map-set customer-balances tx-sender (+ current-balance amount))
        (ok true))))

;; Record waste collection and process payment
(define-public (record-collection (customer principal))
    (let (
        (customer-balance (default-to u0 (map-get? customer-balances customer)))
        (current-cost (var-get service-cost))
        (record (default-to
            {last-collection: u0, collections-count: u0, total-paid: u0}
            (map-get? collection-records customer)))
    )
    (if (>= customer-balance current-cost)
        (begin
            (map-set customer-balances customer (- customer-balance current-cost))
            (map-set collection-records customer
                {last-collection: block-height,
                 collections-count: (+ (get collections-count record) u1),
                 total-paid: (+ (get total-paid record) current-cost)})
            (ok true))
        err-insufficient-balance)))

;; Update service cost - owner only
(define-public (set-service-cost (new-cost uint))
    (if (is-eq tx-sender contract-owner)
        (begin
            (var-set service-cost new-cost)
            (ok true))
        err-owner-only))

;; Read only functions
(define-read-only (get-customer-balance (customer principal))
    (ok (default-to u0 (map-get? customer-balances customer))))

(define-read-only (get-service-cost)
    (ok (var-get service-cost)))

(define-read-only (get-collection-history (customer principal))
    (ok (map-get? collection-records customer)))
