import os
import subprocess
import sys
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Create a complete SQL dump of the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            help='Output file path (default: auto-generated with timestamp)',
        )
        parser.add_argument(
            '--database',
            type=str,
            default='default',
            help='Database alias to dump (default: default)',
        )

    def handle(self, *args, **options):
        database_alias = options['database']
        
        # Get database configuration
        try:
            db_config = settings.DATABASES[database_alias]
        except KeyError:
            raise CommandError(f'Database "{database_alias}" not found in settings')

        # Generate output filename if not provided
        if options['output']:
            output_file = options['output']
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            db_name = db_config['NAME'].split('/')[-1] if db_config['NAME'] else 'database'
            output_file = f"sql_dump_{db_name}_{timestamp}.sql"

        self.stdout.write(f"Creating SQL dump for database: {db_config['NAME']}")
        self.stdout.write(f"Database engine: {db_config['ENGINE']}")
        self.stdout.write(f"Output file: {output_file}")

        # Create dump based on database engine
        engine = db_config['ENGINE'].lower()
        
        try:
            if 'postgresql' in engine:
                self._dump_postgresql(db_config, output_file)
            elif 'mysql' in engine:
                self._dump_mysql(db_config, output_file)
            elif 'sqlite' in engine:
                self._dump_sqlite(db_config, output_file)
            else:
                raise CommandError(f"Unsupported database engine: {db_config['ENGINE']}")
            
            # Show file size
            file_size = os.path.getsize(output_file) / 1024 / 1024
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created SQL dump: {output_file} ({file_size:.2f} MB)'
                )
            )
            
        except Exception as e:
            raise CommandError(f'Error creating SQL dump: {str(e)}')

    def _dump_postgresql(self, db_config, output_file):
        """Create SQL dump for PostgreSQL"""
        cmd = ['pg_dump']
        
        if db_config.get('USER'):
            cmd.extend(['-U', db_config['USER']])
        if db_config.get('HOST'):
            cmd.extend(['-h', db_config['HOST']])
        if db_config.get('PORT'):
            cmd.extend(['-p', str(db_config['PORT'])])
        
        cmd.extend(['-f', output_file, '--no-password', db_config['NAME']])
        
        # Set password as environment variable if provided
        env = os.environ.copy()
        if db_config.get('PASSWORD'):
            env['PGPASSWORD'] = db_config['PASSWORD']
        
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if result.returncode != 0:
            raise CommandError(f'pg_dump failed: {result.stderr}')

    def _dump_mysql(self, db_config, output_file):
        """Create SQL dump for MySQL"""
        cmd = ['mysqldump']
        
        if db_config.get('USER'):
            cmd.extend(['-u', db_config['USER']])
        if db_config.get('PASSWORD'):
            cmd.append(f'-p{db_config["PASSWORD"]}')
        if db_config.get('HOST'):
            cmd.extend(['-h', db_config['HOST']])
        if db_config.get('PORT'):
            cmd.extend(['-P', str(db_config['PORT'])])
        
        cmd.extend(['--single-transaction', '--routines', '--triggers'])
        cmd.append(db_config['NAME'])
        
        with open(output_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            raise CommandError(f'mysqldump failed: {result.stderr}')

    def _dump_sqlite(self, db_config, output_file):
        """Create SQL dump for SQLite"""
        cmd = ['sqlite3', db_config['NAME'], '.dump']
        
        with open(output_file, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            raise CommandError(f'sqlite3 dump failed: {result.stderr}')