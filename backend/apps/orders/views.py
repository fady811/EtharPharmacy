from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAdminUser
from .models import Order, OrderIdempotencyKey
from .serializers import OrderSerializer
from apps.products.models import Product

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = []  # Allow any (guest checkout)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if this is a duplicate request
        idempotency_key = serializer.validated_data.get('idempotency_key')
        if idempotency_key:
            try:
                existing_key = OrderIdempotencyKey.objects.get(key=idempotency_key)
                # Return existing order with 409 status
                return Response(
                    OrderSerializer(existing_key.order).data,
                    status=status.HTTP_409_CONFLICT
                )
            except OrderIdempotencyKey.DoesNotExist:
                pass
        
        try:
            # Create new order
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            # Handle structured stock validation errors
            if hasattr(e, 'detail') and 'errors' in e.detail:
                return Response(
                    e.detail,
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY
                )
            # Re-raise other validation errors
            raise

class OrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUser]  # Admin only

class OrderStatusUpdateView(generics.UpdateAPIView):
    queryset = Order.objects.all()
    permission_classes = [IsAdminUser]
    serializer_class = OrderSerializer  # Use same serializer but only update status

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)