#!/bin/bash
set -euo pipefail

# ── Install PostgreSQL 15 on Amazon Linux 2023 ──
dnf install -y postgresql15-server postgresql15

# ── Initialise the database cluster ──
postgresql-setup --initdb

# ── Configure pg_hba.conf to allow password auth from VPC ──
PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
cat > "$PG_HBA" <<'EOF'
# TYPE  DATABASE  USER      ADDRESS         METHOD
local   all       all                       peer
host    all       all       10.0.0.0/16     scram-sha-256
host    all       all       127.0.0.1/32    scram-sha-256
host    all       all       ::1/128         scram-sha-256
EOF

# ── Listen on all interfaces ──
PG_CONF="/var/lib/pgsql/data/postgresql.conf"
sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"

# ── Start and enable PostgreSQL ──
systemctl enable postgresql
systemctl start postgresql

# ── Create role and database ──
sudo -u postgres psql <<EOSQL
ALTER USER postgres WITH PASSWORD '${db_password}';
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${db_username}') THEN
    CREATE ROLE "${db_username}" WITH LOGIN PASSWORD '${db_password}';
  END IF;
END\$\$;
SELECT 'CREATE DATABASE "${db_name}" OWNER "${db_username}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db_name}')
\gexec
EOSQL
