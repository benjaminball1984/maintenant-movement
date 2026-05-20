-- Migration 001 : extensions Postgres requises par le schema Maintenant!.
--
-- pgcrypto : `gen_random_uuid()` pour les clés primaires UUID.
-- (uuid-ossp serait une alternative mais pgcrypto suffit et est plus moderne.)

create extension if not exists pgcrypto;
