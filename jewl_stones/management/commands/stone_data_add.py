from django.core.management.base import BaseCommand
from jewl_stones.models import Stone, StoneType, StoneTypeDetail

class Command(BaseCommand):
    help = 'Populate the Stone models with sample data'

    def handle(self, *args, **kwargs):
        # Adding Stones
        stone1, _ = Stone.objects.get_or_create(name='Diamond')
        stone2, _ = Stone.objects.get_or_create(name='Ruby')

        # Adding Stone Types
        stone_type1, _ = StoneType.objects.get_or_create(stone=stone1, type_name='Brilliant Cut')
        stone_type2, _ = StoneType.objects.get_or_create(stone=stone2, type_name='Cabochon')

        # Adding Stone Type Details
        StoneTypeDetail.objects.get_or_create(
            stone_type=stone_type1, stone=stone1, shape='Round', size='1 Carat', weight=1.0, rate=5000.00)
        StoneTypeDetail.objects.get_or_create(
            stone_type=stone_type2, stone=stone2, shape='Oval', size='2 Carat', weight=2.0, rate=3000.00)

        self.stdout.write(self.style.SUCCESS('Successfully added stone data!'))
