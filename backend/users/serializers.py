from django.db import IntegrityError, transaction
from rest_framework import serializers

from .models import Branch, Program, School, StudentProfile, User


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "school_name", "school_code"]


class ProgramSerializer(serializers.ModelSerializer):
    school_code = serializers.CharField(source="school.school_code", read_only=True)

    class Meta:
        model = Program
        fields = ["id", "school", "school_code", "program_name", "program_code"]


class BranchSerializer(serializers.ModelSerializer):
    program_code = serializers.CharField(source="program.program_code", read_only=True)

    class Meta:
        model = Branch
        fields = ["id", "program", "program_code", "branch_name", "branch_code"]


class UserPublicSerializer(serializers.ModelSerializer):
    school = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    school_id = serializers.SerializerMethodField()
    is_super_admin = serializers.BooleanField(read_only=True)
    program = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    last_badge = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "college_id",
            "roll_number",
            "email",
            "role",
            "school",
            "school_id",
            "school_name",
            "is_super_admin",
            "program",
            "program_name",
            "branch",
            "branch_name",
            "year",
            "last_badge",
            "created_at",
        ]

    def get_profile(self, obj):
        return getattr(obj, "student_profile", None)

    def get_school_id(self, obj):
        if obj.role == User.Role.ADMIN:
            return obj.school.id if obj.school else None
        profile = self.get_profile(obj)
        return profile.school.id if profile else None

    def get_school(self, obj):
        if obj.role == User.Role.ADMIN:
            return obj.school.school_code if obj.school else None
        profile = self.get_profile(obj)
        return profile.school.school_code if profile else None

    def get_school_name(self, obj):
        if obj.role == User.Role.ADMIN:
            return obj.school.school_name if obj.school else None
        profile = self.get_profile(obj)
        return profile.school.school_name if profile else None

    def get_program(self, obj):
        profile = self.get_profile(obj)
        return profile.program.program_code if profile else None

    def get_program_name(self, obj):
        profile = self.get_profile(obj)
        return profile.program.program_name if profile else None

    def get_branch(self, obj):
        profile = self.get_profile(obj)
        return profile.branch.branch_code if profile else None

    def get_branch_name(self, obj):
        profile = self.get_profile(obj)
        return profile.branch.branch_name if profile else None

    def get_year(self, obj):
        profile = self.get_profile(obj)
        return profile.year if profile else None

    def get_last_badge(self, obj):
        profile = self.get_profile(obj)
        return profile.last_badge if profile else None


StudentPublicSerializer = UserPublicSerializer


class AdminStudentCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    roll_number = serializers.CharField(max_length=40)
    college_id = serializers.CharField(max_length=40, required=False)
    email = serializers.EmailField()
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all())
    program = serializers.PrimaryKeyRelatedField(queryset=Program.objects.select_related("school").all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.select_related("program").all())
    year = serializers.ChoiceField(choices=StudentProfile.Year.choices)

    @staticmethod
    def _generate_password():
        """Generate a random 10-character password for new students."""
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(10))

    def validate(self, attrs):
        attrs["full_name"] = attrs["full_name"].strip()
        attrs["roll_number"] = attrs["roll_number"].strip().upper()
        
        # Populate college_id from roll_number if not provided
        attrs["college_id"] = attrs.get("college_id", attrs["roll_number"]).strip().upper()
        if not attrs["college_id"]:
            attrs["college_id"] = attrs["roll_number"]
            
        attrs["email"] = attrs["email"].strip().lower()

        if not attrs["full_name"]:
            raise serializers.ValidationError({"full_name": "Full name is required."})
        if not attrs["roll_number"]:
            raise serializers.ValidationError({"roll_number": "Roll number is required."})

        if attrs["program"].school_id != attrs["school"].id:
            raise serializers.ValidationError({"program": "Program does not belong to the selected school."})
        if attrs["branch"].program_id != attrs["program"].id:
            raise serializers.ValidationError({"branch": "Branch does not belong to the selected program."})

        if User.objects.filter(roll_number__iexact=attrs["roll_number"]).exists():
            raise serializers.ValidationError({"roll_number": "A user with this roll number already exists."})
        if User.objects.filter(college_id__iexact=attrs["college_id"]).exists():
            raise serializers.ValidationError({"college_id": "A user with this college ID already exists."})
        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return attrs

    def create(self, validated_data):
        school = validated_data.pop("school")
        program = validated_data.pop("program")
        branch = validated_data.pop("branch")
        year = validated_data.pop("year")

        try:
            with transaction.atomic():
                password = self._generate_password()
                user = User.objects.create_user(
                    password=password,
                    role=User.Role.STUDENT,
                    **validated_data,
                )
                StudentProfile.objects.create(
                    user=user,
                    school=school,
                    program=program,
                    branch=branch,
                    year=year,
                )
        except IntegrityError as exc:
            raise serializers.ValidationError(
                {"detail": "A user with this college ID, roll number, or email already exists."}
            ) from exc

        return user


class AdminStudentUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    roll_number = serializers.CharField(max_length=40)
    college_id = serializers.CharField(max_length=40, required=False)
    email = serializers.EmailField()
    school = serializers.PrimaryKeyRelatedField(queryset=School.objects.all())
    program = serializers.PrimaryKeyRelatedField(queryset=Program.objects.select_related("school").all())
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.select_related("program").all())
    year = serializers.ChoiceField(choices=StudentProfile.Year.choices)
    is_active = serializers.BooleanField(default=True)

    def validate(self, attrs):
        attrs["full_name"] = attrs["full_name"].strip()
        attrs["roll_number"] = attrs["roll_number"].strip().upper()
        
        # Populate college_id from roll_number if not provided
        attrs["college_id"] = attrs.get("college_id", attrs["roll_number"]).strip().upper()
        if not attrs["college_id"]:
            attrs["college_id"] = attrs["roll_number"]
            
        attrs["email"] = attrs["email"].strip().lower()

        if not attrs["full_name"]:
            raise serializers.ValidationError({"full_name": "Full name is required."})
        if not attrs["roll_number"]:
            raise serializers.ValidationError({"roll_number": "Roll number is required."})

        if attrs["program"].school_id != attrs["school"].id:
            raise serializers.ValidationError({"program": "Program does not belong to the selected school."})
        if attrs["branch"].program_id != attrs["program"].id:
            raise serializers.ValidationError({"branch": "Branch does not belong to the selected program."})

        user = self.instance
        if User.objects.exclude(id=user.id).filter(roll_number__iexact=attrs["roll_number"]).exists():
            raise serializers.ValidationError({"roll_number": "A user with this roll number already exists."})
        if User.objects.exclude(id=user.id).filter(college_id__iexact=attrs["college_id"]).exists():
            raise serializers.ValidationError({"college_id": "A user with this college ID already exists."})
        if User.objects.exclude(id=user.id).filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        return attrs

    def update(self, instance, validated_data):
        school = validated_data.pop("school")
        program = validated_data.pop("program")
        branch = validated_data.pop("branch")
        year = validated_data.pop("year")

        with transaction.atomic():
            instance.full_name = validated_data.get("full_name", instance.full_name)
            instance.roll_number = validated_data.get("roll_number", instance.roll_number)
            instance.college_id = validated_data.get("college_id", instance.college_id)
            instance.email = validated_data.get("email", instance.email)
            instance.is_active = validated_data.get("is_active", instance.is_active)
            instance.save()

            profile = getattr(instance, "student_profile", None)
            if not profile:
                StudentProfile.objects.create(
                    user=instance,
                    school=school,
                    program=program,
                    branch=branch,
                    year=year
                )
            else:
                profile.school = school
                profile.program = program
                profile.branch = branch
                profile.year = year
                profile.save()

        return instance


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=120, required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = (attrs.get("identifier") or attrs.get("email") or "").strip()
        password = attrs["password"]

        if not identifier:
            raise serializers.ValidationError({"email": "Email is required."})

        user = (
            User.objects.filter(college_id__iexact=identifier).first()
            or User.objects.filter(email__iexact=identifier.lower()).first()
            or User.objects.filter(roll_number__iexact=identifier).first()
        )

        if user is None or not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is inactive."})

        attrs["user"] = user
        return attrs
