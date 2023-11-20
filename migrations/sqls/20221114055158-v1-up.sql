/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS public.payment_customer
(
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL UNIQUE,
    customer_id VARCHAR(100) NOT NULL UNIQUE,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP 
);


CREATE TABLE IF NOT EXISTS public.card
(
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    payment_method_id VARCHAR(100) NOT NULL UNIQUE,
    card_holder_name VARCHAR(50) NOT NULL,
    card_id VARCHAR(50) NOT NULL,
    card_type VARCHAR(50) NOT NULL,
    exp_month VARCHAR(10) NOT NULL,
    exp_year VARCHAR(10) NOT NULL,
    last_four_digits VARCHAR(10) NOT NULL,
    primary_card BOOLEAN DEFAULT true, 
    created_at TIMESTAMP,
    updated_at TIMESTAMP 
);