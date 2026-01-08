#!/usr/bin/env python3
"""
Migration Script: DEV -> PROD
Überträgt alle fehlenden Tabellen und Felder von DEV nach PROD
"""

import psycopg2
from psycopg2 import sql
import sys

# Connection Strings
DEV_CONN = "postgresql://postgres:Harrypotter1207!s@db.jhxdwgnvmbnxjwiaodtj.supabase.co:5432/postgres"
PROD_CONN = "postgresql://postgres.fnfuklgbsojzdfnmrfad:Harrypotter1207!s@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"

def get_tables(conn):
    """Hole alle Tabellen aus der Datenbank"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        return [row[0] for row in cur.fetchall()]

def get_table_structure(conn, table_name):
    """Hole die Struktur einer Tabelle"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                ordinal_position
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position;
        """, (table_name,))
        return cur.fetchall()

def get_indexes(conn, table_name):
    """Hole alle Indizes einer Tabelle"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public' 
            AND tablename = %s;
        """, (table_name,))
        return cur.fetchall()

def get_foreign_keys(conn, table_name):
    """Hole alle Foreign Keys einer Tabelle"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT 
                conname,
                pg_get_constraintdef(oid) as constraint_def
            FROM pg_constraint
            WHERE conrelid = %s::regclass
            AND contype = 'f';
        """, (f'public.{table_name}',))
        return cur.fetchall()

def generate_create_table_sql(columns, table_name):
    """Generiere CREATE TABLE SQL"""
    column_defs = []
    for col in columns:
        col_name, data_type, is_nullable, default, _ = col
        
        # Konvertiere PostgreSQL Typen zu SQL
        if data_type == 'character varying':
            sql_type = 'TEXT'
        elif data_type == 'timestamp without time zone':
            sql_type = 'TIMESTAMP(3)'
        elif data_type == 'boolean':
            sql_type = 'BOOLEAN'
        elif data_type == 'integer':
            sql_type = 'INTEGER'
        elif data_type == 'bigint':
            sql_type = 'BIGINT'
        elif data_type == 'double precision':
            sql_type = 'DOUBLE PRECISION'
        elif data_type == 'jsonb':
            sql_type = 'JSONB'
        else:
            sql_type = data_type.upper()
        
        col_def = f'"{col_name}" {sql_type}'
        
        if is_nullable == 'NO':
            col_def += ' NOT NULL'
        
        if default:
            col_def += f' DEFAULT {default}'
        
        column_defs.append(f'    {col_def}')
    
    # Finde Primary Key
    pk_col = None
    for col in columns:
        if 'id' in col[0].lower() and col[0] == 'id':
            pk_col = col[0]
            break
    
    sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (\n'
    sql += ',\n'.join(column_defs)
    if pk_col:
        sql += f',\n    CONSTRAINT "{table_name}_pkey" PRIMARY KEY ("{pk_col}")'
    sql += '\n);'
    
    return sql

def main():
    print("🔄 Verbinde mit DEV-Datenbank...")
    try:
        dev_conn = psycopg2.connect(DEV_CONN)
        print("✓ Verbunden mit DEV")
    except Exception as e:
        print(f"❌ Fehler bei DEV-Verbindung: {e}")
        sys.exit(1)
    
    print("\n🔄 Verbinde mit PROD-Datenbank...")
    try:
        prod_conn = psycopg2.connect(PROD_CONN)
        print("✓ Verbunden mit PROD")
    except Exception as e:
        print(f"❌ Fehler bei PROD-Verbindung: {e}")
        sys.exit(1)
    
    # Hole Tabellen-Listen
    print("\n📋 Lade Tabellen-Listen...")
    dev_tables = set(get_tables(dev_conn))
    prod_tables = set(get_tables(prod_conn))
    
    missing_tables = dev_tables - prod_tables
    
    print(f"\n📊 Statistiken:")
    print(f"   DEV Tabellen: {len(dev_tables)}")
    print(f"   PROD Tabellen: {len(prod_tables)}")
    print(f"   Fehlende Tabellen: {len(missing_tables)}")
    
    if missing_tables:
        print(f"\n🔍 Fehlende Tabellen: {', '.join(sorted(missing_tables))}")
        
        # Generiere SQL für fehlende Tabellen
        sql_statements = []
        
        for table in sorted(missing_tables):
            print(f"\n📝 Analysiere Tabelle: {table}")
            
            # Hole Struktur
            columns = get_table_structure(dev_conn, table)
            if not columns:
                print(f"   ⚠️  Keine Spalten gefunden, überspringe...")
                continue
            
            # Generiere CREATE TABLE
            create_sql = generate_create_table_sql(columns, table)
            sql_statements.append(create_sql)
            
            # Hole Indizes
            indexes = get_indexes(dev_conn, table)
            for idx_name, idx_def in indexes:
                if 'CREATE UNIQUE INDEX' in idx_def or 'CREATE INDEX' in idx_def:
                    sql_statements.append(idx_def)
            
            # Hole Foreign Keys
            fks = get_foreign_keys(dev_conn, table)
            for fk_name, fk_def in fks:
                sql_statements.append(f'ALTER TABLE "{table}" ADD CONSTRAINT "{fk_name}" {fk_def};')
        
        # Schreibe SQL-Datei
        output_file = 'scripts/migrate-tables-to-prod.sql'
        with open(output_file, 'w') as f:
            f.write("-- ============================================\n")
            f.write("-- Migration: DEV -> PROD\n")
            f.write(f"-- Fehlende Tabellen: {len(missing_tables)}\n")
            f.write("-- ============================================\n\n")
            f.write('\n\n'.join(sql_statements))
            f.write('\n\n-- Verifikation\n')
            f.write('SELECT COUNT(*) as anzahl_tabellen FROM information_schema.tables\n')
            f.write("WHERE table_schema = 'public' AND table_type = 'BASE TABLE';\n")
        
        print(f"\n✅ SQL-Script erstellt: {output_file}")
        print(f"   {len(sql_statements)} SQL-Statements generiert")
        print(f"\n📋 Nächste Schritte:")
        print(f"   1. Öffne {output_file}")
        print(f"   2. Prüfe die SQL-Statements")
        print(f"   3. Führe sie in der PROD-Datenbank aus")
    else:
        print("\n✅ Alle Tabellen sind bereits in PROD vorhanden!")
    
    # Prüfe fehlende Spalten in existierenden Tabellen
    print("\n🔍 Prüfe fehlende Spalten in existierenden Tabellen...")
    common_tables = dev_tables & prod_tables
    missing_columns = []
    
    for table in sorted(common_tables):
        dev_cols = {col[0] for col in get_table_structure(dev_conn, table)}
        prod_cols = {col[0] for col in get_table_structure(prod_conn, table)}
        
        missing = dev_cols - prod_cols
        if missing:
            missing_columns.append((table, missing))
    
    if missing_columns:
        print(f"\n⚠️  Fehlende Spalten gefunden:")
        alter_statements = []
        
        for table, cols in missing_columns:
            print(f"   {table}: {', '.join(cols)}")
            
            # Hole Spalten-Definitionen aus DEV
            dev_table_cols = get_table_structure(dev_conn, table)
            for col in dev_table_cols:
                if col[0] in cols:
                    col_name, data_type, is_nullable, default, _ = col
                    
                    # Konvertiere Typ
                    if data_type == 'character varying':
                        sql_type = 'TEXT'
                    elif data_type == 'timestamp without time zone':
                        sql_type = 'TIMESTAMP(3)'
                    elif data_type == 'boolean':
                        sql_type = 'BOOLEAN'
                    elif data_type == 'integer':
                        sql_type = 'INTEGER'
                    elif data_type == 'bigint':
                        sql_type = 'BIGINT'
                    elif data_type == 'double precision':
                        sql_type = 'DOUBLE PRECISION'
                    elif data_type == 'jsonb':
                        sql_type = 'JSONB'
                    else:
                        sql_type = data_type.upper()
                    
                    alter_sql = f'ALTER TABLE "{table}" ADD COLUMN IF NOT EXISTS "{col_name}" {sql_type}'
                    
                    if is_nullable == 'NO':
                        alter_sql += ' NOT NULL'
                    
                    if default:
                        alter_sql += f' DEFAULT {default}'
                    
                    alter_sql += ';'
                    alter_statements.append(alter_sql)
        
        # Füge ALTER TABLE Statements zur Ausgabedatei hinzu
        if 'output_file' in locals():
            with open(output_file, 'a') as f:
                f.write('\n\n-- ============================================\n')
                f.write('-- Fehlende Spalten in existierenden Tabellen\n')
                f.write('-- ============================================\n\n')
                f.write('\n'.join(alter_statements))
        
        print(f"\n✅ ALTER TABLE Statements hinzugefügt")
    else:
        print("\n✅ Alle Spalten sind bereits vorhanden!")
    
    dev_conn.close()
    prod_conn.close()
    print("\n✅ Migration-Analyse abgeschlossen!")

if __name__ == '__main__':
    main()

