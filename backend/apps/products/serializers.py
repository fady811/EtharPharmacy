from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist
from .models import Category, Product, ProductImage
from .utils.query_helpers import get_category_tree

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with hierarchy support.
    
    Fields:
        - id: Unique identifier
        - name: Category name
        - parent: Parent category ID
        - children: List of child categories (nested)
        - product_count: Number of products in category
    """
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    depth = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'children', 'product_count', 'depth']
        read_only_fields = ['id']

    def get_children(self, obj):
        """
        Get serialized child categories.
        
        Args:
            obj: Category instance
            
        Returns:
            list: Serialized child categories
        """
        children = obj.children.all()
        return CategorySerializer(children, many=True).data

    def get_product_count(self, obj):
        """
        Get total product count including subcategories.
        
        Args:
            obj: Category instance
            
        Returns:
            int: Total product count
        """
        category_ids = get_category_tree(obj)
        return Product.objects.filter(category_id__in=category_ids).count()
    
    def get_depth(self, obj):
        """
        Get category depth in hierarchy.
        
        Args:
            obj: Category instance
            
        Returns:
            int: Depth level
        """
        depth = 0
        parent = obj.parent
        while parent:
            depth += 1
            parent = parent.parent
        return depth
    
    def validate_name(self, value):
        """
        Validate category name.
        
        Args:
            value: Category name
            
        Returns:
            str: Validated name
            
        Raises:
            ValidationError: If name is invalid
        """
        if not value or not value.strip():
            raise ValidationError("Category name cannot be empty.")
        
        if len(value.strip()) < 2:
            raise ValidationError("Category name must be at least 2 characters long.")
        
        if len(value.strip()) > 100:
            raise ValidationError("Category name cannot exceed 100 characters.")
        
        return value.strip()
    
    def validate_parent(self, value):
        """
        Validate parent category to prevent circular references.
        
        Args:
            value: Parent category instance
            
        Returns:
            Category: Validated parent category
            
        Raises:
            ValidationError: If circular reference detected
        """
        if not value:
            return None
        
        # Check for circular reference
        if self.instance and self.instance.id == value.id:
            raise ValidationError("A category cannot be its own parent.")
        
        # Check if parent is already a descendant
        if self.instance:
            category_ids = get_category_tree(self.instance)
            if value.id in category_ids:
                raise ValidationError("Circular reference detected: parent is already a descendant.")
        
        return value

class ProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductImage model.
    
    Fields:
        - id: Unique identifier
        - image: Image file
        - image_url: Full URL to image
        - order: Display order
    """
    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'thumbnail_url', 'order']
        read_only_fields = ['id']

    def get_image_url(self, obj):
        """
        Get full URL for image.
        
        Args:
            obj: ProductImage instance
            
        Returns:
            str: Full image URL or None
        """
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_thumbnail_url(self, obj):
        """
        Get thumbnail URL (same as image_url for now).
        
        Args:
            obj: ProductImage instance
            
        Returns:
            str: Thumbnail URL or None
        """
        return self.get_image_url(obj)
    
    def validate_order(self, value):
        """
        Validate image order.
        
        Args:
            value: Order value
            
        Returns:
            int: Validated order
            
        Raises:
            ValidationError: If order is invalid
        """
        if value is None:
            return 0
        
        if value < 0:
            raise ValidationError("Order cannot be negative.")
        
        return value

class ProductSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for Product model with all related data.
    
    Fields:
        - id: Unique identifier
        - name: Product name
        - description: Product description
        - price: Regular price
        - sale_price: Sale price (optional)
        - final_price: Current price (sale or regular)
        - stock_quantity: Available stock
        - category: Category details
        - subcategory: Subcategory details
        - featured: Featured flag
        - images: Product images
        - is_on_sale: Boolean indicating if on sale
        - has_stock: Boolean indicating if in stock
        - created_at: Creation timestamp
        - updated_at: Last update timestamp
    """
    stock_quantity = serializers.IntegerField(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    subcategory = CategorySerializer(read_only=True)
    final_price = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    has_stock = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'sale_price', 'final_price',
            'stock_quantity', 'category', 'subcategory', 'featured', 'images',
            'is_on_sale', 'has_stock', 'discount_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_final_price(self, obj):
        """
        Get final price (sale price if available, otherwise regular price).
        
        Args:
            obj: Product instance
            
        Returns:
            Decimal: Final price
        """
        if obj.sale_price:
            return obj.sale_price
        return obj.price

    def get_is_on_sale(self, obj):
        """
        Check if product is on sale.
        
        Args:
            obj: Product instance
            
        Returns:
            bool: True if on sale
        """
        return obj.sale_price is not None

    def get_has_stock(self, obj):
        """
        Check if product is in stock.
        
        Args:
            obj: Product instance
            
        Returns:
            bool: True if stock_quantity > 0
        """
        return obj.stock_quantity > 0

    def get_discount_percentage(self, obj):
        """
        Calculate discount percentage if on sale.
        
        Args:
            obj: Product instance
            
        Returns:
            float: Discount percentage or 0
        """
        if obj.sale_price and obj.price > 0:
            price = float(obj.price)
            sale_price = float(obj.sale_price)
            discount = ((price - sale_price) / price) * 100
            return round(discount, 2)
        return 0

    

class ProductListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for product list views.
    
    Optimized for list endpoints with minimal data.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    final_price = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    has_stock = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'sale_price', 'final_price',
            'stock_quantity', 'category_name', 'featured', 'is_on_sale',
            'has_stock', 'primary_image', 'discount_percentage', 'created_at'
        ]


    def get_final_price(self, obj):
        if obj.sale_price:
            return obj.sale_price
        return obj.price

    def get_is_on_sale(self, obj):
        return obj.sale_price is not None

    def get_has_stock(self, obj):
        return obj.stock_quantity > 0

    def get_primary_image(self, obj):
        """
        Get primary image URL (first image by order).
        
        Args:
            obj: Product instance
            
        Returns:
            str: Primary image URL or None
        """
        first_image = obj.images.order_by('order').first()
        if first_image and first_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None

    def get_discount_percentage(self, obj):
        """
        Calculate discount percentage if on sale.
        
        Args:
            obj: Product instance
            
        Returns:
            float: Discount percentage or 0
        """
        if obj.sale_price and obj.price > 0:
            # Convert to float for calculation
            price = float(obj.price)
            sale_price = float(obj.sale_price)
            discount = ((price - sale_price) / price) * 100
            return round(discount, 2)
        return 0
