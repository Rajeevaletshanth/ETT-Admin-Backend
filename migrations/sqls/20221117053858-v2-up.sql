/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS public.product
(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) NOT NULL UNIQUE,
    price_id VARCHAR(100) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    price VARCHAR(20) NOT NULL,
    image VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS public.payment
(
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    payment_intent_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(100),
    product_id VARCHAR(100),
    amount VARCHAR(20) NOT NULL,
    status VARCHAR(20),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP 
);