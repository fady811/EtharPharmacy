from django.core.management.base import BaseCommand
from django.db import transaction
from apps.products.models import Product, Category
import openpyxl


class Command(BaseCommand):
    help = 'Import products from an Excel file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to the Excel file to import',
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        if not file_path:
            self.stdout.write(self.style.ERROR('Please provide a file path using --file argument'))
            return

        try:
            workbook = openpyxl.load_workbook(file_path)
            sheet = workbook.active
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading Excel file: {e}'))
            return

        created_count = 0
        updated_count = 0
        skipped_count = 0
        categories_created = 0
        row_count = 0

        with transaction.atomic():
            # Start from row 3 (index 2) - row 1 is title, row 2 is headers
            for row_idx, row in enumerate(sheet.iter_rows(min_row=3), start=3):
                row_count += 1

                # Column B (index 1): name
                name = row[1].value
                if not name or str(name).strip() == '':
                    skipped_count += 1
                    continue

                # Column C (index 2): price
                price = row[2].value
                if price is None or price == '' or float(price) <= 0:
                    skipped_count += 1
                    continue

                # Column 10 (index 9): category name (التصنيف)
                category_name = row[9].value
                if not category_name or str(category_name).strip() == '':
                    skipped_count += 1
                    continue

                # Column I (index 8): stock quantity
                stock_quantity = row[8].value
                try:
                    stock_quantity = int(stock_quantity) if stock_quantity is not None else 0
                    if stock_quantity < 0:
                        stock_quantity = 0
                except (ValueError, TypeError):
                    stock_quantity = 0

                # Get or create category
                category_name = str(category_name).strip()
                category, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'parent': None}
                )
                if created:
                    categories_created += 1

                # Update or create product
                product, created = Product.objects.update_or_create(
                    name=str(name).strip(),
                    defaults={
                        'description': '',
                        'price': float(price),
                        'sale_price': None,
                        'stock_quantity': stock_quantity,
                        'category': category,
                        'subcategory': None,
                        'featured': False,
                    }
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

                # Print progress every 100 rows
                if row_count % 100 == 0:
                    self.stdout.write(f'Processed {row_count} rows...')

        # Print final summary
        self.stdout.write(self.style.SUCCESS('\nImport Summary:'))
        self.stdout.write(f'Created: {created_count} products')
        self.stdout.write(f'Updated: {updated_count} products')
        self.stdout.write(f'Skipped: {skipped_count} rows')
        self.stdout.write(f'Categories created: {categories_created}')
