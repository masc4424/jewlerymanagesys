from django.core.management.base import BaseCommand
import pandas as pd
import os
from decimal import Decimal
import re
from jewl_stones.models import Stone, StoneType, StoneTypeDetail

class Command(BaseCommand):
    help = 'Import stone data from Excel file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default='stone_details.xlsx',
                          help='Path to the Excel file')
        parser.add_argument('--no-delete', action='store_true',
                          help='Skip deleting existing data')

    def handle(self, *args, **options):
        file_path = options['file']
        skip_delete = options['no_delete']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        # Delete existing data unless the --no-delete flag is used
        if not skip_delete:
            self.delete_existing_data()
        
        self.stdout.write(self.style.SUCCESS(f'Reading file: {file_path}'))
        
        # Read the Excel file
        df = pd.read_excel(file_path)
        
        # Clean column names
        df.columns = [col.strip().lower() for col in df.columns]
        
        # Check if expected columns exist
        required_columns = ['stone name', 'stone type', 'size', 'weight', 'rate']
        for col in required_columns:
            if col not in df.columns:
                self.stdout.write(self.style.ERROR(f"Required column '{col}' not found in file"))
                return
        
        # Process the data
        current_stone = None
        current_stone_name = None
        current_stone_type = None
        current_stone_type_name = None
        
        # Track processed data to avoid duplicates
        processed_stones = {}
        processed_stone_types = {}
        
        for _, row in df.iterrows():
            stone_name = str(row['stone name']).strip()
            stone_type_name = str(row['stone type']).strip()
            size = str(row['size']).strip() if pd.notna(row['size']) else ''
            
            # Ensure we preserve the exact decimal values for weight and rate
            weight = Decimal(str(row['weight'])) if pd.notna(row['weight']) else Decimal('0.00')
            rate = Decimal(str(row['rate'])) if pd.notna(row['rate']) else Decimal('0.00')
            
            # Skip rows with no meaningful data
            if not stone_name and not stone_type_name and not size and weight == Decimal('0.00') and rate == Decimal('0.00'):
                continue
            
            # Process stone - Note: we're checking lowercase to avoid case-sensitive duplicates
            if stone_name and stone_name.lower() != 'nan':
                # Use a consistent case for stone name lookup to avoid duplicates
                stone_name_key = stone_name.upper()
                
                if stone_name_key not in processed_stones:
                    # Create a new stone
                    current_stone = Stone.objects.create(
                        name=stone_name,  # Keep original case when saving
                        is_active="ACTIVE"  # Set to ACTIVE as shown in your database
                    )
                    processed_stones[stone_name_key] = current_stone
                    self.stdout.write(f"Created stone: {stone_name}")
                else:
                    current_stone = processed_stones[stone_name_key]
                current_stone_name = stone_name
            
            # Process stone type
            if stone_type_name and stone_type_name.lower() != 'nan':
                if current_stone_name:
                    # Use a consistent case for stone type lookup to avoid duplicates
                    stone_type_key = f"{current_stone_name.upper()}:{stone_type_name.upper()}"
                    
                    if stone_type_key not in processed_stone_types:
                        current_stone_type = StoneType.objects.create(
                            type_name=stone_type_name,  # Keep original case when saving
                            stone=current_stone
                        )
                        processed_stone_types[stone_type_key] = current_stone_type
                        self.stdout.write(f"Created stone type: {stone_type_name} for stone: {current_stone_name}")
                    else:
                        current_stone_type = processed_stone_types[stone_type_key]
                    current_stone_type_name = stone_type_name
            
            # Process stone details
            if size or weight > Decimal('0') or rate > Decimal('0'):
                if current_stone and current_stone_type:
                    # Parse size to get length and breadth
                    length = 'N/A'
                    breadth = 'N/A'
                    
                    if size and size.lower() != 'nan':
                        # Check if size is in format like 3X4
                        if 'x' in size.lower() or 'X' in size:
                            try:
                                parts = re.split(r'[xX]', size)
                                length = parts[0].strip()
                                breadth = parts[1].strip()
                            except:
                                length = size
                                breadth = size
                        else:
                            # If size is a single number like 7.0
                            length = size
                            breadth = size
                    
                    # Create stone type detail with proper precision for decimal values
                    StoneTypeDetail.objects.create(
                        length=length,
                        breadth=breadth,
                        weight=weight,  # This will maintain the exact decimal value
                        rate=rate,      # This will maintain the exact decimal value
                        stone=current_stone,
                        stone_type=current_stone_type
                    )
                    detail_info = f"{size}, weight={weight}, rate={rate}"
                    self.stdout.write(f"Created stone detail: {detail_info} for {current_stone_type_name}")
        
        self.stdout.write(self.style.SUCCESS('Import completed successfully'))
    
    def delete_existing_data(self):
        """Delete all existing data from Stone, StoneType, and StoneTypeDetail tables"""
        # Delete in the correct order to respect foreign key constraints
        stone_detail_count = StoneTypeDetail.objects.count()
        stone_type_count = StoneType.objects.count()
        stone_count = Stone.objects.count()
        
        # Delete StoneTypeDetail records first (they reference StoneType and Stone)
        StoneTypeDetail.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Deleted {stone_detail_count} stone type details'))
        
        # Delete StoneType records next (they reference Stone)
        StoneType.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Deleted {stone_type_count} stone types'))
        
        # Delete Stone records last
        Stone.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'Deleted {stone_count} stones'))
        
        self.stdout.write(self.style.SUCCESS('All existing stone data deleted'))