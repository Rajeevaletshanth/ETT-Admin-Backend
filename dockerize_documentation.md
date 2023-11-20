
<-- Postgres first setup -->
    docker pull postgres

    docker run --name postgres-container -e POSTGRES_PASSWORD=root -d postgres

    -- Create the database in terminal --
    docker exec -it postgres-container psql -U postgres

    # create database real_estate_tokenization;
    # \q



<-- Docker Compose build -->
    docker-compose up --build -d

    -- run migrations --
    docker exec ebb_server npm run migrate



<-- Run Docker Compose -->
    docker-compose up
