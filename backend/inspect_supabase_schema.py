#!/usr/bin/env python3
"""
Script to inspect the structure of a Supabase PostgreSQL database.
This script connects to the database and prints out detailed information about
tables, columns, constraints, and indexes, focusing on certificates, patients, and documents.
"""

import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection parameters
DB_URL = "postgresql://postgres.vzdepdxbdqvfpjzfuqfy:zyfwa0-pebzuc-gobGeh@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

def connect_to_db():
    """Connect to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(DB_URL)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("Successfully connected to the database")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        exit(1)

def get_schemas(cursor):
    """Get all schemas in the database"""
    cursor.execute("""
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schema_name;
    """)
    return cursor.fetchall()

def get_tables(cursor, schema):
    """Get all tables in a schema"""
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = %s 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """, (schema,))
    return cursor.fetchall()

def get_table_columns(cursor, schema, table):
    """Get column details for a table"""
    cursor.execute("""
        SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            column_default, 
            is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = %s 
        AND table_name = %s 
        ORDER BY ordinal_position;
    """, (schema, table))
    return cursor.fetchall()

def get_primary_keys(cursor, schema, table):
    """Get primary key information for a table"""
    cursor.execute("""
        SELECT
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = %s
        AND tc.table_name = %s
        ORDER BY kcu.ordinal_position;
    """, (schema, table))
    return cursor.fetchall()

def get_foreign_keys(cursor, schema, table):
    """Get foreign key information for a table"""
    cursor.execute("""
        SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = %s
        AND tc.table_name = %s
        ORDER BY kcu.ordinal_position;
    """, (schema, table))
    return cursor.fetchall()

def get_indexes(cursor, schema, table):
    """Get index information for a table"""
    query = sql.SQL("""
        SELECT
            i.relname AS index_name,
            a.attname AS column_name,
            ix.indisunique AS is_unique,
            ix.indisprimary AS is_primary
        FROM
            pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE
            t.relkind = 'r'
            AND n.nspname = %s
            AND t.relname = %s
        ORDER BY
            i.relname, a.attnum;
    """)
    cursor.execute(query, (schema, table))
    return cursor.fetchall()

def is_relevant_table(table_name):
    """Check if the table is related to certificates, patients, or documents"""
    relevant_keywords = ['certificate', 'patient', 'document', 'med', 'health', 
                         'user', 'profile', 'auth', 'org', 'organization']
    
    # These are our core tables of interest
    priority_tables = ['certificates', 'patients', 'documents', 'organizations', 'users']
    
    lower_table = table_name.lower()
    
    # First check if it's a priority table
    if lower_table in priority_tables:
        return True, 1  # Priority 1 (highest)
    
    # Then check for keyword matches
    for keyword in relevant_keywords:
        if keyword in lower_table:
            return True, 2  # Priority 2
            
    return False, 0  # Not relevant

def print_table_details(cursor, schema, table):
    """Print detailed information about a table"""
    print(f"\n{'-'*80}")
    print(f"TABLE: {schema}.{table}")
    print(f"{'-'*80}")
    
    # Print columns
    columns = get_table_columns(cursor, schema, table)
    print("\nCOLUMNS:")
    for col in columns:
        name, data_type, max_length, default, nullable = col
        type_info = data_type
        if max_length:
            type_info += f"({max_length})"
        default_info = f" DEFAULT {default}" if default else ""
        null_info = "NULL" if nullable == "YES" else "NOT NULL"
        print(f"  {name}: {type_info} {null_info}{default_info}")
    
    # Print primary keys
    primary_keys = get_primary_keys(cursor, schema, table)
    if primary_keys:
        print("\nPRIMARY KEY:")
        for pk in primary_keys:
            constraint_name, column_name = pk
            print(f"  {constraint_name} ({column_name})")
    
    # Print foreign keys
    foreign_keys = get_foreign_keys(cursor, schema, table)
    if foreign_keys:
        print("\nFOREIGN KEYS:")
        for fk in foreign_keys:
            constraint_name, column_name, foreign_schema, foreign_table, foreign_column = fk
            print(f"  {constraint_name}: {column_name} -> {foreign_schema}.{foreign_table}.{foreign_column}")
    
    # Print indexes
    indexes = get_indexes(cursor, schema, table)
    if indexes:
        print("\nINDEXES:")
        current_index = None
        index_columns = []
        for idx in indexes:
            index_name, column_name, is_unique, is_primary = idx
            if current_index != index_name:
                if current_index:
                    type_str = "PRIMARY KEY" if is_primary else "UNIQUE" if is_unique else "INDEX"
                    print(f"  {current_index} ({', '.join(index_columns)}) - {type_str}")
                current_index = index_name
                index_columns = [column_name]
            else:
                index_columns.append(column_name)
        
        # Print the last index
        if current_index:
            type_str = "PRIMARY KEY" if indexes[-1][3] else "UNIQUE" if indexes[-1][2] else "INDEX"
            print(f"  {current_index} ({', '.join(index_columns)}) - {type_str}")

