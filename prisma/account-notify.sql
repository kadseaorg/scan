/*
 * This function notifies users based on their notification settings when a new transaction or token transfer occurs.
 * It retrieves the user record from the account_watch_list table based on the from_address or to_address of the new transaction or token transfer.
 * If the user has chosen to receive notifications and the notification settings match the transaction or token transfer, it sends an email notification using the novu api.
 * The function returns the new transaction or token transfer record.
 */
CREATE OR REPLACE FUNCTION notify_user() RETURNS TRIGGER AS $$
DECLARE
    user_record account_watch_list%ROWTYPE;
    transaction_record RECORD;
    token_transfer_record RECORD;
BEGIN
    -- Retrieve the user record based on the from_address or to_address of the new transaction or token transfer.
    SELECT INTO user_record * FROM account_watch_list WHERE address = NEW.from_address OR address = NEW.to_address;
    
    -- If the user record is found and the user has chosen to receive notifications.
    IF FOUND THEN
        -- Retrieve the transaction or token transfer record based on the table name.
        IF TG_TABLE_NAME = 'transactions' THEN
            SELECT id, hash, from_address, to_address, block_number INTO transaction_record FROM transactions WHERE id = NEW.id;
        ELSEIF TG_TABLE_NAME = 'token_transfers' THEN
            SELECT id, transaction_hash, from_address, to_address, block_number INTO token_transfer_record FROM token_transfers WHERE id = NEW.id;
        END IF;
        
        -- Send email notification using the novu api based on the user's notification settings.
        IF user_record.notification_method = 'INCOMING_OUTGOING' OR
           (user_record.notification_method = 'INCOMING_ONLY' AND user_record.address = NEW.to_address) OR
           (user_record.notification_method = 'OUTGOING_ONLY' AND user_record.address = NEW.from_address) THEN
            PERFORM pg_notify('notify', json_build_object('email', user_record.email, 'user_id', user_record.user_id, 'transaction', transaction_record, 'token_transfer', token_transfer_record)::text);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_notify AFTER INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION notify_user();
CREATE TRIGGER token_transfers_notify AFTER INSERT ON token_transfers FOR EACH ROW EXECUTE FUNCTION notify_user();