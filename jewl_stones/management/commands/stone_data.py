from django.core.management.base import BaseCommand
from jewl_stones.models import Stone, StoneType, StoneTypeDetail

class Command(BaseCommand):
    help = 'Populate Stone, StoneType, and StoneTypeDetail tables with sample data'

    def handle(self, *args, **kwargs):
        # Create some stones
        stones_data = ['Ruby', 'Sapphire', 'Emerald']
        stones = []
        for name in stones_data:
            stone, created = Stone.objects.get_or_create(name=name)
            stones.append(stone)

        # Create stone types
        stone_types_data = [
            {'type_name': 'Precious', 'stone': stones[0]},
            {'type_name': 'Semi-Precious', 'stone': stones[1]},
            {'type_name': 'Rare', 'stone': stones[2]}
        ]
        stone_types = []
        for data in stone_types_data:
            stone_type, created = StoneType.objects.get_or_create(
                type_name=data['type_name'],
                stone=data['stone']
            )
            stone_types.append(stone_type)

        # Create stone type details
        details_data = [
            {'shape': 'Round', 'size': '5mm', 'weight': 1.2, 'rate': 5000, 'stone': stones[0], 'stone_type': stone_types[0]},
            {'shape': 'Oval', 'size': '6mm', 'weight': 2.0, 'rate': 7000, 'stone': stones[1], 'stone_type': stone_types[1]},
            {'shape': 'Square', 'size': '4mm', 'weight': 0.8, 'rate': 9000, 'stone': stones[2], 'stone_type': stone_types[2]}
        ]
        for data in details_data:
            StoneTypeDetail.objects.get_or_create(
                shape=data['shape'],
                size=data['size'],
                weight=data['weight'],
                rate=data['rate'],
                stone=data['stone'],
                stone_type=data['stone_type']
            )

        self.stdout.write(self.style.SUCCESS('Data successfully populated!'))
