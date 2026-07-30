-- ============================================
-- FSN Serial Number Generator — Database Schema
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SKU Ledger — tracks each SKU and its flow state
CREATE TABLE sku_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(255) UNIQUE NOT NULL,
    precursor VARCHAR(50) NOT NULL,
    last_perma_no VARCHAR(50),
    last_random_sequence VARCHAR(3),
    current_flow_number INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Generation History — logs every batch
CREATE TABLE generation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(255) REFERENCES sku_ledger(sku),
    quantity_generated INTEGER NOT NULL,
    starting_sn VARCHAR(255) NOT NULL,
    ending_sn VARCHAR(255) NOT NULL,
    serial_numbers TEXT, -- stores all generated SNs for CSV export
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Atomic RPC — prevents concurrent duplicate flow numbers
CREATE OR REPLACE FUNCTION generate_sn_range(
    p_sku VARCHAR, 
    p_quantity INTEGER
) RETURNS TABLE (start_flow INTEGER, end_flow INTEGER) AS $$
DECLARE
    v_current_flow INTEGER;
BEGIN
    -- Lock the row for update to prevent concurrent duplicates
    SELECT current_flow_number INTO v_current_flow 
    FROM sku_ledger 
    WHERE sku = p_sku 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SKU not found in ledger';
    END IF;

    -- Calculate the range
    start_flow := v_current_flow + 1;
    end_flow := v_current_flow + p_quantity;

    -- Update the ledger with the new max flow
    UPDATE sku_ledger 
    SET current_flow_number = end_flow, 
        updated_at = NOW()
    WHERE sku = p_sku;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Seed data — all 23 accessories with default precursors
INSERT INTO sku_ledger (sku, precursor) VALUES
    ('P-PV100G-UN-WH-10', 'PV100G'),
    ('A-LCD-UN-32IN-0199', 'LCD'),
    ('A-LCD-UN-43IN-0343', 'LCD'),
    ('P-PV125G-SA-BK-BL-010', 'PV125G'),
    ('P-PV75G-SA-BK-BL-010', 'PV75G'),
    ('P-PV50G-SA-BK-BL-010', 'PV50G'),
    ('A-FN-BL-0224', 'FN'),
    ('A-PTC-D22-UN-5525M-5525F', 'PTC'),
    ('A-LINE-NO-UN-L3M', 'LINE'),
    ('A-LEDL-ZA-2W', 'LEDL'),
    ('A-LEDL-SA-2W01', 'LEDL'),
    ('A-LEDL-SA-2W00', 'LEDL'),
    ('A-LEDL-SA-1W01', 'LEDL'),
    ('A-LEDL-SA-1W00', 'LEDL'),
    ('A-PTC-NO-UN-USB-TTL', 'PTC'),
    ('P-PV110-EU-BK-BL-010', 'PV110'),
    ('P-PV75-EU-BK-BL-010', 'PV75'),
    ('P-PV55-EU-BK-BL-010', 'PV55'),
    ('A-DCFAN-SA', 'DCFAN'),
    ('A-STEREO-SA', 'STEREO'),
    ('A-RADIO-SA', 'RADIO'),
    ('A-LCD-SA', 'LCD'),
    ('A-FBANTENNA-ZA-8M', 'FBANTENNA')
ON CONFLICT (sku) DO NOTHING;
