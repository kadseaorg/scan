-- This file is used to define some sql that must be executed manually

-- postgresql.conf
-- shared_preload_libraries = 'pg_cron'    # (change requires restart)
-- CREATE EXTENSION pg_cron;

-- This is a view that can be used to get get the average block time within five minutes

CREATE MATERIALIZED VIEW mv_average_block_time AS
WITH time_diff AS (
  SELECT
    (timestamp - LAG(timestamp) OVER (ORDER BY timestamp)) AS diff
  FROM
    blocks
  WHERE
    timestamp > EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 minute'))
)
SELECT
  AVG(diff)
FROM
  time_diff;

CREATE UNIQUE INDEX idx_mv_average_block_time ON mv_average_block_time (avg);

CREATE OR REPLACE FUNCTION refresh_mv_average_block_time() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_average_block_time;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('five-minute-refresh-average-block-time', '*/5 * * * *', 'SELECT refresh_mv_average_block_time()', 'postgres');  -- every five minutes
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_average_block_time()"

-- This is a view that can be used to get total number of wallets
CREATE MATERIALIZED VIEW mv_unique_address_count AS
SELECT COUNT(DISTINCT address) AS count
FROM (
    SELECT from_address AS address
    FROM token_transfers
    WHERE from_address IS NOT NULL
    UNION ALL
    SELECT to_address AS address
    FROM token_transfers
    WHERE to_address IS NOT NULL
    UNION ALL
    SELECT from_address AS address
    FROM transactions
    WHERE from_address IS NOT NULL
    UNION ALL
    SELECT to_address AS address
    FROM transactions
    WHERE to_address IS NOT NULL
) AS unique_addresses;

CREATE UNIQUE INDEX idx_mv_unique_address_count ON mv_unique_address_count (count);

CREATE OR REPLACE FUNCTION refresh_mv_unique_address_count() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_unique_address_count;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-unique-wallet-address-count', '0 * * * *', 'SELECT refresh_mv_unique_address_count()', 'postgres');  -- every hour

-- This is a view that can be used to get the number of transactions per day
CREATE MATERIALIZED VIEW mv_daily_transaction_count AS
SELECT TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
       COUNT(*) AS count