def get_table_rows_count(cursor, schema, table):
    """Get the number of rows in a table"""
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {schema}.{table}")
        return cursor.fetchone()[0]
    except Exception as e:
        return f"Error counting rows: {e}"

def get_table_sample_data(cursor, schema, table, limit=5):
    """Get sample data from a table"""
    try:
        cursor.execute(f"SELECT * FROM {schema}.{table} LIMIT {limit}")
        return cursor.fetchall()
    except Exception as e:
        return f"Error fetching sample data: {e}"

def analyze_relationships(cursor, schemas_data):
    """Analyze and print relationships between certificates, patients, and documents"""
    print("\n" + "="*80)
    print("DATABASE RELATIONSHIP ANALYSIS")
    print("="*80)
    
    # Extract certificate, patient, and document tables
    certificate_tables = []
    patient_tables = []
    document_tables = []
    organization_tables = []
    user_tables = []
    
    for schema, tables in schemas_data.items():
        for table, is_relevant, priority in tables:
            if is_relevant:
                lower_table = table.lower()
                if 'certificate' in lower_table:
                    certificate_tables.append((schema, table))
                if 'patient' in lower_table:
                    patient_tables.append((schema, table))
                if 'document' in lower_table:
                    document_tables.append((schema, table))
                if 'organization' in lower_table:
                    organization_tables.append((schema, table))
                if 'user' in lower_table and schema == 'auth':
                    user_tables.append((schema, table))
    
    # Print relationships
    print("\nKEY RELATIONSHIPS IN THE DATABASE:")
    print("----------------------------------")
    
    # Certificates and Patients relationship
    if certificate_tables and patient_tables:
        print("\n1. Certificates to Patients Relationship:")
        for c_schema, c_table in certificate_tables:
            cursor.execute("""
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = %s
                AND tc.table_name = %s
                AND (ccu.table_name LIKE '%patient%' OR kcu.column_name LIKE '%patient%')
                ORDER BY kcu.ordinal_position;
            """, (c_schema, c_table))
            fks = cursor.fetchall()
            
            if fks:
                for fk in fks:
                    constraint_name, column_name, foreign_schema, foreign_table, foreign_column = fk
                    print(f"  * {c_schema}.{c_table}.{column_name} -> {foreign_schema}.{foreign_table}.{foreign_column}")
            else:
                print(f"  * No direct relationship found between {c_schema}.{c_table} and patient tables")
    
    # Certificates and Documents relationship
    if certificate_tables and document_tables:
        print("\n2. Certificates to Documents Relationship:")
        for c_schema, c_table in certificate_tables:
            cursor.execute("""
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = %s
                AND tc.table_name = %s
                AND (ccu.table_name LIKE '%document%' OR kcu.column_name LIKE '%document%')
                ORDER BY kcu.ordinal_position;
            """, (c_schema, c_table))
            fks = cursor.fetchall()
            
            if fks:
                for fk in fks:
                    constraint_name, column_name, foreign_schema, foreign_table, foreign_column = fk
                    print(f"  * {c_schema}.{c_table}.{column_name} -> {foreign_schema}.{foreign_table}.{foreign_column}")
            else:
                print(f"  * No direct relationship found between {c_schema}.{c_table} and document tables")
    
    # Organizations and Patients relationship
    if organization_tables and patient_tables:
        print("\n3. Organizations to Patients Relationship:")
        for o_schema, o_table in organization_tables:
            for p_schema, p_table in patient_tables:
                cursor.execute("""
                    SELECT 
                        tc.constraint_name,
                        kcu.column_name,
                        ccu.table_schema AS foreign_table_schema,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.table_schema = %s
                    AND tc.table_name = %s
                    AND ccu.table_schema = %s
                    AND ccu.table_name = %s
                    ORDER BY kcu.ordinal_position;
                """, (p_schema, p_table, o_schema, o_table))
                fks = cursor.fetchall()
                
                if fks:
                    for fk in fks:
                        constraint_name, column_name, foreign_schema, foreign_table, foreign_column = fk
                        print(f"  * {p_schema}.{p_table}.{column_name} -> {foreign_schema}.{foreign_table}.{foreign_column}")
    
    # Organizations and Users relationship
    if organization_tables and user_tables:
        print("\n4. Organizations to Users Relationship:")
        cursor.execute("""
            SELECT 
                tc.table_schema AS schema_name,
                tc.table_name AS table_name,
                kcu.column_name,
                ccu.table_schema AS foreign_schema,
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND (
                (tc.table_name LIKE '%organization%' AND kcu.column_name LIKE '%user%')
                OR 
                (tc.table_name LIKE '%user%' AND kcu.column_name LIKE '%organization%')
                OR
                (ccu.table_name LIKE '%organization%' AND tc.table_name LIKE '%user%')
                OR
                (ccu.table_name LIKE '%user%' AND tc.table_name LIKE '%organization%')
            );
        """)
        fks = cursor.fetchall()
        
        if fks:
            for fk in fks:
                schema, table, column, foreign_schema, foreign_table, foreign_column = fk
                print(f"  * {schema}.{table}.{column} -> {foreign_schema}.{foreign_table}.{foreign_column}")
        else:
            print("  * No direct relationship found between organizations and users")
            
            # Additional check for organization_users table
            cursor.execute("""
                SELECT table_schema, table_name, column_name
                FROM information_schema.columns
                WHERE table_name = 'organization_users'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            if columns:
                print("    However, found organization_users junction table with columns:")
                for schema, table, column in columns:
                    print(f"    - {schema}.{table}.{column}")

def main():
    """Main function to inspect the database schema"""
    conn = connect_to_db()
    cursor = conn.cursor()
    
    schemas = get_schemas(cursor)
    print(f"Found {len(schemas)} schemas: {', '.join([s[0] for s in schemas])}\n")
    
    # Store schema data for relationship analysis
    schemas_data = {}
    
    for schema_row in schemas:
        schema = schema_row[0]
        tables = get_tables(cursor, schema)
        
        if not tables:
            continue
            
        print(f"\n== SCHEMA: {schema} ({len(tables)} tables) ==")
        
        # Group tables by relevance
        priority_tables = []
        other_tables = []
        
        # Store tables for this schema
        schemas_data[schema] = []
        
        for table_row in tables:
            table = table_row[0]
            is_relevant, priority = is_relevant_table(table)
            
            # Store for relationship analysis
            schemas_data[schema].append((table, is_relevant, priority))
            
            if is_relevant:
                priority_tables.append((table, priority))
            else:
                other_tables.append(table)
        
        # Sort priority tables by priority
        priority_tables.sort(key=lambda x: x[1])
        relevant_tables = [t[0] for t in priority_tables]
        
        # Print details for relevant tables first
        if relevant_tables:
            print(f"\nRELEVANT TABLES: {', '.join(relevant_tables)}")
            for table, _ in priority_tables:
                print_table_details(cursor, schema, table)
                
                # Count rows if it's a main table we're interested in
                if table.lower() in ['certificates', 'patients', 'documents', 'organizations']:
                    row_count = get_table_rows_count(cursor, schema, table)
                    print(f"\nROW COUNT: {row_count}")
        
        # Just list other tables without details
        if other_tables:
            print(f"\nOTHER TABLES: {', '.join(other_tables)}")
    
    # Analyze relationships between key tables
    analyze_relationships(cursor, schemas_data)
    
    cursor.close()
    conn.close()
    print("\nDatabase inspection complete")

if __name__ == "__main__":
    main()