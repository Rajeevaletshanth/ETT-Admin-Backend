/* Replace with your SQL commands */

CREATE TABLE IF NOT EXISTS public.user
(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    address VARCHAR(250),
    authority VARCHAR(200) NOT NULL,
    phone_no VARCHAR(15),
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    avatar VARCHAR(200),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP 
);