FROM transactions
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_transaction_count ON mv_daily_transaction_count (date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_transaction_count() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_transaction_count;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-transaction-count', '0 * * * *', 'SELECT refresh_mv_daily_transaction_count()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_transaction_count()"


-- This is a view that can be used to get the number of token transfers per days
CREATE MATERIALIZED VIEW mv_daily_token_transfer_counts
AS
SELECT
  TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
  token_type,
  COUNT(*) AS count
FROM token_transfers
GROUP BY date, token_type
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_token_transfer_counts ON mv_daily_token_transfer_counts (date, token_type);

CREATE OR REPLACE FUNCTION refresh_mv_daily_token_transfer_counts() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_token_transfer_counts;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-token-transfer-counts', '0 * * * *', 'SELECT refresh_mv_daily_token_transfer_counts()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_token_transfer_counts()"

-- This is a view that can be used to get the number of unique addresses per day
CREATE MATERIALIZED VIEW mv_daily_unique_address_count AS
SELECT TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
       COUNT(DISTINCT to_address) AS count
FROM transactions
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_unique_address_count ON mv_daily_unique_address_count (date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_unique_address_count() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_unique_address_count;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-unique-address-count', '0 * * * *', 'SELECT refresh_mv_daily_unique_address_count()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_unique_address_count()"



-- This is a view that can be used to get the number of token holders per day, and the number of token transfers per day
CREATE MATERIALIZED VIEW mv_token_list AS
SELECT
  tokens.*,
  COALESCE(holders_count.count, 0) AS holders,
  COALESCE(trans24h_count.count, 0) AS trans24h,
  COALESCE(trans3d_count.count, 0) AS trans3d
FROM tokens
LEFT OUTER JOIN (
  SELECT 
    tb.token_address, 
    COUNT(DISTINCT tb.address) AS count
  FROM (
      SELECT 
        token_type,
        token_address,
        address,
        FIRST_VALUE(balance) OVER (
            PARTITION BY token_address, address 
            ORDER BY updated_block_number DESC
        ) AS most_recent_balance
      FROM token_balances
    ) tb
  WHERE tb.most_recent_balance > 0
  GROUP BY tb.token_address
) AS holders_count ON tokens.address = holders_count.token_address
LEFT OUTER JOIN (
  SELECT token_transfers.token_address, COUNT(token_transfers.id) AS count
  FROM token_transfers
  WHERE token_transfers.timestamp > (EXTRACT(EPOCH FROM NOW()) - 86400)
  GROUP BY token_transfers.token_address
) AS trans24h_count
ON tokens.address = trans24h_count.token_address
LEFT OUTER JOIN (
  SELECT token_transfers.token_address, COUNT(token_transfers.id) AS count
  FROM token_transfers
  WHERE token_transfers.timestamp > (EXTRACT(EPOCH FROM NOW()) - 3 * 86400)
  GROUP BY token_transfers.token_address
) AS trans3d_count
ON tokens.address = trans3d_count.token_address;

CREATE UNIQUE INDEX idx_mv_token_list ON mv_token_list (address);

CREATE OR REPLACE FUNCTION refresh_mv_token_list() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_token_list;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-token-list-materialized', '0 * * * *', 'SELECT refresh_mv_token_list()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_token_list()"


CREATE MATERIALIZED VIEW mv_daily_gas_used AS
SELECT TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
       SUM(gas_used) AS total_gas_used
FROM transactions
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_gas_used ON mv_daily_gas_used (date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_gas_used() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_gas_used;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-gas-used', '0 * * * *', 'SELECT refresh_mv_daily_gas_used()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_gas_used()"

CREATE MATERIALIZED VIEW mv_daily_tx_fee AS
SELECT TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
       SUM(fee) AS total_fee
FROM transactions
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_tx_fee ON mv_daily_tx_fee (date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_tx_fee() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_tx_fee;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-fee', '0 * * * *', 'SELECT refresh_mv_daily_tx_fee()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_tx_fee()"

CREATE MATERIALIZED VIEW mv_avg_tps_gas_24h AS
SELECT
  ROUND(COUNT(DISTINCT hash) / 86400.0, 2) AS avg_tps_24h,
  ROUND(AVG("gas_price")) AS avg_gas_price_24h
FROM
  transactions
WHERE
  "timestamp" >= EXTRACT(EPOCH FROM NOW() - INTERVAL '24 hours')::bigint;

CREATE UNIQUE INDEX ON mv_avg_tps_gas_24h (avg_tps_24h, avg_gas_price_24h);

CREATE OR REPLACE FUNCTION refresh_mv_avg_tps_gas_24h() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_avg_tps_gas_24h;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-avg-tps-gas-24h', '0 * * * *', 'SELECT refresh_mv_avg_tps_gas_24h()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_avg_tps_gas_24h()"


CREATE MATERIALIZED VIEW mv_tps_per_hour AS
SELECT
  DATE_TRUNC('hour', to_timestamp("timestamp")) AS hour,
  COUNT(DISTINCT hash) / 3600.0 AS tps
FROM
  transactions
GROUP BY
  hour;

CREATE UNIQUE INDEX idx_mv_tps_per_hour ON mv_tps_per_hour (hour);

CREATE OR REPLACE FUNCTION refresh_mv_tps_per_hour() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tps_per_hour;
END;
$$ LANGUAGE plpgsql;

CREATE MATERIALIZED VIEW mv_average_txs_fees AS
SELECT TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
       AVG(fee) AS average_fee
FROM transactions
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_average_txs_fees ON mv_average_txs_fees (date);

CREATE OR REPLACE FUNCTION refresh_mv_average_txs_fees() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_average_txs_fees;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-average-txs-fees', '0 * * * *', 'SELECT refresh_mv_average_txs_fees()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_average_txs_fees()"

CREATE MATERIALIZED VIEW mv_daily_batches AS
SELECT TO_CHAR("proven_at", 'YYYY-MM-DD') AS date,
       COUNT(*) AS count
FROM l1_batches
GROUP BY date
ORDER BY date ASC;

CREATE UNIQUE INDEX idx_mv_daily_batches ON mv_daily_batches (date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_batches() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_batches;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-batches', '0 * * * *', 'SELECT refresh_mv_daily_batches()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_batches()"

-- uaw = unique active wallets
CREATE MATERIALIZED VIEW mv_dapp_daily_unique_active_addresses AS
SELECT
    d.id AS dapp_id,
    UNNEST(d.addresses) AS dapp_address,
    DATE(TO_TIMESTAMP(t.timestamp)) AS date,
    COUNT(DISTINCT CONCAT(t.from_address, '_', tt.from_address)) AS count
FROM
    transactions t
FULL JOIN
    token_transfers tt ON t.hash = tt.transaction_hash
JOIN
    dapps d ON t.to_address = ANY(d.addresses) OR tt.to_address = ANY(d.addresses)
GROUP BY
    dapp_id, dapp_address, DATE(TO_TIMESTAMP(t.timestamp));

CREATE UNIQUE INDEX idx_mv_dapp_daily_unique_active_addresses ON mv_dapp_daily_unique_active_addresses (dapp_id, dapp_address, date);

CREATE OR REPLACE FUNCTION refresh_mv_dapp_daily_unique_active_addresses() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dapp_daily_unique_active_addresses;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-dapp-daily-unique-active-addresses', '0 * * * *', 'SELECT refresh_mv_dapp_daily_unique_active_addresses()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_daily_unique_active_addresses()"


CREATE MATERIALIZED VIEW mv_daily_contract_transactions AS
SELECT
    c.address AS contract_address,
    DATE(TO_TIMESTAMP(t.timestamp)) AS date,
    COUNT(t.id) AS count
FROM
    transactions t
JOIN
    contracts c ON (t.to_address = c.address OR t.from_address = c.address)
GROUP BY
    c.address, DATE(TO_TIMESTAMP(t.timestamp));

CREATE UNIQUE INDEX idx_mv_daily_contract_transactions ON mv_daily_contract_transactions (contract_address, date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_contract_transactions() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_contract_transactions;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-contract-transactions', '0 * * * *', 'SELECT refresh_mv_daily_contract_transactions()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_contract_transactions()"

CREATE TABLE IF NOT EXISTS mv_dapp_daily_transactions (
    dapp_id INT NOT NULL,
    date DATE NOT NULL,
    count BIGINT NOT NULL,
    PRIMARY KEY (dapp_id, date)
);

CREATE UNIQUE INDEX idx_mv_dapp_daily_transactions ON mv_dapp_daily_transactions (dapp_id, date);

-- Migration from old materialized view to new normal table

-- CREATE TABLE temp_mv_dapp_daily_transactions AS
-- SELECT * FROM mv_dapp_daily_transactions;

-- DROP MATERIALIZED VIEW mv_dapp_daily_transactions;

-- ALTER TABLE temp_mv_dapp_daily_transactions
-- RENAME TO mv_dapp_daily_transactions;

CREATE OR REPLACE FUNCTION refresh_mv_dapp_daily_transactions() RETURNS void AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Find the latest data date from mv_dapp_daily_transactions
  SELECT MAX(date) - INTERVAL '1 day' INTO v_start_date FROM mv_dapp_daily_transactions;
  IF v_start_date IS NULL THEN
      v_start_date := (SELECT MIN(DATE(TO_TIMESTAMP(timestamp))) - INTERVAL '1 day' FROM transactions);
  END IF;

  -- Create a temporary table to store incremental data
  CREATE TEMP TABLE IF NOT EXISTS tmp_dapp_daily_transactions (LIKE mv_dapp_daily_transactions) ON COMMIT DROP;

  TRUNCATE tmp_dapp_daily_transactions;

  -- Insert data for each dapp after the specified date
  INSERT INTO tmp_dapp_daily_transactions
  SELECT
    d.id AS dapp_id,
    DATE(TO_TIMESTAMP(t.timestamp)) AS date,
    COUNT(t.id) AS count
  FROM
    transactions t
  JOIN
    dapps d ON t.to_address = ANY (d.addresses) OR t.from_address = ANY (d.addresses)
  WHERE
    DATE(TO_TIMESTAMP(t.timestamp)) > v_start_date
  GROUP BY
    dapp_id, date;

  -- For newly added dapps, insert their full data
  INSERT INTO tmp_dapp_daily_transactions
  SELECT
    d.id AS dapp_id,
    DATE(TO_TIMESTAMP(t.timestamp)) AS date,
    COUNT(t.id) AS count
  FROM
    transactions t
  JOIN
    dapps d ON t.to_address = ANY (d.addresses) OR t.from_address = ANY (d.addresses)
  WHERE
    d.id NOT IN (SELECT dapp_id FROM mv_dapp_daily_transactions)
  GROUP BY
    dapp_id, date;

  -- Update the regular table using the temporary table
  DELETE FROM mv_dapp_daily_transactions
  WHERE (dapp_id, date) IN (
    SELECT dapp_id, date FROM tmp_dapp_daily_transactions
  );

  INSERT INTO mv_dapp_daily_transactions
  SELECT * FROM tmp_dapp_daily_transactions;
END;
$$ LANGUAGE plpgsql;



-- SELECT cron.schedule_in_database('hourly-refresh-dapp-daily-transactions', '0 * * * *', 'SELECT refresh_mv_dapp_daily_transactions()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_daily_transactions()"



CREATE MATERIALIZED VIEW mv_daily_contract_stats AS
SELECT
    contract_address,
    TO_CHAR(to_timestamp(timestamp), 'YYYY-MM-DD') AS date,
    COUNT(DISTINCT interacting_address) AS unique_address_count,
    SUM(value) AS total_value
FROM
(
    SELECT
        from_address AS contract_address,
        timestamp,
        to_address AS interacting_address,
        value
    FROM
        transactions
    UNION ALL
    SELECT
        to_address AS contract_address,
        timestamp,
        from_address AS interacting_address,
        value
    FROM
        transactions
) AS subquery
GROUP BY
    contract_address,
    date;

CREATE UNIQUE INDEX idx_mv_daily_contract_stats ON mv_daily_contract_stats (contract_address, date);

CREATE OR REPLACE FUNCTION refresh_mv_daily_contract_stats() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_contract_stats;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-daily-contract-stats', '0 * * * *', 'SELECT refresh_mv_daily_contract_stats()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_contract_stats()"

CREATE MATERIALIZED VIEW mv_account_stats AS
SELECT
  adr.address,
  sum(adr.balance) as balance,
  sum(adr.balance) / (SELECT SUM(balance) FROM address_balances) as balance_percentage,
  coalesce(
    (SELECT count(*) FROM transactions WHERE from_address = adr.address OR to_address = adr.address),
    0
  ) as txn_count
FROM
  address_balances AS adr
GROUP BY
  adr.address
ORDER BY balance DESC;

CREATE UNIQUE INDEX idx_mv_account_stats ON mv_account_stats (address);

CREATE OR REPLACE FUNCTION refresh_mv_account_stats() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_stats;
END;
$$ LANGUAGE plpgsql;

-- only for scroll
CREATE MATERIALIZED VIEW mv_account_stats_scroll AS
SELECT
  adr.address,
  sum(adr.balance) as balance,
  sum(adr.balance) / (SELECT SUM(balance) FROM address_balances WHERE balance <= 1000000000000000000000000000000000000000) as balance_percentage,
  coalesce(
    (SELECT count(*) FROM transactions WHERE from_address = adr.address OR to_address = adr.address),
    0
  ) as txn_count
FROM
  address_balances AS adr
WHERE
  adr.balance <= 1000000000000000000000000000000000000000
GROUP BY
  adr.address
ORDER BY balance DESC;

CREATE UNIQUE INDEX idx_mv_account_stats_scroll ON mv_account_stats_scroll (address);

CREATE OR REPLACE FUNCTION refresh_mv_account_stats_scroll() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_stats_scroll;
END;
$$ LANGUAGE plpgsql;

--TODO 添加operation字段
CREATE MATERIALIZED VIEW mv_inscription_mint_txs AS
SELECT
  inscriptions.from_address,
  inscriptions.to_address,
  inscriptions.transaction_hash,
  inscriptions.block_number,
  inscriptions.timestamp,
  inscription_whitelist.tick,
  inscription_whitelist.standard,
  (inscriptions.full_inscription->>'amt')::bigint AS amt
FROM
  inscription_whitelist
JOIN
  inscriptions ON inscription_whitelist.mint_json = inscriptions.full_inscription
ORDER BY
  inscriptions.block_number DESC;

CREATE UNIQUE INDEX idx_mv_inscription_mint_txs ON mv_inscription_mint_txs (transaction_hash);
CREATE INDEX idx_mv_inscription_mint_txs_tick ON mv_inscription_mint_txs (tick);
CREATE INDEX idx_mv_inscription_mint_txs_from ON mv_inscription_mint_txs (from_address);


CREATE OR REPLACE FUNCTION refresh_mv_inscription_mint_tx() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inscription_mint_txs;
END;
$$ LANGUAGE plpgsql;

-- 0,30 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_inscription_mint_tx()"

CREATE MATERIALIZED VIEW mv_inscription_summary AS
SELECT
    w.tick,
    SUM(CAST(i.full_inscription ->> 'amt' AS BigInt)) AS minted_count,
    COUNT(DISTINCT i.from_address) AS holder_count,
    COUNT(i.transaction_hash) AS tx_count
FROM
    inscriptions i
JOIN
    inscription_whitelist w ON i.full_inscription = w.mint_json
GROUP BY
    w.tick;

CREATE UNIQUE INDEX idx_mv_inscription_summary ON mv_inscription_summary (tick);

CREATE OR REPLACE FUNCTION refresh_mv_inscription_summary() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inscription_summary;
END;
$$ LANGUAGE plpgsql;

-- 0,30 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_inscription_mint_tx()"


-- SELECT cron.schedule_in_database('hourly-refresh-account-stats', '0 * * * *', 'SELECT refresh_mv_account_stats()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_account_stats()"

CREATE MATERIALIZED VIEW mv_dapp_category_total_uaw_ranking AS
SELECT
    d.id AS dapp_id,
    c.category,
    SUM(uaw.count) AS total_uaw,
    RANK() OVER (PARTITION BY c.category ORDER BY SUM(uaw.count) DESC) AS total_ranking
FROM
    mv_dapp_daily_unique_active_addresses uaw
JOIN
    dapps d ON d.id = uaw.dapp_id
CROSS JOIN
    UNNEST(d.categories) as c(category)
WHERE
    uaw.dapp_address = ANY (d.addresses)
GROUP BY
    d.id,
    c.category;

CREATE UNIQUE INDEX idx_mv_dapp_category_total_uaw_ranking ON mv_dapp_category_total_uaw_ranking (dapp_id, category);

CREATE OR REPLACE FUNCTION refresh_mv_dapp_category_total_uaw_ranking() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dapp_category_total_uaw_ranking;
END;
$$ LANGUAGE plpgsql;

-- SELECT cron.schedule_in_database('hourly-refresh-dapp-category-total-uaw-ranking', '0 * * * *', 'SELECT refresh_mv_dapp_category_total_uaw_ranking()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_category_total_uaw_ranking()"

CREATE MATERIALIZED VIEW mv_token_balances_summary AS
SELECT
  tb.token_type,
  tb.token_address,
  tb.address,
  -- For ERC-721, the quantity is taken directly from the balance of the most recent record for each address-token combo.
  -- For other token types, quantity is the sum of all balances.
  CASE 
    WHEN tb.token_type = 'erc721' THEN tb.latest_balance 
    ELSE SUM(tb.balance) 
  END AS quantity,
  -- Total balance for ERC-721 is specified by the most recent balance for each unique address-token pair. For others, it remains a sum.
  CASE 
    WHEN tb.token_type = 'erc721' THEN tb.latest_balance
    ELSE SUM(tb.balance) 
  END AS total_balance,
  -- Percentage and rank calculations follow the logic set forth in quantity and total balance calculation.
  CASE 
    WHEN tb.token_type = 'erc721' THEN tb.latest_balance / NULLIF(SUM(tb.latest_balance) OVER (PARTITION BY tb.token_type, tb.token_address), 0)
    ELSE SUM(tb.balance) / NULLIF(SUM(SUM(tb.balance)) OVER (PARTITION BY tb.token_type, tb.token_address), 0)
  END AS percentage,
  RANK() OVER (PARTITION BY tb.token_type, tb.token_address ORDER BY CASE 
    WHEN tb.token_type = 'erc721' THEN tb.latest_balance
    ELSE SUM(tb.balance)
  END DESC) AS rank
FROM (
  SELECT 
    token_type,
    token_address,
    address,
    balance,
    FIRST_VALUE(balance) OVER (PARTITION BY token_address, address ORDER BY updated_block_number DESC) AS latest_balance
  FROM 
    public.token_balances
) tb
-- The WHERE NOT condition above for ERC-721 might not be necessary if all balances > 0 signify ownership
GROUP BY tb.token_type, tb.token_address, tb.address, tb.latest_balance
WITH DATA;

CREATE UNIQUE INDEX idx_mv_token_balances_summary ON mv_token_balances_summary (token_type, token_address, address);

CREATE OR REPLACE FUNCTION refresh_mv_token_balances_summary() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_token_balances_summary;
END;
$$ LANGUAGE plpgsql;

-- Create indexes to improve query performance
CREATE INDEX ON public.mv_token_balances_summary(token_type, token_address);
CREATE INDEX ON public.mv_token_balances_summary(rank);


-- SELECT cron.schedule_in_database('hourly-refresh-token-balances-summary', '0 * * * *', 'SELECT refresh_mv_token_balances_summary()', 'postgres');  -- every hour
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_token_balances_summary()"




-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_average_block_time()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_unique_address_count()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_transaction_count()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_token_transfer_counts()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_unique_address_count()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_gas_used()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_tx_fee()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_token_list()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_avg_tps_gas_24h()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_average_txs_fees()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_batches()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_contract_transactions()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_daily_contract_stats()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_account_stats()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_token_balances_summary()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_daily_transactions()"
-- 0 * * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_daily_unique_active_addresses()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_dapp_category_total_uaw_ranking()"
-- 0 0 * * * psql postgres://postgres:password@localhost:5432/postgres -c "SELECT refresh_mv_tps_per_hour()"

