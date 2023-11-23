/* Replace with your SQL commands */

CREATE TABLE IF NOT EXISTS public.moderator
(
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    company VARCHAR(100),
    company_type VARCHAR(100),
    website VARCHAR(50),
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