from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CouponApplySerializer

class CouponApplyView(APIView):
    permission_classes = []  # Allow any (guest checkout)

    def post(self, request):
        serializer = CouponApplySerializer(data=request.data)
        if serializer.is_valid():
            coupon = serializer.validated_data['coupon']
            return Response({
                'valid': True,
                'discount_amount': float(coupon.discount_amount)
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)