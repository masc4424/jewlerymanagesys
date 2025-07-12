from django.core.management.base import BaseCommand
from django.db.models import Q
from product_inv.models import *
from jewl_stones.models import *

class Command(BaseCommand):
    help = 'Populate missing StoneCount entries for existing RawStones'

    def handle(self, *args, **kwargs):
        total_created = 0
        models = Model.objects.all()

        for model in models:
            raw_stones = RawStones.objects.filter(model=model)

            for raw in raw_stones:
                stone_type = raw.stone_type

                # Get all StoneTypeDetail entries for this type
                details = StoneTypeDetail.objects.filter(
                    stone_type=stone_type
                )

                for detail in details:
                    # Check if StoneCount already exists
                    exists = StoneCount.objects.filter(
                        model=model,
                        stone_type_details=detail
                    ).exists()

                    if not exists:
                        # Create a new StoneCount entry
                        StoneCount.objects.create(
                            model=model,
                            stone_type_details=detail,
                            count=1  # You can replace 1 with actual logic if needed
                        )
                        total_created += 1
                        self.stdout.write(f"✅ Created StoneCount for model {model.model_no}, detail {detail.id}")

        self.stdout.write(self.style.SUCCESS(f"\n🎉 Completed: {total_created} StoneCount entries created."))
