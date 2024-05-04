# L2SCAN

L2scan is the explorer for the layer 2 network. It allows you to search for transactions, blocks, and addresses on the Layer2 Network.

## Installation

To install this project, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Run `bun` to install all dependencies.

## Configuration and Setup

Before running the project, you need to configure and set up the environment. Follow these steps:

1. Copy the `.env.example` file to `.env`.
2. Add the necessary environment variables in the `.env` file. For example:

```conf
DATABASE_URL=
REDIS_URL=
VERIFICATION_URL=

# For Production Redirection
# NEXT_PUBLIC_SITE_URL="https://l2scan.co/"
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

PRIVATE_KEY=
FROM_ADDRESS=

RPC=

```

3. Run `bun run prisma:push` to create the necessary database tables.
4. Run `bun dev` to start the development server.
5. If you need contract verification, you need to run the verification server.

```sh
cd smart-contract-verifier

# start the generic rust verifier
docker-compose -f docker-compose.yml up -d

# start zksync verifier
docker-compose -f docker-compose-zksync.yml up -d
```

6. Download and install foundry cast binary from [here](https://book.getfoundry.sh/getting-started/installation)

```sh
curl -L https://foundry.paradigm.xyz | bash
```

## Docker

build the docker image

```sh
docker build -t l2scan .
```

run the docker image

```sh
docker run \
-e DATABASE_URL="postgres://postgres:xNWXdwq4pIXVynWu@18.163.74.190:5432/kadsea" \
-e REDIS_URL="redis://:A4%26xBQJBc6@18.163.74.190:7069" \
-e VERIFICATION_URL="http://127.0.0.1:8050" \
-p 3000:3000 \
kadseaorg/kadscan:main-kadsea
```

## 4byte Directory

Export the 4byte directory from openchain:

```sh
curl https://api.openchain.xyz/signature-database/v1/export -s &> sig-db.csv

# convert to tab delimited file
awk -F',' -v OFS='\t' '{sub(/,/, "\t"); print}' sig-db.csv > 4bytes.tsv
```

Then run the following SQL to import the 4byte directory:

```sql
\copy signatures ("hash", "name") FROM '4bytes.tsv' WITH (FORMAT csv, DELIMITER E'\t');
```

Delete Special Characters from the 4byte directory:

```sql
DELETE FROM signatures WHERE name LIKE '%$%';
```

## Swagger UI

```sh
# should handle cors in your reverse proxy
docker run -p 80:8080 -e SWAGGER_JSON_URL=http://localhost:3000/api/openapi.json swaggerapi/swagger-ui
```

## Technologies Used

This project utilizes the following technologies:

- Next.js
- Prisma
- TRPC
- Supabase
- BullMQ
- Viem
- Wagmi

## Contributing

If you would like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your changes to your forked repository.
5. Submit a pull request to the main repository.
