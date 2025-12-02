from django.contrib.auth import get_user_model
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    role = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = get_user_model()
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "password",
            "role",
        ]
        read_only_fields = ["id", "is_staff"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.pop("role", "")
        user = self.Meta.model(**validated_data)
        user.set_password(password)
        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
        user.save()
        return user
